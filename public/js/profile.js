// Sistema de perfil del artista para Cadavrix
class ArtistProfile {
    constructor() {
        this.artistId = null;
        this.artist = null;
        this.artworks = [];
        this.data = null;
        this.currentTab = 'gallery';
        
        // Configuración de la API
        this.apiBaseUrl = window.CadavrixConfig.API_BASE_URL;
    }

    async init() {
        try {
            console.log('🎨 Cargando perfil desde API...');
            
            // Mostrar loading
            this.showLoading();
            
            // Obtener el ID del artista desde la URL
            this.artistId = this.getArtistIdFromUrl();
            
            if (!this.artistId) {
                this.showError('No se especificÃ³ un artista vÃ¡lido');
                return;
            }

            // Cargar datos del artista desde API
            await this.loadArtistFromAPI();
            
            if (!this.artist) {
                this.showError('Artista no encontrado');
                return;
            }

            // Cargar obras del artista desde API
            await this.loadArtistArtworks();
            
            // Renderizar perfil
            this.renderProfile();
            
            // Inicializar funcionalidades
            this.initTabs();
            this.initModal();
            
            // Ocultar loading
            this.hideLoading();
            
            console.log('âœ¨ Perfil del artista cargado:', this.artist.name);
            console.log('ðŸŽ¨ Obras encontradas:', this.artworks.length);
            
        } catch (error) {
            console.error('âŒ Error cargando perfil:', error);
            this.showError('Error cargando el perfil del artista');
        }
    }

    getArtistIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('artist');
    }

    async loadArtistFromAPI() {
        try {
            console.log(`📡 Cargando artista ${this.artistId} desde API...`);
            
            const response = await fetch(`${this.apiBaseUrl}/artists/${this.artistId}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Artista no encontrado');
                }
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            this.artist = {
                id: data.data._id,
                name: data.data.name,
                bio: data.data.bio,
                socialMedia: data.data.socialMedia,
                registeredAt: data.data.registeredAt,
                artworksCount: data.data.artworksCount
            };
            
            console.log('✅ Artista cargado desde API');
            
        } catch (error) {
            console.error('❌ Error cargando artista:', error);
            throw new Error(`Error cargando artista: ${error.message}`);
        }
    }

    async loadArtistArtworks() {
        try {
            console.log(`📡 Cargando obras del artista ${this.artistId}...`);
            
            const response = await fetch(`${this.apiBaseUrl}/artworks?artistId=${this.artistId}`);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            this.artworks = data.data.map(artwork => ({
                id: artwork._id,
                title: artwork.title,
                description: artwork.description,
                image: artwork.image,
                gridPosition: artwork.gridPosition,
                createdAt: artwork.createdAt,
                uploadedAt: artwork.uploadedAt,
                status: artwork.status,
                artistId: artwork.artistId._id || artwork.artistId
            }));
            
            console.log(`✅ ${this.artworks.length} obras cargadas desde API`);
            
        } catch (error) {
            console.error('❌ Error cargando obras:', error);
            this.artworks = []; // Fallback a array vacío
        }
    }

    renderProfile() {
        this.renderArtistHeader();
        this.renderGallery();
        this.renderInfo();
        this.showProfile();
    }

    renderArtistHeader() {
        // Avatar con iniciales
        const avatar = document.getElementById('artistAvatar');
        const initials = this.getInitials(this.artist.name);
        avatar.textContent = initials;

        // InformaciÃ³n bÃ¡sica
        document.getElementById('artistName').textContent = this.artist.name;
        document.getElementById('artistBio').textContent = this.artist.bio;
        
        // EstadÃ­sticas
        document.getElementById('artworkCount').textContent = this.artworks.length;
        
        const joinYear = new Date(this.artist.registeredAt).getFullYear();
        document.getElementById('joinDate').textContent = joinYear;

        // Enlaces sociales
        this.renderSocialLinks();
    }

    getInitials(name) {
        return name.split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    }

    renderSocialLinks() {
        const socialContainer = document.getElementById('socialLinks');
        socialContainer.innerHTML = '';

        const social = this.artist.socialMedia;
        const socialPlatforms = [
            { key: 'facebook', name: 'Facebook', icon: 'ðŸ“˜' },
            { key: 'instagram', name: 'Instagram', icon: 'ðŸ“·' },
            { key: 'website', name: 'Website', icon: 'ðŸŒ' }
        ];

        socialPlatforms.forEach(platform => {
            if (social[platform.key]) {
                const link = document.createElement('a');
                link.href = social[platform.key];
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.className = 'social-link';
                link.innerHTML = `
                    <span>${platform.icon}</span>
                    <span>${platform.name}</span>
                `;
                socialContainer.appendChild(link);
            }
        });
    }

    renderGallery() {
        const galleryContainer = document.getElementById('artworksGrid');
        const galleryCount = document.getElementById('galleryCount');
        const galleryArtistName = document.getElementById('galleryArtistName');
        const noArtworks = document.getElementById('noArtworks');

        // Actualizar nombre en galerÃ­a
        galleryArtistName.textContent = this.artist.name;
        
        // Actualizar contador
        const count = this.artworks.length;
        galleryCount.textContent = `${count} obra${count !== 1 ? 's' : ''}`;

        if (this.artworks.length === 0) {
            galleryContainer.style.display = 'none';
            noArtworks.classList.remove('hidden');
            return;
        }

        // Renderizar obras
        galleryContainer.innerHTML = '';
        
        // Ordenar obras por fecha de creaciÃ³n (mÃ¡s recientes primero)
        const sortedArtworks = [...this.artworks].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        sortedArtworks.forEach(artwork => {
            const artworkCard = this.createArtworkCard(artwork);
            galleryContainer.appendChild(artworkCard);
        });
    }

    createArtworkCard(artwork) {
        const card = document.createElement('div');
        card.className = 'artwork-card';
        card.dataset.artworkId = artwork.id;

        const creationDate = this.formatDate(artwork.createdAt);
        const gridPos = artwork.gridPosition ? 
            `${artwork.gridPosition.x}, ${artwork.gridPosition.y}` : 'No asignada';

        // RUTA PARA BACKEND API
        const baseUrl = window.CadavrixConfig.API_BASE_URL.replace('/api', '');
        const imgSrc = `${baseUrl}/${artwork.image}`;

        card.innerHTML = `
            <img class="artwork-image" src="${imgSrc}" alt="${artwork.title}" loading="lazy">
            <div class="artwork-details">
                <h3 class="artwork-title">${artwork.title}</h3>
                <p class="artwork-description">${artwork.description}</p>
                <div class="artwork-meta">
                    <span class="creation-date">${creationDate}</span>
                    <span class="grid-position">Pos: ${gridPos}</span>
                </div>
            </div>
        `;

        // Event listener para abrir modal
        card.addEventListener('click', () => {
            this.openArtworkModal(artwork);
        });

        // Manejar error de carga de imagen
        const img = card.querySelector('.artwork-image');
        img.onerror = () => {
            img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
        };

        return card;
    }

    renderInfo() {
        // InformaciÃ³n de registro
        const fullJoinDate = this.formatFullDate(this.artist.registeredAt);
        document.getElementById('fullJoinDate').textContent = fullJoinDate;
        document.getElementById('artistId').textContent = this.artist.id;

        // Enlaces sociales detallados
        this.renderDetailedSocialLinks();

        // EstadÃ­sticas
        document.getElementById('totalArtworks').textContent = this.artworks.length;
        
        if (this.artworks.length > 0) {
            const sortedByDate = [...this.artworks].sort((a, b) => 
                new Date(a.createdAt) - new Date(b.createdAt)
            );
            
            const firstArtwork = sortedByDate[0];
            const lastArtwork = sortedByDate[sortedByDate.length - 1];
            
            document.getElementById('firstArtwork').textContent = 
                `${firstArtwork.title} (${this.formatDate(firstArtwork.createdAt)})`;
            
            document.getElementById('lastArtwork').textContent = 
                `${lastArtwork.title} (${this.formatDate(lastArtwork.createdAt)})`;
        } else {
            document.getElementById('firstArtwork').textContent = 'Sin obras';
            document.getElementById('lastArtwork').textContent = 'Sin obras';
        }
    }

    renderDetailedSocialLinks() {
        const container = document.getElementById('socialLinksDetailed');
        container.innerHTML = '';

        const social = this.artist.socialMedia;
        const socialPlatforms = [
            { key: 'facebook', name: 'Facebook', icon: 'ðŸ“˜', color: '#1877f2' },
            { key: 'instagram', name: 'Instagram', icon: 'ðŸ“·', color: '#e4405f' },
            { key: 'website', name: 'Sitio Web', icon: 'ðŸŒ', color: '#666' }
        ];

        socialPlatforms.forEach(platform => {
            if (social[platform.key]) {
                const link = document.createElement('a');
                link.href = social[platform.key];
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.className = 'social-link-detailed';
                
                const domain = this.extractDomain(social[platform.key]);
                
                link.innerHTML = `
                    <span class="social-icon">${platform.icon}</span>
                    <div>
                        <div style="font-weight: 600;">${platform.name}</div>
                        <div style="font-size: 0.9em; color: #666;">${domain}</div>
                    </div>
                `;
                container.appendChild(link);
            }
        });

        if (container.children.length === 0) {
            container.innerHTML = '<p style="color: #666; font-style: italic;">No hay enlaces disponibles</p>';
        }
    }

    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch {
            return url;
        }
    }

    formatDate(isoString) {
        const date = new Date(isoString);
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric'
        };
        return date.toLocaleDateString('es-ES', options);
    }

    formatFullDate(isoString) {
        const date = new Date(isoString);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('es-ES', options);
    }

    initTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        // Actualizar botones
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Actualizar contenido
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;
    }

    initModal() {
        const modal = document.getElementById('artworkModal');
        const closeBtn = modal.querySelector('.close');

        // Cerrar modal
        closeBtn.addEventListener('click', () => this.closeModal());
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                this.closeModal();
            }
        });

        // Inicializar botones del modal
        this.initModalButtons();
    }

    openArtworkModal(artwork) {
        const modal = document.getElementById('artworkModal');
        
        // RUTA PARA BACKEND API
        const baseUrl = window.CadavrixConfig.API_BASE_URL.replace('/api', '');
        const imgSrc = `${baseUrl}/${artwork.image}`;
        
        // Actualizar contenido
        document.getElementById('modalArtworkImg').src = imgSrc;
        document.getElementById('modalArtworkTitle').textContent = artwork.title;
        document.getElementById('modalArtistName').textContent = `por ${this.artist.name}`;
        document.getElementById('modalCreationDate').textContent = this.formatDate(artwork.createdAt);
        document.getElementById('modalArtworkDescription').textContent = artwork.description;
        
        // Configurar enlace "Ver en grid"
        const backToGridBtn = document.getElementById('backToGrid');
        if (artwork.gridPosition) {
            backToGridBtn.href = `index.html#pos-${artwork.gridPosition.x}-${artwork.gridPosition.y}`;
            backToGridBtn.style.display = 'inline-block';
        } else {
            backToGridBtn.style.display = 'none';
        }

        // Mostrar modal
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
    }

    closeModal() {
        const modal = document.getElementById('artworkModal');
        modal.style.opacity = '0';
        
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    }

    initModalButtons() {
        const likeBtn = document.querySelector('.btn-like');
        const shareBtn = document.querySelector('.btn-share');
        
        if (likeBtn) {
            likeBtn.addEventListener('click', this.handleLike.bind(this));
        }
        
        if (shareBtn) {
            shareBtn.addEventListener('click', this.handleShare.bind(this));
        }
    }

    handleLike(event) {
        const btn = event.target;
        const originalText = btn.textContent;
        
        btn.textContent = 'Â¡Te gusta!';
        btn.style.backgroundColor = 'rgba(255, 107, 107, 0.8)';
        btn.style.transform = 'scale(1.1)';
        
        setTimeout(() => {
            btn.style.transform = 'scale(1)';
        }, 200);
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        }, 2000);
    }

    handleShare(event) {
        const artistName = this.artist.name;
        const artworkTitle = document.getElementById('modalArtworkTitle').textContent;
        
        const shareText = `Â¡Mira esta increÃ­ble obra "${artworkTitle}" por ${artistName} en Cadavrix!`;
        const shareUrl = window.location.href;
        
        if (navigator.share) {
            navigator.share({
                title: 'Cadavrix - Arte Colaborativo',
                text: shareText,
                url: shareUrl,
            }).catch(err => console.log('Error al compartir:', err));
        } else if (navigator.clipboard) {
            const textToCopy = `${shareText} ${shareUrl}`;
            navigator.clipboard.writeText(textToCopy).then(() => {
                const btn = event.target;
                const originalText = btn.textContent;
                btn.textContent = 'ðŸ”— Â¡Copiado!';
                btn.style.backgroundColor = 'rgba(76, 175, 80, 0.8)';
                
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }, 2000);
            });
        }
    }

    showError(message) {
        const errorContainer = document.getElementById('errorContainer');
        const errorContent = errorContainer.querySelector('.error-content p');
        
        if (errorContent) {
            errorContent.textContent = message;
        }
        
        this.hideLoading();
        errorContainer.classList.remove('hidden');
    }

    showLoading() {
        const loadingContainer = document.getElementById('profileLoading');
        if (loadingContainer) {
            loadingContainer.style.display = 'flex';
        }
    }

    hideLoading() {
        const loadingContainer = document.getElementById('profileLoading');
        if (loadingContainer) {
            loadingContainer.style.display = 'none';
        }
    }

    showProfile() {
        const profileContainer = document.getElementById('profileContainer');
        profileContainer.classList.remove('hidden');
    }

    // MÃ©todo para obtener estadÃ­sticas del artista
    getArtistStatistics() {
        const stats = {
            totalArtworks: this.artworks.length,
            joinDate: this.artist.registeredAt,
            socialLinks: Object.keys(this.artist.socialMedia).length,
            artworksByMonth: {}
        };

        // Agrupar obras por mes
        this.artworks.forEach(artwork => {
            const date = new Date(artwork.createdAt);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            stats.artworksByMonth[monthKey] = (stats.artworksByMonth[monthKey] || 0) + 1;
        });

        return stats;
    }
}

// Inicializar cuando el DOM estÃ© listo
document.addEventListener('DOMContentLoaded', async () => {
    const artistProfile = new ArtistProfile();
    await artistProfile.init();
    
    // Hacer disponible globalmente para debugging
    window.ArtistProfile = artistProfile;
    
    // Log de estadÃ­sticas
    if (artistProfile.artist) {
        const stats = artistProfile.getArtistStatistics();
        console.log('ðŸ“Š EstadÃ­sticas del artista:', stats);
    }
});