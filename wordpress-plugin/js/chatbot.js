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
                if (response.success && response.data.response) {
                    addMessage(response.data.response);
                } else {
                    addMessage('Lo siento, hubo un error en la comunicación. Por favor, intenta de nuevo.');
                }
            },
            error: function() {
                addMessage('Lo siento, hubo un error en la comunicación. Por favor, intenta de nuevo.');
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
    sendButton.on('click', handleSend);
    input.on('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSend();
        }
    });

    // Manejar la visibilidad del chatbot
    function toggleChat() {
        chatbotContainer.toggleClass('minimized');
        chatLauncher.toggleClass('hidden');
        
        if (!chatbotContainer.hasClass('minimized') && isFirstOpen) {
            // Mensaje inicial solo la primera vez que se abre
            addMessage('¡Hola! Soy Juan, tu barista y asesor experto en café. ¿En qué ciudad te encuentras para verificar la disponibilidad de envío gratuito? 😊', false);
            isFirstOpen = false;
        }

        if (!chatbotContainer.hasClass('minimized')) {
            input.focus();
        }
    }

    // Event listeners para abrir/cerrar el chat
    chatLauncher.on('click', toggleChat);
    toggleButton.on('click', toggleChat);

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
}); 