const AssistantIntegration = {
    initialized: false,
    renderHooksPatched: false,
    refreshHandle: null,

    init() {
        if (this.initialized) {
            this.scheduleRefresh();
            return;
        }

        this.initialized = true;
        this.patchRenderHooks();
        this.bindGlobalListeners();
        this.scheduleRefresh();
    },

    patchRenderHooks() {
        if (this.renderHooksPatched) return;

        const wrap = (target, methodName) => {
            const original = target?.[methodName];
            if (typeof original !== 'function' || original.__assistantWrapped) return;

            const integration = this;
            const wrapped = function wrappedMethod(...args) {
                const result = original.apply(this, args);
                integration.scheduleRefresh();
                return result;
            };

            wrapped.__assistantWrapped = true;
            target[methodName] = wrapped;
        };

        wrap(window.Vehicles, 'render');
        wrap(window.Dashboard, 'renderVehiclesOverview');
        wrap(window.Dashboard, 'updateStats');

        this.renderHooksPatched = true;
    },

    bindGlobalListeners() {
        window.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.patchRenderHooks();
                this.scheduleRefresh();
            }
        });

        window.addEventListener('storage', () => this.scheduleRefresh());
    },

    scheduleRefresh() {
        if (this.refreshHandle) {
            clearTimeout(this.refreshHandle);
        }

        this.refreshHandle = setTimeout(() => {
            this.refreshHandle = null;
            this.renderDashboardAssistant();
            this.decorateVehicleCards();
        }, 40);
    },

    renderDashboardAssistant() {
        const section = document.getElementById('section-dashboard');
        if (!section || !window.MaintenanceEngine || !window.AssistantUI) return;

        let wrapper = document.getElementById('assistant-dashboard-block');
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.id = 'assistant-dashboard-block';
            wrapper.className = 'grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6';
            wrapper.innerHTML = `
                <div id="assistant-status-card"></div>
                <div id="assistant-next-widget"></div>
            `;

            const onboarding = document.getElementById('dashboard-onboarding');
            if (onboarding && onboarding.parentNode) {
                onboarding.parentNode.insertBefore(wrapper, onboarding.nextSibling);
            } else {
                section.insertBefore(wrapper, section.firstChild);
            }
        }

        const vehicles = Array.isArray(window.AppState?.vehicles) ? window.AppState.vehicles : [];
        if (!vehicles.length) {
            wrapper.classList.add('hidden');
            return;
        }

        wrapper.classList.remove('hidden');

        const analyses = vehicles
            .map((vehicle) => window.MaintenanceEngine.analyzeVehicle(vehicle))
            .filter(Boolean);

        if (!analyses.length) return;

        const weightByLevel = { danger: 3, warning: 2, info: 1, good: 0 };
        const selected = analyses.sort((a, b) => {
            const aWeight = weightByLevel[a.overallStatus?.level] ?? 0;
            const bWeight = weightByLevel[b.overallStatus?.level] ?? 0;
            if (aWeight !== bWeight) return bWeight - aWeight;
            return (b.recommendations?.length || 0) - (a.recommendations?.length || 0);
        })[0];

        if (!selected) return;

        window.AssistantUI.renderStatusCard('assistant-status-card', selected);
        window.AssistantUI.renderNextMaintenanceWidget('assistant-next-widget', selected);
    },

    decorateVehicleCards() {
        if (!window.MaintenanceEngine || !window.AssistantUI) return;

        const cards = document.querySelectorAll('#vehicles-grid [data-vehicle-id], #vehicles-overview [data-vehicle-id]');
        cards.forEach((card) => {
            const vehicleId = card.getAttribute('data-vehicle-id');
            if (!vehicleId) return;

            const vehicle = (window.AppState?.vehicles || []).find((item) => String(item.id) === String(vehicleId));
            if (!vehicle) return;

            const analysis = window.MaintenanceEngine.analyzeVehicle(vehicle);
            if (!analysis) return;

            let anchor = card.querySelector('.assistant-inline');
            if (!anchor) {
                anchor = document.createElement('div');
                anchor.className = 'assistant-inline mt-3 pt-3 border-t border-slate-200 flex items-center justify-between gap-2';
                card.appendChild(anchor);
            }

            const levelMap = {
                danger: { text: 'Ação urgente', cls: 'text-red-600 bg-red-50 border-red-200' },
                warning: { text: 'Atenção em breve', cls: 'text-amber-700 bg-amber-50 border-amber-200' },
                info: { text: 'Histórico incompleto', cls: 'text-blue-700 bg-blue-50 border-blue-200' },
                good: { text: 'Tudo em dia', cls: 'text-green-700 bg-green-50 border-green-200' }
            };

            const level = levelMap[analysis.overallStatus?.level] || levelMap.good;

            anchor.innerHTML = `
                <span class="text-xs font-semibold px-2 py-1 rounded-full border ${level.cls}">${level.text}</span>
                <button type="button" class="text-xs font-semibold text-blue-600 hover:text-blue-700">Ver recomendações</button>
            `;

            const button = anchor.querySelector('button');
            if (!button) return;

            button.onclick = (event) => {
                event.preventDefault();
                event.stopPropagation();
                window.AssistantUI.openRecommendationModal(vehicleId);
            };
        });
    }
};

window.AssistantIntegration = AssistantIntegration;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.AssistantIntegration.init());
} else {
    window.AssistantIntegration.init();
}

window.addEventListener('load', () => {
    window.AssistantIntegration.patchRenderHooks();
    window.AssistantIntegration.scheduleRefresh();
});
