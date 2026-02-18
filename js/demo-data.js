window.DemoData = Object.assign(window.DemoData || {}, {
	init() {
		if (typeof window.initializeDemoData === 'function') {
			window.initializeDemoData();
		}
	},
});
