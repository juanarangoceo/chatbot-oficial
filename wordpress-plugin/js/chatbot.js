jQuery(document).ready(function($) {
    const chatLauncher = $('#chat-launcher');
    const chatbotContainer = $('#chatbot-container');
    const messagesContainer = chatbotContainer.find('.chatbot-messages');
    const input = chatbotContainer.find('input');
    const sendButton = chatbotContainer.find('.chatbot-send');
    const toggleButton = chatbotContainer.find('.chatbot-toggle');
    let chatHistory = [];
    let isFirstOpen = true;
    let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    console.log('Inicializando chatbot...');
    console.log('Configuración del chatbot:', window.chatbotConfig);

    // Función para agregar mensajes al chat
    function addMessage(message, isUser = false) {
        console.log(`Agregando mensaje: ${message} (${isUser ? 'usuario' : 'bot'})`);
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

        if (isMobile) {
            setTimeout(() => {
                messagesContainer.scrollTop(messagesContainer[0].scrollHeight);
            }, 100);
        }
    }

    // Función para enviar mensaje al servidor
    function sendMessage(message) {
        if (!message || message.trim() === '') return;
        
        console.log('Iniciando envío de mensaje:', message);
        
        input.prop('disabled', true);
        sendButton.prop('disabled', true);

        const requestData = {
            action: 'chatbot_message',
            message: message,
            history: chatHistory,
            nonce: window.chatbotConfig.nonce
        };

        console.log('Datos a enviar:', requestData);
        
        // Usar el endpoint de WordPress AJAX
        $.ajax({
            url: window.chatbotConfig.ajaxUrl,
            method: 'POST',
            data: requestData,
            dataType: 'json',
            success: function(response) {
                console.log('Respuesta recibida:', response);
                if (response.success && response.data) {
                    addMessage(response.data.response, false);
                } else {
                    console.error('Error en la respuesta:', response);
                    addMessage('Lo siento, hubo un error en la comunicación. Por favor, intenta de nuevo.');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error en la petición:', error);
                console.error('Estado:', status);
                console.error('XHR:', xhr);
                addMessage('Lo siento, hubo un error en la comunicación. Por favor, intenta de nuevo.');
            },
            complete: function() {
                input.prop('disabled', false);
                sendButton.prop('disabled', false);
                input.focus();
            }
        });
    }

    // Manejar el envío de mensajes
    function handleSend(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        const message = input.val().trim();
        if (message) {
            addMessage(message, true);
            input.val('');
            sendMessage(message);
        }
    }

    // Event listeners
    sendButton.on('click', handleSend);
    
    input.on('keypress', function(e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            handleSend();
        }
    });

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
        }
    }

    chatLauncher.on('click', toggleChat);
    toggleButton.on('click', toggleChat);

    // Manejar el resize de la ventana
    $(window).on('resize', function() {
        if (isMobile && !chatbotContainer.hasClass('minimized')) {
            messagesContainer.scrollTop(messagesContainer[0].scrollHeight);
        }
    });

    // Prevenir que el toque en el contenedor del chat cierre el teclado móvil
    chatbotContainer.on('touchstart', function(e) {
        if (!$(e.target).is(input) && !$(e.target).is(sendButton)) {
            e.preventDefault();
        }
    });

    // Manejar el scroll del contenedor de mensajes
    messagesContainer.on('touchstart', function() {
        messagesContainer.css('overflow-y', 'auto');
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

    chatLauncher.on('click', updateChatState);
    toggleButton.on('click', updateChatState);

    console.log('Chatbot inicializado correctamente');
}); 