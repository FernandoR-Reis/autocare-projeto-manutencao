/**
 * Providers Module (Atualizado com Imagens da Web)
 */

const Providers = {
    currentSearch: '',
    currentType: 'all',
    currentLocation: null,
    isLoading: false,
    providers: [],
    providerImages: new Map(),

    syncWithAppState() {
        if (window.AppProvidersBridge?.setProviders) {
            window.AppProvidersBridge.setProviders(this.providers);
        }
    },

    loadFromAppState() {
        if (window.AppProvidersBridge?.getProviders) {
            const providers = window.AppProvidersBridge.getProviders();
            if (Array.isArray(providers) && providers.length) {
                this.providers = providers;
            }
        }
    },

    async init() {
        this.loadFromAppState();

        const apiReady = await GoogleMapsAPI.init();

        if (apiReady) {
            try {
                this.currentLocation = await GoogleMapsAPI.getCurrentLocation();
            } catch (error) {
                this.currentLocation = Config.DEFAULT_LOCATION;
            }
            await this.searchNearby();
        } else if (!this.providers.length) {
            await this.loadSimulatedProvidersWithImages();
        }

        this.bindEvents();
        this.render();
    },

    async loadSimulatedProvidersWithImages() {
        const mechanicImages = await Promise.all([
            ImagesAPI.getMechanicImage('workshop', 0),
            ImagesAPI.getMechanicImage('garage', 1),
            ImagesAPI.getMechanicImage('tools', 2),
            ImagesAPI.getMechanicImage('workshop', 3),
            ImagesAPI.getMechanicImage('repair', 4),
            ImagesAPI.searchImage('auto repair shop', 400, 300),
            ImagesAPI.searchImage('car service center', 400, 300),
            ImagesAPI.searchImage('mechanic garage', 400, 300),
        ]);

        const simulatedData = [
            {
                id: 'sim_1',
                name: 'Auto Mecânica Premium',
                type: 'mechanic',
                rating: 4.7,
                reviews: 156,
                distance: '1.2 km',
                address: 'Av. Paulista, 1000 - Bela Vista, São Paulo',
                phone: '(11) 99999-1111',
                whatsappNumber: '11999991111',
                hours: 'Seg-Sex: 08:00-18:00',
                isOpen: true,
                services: ['Mecânica Geral', 'Revisão', 'Diagnóstico Computadorizado'],
                partner: true,
                imageIndex: 0,
            },
            {
                id: 'sim_2',
                name: 'Oficina do Zé - Especializada',
                type: 'mechanic',
                rating: 4.9,
                reviews: 89,
                distance: '2.5 km',
                address: 'Rua Augusta, 500 - Consolação, São Paulo',
                phone: '(11) 98888-2222',
                whatsappNumber: '11988882222',
                hours: 'Seg-Sáb: 08:00-20:00',
                isOpen: true,
                services: ['Motor', 'Câmbio', 'Suspensão', 'Freios'],
                partner: false,
                imageIndex: 1,
            },
            {
                id: 'sim_3',
                name: 'Centro Automotivo Express',
                type: 'mechanic',
                rating: 4.3,
                reviews: 234,
                distance: '0.8 km',
                address: 'Rua da Consolação, 800 - Centro, São Paulo',
                phone: '(11) 97777-3333',
                whatsappNumber: '11977773333',
                hours: 'Seg-Dom: 07:00-22:00',
                isOpen: true,
                services: ['Troca de Óleo', 'Alinhamento', 'Balanceamento', 'Freios'],
                partner: true,
                imageIndex: 2,
            },
            {
                id: 'sim_4',
                name: 'Elétrica Auto Power',
                type: 'electric',
                rating: 4.8,
                reviews: 178,
                distance: '3.1 km',
                address: 'Alameda Santos, 900 - Jardins, São Paulo',
                phone: '(11) 96666-4444',
                whatsappNumber: '11966664444',
                hours: 'Seg-Sex: 08:00-18:00',
                isOpen: false,
                services: ['Elétrica Automotiva', 'Baterias', 'Alarme', 'Som'],
                partner: true,
                imageIndex: 3,
            },
            {
                id: 'sim_5',
                name: 'Borracharia Rápida 24h',
                type: 'tire',
                rating: 4.5,
                reviews: 312,
                distance: '4.2 km',
                address: 'Av. Rebouças, 1200 - Pinheiros, São Paulo',
                phone: '(11) 95555-5555',
                whatsappNumber: '11955555555',
                hours: '24 horas',
                isOpen: true,
                services: ['Pneus', 'Alinhamento', 'Balanceamento', 'Suspensão'],
                partner: false,
                imageIndex: 4,
            },
            {
                id: 'sim_6',
                name: 'Funilaria e Pintura Premium',
                type: 'body',
                rating: 4.6,
                reviews: 98,
                distance: '5.5 km',
                address: 'Rua Oscar Freire, 300 - Jardins, São Paulo',
                phone: '(11) 94444-6666',
                whatsappNumber: '11944446666',
                hours: 'Seg-Sex: 08:00-18:00',
                isOpen: true,
                services: ['Funilaria', 'Pintura', 'Polimento', 'Martelinho de Ouro'],
                partner: true,
                imageIndex: 5,
            },
        ];

        this.providers = simulatedData.map((provider, index) => ({
            ...provider,
            photoUrl: mechanicImages[index % mechanicImages.length],
            source: 'simulated_with_images',
        }));

        this.syncWithAppState();
    },

    bindEvents() {
        const searchInput = document.getElementById('provider-search');
        if (searchInput && !searchInput.dataset.providersBound) {
            searchInput.dataset.providersBound = 'true';
            searchInput.addEventListener('input', Utils.debounce((event) => {
                this.handleSearch(event.target.value);
            }, 500));
        }

        const typeSelect = document.getElementById('provider-type');
        if (typeSelect && !typeSelect.dataset.providersBound) {
            typeSelect.dataset.providersBound = 'true';
            typeSelect.addEventListener('change', (event) => {
                this.currentType = event.target.value;
                this.render();
            });
        }

        const updateLocationButton = document.getElementById('btn-update-location');
        if (updateLocationButton && !updateLocationButton.dataset.providersBound) {
            updateLocationButton.dataset.providersBound = 'true';
            updateLocationButton.addEventListener('click', () => this.updateLocation());
        }

        const searchNearbyButton = document.getElementById('btn-search-nearby');
        if (searchNearbyButton && !searchNearbyButton.dataset.providersBound) {
            searchNearbyButton.dataset.providersBound = 'true';
            searchNearbyButton.addEventListener('click', () => this.searchNearby());
        }
    },

    async handleSearch(query) {
        this.currentSearch = String(query || '').toLowerCase().trim();

        if (this.currentSearch.length < 3) {
            if (this.currentSearch === '') {
                await this.searchNearby();
            }
            return;
        }

        this.setLoading(true);

        try {
            if (Config.USE_REAL_API) {
                this.providers = await GoogleMapsAPI.searchByText(this.currentSearch, this.currentLocation);
                this.syncWithAppState();
            } else {
                const searchImage = await ImagesAPI.searchImage(`${this.currentSearch} mechanic`, 400, 300);

                this.providers = this.providers.filter((provider) =>
                    provider.name.toLowerCase().includes(this.currentSearch)
                    || provider.address.toLowerCase().includes(this.currentSearch)
                    || (provider.services || []).some((service) => service.toLowerCase().includes(this.currentSearch))).map((provider) => ({
                    ...provider,
                    photoUrl: searchImage,
                }));
            }
        } catch (error) {
            console.error('Erro na busca:', error);
        }

        this.setLoading(false);
        this.render();
    },

    async searchNearby() {
        this.setLoading(true);

        try {
            if (Config.USE_REAL_API) {
                this.providers = await GoogleMapsAPI.searchNearbyMechanics(this.currentLocation);
                this.syncWithAppState();
            } else {
                await this.loadSimulatedProvidersWithImages();
            }
        } catch (error) {
            console.error('Erro ao buscar:', error);
        }

        this.setLoading(false);
        this.render();
    },

    async updateLocation() {
        this.setLoading(true);

        try {
            this.currentLocation = await GoogleMapsAPI.getCurrentLocation();

            const locationText = document.querySelector('[data-location-text]');
            if (locationText) {
                locationText.textContent = `Lat: ${this.currentLocation.lat.toFixed(4)}, Lng: ${this.currentLocation.lng.toFixed(4)}`;
            }

            await this.searchNearby();
            UI.showToast('Localização atualizada!', 'success');
        } catch (error) {
            UI.showToast('Não foi possível obter localização', 'error');
        }

        this.setLoading(false);
    },

    setLoading(loading) {
        this.isLoading = loading;
        const grid = document.getElementById('providers-grid');
        const loader = document.getElementById('providers-loader');

        if (loader) loader.classList.toggle('hidden', !loading);
        if (grid) grid.classList.toggle('opacity-50', loading);

        const countElement = document.getElementById('providers-count');
        if (countElement) {
            countElement.textContent = loading ? '...' : this.getFilteredProviders().length;
        }
    },

    getFilteredProviders() {
        let filtered = this.providers;

        if (this.currentType !== 'all') {
            filtered = filtered.filter((provider) => provider.type === this.currentType);
        }

        if (!Config.USE_REAL_API && this.currentSearch) {
            filtered = filtered.filter((provider) =>
                provider.name.toLowerCase().includes(this.currentSearch)
                || (provider.services || []).some((service) => service.toLowerCase().includes(this.currentSearch)));
        }

        return filtered;
    },

    render() {
        const container = document.getElementById('providers-grid');
        if (!container) return;

        const providers = this.getFilteredProviders();

        if (providers.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <img src="${ImagesAPI.getPlaceholder(200, 200, 'Não Encontrado')}" class="mx-auto mb-4 rounded-lg opacity-50">
                    <p class="text-gray-500 text-lg mb-2">Nenhuma mecânica encontrada</p>
                    <p class="text-gray-400 text-sm">Tente ajustar os filtros ou buscar em outra área</p>
                </div>
            `;
            return;
        }

        container.innerHTML = providers.map((provider) => this.renderProviderCard(provider)).join('');
    },

    renderProviderCard(provider) {
        const typeColor = Utils.providerTypeColors[provider.type] || 'bg-gray-100 text-gray-700';
        const typeLabel = Utils.providerTypeLabels[provider.type] || 'Oficina';
        const icon = Utils.providerIcons[provider.type] || 'wrench';

        let openStatus = '';
        if (provider.isOpen !== null && provider.isOpen !== undefined) {
            openStatus = provider.isOpen
                ? '<span class="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium"><span class="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>Aberto</span>'
                : '<span class="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium"><i class="fas fa-clock mr-1"></i>Fechado</span>';
        }

        const photoHtml = provider.photoUrl
            ? `<div class="relative h-48 overflow-hidden">
                <img src="${provider.photoUrl}" alt="${provider.name}" class="w-full h-full object-cover transition-transform duration-700 hover:scale-110" onerror="this.src='${ImagesAPI.getPlaceholder(400, 300, provider.name)}'">
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div class="absolute bottom-3 left-3 right-3">
                    <h3 class="font-bold text-white text-lg leading-tight">${provider.name}</h3>
                </div>
               </div>`
            : `<div class="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <i class="fas fa-${icon} text-6xl text-gray-400"></i>
               </div>`;

        const stars = this.renderStars(provider.rating || 0);

        const badge = provider.partner
            ? '<span class="absolute top-3 right-3 bg-green-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg z-10"><i class="fas fa-check-circle mr-1"></i>PARCEIRO</span>'
            : (provider.source === 'google_maps' ? '<span class="absolute top-3 right-3 bg-white text-gray-800 text-xs px-2 py-1 rounded-full font-medium shadow-lg z-10"><i class="fab fa-google mr-1"></i>Google</span>' : '');

        const whatsappBtn = provider.whatsappNumber
            ? `<a href="https://wa.me/55${provider.whatsappNumber}" target="_blank"
                class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-center text-sm font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-green-600/30">
                <i class="fab fa-whatsapp text-lg"></i> WhatsApp
               </a>`
            : `<button disabled class="flex-1 bg-gray-200 text-gray-400 py-2.5 rounded-lg text-center text-sm cursor-not-allowed">
                <i class="fab fa-whatsapp"></i> Indisponível
               </button>`;

        const phoneBtn = provider.phone
            ? `<a href="tel:${provider.phone.replace(/\D/g, '')}"
                class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-center text-sm font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30">
                <i class="fas fa-phone"></i> Ligar
               </a>`
            : '';

        const servicesTags = (provider.services || []).slice(0, 3).map((service) =>
            `<span class="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md mr-1 mb-1">${service}</span>`
        ).join('');

        const reviewsPreview = provider.reviews_list && provider.reviews_list.length > 0
            ? `<div class="mt-3 pt-3 border-t border-gray-100">
                <p class="text-xs text-gray-500 mb-2">Última avaliação:</p>
                <div class="bg-gray-50 p-2 rounded-lg">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="font-medium text-xs text-gray-700">${provider.reviews_list[0].author}</span>
                        <div class="text-yellow-400 text-xs">${'★'.repeat(Math.round(provider.reviews_list[0].rating))}</div>
                    </div>
                    <p class="text-xs text-gray-600 line-clamp-2">"${provider.reviews_list[0].text}"</p>
                </div>
               </div>`
            : '';

        return `
            <div class="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden card-hover relative">
                ${badge}
                ${photoHtml}

                <div class="p-5">
                    <div class="flex items-center gap-2 mb-3">
                        <span class="text-xs ${typeColor} px-2 py-1 rounded-md font-medium">${typeLabel}</span>
                        ${openStatus}
                    </div>

                    <div class="flex items-center gap-2 mb-3">
                        <div class="flex text-yellow-400 text-sm">
                            ${stars}
                        </div>
                        <span class="text-sm font-bold text-gray-800">${Number(provider.rating || 0).toFixed(1)}</span>
                        <span class="text-xs text-gray-500">(${provider.reviews || 0} avaliações)</span>
                    </div>

                    <div class="space-y-2 mb-4 text-sm">
                        <div class="flex items-start gap-2 text-gray-600">
                            <i class="fas fa-map-marker-alt text-red-500 mt-0.5 w-4"></i>
                            <span class="line-clamp-2 text-xs leading-relaxed">${provider.address}</span>
                        </div>
                        ${provider.hours ? `
                        <div class="flex items-center gap-2 text-gray-600">
                            <i class="fas fa-clock text-blue-500 w-4"></i>
                            <span class="text-xs">${provider.hours}</span>
                        </div>
                        ` : ''}
                        ${provider.phone ? `
                        <div class="flex items-center gap-2 text-gray-600">
                            <i class="fas fa-phone text-green-500 w-4"></i>
                            <span class="text-xs font-medium">${provider.phone}</span>
                        </div>
                        ` : ''}
                    </div>

                    <div class="flex flex-wrap mb-3">
                        ${servicesTags}
                    </div>

                    ${reviewsPreview}

                    <div class="flex gap-2 mt-4">
                        ${whatsappBtn}
                        ${phoneBtn}
                    </div>

                    ${provider.reviews_list && provider.reviews_list.length > 1 ? `
                    <button onclick="Providers.showDetails('${provider.id}')" class="w-full mt-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors border border-blue-200">
                        <i class="fas fa-comments mr-1"></i> Ver todas as ${provider.reviews} avaliações
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    },

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 >= 0.5;
        let html = '';

        for (let i = 0; i < fullStars; i += 1) {
            html += '<i class="fas fa-star"></i>';
        }
        if (hasHalf) {
            html += '<i class="fas fa-star-half-alt"></i>';
        }
        const empty = 5 - fullStars - (hasHalf ? 1 : 0);
        for (let i = 0; i < empty; i += 1) {
            html += '<i class="far fa-star text-gray-300"></i>';
        }

        return html;
    },

    showDetails(providerId) {
        const provider = this.providers.find((item) => String(item.id) === String(providerId));
        if (!provider) return;

        const imageUrl = provider.photoUrl || ImagesAPI.getPlaceholder();

        const reviewsHtml = provider.reviews_list ? provider.reviews_list.map((review) => `
            <div class="border-b border-gray-100 last:border-0 pb-3 mb-3">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <img src="${ImagesAPI.getAvatar(review.author, 32)}" class="w-8 h-8 rounded-full">
                        <span class="font-medium text-sm text-gray-800">${review.author}</span>
                    </div>
                    <div class="text-yellow-400 text-xs">
                        ${Array(review.rating).fill('<i class="fas fa-star"></i>').join('')}
                    </div>
                </div>
                <p class="text-sm text-gray-600 mb-1 leading-relaxed">"${review.text}"</p>
                <span class="text-xs text-gray-400">${review.time}</span>
            </div>
        `).join('') : '<p class="text-gray-500 text-center py-4">Nenhuma avaliação detalhada disponível</p>';

        const content = `
            <div class="space-y-4">
                <div class="relative h-48 rounded-lg overflow-hidden">
                    <img src="${imageUrl}" class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div class="absolute bottom-4 left-4 text-white">
                        <h4 class="font-bold text-xl">${provider.name}</h4>
                        <p class="text-sm opacity-90">${provider.address}</p>
                    </div>
                </div>

                <div class="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div class="flex items-center gap-3">
                        <div class="text-3xl font-bold text-gray-800">${Number(provider.rating || 0).toFixed(1)}</div>
                        <div>
                            <div class="flex text-yellow-400 text-sm">
                                ${this.renderStars(provider.rating || 0)}
                            </div>
                            <div class="text-xs text-gray-500">${provider.reviews || 0} avaliações no Google</div>
                        </div>
                    </div>
                    ${provider.isOpen !== null && provider.isOpen !== undefined ? `
                    <span class="px-3 py-1 rounded-full text-xs font-medium ${provider.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                        ${provider.isOpen ? 'Aberto agora' : 'Fechado'}
                    </span>
                    ` : ''}
                </div>

                <div>
                    <h5 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <i class="fas fa-comments text-blue-500"></i> Avaliações dos clientes
                    </h5>
                    <div class="max-h-64 overflow-y-auto pr-2">
                        ${reviewsHtml}
                    </div>
                </div>

                <div class="flex gap-2 pt-2">
                    ${provider.whatsappNumber ? `
                    <a href="https://wa.me/55${provider.whatsappNumber}" target="_blank"
                        class="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg text-center font-medium transition-colors flex items-center justify-center gap-2">
                        <i class="fab fa-whatsapp"></i> Abrir WhatsApp
                    </a>
                    ` : ''}
                    ${provider.website ? `
                    <a href="${provider.website}" target="_blank"
                        class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-center font-medium transition-colors flex items-center justify-center gap-2">
                        <i class="fas fa-globe"></i> Visitar Site
                    </a>
                    ` : ''}
                </div>
            </div>
        `;

        UI.showModal(provider.name, content);
    },
};

window.Providers = Providers;
