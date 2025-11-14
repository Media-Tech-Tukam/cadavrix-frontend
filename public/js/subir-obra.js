// Sistema de Upload de Obras para Cadavrix
class SubirObraManager {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5000/api';
        this.currentUser = null;
        this.selectedFile = null;
        this.assignedCell = null;
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    }

    async init() {
        console.log('📤 Inicializando sistema de upload...');
        
        // Verificar autenticación
        if (!this.checkAuthentication()) {
            this.showStep('notAuthenticated');
            return;
        }

        // Cargar datos del usuario
        this.currentUser = this.getUser();
        
        // Verificar estado del artista
        await this.checkArtistStatus();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        console.log('✅ Sistema de upload listo');
    }

    checkAuthentication() {
        const token = localStorage.getItem('cadavrix_token');
        const user = localStorage.getItem('cadavrix_user');
        return !!(token && user);
    }

    getUser() {
        try {
            const userStr = localStorage.getItem('cadavrix_user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('❌ Error obteniendo usuario:', error);
            return null;
        }
    }

    getAuthToken() {
        return localStorage.getItem('cadavrix_token');
    }

    async checkArtistStatus() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            const data = await response.json();
            
            if (data.success && data.data.artist) {
                const artist = data.data.artist;
                
                if (artist.hasSubmittedArtwork) {
                    // Ya subió obra
                    this.showArtworkAlreadySubmitted(artist);
                } else if (artist.assignedCell) {
                    // Tiene celda, puede subir obra
                    this.assignedCell = artist.assignedCell;
                    this.showUploadForm(artist);
                } else {
                    // No tiene celda asignada
                    this.showStep('noCellAssigned');
                }
            } else {
                this.showStep('notAuthenticated');
            }
            
        } catch (error) {
            console.error('❌ Error verificando estado del artista:', error);
            this.showStep('notAuthenticated');
        }
    }

    showStep(stepId) {
        // Ocultar todos los pasos
        document.querySelectorAll('.step-container').forEach(step => {
            step.classList.add('hidden');
        });
        
        // Mostrar paso específico
        const step = document.getElementById(stepId);
        if (step) {
            step.classList.remove('hidden');
        }
    }

    showUploadForm(artist) {
        // Actualizar información del artista y celda
        const assignedCellX = document.getElementById('assignedCellX');
        const assignedCellY = document.getElementById('assignedCellY');
        
        if (assignedCellX) {
            assignedCellX.textContent = this.assignedCell.x;
        }
        
        if (assignedCellY) {
            assignedCellY.textContent = this.assignedCell.y;
        }
        
        this.showStep('uploadForm');
        console.log(`📤 Listo para subir obra en celda (${this.assignedCell.x}, ${this.assignedCell.y})`);
    }

    showArtworkAlreadySubmitted(artist) {
        // MÉTODO ACTUALIZADO - Ver línea 550 para la versión completa
        this.showStep('artworkExists'); // Cambiar de 'artworkSubmitted' a 'artworkExists'
        console.log('🎉 Artista ya subió su obra');
    }

    setupEventListeners() {
        // Input de archivo
        const fileInput = document.getElementById('imageFile');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                console.log('📁 Archivo seleccionado desde input');
                this.handleFileSelect(e);
            });
        }

        // Área de drop
        const dropArea = document.getElementById('uploadArea');
        if (dropArea) {
            this.setupDragAndDrop(dropArea, fileInput);
        }

        // Formulario de upload
        const uploadForm = document.getElementById('artworkForm');
        if (uploadForm) {
            uploadForm.addEventListener('submit', (e) => this.handleUpload(e));
        }

        // Botón de cambiar imagen
        const changeBtn = document.getElementById('changeImageBtn');
        if (changeBtn) {
            changeBtn.addEventListener('click', () => this.clearSelectedImage());
        }
    }

    setupDragAndDrop(dropArea, fileInput) {
        // Prevenir comportamientos por defecto
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        // Efectos visuales durante drag
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => {
                dropArea.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => {
                dropArea.classList.remove('drag-over');
            });
        });

        // Manejar drop
        dropArea.addEventListener('drop', (e) => {
            console.log('📁 Archivo dropeado');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                // Crear evento sintético para handleFileSelect
                const fakeEvent = { target: { files } };
                this.handleFileSelect(fakeEvent);
            }
        });

        // Click para abrir selector
        dropArea.addEventListener('click', () => {
            fileInput.click();
        });
    }

    handleFileSelect(event) {
        console.log('🔍 handleFileSelect llamado');
        const file = event.target.files[0];
        
        if (!file) {
            console.log('❌ No hay archivo seleccionado');
            this.clearSelectedImage();
            return;
        }

        console.log('📁 Archivo detectado:', file.name, file.size);

        // Validar archivo
        if (!this.validateFile(file)) {
            console.log('❌ Archivo no válido');
            return;
        }

        // ASIGNAR ARCHIVO CORRECTAMENTE
        this.selectedFile = file;
        console.log('✅ selectedFile asignado:', this.selectedFile.name);
        
        this.showImagePreview(file);
        this.updateUploadButton(true);
        
        console.log('📊 Estado después de selección:');
        console.log('- selectedFile:', !!this.selectedFile);
        console.log('- updateUploadButton llamado con:', true);
    }

    validateFile(file) {
        // Validar tipo
        if (!this.allowedTypes.includes(file.type)) {
            this.showError('Tipo de archivo no válido. Solo se permiten: JPG, PNG, WebP');
            return false;
        }

        // Validar tamaño
        if (file.size > this.maxFileSize) {
            this.showError(`Archivo muy grande. Máximo permitido: ${this.maxFileSize / 1024 / 1024}MB`);
            return false;
        }

        return true;
    }

    showImagePreview(file) {
        const previewContainer = document.getElementById('imagePreview');
        const previewImage = document.getElementById('previewImage');
        const imageSpecs = document.getElementById('imageSpecs');
        const uploadArea = document.getElementById('uploadArea');
        
        if (!previewContainer || !previewImage) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            
            if (imageSpecs) {
                imageSpecs.textContent = `${file.name} • ${this.formatFileSize(file.size)}`;
            }
            
            // Ocultar upload area y mostrar preview
            if (uploadArea) {
                uploadArea.style.display = 'none';
            }
            previewContainer.classList.remove('hidden');
            
            // Reconfigurar event listener del botón cambiar
            const changeBtn = document.getElementById('changeImageBtn');
            if (changeBtn) {
                changeBtn.removeEventListener('click', this.clearSelectedImage);
                changeBtn.addEventListener('click', () => this.clearSelectedImage());
            }
        };
        
        reader.readAsDataURL(file);
    }

    clearSelectedImage() {
        this.selectedFile = null;
        
        const previewContainer = document.getElementById('imagePreview');
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('imageFile');
        const previewImage = document.getElementById('previewImage');
        
        if (previewContainer) {
            previewContainer.classList.add('hidden');
        }
        
        if (previewImage) {
            previewImage.src = '';
        }
        
        if (uploadArea) {
            uploadArea.style.display = 'block';
        }
        
        if (fileInput) {
            fileInput.value = '';
        }
        
        this.updateUploadButton(false);
    }

    updateUploadButton(hasImage) {
        console.log('🔍 updateUploadButton llamado con hasImage:', hasImage);
        
        const submitBtn = document.querySelector('button[type="submit"]');
        const titleInput = document.getElementById('artworkTitle'); // ← CORREGIDO
        const descriptionInput = document.getElementById('artworkDescription'); // ← CORREGIDO
        
        console.log('📊 Estado de campos:');
        console.log('- submitBtn encontrado:', !!submitBtn);
        console.log('- titleInput encontrado:', !!titleInput);
        console.log('- descriptionInput encontrado:', !!descriptionInput);
        
        if (submitBtn && titleInput && descriptionInput) {
            const titleValue = titleInput.value.trim();
            const descriptionValue = descriptionInput.value.trim();
            
            console.log('📝 Valores:');
            console.log('- hasImage:', hasImage);
            console.log('- titleValue:', `"${titleValue}"` + (titleValue.length > 0 ? ' ✅' : ' ❌'));
            console.log('- descriptionValue:', `"${descriptionValue.substring(0, 30)}..."` + (descriptionValue.length > 0 ? ' ✅' : ' ❌'));
            
            const hasTitle = titleValue.length > 0;
            const hasDescription = descriptionValue.length > 0;
            const canSubmit = hasImage && hasTitle && hasDescription;
            
            console.log('🎯 Resultado: canSubmit =', canSubmit);
            
            submitBtn.disabled = !canSubmit;
            submitBtn.textContent = canSubmit ? '📤 Subir Mi Obra' : '📤 Completa todos los campos';
            
            console.log('✅ Botón actualizado - disabled:', submitBtn.disabled, 'text:', submitBtn.textContent);
        } else {
            console.log('❌ No se encontraron todos los elementos necesarios');
        }
    }

    async handleUpload(event) {
        event.preventDefault();
        
        if (!this.selectedFile) {
            this.showError('Por favor selecciona una imagen');
            return;
        }

        if (!this.assignedCell) {
            this.showError('No tienes una celda asignada');
            return;
        }

        const formData = new FormData();
        const form = event.target;
        
        // Agregar datos del formulario
        formData.append('image', this.selectedFile); // Cambiar de 'file' a 'image'
        formData.append('title', form.artworkTitle.value.trim());
        formData.append('description', form.artworkDescription.value.trim());
        formData.append('gridX', this.assignedCell.x);
        formData.append('gridY', this.assignedCell.y);

        try {
            this.showUploadProgress(true);
            
            const response = await fetch(`${this.apiBaseUrl}/artworks`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.showUploadSuccess(data.data);
            } else {
                this.showError(data.message || 'Error al subir la obra');
            }

        } catch (error) {
            console.error('❌ Error subiendo obra:', error);
            this.showError('Error de conexión. Inténtalo de nuevo.');
        } finally {
            this.showUploadProgress(false);
        }
    }

    showUploadProgress(uploading) {
        const submitBtn = document.querySelector('button[type="submit"]');
        const progressContainer = document.getElementById('uploadProgress');
        
        if (submitBtn) {
            submitBtn.disabled = uploading;
            submitBtn.textContent = uploading ? '⏳ Subiendo...' : '📤 Subir Mi Obra';
        }
        
        if (progressContainer) {
            if (uploading) {
                progressContainer.classList.remove('hidden');
                progressContainer.innerHTML = `
                    <div class="upload-spinner"></div>
                    <p>Procesando tu obra de arte...</p>
                    <small>Esto puede tomar unos segundos</small>
                `;
            } else {
                progressContainer.classList.add('hidden');
            }
        }
    }

    showUploadSuccess(artwork) {
        // Mostrar éxito temporalmente
        const successContainer = document.getElementById('uploadSuccess');
        if (successContainer) {
            successContainer.innerHTML = `
                <div class="success-animation">
                    <div class="success-icon">🎉</div>
                    <h3>¡Obra Subida Exitosamente!</h3>
                    <p><strong>"${artwork.title}"</strong> ahora forma parte del cadáver exquisito.</p>
                    <div class="success-actions">
                        <a href="index.html" class="btn-primary">Ver en el Grid</a>
                        <a href="profile.html?artist=${artwork.artistId}" class="btn-secondary">Mi Perfil</a>
                    </div>
                </div>
            `;
            successContainer.classList.remove('hidden');
        }

        // Redirigir después de unos segundos
        setTimeout(() => {
            window.location.href = `index.html#cell-${artwork.gridPosition.x}-${artwork.gridPosition.y}`;
        }, 3000);

        console.log('✅ Obra subida exitosamente:', artwork.title);
    }

    showError(message) {
        const errorContainer = document.getElementById('uploadError');
        
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="error-message">
                    <span class="error-icon">❌</span>
                    <span>${message}</span>
                    <button class="error-close" onclick="this.parentElement.parentElement.classList.add('hidden')">&times;</button>
                </div>
            `;
            errorContainer.classList.remove('hidden');
            
            // Auto-ocultar después de 5 segundos
            setTimeout(() => {
                errorContainer.classList.add('hidden');
            }, 5000);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Validación en tiempo real de formulario
    setupFormValidation() {
        const titleInput = document.getElementById('artworkTitle');
        const descriptionInput = document.getElementById('artworkDescription');
        
        if (titleInput) {
            titleInput.addEventListener('input', () => this.updateUploadButton(!!this.selectedFile));
        }
        
        if (descriptionInput) {
            descriptionInput.addEventListener('input', () => {
                this.updateUploadButton(!!this.selectedFile);
                this.updateCharacterCount();
            });
        }
    }

    updateCharacterCount() {
        const descriptionInput = document.getElementById('artworkDescription');
        const countEl = document.getElementById('descriptionCount');
        
        if (descriptionInput && countEl) {
            const length = descriptionInput.value.length;
            countEl.textContent = `${length}/1000 caracteres`;
            
            if (length > 1000) {
                countEl.style.color = '#dc2626';
            } else if (length > 900) {
                countEl.style.color = '#f59e0b';
            } else {
                countEl.style.color = '#6b7280';
            }
        }
    }

    // Método público para refrescar estado
    async refresh() {
        await this.checkArtistStatus();
    }
}

// Crear instancia global
window.SubirObraManager = new SubirObraManager();

// Auto-inicializar
document.addEventListener('DOMContentLoaded', async () => {
    await window.SubirObraManager.init();
    window.SubirObraManager.setupFormValidation();
});

console.log('📤 SubirObraManager cargado');

// MÉTODO CORREGIDO - Reemplaza al showArtworkAlreadySubmitted original
SubirObraManager.prototype.showArtworkAlreadySubmitted = async function(artist) {
    try {
        console.log('🎨 Cargando obra existente del artista...');
        
        // Buscar la obra del artista en su celda asignada
        const response = await fetch(`${this.apiBaseUrl}/artworks/position/${artist.assignedCell.x}/${artist.assignedCell.y}`);
        const data = await response.json();
        
        if (data.success && data.data) {
            const artwork = data.data;
            console.log('✅ Obra encontrada:', artwork.title);
            
            // Actualizar elementos del DOM
            const elements = {
                currentArtworkImage: document.getElementById('currentArtworkImage'),
                currentArtworkTitle: document.getElementById('currentArtworkTitle'),
                currentArtworkDescription: document.getElementById('currentArtworkDescription'),
                currentArtworkX: document.getElementById('currentArtworkX'),
                currentArtworkY: document.getElementById('currentArtworkY'),
                currentArtworkDate: document.getElementById('currentArtworkDate')
            };
            
            // Llenar datos si los elementos existen
            if (elements.currentArtworkImage) {
                elements.currentArtworkImage.src = `${this.apiBaseUrl.replace('/api', '')}/${artwork.image}`;
                elements.currentArtworkImage.alt = artwork.title;
                console.log('🖼️ Imagen src actualizada:', elements.currentArtworkImage.src);
            }
            
            if (elements.currentArtworkTitle) {
                elements.currentArtworkTitle.textContent = artwork.title;
            }
            
            if (elements.currentArtworkDescription) {
                elements.currentArtworkDescription.textContent = artwork.description;
            }
            
            if (elements.currentArtworkX) {
                elements.currentArtworkX.textContent = artwork.gridPosition.x;
            }
            
            if (elements.currentArtworkY) {
                elements.currentArtworkY.textContent = artwork.gridPosition.y;
            }
            
            if (elements.currentArtworkDate) {
                const date = new Date(artwork.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                elements.currentArtworkDate.textContent = date;
            }
            
            console.log('✅ Datos de obra actualizados en el DOM');
            
        } else {
            console.log('⚠️ No se encontró obra en la posición del artista');
        }
        
    } catch (error) {
        console.error('❌ Error cargando obra existente:', error);
    }
    
    this.showStep('artworkExists');
    console.log('🎉 Mostrando estado: Ya subió obra');
};