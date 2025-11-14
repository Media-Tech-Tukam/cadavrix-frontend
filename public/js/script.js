// Sistema dinÃ¡mico para generar el grid de Cadavrix desde JSON
class CadavrixGrid {
    constructor() {
        this.data = null;
        this.gridContainer = null;
        this.artists = new Map();
        this.artworks = new Map();
        this.gridSize = { width: 10, height: 10 };
        
        // Configuración de la API
        this.apiBaseUrl = window.CadavrixConfig.API_BASE_URL;
        
        // Inicializar sistema de drag scroll
        this.dragScrollManager = new DragScrollManager();
    }

    async init() {
        try {
            // Cargar datos del JSON - RUTA CORREGIDA
            await this.loadDataFromAPI();
            
            // Procesar datos
            this.processAPIData();
            
            // Encontrar el contenedor del grid
            this.gridContainer = document.querySelector('main section');
            
            if (!this.gridContainer) {
                throw new Error('No se encontrÃ³ el contenedor del grid');
            }
            
            // Generar el grid dinÃ¡micamente
            this.generateGrid();
            
            // Inicializar sistema de drag scroll
            this.dragScrollManager.init(document.querySelector('main'));
            
            // Inicializar funcionalidad de modal
            this.initModalSystem();
            
            console.log('âœ¨ Cadavrix Grid generado dinÃ¡micamente');
            console.log(`ðŸ“Š ${this.artworks.size} obras cargadas`);
            console.log(`ðŸ‘¥ ${this.artists.size} artistas registrados`);
            
        } catch (error) {
            console.error('âš ï¸ Error inicializando Cadavrix Grid:', error);
        }
    }

    async loadDataFromAPI() {
        try {
            console.log('📡 Cargando datos desde APIs...');
            
            // Cargar artistas y obras en paralelo
            const [artistsResponse, artworksResponse] = await Promise.all([
                fetch(`${this.apiBaseUrl}/artists`),
                fetch(`${this.apiBaseUrl}/artworks`)
            ]);
            
            // Verificar respuestas
            if (!artistsResponse.ok) {
                throw new Error(`Error cargando artistas: ${artistsResponse.status}`);
            }
            
            if (!artworksResponse.ok) {
                throw new Error(`Error cargando obras: ${artworksResponse.status}`);
            }
            
            // Parsear respuestas JSON
            const artistsData = await artistsResponse.json();
            const artworksData = await artworksResponse.json();
            
            // Guardar datos en formato compatible
            this.data = {
                artists: artistsData.data || [],
                artworks: artworksData.data || []
            };
            
            console.log('✅ Datos cargados desde API');
            console.log(`   👥 ${this.data.artists.length} artistas`);
            console.log(`   🎨 ${this.data.artworks.length} obras`);
            
        } catch (error) {
            console.error('❌ Error cargando desde API:', error);
            throw new Error(`Error conectando con el servidor: ${error.message}`);
        }
    }

    processAPIData() {
        // Procesar artistas - API ya viene con populate
        this.data.artists.forEach(artist => {
            this.artists.set(artist._id, {
                id: artist._id,
                name: artist.name,
                bio: artist.bio,
                socialMedia: artist.socialMedia,
                registeredAt: artist.registeredAt,
                artworksCount: artist.artworksCount
            });
        });
        
        // Procesar obras de arte - API ya viene con artista poblado
        this.data.artworks.forEach(artwork => {
            this.artworks.set(artwork._id, {
                id: artwork._id,
                title: artwork.title,
                description: artwork.description,
                image: artwork.image,
                gridPosition: artwork.gridPosition,
                createdAt: artwork.createdAt,
                uploadedAt: artwork.uploadedAt,
                status: artwork.status,
                artistId: artwork.artistId._id,
                artist: {
                    id: artwork.artistId._id,
                    name: artwork.artistId.name,
                    bio: artwork.artistId.bio,
                    socialMedia: artwork.artistId.socialMedia
                }
            });
        });
        
        console.log('✅ Datos de API procesados');
    }

