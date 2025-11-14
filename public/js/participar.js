// Sistema de Participación para Cadavrix
class ParticipacionManager {
    constructor() {
        this.apiBaseUrl = window.CadavrixConfig.API_BASE_URL;
        this.currentUser = null;
        this.gridData = null;
        this.cellAssignment = null;
    }

    async init() {
        console.log('🎲 Inicializando sistema de participación...');
        
        // Verificar autenticación
        if (!this.checkAuthentication()) {
            this.showStep('notAuthenticated');
            return;
        }

        // Cargar datos del usuario
        this.currentUser = this.getUser();
        
        // Cargar datos del grid
        await this.loadGridData();
        
        // Verificar estado del artista
        await this.checkArtistStatus();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        console.log('✅ Sistema de participación listo');
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

    async loadGridData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/grid`);
            const data = await response.json();
            
            if (data.success) {
                this.gridData = data.data;
                this.updateGridStats();
                console.log('📊 Datos del grid cargados');
            }
        } catch (error) {
            console.error('❌ Error cargando grid:', error);
        }
    }

    updateGridStats() {
        if (!this.gridData) return;
        
        const stats = {
            totalCells: this.gridData.dimensions.totalCells,
            occupiedCells: this.gridData.cells.filter(cell => cell.status === 'occupied').length,
            assignedCells: this.gridData.cells.filter(cell => cell.status === 'assigned').length,
            emptyCells: this.gridData.cells.filter(cell => cell.status === 'empty').length
        };
        
        stats.availableCells = stats.emptyCells;
        stats.progressPercent = Math.round((stats.occupiedCells / stats.totalCells) * 100);
        
        // Actualizar UI
        document.getElementById('totalCells').textContent = stats.totalCells;
        document.getElementById('occupiedCells').textContent = stats.occupiedCells;
        document.getElementById('availableCells').textContent = stats.availableCells;
        document.getElementById('progressPercent').textContent = `${stats.progressPercent}%`;
    }

    async checkArtistStatus() {
        try {
            // Verificar si ya tiene celda asignada
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
                    await this.showArtworkSubmitted(artist);
                } else if (artist.assignedCell) {
                    // Tiene celda asignada pero no ha subido obra
                    this.showCellAssigned(artist.assignedCell);
                } else {
                    // No tiene celda asignada
                    this.showNoCellAssigned(artist);
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

    showNoCellAssigned(artist) {
        // Mostrar nombre del artista
        document.getElementById('artistName').textContent = artist.name;
        
        this.showStep('noCellAssigned');
        console.log('🎲 Estado: Sin celda asignada');
    }

    showCellAssigned(assignedCell) {
        // Actualizar información de la celda
        document.getElementById('cellX').textContent = assignedCell.x;
        document.getElementById('cellY').textContent = assignedCell.y;
        
        // Generar mini grid
        this.generateMiniGrid(assignedCell);
        
        // Cargar información de vecinos
        this.loadNeighbors(assignedCell.x, assignedCell.y);
        
        this.showStep('cellAssigned');
        console.log(`✅ Estado: Celda asignada en (${assignedCell.x}, ${assignedCell.y})`);
    }

    async showArtworkSubmitted(artist) {
        // Cargar información de la obra subida
        try {
            console.log('🎨 Cargando obra del artista para participar.html...');
            
            // Usar la ruta por posición en lugar de by-artist
            const response = await fetch(`${this.apiBaseUrl}/artworks/position/${artist.assignedCell.x}/${artist.assignedCell.y}`);
            const data = await response.json();
            
            if (data.success && data.data) {
                const artwork = data.data;
                console.log('✅ Obra encontrada:', artwork.title);
                
                // Actualizar elementos con los IDs correctos del participar.html
                const submittedImage = document.getElementById('submittedImage');
                const artworkTitle = document.getElementById('artworkTitle'); 
                const artworkDescription = document.getElementById('artworkDescription');
                const artworkX = document.getElementById('artworkX');
                const artworkY = document.getElementById('artworkY');
                
                if (submittedImage) {
                    submittedImage.src = `${this.apiBaseUrl.replace('/api', '')}/${artwork.image}`;
                    submittedImage.alt = artwork.title;
                    console.log('🖼️ Imagen src actualizada en participar:', submittedImage.src);
                }
                
                if (artworkTitle) {
                    artworkTitle.textContent = artwork.title;
                }
                
                if (artworkDescription) {
                    artworkDescription.textContent = artwork.description;
                }
                
                if (artworkX) {
                    artworkX.textContent = artwork.gridPosition.x;
                }
                
                if (artworkY) {
                    artworkY.textContent = artwork.gridPosition.y;
                }
                
                console.log('✅ Datos actualizados en participar.html');
                
            } else {
                console.log('⚠️ No se encontró obra en participar.html');
            }
        } catch (error) {
            console.error('❌ Error cargando obra en participar:', error);
        }
        
        this.showStep('artworkSubmitted');
        console.log('🎉 Estado: Obra ya subida (participar)');
    }

    generateMiniGrid(assignedCell) {
        const miniGrid = document.getElementById('miniGrid');
        if (!miniGrid || !this.gridData) return;
        
        miniGrid.innerHTML = '';
        
        const gridSize = Math.min(this.gridData.dimensions.width, this.gridData.dimensions.height, 10);
        miniGrid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'mini-cell';
                
                // Buscar el estado de esta celda
                const gridCell = this.gridData.cells.find(c => c.position.x === x && c.position.y === y);
                
                if (x === assignedCell.x && y === assignedCell.y) {
                    cell.classList.add('your-cell');
                } else if (gridCell?.status === 'occupied') {
                    cell.classList.add('occupied-cell');
                } else if (gridCell?.status === 'assigned') {
                    cell.classList.add('assigned-cell');
                } else {
                    cell.classList.add('empty-cell');
                }
                
                miniGrid.appendChild(cell);
            }
        }
    }

    async loadNeighbors(x, y) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/grid/cell/${x}/${y}/neighbors`);
            const data = await response.json();
            
