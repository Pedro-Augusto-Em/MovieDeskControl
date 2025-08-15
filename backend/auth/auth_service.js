const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const firebird = require('../../database/firebird_connection');

class AuthService {
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'movidesk-control-secret-key-2024';
        this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
        
        // Configurar transporter de e-mail
        this.emailTransporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    // ========================================
    // VALIDAÇÃO DE SENHA
    // ========================================
    
    async validatePassword(password) {
        try {
            const settings = await this.getSecuritySettings();
            
            const errors = [];
            
            if (password.length < parseInt(settings.PASSWORD_MIN_LENGTH)) {
                errors.push(`Senha deve ter pelo menos ${settings.PASSWORD_MIN_LENGTH} caracteres`);
            }
            
            if (settings.PASSWORD_REQUIRE_UPPERCASE === 'true' && !/[A-Z]/.test(password)) {
                errors.push('Senha deve conter pelo menos uma letra maiúscula');
            }
            
            if (settings.PASSWORD_REQUIRE_LOWERCASE === 'true' && !/[a-z]/.test(password)) {
                errors.push('Senha deve conter pelo menos uma letra minúscula');
            }
            
            if (settings.PASSWORD_REQUIRE_NUMBERS === 'true' && !/\d/.test(password)) {
                errors.push('Senha deve conter pelo menos um número');
            }
            
            if (settings.PASSWORD_REQUIRE_SPECIAL === 'true' && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
                errors.push('Senha deve conter pelo menos um caractere especial');
            }
            
            return {
                isValid: errors.length === 0,
                errors: errors
            };
        } catch (error) {
            console.error('Erro ao validar senha:', error);
            return { isValid: false, errors: ['Erro interno ao validar senha'] };
        }
    }

    // ========================================
    // REGISTRO DE USUÁRIO
    // ========================================
    
