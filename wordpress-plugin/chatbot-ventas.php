<?php
/*
Plugin Name: Chatbot de Ventas
Description: Integración de chatbot de ventas con OpenAI
Version: 1.0
Author: Tu Nombre
*/

// Prevenir acceso directo al archivo
if (!defined('ABSPATH')) {
    exit;
}

// Agregar el script y estilos del chatbot
function chatbot_ventas_enqueue_scripts() {
    wp_enqueue_style('chatbot-styles', plugins_url('css/chatbot.css', __FILE__));
    wp_enqueue_script('chatbot-script', plugins_url('js/chatbot.js', __FILE__), array('jquery'), '1.0', true);
    wp_localize_script('chatbot-script', 'chatbotAjax', array(
        'ajaxurl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('chatbot_nonce')
    ));
}
add_action('wp_enqueue_scripts', 'chatbot_ventas_enqueue_scripts');

// Agregar el contenedor del chatbot al footer
function chatbot_ventas_add_container() {
    ?>
    <div id="chatbot-container" class="chatbot-container">
        <div class="chatbot-header">
            <h3>Juan - Tu Barista Virtual</h3>
            <button class="chatbot-toggle">×</button>
        </div>
        <div class="chatbot-messages"></div>
        <div class="chatbot-input">
            <input type="text" placeholder="Escribe tu mensaje aquí...">
            <button class="chatbot-send">Enviar</button>
        </div>
    </div>
    <?php
}
add_action('wp_footer', 'chatbot_ventas_add_container');

// Manejar las solicitudes AJAX
function chatbot_ventas_handle_message() {
    check_ajax_referer('chatbot_nonce', 'nonce');
    
    $message = sanitize_text_field($_POST['message']);
    $chat_history = isset($_POST['history']) ? $_POST['history'] : array();
    
    // Configurar la solicitud al servidor del chatbot
    $response = wp_remote_post('http://localhost:5000/chat', array(
        'body' => json_encode(array(
            'message' => $message,
            'history' => $chat_history
        )),
        'headers' => array(
            'Content-Type' => 'application/json'
        )
    ));
    
    if (is_wp_error($response)) {
        wp_send_json_error('Error en la comunicación con el chatbot');
    }
    
    $body = wp_remote_retrieve_body($response);
    wp_send_json_success(json_decode($body));
}
add_action('wp_ajax_chatbot_message', 'chatbot_ventas_handle_message');
add_action('wp_ajax_nopriv_chatbot_message', 'chatbot_ventas_handle_message'); 