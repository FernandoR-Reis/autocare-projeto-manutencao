/**
 * State Store
 * Gerenciamento centralizado de estado
 */

(() => {
    const constants = window.CONSTANTS || {
        STORAGE_KEY: 'autocare_data',
        DEFAULT_ALERT_DAYS: 30,
        DEFAULT_ALERT_KM: 1000,
    };

    const initialState = {
        user: null,
        vehicles: [],
        maintenances: [],
        notifications: [],
        settings: {
            alertDays: constants.DEFAULT_ALERT_DAYS,
            alertKm: constants.DEFAULT_ALERT_KM,
            emailNotifications: true,
        },
        ui: {
            currentPage: 'dashboard',
            isLoading: false,
            modalOpen: null,
        },
    };

    class Store {
        constructor() {
            this.state = this.loadFromStorage() || this.clone(initialState);
            this.listeners = new Set();
            this.initialized = false;
        }

        getState() {
            return this.clone(this.state);
        }

        getUser() {
            return this.state.user;
        }

        getVehicles() {
            return this.clone(this.state.vehicles);
        }

        getMaintenances() {
            return this.clone(this.state.maintenances);
        }

        getVehicleById(id) {
            return this.state.vehicles.find((vehicle) => vehicle.id === id);
        }

        getMaintenanceById(id) {
            return this.state.maintenances.find((maintenance) => maintenance.id === id);
        }

        getMaintenancesByVehicle(vehicleId) {
            return this.state.maintenances.filter((maintenance) => maintenance.vehicleId === vehicleId);
        }

        getSettings() {
            return this.clone(this.state.settings);
        }

        setState(newState) {
            this.state = { ...this.state, ...newState };
            this.persist();
            this.notify();
        }

        setUser(user) {
            this.state.user = user;
            this.persist();
            this.notify();
        }

        addVehicle(vehicle) {
            this.state.vehicles.push(vehicle);
            this.persist();
            this.notify();
        }

        updateVehicle(id, updates) {
            const index = this.state.vehicles.findIndex((vehicle) => vehicle.id === id);
            if (index !== -1) {
                this.state.vehicles[index] = { ...this.state.vehicles[index], ...updates };
                this.persist();
                this.notify();
            }
        }

        removeVehicle(id) {
            this.state.vehicles = this.state.vehicles.filter((vehicle) => vehicle.id !== id);
            this.state.maintenances = this.state.maintenances.filter((maintenance) => maintenance.vehicleId !== id);
            this.persist();
            this.notify();
        }

        addMaintenance(maintenance) {
            this.state.maintenances.push(maintenance);
            this.persist();
            this.notify();
        }

        updateMaintenance(id, updates) {
            const index = this.state.maintenances.findIndex((maintenance) => maintenance.id === id);
            if (index !== -1) {
                this.state.maintenances[index] = { ...this.state.maintenances[index], ...updates };
                this.persist();
                this.notify();
            }
        }

        removeMaintenance(id) {
            this.state.maintenances = this.state.maintenances.filter((maintenance) => maintenance.id !== id);
            this.persist();
            this.notify();
        }

        addNotification(notification) {
            this.state.notifications.unshift(notification);
            if (this.state.notifications.length > 50) {
                this.state.notifications = this.state.notifications.slice(0, 50);
            }
            this.persist();
            this.notify();
        }

        markNotificationAsRead(id) {
            const notification = this.state.notifications.find((item) => item.id === id);
            if (notification) {
                notification.read = true;
                this.persist();
                this.notify();
            }
        }

        markAllNotificationsAsRead() {
            this.state.notifications.forEach((notification) => {
                notification.read = true;
            });
            this.persist();
            this.notify();
        }

        updateSettings(settings) {
            this.state.settings = { ...this.state.settings, ...settings };
            this.persist();
            this.notify();
        }

        persist() {
            try {
                const data = {
                    user: this.state.user,
                    vehicles: this.state.vehicles,
                    maintenances: this.state.maintenances,
                    notifications: this.state.notifications,
                    settings: this.state.settings,
                };
                localStorage.setItem(constants.STORAGE_KEY, JSON.stringify(data));
            } catch (error) {
                console.error('Erro ao persistir estado:', error);
            }
        }

        loadFromStorage() {
            try {
                const data = localStorage.getItem(constants.STORAGE_KEY);
                if (data) {
                    return JSON.parse(data);
                }
            } catch (error) {
                console.error('Erro ao carregar estado:', error);
            }
            return null;
        }

        reset() {
            this.state = this.clone(initialState);
            try {
                localStorage.removeItem(constants.STORAGE_KEY);
            } catch (error) {
                console.error('Erro ao limpar storage:', error);
            }
            this.notify();
        }

        subscribe(listener) {
            this.listeners.add(listener);
            return () => this.listeners.delete(listener);
        }

        notify() {
            this.listeners.forEach((listener) => {
                try {
                    listener(this.getState());
                } catch (error) {
                    console.error('Erro no listener:', error);
                }
            });
        }

        clone(obj) {
            return JSON.parse(JSON.stringify(obj));
        }

        initDemoData() {
            if (this.state.vehicles.length !== 0) {
                return;
            }

            const demoVehicle = {
                id: this.generateId(),
                nickname: 'Meu Gol',
                brand: 'Volkswagen',
                model: 'Gol',
                year: 2020,
                plate: 'ABC-1234',
                km: 45200,
                fuel: 'flex',
                imageUrl: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                kmHistory: [
                    { km: 0, date: new Date(2020, 0, 1).toISOString() },
                    { km: 15000, date: new Date(2021, 6, 1).toISOString() },
                    { km: 30000, date: new Date(2022, 6, 1).toISOString() },
                    { km: 45200, date: new Date().toISOString() },
                ],
            };

            this.state.vehicles.push(demoVehicle);

            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);

            const sixtyDaysAgo = new Date(today);
            sixtyDaysAgo.setDate(today.getDate() - 60);

            const ninetyDaysAgo = new Date(today);
            ninetyDaysAgo.setDate(today.getDate() - 90);

            this.state.maintenances = [
                {
                    id: this.generateId(),
                    vehicleId: demoVehicle.id,
                    type: 'oil',
                    name: 'Troca de Óleo e Filtro',
                    description: 'Óleo sintético 5W30',
                    date: thirtyDaysAgo.toISOString().split('T')[0],
                    km: 40000,
                    nextDays: 180,
                    nextKm: 50000,
                    nextDate: new Date(thirtyDaysAgo.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    status: 'ok',
                    createdAt: thirtyDaysAgo.toISOString(),
                },
                {
                    id: this.generateId(),
                    vehicleId: demoVehicle.id,
                    type: 'brake',
                    name: 'Pastilhas de Freio',
                    description: 'Troca das pastilhas dianteiras',
                    date: sixtyDaysAgo.toISOString().split('T')[0],
                    km: 35000,
                    nextDays: 365,
                    nextKm: 55000,
                    nextDate: new Date(sixtyDaysAgo.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    status: 'warning',
                    createdAt: sixtyDaysAgo.toISOString(),
                },
                {
                    id: this.generateId(),
                    vehicleId: demoVehicle.id,
                    type: 'tire',
                    name: 'Rodízio de Pneus',
                    description: 'Rodízio e balanceamento',
                    date: ninetyDaysAgo.toISOString().split('T')[0],
                    km: 32000,
                    nextDays: 90,
                    nextKm: 37000,
                    nextDate: new Date(ninetyDaysAgo.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    status: 'overdue',
                    createdAt: ninetyDaysAgo.toISOString(),
                },
            ];

            this.state.notifications = [
                {
                    id: this.generateId(),
                    type: 'system',
                    title: 'Bem-vindo ao AutoCare Pro!',
                    message: 'Comece cadastrando seus veículos e mantenha as manutenções em dia.',
                    read: false,
                    createdAt: new Date().toISOString(),
                },
            ];

            this.persist();
        }

        generateId() {
            return Date.now().toString(36) + Math.random().toString(36).slice(2);
        }
    }

    const store = new Store();

    window.Store = Store;
    window.store = store;
    window.State = Object.assign(window.State || {}, { store });
})();
