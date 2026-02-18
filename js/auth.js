/**
 * Authentication Module (Atualizado com Logout)
 */

const Auth = {
	elements: {},
	isInitialized: false,

	init() {
		if (this.isInitialized) return;
		this.isInitialized = true;

		this.cacheElements();
		this.bindEvents();
		this.checkSession();
	},

	cacheElements() {
		this.elements = {
			loginForm: document.getElementById('form-login'),
			registerForm: document.getElementById('form-register'),
			forgotForm: document.getElementById('form-forgot'),
			loginEmail: document.getElementById('login-email'),
			loginPassword: document.getElementById('login-password'),
			registerName: document.getElementById('register-name'),
			registerEmail: document.getElementById('register-email'),
			registerPassword: document.getElementById('register-password'),
			registerPasswordConfirm: document.getElementById('register-password-confirm'),
			forgotEmail: document.getElementById('forgot-email'),
		};
	},

	bindEvents() {
		document.getElementById('btn-show-register')?.addEventListener('click', () => this.showRegister());
		document.getElementById('btn-show-login')?.addEventListener('click', () => this.showLogin());
		document.getElementById('btn-forgot-password')?.addEventListener('click', () => this.showForgot());
		document.getElementById('btn-back-login')?.addEventListener('click', () => this.showLogin());

		this.elements.loginForm?.addEventListener('submit', (event) => this.handleLogin(event));
		this.elements.registerForm?.addEventListener('submit', (event) => this.handleRegister(event));
		this.elements.forgotForm?.addEventListener('submit', (event) => this.handleForgot(event));

		this.bindLogoutButtons();
	},

	bindLogoutButtons() {
		const btnLogoutSidebar = document.getElementById('btn-logout');
		if (btnLogoutSidebar && btnLogoutSidebar.parentNode) {
			const newBtn = btnLogoutSidebar.cloneNode(true);
			btnLogoutSidebar.parentNode.replaceChild(newBtn, btnLogoutSidebar);
			newBtn.addEventListener('click', () => this.logout());
		}

		const btnLogoutHeader = document.getElementById('btn-logout-header');
		if (btnLogoutHeader) {
			btnLogoutHeader.addEventListener('click', () => this.logout());
		}

		const btnLogoutMobile = document.getElementById('btn-logout-mobile');
		if (btnLogoutMobile) {
			btnLogoutMobile.addEventListener('click', () => this.logout());
		}
	},

	checkSession() {
		if (window.AppState?.loadFromStorage && AppState.loadFromStorage() && AppState.currentUser) {
			this.showMainApp();
		}
	},

	showLogin() {
		this.hideAllForms();
		document.getElementById('login-form')?.classList.remove('hidden');
	},

	showRegister() {
		this.hideAllForms();
		document.getElementById('register-form')?.classList.remove('hidden');
	},

	showForgot() {
		this.hideAllForms();
		document.getElementById('forgot-form')?.classList.remove('hidden');
	},

	hideAllForms() {
		['login-form', 'register-form', 'forgot-form'].forEach((id) => {
			document.getElementById(id)?.classList.add('hidden');
		});
	},

	async handleLogin(event) {
		event.preventDefault();

		const email = this.elements.loginEmail?.value?.trim() || '';
		const password = this.elements.loginPassword?.value || '';

		if (!Utils.isValidEmail(email)) {
			UI.showToast('E-mail inválido', 'error');
			return;
		}

		const btn = document.getElementById('btn-login');
		const spinner = document.getElementById('login-spinner');
		if (btn) btn.disabled = true;
		spinner?.classList.remove('hidden');

		await this.simulateDelay(800);

		if (email === 'demo@autocare.com' && password === '123456') {
			this.createSession('Usuário Demo', email);
			DemoData.init();
		} else {
			this.createSession(email.split('@')[0], email);
		}

		if (btn) btn.disabled = false;
		spinner?.classList.add('hidden');
		this.showMainApp();
		UI.showToast('Login realizado com sucesso!', 'success');
	},

	async handleRegister(event) {
		event.preventDefault();

		const name = Utils.sanitizeString(this.elements.registerName?.value);
		const email = this.elements.registerEmail?.value?.trim() || '';
		const password = this.elements.registerPassword?.value || '';
		const confirm = this.elements.registerPasswordConfirm?.value || '';

		if (name.length < 3) {
			UI.showToast('Nome deve ter pelo menos 3 caracteres', 'error');
			return;
		}

		if (!Utils.isValidEmail(email)) {
			UI.showToast('E-mail inválido', 'error');
			return;
		}

		if (password.length < 6) {
			UI.showToast('Senha deve ter pelo menos 6 caracteres', 'error');
			return;
		}

		if (password !== confirm) {
			UI.showToast('As senhas não coincidem', 'error');
			return;
		}

		const btn = document.getElementById('btn-register');
		const spinner = document.getElementById('register-spinner');
		if (btn) btn.disabled = true;
		spinner?.classList.remove('hidden');

		await this.simulateDelay(1000);

		this.createSession(name, email);

		if (btn) btn.disabled = false;
		spinner?.classList.add('hidden');
		this.showMainApp();
		UI.showToast('Conta criada com sucesso!', 'success');
	},

	async handleForgot(event) {
		event.preventDefault();

		const email = this.elements.forgotEmail?.value?.trim() || '';

		if (!Utils.isValidEmail(email)) {
			UI.showToast('E-mail inválido', 'error');
			return;
		}

		const btn = document.getElementById('btn-forgot-submit');
		const spinner = document.getElementById('forgot-spinner');
		if (btn) btn.disabled = true;
		spinner?.classList.remove('hidden');

		await this.simulateDelay(1000);

		if (btn) btn.disabled = false;
		spinner?.classList.add('hidden');
		UI.showToast('Instruções enviadas para seu e-mail!', 'success');
		this.showLogin();
	},

	createSession(name, email) {
		AppState.currentUser = {
			id: Utils.generateId(),
			name,
			email,
			createdAt: new Date().toISOString(),
			lastLogin: new Date().toISOString(),
		};
		AppState.saveToStorage();
	},

	logout() {
		if (!confirm('Tem certeza que deseja sair?')) {
			return;
		}

		console.log('🔒 Realizando logout...');

		AppState.currentUser = null;

		const keysToRemove = [
			'autocare_data',
			'autocare_settings',
			'currentUser',
			'vehicles',
			'maintenances',
		];

		keysToRemove.forEach((key) => {
			try {
				localStorage.removeItem(key);
			} catch (error) {
				console.warn(`Erro ao remover ${key}:`, error);
			}
		});

		if (window.Vehicles) {
			Vehicles.isInitialized = false;
		}
		if (window.Maintenance) {
			Maintenance.isInitialized = false;
		}
		if (window.Providers) {
			Providers.isInitialized = false;
		}

		this.isInitialized = false;

		UI.showToast('Logout realizado com sucesso!', 'success');

		setTimeout(() => {
			document.getElementById('main-app')?.classList.add('hidden');

			const authSection = document.getElementById('auth-section');
			authSection?.classList.remove('hidden');

			this.showLogin();

			this.elements.loginForm?.reset();
			this.elements.registerForm?.reset();
			this.elements.forgotForm?.reset();

			console.log('✅ Logout completo');
		}, 500);
	},

	showMainApp() {
		document.getElementById('auth-section')?.classList.add('hidden');
		document.getElementById('main-app')?.classList.remove('hidden');

		this.updateUserInfo();
		this.bindLogoutButtons();

		Dashboard.init();
	},

	updateUserInfo() {
		const user = AppState.currentUser;
		if (!user) return;

		const nameEl = document.getElementById('user-name');
		const emailEl = document.getElementById('user-email');
		const avatarEl = document.getElementById('user-avatar');

		if (nameEl) nameEl.textContent = user.name;
		if (emailEl) emailEl.textContent = user.email;

		if (avatarEl) {
			const initials = String(user.name || '')
				.split(' ')
				.filter(Boolean)
				.map((part) => part[0])
				.join('')
				.substring(0, 2)
				.toUpperCase();
			avatarEl.innerHTML = initials;
		}
	},

	simulateDelay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	},
};

window.Auth = Auth;
