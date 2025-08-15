const authService = require('./auth_service');

// ========================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ========================================

/**
 * Middleware para verificar se o usuário está autenticado
 */
const requireAuth = async (req, res, next) => {
    try {
        const token = extractToken(req);
        
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token de autenticação não fornecido'
            });
        }
        
        const tokenValidation = authService.verifyToken(token);
        
        if (!tokenValidation.valid) {
            return res.status(401).json({
                success: false,
                error: 'Token inválido ou expirado'
            });
        }
        
        // Adicionar informações do usuário ao request
        req.user = tokenValidation.user;
        req.token = token;
        
        next();
        
    } catch (error) {
        console.error('Erro no middleware de autenticação:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno de autenticação'
        });
    }
};

/**
 * Middleware para verificar se o usuário tem role específico
 */
const requireRole = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Usuário não autenticado'
            });
        }
        
        if (req.user.role !== requiredRole && req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                error: 'Acesso negado. Permissão insuficiente.'
            });
        }
        
        next();
    };
};

/**
 * Middleware para verificar se o usuário tem um dos roles permitidos
 */
const requireAnyRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Usuário não autenticado'
            });
        }
        
        if (!allowedRoles.includes(req.user.role) && req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                error: 'Acesso negado. Permissão insuficiente.'
            });
        }
        
        next();
    };
};

/**
 * Middleware opcional de autenticação (não bloqueia se não autenticado)
 */
const optionalAuth = async (req, res, next) => {
    try {
        const token = extractToken(req);
        
        if (token) {
            const tokenValidation = authService.verifyToken(token);
            
            if (tokenValidation.valid) {
                req.user = tokenValidation.user;
                req.token = token;
            }
        }
        
        next();
        
    } catch (error) {
        console.error('Erro no middleware de autenticação opcional:', error);
        next(); // Continua mesmo com erro
    }
};

/**
 * Middleware para verificar se o usuário é o dono do recurso ou admin
 */
const requireOwnershipOrAdmin = (resourceIdField = 'id') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Usuário não autenticado'
            });
        }
        
        // Admin pode acessar qualquer recurso
        if (req.user.role === 'ADMIN') {
            return next();
        }
        
        // Verificar se o usuário é o dono do recurso
        const resourceId = req.params[resourceIdField] || req.body[resourceIdField];
        
        if (!resourceId) {
            return res.status(400).json({
                success: false,
                error: 'ID do recurso não fornecido'
            });
        }
        
        if (req.user.id.toString() !== resourceId.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Acesso negado. Você só pode acessar seus próprios recursos.'
            });
        }
        
        next();
    };
};

/**
 * Middleware para rate limiting de tentativas de login
 */
const loginRateLimit = (req, res, next) => {
    // Implementar rate limiting se necessário
    // Por enquanto, apenas passa para o próximo middleware
    next();
};

/**
 * Middleware para verificar se a conta está ativa
 */
const requireActiveAccount = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Usuário não autenticado'
            });
        }
        
        // Verificar se a conta está ativa
        if (!req.user.isActive) {
            return res.status(403).json({
                success: false,
                error: 'Conta desativada. Entre em contato com o administrador.'
            });
        }
        
        next();
        
    } catch (error) {
        console.error('Erro ao verificar status da conta:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno ao verificar conta'
        });
    }
};

/**
 * Middleware para verificar se o e-mail foi verificado
 */
const requireVerifiedEmail = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Usuário não autenticado'
            });
        }
        
        // Verificar se o e-mail foi verificado
        if (!req.user.isEmailVerified) {
            return res.status(403).json({
                success: false,
                error: 'E-mail não verificado. Verifique sua caixa de entrada.'
            });
        }
        
        next();
        
    } catch (error) {
        console.error('Erro ao verificar e-mail:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno ao verificar e-mail'
        });
    }
};

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

/**
 * Extrai o token de autenticação do request
 */
function extractToken(req) {
    // Verificar no header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        return req.headers.authorization.substring(7);
    }
    
    // Verificar no header x-auth-token
    if (req.headers['x-auth-token']) {
        return req.headers['x-auth-token'];
    }
    
    // Verificar no cookie
    if (req.cookies && req.cookies.authToken) {
        return req.cookies.authToken;
    }
    
    // Verificar no query string
    if (req.query.token) {
        return req.query.token;
    }
    
    // Verificar no body
    if (req.body && req.body.token) {
        return req.body.token;
    }
    
    return null;
}

/**
 * Middleware para adicionar informações de segurança ao response
 */
const addSecurityHeaders = (req, res, next) => {
    // Headers de segurança
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Header para indicar que a API requer autenticação
    res.setHeader('WWW-Authenticate', 'Bearer');
    
    next();
};

/**
 * Middleware para logging de requisições autenticadas
 */
const logAuthenticatedRequest = (req, res, next) => {
    if (req.user) {
        console.log(`🔐 [${req.method}] ${req.originalUrl} - Usuário: ${req.user.username} (${req.user.role})`);
    }
    next();
};

// ========================================
// EXPORTAÇÕES
// ========================================

module.exports = {
    requireAuth,
    requireRole,
    requireAnyRole,
    optionalAuth,
    requireOwnershipOrAdmin,
    loginRateLimit,
    requireActiveAccount,
    requireVerifiedEmail,
    addSecurityHeaders,
    logAuthenticatedRequest
};