    generateGrid() {
        // Limpiar contenido existente
        this.gridContainer.innerHTML = '';
        
        // Configurar CSS Grid
        this.gridContainer.style.gridTemplateColumns = `repeat(${this.gridSize.width}, 1fr)`;
        this.gridContainer.style.gridTemplateRows = `repeat(${this.gridSize.height}, 400px)`;
        
        // Crear mapa de posiciones ocupadas
        const occupiedPositions = new Map();
        this.artworks.forEach(artwork => {
            if (artwork.gridPosition) {
                const key = `${artwork.gridPosition.x}-${artwork.gridPosition.y}`;
                occupiedPositions.set(key, artwork);
            }
        });
        
        // Generar todas las celdas del grid
        for (let y = 0; y < this.gridSize.height; y++) {
            for (let x = 0; x < this.gridSize.width; x++) {
                const article = this.createGridCell(x, y, occupiedPositions);
                this.gridContainer.appendChild(article);
            }
        }
    }

    createGridCell(x, y, occupiedPositions) {
        const article = document.createElement('article');
        const positionKey = `${x}-${y}`;
        
        // Verificar si esta posiciÃ³n tiene una obra
        const artwork = occupiedPositions.get(positionKey);
        
        if (artwork && artwork.artist) {
            // Celda ocupada con obra
            article.classList.add('lleno');
            
            // Configurar data attributes para la modal
            article.dataset.artworkImg = artwork.image;
            article.dataset.artistName = artwork.artist.name;
            article.dataset.artworkTitle = artwork.title;
            article.dataset.creationDate = this.formatDate(artwork.createdAt);
            article.dataset.artistBio = artwork.artist.bio;
            article.dataset.artworkId = artwork.id;
            article.dataset.artistId = artwork.artistId;
            article.dataset.artworkDescription = artwork.description;
            
            // Crear imagen - RUTA PARA BACKEND
            const img = document.createElement('img');
            img.src = `http://localhost:5000/${artwork.image}`;
            img.alt = `Obra: ${artwork.title} por ${artwork.artist.name}`;
            img.loading = 'lazy'; // Lazy loading para performance
            
            // Prevenir drag de imÃ¡genes
            img.draggable = false;
            
            // Manejar errores de carga de imagen
            img.onerror = () => {
                console.warn(`âš ï¸ Error cargando imagen: ${artwork.image}`);
                img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
            };
            
            article.appendChild(img);
            
        } else {
            // Celda vacÃ­a
            article.classList.add('empty');
            article.dataset.position = `${x}-${y}`;
        }
        
        return article;
    }

