// Modal Component

const Modal = {
    show(title, content, buttons = []) {
        const container = document.getElementById('modal-container');

        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        backdrop.onclick = (e) => {
            if (e.target === backdrop) {
                this.close();
            }
        };

        const modal = document.createElement('div');
        modal.className = 'modal';

        modal.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${escapeHtml(title)}</h3>
                <button class="modal-close" onclick="Modal.close()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
            ${buttons.length > 0 ? `
                <div class="modal-footer">
                    ${buttons.map((btn, index) => `
                        <button class="btn ${btn.className || 'btn-secondary'}" 
                                onclick="Modal.handleButtonClick(${index})"
                                ${btn.disabled ? 'disabled' : ''}>
                            ${escapeHtml(btn.text)}
                        </button>
                    `).join('')}
                </div>
            ` : ''}
        `;

        backdrop.appendChild(modal);
        container.appendChild(backdrop);

        this.currentButtons = buttons;
        this.currentModal = backdrop;

        this.escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        };
        document.addEventListener('keydown', this.escapeHandler);
    },

    close() {
        const container = document.getElementById('modal-container');
        container.innerHTML = '';
        this.currentButtons = [];
        this.currentModal = null;

        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
            this.escapeHandler = null;
        }
    },

    handleButtonClick(index) {
        const button = this.currentButtons[index];
        if (button && button.onClick) {
            button.onClick();
        }
        if (button && button.closeOnClick !== false) {
            this.close();
        }
    },

    confirm(title, message, onConfirm, onCancel) {
        this.show(title, `<p>${escapeHtml(message)}</p>`, [
            {
                text: 'Cancel',
                className: 'btn-secondary',
                onClick: onCancel
            },
            {
                text: 'Confirm',
                className: 'btn-primary',
                onClick: onConfirm
            }
        ]);
    },

    alert(title, message) {
        this.show(title, `<p>${escapeHtml(message)}</p>`, [
            {
                text: 'OK',
                className: 'btn-primary'
            }
        ]);
    },

    showOptions(options, onSelect) {
        const content = options.map((option, index) => `
            <div class="modal-option" 
                 style="padding: 16px; text-align: center; cursor: pointer; border-bottom: 1px solid var(--border); transition: background 0.2s;"
                 onmouseover="this.style.background='var(--background)'"
                 onmouseout="this.style.background='transparent'"
                 onclick="Modal.selectOption(${index})">
                ${escapeHtml(option)}
            </div>
        `).join('');

        this.show('', content.replace(/border-bottom[^;]+;/, ''), []);
        this.onSelectCallback = (index) => {
            onSelect(options[index]);
            this.close();
        };
    },

    selectOption(index) {
        if (this.onSelectCallback) {
            this.onSelectCallback(index);
        }
    },

    loading(message = 'Loading...') {
        this.show('', `
            <div style="text-align: center; padding: 32px;">
                <div class="spinner" style="margin: 0 auto 16px;"></div>
                <p>${escapeHtml(message)}</p>
            </div>
        `, []);
    }
};
