/**
 * Constants Configuration
 * Constantes e configurações do sistema
 */

(() => {
    const CONSTANTS = {
        VERSION: '1.0.0',
        AUTH_DISABLED: true,
        STORAGE_KEY: 'autocare_data',
        SETTINGS_KEY: 'autocare_settings',
        DEFAULT_ALERT_DAYS: 30,
        DEFAULT_ALERT_KM: 1000,
        MAX_VEHICLES: 10,
        MAX_MAINTENANCE_HISTORY: 50,
        STATUS: {
            OK: 'ok',
            WARNING: 'warning',
            OVERDUE: 'overdue',
        },
        MAINTENANCE_TYPES: {
            OIL: 'oil',
            TIRE: 'tire',
            BRAKE: 'brake',
            BELT: 'belt',
            FILTER: 'filter',
            BATTERY: 'battery',
            REVIEW: 'review',
            OTHER: 'other',
        },
        FUEL_TYPES: {
            GASOLINE: { id: 'gasoline', label: 'Gasolina', icon: '⛽' },
            ETHANOL: { id: 'ethanol', label: 'Etanol', icon: '🌽' },
            FLEX: { id: 'flex', label: 'Flex', icon: '🔋' },
            DIESEL: { id: 'diesel', label: 'Diesel', icon: '🛢️' },
            GNV: { id: 'gnv', label: 'GNV', icon: '💨' },
            ELECTRIC: { id: 'electric', label: 'Elétrico', icon: '⚡' },
            HYBRID: { id: 'hybrid', label: 'Híbrido', icon: '🔌' },
        },
        STATUS_COLORS: {
            ok: { bg: '#dcfce7', text: '#166534', border: '#86efac', label: 'Em dia' },
            warning: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d', label: 'Próxima' },
            overdue: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', label: 'Vencida' },
        },
    };

    const BRANDS = {
        Chevrolet: {
            name: 'Chevrolet',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Chevrolet-logo.png/120px-Chevrolet-logo.png',
            icon: '🚗',
        },
        Fiat: {
            name: 'Fiat',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Fiat_Automobiles_logo.svg/120px-Fiat_Automobiles_logo.svg.png',
            icon: '🚗',
        },
        Ford: {
            name: 'Ford',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Ford_logo_flat.svg/120px-Ford_logo_flat.svg.png',
            icon: '🚗',
        },
        Honda: {
            name: 'Honda',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Honda.svg/120px-Honda.svg.png',
            icon: '🚗',
        },
        Hyundai: {
            name: 'Hyundai',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Hyundai_Motor_Company_logo.svg/120px-Hyundai_Motor_Company_logo.svg.png',
            icon: '🚗',
        },
        Renault: {
            name: 'Renault',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Renault_Logo_2021.svg/120px-Renault_Logo_2021.svg.png',
            icon: '🚗',
        },
        Toyota: {
            name: 'Toyota',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Toyota_carlogo.svg/120px-Toyota_carlogo.svg.png',
            icon: '🚗',
        },
        Volkswagen: {
            name: 'Volkswagen',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Volkswagen_logo_2019.svg/120px-Volkswagen_logo_2019.svg.png',
            icon: '🚗',
        },
        Outro: {
            name: 'Outra marca',
            logo: null,
            icon: '🚙',
        },
    };

    const MAINTENANCE_LABELS = {
        oil: 'Troca de Óleo',
        tire: 'Pneus/Rodízio',
        brake: 'Freios',
        belt: 'Correia Dentada',
        filter: 'Filtros',
        battery: 'Bateria',
        review: 'Revisão Geral',
        other: 'Outro Serviço',
    };

    const MAINTENANCE_PATTERNS = {
        oil: { km: 10000, months: 6 },
        tire: { km: 10000, months: 12 },
        brake: { km: 20000, months: 12 },
        belt: { km: 60000, months: 48 },
        filter: { km: 10000, months: 12 },
        battery: { km: 0, months: 36 },
        review: { km: 10000, months: 12 },
        other: { km: 0, months: 0 },
    };

    window.CONSTANTS = CONSTANTS;
    window.BRANDS = BRANDS;
    window.MAINTENANCE_LABELS = MAINTENANCE_LABELS;
    window.MAINTENANCE_PATTERNS = MAINTENANCE_PATTERNS;

    window.AppConstants = {
        CONSTANTS,
        BRANDS,
        MAINTENANCE_LABELS,
        MAINTENANCE_PATTERNS,
    };
})();
