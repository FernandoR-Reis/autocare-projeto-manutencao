window.Utils = {
	debounce(callback, delay = 300) {
		let timeoutId;
		return (...args) => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => callback(...args), delay);
		};
	},

	generateId() {
		return Date.now() + Math.floor(Math.random() * 1000);
	},

	sanitizeString(value) {
		return String(value || '').trim().replace(/\s+/g, ' ');
	},

	isValidEmail(email) {
		const normalized = String(email || '').trim().toLowerCase();
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
		return emailRegex.test(normalized);
	},

	isValidPlate(plate) {
		const normalized = String(plate || '').toUpperCase().trim();
		const mercosul = /^[A-Z]{3}\d[A-Z]\d{2}$/;
		const antiga = /^[A-Z]{3}\d{4}$/;
		return mercosul.test(normalized) || antiga.test(normalized);
	},

	formatDate(dateInput) {
		if (!dateInput) return '-';
		return new Date(dateInput).toLocaleDateString('pt-BR');
	},

	fuelLabels: {
		gasoline: 'Gasolina',
		ethanol: 'Etanol',
		flex: 'Flex',
		diesel: 'Diesel',
		gnv: 'GNV',
		electric: 'Elétrico',
		hybrid: 'Híbrido',
	},

	providerTypeLabels: {
		mechanic: 'Mecânica',
		electric: 'Elétrica',
		tire: 'Borracharia',
		body: 'Funilaria',
		detailing: 'Estética',
	},

	providerTypeColors: {
		mechanic: 'bg-blue-100 text-blue-700',
		electric: 'bg-yellow-100 text-yellow-700',
		tire: 'bg-gray-100 text-gray-700',
		body: 'bg-red-100 text-red-700',
		detailing: 'bg-purple-100 text-purple-700',
	},

	providerIcons: {
		mechanic: 'wrench',
		electric: 'bolt',
		tire: 'circle',
		body: 'car-crash',
		detailing: 'sparkles',
	},

	statusColors: {
		overdue: {
			bg: 'bg-red-100',
			text: 'text-red-700',
			border: 'border-red-200',
			label: 'Vencida',
		},
		warning: {
			bg: 'bg-yellow-100',
			text: 'text-yellow-700',
			border: 'border-yellow-200',
			label: 'Próxima',
		},
		ok: {
			bg: 'bg-green-100',
			text: 'text-green-700',
			border: 'border-green-200',
			label: 'Em dia',
		},
	},
};