    formatDate(isoDateString) {
        const date = new Date(isoDateString);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
        };
        return date.toLocaleDateString('es-ES', options);
    }

    initModalSystem() {
        // Elementos de la modal
        const modal = document.getElementById('artworkModal');
        const closeBtn = document.querySelector('.close');
        const modalImg = document.getElementById('modalArtworkImg');
        const modalTitle = document.getElementById('modalArtworkTitle');
        const modalArtist = document.getElementById('modalArtistName');
        const modalDate = document.getElementById('modalCreationDate');
        const modalBio = document.getElementById('modalArtistBio');
        
        // Todos los artÃ­culos con contenido (clase "lleno")
        const artworkItems = document.querySelectorAll('.lleno');
        
        // Agregar event listeners a cada artwork - MODIFICADO para drag scroll
        artworkItems.forEach(item => {
            item.addEventListener('mouseup', (e) => {
                // Solo abrir modal si NO hubo drag
                if (!this.dragScrollManager.dragStarted) {
                    this.openModal(item, modal, modalImg, modalTitle, modalArtist, modalDate, modalBio);
                }
            });
            
            // Efectos hover con 3D - solo si no se estÃ¡ dragging
            this.addHoverEffects(item);
        });
        
        // Event listeners para cerrar modal
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal(modal));
        }
        
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
        
        // Cerrar con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal?.style.display === 'block') {
                this.closeModal(modal);
            }
        });
        
        // Inicializar botones de la modal
        this.initModalButtons();
    }

    addHoverEffects(item) {
        // Configurar para el efecto 3D
        item.style.transformStyle = 'preserve-3d';
        
        item.addEventListener('mouseenter', function() {
            // Solo aplicar hover si no se estÃ¡ dragging
            if (!window.cadavrixGrid.dragScrollManager.isDragging) {
                this.style.zIndex = '10';
                this.style.transition = 'transform 0.1s ease-out, box-shadow 0.1s ease-out';
            }
        });
        
        item.addEventListener('mousemove', function(e) {
            // Solo aplicar efecto 3D si no se estÃ¡ dragging
            if (!window.cadavrixGrid.dragScrollManager.isDragging) {
                const rect = this.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                // Calcular la posiciÃ³n del mouse relativa al centro del elemento
                const mouseX = e.clientX - centerX;
                const mouseY = e.clientY - centerY;
                
                // Convertir a grados de rotaciÃ³n (mÃ¡ximo 12 grados para un efecto mÃ¡s sutil)
                const rotateX = (mouseY / (rect.height / 2)) * -12;
                const rotateY = (mouseX / (rect.width / 2)) * 12;
                
                // Aplicar transformaciÃ³n 3D con escala
                this.style.transform = `
                    perspective(1000px) 
                    rotateX(${rotateX}deg) 
                    rotateY(${rotateY}deg) 
                    scale3d(1.08, 1.08, 1.08)
                    translateZ(30px)
                `;
            }
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transition = 'transform 0.4s ease, box-shadow 0.4s ease, z-index 0s 0.4s';
            this.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1) translateZ(0px)';
            this.style.boxShadow = 'none';
            this.style.zIndex = '1';
            
            // Resetear efectos de la imagen
            const img = this.querySelector('img');
            if (img) {
                img.style.filter = 'none';
                img.style.transition = 'filter 0.3s ease';
            }
        });
    }

    openModal(artworkElement, modal, modalImg, modalTitle, modalArtist, modalDate, modalBio) {
        // Obtener datos del artwork
        const imgSrc = artworkElement.dataset.artworkImg;
        const artistName = artworkElement.dataset.artistName;
        const artworkTitle = artworkElement.dataset.artworkTitle;
        const creationDate = artworkElement.dataset.creationDate;
        const artistBio = artworkElement.dataset.artistBio;
        const artistId = artworkElement.dataset.artistId;
        const artworkDescription = artworkElement.dataset.artworkDescription;
        
        // Actualizar contenido de la modal - RUTA PARA BACKEND
        modalImg.src = `http://localhost:5000/${imgSrc}`;
        modalImg.alt = `Obra: ${artworkTitle} por ${artistName}`;
        modalTitle.textContent = artworkTitle;
        
        // Hacer el nombre del artista clickeable
        modalArtist.innerHTML = `por <a href="profile.html?artist=${artistId}" class="artist-link">${artistName}</a>`;
        
        modalDate.textContent = creationDate;
        modalBio.textContent = artistBio;
        
        // Agregar descripciÃ³n de la obra si existe
        let descriptionElement = modal.querySelector('.artwork-description');
        if (!descriptionElement) {
            descriptionElement = document.createElement('p');
            descriptionElement.className = 'artwork-description';
            modalBio.parentNode.insertBefore(descriptionElement, modalBio.nextSibling);
        }
        descriptionElement.textContent = artworkDescription || '';
        
        // Mostrar la modal
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // AnimaciÃ³n de entrada
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
    }

    closeModal(modal) {
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
        
        console.log('Artwork liked!');
    }

    handleShare(event) {
        const btn = event.target;
        const modalTitle = document.getElementById('modalArtworkTitle');
        const modalArtist = document.getElementById('modalArtistName');
        
        const artworkTitle = modalTitle?.textContent || 'Obra de arte';
        const artistName = modalArtist?.textContent || 'Artista';
        
        const shareText = `Â¡Mira esta increÃ­ble obra "${artworkTitle}" ${artistName} en Cadavrix!`;
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
                const originalText = btn.textContent;
                btn.textContent = 'ðŸ”— Â¡Copiado!';
                btn.style.backgroundColor = 'rgba(76, 175, 80, 0.8)';
                
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }, 2000);
            });
        } else {
            alert('URL copiada: ' + shareUrl);
        }
        
        console.log('ðŸ”— Share initiated for:', artworkTitle);
    }

    // MÃ©todo para agregar nuevas obras dinÃ¡micamente (para el futuro)
    addNewArtwork(artworkData, artistData) {
        // Agregar artista si no existe
        if (!this.artists.has(artistData.id)) {
            this.artists.set(artistData.id, artistData);
        }
        
        // Agregar obra
        const artwork = {
            ...artworkData,
            artist: artistData
        };
        this.artworks.set(artworkData.id, artwork);
        
        // Regenerar grid
        this.generateGrid();
        this.initModalSystem();
        
        console.log('ðŸŽ¨ Nueva obra agregada:', artworkData.title);
    }

    // Obtener estadÃ­sticas del grid
    getStatistics() {
        const totalCells = this.gridSize.width * this.gridSize.height;
        const occupiedCells = this.artworks.size;
        const emptyCells = totalCells - occupiedCells;
        const completionPercentage = (occupiedCells / totalCells) * 100;
        
        return {
            totalCells,
            occupiedCells,
            emptyCells,
            completionPercentage: Math.round(completionPercentage * 100) / 100,
            totalArtists: this.artists.size,
            totalArtworks: this.artworks.size
        };
    }

    // Métodos para UI de loading y errores
    showLoading() {
        // Crear elemento de loading si no existe
        let loadingEl = document.getElementById('grid-loading');
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.id = 'grid-loading';
            loadingEl.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Cargando obras desde el servidor...</p>
                </div>
            `;
            loadingEl.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            `;
            
            const spinnerStyle = document.createElement('style');
            spinnerStyle.textContent = `
                .loading-spinner { text-align: center; }
                .spinner { 
                    width: 50px; 
                    height: 50px; 
                    border: 4px solid #f3f4f6; 
                    border-top: 4px solid #667eea; 
                    border-radius: 50%; 
                    animation: spin 1s linear infinite; 
                    margin: 0 auto 1rem;
                }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .loading-spinner p { color: #6b7280; margin: 0; }
            `;
            document.head.appendChild(spinnerStyle);
            document.body.appendChild(loadingEl);
        }
        
        loadingEl.style.display = 'flex';
    }

    hideLoading() {
        const loadingEl = document.getElementById('grid-loading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }

    showError(message) {
        this.hideLoading();
        
        // Crear elemento de error
        let errorEl = document.getElementById('grid-error');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.id = 'grid-error';
            errorEl.style.cssText = `
                background: #fef2f2;
                border: 1px solid #fecaca;
                color: #dc2626;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                margin: 2rem;
                text-align: center;
            `;
            
            const gridContainer = document.querySelector('main section');
            if (gridContainer) {
                gridContainer.parentNode.insertBefore(errorEl, gridContainer);
            } else {
                document.querySelector('main').appendChild(errorEl);
            }
        }
        
        errorEl.innerHTML = `
            <h3 style="margin: 0 0 0.5rem 0; color: #dc2626;">Error de Conexión</h3>
            <p style="margin: 0 0 1rem 0;">${message}</p>
            <button onclick="window.location.reload()" 
                    style="background: #dc2626; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
                Reintentar
            </button>
        `;
        
        errorEl.style.display = 'block';
    }
}

