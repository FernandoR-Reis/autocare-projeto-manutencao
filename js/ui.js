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

window.UI = UIModule;
