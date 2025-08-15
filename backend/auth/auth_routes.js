const express = require('express');
const router = express.Router();
const authService = require('./auth_service');
const { 
    requireAuth, 
    requireRole, 
    requireActiveAccount, 
    requireVerifiedEmail,
    addSecurityHeaders,
    logAuthenticatedRequest 
} = require('./auth_middleware');

// ========================================
// ROTAS PÚBLICAS (sem autenticação)
// ========================================

/**
 * @route   POST /api/auth/register
 * @desc    Registrar novo usuário
 * @access  Public
 */
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;
        
        // Validar dados obrigatórios
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username, email e senha são obrigatórios'
            });
        }
        
        // Validar formato do e-mail
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Formato de e-mail inválido'
            });
        }
        
        const result = await authService.registerUser({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password,
            firstName: firstName?.trim(),
            lastName: lastName?.trim()
        });
        
        if (result.success) {
            res.status(201).json(result);
        } else {
            res.status(400).json(result);
        }
        
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login do usuário
 * @access  Public
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username e senha são obrigatórios'
            });
        }
        
        const result = await authService.loginUser({
            username: username.trim(),
            password,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent')
        });
        
        if (result.success) {
            // Configurar cookie de autenticação (opcional)
            res.cookie('authToken', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000 // 24 horas
            });
            
            res.json(result);
        } else {
            res.status(401).json(result);
        }
        
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * @route   GET /api/auth/verify-email
 * @desc    Verificar e-mail com token
 * @access  Public
 */
