/**
 * Images API Module
 * Busca e gerencia imagens da web para o projeto
 */

const ImagesAPI = {
    // Fontes de imagens gratuitas
    sources: {
        unsplash: 'https://source.unsplash.com',
        picsum: 'https://picsum.photos',
        placeholder: 'https://via.placeholder.com'
    },

    // Cache de imagens para não repetir buscas
    cache: new Map(),

    // Categorias de imagens pré-definidas
    categories: {
        vehicles: {
            car: ['car', 'automobile', 'vehicle'],
            motorcycle: ['motorcycle', 'motorbike', 'bike'],
            truck: ['truck', 'pickup', 'van']
        },
        mechanics: {
            workshop: ['mechanic workshop', 'car repair', 'auto shop'],
            tools: ['mechanic tools', 'wrench', 'car maintenance'],
            garage: ['garage', 'automotive', 'service station']
        },
        parts: {
            engine: ['car engine', 'motor', 'mechanic'],
            tire: ['car tire', 'wheel', 'automotive'],
            oil: ['motor oil', 'car service', 'maintenance']
        },
        ui: {
            avatar: ['person', 'user', 'profile'],
            background: ['abstract', 'gradient', 'technology'],
            icon: ['icon', 'symbol', 'flat design']
        }
    },

    /**
     * Inicializa o módulo de imagens
     */
    init() {
        console.log('🖼️ ImagesAPI inicializado');
        this.preloadEssentialImages();
    },

    /**
     * Busca imagem da web baseada em termos
     */
    async searchImage(query, width = 400, height = 300) {
        const cacheKey = `${query}_${width}x${height}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Usar Unsplash Source (gratuito, não requer API key para uso básico)
        const url = `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(query)}`;

        // Para desenvolvimento, usar Picsum como fallback mais estável
        const fallbackUrl = `https://picsum.photos/${width}/${height}?random=${Date.now()}`;

        this.cache.set(cacheKey, url || fallbackUrl);
        return this.cache.get(cacheKey);
    },

    /**
     * Busca imagem específica por categoria
     */
    async getByCategory(category, subcategory, index = 0) {
        const terms = this.categories[category]?.[subcategory];
        if (!terms) return this.getPlaceholder();

        const query = terms[index % terms.length];
        return this.searchImage(query);
    },

    /**
     * Gera URL de imagem de veículo baseado em marca/modelo
     */
    getVehicleImage(brand, model, type = 'car') {
        const queries = {
            Volkswagen: 'volkswagen car',
            Chevrolet: 'chevrolet car',
            Fiat: 'fiat car',
            Ford: 'ford car',
            Honda: 'honda car',
            Toyota: 'toyota car',
            Hyundai: 'hyundai car',
            Renault: 'renault car'
        };

        const query = queries[brand] || `${brand || model} ${type}`;
        return `https://source.unsplash.com/400x300/?${encodeURIComponent(query)}`;
    },

    /**
     * Gera imagem de mecânica/oficina
     */
    getMechanicImage(type = 'workshop', index = 0) {
        const images = [
            'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400',
            'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400',
            'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=400',
            'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=400',
            'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400',
            'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400'
        ];

        return images[index % images.length];
    },

    /**
     * Avatar gerado automaticamente
     */
    getAvatar(name, size = 128) {
        const initials = String(name || 'U')
            .split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();

        const colors = ['0f172a', '1e40af', '047857', 'b45309', 'be123c', '6b21a8'];
        const color = colors[String(name || '').length % colors.length];

        return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${color}&color=fff&size=${size}&font-size=0.4&bold=true`;
    },

    /**
     * Ícone/SVG como imagem
     */
    getIcon(iconName, color = '3b82f6', size = 64) {
        return `https://api.iconify.design/mdi/${iconName}.svg?color=%23${color}&width=${size}`;
    },

    /**
     * Imagem placeholder
     */
    getPlaceholder(width = 400, height = 300, text = 'Sem Imagem') {
        return `https://via.placeholder.com/${width}x${height}/e2e8f0/64748b?text=${encodeURIComponent(text)}`;
    },

    /**
     * Background pattern
     */
    getBackground(type = 'abstract') {
        const backgrounds = {
            abstract: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920',
            automotive: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920',
            technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920',
            gradient: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920'
        };

        return backgrounds[type] || backgrounds.abstract;
    },

    /**
     * Pré-carrega imagens essenciais
     */
    preloadEssentialImages() {
        const essential = [
            this.getMechanicImage('workshop', 0),
            this.getMechanicImage('tools', 1),
            this.getAvatar('Usuario', 64)
        ];

        essential.forEach((src) => {
            const img = new Image();
            img.src = src;
        });
    },

    /**
     * Busca múltiplas imagens de uma vez
     */
    async searchMultiple(queries, width = 400, height = 300) {
        const promises = queries.map((query) => this.searchImage(query, width, height));
        return Promise.all(promises);
    },

    /**
     * Otimiza URL para tamanho específico
     */
    optimizeUrl(url, width, height) {
        if (url.includes('unsplash.com')) {
            return url.replace('w=400', `w=${width}`).replace('h=300', `h=${height}`);
        }
        return url;
    }
};

window.ImagesAPI = ImagesAPI;
