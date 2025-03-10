jQuery(document).ready(function($) {
    const chatbotContainer = $('#chatbot-container');
    const messagesContainer = chatbotContainer.find('.chatbot-messages');
    const input = chatbotContainer.find('input');
    const sendButton = chatbotContainer.find('.chatbot-send');
    const toggleButton = chatbotContainer.find('.chatbot-toggle');
    let chatHistory = [];

    // Función para agregar mensajes al chat
    function addMessage(message, isUser = false) {
        const messageElement = $('<div>')
            .addClass('chatbot-message')
            .addClass(isUser ? 'user' : 'bot')
            .text(message);
        
        messagesContainer.append(messageElement);
        messagesContainer.scrollTop(messagesContainer[0].scrollHeight);
        
        // Actualizar historial del chat
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

    // Event listeners
    sendButton.on('click', handleSend);
    input.on('keypress', function(e) {
        if (e.which === 13) {
            handleSend();
        }
    });

    // Toggle chatbot visibility
    toggleButton.on('click', function() {
        chatbotContainer.toggleClass('minimized');
    });

    // Mensaje inicial
    addMessage('¡Hola! Soy Juan, tu barista y asesor experto en café. ¿En qué ciudad te encuentras para verificar la disponibilidad de envío gratuito? 😊');
}); 