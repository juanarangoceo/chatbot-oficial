jQuery(document).ready(function($) {
    const chatLauncher = $('#chat-launcher');
    const chatbotContainer = $('#chatbot-container');
    const messagesContainer = chatbotContainer.find('.chatbot-messages');
    const input = chatbotContainer.find('input');
    const sendButton = chatbotContainer.find('.chatbot-send');
    const toggleButton = chatbotContainer.find('.chatbot-toggle');
    let chatHistory = [];
    let isFirstOpen = true;

    // Función para agregar mensajes al chat
    function addMessage(message, isUser = false) {
        const messageElement = $('<div>')
            .addClass('chatbot-message')
            .addClass(isUser ? 'user' : 'bot')
            .text(message);
        
        messagesContainer.append(messageElement);
        messagesContainer.scrollTop(messagesContainer[0].scrollHeight);
        
        chatHistory.push({
            role: isUser ? 'user' : 'assistant',
            content: message
        });
    }

    // Función para enviar mensaje al servidor
    function sendMessage(message) {
        if (!message || message.trim() === '') return;
        
        console.log('Enviando mensaje:', message);
        console.log('Chat history:', chatHistory);
        
        // Deshabilitar el botón de envío y el input mientras se procesa
        sendButton.prop('disabled', true);
        input.prop('disabled', true);
        
        $.ajax({
            url: chatbotAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'chatbot_message',
                nonce: chatbotAjax.nonce,
                message: message,
                history: chatHistory
            },
            success: function(response) {
                console.log('Respuesta recibida:', response);
                if (response.success && response.data && response.data.response) {
                    addMessage(response.data.response);
                } else {
                    console.error('Error en la respuesta:', response);
                    addMessage('Lo siento, hubo un error en la comunicación. Por favor, intenta de nuevo.');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error en la petición:', {xhr, status, error});
                addMessage('Lo siento, hubo un error en la comunicación. Por favor, intenta de nuevo.');
            },
            complete: function() {
                // Re-habilitar el botón de envío y el input
                sendButton.prop('disabled', false);
                input.prop('disabled', false);
                input.focus();
            }
        });
    }

    // Manejar el envío de mensajes
    function handleSend() {
        const message = input.val().trim();
        if (message) {
            addMessage(message, true);
            input.val('');
            sendMessage(message);
        }
    }

    // Event listeners para enviar mensajes
    sendButton.on('click touchstart', function(e) {
        e.preventDefault();
        handleSend();
    });

    input.on('keypress', function(e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            handleSend();
        }
    });

    // Manejar la visibilidad del chatbot
    function toggleChat(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        chatbotContainer.toggleClass('minimized');
        chatLauncher.toggleClass('hidden');
        
        if (!chatbotContainer.hasClass('minimized')) {
            if (isFirstOpen) {
                addMessage('¡Hola! Soy Juan, tu barista y asesor experto en café. ¿En qué ciudad te encuentras para verificar la disponibilidad de envío gratuito? 😊', false);
                isFirstOpen = false;
            }
            input.focus();
            
            // Ajustar la posición del scroll en móviles
            if (window.innerWidth <= 480) {
                setTimeout(function() {
                    window.scrollTo(0, document.body.scrollHeight);
                }, 300);
            }
        }
    }

    // Event listeners para abrir/cerrar el chat
    chatLauncher.on('click touchstart', function(e) {
        e.preventDefault();
        toggleChat(e);
        updateChatState();
    });

    toggleButton.on('click touchstart', function(e) {
        e.preventDefault();
        toggleChat(e);
        updateChatState();
    });

    // Prevenir que el toque en el contenedor del chat cierre el teclado móvil
    chatbotContainer.on('touchstart', function(e) {
        if (!$(e.target).is(input) && !$(e.target).is(sendButton)) {
            e.preventDefault();
        }
    });

    // Ajustar el tamaño en orientación móvil
    $(window).on('resize orientationchange', function() {
        if (!chatbotContainer.hasClass('minimized')) {
            if (window.innerWidth <= 480) {
                chatbotContainer.css({
                    'height': window.innerHeight + 'px',
                    'max-height': window.innerHeight + 'px'
                });
            } else {
                chatbotContainer.css({
                    'height': '',
                    'max-height': ''
                });
            }
        }
    });

    // Guardar estado del chat en localStorage
    const chatState = localStorage.getItem('chatbotState');
    if (chatState === 'open') {
        toggleChat();
    }

    // Actualizar estado en localStorage
    function updateChatState() {
        const state = chatbotContainer.hasClass('minimized') ? 'closed' : 'open';
        localStorage.setItem('chatbotState', state);
    }
}); 