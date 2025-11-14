// Configuración para PRODUCCIÓN - Conectar con Render
window.CadavrixConfig = {
  // 🎯 URL de tu backend en Render (CAMBIO PRINCIPAL)
  API_BASE_URL: 'https://cadavrix-api.onrender.com/api',
  
  // 🔐 Configuración de autenticación
  AUTH_TOKEN_KEY: 'cadavrix_token',
  AUTH_USER_KEY: 'cadavrix_user',
  
  // 🎨 Configuración del grid
  GRID_SIZE: {
    width: 10,
    height: 10,
    cellSize: 2000,
    templateSize: 2200
  },
  
  // 📁 Configuración de archivos
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_EXTENSIONS: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  
  // 🌐 Configuración de entorno
  ENVIRONMENT: 'production',
  DEBUG: false,
  
  // 💬 Mensajes
  MESSAGES: {
    AUTH_REQUIRED: 'Debes iniciar sesión para acceder a esta función',
    NETWORK_ERROR: 'Error de conexión. Verifica tu internet.',
    GENERIC_ERROR: 'Ha ocurrido un error. Inténtalo de nuevo.',
    SUCCESS_REGISTER: '¡Cuenta creada exitosamente!',
    SUCCESS_LOGIN: '¡Bienvenido de vuelta!',
    SUCCESS_LOGOUT: 'Sesión cerrada correctamente'
  }
};

// Utilidades para producción
window.CadavrixUtils = {
  debug: function(message, data) {
    if (window.CadavrixConfig.DEBUG) {
      console.log('🎨 Cadavrix:', message, data);
    }
  },
  
  formatDate: function(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  },
  
  validateEmail: function(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },
  
  validateFile: function(file) {
    const config = window.CadavrixConfig;
    
    if (file.size > config.MAX_FILE_SIZE) {
      return {
        valid: false,
        message: 'El archivo es demasiado grande. Máximo 10MB.'
      };
    }

    const extension = file.name.split('.').pop().toLowerCase();
    if (!config.ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        message: 'Formato no válido. Usa: ' + config.ALLOWED_EXTENSIONS.join(', ')
      };
    }

    return { valid: true };
  },
  
  showNotification: function(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    const colors = {
      info: '#3b82f6',
      success: '#10b981', 
      error: '#ef4444',
      warning: '#f59e0b'
    };
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type]};
      color: white;
      padding: 1rem;
      border-radius: 8px;
      z-index: 10000;
      max-width: 300px;
      font-family: system-ui, -apple-system, sans-serif;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }
};

console.log('🎨 Cadavrix Frontend conectado a:', window.CadavrixConfig.API_BASE_URL);