// NUEVA CLASE: Sistema de Drag Scroll
class DragScrollManager {
    constructor() {
        this.isDragging = false;
        this.dragStarted = false;
        this.startX = 0;
        this.startY = 0;
        this.scrollLeft = 0;
        this.scrollTop = 0;
        this.dragThreshold = 8; // pÃ­xeles
        this.timeThreshold = 150; // ms
        this.mouseDownTime = 0;
        this.scrollContainer = null;
        
        // Bind methods
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
    }

    init(scrollContainer) {
        this.scrollContainer = scrollContainer;
        
        // Mouse events
        scrollContainer.addEventListener('mousedown', this.handleMouseDown);
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
        
        // Touch events para mÃ³viles
        scrollContainer.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd);
        
        // Prevenir selecciÃ³n de texto y drag de imÃ¡genes
        scrollContainer.style.userSelect = 'none';
        scrollContainer.style.webkitUserSelect = 'none';
        scrollContainer.style.webkitUserDrag = 'none';
        
        console.log('ðŸ–±ï¸ Drag Scroll Manager iniciado');
    }

    handleMouseDown(e) {
        // Solo iniciar si es click izquierdo
        if (e.button !== 0) return;
        
        this.isDragging = true;
        this.dragStarted = false;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.scrollLeft = this.scrollContainer.scrollLeft;
        this.scrollTop = this.scrollContainer.scrollTop;
        this.mouseDownTime = Date.now();
        
        // Cambiar cursor
        this.scrollContainer.style.cursor = 'grabbing';
        
        // No prevenir evento aquÃ­ para permitir clicks
    }

    handleMouseMove(e) {
        if (!this.isDragging) return;
        
        const deltaX = e.clientX - this.startX;
        const deltaY = e.clientY - this.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Verificar si se supera el umbral de drag
        if (distance > this.dragThreshold && !this.dragStarted) {
            this.dragStarted = true;
            
            // Prevenir eventos de hover en las celdas
            this.scrollContainer.classList.add('dragging');
            
            // Prevenir eventos posteriores
            e.preventDefault();
        }
        
        // Si ya empezÃ³ el drag, hacer scroll
        if (this.dragStarted) {
            e.preventDefault();
            
            this.scrollContainer.scrollLeft = this.scrollLeft - deltaX;
            this.scrollContainer.scrollTop = this.scrollTop - deltaY;
        }
    }

    handleMouseUp(e) {
        if (!this.isDragging) return;
        
        // Si hubo drag, prevenir click
        if (this.dragStarted) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        // Reset estado
        this.isDragging = false;
        this.scrollContainer.style.cursor = 'grab';
        this.scrollContainer.classList.remove('dragging');
        
        // PequeÃ±o delay para evitar clicks fantasma
        if (this.dragStarted) {
            setTimeout(() => {
                this.dragStarted = false;
            }, 100);
        } else {
            this.dragStarted = false;
        }
    }

    // Touch Events para mÃ³viles
    handleTouchStart(e) {
        if (e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        this.isDragging = true;
        this.dragStarted = false;
        this.startX = touch.clientX;
        this.startY = touch.clientY;
        this.scrollLeft = this.scrollContainer.scrollLeft;
        this.scrollTop = this.scrollContainer.scrollTop;
        this.mouseDownTime = Date.now();
    }

    handleTouchMove(e) {
        if (!this.isDragging || e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.startX;
        const deltaY = touch.clientY - this.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > this.dragThreshold && !this.dragStarted) {
            this.dragStarted = true;
            this.scrollContainer.classList.add('dragging');
        }
        
        if (this.dragStarted) {
            e.preventDefault();
            this.scrollContainer.scrollLeft = this.scrollLeft - deltaX;
            this.scrollContainer.scrollTop = this.scrollTop - deltaY;
        }
    }

    handleTouchEnd(e) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.scrollContainer.classList.remove('dragging');
        
        if (this.dragStarted) {
            setTimeout(() => {
                this.dragStarted = false;
            }, 100);
        } else {
            this.dragStarted = false;
        }
    }
}

// Inicializar cuando el DOM estÃ© listo
document.addEventListener('DOMContentLoaded', async () => {
    const cadavrixGrid = new CadavrixGrid();
    await cadavrixGrid.init();
    
    // Hacer disponible globalmente para debugging
    window.cadavrixGrid = cadavrixGrid;
    
    // Mostrar estadÃ­sticas en consola
    const stats = cadavrixGrid.getStatistics();
    console.log('ðŸ“ˆ EstadÃ­sticas del Grid:', stats);
});