const state = {
    currentUser: null,
    vehicles: [],
    maintenances: [],
    providers: [],
    notifications: [],
    alertSettings: {
        days: 30,
        km: 1000,
        email: true,
        sound: true,
        haptic: true,
    },
    currentSection: 'dashboard',
    maintenanceFilter: 'all',
    currentFilter: 'all',
};

const demoProviders = [
    { id: 1, name: 'Auto Center São Paulo', type: 'mechanic', rating: 4.8, reviews: 127, distance: '2.3 km', address: 'Av. Paulista, 1000', phone: '(11) 99999-1111', partner: true, services: ['Mecânica geral', 'Revisão'] },
    { id: 2, name: 'Mecânica do João', type: 'mechanic', rating: 4.5, reviews: 89, distance: '3.1 km', address: 'Rua Augusta, 500', phone: '(11) 98888-2222', partner: false, services: ['Motor', 'Suspensão'] },
    { id: 3, name: 'Elétrica Auto Power', type: 'electric', rating: 4.9, reviews: 203, distance: '1.8 km', address: 'Rua da Consolação, 800', phone: '(11) 97777-3333', partner: true, services: ['Elétrica', 'Bateria'] },
    { id: 4, name: 'Borracharia Rápida', type: 'tire', rating: 4.3, reviews: 56, distance: '4.5 km', address: 'Av. Rebouças, 1200', phone: '(11) 96666-4444', partner: false, services: ['Pneus', 'Alinhamento'] },
    { id: 5, name: 'Funilaria Premium', type: 'body', rating: 4.7, reviews: 78, distance: '5.2 km', address: 'Rua Oscar Freire, 300', phone: '(11) 95555-5555', partner: true, services: ['Funilaria', 'Pintura'] },
    { id: 6, name: 'Estética Shine', type: 'detailing', rating: 4.6, reviews: 45, distance: '3.8 km', address: 'Alameda Santos, 900', phone: '(11) 94444-6666', partner: false, services: ['Polimento', 'Higienização'] },
];

function getStore() {
    if (window.store && typeof window.store.getState === 'function') {
        return window.store;
    }
    return null;
}

function syncStateFromStore() {
    const store = getStore();
    if (!store) return;

    const storeState = store.getState();

    if (storeState.user) {
        state.currentUser = storeState.user;
    }

    if (Array.isArray(storeState.vehicles)) {
        state.vehicles = storeState.vehicles;
    }

    if (Array.isArray(storeState.maintenances)) {
        state.maintenances = storeState.maintenances;
    }

    if (Array.isArray(storeState.notifications)) {
        state.notifications = storeState.notifications;
    }

    if (storeState.settings) {
        state.alertSettings = {
            ...state.alertSettings,
            days: storeState.settings.alertDays,
            km: storeState.settings.alertKm,
            email: storeState.settings.emailNotifications,
            sound: storeState.settings.soundEnabled ?? state.alertSettings.sound,
            haptic: storeState.settings.hapticEnabled ?? state.alertSettings.haptic,
        };
    }
}

function syncStoreFromState() {
    const store = getStore();
    if (!store || typeof store.setState !== 'function') return;

    store.setState({
        user: state.currentUser,
        vehicles: state.vehicles,
        maintenances: state.maintenances,
        notifications: state.notifications,
        settings: {
            alertDays: Number(state.alertSettings.days),
            alertKm: Number(state.alertSettings.km),
            emailNotifications: Boolean(state.alertSettings.email),
            soundEnabled: Boolean(state.alertSettings.sound),
            hapticEnabled: Boolean(state.alertSettings.haptic),
        },
    });
}

let feedbackAudioContext = null;
let feedbackAudioUnlocked = false;
let pullTouchStartY = 0;
let pullRefreshing = false;
let pullArmed = false;
let focusModeEnabled = false;
let focusModeTimer = null;

const IMPORTANT_FORM_IDS = new Set([
    'form-add-vehicle',
    'form-edit-vehicle',
    'form-add-maintenance',
    'form-update-km',
]);

function getFeedbackPreferences() {
    return {
        sound: state.alertSettings.sound !== false,
        haptic: state.alertSettings.haptic !== false,
    };
}

function ensureAudioContext() {
    if (feedbackAudioContext) return feedbackAudioContext;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    try {
        feedbackAudioContext = new AudioCtx();
        return feedbackAudioContext;
    } catch (error) {
        return null;
    }
}

function unlockFeedbackAudio() {
    const audioContext = ensureAudioContext();
    if (!audioContext) return;

    if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
    }

    feedbackAudioUnlocked = true;
}

function playSuccessSound() {
    const preferences = getFeedbackPreferences();
    if (!preferences.sound) return;

    const audioContext = ensureAudioContext();
    if (!audioContext) return;
    if (!feedbackAudioUnlocked && audioContext.state === 'suspended') return;

    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        const startAt = audioContext.currentTime;

        oscillator.frequency.setValueAtTime(523.25, startAt);
        oscillator.frequency.exponentialRampToValueAtTime(1046.5, startAt + 0.1);

        gainNode.gain.setValueAtTime(0.1, startAt);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startAt + 0.3);

        oscillator.start(startAt);
        oscillator.stop(startAt + 0.3);
    } catch (error) {
    }
}

function successHaptic() {
    const preferences = getFeedbackPreferences();
    if (!preferences.haptic) return;

    if (typeof navigator.vibrate === 'function') {
        navigator.vibrate([50, 100, 50]);
    }
}

function pullRefreshHaptic() {
    const preferences = getFeedbackPreferences();
    if (!preferences.haptic) return;

    if (typeof navigator.vibrate === 'function') {
        navigator.vibrate(18);
    }
}

function triggerSuccessFeedback() {
    playSuccessSound();
    successHaptic();
}

function showRefreshSpinner() {
    const indicator = document.getElementById('pull-refresh-indicator');
    if (!indicator) return;

    indicator.classList.remove('hidden');
    requestAnimationFrame(() => {
        indicator.classList.add('show');
    });
}

function hideRefreshSpinner() {
    const indicator = document.getElementById('pull-refresh-indicator');
    if (!indicator) return;

    indicator.classList.remove('show');
    setTimeout(() => {
        indicator.classList.add('hidden');
    }, 200);
}

function canHandlePullRefreshGesture() {
    const mainApp = document.getElementById('main-app');
    if (!mainApp || mainApp.classList.contains('hidden')) return false;
    if (!window.matchMedia('(max-width: 1023px)').matches) return false;
    if (window.scrollY > 0) return false;

    const hasOpenModal = Boolean(document.querySelector('.modal-backdrop:not(.hidden), #vehicle-mobile-sheet.show, #generic-modal'));
    if (hasOpenModal) return false;

    return true;
}

function refreshAppData() {
    return Promise.resolve(loadData())
        .then(() => {
            checkMaintenanceStatus();
            refreshAll();
        });
}

function initPullToRefresh() {
    document.addEventListener('touchstart', (event) => {
        if (!canHandlePullRefreshGesture() || pullRefreshing) return;
        if (!event.touches || event.touches.length !== 1) return;

        pullTouchStartY = event.touches[0].clientY;
        pullArmed = false;
    }, { passive: true });

    document.addEventListener('touchmove', (event) => {
        if (!canHandlePullRefreshGesture() || pullRefreshing) return;
        if (!event.touches || event.touches.length !== 1) return;

        const pull = event.touches[0].clientY - pullTouchStartY;
        if (pull <= 100 || pullArmed) return;

        pullArmed = true;
        pullRefreshing = true;
        pullRefreshHaptic();
        showRefreshSpinner();

        refreshAppData()
            .catch(() => {
                showToast('Falha ao atualizar os dados.', 'error');
            })
            .finally(() => {
                pullRefreshing = false;
                hideRefreshSpinner();
            });
    }, { passive: true });

    document.addEventListener('touchend', () => {
        pullTouchStartY = 0;
        pullArmed = false;
    }, { passive: true });
}

function isInImportantForm(element) {
    if (!element || !(element instanceof Element)) return false;

    const form = element.closest('form');
    if (!form || !IMPORTANT_FORM_IDS.has(form.id)) return false;

    const parentModal = form.closest('.modal-backdrop, #generic-modal');
    if (parentModal?.classList?.contains('hidden')) return false;

    return true;
}

function setFocusMode(enabled, message = 'Modo foco ativo') {
    const indicator = document.getElementById('focus-indicator');
    const mobileOverlay = document.getElementById('focus-mobile-overlay');

    focusModeEnabled = Boolean(enabled);
    document.body.classList.toggle('focus-mode', focusModeEnabled);

    if (mobileOverlay) {
        mobileOverlay.classList.toggle('hidden', !focusModeEnabled);
    }

    if (!indicator) return;

    if (focusModeEnabled) {
        indicator.textContent = message;
        indicator.classList.remove('hidden');
    } else {
        indicator.classList.add('hidden');
    }
}

function scheduleFocusModeCheck() {
    clearTimeout(focusModeTimer);
    focusModeTimer = setTimeout(() => {
        const active = document.activeElement;
        if (!isInImportantForm(active)) {
            setFocusMode(false);
        }
    }, 60);
}

