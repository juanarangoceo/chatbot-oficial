jQuery(document).ready(function($) {
    console.log('Inicializando chatbot v1.0.9...');
    
    const chatLauncher = $('#chat-launcher');
    const chatbotContainer = $('#chatbot-container');
    const messagesContainer = $('.chatbot-messages');
    const input = $('.chatbot-input input');
    const sendButton = $('.chatbot-send');
    const toggleButton = $('.chatbot-toggle');
    const typingIndicator = $('.typing-indicator');
    let chatHistory = [];
    let isFirstOpen = true;
    let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Función para mostrar el indicador de escritura
    function showTypingIndicator() {
        typingIndicator.css('display', 'flex');
        messagesContainer.scrollTop(messagesContainer[0].scrollHeight);
    }

    // Función para ocultar el indicador de escritura
    function hideTypingIndicator() {
        typingIndicator.css('display', 'none');
    }

    // Función para agregar mensajes al chat
    function addMessage(message, isUser = false) {
        const messageElement = $('<div>')
            .addClass('chatbot-message')
            .addClass(isUser ? 'user' : 'bot')
            .text(message);
        
        hideTypingIndicator();
        messagesContainer.append(messageElement);
        messagesContainer.scrollTop(messagesContainer[0].scrollHeight);
        
        chatHistory.push({
            role: isUser ? 'user' : 'assistant',
            content: message
        });
    }

    // Función para enviar mensaje al servidor
    async function sendMessage(message) {
        if (!message || message.trim() === '') return;
        
        input.prop('disabled', true);
        sendButton.prop('disabled', true);
        showTypingIndicator();

        try {
            const response = await fetch('https://chatbot-oficial.onrender.com/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    history: chatHistory
                })
            });

            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`);
            }

            const data = await response.json();
            if (data && data.response) {
                addMessage(data.response, false);
            } else {
                addMessage('Lo siento, hubo un error en la comunicación. Por favor, intenta de nuevo.');
            }
        } catch (error) {
            console.error('Error en la petición:', error);
            addMessage('Lo siento, hubo un error en la comunicación. Por favor, intenta de nuevo.');
        } finally {
            hideTypingIndicator();
            input.prop('disabled', false);
            sendButton.prop('disabled', false);
            input.val('').focus();
        }
    }

    // Manejar el envío de mensajes
    function handleSend() {
        const message = input.val().trim();
        if (message) {
            addMessage(message, true);
            sendMessage(message);
        }
    }

    // Event listeners para envío de mensajes
    sendButton.on('click', handleSend);
    
    input.on('keypress', function(e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            handleSend();
        }
    });

    // Función para manejar el cierre/apertura del chat
    function toggleChat() {
        chatbotContainer.toggleClass('minimized');
        chatLauncher.toggleClass('hidden');
        
        if (!chatbotContainer.hasClass('minimized')) {
            $('body').addClass('chatbot-open');
            if (isFirstOpen) {
                addMessage('¡Hola! Soy Juan, tu barista y asesor experto en café. ¿En qué ciudad te encuentras para verificar la disponibilidad de envío gratuito? 😊', false);
                isFirstOpen = false;
            }
            input.focus();
        } else {
            $('body').removeClass('chatbot-open');
        }
    }

    // Event listeners para toggle
    toggleButton.on('click touchstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleChat();
    });

    chatLauncher.on('click touchstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleChat();
    });

    // Ajustar altura en dispositivos móviles
    function adjustMobileHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    window.addEventListener('resize', adjustMobileHeight);
    window.addEventListener('orientationchange', adjustMobileHeight);
    adjustMobileHeight();

    // Guardar estado del chat en localStorage
    try {
        const chatState = localStorage.getItem('chatbotState');
        if (chatState === 'open' && document.referrer === window.location.href) {
            toggleChat();
        }
    } catch (error) {
        console.warn('No se pudo acceder a localStorage:', error);
    }

    // Actualizar estado en localStorage
    function updateChatState() {
        try {
            const state = chatbotContainer.hasClass('minimized') ? 'closed' : 'open';
            localStorage.setItem('chatbotState', state);
        } catch (error) {
            console.warn('No se pudo guardar en localStorage:', error);
        }
    }

    chatLauncher.on('click', updateChatState);
    toggleButton.on('click', updateChatState);

    console.log('Chatbot inicializado correctamente');
}); 