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
            soundEnabled: true,
            hapticEnabled: true,
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
            this.mutations = this.createMutations();
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

        getUnreadNotificationsCount() {
            return this.state.notifications.filter((notification) => !notification.read).length;
        }

        createMutations() {
            return {
                setState: (state, payload) => {
                    Object.assign(state, payload || {});
                    return true;
                },
                setUser: (state, payload) => {
                    state.user = payload || null;
                    return true;
                },
                addVehicle: (state, payload) => {
                    if (!payload) {
                        return false;
                    }
                    state.vehicles.push(payload);
                    return true;
                },
                updateVehicle: (state, payload) => {
                    const index = state.vehicles.findIndex((vehicle) => vehicle.id === payload?.id);
                    if (index === -1) {
                        return false;
                    }
                    state.vehicles[index] = { ...state.vehicles[index], ...(payload?.updates || {}) };
                    return true;
                },
                removeVehicle: (state, payload) => {
                    state.vehicles = state.vehicles.filter((vehicle) => vehicle.id !== payload);
                    state.maintenances = state.maintenances.filter((maintenance) => maintenance.vehicleId !== payload);
                    return true;
                },
                addMaintenance: (state, payload) => {
                    if (!payload) {
                        return false;
                    }
                    state.maintenances.push(payload);
                    return true;
                },
                updateMaintenance: (state, payload) => {
                    const index = state.maintenances.findIndex((maintenance) => maintenance.id === payload?.id);
                    if (index === -1) {
                        return false;
                    }
                    state.maintenances[index] = { ...state.maintenances[index], ...(payload?.updates || {}) };
                    return true;
                },
                removeMaintenance: (state, payload) => {
                    state.maintenances = state.maintenances.filter((maintenance) => maintenance.id !== payload);
                    return true;
                },
                addNotification: (state, payload) => {
                    if (!payload) {
                        return false;
                    }
                    state.notifications.unshift(payload);
                    if (state.notifications.length > 50) {
                        state.notifications = state.notifications.slice(0, 50);
                    }
                    return true;
                },
                markNotificationAsRead: (state, payload) => {
                    const notification = state.notifications.find((item) => item.id === payload);
                    if (!notification || notification.read) {
                        return false;
                    }
                    notification.read = true;
                    return true;
                },
                markAllNotificationsAsRead: (state) => {
                    let changed = false;
                    state.notifications.forEach((notification) => {
                        if (!notification.read) {
                            notification.read = true;
                            changed = true;
                        }
                    });
                    return changed;
                },
                updateSettings: (state, payload) => {
                    state.settings = { ...state.settings, ...(payload || {}) };
                    return true;
                },
            };
        }

        commit(type, payload, options = {}) {
            const mutation = this.mutations[type];
            if (!mutation) {
                console.warn(`Mutação não encontrada: ${type}`);
                return false;
            }

            const hasChanged = mutation(this.state, payload);
            if (hasChanged === false) {
                return false;
            }

            if (!options.skipPersist) {
                this.persist();
            }

            if (!options.silent) {
                this.notify();
            }

            return true;
        }

        setState(newState) {
            return this.commit('setState', newState);
        }

        setUser(user) {
            return this.commit('setUser', user);
        }

        addVehicle(vehicle) {
            return this.commit('addVehicle', vehicle);
        }

        updateVehicle(id, updates) {
            return this.commit('updateVehicle', { id, updates });
        }

        removeVehicle(id) {
            return this.commit('removeVehicle', id);
        }

        addMaintenance(maintenance) {
            return this.commit('addMaintenance', maintenance);
        }

        updateMaintenance(id, updates) {
            return this.commit('updateMaintenance', { id, updates });
        }

        removeMaintenance(id) {
            return this.commit('removeMaintenance', id);
        }

        addNotification(notification) {
            return this.commit('addNotification', notification);
        }

        markNotificationAsRead(id) {
            return this.commit('markNotificationAsRead', id);
        }

        markAllNotificationsAsRead() {
            return this.commit('markAllNotificationsAsRead');
        }

        updateSettings(settings) {
            return this.commit('updateSettings', settings);
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