router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;
        
        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token de verificação não fornecido'
            });
        }
        
        const result = await authService.verifyEmail(token);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
        
    } catch (error) {
        console.error('Erro na verificação de e-mail:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * @route   POST /api/auth/request-password-reset
 * @desc    Solicitar reset de senha
 * @access  Public
 */
router.post('/request-password-reset', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'E-mail é obrigatório'
            });
        }
        
        // Validar formato do e-mail
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Formato de e-mail inválido'
            });
        }
        
        const result = await authService.requestPasswordReset(email.trim().toLowerCase());
        
        res.json(result);
        
    } catch (error) {
        console.error('Erro ao solicitar reset de senha:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Resetar senha com token
 * @access  Public
 */
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Token e nova senha são obrigatórios'
            });
        }
        
        const result = await authService.resetPassword(token, newPassword);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
        
    } catch (error) {
        console.error('Erro ao resetar senha:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * @route   GET /api/auth/validate-token
 * @desc    Validar token JWT
 * @access  Public
 */
router.get('/validate-token', async (req, res) => {
    try {
        const { token } = req.query;
        
        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token não fornecido'
            });
        }
        
        const result = authService.verifyToken(token);
        
        if (result.valid) {
            res.json({
                success: true,
                valid: true,
                user: result.user
            });
        } else {
            res.json({
                success: true,
                valid: false,
                error: result.error
            });
        }
        
    } catch (error) {
        console.error('Erro ao validar token:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// ========================================
// ROTAS PROTEGIDAS (com autenticação)
// ========================================

/**
 * @route   POST /api/auth/logout
 * @desc    Logout do usuário
 * @access  Private
 */
router.post('/logout', requireAuth, async (req, res) => {
    try {
        const result = await authService.logoutUser(req.token);
        
        // Remover cookie de autenticação
        res.clearCookie('authToken');
        
        res.json(result);
        
    } catch (error) {
        console.error('Erro no logout:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * @route   GET /api/auth/profile
 * @desc    Obter perfil do usuário autenticado
 * @access  Private
 */
router.get('/profile', requireAuth, requireActiveAccount, async (req, res) => {
    try {
        res.json({
            success: true,
            user: {
                id: req.user.id,
                username: req.user.username,
                email: req.user.email,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                role: req.user.role,
                avatar: req.user.avatar,
                isEmailVerified: req.user.isEmailVerified
            }
        });
        
    } catch (error) {
        console.error('Erro ao obter perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Atualizar perfil do usuário
 * @access  Private
 */
router.put('/profile', requireAuth, requireActiveAccount, async (req, res) => {
    try {
        const { firstName, lastName, avatar } = req.body;
        
        // Atualizar apenas campos permitidos
        const updateData = {};
        if (firstName !== undefined) updateData.firstName = firstName.trim();
        if (lastName !== undefined) updateData.lastName = lastName.trim();
        if (avatar !== undefined) updateData.avatar = avatar;
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Nenhum campo para atualizar'
            });
        }
        
        // Atualizar no banco
        const sql = `
            UPDATE USERS 
            SET FIRST_NAME = ?, LAST_NAME = ?, AVATAR = ?
            WHERE ID = ?
        `;
        
        await require('../../database/firebird_connection').executeTransaction(sql, [
            updateData.firstName || req.user.firstName,
            updateData.lastName || req.user.lastName,
            updateData.avatar || req.user.avatar,
            req.user.id
        ]);
        
        res.json({
            success: true,
            message: 'Perfil atualizado com sucesso!',
            user: {
                ...req.user,
                ...updateData
            }
        });
        
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Alterar senha do usuário
 * @access  Private
 */
router.post('/change-password', requireAuth, requireActiveAccount, requireVerifiedEmail, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Senha atual e nova senha são obrigatórias'
            });
        }
        
        // Buscar usuário atual
        const user = await authService.getUserByUsername(req.user.username);
        
        // Verificar senha atual
        const isCurrentPasswordValid = await require('bcrypt').compare(currentPassword, user.PASSWORD_HASH);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                error: 'Senha atual incorreta'
            });
        }
        
        // Validar nova senha
        const passwordValidation = await authService.validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                success: false,
                error: passwordValidation.errors.join(', ')
            });
        }
        
        // Gerar novo hash da senha
        const saltRounds = 12;
        const passwordHash = await require('bcrypt').hash(newPassword, saltRounds);
        const passwordSalt = require('crypto').randomBytes(32).toString('hex');
        
        // Atualizar senha
        const sql = `
            UPDATE USERS 
            SET PASSWORD_HASH = ?, PASSWORD_SALT = ?
            WHERE ID = ?
        `;
        
        await require('../../database/firebird_connection').executeTransaction(sql, [
            passwordHash, passwordSalt, req.user.id
        ]);
        
        // Log de atividade
        await authService.logAuthActivity(req.user.id, 'PASSWORD_CHANGED', true);
        
        res.json({
            success: true,
            message: 'Senha alterada com sucesso!'
        });
        
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Reenviar e-mail de verificação
 * @access  Private
 */
router.post('/resend-verification', requireAuth, requireActiveAccount, async (req, res) => {
    try {
        // Verificar se já está verificado
        if (req.user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                error: 'E-mail já foi verificado'
            });
        }
        
        // Buscar usuário atual
        const user = await authService.getUserByUsername(req.user.username);
        
        // Gerar novo token de verificação
        const verificationToken = require('crypto').randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
        
        // Atualizar token no banco
        const sql = `
            UPDATE USERS 
            SET EMAIL_VERIFICATION_TOKEN = ?, EMAIL_VERIFICATION_EXPIRES = ?
            WHERE ID = ?
        `;
        
        await require('../../database/firebird_connection').executeTransaction(sql, [
            verificationToken, verificationExpires, req.user.id
        ]);
        
        // Enviar novo e-mail
        const userWithNewToken = { ...user, EMAIL_VERIFICATION_TOKEN: verificationToken };
        await authService.sendVerificationEmail(userWithNewToken);
        
        res.json({
            success: true,
            message: 'E-mail de verificação reenviado com sucesso!'
        });
        
    } catch (error) {
        console.error('Erro ao reenviar verificação:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// ========================================
// ROTAS ADMIN (apenas para administradores)
// ========================================

/**
 * @route   GET /api/auth/users
 * @desc    Listar todos os usuários (admin)
 * @access  Private/Admin
 */
router.get('/users', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const sql = `
            SELECT ID, USERNAME, EMAIL, FIRST_NAME, LAST_NAME, ROLE, 
                   IS_ACTIVE, IS_EMAIL_VERIFIED, LAST_LOGIN, CREATED_AT
            FROM USERS 
            ORDER BY CREATED_AT DESC
        `;
        
        const users = await require('../../database/firebird_connection').executeQuery(sql);
        
        res.json({
            success: true,
            users: users
        });
        
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * @route   PUT /api/auth/users/:id/status
 * @desc    Ativar/desativar usuário (admin)
 * @access  Private/Admin
 */
router.put('/users/:id/status', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        
        if (typeof isActive !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: 'Status deve ser true ou false'
            });
        }
        
        const sql = 'UPDATE USERS SET IS_ACTIVE = ? WHERE ID = ?';
        await require('../../database/firebird_connection').executeTransaction(sql, [isActive, id]);
        
        res.json({
            success: true,
            message: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso!`
        });
        
    } catch (error) {
        console.error('Erro ao alterar status do usuário:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * @route   GET /api/auth/logs
 * @desc    Obter logs de autenticação (admin)
 * @access  Private/Admin
 */
router.get('/logs', requireAuth, requireRole('ADMIN'), async (req, res) => {
    try {
        const { limit = 100, offset = 0, action, userId } = req.query;
        
        let sql = `
            SELECT AL.*, U.USERNAME, U.EMAIL
            FROM AUTH_LOGS AL
            LEFT JOIN USERS U ON AL.USER_ID = U.ID
        `;
        
        const conditions = [];
        const params = [];
        
        if (action) {
            conditions.push('AL.ACTION = ?');
            params.push(action);
        }
        
        if (userId) {
            conditions.push('AL.USER_ID = ?');
            params.push(userId);
        }
        
        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        
        sql += ' ORDER BY AL.CREATED_AT DESC';
        sql += ` ROWS ${parseInt(offset)} TO ${parseInt(offset) + parseInt(limit) - 1}`;
        
        const logs = await require('../../database/firebird_connection').executeQuery(sql, params);
        
        res.json({
            success: true,
            logs: logs
        });
        
    } catch (error) {
        console.error('Erro ao obter logs:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// ========================================
// MIDDLEWARE DE SEGURANÇA
// ========================================

// Aplicar headers de segurança em todas as rotas
router.use(addSecurityHeaders);

// Log de requisições autenticadas
router.use(logAuthenticatedRequest);

module.exports = router;