            if (data.success) {
                this.displayNeighbors(data.data);
            }
        } catch (error) {
            console.error('❌ Error cargando vecinos:', error);
        }
    }

    displayNeighbors(neighbors) {
        const neighborsList = document.getElementById('neighborsList');
        if (!neighborsList) return;
        
        neighborsList.innerHTML = '';
        
        const directions = ['topLeft', 'top', 'topRight', 'left', 'center', 'right', 'bottomLeft', 'bottom', 'bottomRight'];
        
        directions.forEach(direction => {
            const cell = document.createElement('div');
            cell.className = 'neighbor-cell';
            
            if (direction === 'center') {
                cell.innerHTML = '<strong>TÚ</strong>';
                cell.classList.add('your-position');
            } else {
                const neighbor = neighbors.find(n => n.direction === direction);
                
                if (neighbor && neighbor.cell.artworkId) {
                    cell.innerHTML = `
                        <div class="neighbor-occupied">
                            <span class="neighbor-direction">${this.getDirectionName(direction)}</span>
                            <span class="neighbor-status">🎨 Ocupada</span>
                        </div>
                    `;
                    cell.classList.add('has-artwork');
                } else {
                    cell.innerHTML = `
                        <div class="neighbor-empty">
                            <span class="neighbor-direction">${this.getDirectionName(direction)}</span>
                            <span class="neighbor-status">⬜ Vacía</span>
                        </div>
                    `;
                    cell.classList.add('empty');
                }
            }
            
            neighborsList.appendChild(cell);
        });
    }

    getDirectionName(direction) {
        const names = {
            'topLeft': '↖️',
            'top': '⬆️',
            'topRight': '↗️',
            'left': '⬅️',
            'right': '➡️',
            'bottomLeft': '↙️',
            'bottom': '⬇️',
            'bottomRight': '↘️'
        };
        return names[direction] || direction;
    }

    setupEventListeners() {
        // Botón asignar celda
        const assignBtn = document.getElementById('assignCellBtn');
        if (assignBtn) {
            assignBtn.addEventListener('click', () => this.assignCell());
        }
        
        // Botón generar template
        const templateBtn = document.getElementById('generateTemplateBtn');
        if (templateBtn) {
            templateBtn.addEventListener('click', () => this.generateTemplate());
        }
    }

    async assignCell() {
        const button = document.getElementById('assignCellBtn');
        const originalText = button.textContent;
        
        try {
            // Mostrar loading
            button.textContent = '🎲 Asignando...';
            button.disabled = true;
            
            const response = await fetch(`${this.apiBaseUrl}/grid/assign`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                console.log('✅ Celda asignada:', data.data.position);
                this.cellAssignment = data.data;
                
                // Esperar un momento y cambiar estado
                setTimeout(() => {
                    this.showCellAssigned(data.data.position);
                }, 1000);
                
            } else {
                alert('❌ Error: ' + data.message);
                button.textContent = originalText;
                button.disabled = false;
            }
            
        } catch (error) {
            console.error('❌ Error asignando celda:', error);
            alert('❌ Error de conexión');
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    async generateTemplate() {
        const button = document.getElementById('generateTemplateBtn');
        const originalText = button.textContent;
        
        const x = document.getElementById('cellX').textContent;
        const y = document.getElementById('cellY').textContent;
        
        try {
            // Mostrar loading
            button.textContent = '📥 Generando...';
            button.disabled = true;
            
            const response = await fetch(`${this.apiBaseUrl}/grid/template/${x}/${y}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Descargar template usando método avanzado
                const templateUrl = `${this.apiBaseUrl.replace('/api', '')}/${data.data.templatePath}`;
                await this.downloadTemplate(templateUrl, `cadavrix-template-${x}-${y}.webp`);
                
                button.textContent = '✅ ¡Descargado!';
                
                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = false;
                }, 3000);
                
            } else {
                alert('❌ Error: ' + data.message);
                button.textContent = originalText;
                button.disabled = false;
            }
            
        } catch (error) {
            console.error('❌ Error generando template:', error);
            alert('❌ Error de conexión');
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    async downloadTemplate(url, filename) {
        try {
            // Descargar usando fetch (sin navegar)
            console.log(`📥 Iniciando descarga desde: ${url}`);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const blob = await response.blob();
            
            // Crear URL temporal
            const blobUrl = window.URL.createObjectURL(blob);
            
            // Crear link de descarga
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Limpiar URL temporal después de un momento
            setTimeout(() => {
                window.URL.revokeObjectURL(blobUrl);
            }, 1000);
            
            console.log(`✅ Template descargado exitosamente: ${filename}`);
            
        } catch (error) {
            console.error('❌ Error descargando template con fetch:', error);
            
            // Fallback: abrir en nueva pestaña
            console.log('🔄 Usando método fallback...');
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.target = '_blank';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log(`📥 Template abierto en nueva pestaña: ${filename}`);
        }
    }

    // Método público para refrescar estado
    async refresh() {
        await this.checkArtistStatus();
    }
}

// Crear instancia global
window.ParticipacionManager = new ParticipacionManager();

// Auto-inicializar
document.addEventListener('DOMContentLoaded', async () => {
    await window.ParticipacionManager.init();
});

console.log('🎲 ParticipacionManager cargado');