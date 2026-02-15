window.Auth = Object.assign(window.Auth || {}, {
	init() {
		// Mantido para compatibilidade com App.init
	},
	logout() {
		if (typeof window.logout === 'function') {
			window.logout();
		}
	},
});
