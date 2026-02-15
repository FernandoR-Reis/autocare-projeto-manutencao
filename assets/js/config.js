/**
 * Configuration Module
 * Centraliza configurações e chaves de API
 */

const Config = {
    // Google Maps API Key
    // Substitua pela sua chave real em produção
    GOOGLE_MAPS_API_KEY: 'SUA_CHAVE_API_AQUI', // <-- COLOQUE SUA CHAVE AQUI

    // URLs da API
    GOOGLE_MAPS_SCRIPT: 'https://maps.googleapis.com/maps/api/js',
    PLACES_API_BASE: 'https://maps.googleapis.com/maps/api/place',

    // Configurações de busca
    SEARCH_RADIUS: 5000, // 5km em metros
    DEFAULT_LOCATION: { lat: -23.550520, lng: -46.633308 }, // São Paulo

    // Feature flags
    USE_REAL_API: false, // Será true quando houver chave válida

    init() {
        // Verificar se há chave de API válida
        this.USE_REAL_API = this.GOOGLE_MAPS_API_KEY &&
                           this.GOOGLE_MAPS_API_KEY !== 'SUA_CHAVE_API_AQUI' &&
                           this.GOOGLE_MAPS_API_KEY.length > 10;

        console.log('🔧 Config:', this.USE_REAL_API ? 'Usando API Real' : 'Usando dados simulados');

        if (this.USE_REAL_API) {
            this.loadGoogleMapsScript();
        }
    },

    loadGoogleMapsScript() {
        return new Promise((resolve, reject) => {
            if (window.google?.maps) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = `${this.GOOGLE_MAPS_SCRIPT}?key=${this.GOOGLE_MAPS_API_KEY}&libraries=places,geometry&callback=initMap`;
            script.async = true;
            script.defer = true;
            script.onerror = reject;

            window.initMap = () => {
                console.log('✅ Google Maps carregado');
                resolve();
            };

            document.head.appendChild(script);
        });
    }
};

window.Config = Config;
