/**
 * Configuration Module
 */

const Config = {
    GOOGLE_MAPS_API_KEY: 'SUA_CHAVE_API_AQUI',
    GOOGLE_MAPS_SCRIPT: 'https://maps.googleapis.com/maps/api/js',
    PLACES_API_BASE: 'https://maps.googleapis.com/maps/api/place',
    SEARCH_RADIUS: 5000,
    DEFAULT_LOCATION: { lat: -23.550520, lng: -46.633308 },
    USE_REAL_API: false,
    
    // NOVO: Logos das marcas de veículos
    BRAND_LOGOS: {
        'Chevrolet': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Chevrolet-logo.png/120px-Chevrolet-logo.png',
        'Fiat': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Fiat_Automobiles_logo.svg/120px-Fiat_Automobiles_logo.svg.png',
        'Ford': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Ford_logo_flat.svg/120px-Ford_logo_flat.svg.png',
        'Honda': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Honda.svg/120px-Honda.svg.png',
        'Hyundai': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Hyundai_Motor_Company_logo.svg/120px-Hyundai_Motor_Company_logo.svg.png',
        'Renault': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Renault_Logo_2021.svg/120px-Renault_Logo_2021.svg.png',
        'Toyota': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Toyota_carlogo.svg/120px-Toyota_carlogo.svg.png',
        'Volkswagen': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Volkswagen_logo_2019.svg/120px-Volkswagen_logo_2019.svg.png',
        'Outro': null
    },

    init() {
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
    },
    
    // NOVO: Obter logo da marca
    getBrandLogo(brand) {
        return this.BRAND_LOGOS[brand] || null;
    },
    
    // NOVO: Lista de marcas disponíveis
    getBrands() {
        return Object.keys(this.BRAND_LOGOS);
    }
};

window.Config = Config;
