/**
 * Vehicles Module (Atualizado com Cancelar e Logos)
 */

const Vehicles = {
    currentFilter: 'all',
    currentView: 'garage',
    vehicleImages: new Map(),
    isInitialized: false,
    vehicleDatabase: {
        Chevrolet: {
            models: ['Onix', 'Onix Plus', 'Prisma', 'Cobalt', 'Cruze', 'Tracker', 'S10', 'Spin', 'Montana'],
            years: { Onix: [2012, 2024], 'Onix Plus': [2019, 2024], Tracker: [2014, 2024], S10: [2010, 2024] },
            oilTypes: { Onix: ['5W30', '0W20'], 'Onix Plus': ['0W20'], Tracker: ['0W20', '5W30'], S10: ['5W30', '15W40'] }
        },
        Fiat: {
            models: ['Uno', 'Palio', 'Siena', 'Toro', 'Strada', 'Argo', 'Mobi', 'Cronos', 'Pulse', 'Fastback'],
            years: { Uno: [2010, 2024], Toro: [2016, 2024], Argo: [2017, 2024], Strada: [2010, 2024] },
            oilTypes: { Uno: ['5W30', '15W40'], Toro: ['5W30', '0W20'], Argo: ['5W30'], Strada: ['5W30', '15W40'] }
        },
        Ford: {
            models: ['Ka', 'Fiesta', 'Focus', 'EcoSport', 'Ranger', 'Fusion'],
            years: { Ka: [2014, 2021], Fiesta: [2010, 2019], EcoSport: [2010, 2021], Ranger: [2010, 2024] },
            oilTypes: { Ka: ['5W20', '5W30'], Fiesta: ['5W30'], EcoSport: ['5W30'], Ranger: ['5W30', '15W40'] }
        },
        Honda: {
            models: ['Fit', 'City', 'Civic', 'HR-V', 'WR-V', 'CR-V'],
            years: { Fit: [2010, 2021], City: [2010, 2024], Civic: [2010, 2024], 'HR-V': [2015, 2024] },
            oilTypes: { Fit: ['0W20', '5W30'], City: ['0W20'], Civic: ['0W20', '5W30'], 'HR-V': ['0W20'] }
        },
        Hyundai: {
            models: ['HB20', 'HB20S', 'Creta', 'ix35', 'Tucson', 'Santa Fe'],
            years: { HB20: [2012, 2024], HB20S: [2013, 2024], Creta: [2017, 2024], ix35: [2010, 2022] },
            oilTypes: { HB20: ['5W30', '0W20'], HB20S: ['5W30'], Creta: ['0W20', '5W30'], ix35: ['5W30'] }
        },
        Renault: {
            models: ['Kwid', 'Sandero', 'Logan', 'Duster', 'Captur', 'Oroch'],
            years: { Kwid: [2017, 2024], Sandero: [2010, 2024], Logan: [2010, 2024], Duster: [2012, 2024] },
            oilTypes: { Kwid: ['5W30', '0W20'], Sandero: ['5W30'], Logan: ['5W30'], Duster: ['5W30', '0W20'] }
        },
        Toyota: {
            models: ['Etios', 'Yaris', 'Corolla', 'Corolla Cross', 'Hilux', 'SW4'],
            years: { Etios: [2012, 2021], Yaris: [2018, 2024], Corolla: [2010, 2024], Hilux: [2010, 2024] },
            oilTypes: { Etios: ['5W30', '0W20'], Yaris: ['0W20'], Corolla: ['0W20', '5W30'], Hilux: ['5W30', '15W40'] }
        },
        Volkswagen: {
            models: ['Gol', 'Voyage', 'Polo', 'Virtus', 'T-Cross', 'Nivus', 'Saveiro', 'Taos'],
            years: { Gol: [2010, 2023], Polo: [2010, 2024], Virtus: [2018, 2024], 'T-Cross': [2019, 2024] },
            oilTypes: { Gol: ['5W40', '10W40'], Polo: ['0W20', '5W30'], Virtus: ['0W20', '5W30'], 'T-Cross': ['0W20'] }
        }
    },
    smartSuggestionIndex: [],
    
    init() {
        if (this.isInitialized) {
            this.render();
            return;
        }
        this.isInitialized = true;

        const storedView = localStorage.getItem('autocare_vehicle_view');
        if (storedView === 'garage' || storedView === 'list') {
            this.currentView = storedView;
        }
        
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

        const bindViewButton = (id, view) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', () => this.setView(view));
        };

        bindViewButton('vehicles-view-garage', 'garage');
        bindViewButton('vehicles-view-list', 'list');
        
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

        const editForm = document.getElementById('form-edit-vehicle');
        if (editForm) {
            const newEditForm = editForm.cloneNode(true);
            editForm.parentNode.replaceChild(newEditForm, editForm);
            newEditForm.addEventListener('submit', (e) => this.handleEditSubmit(e));
        }

        document.getElementById('edit-vehicle-brand')?.addEventListener('change', () => {
            this.updateEditModelSuggestions();
        });
        
        // Preview de imagem
        document.getElementById('vehicle-brand')?.addEventListener('change', () => {
            this.updateModelSuggestions();
            this.updateImagePreview();
            this.updateBrandLogo(); // NOVO: Atualizar logo
        });
        
        document.getElementById('vehicle-model')?.addEventListener('input', 
            Utils.debounce(() => this.updateImagePreview(), 500));

        const plateInput = document.getElementById('vehicle-plate');
        plateInput?.addEventListener('blur', () => this.handlePlateDetection());

        this.bindSmartSearch();
        this.updateViewToggleUI();
    },

    setView(view) {
        if (!['garage', 'list'].includes(view)) return;
        this.currentView = view;
        localStorage.setItem('autocare_vehicle_view', view);
        this.updateViewToggleUI();
        this.render();
    },

    updateViewToggleUI() {
        const garageBtn = document.getElementById('vehicles-view-garage');
        const listBtn = document.getElementById('vehicles-view-list');

        if (garageBtn) {
            garageBtn.classList.toggle('active', this.currentView === 'garage');
        }

        if (listBtn) {
            listBtn.classList.toggle('active', this.currentView === 'list');
        }
    },

    isMobileViewport() {
        return window.matchMedia('(max-width: 767px)').matches;
    },

    closeMobileActionSheet() {
        const sheet = document.getElementById('vehicle-mobile-sheet');
        if (!sheet) return;

        sheet.classList.remove('show');
        setTimeout(() => {
            sheet.remove();
        }, 220);
    },

    openMobileActionSheet(vehicleId) {
        if (!this.isMobileViewport()) return;

        this.closeMobileActionSheet();

        const vehicle = AppState.vehicles.find((item) => String(item.id) === String(vehicleId));
        const vehicleTitle = vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Veículo';

        const sheet = document.createElement('div');
        sheet.id = 'vehicle-mobile-sheet';
        sheet.className = 'bottom-sheet';
        sheet.innerHTML = `
            <div class="sheet-content" role="dialog" aria-label="Ações do veículo">
                <div class="sheet-handle"></div>
                <h3>O que deseja fazer em ${vehicleTitle}?</h3>
                <button type="button" class="sheet-action primary" data-action="maintenance">
                    <span>🔧</span>
                    Registrar manutenção
                </button>
                <button type="button" class="sheet-action" data-action="history">
                    <span>📋</span>
                    Ver histórico
                </button>
                <button type="button" class="sheet-action" data-action="edit">
                    <span>✏️</span>
                    Editar veículo
                </button>
                <button type="button" class="sheet-action danger" data-action="delete">
                    <span>🗑️</span>
                    Excluir veículo
                </button>
                <button type="button" class="sheet-cancel" data-action="cancel">Cancelar</button>
            </div>
        `;

        document.body.appendChild(sheet);
        requestAnimationFrame(() => sheet.classList.add('show'));

        let startY = 0;
        const content = sheet.querySelector('.sheet-content');

        content?.addEventListener('touchstart', (event) => {
            startY = event.touches[0].clientY;
        }, { passive: true });

        content?.addEventListener('touchmove', (event) => {
            const delta = event.touches[0].clientY - startY;
            if (delta > 0) {
                content.style.transform = `translateY(${delta}px)`;
            }
        }, { passive: true });

        content?.addEventListener('touchend', (event) => {
            const delta = event.changedTouches[0].clientY - startY;
            if (delta > 100) {
                this.closeMobileActionSheet();
            } else {
                content.style.transform = '';
            }
        }, { passive: true });

        sheet.addEventListener('click', (event) => {
            if (event.target === sheet) {
                this.closeMobileActionSheet();
                return;
            }

            const actionBtn = event.target.closest('[data-action]');
            if (!actionBtn) return;

            const action = actionBtn.getAttribute('data-action');
            this.closeMobileActionSheet();

            if (action === 'maintenance') {
                Maintenance.openModal(vehicleId);
                return;
            }

            if (action === 'history') {
                this.viewHistory(vehicleId);
                return;
            }

            if (action === 'edit') {
                this.openEditVehicleModal(vehicleId);
                return;
            }

            if (action === 'delete') {
                this.delete(vehicleId);
            }
        });
    },

    bindSmartSearch() {
        const currentSmartInput = document.getElementById('vehicle-smart-search');
        const currentSuggestions = document.getElementById('vehicle-smart-suggestions');

        if (!currentSmartInput || !currentSuggestions) return;

        const smartInput = currentSmartInput.cloneNode(true);
        currentSmartInput.parentNode.replaceChild(smartInput, currentSmartInput);

        const suggestions = currentSuggestions.cloneNode(false);
        currentSuggestions.parentNode.replaceChild(suggestions, currentSuggestions);

        if (this.smartSearchOutsideHandler) {
            document.removeEventListener('click', this.smartSearchOutsideHandler);
        }

        const render = (query = '') => {
            const data = this.getSmartSuggestions(query);
            this.renderSmartSuggestions(data, query);
        };

        smartInput.addEventListener('focus', () => render(smartInput.value || ''));
        smartInput.addEventListener('input', Utils.debounce((e) => render(e.target.value), 120));
        smartInput.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;

            const firstSuggestion = this.smartSuggestionIndex[0];
            if (!firstSuggestion) return;

            event.preventDefault();
            this.applySmartSuggestion(firstSuggestion);
        });

        suggestions.addEventListener('click', (event) => {
            const item = event.target.closest('[data-suggestion-index]');
            if (!item) return;

            const suggestionIndex = Number(item.dataset.suggestionIndex);
            const suggestion = this.smartSuggestionIndex[suggestionIndex];
            if (!suggestion) return;

            this.applySmartSuggestion(suggestion);
        });

        this.smartSearchOutsideHandler = (event) => {
            const targetInside = smartInput.contains(event.target) || suggestions.contains(event.target);
            if (!targetInside) {
                suggestions.classList.add('hidden');
            }
        };

        document.addEventListener('click', this.smartSearchOutsideHandler);
    },

    normalizeSearchText(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    },

    getBrandAliases() {
        return {
            Volkswagen: ['vw', 'volks', 'volkswagen'],
            Chevrolet: ['gm', 'chevy', 'chevrolet'],
            Hyundai: ['hyundai', 'hyndai'],
            Renault: ['renault'],
            Toyota: ['toyota'],
            Honda: ['honda'],
            Ford: ['ford'],
            Fiat: ['fiat']
        };
    },

    getRecentVehicles() {
        return [...AppState.vehicles]
            .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
            .slice(0, 5)
            .map((vehicle) => {
                const lastMaintenance = AppState.maintenances
                    .filter((maintenance) => maintenance.vehicleId === vehicle.id)
                    .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))[0];

                return {
                    type: 'vehicle',
                    vehicle,
                    image: vehicle.imageUrl || this.vehicleImages.get(vehicle.id) || ImagesAPI.getPlaceholder(120, 80, `${vehicle.brand} ${vehicle.model}`),
                    subtitle: lastMaintenance
                        ? `${vehicle.plate} • Última revisão: ${Utils.formatDate(lastMaintenance.date || lastMaintenance.createdAt)}`
                        : `${vehicle.plate} • Sem revisões registradas`
                };
            });
    },

    getSmartSuggestions(query) {
        const normalizedQuery = this.normalizeSearchText(query);
        const recent = this.getRecentVehicles();

        if (!normalizedQuery) {
            return {
                recent,
                matches: []
            };
        }

        const vehicleMatches = AppState.vehicles
            .filter((vehicle) => {
                const haystack = this.normalizeSearchText(`${vehicle.brand} ${vehicle.model} ${vehicle.plate}`);
                return haystack.includes(normalizedQuery);
            })
            .slice(0, 5)
            .map((vehicle) => ({
                type: 'vehicle',
                vehicle,
                image: vehicle.imageUrl || this.vehicleImages.get(vehicle.id) || ImagesAPI.getPlaceholder(120, 80, `${vehicle.brand} ${vehicle.model}`),
                subtitle: `${vehicle.plate} • ${vehicle.year}`
            }));

        const catalogMatches = [];
        const aliases = this.getBrandAliases();
        Object.entries(this.vehicleDatabase).forEach(([brand, brandData]) => {
            const normalizedBrand = this.normalizeSearchText(brand);
            const brandAliases = aliases[brand] || [];
            const hasAliasMatch = brandAliases.some((alias) => this.normalizeSearchText(alias).includes(normalizedQuery));

            if (normalizedBrand.includes(normalizedQuery) || hasAliasMatch) {
                catalogMatches.push({
                    type: 'catalog-brand',
                    brand,
                    model: '',
                    subtitle: `${brandData.models.length} modelos disponíveis`
                });
            }

            brandData.models.forEach((model) => {
                const normalizedBrandModel = this.normalizeSearchText(`${brand} ${model}`);
                if (normalizedBrandModel.includes(normalizedQuery)) {
                    const yearRange = brandData.years?.[model];
                    catalogMatches.push({
                        type: 'catalog-model',
                        brand,
                        model,
                        subtitle: yearRange ? `Ano sugerido: ${yearRange[0]}-${yearRange[1]}` : 'Modelo disponível no catálogo local'
                    });
                }
            });
        });

        const uniqueCatalogMatches = [];
        const seenCatalogKeys = new Set();
        catalogMatches.forEach((item) => {
            const key = `${item.type}:${item.brand}:${item.model || ''}`;
            if (seenCatalogKeys.has(key)) return;
            seenCatalogKeys.add(key);
            uniqueCatalogMatches.push(item);
        });

        return {
            recent,
            matches: [...vehicleMatches, ...uniqueCatalogMatches].slice(0, 8)
        };
    },

    renderSmartSuggestions(data, query) {
        const suggestions = document.getElementById('vehicle-smart-suggestions');
        if (!suggestions) return;

        const sections = [];
        this.smartSuggestionIndex = [];

        if (!query && data.recent.length > 0) {
            const itemsHtml = data.recent.map((item) => {
                const idx = this.smartSuggestionIndex.push(item) - 1;
                return `
                    <button type="button" data-suggestion-index="${idx}" class="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors flex items-center gap-3">
                        <img src="${item.image}" class="w-10 h-10 rounded-lg object-cover" onerror="this.src='${ImagesAPI.getPlaceholder(80, 60, 'car')}'">
                        <div>
                            <strong class="text-sm text-gray-800">${item.vehicle.brand} ${item.vehicle.model}</strong>
                            <div class="text-xs text-gray-500">${item.subtitle}</div>
                        </div>
                    </button>
                `;
            }).join('');

            sections.push(`
                <div class="border-b border-gray-100 last:border-b-0">
                    <div class="px-3 pt-3 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">🕐 Recentes</div>
                    ${itemsHtml}
                </div>
            `);
        }

        if (query && data.matches.length > 0) {
            const itemsHtml = data.matches.map((item) => {
                const idx = this.smartSuggestionIndex.push(item) - 1;
                const title = item.type === 'vehicle'
                    ? `${item.vehicle.brand} ${item.vehicle.model}`
                    : `${item.brand}${item.model ? ` ${item.model}` : ''}`;

                return `
                    <button type="button" data-suggestion-index="${idx}" class="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors">
                        <div class="text-sm font-semibold text-gray-800">${title}</div>
                        <div class="text-xs text-gray-500">${item.subtitle || ''}</div>
                    </button>
                `;
            }).join('');

            sections.push(`
                <div class="border-b border-gray-100 last:border-b-0">
                    <div class="px-3 pt-3 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sugestões</div>
                    ${itemsHtml}
                </div>
            `);
        }

        suggestions.innerHTML = sections.length
            ? sections.join('')
            : '<div class="px-3 py-3 text-sm text-gray-500">Nenhuma sugestão encontrada.</div>';

        suggestions.classList.remove('hidden');
    },

    applySmartSuggestion(suggestion) {
        if (!suggestion) return;

        const brandField = document.getElementById('vehicle-brand');
        const modelField = document.getElementById('vehicle-model');
        const yearField = document.getElementById('vehicle-year');
        const plateField = document.getElementById('vehicle-plate');
        const kmField = document.getElementById('vehicle-km');
        const fuelField = document.getElementById('vehicle-fuel');
        const smartInput = document.getElementById('vehicle-smart-search');
        const suggestions = document.getElementById('vehicle-smart-suggestions');

        if (suggestion.type === 'vehicle' && suggestion.vehicle) {
            const { vehicle } = suggestion;
            if (brandField) brandField.value = vehicle.brand || '';
            this.updateModelSuggestions();
            if (modelField) modelField.value = vehicle.model || '';
            if (yearField) yearField.value = vehicle.year || '';
            if (plateField) plateField.value = vehicle.plate || '';
            if (kmField) kmField.value = vehicle.km || 0;
            if (fuelField) fuelField.value = vehicle.fuel || '';
            if (smartInput) smartInput.value = `${vehicle.brand} ${vehicle.model}`;
        }

        if (suggestion.type === 'catalog-brand') {
            if (brandField) brandField.value = suggestion.brand;
            this.updateModelSuggestions();
            if (smartInput) smartInput.value = suggestion.brand;
        }

        if (suggestion.type === 'catalog-model') {
            if (brandField) brandField.value = suggestion.brand;
            this.updateModelSuggestions();
            if (modelField) modelField.value = suggestion.model;

            const yearRange = this.vehicleDatabase?.[suggestion.brand]?.years?.[suggestion.model];
            if (yearField && !yearField.value && yearRange) {
                yearField.value = yearRange[1];
            }

            if (smartInput) smartInput.value = `${suggestion.brand} ${suggestion.model}`;
        }

        this.updateBrandLogo();
        this.updateImagePreview();
        suggestions?.classList.add('hidden');
    },

    updateModelSuggestions() {
        const brand = document.getElementById('vehicle-brand')?.value;
        const modelList = document.getElementById('vehicle-model-list');

        if (!modelList) return;

        const models = this.vehicleDatabase?.[brand]?.models || [];
        modelList.innerHTML = models.map((model) => `<option value="${model}"></option>`).join('');
    },

    updateEditModelSuggestions() {
        const brand = document.getElementById('edit-vehicle-brand')?.value;
        const modelList = document.getElementById('edit-vehicle-model-list');

        if (!modelList) return;

        const models = this.vehicleDatabase?.[brand]?.models || [];
        modelList.innerHTML = models.map((model) => `<option value="${model}"></option>`).join('');
    },

    normalizePlate(plate) {
        return (plate || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    },

    estimateVehicleFromPlate(plate) {
        const normalizedPlate = this.normalizePlate(plate);
        if (!normalizedPlate) return null;

        const exactVehicle = AppState.vehicles.find((vehicle) => this.normalizePlate(vehicle.plate) === normalizedPlate);
        if (exactVehicle) {
            return {
                brand: exactVehicle.brand,
                model: exactVehicle.model,
                year: exactVehicle.year,
                source: 'local_exact'
            };
        }

        const platePrefix = normalizedPlate.slice(0, 3);
        const byPrefix = AppState.vehicles.filter((vehicle) => this.normalizePlate(vehicle.plate).startsWith(platePrefix));

        if (!byPrefix.length) return null;

        const latestMatch = [...byPrefix].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))[0];
        return {
            brand: latestMatch.brand,
            model: latestMatch.model,
            year: latestMatch.year,
            source: 'local_prefix'
        };
    },

    detectVehicleByPlate(plate) {
        const normalizedPlate = this.normalizePlate(plate);
        const mercosulPattern = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

        if (!mercosulPattern.test(normalizedPlate)) {
            return null;
        }

        return this.estimateVehicleFromPlate(normalizedPlate);
    },

    handlePlateDetection() {
        const plateField = document.getElementById('vehicle-plate');
        const brandField = document.getElementById('vehicle-brand');
        const modelField = document.getElementById('vehicle-model');
        const yearField = document.getElementById('vehicle-year');
        if (!plateField) return;

        const detected = this.detectVehicleByPlate(plateField.value);
        if (!detected) return;

        if (!brandField?.value && brandField) {
            brandField.value = detected.brand;
            this.updateModelSuggestions();
        }

        if (!modelField?.value && modelField) {
            modelField.value = detected.model;
        }

        if (!yearField?.value && yearField && detected.year) {
            yearField.value = detected.year;
        }

        this.updateBrandLogo();
        this.updateImagePreview();

        if (detected.source === 'local_exact') {
            UI.showToast('Placa identificada no histórico local. Campos sugeridos automaticamente.', 'info');
        }
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

        const modelList = document.getElementById('vehicle-model-list');
        if (modelList) {
            modelList.innerHTML = '';
        }

        const smartInput = document.getElementById('vehicle-smart-search');
        const smartSuggestions = document.getElementById('vehicle-smart-suggestions');
        if (smartInput) smartInput.value = '';
        if (smartSuggestions) {
            smartSuggestions.innerHTML = '';
            smartSuggestions.classList.add('hidden');
        }

        this.bindSmartSearch();
        
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

            const modelList = document.getElementById('vehicle-model-list');
            if (modelList) {
                modelList.innerHTML = '';
            }

            const smartInput = document.getElementById('vehicle-smart-search');
            const smartSuggestions = document.getElementById('vehicle-smart-suggestions');
            if (smartInput) smartInput.value = '';
            if (smartSuggestions) {
                smartSuggestions.innerHTML = '';
                smartSuggestions.classList.add('hidden');
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

    escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    confirmDeleteVehicle(id) {
        const vehicle = AppState.vehicles.find((item) => String(item.id) === String(id));
        if (!vehicle) return;

        const maintenanceCount = AppState.maintenances.filter((maintenance) => maintenance.vehicleId === vehicle.id).length;

        if (!window.UI?.showModal) {
            if (confirm('Tem certeza que deseja excluir este veículo? Todas as manutenções associadas também serão removidas.')) {
                this.deleteConfirmed(id);
            }
            return;
        }

        const safeBrand = this.escapeHtml(vehicle.brand);
        const safeModel = this.escapeHtml(vehicle.model);
        const safePlate = this.escapeHtml(vehicle.plate);

        UI.showModal('Tem certeza?', `
            <div class="delete-preview">
                <div class="delete-item">
                    <span>🚗</span>
                    <div>
                        <strong>${safeBrand} ${safeModel}</strong>
                        <small>${safePlate}</small>
                    </div>
                </div>
                <div class="delete-impact">
                    <span class="impact-badge">⚠️ ${maintenanceCount} manutenções serão perdidas</span>
                </div>
            </div>
            <div class="delete-actions">
                <button type="button" id="delete-cancel-btn" class="btn-cancel-vehicle flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold">
                    Cancelar
                </button>
                <button type="button" id="delete-confirm-btn" class="btn-danger">
                    Sim, deletar tudo
                </button>
            </div>
        `);

        const closeGenericModal = () => {
            document.getElementById('generic-modal')?.remove();
        };

        document.getElementById('delete-cancel-btn')?.addEventListener('click', () => {
            closeGenericModal();
        }, { once: true });

        document.getElementById('delete-confirm-btn')?.addEventListener('click', () => {
            closeGenericModal();
            this.deleteConfirmed(id);
        }, { once: true });
    },

    deleteConfirmed(id) {
        const vehicle = AppState.vehicles.find((item) => String(item.id) === String(id));
        if (!vehicle) return;

        AppState.vehicles = AppState.vehicles.filter(v => String(v.id) !== String(id));
        this.vehicleImages.delete(vehicle.id);
        AppState.maintenances = AppState.maintenances.filter(m => String(m.vehicleId) !== String(id));
        AppState.saveToStorage();

        this.render();
        Dashboard.updateStats();
        UI.showToast('Veículo removido com sucesso!', 'success');
    },
    
    delete(id) {
        this.confirmDeleteVehicle(id);
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

    openEditVehicleModal(vehicleId) {
        const vehicle = AppState.vehicles.find((item) => String(item.id) === String(vehicleId));
        if (!vehicle) return;

        document.getElementById('edit-vehicle-id').value = String(vehicle.id);
        document.getElementById('edit-vehicle-nickname').value = vehicle.nickname || '';
        document.getElementById('edit-vehicle-brand').value = vehicle.brand || '';
        this.updateEditModelSuggestions();
        document.getElementById('edit-vehicle-model').value = vehicle.model || '';
        document.getElementById('edit-vehicle-year').value = vehicle.year || '';
        document.getElementById('edit-vehicle-plate').value = vehicle.plate || '';
        document.getElementById('edit-vehicle-km').value = vehicle.km || 0;
        document.getElementById('edit-vehicle-fuel').value = vehicle.fuel || '';

        const modal = document.getElementById('modal-edit-vehicle');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    },

    closeEditVehicleModal() {
        const modal = document.getElementById('modal-edit-vehicle');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.classList.remove('flex');

        const form = document.getElementById('form-edit-vehicle');
        if (form) form.reset();
    },

    async handleEditSubmit(e) {
        e.preventDefault();

        const vehicleId = document.getElementById('edit-vehicle-id')?.value;
        const vehicle = AppState.vehicles.find((item) => String(item.id) === String(vehicleId));
        if (!vehicle) return;

        const updatedVehicle = {
            nickname: Utils.sanitizeString(document.getElementById('edit-vehicle-nickname')?.value),
            brand: document.getElementById('edit-vehicle-brand')?.value,
            model: Utils.sanitizeString(document.getElementById('edit-vehicle-model')?.value),
            year: parseInt(document.getElementById('edit-vehicle-year')?.value, 10),
            plate: document.getElementById('edit-vehicle-plate')?.value?.toUpperCase(),
            km: parseInt(document.getElementById('edit-vehicle-km')?.value, 10) || 0,
            fuel: document.getElementById('edit-vehicle-fuel')?.value,
            updatedAt: new Date().toISOString()
        };

        if (!Utils.isValidPlate(updatedVehicle.plate)) {
            UI.showToast('Placa inválida', 'error');
            return;
        }

        const exists = AppState.vehicles.some((v) => String(v.id) !== String(vehicle.id) && v.plate === updatedVehicle.plate);
        if (exists) {
            UI.showToast('Já existe outro veículo com esta placa', 'error');
            return;
        }

        const shouldRefreshImage = vehicle.brand !== updatedVehicle.brand || vehicle.model !== updatedVehicle.model;

        Object.assign(vehicle, updatedVehicle);

        if (shouldRefreshImage) {
            try {
                vehicle.imageUrl = await ImagesAPI.getVehicleImage(vehicle.brand, vehicle.model);
                this.vehicleImages.set(vehicle.id, vehicle.imageUrl);
            } catch (error) {
            }
        }

        AppState.saveToStorage();
        this.closeEditVehicleModal();
        this.render();
        Dashboard.updateStats();
        UI.showToast('Veículo atualizado com sucesso!', 'success');
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

    getMaintenanceTypeInfo(type) {
        const map = {
            oil: { label: 'Troca de óleo', icon: '🛢️' },
            tire: { label: 'Pneus/Rodízio', icon: '🔄' },
            brake: { label: 'Freios', icon: '🛑' },
            belt: { label: 'Correia', icon: '⚙️' },
            filter: { label: 'Filtro de ar', icon: '🌬️' },
            battery: { label: 'Bateria', icon: '🔋' },
            review: { label: 'Revisão', icon: '📋' },
            other: { label: 'Serviço', icon: '🔧' }
        };

        return map[type] || map.other;
    },

    getHealthScore(overdue, warning, total) {
        if (!total) return 100;
        const score = 100 - (overdue * 28) - (warning * 12);
        return Math.max(5, Math.min(100, score));
    },

    getHealthTooltip(overdue, warning, total, score) {
        const lines = [
            'Fórmula do score de saúde:',
            'Base 100',
            `- 28 por manutenção vencida (${overdue})`,
            `- 12 por manutenção próxima (${warning})`,
            `Total de manutenções: ${total}`,
            `Score final: ${score}`
        ];

        if (!total) {
            lines.push('Sem manutenções cadastradas: score máximo.');
        }

        return lines.join('\n');
    },

    getScoreColor(score) {
        if (score < 50) return '#ef4444';
        if (score < 75) return '#f59e0b';
        return '#10b981';
    },

    getUpcomingText(maintenance, vehicleKm) {
        const kmParts = [];

        if (maintenance.nextKm) {
            const diffKm = maintenance.nextKm - vehicleKm;
            if (diffKm <= 0) {
                kmParts.push('km vencido');
            } else {
                kmParts.push(`em ${Number(diffKm).toLocaleString('pt-BR')}km`);
            }
        }

        if (maintenance.nextDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const nextDate = new Date(maintenance.nextDate);
            nextDate.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
                kmParts.push('data vencida');
            } else {
                kmParts.push(`em ${diffDays} dias`);
            }
        }

        if (!kmParts.length) {
            return 'sem prazo definido';
        }

        return kmParts.join(' ou ');
    },

    getMiniProgress(maintenance, vehicleKm) {
        if (maintenance.status === 'overdue') return 95;
        if (maintenance.status === 'warning') return 70;

        if (maintenance.nextKm) {
            const consumed = (vehicleKm / maintenance.nextKm) * 100;
            return Math.max(15, Math.min(55, Math.round(consumed)));
        }

        return 30;
    },

    getUpcomingMaintenances(vehicle, vehicleMaintenances) {
        const sorted = [...vehicleMaintenances]
            .sort((a, b) => {
                const priority = { overdue: 0, warning: 1, ok: 2 };
                if (priority[a.status] !== priority[b.status]) {
                    return priority[a.status] - priority[b.status];
                }

                const aDate = new Date(a.nextDate || a.date || '2999-12-31');
                const bDate = new Date(b.nextDate || b.date || '2999-12-31');
                return aDate - bDate;
            })
            .slice(0, 2);

        if (sorted.length > 0) {
            return sorted.map((maintenance) => {
                const typeInfo = this.getMaintenanceTypeInfo(maintenance.type);
                const variant = maintenance.status === 'overdue'
                    ? 'urgent'
                    : maintenance.status === 'warning'
                        ? 'warning'
                        : 'ok';

                const progressColor = maintenance.status === 'overdue'
                    ? '#ef4444'
                    : maintenance.status === 'warning'
                        ? '#f59e0b'
                        : '#10b981';

                return {
                    variant,
                    icon: typeInfo.icon,
                    label: maintenance.name || typeInfo.label,
                    whenText: this.getUpcomingText(maintenance, vehicle.km),
                    progress: this.getMiniProgress(maintenance, vehicle.km),
                    progressColor
                };
            });
        }

        return [{
            variant: 'ok',
            icon: '✅',
            label: 'Sem pendências próximas',
            whenText: 'veículo em dia',
            progress: 24,
            progressColor: '#10b981'
        }];
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

        container.classList.remove('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-6', 'garage-view', 'list-view');
        container.classList.add(this.currentView === 'list' ? 'list-view' : 'garage-view');
        
        container.innerHTML = vehicles.map(v => {
            const vehicleMaintenances = AppState.maintenances.filter(m => m.vehicleId === v.id);
            const fuelLabel = Utils.fuelLabels[v.fuel] || v.fuel;
            const imageUrl = v.imageUrl || this.vehicleImages.get(v.id) || ImagesAPI.getVehicleImage(v.brand, v.model);
            
            const overdue = vehicleMaintenances.filter(m => m.status === 'overdue').length;
            const warning = vehicleMaintenances.filter(m => m.status === 'warning').length;
            const healthScore = this.getHealthScore(overdue, warning, vehicleMaintenances.length);
            const scoreColor = this.getScoreColor(healthScore);
            const upcomingItems = this.getUpcomingMaintenances(v, vehicleMaintenances);
            const scoreTooltip = this.getHealthTooltip(overdue, warning, vehicleMaintenances.length, healthScore);
            const healthText = overdue > 0
                ? `${overdue} crítica(s)`
                : warning > 0
                    ? `${warning} atenção(ões)`
                    : 'Tudo em dia';

            if (this.currentView === 'list') {
                return `
                    <div class="vehicle-health-card vehicle-card">
                        <div class="vehicle-header">
                            <div class="vehicle-photo">
                                <img src="${imageUrl}" alt="${v.brand} ${v.model}" class="vehicle-image" onerror="this.src='${ImagesAPI.getPlaceholder(400, 300, v.brand)}'">
                            </div>
                            <div class="vehicle-info">
                                <h3>${v.nickname || `${v.brand} ${v.model}`}</h3>
                                <span class="plate">${v.plate} • ${v.year}</span>
                                <span class="km">${Number(v.km).toLocaleString('pt-BR')} km • ${fuelLabel}</span>
                                <span class="text-xs ${overdue > 0 ? 'text-red-600' : (warning > 0 ? 'text-yellow-600' : 'text-green-600')} font-semibold">${healthText}</span>
                            </div>

                            <button class="mobile-sheet-trigger" onclick="Vehicles.openMobileActionSheet('${v.id}')" title="Ações">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                        </div>

                        <div class="quick-actions">
                            <button class="action-btn" onclick="Maintenance.openModal('${v.id}')">
                                <span>➕</span>
                                Registrar troca
                            </button>
                            <button class="action-btn secondary" onclick="Vehicles.viewHistory('${v.id}')">
                                <span>📋</span>
                                Histórico
                            </button>
                        </div>

                        <div class="list-row-actions">
                            <button onclick="Vehicles.openEditVehicleModal('${v.id}')"
                                class="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar veículo">
                                <i class="fas fa-pen"></i>
                            </button>
                            <button onclick="Vehicles.delete('${v.id}')"
                                class="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir veículo">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }
            
            return `
                <div class="vehicle-health-card vehicle-card">
                    <div class="vehicle-header">
                        <div class="vehicle-photo">
                            <img src="${imageUrl}" alt="${v.brand} ${v.model}" class="vehicle-image" onerror="this.src='${ImagesAPI.getPlaceholder(400, 300, v.brand)}'">
                            <div class="health-score" data-score="${healthScore}" title="${scoreTooltip}" aria-label="${scoreTooltip}">
                                <svg class="score-ring" viewBox="0 0 36 36">
                                    <path class="ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    <path class="ring-fill" stroke="${scoreColor}" stroke-dasharray="${healthScore}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                </svg>
                                <span class="score-text" style="color: ${scoreColor};">${healthScore}</span>
                            </div>
                        </div>
                        <div class="vehicle-info">
                            <h3>${v.nickname || `${v.brand} ${v.model}`}</h3>
                            <span class="plate">${v.plate}</span>
                            <span class="km">${Number(v.km).toLocaleString('pt-BR')} km • ${v.year}</span>
                            <span class="text-xs ${overdue > 0 ? 'text-red-600' : (warning > 0 ? 'text-yellow-600' : 'text-green-600')} font-semibold">${healthText}</span>
                        </div>

                        <button class="mobile-sheet-trigger" onclick="Vehicles.openMobileActionSheet('${v.id}')" title="Ações">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>

                    <div class="upcoming-mini">
                        ${upcomingItems.map((item) => `
                            <div class="mini-item ${item.variant}">
                                <div class="mini-icon">${item.icon}</div>
                                <div class="mini-info">
                                    <span class="mini-label">${item.label}</span>
                                    <span class="mini-when">${item.whenText}</span>
                                </div>
                                <div class="mini-bar">
                                    <div class="mini-progress" style="width: ${item.progress}%; background: ${item.progressColor}"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="grid grid-cols-2 gap-2 mb-3 text-xs">
                        <div class="bg-slate-50 rounded-lg px-2.5 py-2 border border-slate-200 text-slate-600">Combustível: <strong class="text-slate-800">${fuelLabel}</strong></div>
                        <div class="bg-slate-50 rounded-lg px-2.5 py-2 border border-slate-200 text-slate-600">Manutenções: <strong class="${overdue > 0 ? 'text-red-600' : (warning > 0 ? 'text-yellow-600' : 'text-slate-800')}">${vehicleMaintenances.length}</strong></div>
                    </div>

                    <div class="quick-actions">
                        <button class="action-btn" onclick="Maintenance.openModal('${v.id}')">
                            <span>➕</span>
                            Registrar troca
                        </button>
                        <button class="action-btn secondary" onclick="Vehicles.viewHistory('${v.id}')">
                            <span>📋</span>
                            Histórico
                        </button>
                    </div>

                    <div class="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center">
                        <span class="text-xs text-gray-500">Atualizado: ${Utils.formatDate(v.updatedAt)}</span>
                        <div class="flex gap-2">
                            <button onclick="Vehicles.openEditVehicleModal('${v.id}')" 
                                class="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar veículo">
                                <i class="fas fa-pen"></i>
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
window.vehicleDatabase = Vehicles.vehicleDatabase;
window.detectVehicleByPlate = (plate) => Vehicles.detectVehicleByPlate(plate);
window.openMobileActionSheet = (vehicleId) => Vehicles.openMobileActionSheet(vehicleId);
window.closeSheet = () => Vehicles.closeMobileActionSheet();
window.openVehicleModal = () => {
    if (window.Vehicles?.init) {
        window.Vehicles.init();
    }
    window.Vehicles?.openModal?.();
};
window.closeVehicleModal = () => window.Vehicles?.handleCancel?.();
window.saveVehicle = () => {
    const form = document.getElementById('form-add-vehicle');
    if (!form) return;
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(submitEvent);
};
