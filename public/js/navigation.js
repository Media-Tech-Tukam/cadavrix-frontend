// Sistema de Navegación Dinámico para Cadavrix
class NavigationManager {
    constructor() {
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;
        
        console.log('🧭 Inicializando NavigationManager...');
        
        // Actualizar navegación al cargar la página
        this.updateNavigation();
        
        // Escuchar cambios en localStorage (logout desde otras pestañas)
        window.addEventListener('storage', (e) => {
            if (e.key === 'cadavrix_token') {
                this.updateNavigation();
            }
        });
        
        this.isInitialized = true;
        console.log('✅ NavigationManager inicializado');
    }

    updateNavigation() {
        const isAuthenticated = this.isAuthenticated();
        const user = this.getUser();
        
        if (isAuthenticated && user) {
            this.showAuthenticatedNav(user);
        } else {
            this.showUnauthenticatedNav();
        }
    }

    showUnauthenticatedNav() {
        const nav = document.querySelector('header nav ul');
        if (!nav) return;
        
        nav.innerHTML = `
            <li><a href="auth.html">Iniciar Sesión</a></li>
            <li><a href="auth.html?mode=register">Registrarse</a></li>
            <li><a href="#" onclick="NavManager.showAbout()">¿Qué es Cadavrix?</a></li>
        `;
        
        // Actualizar botón participar
        this.updateParticipateButton(false);
    }

    showAuthenticatedNav(user) {
        const nav = document.querySelector('header nav ul');
        if (!nav) return;
        
        // Obtener nombre del artista si está disponible
        const displayName = user.artistName || user.name || user.email.split('@')[0];
        
        nav.innerHTML = `
            <li class="user-greeting">
                <span class="greeting-text">Hola, ${displayName}</span>
            </li>
            <li class="nav-dropdown">
                <a href="#" class="dropdown-toggle">
                    <span class="user-icon">👤</span>
                    Mi Cuenta
                    <span class="dropdown-arrow">▼</span>
                </a>
                <ul class="dropdown-menu">
                    <li><a href="profile.html?artist=${user.artistId || user.id}">Mi Perfil</a></li>
                    <li><a href="participar.html">Participar</a></li>
                    <li><a href="subir-obra.html">Subir Obra</a></li>
                    <li class="dropdown-divider"></li>
                    <li><a href="#" onclick="NavManager.logout()" class="logout-link">Cerrar Sesión</a></li>
                </ul>
            </li>
        `;
        
        // Actualizar botón participar
        this.updateParticipateButton(true);
        
        // Configurar dropdown
        this.setupDropdown();
    }

    updateParticipateButton(isAuthenticated) {
        const participarBtn = document.querySelector('.btnParticipar');
        if (!participarBtn) return;
        
        if (isAuthenticated) {
            participarBtn.href = 'participar.html';
            participarBtn.textContent = 'Participar';
            participarBtn.classList.remove('login-required');
        } else {
            participarBtn.href = 'auth.html?redirect=participar.html';
            participarBtn.textContent = 'Participar';
            participarBtn.classList.add('login-required');
        }
    }

