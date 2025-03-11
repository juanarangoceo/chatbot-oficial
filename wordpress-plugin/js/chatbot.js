jQuery(document).ready(function($) {
    console.log('Inicializando chatbot v1.0.5...');
    
    const chatLauncher = $('#chat-launcher');
    const chatbotContainer = $('#chatbot-container');
    const messagesContainer = $('.chatbot-messages');
    const input = $('.chatbot-input input');
    const sendButton = $('.chatbot-send');
    const toggleButton = $('#chatbot-close-btn');
    let chatHistory = [];
    let isFirstOpen = true;
    let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

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
    async function sendMessage(message) {
        if (!message || message.trim() === '') return;
        
        console.log('Enviando mensaje al servidor:', message);
        
        input.prop('disabled', true);
        sendButton.prop('disabled', true);

        try {
            const requestData = {
                message: message,
                history: chatHistory
            };

            console.log('Datos a enviar:', requestData);

            const response = await fetch('https://chatbot-oficial.onrender.com/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            console.log('Estado de la respuesta:', response.status);

            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`);
            }

            const data = await response.json();
            console.log('Datos recibidos:', data);

            if (data && data.response) {
                addMessage(data.response, false);
            } else {
                console.error('Respuesta inválida:', data);
                addMessage('Lo siento, hubo un error en la comunicación. Por favor, intenta de nuevo.');
            }
        } catch (error) {
            console.error('Error en la petición:', error);
            addMessage('Lo siento, hubo un error en la comunicación. Por favor, intenta de nuevo.');
        } finally {
            input.prop('disabled', false);
            sendButton.prop('disabled', false);
            input.focus();
        }
    }

    // Manejar el envío de mensajes
    function handleSend(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        const message = input.val().trim();
        if (message) {
            console.log('Mensaje a enviar:', message);
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

    // Función para manejar el cierre/apertura del chat
    function toggleChat(e) {
        console.log('Toggle chat llamado');
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

    // Event listeners para el botón de cerrar en desktop
    if (!isMobile) {
        toggleButton.on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleChat();
        });

        chatLauncher.on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleChat();
        });
    }

    // Prevenir comportamiento por defecto en móviles
    if (isMobile) {
        toggleButton.on('touchmove', function(e) {
            e.preventDefault();
            e.stopPropagation();
        });

        chatbotContainer.on('touchmove', function(e) {
            if (!$(e.target).closest('.chatbot-messages').length) {
                e.preventDefault();
            }
        });
    }

    // Mejorar el scroll en móviles
    messagesContainer.on('touchstart', function(e) {
        e.stopPropagation();
    });

    // Manejar el resize de la ventana
    $(window).on('resize', function() {
        if (isMobile && !chatbotContainer.hasClass('minimized')) {
            messagesContainer.scrollTop(messagesContainer[0].scrollHeight);
        }
    });

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

    // Ajustar altura en dispositivos móviles
    function adjustMobileHeight() {
        if (isMobile) {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
            
            if (!chatbotContainer.hasClass('minimized')) {
                setTimeout(() => {
                    messagesContainer.scrollTop(messagesContainer[0].scrollHeight);
                }, 100);
            }
        }
    }

    // Event listeners para ajuste de altura
    $(window).on('resize orientationchange', adjustMobileHeight);
    adjustMobileHeight();

    // Inicialización adicional para móviles
    if (isMobile) {
        $('body').css('overflow', 'hidden');
        chatbotContainer.on('touchstart', function(e) {
            if (!$(e.target).closest('.chatbot-messages, .chatbot-input, #chatbot-close-btn').length) {
                e.preventDefault();
            }
        });
    }

    console.log('Chatbot inicializado correctamente');
}); 