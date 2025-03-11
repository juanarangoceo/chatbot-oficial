// Mobile Touch Handler v1.0
(function($) {
    'use strict';

    class MobileTouchHandler {
        constructor() {
            this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            if (!this.isMobile) return;

            this.init();
        }

        init() {
            this.setupCloseButton();
            this.setupContainer();
            this.setupScrolling();
            this.preventDefaultBehaviors();
        }

        setupCloseButton() {
            const closeBtn = $('#chatbot-close-btn');
            
            closeBtn.on('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleClose(e);
            });

            // Asegurar que el botón sea clickeable
            closeBtn.css({
                'cursor': 'pointer',
                'touch-action': 'manipulation',
                '-webkit-tap-highlight-color': 'transparent'
            });
        }

        handleClose(e) {
            const container = $('#chatbot-container');
            const launcher = $('#chat-launcher');
            
            container.toggleClass('minimized');
            launcher.toggleClass('hidden');
            
            // Forzar reflow
            container[0].offsetHeight;
        }

        setupContainer() {
            const container = $('#chatbot-container');
            
            container.on('touchmove', (e) => {
                if (!$(e.target).closest('.chatbot-messages').length) {
                    e.preventDefault();
                }
            });
        }

        setupScrolling() {
            const messages = $('.chatbot-messages');
            
            messages.on('touchstart touchmove touchend', (e) => {
                e.stopPropagation();
            });
        }

        preventDefaultBehaviors() {
            document.addEventListener('touchmove', (e) => {
                if (e.target.closest('#chatbot-container')) {
                    if (!e.target.closest('.chatbot-messages')) {
                        e.preventDefault();
                    }
                }
            }, { passive: false });
        }
    }

    // Inicializar cuando el documento esté listo
    $(document).ready(() => {
        window.mobileTouchHandler = new MobileTouchHandler();
    });

})(jQuery); 