    setupDropdown() {
        const dropdownToggle = document.querySelector('.dropdown-toggle');
        const dropdownMenu = document.querySelector('.dropdown-menu');
        
        if (!dropdownToggle || !dropdownMenu) return;
        
        // Toggle dropdown al hacer click
        dropdownToggle.addEventListener('click', (e) => {
            e.preventDefault();
            dropdownMenu.classList.toggle('show');
        });
        
        // Cerrar dropdown al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-dropdown')) {
                dropdownMenu.classList.remove('show');
            }
        });
    }

    // Métodos de utilidad
    isAuthenticated() {
        return window.CadavrixAuth ? window.CadavrixAuth.isAuthenticated() : false;
    }

    getUser() {
        return window.CadavrixAuth ? window.CadavrixAuth.getUser() : null;
    }

    logout() {
        if (confirm('¿Estás seguro que quieres cerrar sesión?')) {
            if (window.CadavrixAuth) {
                window.CadavrixAuth.logout();
            }
        }
    }

    showAbout() {
        // Modal simple con información sobre Cadavrix
        this.showModal(`
            <h2>¿Qué es Cadavrix?</h2>
            <p>Cadavrix es un experimento artístico digital basado en el concepto del "cadáver exquisito".</p>
            <p>Cada artista contribuye con una pieza sin ver el resultado completo, creando una obra colectiva única y sorprendente.</p>
            <h3>¿Cómo funciona?</h3>
            <ol>
                <li>Regístrate como artista</li>
                <li>Se te asignará una celda aleatoria en el grid</li>
                <li>Recibes un template con fragmentos de las celdas vecinas</li>
                <li>Creas tu obra y la subes</li>
                <li>Tu pieza se integra al cadáver exquisito colectivo</li>
            </ol>
            <p><strong>¡El resultado final es una sorpresa para todos!</strong></p>
        `);
    }

    showModal(content) {
        // Crear modal dinámico
        const modal = document.createElement('div');
        modal.className = 'info-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="modal-close">&times;</span>
                ${content}
            </div>
        `;
        
        // Estilos inline para el modal
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        const modalContent = modal.querySelector('.modal-content');
        modalContent.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 12px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
        `;
        
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.style.cssText = `
            position: absolute;
            top: 1rem;
            right: 1rem;
            font-size: 2rem;
            cursor: pointer;
            color: #666;
        `;
        
        // Cerrar modal
        const closeModal = () => {
            document.body.removeChild(modal);
        };
        
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        // Agregar al DOM
        document.body.appendChild(modal);
    }
}

// CSS para el dropdown (agregar a style.css o inyectar)
const navStyles = `
<style>
/* Estilos para navegación autenticada */
.user-greeting {
    margin-right: 1rem;
}

.greeting-text {
    color: #667eea;
    font-weight: 600;
    font-size: 0.9rem;
}

.nav-dropdown {
    position: relative;
}

.dropdown-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    color: #2c3e50;
    font-weight: 500;
}

.user-icon {
    font-size: 1.2rem;
}

.dropdown-arrow {
    font-size: 0.8rem;
    transition: transform 0.2s ease;
}

.dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    background: white;
    border-radius: 8px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    min-width: 200px;
    padding: 0.5rem 0;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.2s ease;
    z-index: 1000;
    list-style: none;
}

.dropdown-menu.show {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

.dropdown-menu li {
    margin: 0;
}

.dropdown-menu a {
    display: block;
    padding: 0.75rem 1rem;
    color: #374151;
    text-decoration: none;
    font-size: 0.9rem;
    transition: background-color 0.2s ease;
}

.dropdown-menu a:hover {
    background-color: #f3f4f6;
}

.logout-link {
    color: #dc2626 !important;
    font-weight: 600;
}

.logout-link:hover {
    background-color: #fef2f2 !important;
}

.dropdown-divider {
    height: 1px;
    background: #e5e7eb;
    margin: 0.5rem 0;
}

.btnParticipar.login-required:hover::after {
    content: " (Requiere login)";
    font-size: 0.8rem;
    color: #dc2626;
}

/* Responsive */
@media (max-width: 768px) {
    .user-greeting {
        display: none;
    }
    
    .dropdown-menu {
        right: -1rem;
        min-width: 180px;
    }
}
</style>
`;

// Inyectar estilos
if (!document.getElementById('nav-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'nav-styles';
    styleElement.innerHTML = navStyles;
    document.head.appendChild(styleElement);
}

// Crear instancia global
window.NavManager = new NavigationManager();

// Función para inicializar desde cualquier página
window.initNavigation = function() {
    if (window.NavManager) {
        window.NavManager.init();
    }
};

// Auto-inicializar si CadavrixAuth está disponible
if (window.CadavrixAuth) {
    window.NavManager.init();
} else {
    // Esperar a que CadavrixAuth esté disponible
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.NavManager.init();
        }, 100);
    });
}

console.log('🧭 NavigationManager cargado. Usa window.NavManager para acceder.');