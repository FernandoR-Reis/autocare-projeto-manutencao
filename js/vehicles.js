/**
 * Vehicles Module (Atualizado com Cancelar e Logos)
 */

const Vehicles = {
    currentFilter: 'all',
    vehicleImages: new Map(),
    isInitialized: false,
    
    init() {
        if (this.isInitialized) {
            this.render();
            return;
        }
        this.isInitialized = true;
        
        this.bindEvents();
        this.loadVehicleImages();
        this.render();
    },

    async loadVehicleImages() {
        for (const vehicle of AppState.vehicles) {
            const imageUrl = await ImagesAPI.getVehicleImage(vehicle.brand, vehicle.model);
            this.vehicleImages.set(vehicle.id, imageUrl);
        }
    },
    
    bindEvents() {
        // Botões de adicionar - clonar para evitar duplicação
        const bindButton = (id, handler) => {
            const btn = document.getElementById(id);
            if (btn) {
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                newBtn.addEventListener('click', handler);
            }
        };
        
        bindButton('btn-add-vehicle', () => this.openModal());
        bindButton('btn-quick-add-vehicle', () => this.openModal());
        bindButton('btn-empty-add-vehicle', () => this.openModal());
        
        // Filtro
        const filterSelect = document.getElementById('vehicle-filter');
        if (filterSelect) {
            const newSelect = filterSelect.cloneNode(true);
            filterSelect.parentNode.replaceChild(newSelect, filterSelect);
            newSelect.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.render();
            });
        }
        
        // Formulário - CRÍTICO: submit único
        const form = document.getElementById('form-add-vehicle');
        if (form) {
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            newForm.addEventListener('submit', (e) => this.handleSubmit(e));
            
            // NOVO: Botão cancelar funcional
            const cancelBtn = newForm.querySelector('.btn-cancel-vehicle');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleCancel();
                });
            }
        }
        
        // Preview de imagem
        document.getElementById('vehicle-brand')?.addEventListener('change', () => {
            this.updateImagePreview();
            this.updateBrandLogo(); // NOVO: Atualizar logo
        });
        
        document.getElementById('vehicle-model')?.addEventListener('input', 
            Utils.debounce(() => this.updateImagePreview(), 500));
    },
    
    // NOVO: Atualizar logo da marca no select customizado
    updateBrandLogo() {
        const brand = document.getElementById('vehicle-brand')?.value;
        const logoContainer = document.getElementById('brand-logo-display');
        
        if (!logoContainer) return;
        
        const logoUrl = Config.getBrandLogo(brand);
        
        if (logoUrl) {
            logoContainer.innerHTML = `
                <img src="${logoUrl}" alt="${brand}" class="w-12 h-12 object-contain" 
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                <div class="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center hidden">
                    <i class="fas fa-car text-gray-400"></i>
                </div>
            `;
            logoContainer.classList.remove('hidden');
        } else if (brand) {
            logoContainer.innerHTML = `
                <div class="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <i class="fas fa-car text-gray-400 text-xl"></i>
                </div>
            `;
            logoContainer.classList.remove('hidden');
        } else {
            logoContainer.classList.add('hidden');
        }
    },
    
    async updateImagePreview() {
        const brand = document.getElementById('vehicle-brand')?.value;
        const model = document.getElementById('vehicle-model')?.value;
        
        if (!brand) return;
        
        const previewContainer = document.getElementById('vehicle-image-preview');
        if (!previewContainer) return;
        
        previewContainer.classList.remove('hidden');
        previewContainer.innerHTML = '<div class="animate-pulse bg-gray-200 h-32 rounded-lg"></div>';
        
        const imageUrl = await ImagesAPI.getVehicleImage(brand, model || 'car');
        
        previewContainer.innerHTML = `
            <label class="block text-sm font-semibold text-gray-700 mb-2">Preview do Veículo</label>
            <img src="${imageUrl}" alt="${brand} ${model}" 
                class="w-full h-32 object-cover rounded-lg shadow-md"
                onerror="this.src='${ImagesAPI.getPlaceholder(400, 200, brand)}'">
        `;
    },
    
    openModal() {
        const form = document.getElementById('form-add-vehicle');
        if (form) {
            form.reset();
            // NOVO: Resetar logo
            const logoContainer = document.getElementById('brand-logo-display');
            if (logoContainer) {
                logoContainer.innerHTML = '';
                logoContainer.classList.add('hidden');
            }
        }
        
        const preview = document.getElementById('vehicle-image-preview');
        if (preview) {
            preview.innerHTML = '';
            preview.classList.add('hidden');
        }
        
        const modal = document.getElementById('modal-vehicle');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    },
    
    // NOVO: Fechar modal sem salvar
    closeModal() {
        const modal = document.getElementById('modal-vehicle');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        
        // Limpar formulário completamente
        const form = document.getElementById('form-add-vehicle');
        if (form) {
            form.reset();
            
            // Limpar preview
            const preview = document.getElementById('vehicle-image-preview');
            if (preview) {
                preview.innerHTML = '';
                preview.classList.add('hidden');
            }
            
            // Limpar logo
            const logoContainer = document.getElementById('brand-logo-display');
            if (logoContainer) {
                logoContainer.innerHTML = '';
                logoContainer.classList.add('hidden');
            }
        }
    },
    
    // NOVO: Handler do cancelar
    handleCancel() {
        console.log('Cancelando criação de veículo...');
        
        // Confirmar se há dados preenchidos
        const brand = document.getElementById('vehicle-brand')?.value;
        const model = document.getElementById('vehicle-model')?.value;
        
        if (brand || model) {
            if (!confirm('Deseja realmente cancelar? Os dados preenchidos serão perdidos.')) {
                return;
            }
        }
        
        // Fechar modal e limpar
        this.closeModal();
        
        // Redirecionar para lista de veículos
        Navigation.showSection('vehicles');
        
        UI.showToast('Operação cancelada', 'info');
    },
    
    async handleSubmit(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<div class="spinner inline-block mr-2"></div> Salvando...';
        }
        
        const vehicle = {
            id: Utils.generateId(),
            nickname: Utils.sanitizeString(document.getElementById('vehicle-nickname')?.value),
            brand: document.getElementById('vehicle-brand')?.value,
            model: Utils.sanitizeString(document.getElementById('vehicle-model')?.value),
            year: parseInt(document.getElementById('vehicle-year')?.value),
            plate: document.getElementById('vehicle-plate')?.value?.toUpperCase(),
            km: parseInt(document.getElementById('vehicle-km')?.value) || 0,
            fuel: document.getElementById('vehicle-fuel')?.value,
            imageUrl: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            kmHistory: []
        };
        
        // Validações
        if (!Utils.isValidPlate(vehicle.plate)) {
            UI.showToast('Placa inválida', 'error');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Salvar Veículo';
            }
            return;
        }
        
        const exists = AppState.vehicles.some(v => v.plate === vehicle.plate);
        if (exists) {
            UI.showToast('Já existe um veículo com esta placa', 'error');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Salvar Veículo';
            }
            return;
        }
        
        // Buscar imagem
        try {
            vehicle.imageUrl = await ImagesAPI.getVehicleImage(vehicle.brand, vehicle.model);
            this.vehicleImages.set(vehicle.id, vehicle.imageUrl);
        } catch (error) {
            vehicle.imageUrl = ImagesAPI.getPlaceholder(400, 300, `${vehicle.brand} ${vehicle.model}`);
        }
        
        AppState.vehicles.push(vehicle);
        AppState.saveToStorage();
        
        this.closeModal();
        this.render();
        Dashboard.updateStats();
        UI.showToast('Veículo adicionado com sucesso!', 'success');
        
        Notifications.add('vehicle_added', 'Veículo adicionado', `${vehicle.brand} ${vehicle.model} foi cadastrado.`);
        
        // Redirecionar para lista de veículos
        Navigation.showSection('vehicles');
        
        setTimeout(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Salvar Veículo';
            }
        }, 500);
    },
    
    delete(id) {
        if (!confirm('Tem certeza que deseja excluir este veículo? Todas as manutenções associadas também serão removidas.')) {
            return;
        }
        
        AppState.vehicles = AppState.vehicles.filter(v => v.id !== id);
        this.vehicleImages.delete(id);
        AppState.maintenances = AppState.maintenances.filter(m => m.vehicleId !== id);
        AppState.saveToStorage();
        
        this.render();
        Dashboard.updateStats();
        UI.showToast('Veículo removido com sucesso!', 'success');
    },
    
    openUpdateKmModal(vehicleId) {
        const vehicle = AppState.vehicles.find(v => v.id === vehicleId);
        if (!vehicle) return;
        
        document.getElementById('update-km-vehicle-id').value = vehicleId;
        
        const nameElement = document.getElementById('update-km-vehicle-name');
        const imageUrl = this.vehicleImages.get(vehicleId) || vehicle.imageUrl;
        
        if (imageUrl && nameElement) {
            nameElement.innerHTML = `
                <div class="flex items-center gap-3">
                    <img src="${imageUrl}" class="w-12 h-12 rounded-lg object-cover shadow-md">
                    <div>
                        <div class="font-semibold text-gray-800">${vehicle.brand} ${vehicle.model}</div>
                        <div class="text-sm text-gray-500">${vehicle.plate}</div>
                    </div>
                </div>
            `;
        }
        
        document.getElementById('current-km-display').value = vehicle.km.toLocaleString();
        document.getElementById('new-km').value = '';
        document.getElementById('new-km').min = vehicle.km;
        
        const modal = document.getElementById('modal-update-km');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    },
    
    handleUpdateKm(e) {
        e.preventDefault();
        
        const vehicleId = document.getElementById('update-km-vehicle-id').value;
        const newKm = parseInt(document.getElementById('new-km').value);
        
        const vehicle = AppState.vehicles.find(v => v.id === vehicleId);
        if (!vehicle) return;
        
        if (newKm < vehicle.km) {
            UI.showToast('Nova quilometragem deve ser maior que a atual', 'error');
            return;
        }
        
        if (!vehicle.kmHistory) vehicle.kmHistory = [];
        vehicle.kmHistory.push({
            km: vehicle.km,
            date: new Date().toISOString()
        });
        
        vehicle.km = newKm;
        vehicle.updatedAt = new Date().toISOString();
        
        AppState.saveToStorage();
        Maintenance.checkStatus();
        
        document.getElementById('modal-update-km').classList.add('hidden');
        document.getElementById('modal-update-km').classList.remove('flex');
        
        this.render();
        Dashboard.updateStats();
        UI.showToast('Quilometragem atualizada!', 'success');
    },
    
    viewHistory(vehicleId) {
        const vehicle = AppState.vehicles.find(v => v.id === vehicleId);
        if (!vehicle) return;
        
        const imageUrl = vehicle.imageUrl || this.vehicleImages.get(vehicleId) || ImagesAPI.getPlaceholder();
        
        let historyHtml = `
            <div class="flex items-center gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
                <img src="${imageUrl}" class="w-20 h-20 rounded-xl object-cover shadow-md">
                <div>
                    <h4 class="font-bold text-lg text-gray-800">${vehicle.brand} ${vehicle.model}</h4>
                    <p class="text-gray-500">${vehicle.plate} • ${vehicle.year}</p>
                </div>
            </div>
            <h5 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <i class="fas fa-history text-blue-500"></i> Histórico de Quilometragem
            </h5>
            <div class="space-y-2 max-h-60 overflow-y-auto">
        `;
        
        if (vehicle.kmHistory && vehicle.kmHistory.length > 0) {
            [...vehicle.kmHistory].reverse().forEach(h => {
                historyHtml += `
                    <div class="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div class="flex items-center gap-2 text-gray-600">
                            <i class="fas fa-calendar-alt text-blue-400"></i>
                            ${Utils.formatDate(h.date)}
                        </div>
                        <span class="font-bold text-gray-800">${h.km.toLocaleString()} km</span>
                    </div>
                `;
            });
        } else {
            historyHtml += '<p class="text-gray-500 text-center py-4 bg-gray-50 rounded-lg">Nenhum histórico registrado</p>';
        }
        
        historyHtml += '</div>';
        
        UI.showModal(`Histórico - ${vehicle.model}`, historyHtml);
    },
    
    getFilteredVehicles() {
        if (this.currentFilter === 'all') return AppState.vehicles;
        
        return AppState.vehicles.filter(v => {
            if (this.currentFilter === 'active') return true;
            if (this.currentFilter === 'maintenance') {
                return AppState.maintenances.some(m => 
                    m.vehicleId === v.id && (m.status === 'overdue' || m.status === 'warning')
                );
            }
            return true;
        });
    },
    
    render() {
        const container = document.getElementById('vehicles-grid');
        const emptyState = document.getElementById('empty-vehicles');
        
        if (!container) return;
        
        const vehicles = this.getFilteredVehicles();
        
        if (vehicles.length === 0) {
            container.innerHTML = '';
            emptyState?.classList.remove('hidden');
            return;
        }
        
        emptyState?.classList.add('hidden');
        
        container.innerHTML = vehicles.map(v => {
            const vehicleMaintenances = AppState.maintenances.filter(m => m.vehicleId === v.id);
            const fuelLabel = Utils.fuelLabels[v.fuel] || v.fuel;
            const imageUrl = v.imageUrl || this.vehicleImages.get(v.id) || ImagesAPI.getVehicleImage(v.brand, v.model);
            
            const overdue = vehicleMaintenances.filter(m => m.status === 'overdue').length;
            const warning = vehicleMaintenances.filter(m => m.status === 'warning').length;
            
            let statusBadge = '';
            if (overdue > 0) {
                statusBadge = `<span class="absolute top-3 right-3 bg-red-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg z-10"><i class="fas fa-exclamation"></i> ${overdue}</span>`;
            } else if (warning > 0) {
                statusBadge = `<span class="absolute top-3 right-3 bg-yellow-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg z-10"><i class="fas fa-clock"></i> ${warning}</span>`;
            }
            
            return `
                <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden card-hover relative">
                    ${statusBadge}
                    <div class="h-48 overflow-hidden relative">
                        <img src="${imageUrl}" alt="${v.brand} ${v.model}" 
                            class="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                            onerror="this.src='${ImagesAPI.getPlaceholder(400, 300, v.brand)}'">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                        <div class="absolute bottom-4 left-4 right-4">
                            <h3 class="font-bold text-white text-xl">${v.nickname || v.model}</h3>
                            <p class="text-white/80 text-sm">${v.brand} ${v.year}</p>
                        </div>
                    </div>
                    <div class="p-5">
                        <div class="grid grid-cols-2 gap-3 mb-4">
                            <div class="bg-gray-50 p-3 rounded-xl">
                                <p class="text-xs text-gray-500 mb-1">Placa</p>
                                <p class="font-bold text-gray-800">${v.plate}</p>
                            </div>
                            <div class="bg-gray-50 p-3 rounded-xl">
                                <p class="text-xs text-gray-500 mb-1">Quilometragem</p>
                                <p class="font-bold text-gray-800">${v.km.toLocaleString()} km</p>
                            </div>
                            <div class="bg-gray-50 p-3 rounded-xl">
                                <p class="text-xs text-gray-500 mb-1">Combustível</p>
                                <p class="font-bold text-gray-800">${fuelLabel}</p>
                            </div>
                            <div class="bg-gray-50 p-3 rounded-xl">
                                <p class="text-xs text-gray-500 mb-1">Manutenções</p>
                                <p class="font-bold ${overdue > 0 ? 'text-red-600' : (warning > 0 ? 'text-yellow-600' : 'text-gray-800')}" >
                                    ${vehicleMaintenances.length}
                                </p>
                            </div>
                        </div>
                        
                        <div class="flex gap-2">
                            <button onclick="Maintenance.openModal('${v.id}')" 
                                class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg">
                                <i class="fas fa-plus mr-1"></i> Manutenção
                            </button>
                            <button onclick="Vehicles.viewHistory('${v.id}')" 
                                class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold transition-all">
                                <i class="fas fa-history mr-1"></i> Histórico
                            </button>
                        </div>
                    </div>
                    <div class="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                        <span class="text-xs text-gray-500">Atualizado: ${Utils.formatDate(v.updatedAt)}</span>
                        <div class="flex gap-2">
                            <button onclick="Vehicles.openUpdateKmModal('${v.id}')" 
                                class="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Atualizar KM">
                                <i class="fas fa-tachometer-alt"></i>
                            </button>
                            <button onclick="Vehicles.delete('${v.id}')" 
                                class="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        const updateForm = document.getElementById('form-update-km');
        if (updateForm) {
            const newForm = updateForm.cloneNode(true);
            updateForm.parentNode.replaceChild(newForm, updateForm);
            newForm.addEventListener('submit', (e) => this.handleUpdateKm(e));
        }
    }
};

window.Vehicles = Vehicles;
