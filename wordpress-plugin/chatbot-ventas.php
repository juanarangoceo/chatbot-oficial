<?php
/*
Plugin Name: Juan - Chatbot Barista
Description: Chatbot especializado en ventas de máquinas de café con OpenAI
Version: 1.0
Author: Juan Arango
Plugin URI: https://chatbot-open-ai.onrender.com
*/

// Prevenir acceso directo al archivo
if (!defined('ABSPATH')) {
    exit;
}

// Definir la URL del servidor del chatbot
define('CHATBOT_SERVER_URL', 'https://chatbot-open-ai.onrender.com/chat');

// Agregar menú de administración
function chatbot_ventas_admin_menu() {
    add_menu_page(
        'Configuración del Chatbot',  // Título de la página
        'Juan Chatbot',               // Título del menú
        'manage_options',             // Capacidad requerida
        'chatbot-ventas',            // Slug del menú
        'chatbot_ventas_admin_page',  // Función que muestra la página
        'dashicons-format-chat',      // Icono
        30                            // Posición en el menú
    );
}
add_action('admin_menu', 'chatbot_ventas_admin_menu');

// Página de administración
function chatbot_ventas_admin_page() {
    if (isset($_POST['chatbot_server_url'])) {
        update_option('chatbot_server_url', sanitize_text_field($_POST['chatbot_server_url']));
        echo '<div class="notice notice-success"><p>Configuración actualizada.</p></div>';
    }
    $server_url = get_option('chatbot_server_url', CHATBOT_SERVER_URL);
    ?>
    <div class="wrap">
        <h1>Configuración del Chatbot de Ventas</h1>
        <form method="post" action="">
            <table class="form-table">
                <tr>
                    <th scope="row">URL del Servidor</th>
                    <td>
                        <input type="text" name="chatbot_server_url" value="<?php echo esc_attr($server_url); ?>" class="regular-text">
                        <p class="description">Ejemplo: https://tu-chatbot.onrender.com/chat</p>
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
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
    <!-- Botón launcher del chatbot -->
    <div class="chat-launcher" id="chat-launcher">
        <svg class="chat-launcher-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" fill="currentColor"/>
            <path d="M6 12h12v2H6zm0-3h12v2H6zm0-3h12v2H6z" fill="currentColor"/>
        </svg>
    </div>

    <!-- Contenedor principal del chatbot -->
    <div id="chatbot-container" class="chatbot-container minimized">
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
    
    // Obtener la URL del servidor configurada
    $server_url = get_option('chatbot_server_url', CHATBOT_SERVER_URL);
    
    // Configurar la solicitud al servidor del chatbot
    $response = wp_remote_post($server_url, array(
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