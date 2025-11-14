// Sistema de Autenticación para Cadavrix
class AuthManager {
    constructor() {
        this.apiBaseUrl = window.CadavrixConfig.API_BASE_URL;
        this.currentTab = 'login';
        
        // Referencias DOM
        this.loginForm = null;
        this.registerForm = null;
        this.authMessage = null;
        this.authLoading = null;
        
        // Estado
        this.isProcessing = false;
    }

    async init() {
        console.log('🔐 Inicializando sistema de autenticación...');
        
        // Verificar si ya está autenticado
        if (this.isAuthenticated()) {
            this.redirectToApp();
            return;
        }
        
        // Configurar referencias DOM
        this.setupDOMReferences();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Configurar tabs
        this.setupTabs();
        
        // Configurar contador de biografía
        this.setupBioCounter();
        
        console.log('✅ Sistema de autenticación listo');
    }

    setupDOMReferences() {
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.authMessage = document.getElementById('authMessage');
        this.authLoading = document.getElementById('authLoading');
        
        // Verificar que todos los elementos existan
        if (!this.loginForm || !this.registerForm || !this.authMessage || !this.authLoading) {
            console.error('❌ No se encontraron elementos DOM necesarios');
        }
    }

    setupEventListeners() {
        // Formulario de login
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // Formulario de registro
        if (this.registerForm) {
            this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
        
        // Detectar cambios en la URL (para logout desde otras páginas)
        window.addEventListener('storage', (e) => {
            if (e.key === 'cadavrix_token' && !e.newValue) {
                this.handleLogout();
            }
        });
        
        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });
    }

    setupTabs() {
        // Configurar tab inicial basado en URL o parámetro
        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode');
        
        if (mode === 'register') {
            this.switchTab('register');
        } else {
            this.switchTab('login');
        }
    }

    setupBioCounter() {
        const bioTextarea = document.getElementById('registerBio');
        const bioCount = document.getElementById('bioCount');
        
        if (bioTextarea && bioCount) {
            bioTextarea.addEventListener('input', () => {
                const length = bioTextarea.value.length;
                bioCount.textContent = `${length}/500 caracteres (mínimo 20)`;
                
                // Cambiar color según validación
                if (length < 20) {
                    bioCount.style.color = '#dc2626';
                } else if (length > 500) {
                    bioCount.style.color = '#dc2626';
                } else {
                    bioCount.style.color = '#059669';
                }
            });
        }
    }

    // Manejo de Login
    async handleLogin(event) {
        event.preventDefault();
        
        if (this.isProcessing) return;
        
        const formData = new FormData(event.target);
        const loginData = {
            email: formData.get('email'),
            password: formData.get('password')
        };
        
        // Validaciones frontend
        if (!this.validateLogin(loginData)) {
            return;
        }
        
        try {
            this.setProcessing(true);
            
            console.log('🔐 Intentando login...');
            
            const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Login exitoso
                this.handleLoginSuccess(data);
            } else {
                // Error de login
                this.showMessage(data.message || 'Error al iniciar sesión', 'error');
            }
            
        } catch (error) {
            console.error('❌ Error de conexión:', error);
            this.showMessage('Error de conexión. Verifica tu internet.', 'error');
        } finally {
            this.setProcessing(false);
        }
    }

    // Manejo de Registro
    async handleRegister(event) {
        event.preventDefault();
        
        if (this.isProcessing) return;
        
        const formData = new FormData(event.target);
        const registerData = {
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password'),
            bio: formData.get('bio'),
            socialMedia: {
                facebook: formData.get('facebook') || '',
                instagram: formData.get('instagram') || '',
                website: formData.get('website') || ''
            }
        };
        
        // Validaciones frontend
        if (!this.validateRegister(registerData)) {
            return;
        }
        
        try {
            this.setProcessing(true);
            
            console.log('📝 Intentando registro...');
            
            const response = await fetch(`${this.apiBaseUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(registerData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Registro exitoso
                this.handleRegisterSuccess(data);
            } else {
                // Error de registro
                this.showMessage(data.message || 'Error al crear cuenta', 'error');
            }
            
        } catch (error) {
            console.error('❌ Error de conexión:', error);
            this.showMessage('Error de conexión. Verifica tu internet.', 'error');
        } finally {
            this.setProcessing(false);
        }
    }

    // Validaciones
    validateLogin(data) {
        if (!data.email) {
            this.showMessage('Por favor ingresa tu email', 'error');
            return false;
        }
        
        if (!this.isValidEmail(data.email)) {
            this.showMessage('Por favor ingresa un email válido', 'error');
            return false;
        }
        
        if (!data.password) {
            this.showMessage('Por favor ingresa tu contraseña', 'error');
            return false;
        }
        
        return true;
    }

    validateRegister(data) {
        if (!data.name || data.name.length < 2) {
            this.showMessage('El nombre debe tener al menos 2 caracteres', 'error');
            return false;
        }
        
        if (!data.email || !this.isValidEmail(data.email)) {
            this.showMessage('Por favor ingresa un email válido', 'error');
            return false;
        }
        
        if (!data.password || data.password.length < 6) {
            this.showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
            return false;
        }
        
        if (!data.bio || data.bio.length < 20) {
            this.showMessage('La biografía debe tener al menos 20 caracteres', 'error');
            return false;
        }
        
        if (data.bio.length > 500) {
            this.showMessage('La biografía no puede exceder 500 caracteres', 'error');
            return false;
        }
        
        // Validar checkbox de términos
        const termsCheckbox = document.getElementById('terms');
        if (!termsCheckbox.checked) {
            this.showMessage('Debes aceptar participar en la obra colectiva', 'error');
            return false;
        }
        
        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Manejo de respuestas exitosas
    handleLoginSuccess(data) {
        console.log('✅ Login exitoso');
        
        // Enriquecer datos del usuario con información del artista si está disponible
        const enrichedUser = {
            ...data.user,
            artistName: data.artist?.name,
            artistId: data.artist?._id || data.artist?.id
        };
        
        // Guardar token y datos del usuario
        this.saveAuthData(data.token, enrichedUser);
        
        this.showMessage('¡Bienvenido de vuelta!', 'success');
        
        // Redirigir después de un momento
        setTimeout(() => {
            this.redirectToApp();
        }, 1500);
    }

    handleRegisterSuccess(data) {
        console.log('✅ Registro exitoso');
        
        // Enriquecer datos del usuario con información del artista
        const enrichedUser = {
            ...data.user,
            artistName: data.artist?.name,
            artistId: data.artist?._id || data.artist?.id
        };
        
        // Guardar token y datos del usuario
        this.saveAuthData(data.token, enrichedUser);
        
        this.showMessage('¡Cuenta creada exitosamente! Bienvenido a Cadavrix', 'success');
        
        // Redirigir después de un momento
        setTimeout(() => {
            this.redirectToApp();
        }, 2000);
    }

    // Manejo de datos de autenticación
    saveAuthData(token, user) {
        try {
            localStorage.setItem('cadavrix_token', token);
            localStorage.setItem('cadavrix_user', JSON.stringify(user));
            
            console.log('💾 Datos de sesión guardados');
        } catch (error) {
            console.error('❌ Error guardando datos de sesión:', error);
        }
    }

    getAuthToken() {
        return localStorage.getItem('cadavrix_token');
    }

    getAuthUser() {
        try {
            const userStr = localStorage.getItem('cadavrix_user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('❌ Error parseando datos de usuario:', error);
            return null;
        }
    }

    isAuthenticated() {
        const token = this.getAuthToken();
        const user = this.getAuthUser();
        
        return !!(token && user);
    }

    logout() {
        localStorage.removeItem('cadavrix_token');
        localStorage.removeItem('cadavrix_user');
        
        console.log('👋 Sesión cerrada');
        
        // Redirigir a auth
        window.location.href = 'auth.html';
    }

    // Navegación
    redirectToApp() {
        // Determinar a dónde redirigir
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');
        
        if (redirect) {
            window.location.href = redirect;
        } else {
            window.location.href = 'index.html';
        }
    }

    // UI Helper methods
    switchTab(tab) {
        this.currentTab = tab;
        
        // Actualizar botones
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Actualizar formularios
        document.querySelectorAll('.auth-form').forEach(form => {
            if (form.id === `${tab}-form`) {
                form.classList.add('active');
            } else {
                form.classList.remove('active');
            }
        });
        
        // Limpiar mensajes
        this.hideMessage();
        
        console.log(`📑 Cambiado a tab: ${tab}`);
    }

    setProcessing(isProcessing) {
        this.isProcessing = isProcessing;
        
        if (isProcessing) {
            this.showLoading();
            // Deshabilitar formularios
            document.querySelectorAll('form button[type="submit"]').forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = '0.6';
            });
        } else {
            this.hideLoading();
            // Habilitar formularios
            document.querySelectorAll('form button[type="submit"]').forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '1';
            });
        }
    }

    showMessage(message, type = 'info') {
        if (!this.authMessage) return;
        
        this.authMessage.textContent = message;
        this.authMessage.className = `message ${type}`;
        this.authMessage.classList.remove('hidden');
        
        // Auto-hide para mensajes de éxito después de 3 segundos
        if (type === 'success') {
            setTimeout(() => {
                this.hideMessage();
            }, 3000);
        }
    }

    hideMessage() {
        if (this.authMessage) {
            this.authMessage.classList.add('hidden');
        }
    }

    showLoading() {
        if (this.authLoading) {
            this.authLoading.classList.remove('hidden');
        }
    }

    hideLoading() {
        if (this.authLoading) {
            this.authLoading.classList.add('hidden');
        }
    }
}

// Función global para switchTab (llamada desde HTML)
window.switchTab = function(tab) {
    if (window.authManager) {
        window.authManager.switchTab(tab);
    }
};

// Helper global para verificar auth en otras páginas
window.CadavrixAuth = {
    isAuthenticated() {
        const token = localStorage.getItem('cadavrix_token');
        const user = localStorage.getItem('cadavrix_user');
        return !!(token && user);
    },
    
    getToken() {
        return localStorage.getItem('cadavrix_token');
    },
    
    getUser() {
        try {
            const userStr = localStorage.getItem('cadavrix_user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            return null;
        }
    },
    
    logout() {
        localStorage.removeItem('cadavrix_token');
        localStorage.removeItem('cadavrix_user');
        window.location.href = 'auth.html';
    },
    
    requireAuth() {
        if (!this.isAuthenticated()) {
            const currentUrl = encodeURIComponent(window.location.href);
            window.location.href = `auth.html?redirect=${currentUrl}`;
            return false;
        }
        return true;
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    window.authManager = new AuthManager();
    await window.authManager.init();
    
    // Hacer disponible globalmente para debugging
    console.log('🔐 AuthManager disponible como window.authManager');
});