function initFocusMode() {
    document.addEventListener('focusin', (event) => {
        if (isInImportantForm(event.target)) {
            setFocusMode(true);
        }
    });

    document.addEventListener('focusout', () => {
        scheduleFocusModeCheck();
    });

    document.addEventListener('submit', (event) => {
        const formId = event.target?.id;
        if (!IMPORTANT_FORM_IDS.has(formId)) return;

        setTimeout(() => {
            setFocusMode(false);
        }, 120);
    });

    document.addEventListener('click', (event) => {
        if (event.target.closest('.btn-close-modal, [data-modal], #generic-modal-close')) {
            setTimeout(() => {
                setFocusMode(false);
            }, 0);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.Config?.init) {
        window.Config.init();
    }

    if (window.ImagesAPI?.init) {
        window.ImagesAPI.init();
    }

    updateDate();
    setInterval(updateDate, 60000);
    loadSession();
    loadData();

    App.init();
    Navigation.init();
    initPullToRefresh();
    initFocusMode();

    document.addEventListener('pointerdown', unlockFeedbackAudio, { once: true });
    document.addEventListener('keydown', unlockFeedbackAudio, { once: true });

    if (state.currentUser) {
        showMainApp();
    }
});

window.AppProvidersBridge = {
    getProviders() {
        return state.providers;
    },
    setProviders(providers) {
        if (Array.isArray(providers)) {
            state.providers = providers;
            saveData();
        }
    },
};

window.AppState = Object.assign(window.AppState || {}, {
    get currentUser() {
        return state.currentUser;
    },
    set currentUser(value) {
        state.currentUser = value || null;
    },
    get currentSection() {
        return state.currentSection;
    },
    set currentSection(value) {
        state.currentSection = value;
    },
    get vehicles() {
        return state.vehicles;
    },
    set vehicles(value) {
        state.vehicles = Array.isArray(value) ? value : [];
    },
    get maintenances() {
        return state.maintenances;
    },
    set maintenances(value) {
        state.maintenances = Array.isArray(value) ? value : [];
    },
    get notifications() {
        return state.notifications;
    },
    set notifications(value) {
        state.notifications = Array.isArray(value) ? value : [];
    },
    get alertSettings() {
        return state.alertSettings;
    },
    set alertSettings(value) {
        state.alertSettings = { ...state.alertSettings, ...(value || {}) };
    },
    get stats() {
        return calculateStats();
    },
    get urgentMaintenances() {
        return state.maintenances
            .filter((maintenance) => maintenance.status !== 'ok')
            .sort((a, b) => new Date(a.nextDate || '2999-12-31') - new Date(b.nextDate || '2999-12-31'));
    },
    saveToStorage() {
        saveData();
    },
    loadFromStorage() {
        loadSession();
        loadData();
        return true;
    },
});

window.UI = Object.assign(window.UI || {}, {
    showToast(message, type = 'info') {
        showToast(message, type);
    },
    showModal(title, content) {
        const existing = document.getElementById('generic-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'generic-modal';
        modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-bold">${title}</h3>
                    <button id="generic-modal-close" class="text-gray-500 hover:text-gray-700"><i class="fas fa-times"></i></button>
                </div>
                ${content}
            </div>
        `;

        modal.addEventListener('click', (event) => {
            if (event.target === modal) modal.remove();
        });

        document.body.appendChild(modal);
        document.getElementById('generic-modal-close')?.addEventListener('click', () => modal.remove());
    },
});

window.Dashboard = Object.assign(window.Dashboard || {}, {
    updateStats() {
        updateStats();
    },
});

window.Maintenance = Object.assign(window.Maintenance || {}, {
    init() {
        renderMaintenances();
    },
    checkStatus() {
        checkMaintenanceStatus();
    },
    openModal(vehicleId) {
        openAddMaintenanceModal();
        const vehicleSelect = document.getElementById('maint-vehicle');
        if (vehicleSelect && vehicleId) {
            vehicleSelect.value = String(vehicleId);
        }
    },
});

window.Notifications = Object.assign(window.Notifications || {}, {
    init() {
        renderNotifications();
    },
    add(type, title, message, relatedId = null) {
        addNotification(type, title, message, relatedId);
    },
    markAllAsRead() {
        markAllAsRead();
    },
    updateBadge() {
        updateNotificationBadge();
    },
});

window.Navigation = Object.assign(window.Navigation || {}, {
    showSection(sectionName) {
        showSection(sectionName);
    },
});

function updateDate() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const currentDate = document.getElementById('current-date');
    if (currentDate) currentDate.textContent = dateStr;
}

function showLogin() {
    hideAllAuthForms();
    document.getElementById('login-form').classList.remove('hidden');
}

function showRegister() {
    hideAllAuthForms();
    document.getElementById('register-form').classList.remove('hidden');
}

function showForgotPassword() {
    hideAllAuthForms();
    document.getElementById('forgot-form').classList.remove('hidden');
}

function hideAllAuthForms() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('forgot-form').classList.add('hidden');
}

function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showToast('Preencha e-mail e senha.', 'error');
        return;
    }

    if (email === 'demo@autocare.com' && password === '123456') {
        state.currentUser = {
            id: 1,
            name: 'Usuário Demo',
            email,
            createdAt: new Date().toISOString(),
        };
        initializeDemoData();
    } else {
        state.currentUser = {
            id: Date.now(),
            name: email.split('@')[0],
            email,
            createdAt: new Date().toISOString(),
        };
    }

    saveSession();
    showMainApp();
    showToast('Login realizado com sucesso!', 'success');
}

function handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-password-confirm').value;

    if (password !== confirm) {
        showToast('As senhas não coincidem.', 'error');
        return;
    }

    state.currentUser = {
        id: Date.now(),
        name,
        email,
        createdAt: new Date().toISOString(),
    };

    saveSession();
    showMainApp();
    showToast('Conta criada com sucesso!', 'success');
}

function handleForgotPassword(event) {
    event.preventDefault();
    showToast('Instruções enviadas para seu e-mail!', 'success');
    showLogin();
}

function logout() {
    state.currentUser = null;
    state.vehicles = [];
    state.maintenances = [];
    state.notifications = [];

    const store = getStore();
    if (store && typeof store.reset === 'function') {
        store.reset();
    }

    localStorage.removeItem('currentUser');
    localStorage.removeItem('vehicles');
    localStorage.removeItem('maintenances');
    localStorage.removeItem('notifications');

    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('main-app').classList.add('hidden');
    showLogin();
    showToast('Logout realizado com sucesso!', 'success');
}

function showMainApp() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');

    document.getElementById('user-name').textContent = state.currentUser.name;
    document.getElementById('user-email').textContent = state.currentUser.email;

    if (!state.providers.length) {
        state.providers = demoProviders;
    }

    if (window.Providers?.init) {
        window.Providers.init();
    }

    if (window.Vehicles?.init) {
        window.Vehicles.init();
    }

    if (window.Dashboard?.init) {
        window.Dashboard.init();
    }

    refreshAll();
    showSection('dashboard');
}

function showSection(sectionName) {
    ['dashboard', 'vehicles', 'maintenance', 'providers', 'notifications'].forEach((section) => {
        const sectionElement = document.getElementById(`section-${section}`);
        if (sectionElement) sectionElement.classList.add('hidden');
        const oldNav = document.getElementById(`nav-${section}`);
        if (oldNav) oldNav.classList.remove('active');
    });

    const currentSectionElement = document.getElementById(`section-${sectionName}`);
    if (currentSectionElement) currentSectionElement.classList.remove('hidden');

    const currentOldNav = document.getElementById(`nav-${sectionName}`);
    if (currentOldNav) currentOldNav.classList.add('active');

    document.querySelectorAll('.sidebar-btn[data-section], .mobile-nav-btn[data-section]').forEach((button) => {
        button.classList.toggle('active', button.getAttribute('data-section') === sectionName);
    });

    const titles = {
        dashboard: 'Dashboard',
        vehicles: 'Meus Veículos',
        maintenance: 'Manutenções',
        providers: 'Prestadores de Serviço',
        notifications: 'Notificações',
    };

    state.currentSection = sectionName;
    document.getElementById('page-title').textContent = titles[sectionName];

    if (window.innerWidth < 1024) {
        const mobileSidebar = document.getElementById('mobile-sidebar');
        const mobileSidebarContent = document.getElementById('mobile-sidebar-content');
        if (mobileSidebar) mobileSidebar.classList.add('hidden');
        if (mobileSidebarContent) mobileSidebarContent.classList.add('-translate-x-full');
    }

    if (sectionName === 'dashboard') {
        if (window.Dashboard?.init) {
            window.Dashboard.init();
        } else {
            updateDashboard();
        }
    }

    if (sectionName === 'vehicles') {
        if (window.Vehicles?.render) {
            window.Vehicles.render();
        } else {
            renderVehicles();
        }
    }

    if (sectionName === 'maintenance') renderMaintenances();
    if (sectionName === 'providers') renderProviders();
    if (sectionName === 'notifications') renderNotifications();
}

function toggleMobileMenu() {
    const mobileSidebar = document.getElementById('mobile-sidebar');
    const mobileSidebarContent = document.getElementById('mobile-sidebar-content');

    if (mobileSidebar && mobileSidebarContent) {
        const isHidden = mobileSidebar.classList.contains('hidden');
        if (isHidden) {
            mobileSidebar.classList.remove('hidden');
            requestAnimationFrame(() => {
                mobileSidebarContent.classList.remove('-translate-x-full');
            });
            return;
        }

        mobileSidebarContent.classList.add('-translate-x-full');
        setTimeout(() => {
            mobileSidebar.classList.add('hidden');
        }, 300);
        return;
    }
}

function updateDashboard() {
    updateStats();
    renderNextMaintenances();
    renderVehiclesOverview();
}

function updateStats() {
    const stats = calculateStats();

    document.getElementById('stat-ok').textContent = stats.ok;
    document.getElementById('stat-warning').textContent = stats.warning;
    document.getElementById('stat-overdue').textContent = stats.overdue;
    document.getElementById('stat-vehicles').textContent = state.vehicles.length;

    const totalAlerts = stats.warning + stats.overdue;
    const badges = ['top-notif-badge', 'notif-count', 'notif-maintenance', 'badge-maintenance', 'badge-notifications'];

    badges.forEach((badgeId) => {
        const badge = document.getElementById(badgeId);
        if (!badge) return;

        if (totalAlerts > 0) {
            badge.classList.remove('hidden');
            if (badgeId !== 'top-notif-badge') badge.textContent = String(totalAlerts);
        } else {
            badge.classList.add('hidden');
        }
    });
}

function calculateStats() {
    return state.maintenances.reduce((accumulator, maintenance) => {
        accumulator[maintenance.status] += 1;
        return accumulator;
    }, { ok: 0, warning: 0, overdue: 0 });
}

function renderNextMaintenances() {
    const container = document.getElementById('next-maintenances-list');
    const urgent = state.maintenances
        .filter((maintenance) => maintenance.status !== 'ok')
        .sort((a, b) => new Date(a.nextDate || '2999-12-31') - new Date(b.nextDate || '2999-12-31'))
        .slice(0, 3);

    if (!urgent.length) {
        container.innerHTML = '<div class="text-center py-8 text-gray-500">Todas as manutenções estão em dia!</div>';
        return;
    }

    const statusClass = {
        overdue: 'bg-red-100 text-red-700 border-red-200',
        warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        ok: 'bg-green-100 text-green-700 border-green-200',
    };

    const statusLabel = {
        overdue: 'Vencida',
        warning: 'Próxima',
        ok: 'Em dia',
    };

    container.innerHTML = urgent.map((maintenance) => {
        const vehicle = state.vehicles.find((item) => item.id === maintenance.vehicleId);
        return `
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer" onclick="showSection('maintenance')">
                <div>
                    <p class="font-medium text-gray-800">${maintenance.name}</p>
                    <p class="text-sm text-gray-500">${vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Veículo removido'}</p>
                    <p class="text-xs text-gray-400">Próxima: ${maintenance.nextDate ? formatDate(maintenance.nextDate) : 'Sem data definida'}</p>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-medium border ${statusClass[maintenance.status]}">${statusLabel[maintenance.status]}</span>
            </div>
        `;
    }).join('');
}

function renderVehiclesOverview() {
    const container = document.getElementById('vehicles-overview');

    if (!state.vehicles.length) {
        container.innerHTML = '<div class="col-span-full text-center py-8 text-gray-500">Nenhum veículo cadastrado.</div>';
        return;
    }

    container.innerHTML = state.vehicles.map((vehicle) => {
        const byVehicle = state.maintenances.filter((maintenance) => maintenance.vehicleId === vehicle.id);
        const overdue = byVehicle.filter((maintenance) => maintenance.status === 'overdue').length;
        const warning = byVehicle.filter((maintenance) => maintenance.status === 'warning').length;

        const statusColor = overdue > 0 ? 'red' : warning > 0 ? 'yellow' : 'green';
        const statusText = overdue > 0
            ? `${overdue} vencida(s)`
            : warning > 0
                ? `${warning} próxima(s)`
                : 'Tudo em dia';

        const colorClassMap = {
            red: 'text-red-600 bg-red-500',
            yellow: 'text-yellow-600 bg-yellow-500',
            green: 'text-green-600 bg-green-500',
        };

        const [textClass, dotClass] = colorClassMap[statusColor].split(' ');

        return `
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="font-medium text-gray-800">${vehicle.nickname || vehicle.model}</h4>
                        <p class="text-xs text-gray-500">${vehicle.brand} ${vehicle.model} ${vehicle.year}</p>
                    </div>
                    <span class="w-3 h-3 rounded-full ${dotClass}"></span>
                </div>
                <p class="text-sm text-gray-600 mt-2">Placa: ${vehicle.plate}</p>
                <p class="text-sm text-gray-600">KM: ${Number(vehicle.km).toLocaleString('pt-BR')} km</p>
                <div class="flex items-center justify-between mt-3">
                    <span class="text-xs font-medium ${textClass}">${statusText}</span>
                    <button onclick="openUpdateKmModal(${vehicle.id})" class="text-blue-600 text-xs font-medium">Atualizar KM</button>
                </div>
            </div>
        `;
    }).join('');
}

function renderVehicles() {
    const container = document.getElementById('vehicles-grid');
    const emptyState = document.getElementById('empty-vehicles');

    if (state.vehicles.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    const filter = document.getElementById('vehicle-filter').value;
    let filteredVehicles = state.vehicles;

    if (filter !== 'all') {
        filteredVehicles = state.vehicles.filter((vehicle) => {
            if (filter === 'active') return true;
            if (filter === 'maintenance') {
                const hasMaintenance = state.maintenances.some((maintenance) => maintenance.vehicleId === vehicle.id
                    && (maintenance.status === 'overdue' || maintenance.status === 'warning'));
                return hasMaintenance;
            }
            return true;
        });
    }

    container.innerHTML = filteredVehicles.map((vehicle) => {
        const vehicleMaintenances = state.maintenances.filter((maintenance) => maintenance.vehicleId === vehicle.id);
        const fuelLabels = {
            gasoline: 'Gasolina',
            ethanol: 'Etanol',
            flex: 'Flex',
            diesel: 'Diesel',
            gnv: 'GNV',
            electric: 'Elétrico',
            hybrid: 'Híbrido',
        };

        return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden card-hover">
                <div class="p-6">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                <i class="fas fa-car text-xl"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-lg text-gray-800">${vehicle.nickname || vehicle.model}</h3>
                                <p class="text-sm text-gray-500">${vehicle.brand} ${vehicle.model} ${vehicle.year}</p>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="openUpdateKmModal(${vehicle.id})" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Atualizar KM">
                                <i class="fas fa-tachometer-alt"></i>
                            </button>
                            <button onclick="deleteVehicle(${vehicle.id})" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <p class="text-xs text-gray-500 mb-1">Placa</p>
                            <p class="font-semibold text-gray-800">${vehicle.plate}</p>
                        </div>
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <p class="text-xs text-gray-500 mb-1">Quilometragem</p>
                            <p class="font-semibold text-gray-800">${Number(vehicle.km).toLocaleString('pt-BR')} km</p>
                        </div>
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <p class="text-xs text-gray-500 mb-1">Combustível</p>
                            <p class="font-semibold text-gray-800">${fuelLabels[vehicle.fuel] || vehicle.fuel}</p>
                        </div>
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <p class="text-xs text-gray-500 mb-1">Manutenções</p>
                            <p class="font-semibold text-gray-800">${vehicleMaintenances.length} registradas</p>
                        </div>
                    </div>

                    <div class="flex gap-2">
                        <button onclick="openAddMaintenanceModal(${vehicle.id})" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                            <i class="fas fa-plus mr-1"></i> Manutenção
                        </button>
                        <button onclick="viewVehicleDetails(${vehicle.id})" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors">
                            Detalhes
                        </button>
                    </div>
                </div>
                <div class="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-sm">
                    <span class="text-gray-500">Última atualização: ${formatDate(vehicle.updatedAt || vehicle.createdAt)}</span>
                    <span class="text-blue-600 font-medium cursor-pointer hover:underline" onclick="showVehicleHistory(${vehicle.id})">
                        Ver histórico
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

function filterVehicles() {
    renderVehicles();
}

function openAddVehicleModal() {
    document.getElementById('modal-vehicle').classList.remove('hidden');
    document.getElementById('modal-vehicle').classList.add('flex');
    document.getElementById('vehicle-nickname').value = '';
    document.getElementById('vehicle-brand').value = '';
    document.getElementById('vehicle-model').value = '';
    document.getElementById('vehicle-year').value = '';
    document.getElementById('vehicle-plate').value = '';
    document.getElementById('vehicle-km').value = '';
    document.getElementById('vehicle-fuel').value = '';
}

function handleAddVehicle(event) {
    event.preventDefault();

    const vehicle = {
        id: Date.now(),
        nickname: document.getElementById('vehicle-nickname').value,
        brand: document.getElementById('vehicle-brand').value,
        model: document.getElementById('vehicle-model').value,
        year: parseInt(document.getElementById('vehicle-year').value, 10),
        plate: document.getElementById('vehicle-plate').value.toUpperCase(),
        km: parseInt(document.getElementById('vehicle-km').value, 10),
        fuel: document.getElementById('vehicle-fuel').value,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const store = getStore();
    if (store && typeof store.addVehicle === 'function') {
        store.addVehicle(vehicle);
        syncStateFromStore();
    } else {
        state.vehicles.push(vehicle);
    }

    saveData();
    closeModal('modal-vehicle');
    updateUI();
    showToast('Veículo adicionado com sucesso!', 'success');

    addNotification('vehicle_added', `Veículo ${vehicle.model} adicionado`, `O veículo ${vehicle.brand} ${vehicle.model} foi cadastrado com sucesso.`);
}

function deleteVehicle(id) {
    if (!confirm('Tem certeza que deseja excluir este veículo? Todas as manutenções associadas também serão removidas.')) return;

    const store = getStore();
    if (store && typeof store.removeVehicle === 'function') {
        store.removeVehicle(id);
        syncStateFromStore();
    } else {
        state.vehicles = state.vehicles.filter((vehicle) => vehicle.id !== id);
        state.maintenances = state.maintenances.filter((maintenance) => maintenance.vehicleId !== id);
    }

    saveData();
    updateUI();
    showToast('Veículo removido com sucesso!', 'success');
}

function openUpdateKmModal(vehicleId) {
    const vehicle = state.vehicles.find((item) => item.id === vehicleId);
    if (!vehicle) return;

    document.getElementById('update-km-vehicle-id').value = vehicleId;
    document.getElementById('update-km-vehicle-name').textContent = `${vehicle.brand} ${vehicle.model} (${vehicle.plate})`;
    document.getElementById('current-km-display').value = Number(vehicle.km).toLocaleString('pt-BR');
    document.getElementById('new-km').value = '';
    document.getElementById('new-km').min = vehicle.km;

    document.getElementById('modal-update-km').classList.remove('hidden');
    document.getElementById('modal-update-km').classList.add('flex');
}

function handleUpdateKm(event) {
    event.preventDefault();
    const vehicleId = parseInt(document.getElementById('update-km-vehicle-id').value, 10);
    const newKm = parseInt(document.getElementById('new-km').value, 10);

    const vehicle = state.vehicles.find((item) => item.id === vehicleId);
    if (!vehicle) return;

    if (newKm < vehicle.km) {
        showToast('A nova quilometragem deve ser maior que a atual!', 'error');
        return;
    }

    if (!vehicle.kmHistory) vehicle.kmHistory = [];
    const kmHistory = [...vehicle.kmHistory, {
        km: vehicle.km,
        date: new Date().toISOString(),
    }];

    const updatedVehicle = {
        km: newKm,
        updatedAt: new Date().toISOString(),
        kmHistory,
    };

    const store = getStore();
    if (store && typeof store.updateVehicle === 'function') {
        store.updateVehicle(vehicleId, updatedVehicle);
        syncStateFromStore();
    } else {
        vehicle.km = updatedVehicle.km;
        vehicle.updatedAt = updatedVehicle.updatedAt;
        vehicle.kmHistory = updatedVehicle.kmHistory;
    }

    saveData();
    checkMaintenanceStatus();
    closeModal('modal-update-km');
    updateUI();
    showToast('Quilometragem atualizada com sucesso!', 'success');

    const overdueMaintenances = state.maintenances.filter((maintenance) => {
        if (maintenance.vehicleId !== vehicleId) return false;
        if (maintenance.nextKm && vehicle.km >= maintenance.nextKm) return true;
        return false;
    });

    if (overdueMaintenances.length > 0) {
        addNotification('km_alert', 'Manutenções vencidas detectadas', `${overdueMaintenances.length} manutenção(ões) do ${vehicle.model} atingiram o limite de KM.`);
    }
}

function viewVehicleDetails(vehicleId) {
    const vehicle = state.vehicles.find((item) => item.id === vehicleId);
    if (!vehicle) return;

    showToast(`Detalhes do ${vehicle.model} - Função em desenvolvimento`, 'info');
}

function showVehicleHistory(vehicleId) {
    const vehicle = state.vehicles.find((item) => item.id === vehicleId);
    if (!vehicle || !vehicle.kmHistory || vehicle.kmHistory.length === 0) {
        showToast('Nenhum histórico de quilometragem disponível', 'info');
        return;
    }

    let historyText = `Histórico de KM - ${vehicle.model}:\n\n`;
    vehicle.kmHistory.slice().reverse().forEach((history) => {
        historyText += `${formatDate(history.date)}: ${Number(history.km).toLocaleString('pt-BR')} km\n`;
    });

    alert(historyText);
}

function renderMaintenances() {
    const container = document.getElementById('maintenance-list');
    const emptyState = document.getElementById('empty-maintenance');

    if (state.maintenances.length === 0) {
        container.classList.remove('maintenance-timeline');
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        updateMaintenanceFilterBadges();
        return;
    }

    emptyState.classList.add('hidden');
    container.classList.add('maintenance-timeline');
    updateMaintenanceFilterBadges();

    let filtered = state.maintenances;
    if (state.currentFilter !== 'all') {
        filtered = state.maintenances.filter((maintenance) => maintenance.status === state.currentFilter);
    }

    filtered.sort((a, b) => {
        const priority = { overdue: 0, warning: 1, ok: 2 };
        if (priority[a.status] !== priority[b.status]) return priority[a.status] - priority[b.status];
        return new Date(a.nextDate || a.date) - new Date(b.nextDate || b.date);
    });

    container.innerHTML = filtered.map((maintenance) => {
        const vehicle = state.vehicles.find((item) => item.id === maintenance.vehicleId);
        const urgencyClass = maintenance.status === 'overdue'
            ? 'critical'
            : maintenance.status === 'warning'
                ? 'warning'
                : 'ok';
        const statusConfig = {
            ok: {
                bg: 'bg-green-50',
                border: 'border-green-200',
                text: 'text-green-700',
                label: 'Em dia',
                icon: 'check-circle',
            },
            warning: {
                bg: 'bg-yellow-50',
                border: 'border-yellow-200',
                text: 'text-yellow-700',
                label: 'Próxima',
                icon: 'exclamation-triangle',
            },
            overdue: {
                bg: 'bg-red-50',
                border: 'border-red-200',
                text: 'text-red-700',
                label: 'Vencida',
                icon: 'times-circle',
            },
        };
        const cfg = statusConfig[maintenance.status];

        const typeLabels = {
            oil: 'Troca de Óleo',
            tire: 'Pneus/Rodízio',
            brake: 'Freios',
            belt: 'Correia',
            filter: 'Filtros',
            battery: 'Bateria',
            review: 'Revisão',
            other: 'Outro',
        };

        return `
            <div class="maintenance-card ${urgencyClass} shadow-sm border border-gray-200 hover:shadow-md transition-all mb-4">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <span class="px-3 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text} border ${cfg.border}">
                                <i class="fas fa-${cfg.icon} mr-1"></i> ${cfg.label}
                            </span>
                            <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">${typeLabels[maintenance.type] || maintenance.type}</span>
                        </div>
                        <h4 class="font-bold text-lg text-gray-800 mb-1">${maintenance.name}</h4>
                        <p class="text-sm text-gray-600 mb-2">${maintenance.description || 'Sem descrição'}</p>
                        <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span class="flex items-center gap-1"><i class="fas fa-car text-blue-500"></i> ${vehicle ? vehicle.model : 'Veículo removido'}</span>
                            <span class="flex items-center gap-1"><i class="fas fa-calendar text-blue-500"></i> Última: ${formatDate(maintenance.date)}</span>
                            <span class="flex items-center gap-1"><i class="fas fa-road text-blue-500"></i> KM: ${Number(maintenance.km).toLocaleString('pt-BR')}</span>
                        </div>
                    </div>
                    <div class="flex flex-col items-end gap-2">
                        <div class="text-right">
                            <p class="text-xs text-gray-500 mb-1">Próxima manutenção:</p>
                            <p class="font-semibold ${maintenance.status === 'overdue' ? 'text-red-600' : 'text-gray-800'}">
                                ${maintenance.nextDate ? formatDate(maintenance.nextDate) : 'Não definida'}
                            </p>
                            ${maintenance.nextKm ? `<p class="text-xs text-gray-500">ou ${Number(maintenance.nextKm).toLocaleString('pt-BR')} km</p>` : ''}
                        </div>
                        <div class="flex gap-2">
                            <button onclick="markMaintenanceDone(${maintenance.id})" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors" title="Marcar como realizada">
                                <i class="fas fa-check mr-1"></i> Feito
                            </button>
                            <button onclick="editMaintenance(${maintenance.id})" class="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteMaintenance(${maintenance.id})" class="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm transition-colors">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateMaintenanceFilterBadges() {
    const overdueCount = state.maintenances.filter((maintenance) => maintenance.status === 'overdue').length;
    const overdueBadge = document.getElementById('filter-overdue-count');

    if (!overdueBadge) return;

    if (overdueCount > 0) {
        overdueBadge.textContent = String(overdueCount);
        overdueBadge.classList.remove('hidden');
    } else {
        overdueBadge.classList.add('hidden');
    }
}

function filterMaintenance(type) {
    state.currentFilter = type;
    state.maintenanceFilter = type;

    ['all', 'ok', 'warning', 'overdue'].forEach((item) => {
        const button = document.getElementById(`filter-${item}`);
        if (!button) return;
        if (item === type) {
            button.className = 'px-4 py-2 rounded-md text-sm font-medium bg-blue-100 text-blue-700 transition-colors';
        } else {
            button.className = 'px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors';
        }
    });

    renderMaintenances();
}

function openAddMaintenanceModal(preselectedVehicleId = null) {
    const select = document.getElementById('maint-vehicle');
    select.innerHTML = '<option value="">Selecione o veículo...</option>'
        + state.vehicles.map((vehicle) => `<option value="${vehicle.id}">${vehicle.brand} ${vehicle.model} (${vehicle.plate})</option>`).join('');

    if (preselectedVehicleId) {
        select.value = String(preselectedVehicleId);
    }

    document.getElementById('maint-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('maint-type').value = '';
    document.getElementById('maint-name').value = '';
    document.getElementById('maint-desc').value = '';
    document.getElementById('maint-km').value = '';
    document.getElementById('maint-next-days').value = '';
    document.getElementById('maint-next-km').value = '';

    document.getElementById('modal-maintenance').classList.remove('hidden');
    document.getElementById('modal-maintenance').classList.add('flex');
}

function updateMaintenanceFields() {
    const type = document.getElementById('maint-type').value;
    const nameField = document.getElementById('maint-name');

    const defaults = {
        oil: { name: 'Troca de Óleo', days: 180, km: 10000 },
        tire: { name: 'Rodízio de Pneus', days: 90, km: 5000 },
        brake: { name: 'Pastilhas de Freio', days: 365, km: 20000 },
        belt: { name: 'Correia Dentada', days: 730, km: 60000 },
        filter: { name: 'Troca de Filtros', days: 180, km: 10000 },
        battery: { name: 'Bateria', days: 1095, km: 0 },
        review: { name: 'Revisão Geral', days: 365, km: 10000 },
        other: { name: '', days: '', km: '' },
    };

    if (defaults[type]) {
        if (!nameField.value) nameField.value = defaults[type].name;
        if (!document.getElementById('maint-next-days').value) document.getElementById('maint-next-days').value = defaults[type].days;
        if (!document.getElementById('maint-next-km').value) document.getElementById('maint-next-km').value = defaults[type].km;
    }
}

function handleAddMaintenance(event) {
    event.preventDefault();

    const vehicleId = parseInt(document.getElementById('maint-vehicle').value, 10);
    const vehicle = state.vehicles.find((item) => item.id === vehicleId);

    const maintenance = {
        id: Date.now(),
        vehicleId,
        type: document.getElementById('maint-type').value,
        name: document.getElementById('maint-name').value,
        description: document.getElementById('maint-desc').value,
        date: document.getElementById('maint-date').value,
        km: parseInt(document.getElementById('maint-km').value, 10) || vehicle?.km || 0,
        nextDays: parseInt(document.getElementById('maint-next-days').value, 10) || null,
        nextKm: parseInt(document.getElementById('maint-next-km').value, 10) || null,
        status: 'ok',
        createdAt: new Date().toISOString(),
    };

    if (maintenance.nextDays) {
        const nextDate = new Date(maintenance.date);
        nextDate.setDate(nextDate.getDate() + maintenance.nextDays);
        maintenance.nextDate = nextDate.toISOString().split('T')[0];
    }

    const store = getStore();
    if (store && typeof store.addMaintenance === 'function') {
        store.addMaintenance(maintenance);
        syncStateFromStore();
    } else {
        state.maintenances.push(maintenance);
    }

    checkMaintenanceStatus();
    saveData();
    closeModal('modal-maintenance');
    updateUI();
    triggerSuccessFeedback();
    showToast('Manutenção registrada com sucesso!', 'success');

    addNotification('maintenance_added', `Manutenção registrada: ${maintenance.name}`, `Registrado para ${vehicle?.model || 'veículo'} com próxima revisão em ${formatDate(maintenance.nextDate)}.`);
}

function markMaintenanceDone(id) {
    const maintenance = state.maintenances.find((item) => item.id === id);
    if (!maintenance) return;

    const today = new Date();
    const newMaintenance = {
        ...maintenance,
        id: Date.now(),
        date: today.toISOString().split('T')[0],
        km: state.vehicles.find((vehicle) => vehicle.id === maintenance.vehicleId)?.km || maintenance.km,
        status: 'ok',
        createdAt: new Date().toISOString(),
    };

    if (newMaintenance.nextDays) {
        const nextDate = new Date(today);
        nextDate.setDate(nextDate.getDate() + newMaintenance.nextDays);
        newMaintenance.nextDate = nextDate.toISOString().split('T')[0];
    }

    const store = getStore();
    if (store && typeof store.updateMaintenance === 'function') {
        store.updateMaintenance(id, newMaintenance);
        syncStateFromStore();
    } else {
        const index = state.maintenances.findIndex((item) => item.id === id);
        state.maintenances[index] = newMaintenance;
    }

    checkMaintenanceStatus();
    saveData();
    updateUI();
    showToast('Manutenção marcada como realizada e renovada!', 'success');
}

function editMaintenance() {
    showToast('Função de edição em desenvolvimento. Remova e recadastre se necessário.', 'info');
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function confirmDeleteMaintenance(id) {
    const maintenance = state.maintenances.find((item) => item.id === id);
    if (!maintenance) return;

    const vehicle = state.vehicles.find((item) => item.id === maintenance.vehicleId);
    const safeName = escapeHtml(maintenance.name || 'Serviço sem nome');
    const safeVehicle = escapeHtml(vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Veículo removido');
    const safeDate = escapeHtml(formatDate(maintenance.date));
    const safeKm = escapeHtml(Number(maintenance.km || 0).toLocaleString('pt-BR'));

    if (!window.UI?.showModal) {
        if (confirm('Tem certeza que deseja excluir esta manutenção?')) {
            deleteMaintenanceConfirmed(id);
        }
        return;
    }

    UI.showModal('Tem certeza?', `
        <div class="delete-preview">
            <div class="delete-item">
                <span>🔧</span>
                <div>
                    <strong>${safeName}</strong>
                    <small>${safeVehicle} • ${safeDate} • ${safeKm} km</small>
                </div>
            </div>
            <div class="delete-impact">
                <span class="impact-badge">⚠️ Esse registro de manutenção será perdido permanentemente</span>
            </div>
        </div>
        <div class="delete-actions">
            <button type="button" id="delete-maint-cancel-btn" class="btn-cancel-vehicle flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold">
                Cancelar
            </button>
            <button type="button" id="delete-maint-confirm-btn" class="btn-danger">
                Sim, deletar registro
            </button>
        </div>
    `);

    const closeGenericModal = () => {
        document.getElementById('generic-modal')?.remove();
    };

    document.getElementById('delete-maint-cancel-btn')?.addEventListener('click', () => {
        closeGenericModal();
    }, { once: true });

    document.getElementById('delete-maint-confirm-btn')?.addEventListener('click', () => {
        closeGenericModal();
        deleteMaintenanceConfirmed(id);
    }, { once: true });
}

function deleteMaintenanceConfirmed(id) {
    const exists = state.maintenances.some((item) => item.id === id);
    if (!exists) return;

    const store = getStore();
    if (store && typeof store.removeMaintenance === 'function') {
        store.removeMaintenance(id);
        syncStateFromStore();
    } else {
        state.maintenances = state.maintenances.filter((maintenance) => maintenance.id !== id);
    }

    saveData();
    updateUI();
    showToast('Manutenção removida com sucesso!', 'success');
}

function deleteMaintenance(id) {
    confirmDeleteMaintenance(id);
}

function checkMaintenanceStatus() {
    const today = new Date();
    const alertDays = parseInt(state.alertSettings.days, 10);
    const alertKm = parseInt(state.alertSettings.km, 10);

    let hasChanges = false;

    state.maintenances.forEach((maintenance) => {
        const vehicle = state.vehicles.find((item) => item.id === maintenance.vehicleId);
        let newStatus = 'ok';

        if (maintenance.nextDate) {
            const nextDate = new Date(maintenance.nextDate);
            const diffDays = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
                newStatus = 'overdue';
            } else if (diffDays <= alertDays) {
                newStatus = 'warning';
            }
        }

        if (vehicle && maintenance.nextKm && newStatus === 'ok') {
            const kmDiff = maintenance.nextKm - vehicle.km;

            if (kmDiff < 0) {
                newStatus = 'overdue';
            } else if (kmDiff <= alertKm) {
                newStatus = 'warning';
            }
        }

        if (maintenance.status !== newStatus) {
            maintenance.status = newStatus;
            hasChanges = true;

            if (newStatus === 'warning' || newStatus === 'overdue') {
                addNotification(
                    'maintenance_alert',
                    `Manutenção ${newStatus === 'overdue' ? 'vencida' : 'próxima'}: ${maintenance.name}`,
                    `O serviço ${maintenance.name} do ${vehicle?.model || 'veículo'} ${newStatus === 'overdue' ? 'venceu' : 'está próximo do vencimento'}.`,
                    maintenance.id,
                );
            }
        }
    });

    if (hasChanges) {
        const store = getStore();
        if (store && typeof store.setState === 'function') {
            store.setState({ maintenances: state.maintenances });
            syncStateFromStore();
        }
        saveData();
    }
}

function renderProviders() {
    if (window.Providers?.render) {
        window.Providers.render();
        return;
    }

    const container = document.getElementById('providers-grid');
    const search = document.getElementById('provider-search').value.toLowerCase();
    const type = document.getElementById('provider-type').value;

    let filtered = state.providers;

    if (search) {
        filtered = filtered.filter((provider) => provider.name.toLowerCase().includes(search)
            || provider.services.some((service) => service.toLowerCase().includes(search)));
    }

    if (type !== 'all') {
        filtered = filtered.filter((provider) => provider.type === type);
    }

    container.innerHTML = filtered.map((provider) => {
        const typeLabels = {
            mechanic: 'Mecânica',
            electric: 'Elétrica',
            tire: 'Borracharia',
            body: 'Funilaria',
            detailing: 'Estética',
        };

        const typeColors = {
            mechanic: 'bg-blue-100 text-blue-700',
            electric: 'bg-yellow-100 text-yellow-700',
            tire: 'bg-gray-100 text-gray-700',
            body: 'bg-red-100 text-red-700',
            detailing: 'bg-purple-100 text-purple-700',
        };

        return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden card-hover">
                <div class="p-6">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 ${typeColors[provider.type]} rounded-lg flex items-center justify-center">
                                <i class="fas fa-${getProviderIcon(provider.type)} text-xl"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-gray-800">${provider.name}</h3>
                                <div class="flex items-center gap-2 mt-1">
                                    <span class="text-xs ${typeColors[provider.type]} px-2 py-0.5 rounded font-medium">${typeLabels[provider.type]}</span>
                                    ${provider.partner ? '<span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium"><i class="fas fa-check-circle mr-1"></i>Parceiro</span>' : ''}
                                </div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="flex items-center gap-1 text-yellow-500">
                                <i class="fas fa-star"></i>
                                <span class="font-bold text-gray-800">${provider.rating}</span>
                            </div>
                            <p class="text-xs text-gray-500">${provider.reviews} avaliações</p>
                        </div>
                    </div>

                    <div class="space-y-2 mb-4">
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <i class="fas fa-map-marker-alt text-red-500 w-4"></i>
                            <span>${provider.distance} - ${provider.address}</span>
                        </div>
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <i class="fas fa-phone text-green-500 w-4"></i>
                            <span>${provider.phone}</span>
                        </div>
                    </div>

                    <div class="mb-4">
                        <p class="text-xs text-gray-500 mb-2">Serviços:</p>
                        <div class="flex flex-wrap gap-2">
                            ${provider.services.map((service) => `<span class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">${service}</span>`).join('')}
                        </div>
                    </div>

                    <div class="flex gap-2">
                        <a href="https://wa.me/${provider.phone.replace(/\D/g, '')}" target="_blank" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-center text-sm font-medium transition-colors">
                            <i class="fab fa-whatsapp mr-1"></i> WhatsApp
                        </a>
                        <a href="tel:${provider.phone.replace(/\D/g, '')}" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-center text-sm font-medium transition-colors">
                            <i class="fas fa-phone mr-1"></i> Ligar
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getProviderIcon(type) {
    const icons = {
        mechanic: 'wrench',
        electric: 'bolt',
        tire: 'circle',
        body: 'car-crash',
        detailing: 'sparkles',
    };
    return icons[type] || 'store';
}

async function ensureGoogleMapsAPIReady() {
    if (!window.Config?.USE_REAL_API || !window.GoogleMapsAPI?.init) {
        return false;
    }

    if (window.GoogleMapsAPI.geocoder) {
        return true;
    }

    return window.GoogleMapsAPI.init();
}

async function searchProviders() {
    if (window.Providers?.handleSearch) {
        const query = document.getElementById('provider-search').value.trim();
        await window.Providers.handleSearch(query);
        return;
    }

    const query = document.getElementById('provider-search').value.trim();

    if (query.length >= 3) {
        const isReady = await ensureGoogleMapsAPIReady();

        if (isReady) {
            try {
                const providers = await window.GoogleMapsAPI.searchByText(query);
                state.providers = providers.length ? providers : [];
                saveData();

                if (!providers.length) {
                    showToast('Nenhum prestador encontrado para esta busca.', 'info');
                }
            } catch (error) {
                showToast('Erro ao buscar prestadores. Exibindo resultados locais.', 'warning');
            }
        }
    }

    renderProviders();
}

function filterProviders() {
    if (window.Providers) {
        window.Providers.currentType = document.getElementById('provider-type').value;
        window.Providers.render();
        return;
    }

    renderProviders();
}

async function getLocation() {
    if (window.Providers?.updateLocation) {
        await window.Providers.updateLocation();
        return;
    }

    try {
        const isReady = await ensureGoogleMapsAPIReady();

        if (isReady) {
            const location = await window.GoogleMapsAPI.getCurrentLocation();
            const providers = await window.GoogleMapsAPI.searchNearbyMechanics(location);

            state.providers = providers.length ? providers : [];
            saveData();
            renderProviders();

            if (providers.length) {
                showToast('Localização atualizada! Mostrando mecânicas reais próximas.', 'success');
            } else {
                showToast('Nenhum prestador encontrado na sua região.', 'info');
            }
            return;
        }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                () => {
                    showToast('Localização atualizada! Mostrando prestadores próximos.', 'success');
                    renderProviders();
                },
                () => {
                    showToast('Não foi possível obter sua localização. Usando ordenação padrão.', 'error');
                },
            );
            return;
        }

        showToast('Geolocalização não suportada pelo navegador.', 'error');
    } catch (error) {
        showToast('Erro ao atualizar localização. Usando dados simulados.', 'warning');
    }
}

function addNotification(type, title, message, relatedId = null) {
    const notification = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        type,
        title,
        message,
        relatedId,
        read: false,
        createdAt: new Date().toISOString(),
    };

    const store = getStore();
    if (store && typeof store.addNotification === 'function') {
        store.addNotification(notification);
        syncStateFromStore();
    } else {
        state.notifications.unshift(notification);

        if (state.notifications.length > 50) {
            state.notifications = state.notifications.slice(0, 50);
        }
    }

    updateNotificationBadge();
}

function renderNotifications() {
    const container = document.getElementById('notifications-list');
    const emptyState = document.getElementById('empty-notifications');

    if (state.notifications.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    container.innerHTML = state.notifications.map((notification) => {
        const typeIcons = {
            maintenance_alert: 'exclamation-circle text-red-500',
            maintenance_added: 'check-circle text-green-500',
            vehicle_added: 'car text-blue-500',
            km_alert: 'tachometer-alt text-yellow-500',
            system: 'info-circle text-gray-500',
        };

        return `
            <div class="p-4 hover:bg-gray-50 transition-colors ${notification.read ? 'opacity-60' : 'bg-blue-50/30'} cursor-pointer" onclick="markAsRead(${notification.id})">
                <div class="flex items-start gap-3">
                    <div class="mt-1">
                        <i class="fas fa-${typeIcons[notification.type] || 'bell'} text-lg"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center justify-between mb-1">
                            <h4 class="font-semibold text-gray-800 ${notification.read ? 'font-normal' : ''}">${notification.title}</h4>
                            <span class="text-xs text-gray-500">${timeAgo(notification.createdAt)}</span>
                        </div>
                        <p class="text-sm text-gray-600 mb-2">${notification.message}</p>
                        <div class="flex items-center gap-2">
                            ${!notification.read ? '<span class="w-2 h-2 bg-blue-600 rounded-full"></span>' : ''}
                            <span class="text-xs text-gray-400">${notification.read ? 'Lida' : 'Nova'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function markAsRead(id) {
    const store = getStore();
    if (store && typeof store.markNotificationAsRead === 'function') {
        store.markNotificationAsRead(id);
        syncStateFromStore();
        updateNotificationBadge();
        renderNotifications();
        return;
    }

    const notification = state.notifications.find((item) => item.id === id);
    if (notification) {
        notification.read = true;
        updateNotificationBadge();
        renderNotifications();
    }
}

function markAllAsRead() {
    const store = getStore();
    if (store && typeof store.markAllNotificationsAsRead === 'function') {
        store.markAllNotificationsAsRead();
        syncStateFromStore();
    } else {
        state.notifications.forEach((notification) => {
            notification.read = true;
        });
    }

    updateNotificationBadge();
    renderNotifications();
    showToast('Todas as notificações marcadas como lidas!', 'success');
}

function updateNotificationBadge() {
    const unread = state.notifications.filter((notification) => !notification.read).length;
    const badge = document.getElementById('notif-count') || document.getElementById('badge-notifications');
    const topBadge = document.getElementById('top-notif-badge') || document.getElementById('header-badge');

    if (unread > 0) {
        if (badge) {
            badge.textContent = unread;
            badge.classList.remove('hidden');
        }
        if (topBadge) topBadge.classList.remove('hidden');
    } else {
        if (badge) badge.classList.add('hidden');
        if (topBadge) topBadge.classList.add('hidden');
    }
}

function saveAlertSettings() {
    state.alertSettings = {
        ...state.alertSettings,
        days: document.getElementById('alert-days').value,
        km: document.getElementById('alert-km').value,
        email: document.getElementById('email-notifications').checked,
        sound: document.getElementById('sound-feedback')?.checked ?? state.alertSettings.sound,
        haptic: document.getElementById('haptic-feedback')?.checked ?? state.alertSettings.haptic,
    };

    const store = getStore();
    if (store && typeof store.updateSettings === 'function') {
        store.updateSettings({
            alertDays: Number(state.alertSettings.days),
            alertKm: Number(state.alertSettings.km),
            emailNotifications: Boolean(state.alertSettings.email),
            soundEnabled: Boolean(state.alertSettings.sound),
            hapticEnabled: Boolean(state.alertSettings.haptic),
        });
        syncStateFromStore();
    }

    checkMaintenanceStatus();
    showToast('Configurações de alerta salvas!', 'success');
}

function updateModels() {
    // Mantido para compatibilidade com o HTML original.
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
    document.getElementById(modalId).classList.remove('flex');
}

function refreshAll() {
    checkMaintenanceStatus();
    updateDashboard();
    renderVehicles();
    renderMaintenances();
    renderProviders();
    renderNotifications();
    updateNotificationBadge();
}

function updateUI() {
    updateDashboard();
    if (state.currentSection === 'vehicles') renderVehicles();
    if (state.currentSection === 'maintenance') renderMaintenances();
    if (state.currentSection === 'providers') renderProviders();
    if (state.currentSection === 'notifications') renderNotifications();
    updateNotificationBadge();
}

function initializeDemoData() {
    const hasExisting = state.vehicles.length > 0 || state.maintenances.length > 0;
    if (hasExisting) return;

    const vehicle = {
        id: 1001,
        nickname: 'Meu Carro',
        brand: 'Volkswagen',
        model: 'Gol',
        year: 2020,
        plate: 'ABC-1234',
        km: 45000,
        fuel: 'flex',
        createdAt: new Date().toISOString(),
    };

    const thirtyDaysAgo = addDays(new Date().toISOString().split('T')[0], -30);
    const sixtyDaysAgo = addDays(new Date().toISOString().split('T')[0], -60);

    const maintenanceList = [
        {
            id: 2001,
            vehicleId: 1001,
            type: 'oil',
            name: 'Troca de Óleo',
            description: 'Óleo sintético 5W30',
            date: thirtyDaysAgo,
            km: 40000,
            nextDays: 180,
            nextKmStep: 10000,
            nextKm: 50000,
            nextDate: addDays(thirtyDaysAgo, 180),
            status: 'ok',
            createdAt: new Date().toISOString(),
        },
        {
            id: 2002,
            vehicleId: 1001,
            type: 'brake',
            name: 'Pastilhas de Freio',
            description: 'Troca das pastilhas dianteiras',
            date: sixtyDaysAgo,
            km: 35000,
            nextDays: 365,
            nextKmStep: 20000,
            nextKm: 55000,
            nextDate: addDays(sixtyDaysAgo, 365),
            status: 'warning',
            createdAt: new Date().toISOString(),
        },
    ];

    state.vehicles = [vehicle];
    state.maintenances = maintenanceList;
    state.providers = demoProviders;

    syncStoreFromState();

    checkMaintenanceStatus();
    saveData();
}

function saveSession() {
    const store = getStore();
    if (store && typeof store.setUser === 'function') {
        store.setUser(state.currentUser);
        syncStateFromStore();
    }
}

function loadSession() {
    const store = getStore();
    if (store && typeof store.getUser === 'function') {
        const storeUser = store.getUser();
        if (storeUser) {
            state.currentUser = storeUser;
        }
    }
}

function saveData() {
    syncStoreFromState();

    localStorage.setItem('providers', JSON.stringify(state.providers));
}

function loadData() {
    try {
        syncStateFromStore();
        const providers = localStorage.getItem('providers');
        state.providers = providers ? JSON.parse(providers) : demoProviders;

        const alertDays = document.getElementById('alert-days');
        const alertKm = document.getElementById('alert-km');
        const emailNotifications = document.getElementById('email-notifications');
        const soundFeedback = document.getElementById('sound-feedback');
        const hapticFeedback = document.getElementById('haptic-feedback');

        if (alertDays) alertDays.value = String(state.alertSettings.days);
        if (alertKm) alertKm.value = String(state.alertSettings.km);
        if (emailNotifications) emailNotifications.checked = Boolean(state.alertSettings.email);
        if (soundFeedback) soundFeedback.checked = Boolean(state.alertSettings.sound);
        if (hapticFeedback) hapticFeedback.checked = Boolean(state.alertSettings.haptic);
    } catch (error) {
        syncStateFromStore();
        state.providers = demoProviders;
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const messageElement = document.getElementById('toast-message');
    const icon = document.getElementById('toast-icon');

    messageElement.textContent = message;

    const iconClass = {
        success: 'fas fa-check-circle text-green-400',
        error: 'fas fa-exclamation-circle text-red-400',
        info: 'fas fa-info-circle text-blue-400',
        warning: 'fas fa-exclamation-triangle text-yellow-400',
    };

    icon.className = iconClass[type] || iconClass.success;

    toast.classList.add('show');
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 2500);
}

function addDays(dateInput, days) {
    const date = new Date(dateInput);
    date.setDate(date.getDate() + Number(days));
    return date.toISOString().split('T')[0];
}

function addDaysObj(dateInput, days) {
    const date = new Date(dateInput);
    date.setDate(date.getDate() + Number(days));
    return date;
}

function formatDate(dateInput) {
    if (!dateInput) return 'Não definida';
    return new Date(dateInput).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function formatDateTime(dateInput) {
    return new Date(dateInput).toLocaleString('pt-BR');
}

function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} anos atrás`;

    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} meses atrás`;

    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} dias atrás`;

    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} horas atrás`;

    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} minutos atrás`;

    return 'Agora mesmo';
}

window.onclick = function onWindowClick(event) {
    if (event.target.classList.contains('fixed')) {
        event.target.classList.add('hidden');
        event.target.classList.remove('flex');
    }
};

function fuelLabel(value) {
    const map = {
        gasoline: 'Gasolina',
        ethanol: 'Etanol',
        flex: 'Flex',
        diesel: 'Diesel',
        gnv: 'GNV',
        electric: 'Elétrico',
        hybrid: 'Híbrido',
    };

    return map[value] || '-';
}

Object.assign(window, {
    showLogin,
    showRegister,
    showForgotPassword,
    handleLogin,
    handleRegister,
    handleForgotPassword,
    logout,
    showSection,
    toggleMobileMenu,
    openAddVehicleModal,
    openAddMaintenanceModal,
    deleteVehicle,
    viewVehicleDetails,
    showVehicleHistory,
    filterVehicles,
    filterMaintenance,
    markMaintenanceDone,
    editMaintenance,
    deleteMaintenance,
    searchProviders,
    filterProviders,
    getLocation,
    markAsRead,
    markAllAsRead,
    saveAlertSettings,
    closeModal,
    handleAddVehicle,
    updateModels,
    handleAddMaintenance,
    updateMaintenanceFields,
    openUpdateKmModal,
    handleUpdateKm,
    updateUI,
});

/**
 * Main Application Module
 */

const App = {
    isInitialized: false,
    _uiBound: false,

    init() {
        if (this.isInitialized) {
            console.log('App já inicializado, ignorando...');
            return;
        }
        this.isInitialized = true;

        console.log('🚗 AutoCare Pro - Iniciando...');
        this.initUI();
        Auth.init();
        console.log('✅ Aplicação inicializada');
    },

    initUI() {
        if (this._uiBound) return;
        this._uiBound = true;

        document.getElementById('form-add-maintenance')?.addEventListener('submit', handleAddMaintenance);
        document.getElementById('form-update-km')?.addEventListener('submit', handleUpdateKm);

        document.getElementById('btn-quick-add-maintenance')?.addEventListener('click', () => openAddMaintenanceModal());
        document.getElementById('btn-add-maintenance')?.addEventListener('click', () => openAddMaintenanceModal());
        document.getElementById('btn-empty-add-maintenance')?.addEventListener('click', () => openAddMaintenanceModal());
        document.getElementById('btn-quick-providers')?.addEventListener('click', () => Navigation.showSection('providers'));

        document.querySelectorAll('.filter-btn[data-filter]').forEach((button) => {
            button.addEventListener('click', () => {
                const filterType = button.getAttribute('data-filter');
                if (filterType) {
                    filterMaintenance(filterType);
                }
            });
        });

        document.querySelectorAll('.btn-close-modal').forEach((btn) => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            newBtn.addEventListener('click', (event) => {
                const modalId = event.currentTarget.dataset.modal;
                if (modalId) {
                    const modal = document.getElementById(modalId);
                    if (modal) {
                        modal.classList.add('hidden');
                        modal.classList.remove('flex');
                    }
                }
            });
        });

        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal-backdrop')) {
                event.target.classList.add('hidden');
                event.target.classList.remove('flex');
            }
        });

        const mobileMenuButton = document.getElementById('btn-mobile-menu');
        const mobileSidebar = document.getElementById('mobile-sidebar');
        const mobileOverlay = document.getElementById('mobile-overlay');
        const mobileContent = document.getElementById('mobile-sidebar-content');
        const closeMobileButton = document.getElementById('btn-close-mobile');

        function openMobileMenu() {
            mobileSidebar?.classList.remove('hidden');
            setTimeout(() => {
                mobileContent?.classList.remove('-translate-x-full');
            }, 10);
        }

        function closeMobileMenu() {
            mobileContent?.classList.add('-translate-x-full');
            setTimeout(() => {
                mobileSidebar?.classList.add('hidden');
            }, 300);
        }

        mobileMenuButton?.addEventListener('click', openMobileMenu);
        mobileOverlay?.addEventListener('click', closeMobileMenu);
        closeMobileButton?.addEventListener('click', closeMobileMenu);

        document.querySelectorAll('.mobile-nav-btn').forEach((btn) => {
            btn.addEventListener('click', (event) => {
                const section = event.currentTarget.dataset.section;
                Navigation.showSection(section);
                closeMobileMenu();
            });
        });

        document.getElementById('btn-header-notif')?.addEventListener('click', () => {
            Navigation.showSection('notifications');
        });

        document.getElementById('alert-days')?.addEventListener('change', () => this.saveAlertSettings());
        document.getElementById('alert-km')?.addEventListener('change', () => this.saveAlertSettings());
        document.getElementById('email-notifications')?.addEventListener('change', () => this.saveAlertSettings());
        document.getElementById('sound-feedback')?.addEventListener('change', () => this.saveAlertSettings());
        document.getElementById('haptic-feedback')?.addEventListener('change', () => this.saveAlertSettings());
        document.getElementById('btn-mark-all-read')?.addEventListener('click', () => Notifications.markAllAsRead());

        this.loadAlertSettings();
    },

    saveAlertSettings() {
        AppState.alertSettings = {
            ...AppState.alertSettings,
            days: parseInt(document.getElementById('alert-days').value, 10),
            km: parseInt(document.getElementById('alert-km').value, 10),
            email: document.getElementById('email-notifications').checked,
            sound: document.getElementById('sound-feedback')?.checked ?? AppState.alertSettings.sound,
            haptic: document.getElementById('haptic-feedback')?.checked ?? AppState.alertSettings.haptic,
        };

        AppState.saveToStorage();
        Maintenance.checkStatus();
        UI.showToast('Configurações salvas!', 'success');
    },

    loadAlertSettings() {
        const alertDays = document.getElementById('alert-days');
        const alertKm = document.getElementById('alert-km');
        const emailNotifications = document.getElementById('email-notifications');
        const soundFeedback = document.getElementById('sound-feedback');
        const hapticFeedback = document.getElementById('haptic-feedback');

        if (alertDays) alertDays.value = AppState.alertSettings.days;
        if (alertKm) alertKm.value = AppState.alertSettings.km;
        if (emailNotifications) emailNotifications.checked = AppState.alertSettings.email;
        if (soundFeedback) soundFeedback.checked = AppState.alertSettings.sound !== false;
        if (hapticFeedback) hapticFeedback.checked = AppState.alertSettings.haptic !== false;
    },
};

const Navigation = {
    sections: ['dashboard', 'vehicles', 'maintenance', 'providers', 'notifications'],
    _bound: false,

    init() {
        if (this._bound) return;
        this._bound = true;

        const sidebar = document.getElementById('sidebar');
        const mainApp = document.getElementById('main-app');
        const sidebarHoverZone = document.getElementById('sidebar-hover-zone');

        if (sidebar) {
            let closeSidebarTimeout = null;

            const setSidebarExpanded = (isExpanded) => {
                sidebar.classList.toggle('expanded', isExpanded);
                mainApp?.classList.toggle('sidebar-expanded', isExpanded);
            };

            const clearCloseTimeout = () => {
                if (!closeSidebarTimeout) return;
                clearTimeout(closeSidebarTimeout);
                closeSidebarTimeout = null;
            };

            const scheduleCloseSidebar = () => {
                clearCloseTimeout();
                closeSidebarTimeout = setTimeout(() => {
                    const hoveringSidebar = sidebar.matches(':hover');
                    const hoveringZone = sidebarHoverZone?.matches(':hover');
                    if (!hoveringSidebar && !hoveringZone) {
                        setSidebarExpanded(false);
                    }
                }, 80);
            };

            setSidebarExpanded(false);

            sidebar.addEventListener('mouseenter', () => {
                if (window.innerWidth < 1024) return;
                clearCloseTimeout();
                setSidebarExpanded(true);
            });

            sidebar.addEventListener('mouseleave', () => {
                if (window.innerWidth < 1024) return;
                scheduleCloseSidebar();
            });

            sidebarHoverZone?.addEventListener('mouseenter', () => {
                if (window.innerWidth < 1024) return;
                clearCloseTimeout();
                setSidebarExpanded(true);
            });

            sidebarHoverZone?.addEventListener('mouseleave', () => {
                if (window.innerWidth < 1024) return;
                scheduleCloseSidebar();
            });
        }

        document.querySelectorAll('.sidebar-btn[data-section]').forEach((btn) => {
            btn.addEventListener('click', (event) => {
                const section = event.currentTarget.dataset.section;
                this.showSection(section);
            });
        });

        document.querySelectorAll('.btn-navigate').forEach((btn) => {
            btn.addEventListener('click', (event) => {
                const section = event.currentTarget.dataset.section;
                this.showSection(section);
            });
        });
    },

    showSection(sectionName) {
        if (!this.sections.includes(sectionName)) return;

        AppState.currentSection = sectionName;

        this.sections.forEach((section) => {
            document.getElementById(`section-${section}`)?.classList.add('hidden');
            document.querySelector(`.sidebar-btn[data-section="${section}"]`)?.classList.remove('active');
            document.querySelector(`.mobile-nav-btn[data-section="${section}"]`)?.classList.remove('bg-white/20');
        });

        document.getElementById(`section-${sectionName}`)?.classList.remove('hidden');
        document.querySelector(`.sidebar-btn[data-section="${sectionName}"]`)?.classList.add('active');
        document.querySelector(`.mobile-nav-btn[data-section="${sectionName}"]`)?.classList.add('bg-white/20');

        const titles = {
            dashboard: 'Dashboard',
            vehicles: 'Meus Veículos',
            maintenance: 'Manutenções',
            providers: 'Prestadores de Serviço',
            notifications: 'Notificações',
        };
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) pageTitle.textContent = titles[sectionName];

        this.initSection(sectionName);
    },

    initSection(sectionName) {
        switch (sectionName) {
            case 'dashboard': Dashboard.init(); break;
            case 'vehicles': Vehicles.init(); break;
            case 'maintenance':
                if (Maintenance.init) Maintenance.init();
                break;
            case 'providers': Providers.init(); break;
            case 'notifications':
                if (Notifications.init) Notifications.init();
                break;
            default:
                break;
        }
    },
};

const UIModule = {
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const icon = document.getElementById('toast-icon');
        const messageElement = document.getElementById('toast-message');

        const icons = {
            success: 'check-circle text-green-400',
            error: 'times-circle text-red-400',
            info: 'info-circle text-blue-400',
            warning: 'exclamation-triangle text-yellow-400',
        };

        if (!toast || !icon || !messageElement) return;

        icon.className = `fas ${icons[type]} text-xl`;
        messageElement.textContent = message;

        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    },

    showModal(title, content) {
        const modalId = `dynamic-modal-${Date.now()}`;
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up shadow-2xl">
                <div class="p-6 border-b-2 border-gray-100 flex items-center justify-between">
                    <h3 class="text-xl font-bold text-gray-800">${title}</h3>
                    <button onclick="document.getElementById('${modalId}').remove()" class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100">
                        <i class="fas fa-times text-gray-500"></i>
                    </button>
                </div>
                <div class="p-6">${content}</div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener('click', (event) => {
            if (event.target === modal) modal.remove();
        });
    },
};

window.App = App;
window.Navigation = Navigation;
window.UI = UIModule;
