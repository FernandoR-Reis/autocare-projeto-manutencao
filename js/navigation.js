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

window.Navigation = Navigation;
