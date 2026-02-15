/**
 * Providers Module (Atualizado)
 * Integração completa com Google Maps Places API
 */

const Providers = {
    currentSearch: '',
    currentType: 'all',
    currentLocation: null,
    isLoading: false,
    providers: [],
    allProviders: [],

    typeLabels: {
        mechanic: 'Mecânica',
        electric: 'Elétrica',
        tire: 'Borracharia',
        body: 'Funilaria',
        detailing: 'Estética',
    },

    typeColors: {
        mechanic: 'bg-blue-100 text-blue-700',
        electric: 'bg-yellow-100 text-yellow-700',
        tire: 'bg-gray-100 text-gray-700',
        body: 'bg-red-100 text-red-700',
        detailing: 'bg-purple-100 text-purple-700',
    },

    typeIcons: {
        mechanic: 'wrench',
        electric: 'bolt',
        tire: 'circle',
        body: 'car-crash',
        detailing: 'sparkles',
    },

    debounce(fn, wait = 500) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), wait);
        };
    },

    toast(message, type = 'info') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
            return;
        }
        console.log(message);
    },

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
                this.allProviders = providers;
            }
        }
    },

    async init() {
        this.loadFromAppState();

        const apiReady = await GoogleMapsAPI.init();

        if (apiReady) {
            try {
                this.currentLocation = await GoogleMapsAPI.getCurrentLocation();
                console.log('📍 Localização obtida:', this.currentLocation);
            } catch (error) {
                console.warn('Usando localização padrão');
                this.currentLocation = Config.DEFAULT_LOCATION;
            }

            await this.searchNearby();
        } else if (!this.providers.length) {
            this.currentLocation = Config.DEFAULT_LOCATION;
            this.providers = await GoogleMapsAPI.getSimulatedMechanics(this.currentLocation);
            this.allProviders = this.providers;
            this.syncWithAppState();
        }

        this.updateLocationText();
        this.bindEvents();
        this.render();
    },

    updateLocationText() {
        const locationText = document.querySelector('[data-location-text]');
        if (!locationText) return;

        if (this.currentLocation?.lat && this.currentLocation?.lng) {
            locationText.textContent = `Lat: ${this.currentLocation.lat.toFixed(4)}, Lng: ${this.currentLocation.lng.toFixed(4)}`;
            return;
        }

        locationText.textContent = 'Sua localização atual';
    },

    bindEvents() {
        const searchInput = document.getElementById('provider-search');
        if (searchInput && !searchInput.dataset.providersBound) {
            searchInput.dataset.providersBound = 'true';
            searchInput.addEventListener('input', this.debounce((event) => {
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
    },

    async handleSearch(query) {
        this.currentSearch = String(query || '').toLowerCase().trim();

        if (this.currentSearch.length < 3) {
            if (this.currentSearch === '') {
                await this.searchNearby();
            }
            this.render();
            return;
        }

        this.setLoading(true);

        try {
            if (Config.USE_REAL_API) {
                this.providers = await GoogleMapsAPI.searchByText(this.currentSearch, this.currentLocation);
                this.allProviders = this.providers;
                this.syncWithAppState();
            } else {
                const source = this.allProviders.length ? this.allProviders : this.providers;
                this.providers = source.filter((provider) =>
                    provider.name.toLowerCase().includes(this.currentSearch)
                    || provider.address.toLowerCase().includes(this.currentSearch)
                    || (provider.services || []).some((service) => service.toLowerCase().includes(this.currentSearch)));
            }
        } catch (error) {
            console.error('Erro na busca:', error);
            this.toast('Erro ao buscar. Tente novamente.', 'error');
        }

        this.setLoading(false);
        this.render();
    },

    async searchNearby() {
        this.setLoading(true);

        try {
            this.providers = await GoogleMapsAPI.searchNearbyMechanics(this.currentLocation);
            this.allProviders = this.providers;
            this.syncWithAppState();
            console.log(`✅ ${this.providers.length} mecânicas encontradas`);
        } catch (error) {
            console.error('Erro ao buscar próximas:', error);
            this.toast('Erro ao buscar mecânicas próximas', 'error');
        }

        this.setLoading(false);
        this.render();
    },

    async updateLocation() {
        this.setLoading(true);

        try {
            this.currentLocation = await GoogleMapsAPI.getCurrentLocation();
            this.updateLocationText();

            await this.searchNearby();
            this.toast('Localização atualizada!', 'success');
        } catch (error) {
            this.toast('Não foi possível obter localização', 'error');
        }

        this.setLoading(false);
    },

    setLoading(loading) {
        this.isLoading = loading;
        const grid = document.getElementById('providers-grid');
        const loader = document.getElementById('providers-loader');

        if (loader) {
            loader.classList.toggle('hidden', !loading);
        }

        if (grid) {
            grid.classList.toggle('opacity-50', loading);
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
        const countElement = document.getElementById('providers-count');
        if (countElement) {
            countElement.textContent = String(providers.length);
        }

        if (providers.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-search text-3xl text-gray-400"></i>
                    </div>
                    <p class="text-gray-500 text-lg mb-2">Nenhuma mecânica encontrada</p>
                    <p class="text-gray-400 text-sm">Tente ajustar os filtros ou buscar em outra área</p>
                    ${!Config.USE_REAL_API ? `
                        <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md mx-auto">
                            <p class="text-sm text-yellow-700">
                                <i class="fas fa-info-circle mr-1"></i>
                                Modo demonstração ativo. Configure sua chave Google Maps API para resultados reais.
                            </p>
                        </div>
                    ` : ''}
                </div>
            `;
            return;
        }

        container.innerHTML = providers.map((provider) => this.renderProviderCard(provider)).join('');
    },

    renderProviderCard(provider) {
        const typeColor = this.typeColors[provider.type] || 'bg-gray-100 text-gray-700';
        const typeLabel = this.typeLabels[provider.type] || 'Oficina';
        const icon = this.typeIcons[provider.type] || 'wrench';

        let openStatus = '';
        if (provider.isOpen !== null && provider.isOpen !== undefined) {
            openStatus = provider.isOpen
                ? '<span class="text-green-600 font-medium"><i class="fas fa-door-open mr-1"></i>Aberto agora</span>'
                : '<span class="text-red-500 font-medium"><i class="fas fa-door-closed mr-1"></i>Fechado</span>';
        }

        const photoHtml = provider.photoUrl
            ? `<img src="${provider.photoUrl}" alt="${provider.name}" class="w-full h-48 object-cover" onerror="this.src='https://via.placeholder.com/400x300?text=Sem+Foto'">`
            : `<div class="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <i class="fas fa-${icon} text-4xl text-gray-400"></i>
               </div>`;

        const stars = this.renderStars(Number(provider.rating || 0));

        const badge = provider.partner
            ? '<span class="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg"><i class="fas fa-check-circle mr-1"></i>Parceiro</span>'
            : (provider.source === 'google_maps' ? '<span class="absolute top-3 right-3 bg-white text-gray-700 text-xs px-2 py-1 rounded-full font-medium shadow-lg"><i class="fab fa-google mr-1"></i>Google</span>' : '');

        const whatsappBtn = provider.whatsappNumber
            ? `<a href="https://wa.me/55${provider.whatsappNumber}" target="_blank"
                class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-center text-sm font-medium transition-colors flex items-center justify-center gap-1">
                <i class="fab fa-whatsapp"></i> WhatsApp
               </a>`
            : `<button disabled class="flex-1 bg-gray-300 text-gray-500 py-2 rounded-lg text-center text-sm cursor-not-allowed">
                <i class="fab fa-whatsapp"></i> Indisponível
               </button>`;

        const phoneBtn = provider.phone
            ? `<a href="tel:${provider.phone.replace(/\D/g, '')}"
                class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-center text-sm font-medium transition-colors flex items-center justify-center gap-1">
                <i class="fas fa-phone"></i> Ligar
               </a>`
            : '';

        const detailsBtn = provider.reviews_list && provider.reviews_list.length > 0
            ? `<button onclick="Providers.showDetails('${provider.id}')" class="w-full mt-2 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors">
                <i class="fas fa-info-circle mr-1"></i> Ver detalhes e avaliações
               </button>`
            : '';

        return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden card-hover relative">
                ${badge}
                ${photoHtml}
                <div class="p-5">
                    <div class="flex items-start justify-between mb-3">
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-xs ${typeColor} px-2 py-0.5 rounded font-medium">${typeLabel}</span>
                                ${provider.priceLevel ? `<span class="text-xs text-gray-500">${'💰'.repeat(provider.priceLevel)}</span>` : ''}
                            </div>
                            <h3 class="font-bold text-lg text-gray-800 leading-tight">${provider.name}</h3>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 mb-3">
                        <div class="flex text-yellow-400 text-sm">
                            ${stars}
                        </div>
                        <span class="text-sm font-medium text-gray-700">${Number(provider.rating || 0).toFixed(1)}</span>
                        <span class="text-xs text-gray-500">(${provider.reviews || 0} avaliações)</span>
                    </div>

                    <div class="space-y-2 mb-4 text-sm">
                        <div class="flex items-start gap-2 text-gray-600">
                            <i class="fas fa-map-marker-alt text-red-500 mt-0.5 w-4"></i>
                            <span class="line-clamp-2">${provider.address || 'Endereço não informado'}</span>
                        </div>
                        ${provider.distance ? `
                        <div class="flex items-center gap-2 text-gray-600">
                            <i class="fas fa-route text-purple-500 w-4"></i>
                            <span>${provider.distance}</span>
                        </div>
                        ` : ''}
                        ${provider.hours ? `
                        <div class="flex items-center gap-2 text-gray-600">
                            <i class="fas fa-clock text-blue-500 w-4"></i>
                            <span>${provider.hours}</span>
                            ${openStatus}
                        </div>
                        ` : ''}
                        ${provider.phone ? `
                        <div class="flex items-center gap-2 text-gray-600">
                            <i class="fas fa-phone text-green-500 w-4"></i>
                            <span>${provider.phone}</span>
                        </div>
                        ` : ''}
                    </div>

                    <div class="flex flex-wrap gap-1 mb-4">
                        ${(provider.services || []).slice(0, 3).map((service) =>
                            `<span class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">${service}</span>`
                        ).join('')}
                    </div>

                    <div class="flex gap-2">
                        ${whatsappBtn}
                        ${phoneBtn}
                    </div>

                    ${detailsBtn}
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
        const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
        for (let i = 0; i < emptyStars; i += 1) {
            html += '<i class="far fa-star text-gray-300"></i>';
        }

        return html;
    },

    showDetails(providerId) {
        const provider = this.providers.find((item) => String(item.id) === String(providerId));
        if (!provider || !provider.reviews_list) return;

        const reviewsHtml = provider.reviews_list.map((review) => `
            <div class="border-b border-gray-100 last:border-0 pb-3 mb-3">
                <div class="flex items-center justify-between mb-1">
                    <span class="font-medium text-sm text-gray-800">${review.author}</span>
                    <div class="text-yellow-400 text-xs">
                        ${Array(review.rating).fill('<i class="fas fa-star"></i>').join('')}
                    </div>
                </div>
                <p class="text-sm text-gray-600 mb-1">${review.text}</p>
                <span class="text-xs text-gray-400">${review.time}</span>
            </div>
        `).join('');

        const existing = document.getElementById('provider-details-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'provider-details-modal';
        modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                <div class="flex items-start justify-between mb-4">
                    <h3 class="text-xl font-bold">${provider.name}</h3>
                    <button id="close-provider-details" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <p class="text-sm text-gray-500 mb-4">${provider.address || ''}</p>
                <div class="bg-gray-50 p-3 rounded-lg mb-4">
                    <h5 class="font-medium mb-2 text-sm">Avaliações recentes do Google:</h5>
                    ${reviewsHtml || '<p class="text-sm text-gray-500">Nenhuma avaliação disponível</p>'}
                </div>
                ${provider.website ? `
                <a href="${provider.website}" target="_blank" class="block w-full py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors">
                    <i class="fas fa-globe mr-1"></i> Visitar site
                </a>
                ` : ''}
            </div>
        `;

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.remove();
            }
        });

        document.body.appendChild(modal);

        const closeButton = document.getElementById('close-provider-details');
        if (closeButton) {
            closeButton.addEventListener('click', () => modal.remove());
        }
    }
};

window.Providers = Providers;
