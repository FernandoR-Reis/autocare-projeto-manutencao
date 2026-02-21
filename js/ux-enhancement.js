/**
 * AutoCare UX Enhancement Module
 * Melhorias de experiência para usuários leigos
 * Integração com código existente
 */

(function() {
    'use strict';

    const ToastSystem = {
        container: null,

        init() {
            let container = document.getElementById('toast-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'toast-container';
                container.className = 'toast-container';
                container.setAttribute('role', 'region');
                container.setAttribute('aria-live', 'polite');
                container.setAttribute('aria-label', 'Notificações');
                document.body.appendChild(container);
            }
            this.container = container;
        },

        escapeHtml(value) {
            return String(value || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        },

        show(options) {
            if (!this.container) this.init();

            const {
                type = 'success',
                title = 'Atualização',
                message = '',
                action,
                duration = 5000
            } = options || {};

            const icons = {
                success: '✅',
                error: '❌',
                warning: '⚠️',
                info: '💡'
            };

            const toast = document.createElement('div');
            toast.className = `toast toast--${type}`;
            toast.setAttribute('role', 'alert');

            const safeTitle = this.escapeHtml(title);
            const safeMessage = this.escapeHtml(message);

            let actionHtml = '';
            if (action?.href && action?.text) {
                const safeHref = this.escapeHtml(action.href);
                const safeText = this.escapeHtml(action.text);
                actionHtml = `<a href="${safeHref}" class="toast__action">${safeText}</a>`;
            }

            toast.innerHTML = `
                <span class="toast__icon">${icons[type] || icons.info}</span>
                <div class="toast__content">
                    <div class="toast__title">${safeTitle}</div>
                    <div class="toast__message">${safeMessage}</div>
                    ${actionHtml}
                </div>
            `;

            this.container.appendChild(toast);
            this.announce(`${title}: ${message}`);

            window.setTimeout(() => {
                toast.remove();
            }, duration);
        },

        announce(message) {
            const announcer = document.createElement('div');
            announcer.setAttribute('role', 'status');
            announcer.className = 'sr-only';
            announcer.textContent = message;
            document.body.appendChild(announcer);
            window.setTimeout(() => announcer.remove(), 1200);
        },

        success(title, message, action) {
            this.show({ type: 'success', title, message, action });
        },

        error(title, message) {
            this.show({ type: 'error', title, message, duration: 8000 });
        },

        warning(title, message) {
            this.show({ type: 'warning', title, message });
        },

        nextAction(suggestion) {
            this.show({
                type: 'info',
                title: 'Próximo passo',
                message: suggestion,
                duration: 8000
            });
        }
    };

    const VehicleUXEnhancer = {
        lastVehicleCount: 0,

        init() {
            this.lastVehicleCount = this.getVehicleCount();
            this.enhanceOnboardingCard();
            this.enhanceEmptyState();
            this.bindVehicleAddWatcher();
            this.observeDashboardOnboarding();
        },

        getVehicleCount() {
            return Array.isArray(window.AppState?.vehicles) ? window.AppState.vehicles.length : 0;
        },

        observeDashboardOnboarding() {
            const target = document.getElementById('dashboard-onboarding');
            if (!target) return;

            const observer = new MutationObserver(() => {
                this.enhanceOnboardingCard();
            });

            observer.observe(target, { childList: true, subtree: true });
        },

        enhanceOnboardingCard() {
            const onboardingCard = document.querySelector('#dashboard-onboarding .onboarding-card');
            if (!onboardingCard) return;

            onboardingCard.classList.add('onboarding-card--highlight');

            const firstActionButton = onboardingCard.querySelector('.btn-sm-primary');
            if (firstActionButton) {
                firstActionButton.classList.add('btn-pulse');
            }
        },

        enhanceEmptyState() {
            const emptyVehicles = document.getElementById('empty-vehicles');
            if (!emptyVehicles) return;

            emptyVehicles.classList.add('empty-state--actionable');

            const title = emptyVehicles.querySelector('h3');
            if (title) title.classList.add('empty-state__title');

            const subtitle = emptyVehicles.querySelector('p');
            if (subtitle) subtitle.classList.add('empty-state__help');

            const addBtn = document.getElementById('btn-empty-add-vehicle');
            if (addBtn) addBtn.classList.add('btn-pulse');
        },

        bindVehicleAddWatcher() {
            const form = document.getElementById('form-add-vehicle');
            if (!form) return;

            form.addEventListener('submit', () => {
                window.setTimeout(() => {
                    const currentCount = this.getVehicleCount();
                    if (currentCount > this.lastVehicleCount) {
                        ToastSystem.nextAction('Que tal registrar a última troca de óleo para ativar os lembretes automáticos?');
                    }
                    this.lastVehicleCount = currentCount;
                }, 900);
            });
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        ToastSystem.init();
        VehicleUXEnhancer.init();

        window.ToastSystem = ToastSystem;
        window.VehicleUXEnhancer = VehicleUXEnhancer;
    });
})();
