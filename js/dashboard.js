/**
 * Dashboard Module (Atualizado com Imagens)
 */

const Dashboard = {
	dateIntervalId: null,
	onboardingStorageKey: 'autocare_onboarding',

	init() {
		this.updateDate();

		if (!this.dateIntervalId) {
			this.dateIntervalId = setInterval(() => this.updateDate(), 60000);
		}

		this.updateStats();
		this.renderNextMaintenances();
		this.renderVehiclesOverview();
		this.renderOnboarding();
		this.loadHeroImage();
	},

	getOnboardingState() {
		try {
			const raw = localStorage.getItem(this.onboardingStorageKey);
			const parsed = raw ? JSON.parse(raw) : {};
			return {
				skipped: parsed.skipped || {},
				done: parsed.done || {},
			};
		} catch (error) {
			return { skipped: {}, done: {} };
		}
	},

	saveOnboardingState(state) {
		try {
			localStorage.setItem(this.onboardingStorageKey, JSON.stringify(state || { skipped: {}, done: {} }));
		} catch (error) {
			console.warn('Não foi possível salvar onboarding:', error);
		}
	},

	hasVehicle() {
		return Array.isArray(AppState.vehicles) && AppState.vehicles.length > 0;
	},

	hasMaintenance() {
		return Array.isArray(AppState.maintenances) && AppState.maintenances.length > 0;
	},

	isDashboardEmpty() {
		return !this.hasVehicle() && !this.hasMaintenance();
	},

	isReminderConfigured(onboardingState) {
		const defaults = window.CONSTANTS || {};
		const defaultDays = Number(defaults.DEFAULT_ALERT_DAYS || 30);
		const defaultKm = Number(defaults.DEFAULT_ALERT_KM || 1000);

		const changedInSettings = Number(AppState.alertSettings.days) !== defaultDays
			|| Number(AppState.alertSettings.km) !== defaultKm
			|| Boolean(AppState.alertSettings.email) !== true;

		return Boolean(onboardingState?.done?.['set-reminders']) || changedInSettings;
	},

	getOnboardingSteps() {
		const onboardingState = this.getOnboardingState();
		const hasVehicle = this.hasVehicle();
		const hasMaintenance = this.hasMaintenance();

		const steps = [
			{
				id: 'add-vehicle',
				title: 'Adicione seu primeiro veículo',
				description: 'Cadastre marca, modelo e placa',
				icon: '🚗',
				skippable: false,
				locked: false,
				done: hasVehicle,
			},
			{
				id: 'first-maintenance',
				title: 'Registre uma manutenção',
				description: 'Óleo, filtros ou revisão - comece com o básico',
				icon: '🔧',
				skippable: true,
				locked: !hasVehicle,
				done: hasMaintenance,
			},
			{
				id: 'set-reminders',
				title: 'Configure alertas',
				description: 'Nunca mais perca uma troca de óleo',
				icon: '🔔',
				skippable: true,
				locked: false,
				done: this.isReminderConfigured(onboardingState),
			},
		];

		let hasSkipReconciliation = false;
		const mappedSteps = steps.map((step) => {
			const wasSkipped = Boolean(onboardingState.skipped?.[step.id]);
			if (step.done && wasSkipped) {
				delete onboardingState.skipped[step.id];
				hasSkipReconciliation = true;
			}

			return {
				...step,
				skipped: Boolean(onboardingState.skipped?.[step.id]),
			};
		});

		if (hasSkipReconciliation) {
			this.saveOnboardingState(onboardingState);
		}

		return mappedSteps;
	},

	startOnboardingStep(stepId) {
		switch (stepId) {
			case 'add-vehicle':
				if (window.Vehicles?.openModal) {
					window.Vehicles.openModal();
				}
				break;
			case 'first-maintenance':
				if (!this.hasVehicle()) {
					if (window.UI?.showToast) window.UI.showToast('Cadastre um veículo primeiro.', 'info');
					return;
				}
				if (window.Maintenance?.openModal) {
					window.Maintenance.openModal();
				}
				break;
			case 'set-reminders': {
				const onboardingState = this.getOnboardingState();
				onboardingState.done['set-reminders'] = true;
				this.saveOnboardingState(onboardingState);
				if (window.Navigation?.showSection) {
					window.Navigation.showSection('notifications');
				}
				break;
			}
			default:
				break;
		}

		this.renderOnboarding();
	},

	skipOnboardingStep(stepId) {
		const onboardingState = this.getOnboardingState();
		onboardingState.skipped[stepId] = true;
		this.saveOnboardingState(onboardingState);
		this.renderOnboarding();
	},

	renderOnboarding() {
		const container = document.getElementById('dashboard-onboarding');
		if (!container) return;

		if (!this.isDashboardEmpty()) {
			container.classList.add('hidden');
			container.innerHTML = '';
			return;
		}

		const steps = this.getOnboardingSteps();
		const visibleSteps = steps.filter((step) => !step.skipped || step.done);
		const totalSteps = visibleSteps.length || steps.length;
		const completed = visibleSteps.filter((step) => step.done).length;
		const progress = Math.round((completed / totalSteps) * 100);

		container.classList.remove('hidden');
		container.innerHTML = `
			<div class="onboarding-card">
				<div class="onboarding-header">
					<div class="progress-ring">
						<svg viewBox="0 0 36 36">
							<path class="progress-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
							<path class="progress-fill" stroke-dasharray="${progress}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
						</svg>
						<span class="progress-text">${completed}/${totalSteps}</span>
					</div>
					<div>
						<h3 class="text-lg font-bold text-slate-900">Primeiros passos</h3>
						<p class="text-sm text-slate-500">Complete as etapas para iniciar o controle da sua manutenção.</p>
					</div>
				</div>
				<div class="steps-list">
					${visibleSteps.map((step) => {
						const statusNode = step.done
							? '<span class="step-status">✓</span>'
							: step.locked
								? '<span class="text-slate-500">🔒</span>'
								: `<div class="step-actions"><button onclick="Dashboard.startOnboardingStep('${step.id}')" class="btn-sm btn-sm-primary">Começar</button>${step.skippable ? `<button onclick="Dashboard.skipOnboardingStep('${step.id}')" class="btn-sm btn-sm-ghost">Pular</button>` : ''}</div>`;

						return `
							<div class="step ${step.done ? 'done' : ''} ${step.locked ? 'locked' : ''}">
								<div class="step-icon">${step.icon}</div>
								<div class="step-content">
									<h4>${step.title}</h4>
									<p>${step.description}</p>
								</div>
								${statusNode}
							</div>
						`;
					}).join('')}
				</div>
			</div>
		`;
	},

	async loadHeroImage() {
		const heroUrl = await ImagesAPI.getBackground('automotive');
		const dashboardSection = document.getElementById('section-dashboard');
		if (dashboardSection && !document.getElementById('dashboard-hero')) {
			const hero = document.createElement('div');
			hero.id = 'dashboard-hero';
			hero.className = 'relative h-64 rounded-2xl overflow-hidden mb-6 shadow-xl';
			hero.innerHTML = `
				<img src="${heroUrl}" class="w-full h-full object-cover">
				<div class="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-blue-600/70"></div>
				<div class="absolute inset-0 flex items-center justify-between p-8">
					<div class="text-white">
						<h2 class="text-3xl font-bold mb-2">Bem-vindo de volta!</h2>
						<p class="text-blue-100 text-lg">Você tem ${AppState.stats.overdue} manutenção(ões) vencida(s)</p>
					</div>
					<div class="hidden md:block">
						<img src="${ImagesAPI.getIcon('car-wrench', 'ffffff', 80)}" class="opacity-80">
					</div>
				</div>
			`;
			dashboardSection.insertBefore(hero, dashboardSection.firstChild);
		}
	},

	updateDate() {
		const now = new Date();
		const options = {
			weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
		};
		const dateStr = now.toLocaleDateString('pt-BR', options);

		const currentDate = document.getElementById('current-date');
		const headerDate = document.getElementById('header-date');
		if (currentDate) currentDate.textContent = dateStr;
		if (headerDate) headerDate.textContent = dateStr;
	},

	updateStats() {
		const stats = AppState.stats;

		const statOk = document.getElementById('stat-ok');
		const statWarning = document.getElementById('stat-warning');
		const statOverdue = document.getElementById('stat-overdue');
		const statVehicles = document.getElementById('stat-vehicles');

		if (statOk) statOk.textContent = stats.ok;
		if (statWarning) statWarning.textContent = stats.warning;
		if (statOverdue) statOverdue.textContent = stats.overdue;
		if (statVehicles) statVehicles.textContent = AppState.vehicles.length;

		Notifications.updateBadge();
	},

	renderNextMaintenances() {
		const container = document.getElementById('next-maintenances-list');
		if (!container) return;

		const urgent = AppState.urgentMaintenances.slice(0, 3);

		if (urgent.length === 0) {
			container.innerHTML = `
				<div class="text-center py-8 text-gray-500 bg-green-50 rounded-xl border-2 border-green-100 border-dashed">
					<img src="${ImagesAPI.getIcon('check-circle', '10b981', 64)}" class="mx-auto mb-3 opacity-50">
					<p class="font-medium text-green-700">Todas as manutenções estão em dia!</p>
					<p class="text-sm text-green-600 mt-1">Excelente trabalho cuidando do seu veículo</p>
				</div>
			`;
			return;
		}

		container.innerHTML = urgent.map((maintenance) => {
			const vehicle = AppState.vehicles.find((item) => String(item.id) === String(maintenance.vehicleId));
			const status = Utils.statusColors[maintenance.status] || Utils.statusColors.ok;
			const vehicleImage = vehicle?.imageUrl || ImagesAPI.getVehicleImage(vehicle?.brand || 'car', vehicle?.model || '');

			return `
				<div class="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
					onclick="Navigation.showSection('maintenance')">
					<div class="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
						<img src="${vehicleImage}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
						<div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
						<i class="fas fa-wrench absolute bottom-1 left-1 text-white text-xs"></i>
					</div>
					<div class="flex-1 min-w-0">
						<h4 class="font-bold text-gray-800 truncate">${maintenance.name}</h4>
						<p class="text-sm text-gray-500 truncate">${vehicle?.model || 'Veículo'}</p>
						<p class="text-xs text-gray-400 flex items-center gap-1 mt-1">
							<i class="fas fa-calendar-alt"></i> ${Utils.formatDate(maintenance.nextDate)}
						</p>
					</div>
					<span class="px-3 py-1.5 rounded-full text-xs font-bold ${status.bg} ${status.text} border ${status.border} flex-shrink-0">
						${status.label}
					</span>
				</div>
			`;
		}).join('');
	},

	renderVehiclesOverview() {
		const container = document.getElementById('vehicles-overview');
		if (!container) return;

		if (AppState.vehicles.length === 0) {
			container.innerHTML = `
				<div class="col-span-full text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
					<img src="${ImagesAPI.getIcon('car', '94a3b8', 64)}" class="mx-auto mb-4 opacity-50">
					<p class="text-gray-500 mb-4">Nenhum veículo cadastrado</p>
					<button onclick="Vehicles.openModal()" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-lg">
						<i class="fas fa-plus mr-2"></i>Adicionar Primeiro Veículo
					</button>
				</div>
			`;
			return;
		}

		container.innerHTML = AppState.vehicles.map((vehicle) => {
			const vehicleMaintenances = AppState.maintenances.filter((maintenance) => String(maintenance.vehicleId) === String(vehicle.id));
			const overdue = vehicleMaintenances.filter((maintenance) => maintenance.status === 'overdue').length;
			const warning = vehicleMaintenances.filter((maintenance) => maintenance.status === 'warning').length;
			const imageUrl = vehicle.imageUrl || ImagesAPI.getVehicleImage(vehicle.brand, vehicle.model);

			let statusColor = 'green';
			let statusText = 'Tudo em dia';
			let statusIcon = 'check-circle';
			if (overdue > 0) {
				statusColor = 'red';
				statusText = `${overdue} vencida(s)`;
				statusIcon = 'exclamation-circle';
			} else if (warning > 0) {
				statusColor = 'yellow';
				statusText = `${warning} próxima(s)`;
				statusIcon = 'clock';
			}

			return `
				<div class="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all group cursor-pointer" onclick="Vehicles.openUpdateKmModal('${vehicle.id}')">
					<div class="flex items-start gap-4">
						<div class="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
							<img src="${imageUrl}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
						</div>
						<div class="flex-1 min-w-0">
							<div class="flex items-center justify-between mb-1">
								<h4 class="font-bold text-gray-800 truncate">${vehicle.nickname || vehicle.model}</h4>
								<span class="w-2.5 h-2.5 rounded-full bg-${statusColor}-500 status-badge"></span>
							</div>
							<p class="text-xs text-gray-500 mb-2">${vehicle.brand} ${vehicle.year}</p>

							<div class="flex items-center justify-between text-sm">
								<span class="text-gray-600">
									<i class="fas fa-road text-gray-400 mr-1"></i>
									${Number(vehicle.km || 0).toLocaleString()} km
								</span>
								<span class="text-${statusColor}-600 font-medium text-xs flex items-center gap-1">
									<i class="fas fa-${statusIcon}"></i> ${statusText}
								</span>
							</div>
						</div>
					</div>
				</div>
			`;
		}).join('');
	},
};

window.Dashboard = Dashboard;
