// Configuração da API
const API_CONFIG = {
    // URL do backend em produção
    PRODUCTION_URL: 'https://seu-backend.herokuapp.com', // Substitua pela URL real do seu backend
    
    // URLs das APIs
    ENDPOINTS: {
        DASHBOARD_STATS: '/api/dashboard/stats',
        UPLOAD_EXCEL: '/api/upload-excel',
        PROFILE: '/api/profile',
        TICKETS: '/api/tickets',
        DATA_SOURCES: '/api/data-sources'
    }
};

// Função para detectar automaticamente se está local ou em produção
function getApiBaseUrl() {
    // Se estiver rodando localmente (localhost ou 127.0.0.1)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3000';
    }
    
    // Se estiver no Netlify ou outro domínio de produção
    return API_CONFIG.PRODUCTION_URL;
}

// Função para fazer chamadas à API com a URL base correta
async function apiCall(endpoint, options = {}) {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}${endpoint}`;
    
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response;
    } catch (error) {
        console.error(`Erro na chamada da API ${endpoint}:`, error);
        throw error;
    }
}
