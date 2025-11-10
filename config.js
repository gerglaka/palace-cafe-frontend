/**
 * Palace Cafe & Bar - API Configuration
 * Automatically switches between development and production
 * 
 * @author Palace Development Team
 * @version 1.0.0
 */

const API_CONFIG = {
    // Development environment (Railway dev + Vercel)
    DEVELOPMENT: {
        apiUrl: 'https://palace-cafe-backend-production.up.railway.app/api',
        socketUrl: 'https://palace-cafe-backend-production.up.railway.app',
        environment: 'development'
    },
    
    // Production environment (Railway prod + WebSupport)
    PRODUCTION: {
        apiUrl: 'https://palace-cafe-backend-production.up.railway.app/api',
        socketUrl: 'https://palace-cafe-backend-production.up.railway.app',
        environment: 'production'
    }
};

/**
 * Automatically detect and return the correct configuration
 */
function getAPIConfig() {
    // Check if we're on Vercel (development)
    const isVercel = window.location.hostname.includes('vercel.app');
    
    // Check if we're on localhost (local development)
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
    
    // Use development config for Vercel or localhost
    if (isVercel || isLocalhost) {
        console.log('🔧 Environment: DEVELOPMENT');
        console.log('🔗 API URL:', API_CONFIG.DEVELOPMENT.apiUrl);
        return API_CONFIG.DEVELOPMENT;
    }
    
    // Use production config for palacebar.sk
    console.log('🚀 Environment: PRODUCTION');
    console.log('🔗 API URL:', API_CONFIG.PRODUCTION.apiUrl);
    return API_CONFIG.PRODUCTION;
}

// Export the active configuration
window.API_CONFIG = getAPIConfig();

// Also export individual values for convenience
window.API_BASE_URL = window.API_CONFIG.apiUrl;
window.SOCKET_URL = window.API_CONFIG.socketUrl;
window.ENVIRONMENT = window.API_CONFIG.environment;