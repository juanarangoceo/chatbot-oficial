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

    console.log('Dispositivo móvil:', isMobile);

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
        
        console.log('Enviando mensaje:', message);
        console.log('Chat history:', chatHistory);
        
        input.prop('disabled', true);
        sendButton.prop('disabled', true);

        const requestData = {
            message: message,
            history: chatHistory
        };

        console.log('Datos a enviar:', requestData);
        
        fetch('https://chatbot-open-ai.onrender.com/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => {
            console.log('Respuesta recibida del servidor:', response);
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(data => {
            console.log('Datos recibidos:', data);
            if (data && data.response) {
                addMessage(data.response, false);
            } else {
                console.error('Respuesta inválida:', data);
                addMessage('Lo siento, hubo un error en la comunicación. Por favor, intenta de nuevo.');
            }
        })
        .catch(error => {
            console.error('Error en la petición:', error);
            addMessage('Lo siento, hubo un error en la comunicación. Por favor, intenta de nuevo.');
        })
        .finally(() => {
            console.log('Petición finalizada');
            input.prop('disabled', false);
            sendButton.prop('disabled', false);
            if (isMobile) {
                input.focus();
                setTimeout(() => {
                    messagesContainer.scrollTop(messagesContainer[0].scrollHeight);
                }, 100);
            } else {
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
        console.log('Manejando envío de mensaje:', message);
        
        if (message) {
            addMessage(message, true);
            input.val('');
            sendMessage(message);
        }
    }

    // Event listeners para enviar mensajes
    sendButton.on('click touchstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
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
            
            // En móviles, ajustar el scroll y el body
            if (isMobile) {
                $('body').addClass('chatbot-open');
                setTimeout(() => {
                    messagesContainer.scrollTop(messagesContainer[0].scrollHeight);
                    input.focus();
                }, 300);
            } else {
                input.focus();
            }
        } else {
            $('body').removeClass('chatbot-open');
        }
    }

    // Event listeners para abrir/cerrar el chat
    chatLauncher.on('click touchstart', function(e) {
        e.preventDefault();
        toggleChat(e);
    });

    toggleButton.on('click touchstart', function(e) {
        e.preventDefault();
        toggleChat(e);
    });

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

    chatLauncher.on('click touchstart', updateChatState);
    toggleButton.on('click touchstart', updateChatState);

    console.log('Chatbot inicializado correctamente');
}); 