    async registerUser(userData) {
        try {
            const { username, email, password, firstName, lastName } = userData;
            
            // Validar dados obrigatórios
            if (!username || !email || !password) {
                throw new Error('Username, email e senha são obrigatórios');
            }
            
            // Verificar se usuário já existe
            const existingUser = await this.getUserByUsernameOrEmail(username, email);
            if (existingUser) {
                throw new Error('Username ou email já está em uso');
            }
            
            // Validar senha
            const passwordValidation = await this.validatePassword(password);
            if (!passwordValidation.isValid) {
                throw new Error(passwordValidation.errors.join(', '));
            }
            
            // Gerar hash da senha
            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(password, saltRounds);
            const passwordSalt = crypto.randomBytes(32).toString('hex');
            
            // Gerar token de verificação
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
            
            // Inserir usuário no banco
            const sql = `
                INSERT INTO USERS (USERNAME, EMAIL, PASSWORD_HASH, PASSWORD_SALT, FIRST_NAME, LAST_NAME, EMAIL_VERIFICATION_TOKEN, EMAIL_VERIFICATION_EXPIRES)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const params = [username, email, passwordHash, passwordSalt, firstName, lastName, verificationToken, verificationExpires];
            await firebird.executeTransaction(sql, params);
            
            // Buscar usuário criado
            const newUser = await this.getUserByUsername(username);
            
            // Enviar e-mail de verificação
            await this.sendVerificationEmail(newUser);
            
            // Log de atividade
            await this.logAuthActivity(newUser.ID, 'REGISTER', true);
            
            return {
                success: true,
                message: 'Usuário registrado com sucesso! Verifique seu e-mail para ativar a conta.',
                user: {
                    id: newUser.ID,
                    username: newUser.USERNAME,
                    email: newUser.EMAIL,
                    firstName: newUser.FIRST_NAME,
                    lastName: newUser.LAST_NAME
                }
            };
            
        } catch (error) {
            console.error('Erro ao registrar usuário:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ========================================
    // LOGIN
    // ========================================
    
    async loginUser(credentials) {
        try {
            const { username, password, ipAddress, userAgent } = credentials;
            
            if (!username || !password) {
                throw new Error('Username e senha são obrigatórios');
            }
            
            // Buscar usuário
            const user = await this.getUserByUsernameOrEmail(username, username);
            if (!user) {
                await this.logAuthActivity(null, 'LOGIN_FAILED', false, 'Usuário não encontrado', ipAddress, userAgent);
                throw new Error('Credenciais inválidas');
            }
            
            // Verificar se conta está ativa
            if (!user.IS_ACTIVE) {
                await this.logAuthActivity(user.ID, 'LOGIN_FAILED', false, 'Conta desativada', ipAddress, userAgent);
                throw new Error('Conta desativada. Entre em contato com o administrador.');
            }
            
            // Verificar se conta está bloqueada
            if (user.LOCKED_UNTIL && new Date() < new Date(user.LOCKED_UNTIL)) {
                await this.logAuthActivity(user.ID, 'LOGIN_FAILED', false, 'Conta bloqueada temporariamente', ipAddress, userAgent);
                throw new Error('Conta bloqueada temporariamente devido a múltiplas tentativas de login.');
            }
            
            // Verificar senha
            const isPasswordValid = await bcrypt.compare(password, user.PASSWORD_HASH);
            if (!isPasswordValid) {
                await this.handleFailedLogin(user, ipAddress, userAgent);
                throw new Error('Credenciais inválidas');
            }
            
            // Reset de tentativas de login
            await this.resetLoginAttempts(user.ID);
            
            // Atualizar último login
            await this.updateLastLogin(user.ID);
            
            // Gerar token JWT
            const token = this.generateJWT(user);
            
            // Criar sessão
            await this.createUserSession(user.ID, token, ipAddress, userAgent);
            
            // Log de atividade
            await this.logAuthActivity(user.ID, 'LOGIN_SUCCESS', true, null, ipAddress, userAgent);
            
            return {
                success: true,
                message: 'Login realizado com sucesso!',
                token: token,
                user: {
                    id: user.ID,
                    username: user.USERNAME,
                    email: user.EMAIL,
                    firstName: user.FIRST_NAME,
                    lastName: user.LAST_NAME,
                    role: user.ROLE,
                    avatar: user.AVATAR,
                    isEmailVerified: user.IS_EMAIL_VERIFIED
                }
            };
            
        } catch (error) {
            console.error('Erro no login:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ========================================
    // VERIFICAÇÃO DE E-MAIL
    // ========================================
    
    async verifyEmail(token) {
        try {
            // Buscar usuário pelo token
            const sql = `
                SELECT ID, USERNAME, EMAIL, EMAIL_VERIFICATION_EXPIRES 
                FROM USERS 
                WHERE EMAIL_VERIFICATION_TOKEN = ? AND IS_EMAIL_VERIFIED = FALSE
            `;
            
            const users = await firebird.executeQuery(sql, [token]);
            if (users.length === 0) {
                throw new Error('Token de verificação inválido ou já utilizado');
            }
            
            const user = users[0];
            
            // Verificar se token expirou
            if (new Date() > new Date(user.EMAIL_VERIFICATION_EXPIRES)) {
                throw new Error('Token de verificação expirou. Solicite um novo.');
            }
            
            // Marcar e-mail como verificado
            const updateSql = `
                UPDATE USERS 
                SET IS_EMAIL_VERIFIED = TRUE, 
                    EMAIL_VERIFICATION_TOKEN = NULL, 
                    EMAIL_VERIFICATION_EXPIRES = NULL 
                WHERE ID = ?
            `;
            
            await firebird.executeTransaction(updateSql, [user.ID]);
            
            // Log de atividade
            await this.logAuthActivity(user.ID, 'EMAIL_VERIFIED', true);
            
            return {
                success: true,
                message: 'E-mail verificado com sucesso! Sua conta está ativa.',
                user: {
                    id: user.ID,
                    username: user.USERNAME,
                    email: user.EMAIL
                }
            };
            
        } catch (error) {
            console.error('Erro ao verificar e-mail:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ========================================
    // RECUPERAÇÃO DE SENHA
    // ========================================
    
    async requestPasswordReset(email) {
        try {
            // Buscar usuário pelo e-mail
            const user = await this.getUserByEmail(email);
            if (!user) {
                // Não revelar se o e-mail existe ou não
                return {
                    success: true,
                    message: 'Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.'
                };
            }
            
            // Gerar token de reset
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
            
            // Salvar token no banco
            const sql = `
                UPDATE USERS 
                SET PASSWORD_RESET_TOKEN = ?, 
                    PASSWORD_RESET_EXPIRES = ? 
                WHERE ID = ?
            `;
            
            await firebird.executeTransaction(sql, [resetToken, resetExpires, user.ID]);
            
            // Enviar e-mail de reset
            await this.sendPasswordResetEmail(user, resetToken);
            
            // Log de atividade
            await this.logAuthActivity(user.ID, 'PASSWORD_RESET_REQUESTED', true);
            
            return {
                success: true,
                message: 'Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.'
            };
            
        } catch (error) {
            console.error('Erro ao solicitar reset de senha:', error);
            return {
                success: false,
                error: 'Erro interno ao processar solicitação'
            };
        }
    }

    async resetPassword(token, newPassword) {
        try {
            // Buscar usuário pelo token
            const sql = `
                SELECT ID, USERNAME, EMAIL, PASSWORD_RESET_EXPIRES 
                FROM USERS 
                WHERE PASSWORD_RESET_TOKEN = ?
            `;
            
            const users = await firebird.executeQuery(sql, [token]);
            if (users.length === 0) {
                throw new Error('Token de reset inválido');
            }
            
            const user = users[0];
            
            // Verificar se token expirou
            if (new Date() > new Date(user.PASSWORD_RESET_EXPIRES)) {
                throw new Error('Token de reset expirou. Solicite um novo.');
            }
            
            // Validar nova senha
            const passwordValidation = await this.validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                throw new Error(passwordValidation.errors.join(', '));
            }
            
            // Gerar novo hash da senha
            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(newPassword, saltRounds);
            const passwordSalt = crypto.randomBytes(32).toString('hex');
            
            // Atualizar senha
            const updateSql = `
                UPDATE USERS 
                SET PASSWORD_HASH = ?, 
                    PASSWORD_SALT = ?, 
                    PASSWORD_RESET_TOKEN = NULL, 
                    PASSWORD_RESET_EXPIRES = NULL,
                    LOGIN_ATTEMPTS = 0,
                    LOCKED_UNTIL = NULL
                WHERE ID = ?
            `;
            
            await firebird.executeTransaction(updateSql, [passwordHash, passwordSalt, user.ID]);
            
            // Log de atividade
            await this.logAuthActivity(user.ID, 'PASSWORD_RESET', true);
            
            return {
                success: true,
                message: 'Senha alterada com sucesso! Você pode fazer login com a nova senha.',
                user: {
                    id: user.ID,
                    username: user.USERNAME,
                    email: user.EMAIL
                }
            };
            
        } catch (error) {
            console.error('Erro ao resetar senha:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ========================================
    // VALIDAÇÃO DE TOKEN JWT
    // ========================================
    
    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, this.jwtSecret);
            return {
                valid: true,
                user: decoded
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    // ========================================
    // LOGOUT
    // ========================================
    
    async logoutUser(token) {
        try {
            // Remover sessão
            const sql = 'DELETE FROM USER_SESSIONS WHERE SESSION_TOKEN = ?';
            await firebird.executeTransaction(sql, [token]);
            
            return {
                success: true,
                message: 'Logout realizado com sucesso!'
            };
            
        } catch (error) {
            console.error('Erro no logout:', error);
            return {
                success: false,
                error: 'Erro interno ao fazer logout'
            };
        }
    }

    // ========================================
    // MÉTODOS AUXILIARES
    // ========================================
    
    generateJWT(user) {
        const payload = {
            id: user.ID,
            username: user.USERNAME,
            email: user.EMAIL,
            role: user.ROLE
        };
        
        return jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn });
    }

    async getUserByUsername(username) {
        const sql = 'SELECT * FROM USERS WHERE USERNAME = ?';
        const users = await firebird.executeQuery(sql, [username]);
        return users.length > 0 ? users[0] : null;
    }

    async getUserByEmail(email) {
        const sql = 'SELECT * FROM USERS WHERE EMAIL = ?';
        const users = await firebird.executeQuery(sql, [email]);
        return users.length > 0 ? users[0] : null;
    }

    async getUserByUsernameOrEmail(username, email) {
        const sql = 'SELECT * FROM USERS WHERE USERNAME = ? OR EMAIL = ?';
        const users = await firebird.executeQuery(sql, [username, email]);
        return users.length > 0 ? users[0] : null;
    }

    async getSecuritySettings() {
        const sql = 'SELECT SETTING_KEY, SETTING_VALUE FROM SECURITY_SETTINGS';
        const settings = await firebird.executeQuery(sql);
        
        const result = {};
        settings.forEach(setting => {
            result[setting.SETTING_KEY] = setting.SETTING_VALUE;
        });
        
        return result;
    }

    async handleFailedLogin(user, ipAddress, userAgent) {
        const newAttempts = user.LOGIN_ATTEMPTS + 1;
        const settings = await this.getSecuritySettings();
        const maxAttempts = parseInt(settings.MAX_LOGIN_ATTEMPTS);
        const lockoutDuration = parseInt(settings.LOCKOUT_DURATION_MINUTES);
        
        let lockedUntil = null;
        if (newAttempts >= maxAttempts) {
            lockedUntil = new Date(Date.now() + lockoutDuration * 60 * 1000);
        }
        
        const sql = `
            UPDATE USERS 
            SET LOGIN_ATTEMPTS = ?, 
                LOCKED_UNTIL = ? 
            WHERE ID = ?
        `;
        
        await firebird.executeTransaction(sql, [newAttempts, lockedUntil, user.ID]);
    }

    async resetLoginAttempts(userId) {
        const sql = 'UPDATE USERS SET LOGIN_ATTEMPTS = 0, LOCKED_UNTIL = NULL WHERE ID = ?';
        await firebird.executeTransaction(sql, [userId]);
    }

    async updateLastLogin(userId) {
        const sql = 'UPDATE USERS SET LAST_LOGIN = CURRENT_TIMESTAMP WHERE ID = ?';
        await firebird.executeTransaction(sql, [userId]);
    }

    async createUserSession(userId, token, ipAddress, userAgent) {
        const settings = await this.getSecuritySettings();
        const sessionTimeout = parseInt(settings.SESSION_TIMEOUT_HOURS);
        const expiresAt = new Date(Date.now() + sessionTimeout * 60 * 60 * 1000);
        
        const sql = `
            INSERT INTO USER_SESSIONS (USER_ID, SESSION_TOKEN, IP_ADDRESS, USER_AGENT, EXPIRES_AT)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        await firebird.executeTransaction(sql, [userId, token, ipAddress, userAgent, expiresAt]);
    }

    async logAuthActivity(userId, action, success, errorMessage = null, ipAddress = null, userAgent = null) {
        try {
            const sql = `
                INSERT INTO AUTH_LOGS (USER_ID, ACTION, IP_ADDRESS, USER_AGENT, SUCCESS, ERROR_MESSAGE)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            await firebird.executeTransaction(sql, [userId, action, ipAddress, userAgent, success, errorMessage]);
        } catch (error) {
            console.error('Erro ao logar atividade de autenticação:', error);
        }
    }

    // ========================================
    // ENVIO DE E-MAILS
    // ========================================
    
    async sendVerificationEmail(user) {
        try {
            const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${user.EMAIL_VERIFICATION_TOKEN}`;
            
            const mailOptions = {
                from: process.env.SMTP_USER,
                to: user.EMAIL,
                subject: 'Verifique seu e-mail - Movidesk Control',
                html: `
                    <h2>Bem-vindo ao Movidesk Control!</h2>
                    <p>Olá ${user.FIRST_NAME || user.USERNAME},</p>
                    <p>Sua conta foi criada com sucesso. Para ativá-la, clique no link abaixo:</p>
                    <p><a href="${verificationUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Verificar E-mail</a></p>
                    <p>Este link expira em 24 horas.</p>
                    <p>Se você não criou esta conta, ignore este e-mail.</p>
                    <br>
                    <p>Atenciosamente,<br>Equipe Movidesk Control</p>
                `
            };
            
            await this.emailTransporter.sendMail(mailOptions);
            
        } catch (error) {
            console.error('Erro ao enviar e-mail de verificação:', error);
            throw new Error('Erro ao enviar e-mail de verificação');
        }
    }

    async sendPasswordResetEmail(user, resetToken) {
        try {
            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
            
            const mailOptions = {
                from: process.env.SMTP_USER,
                to: user.EMAIL,
                subject: 'Redefinir Senha - Movidesk Control',
                html: `
                    <h2>Redefinição de Senha</h2>
                    <p>Olá ${user.FIRST_NAME || user.USERNAME},</p>
                    <p>Você solicitou a redefinição de sua senha. Clique no link abaixo para criar uma nova senha:</p>
                    <p><a href="${resetUrl}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Redefinir Senha</a></p>
                    <p>Este link expira em 1 hora.</p>
                    <p>Se você não solicitou esta redefinição, ignore este e-mail.</p>
                    <p>Atenciosamente,<br>Equipe Movidesk Control</p>
                `
            };
            
            await this.emailTransporter.sendMail(mailOptions);
            
        } catch (error) {
            console.error('Erro ao enviar e-mail de reset:', error);
            throw new Error('Erro ao enviar e-mail de reset');
        }
    }
}

module.exports = new AuthService();
