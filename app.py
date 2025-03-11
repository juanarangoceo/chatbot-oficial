from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
import openai
from dotenv import load_dotenv
import os
import requests
from woocommerce import API

# Cargar variables de entorno
load_dotenv()

app = Flask(__name__)
# Configuración más específica de CORS
CORS(app, resources={
    r"/chat": {
        "origins": "*",
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

openai.api_key = os.getenv('OPENAI_API_KEY')

# Configuración de WooCommerce
wcapi = API(
    url="https://sandybrown-caribou-946075.hostingersite.com",
    consumer_key=os.getenv('WC_CONSUMER_KEY'),
    consumer_secret=os.getenv('WC_CONSUMER_SECRET'),
    version="wc/v3",
    timeout=30
)

def create_woocommerce_order(customer_data):
    """
    Crear un pedido en WooCommerce con los datos del cliente
    """
    try:
        print(f"Intentando crear pedido con datos: {customer_data}")
        
        # Crear el pedido directamente sin crear cliente
        order_data = {
            "payment_method": "cod",
            "payment_method_title": "Pago contra entrega",
            "set_paid": False,
            "billing": {
                "first_name": customer_data['nombre'],
                "last_name": customer_data['apellido'],
                "address_1": customer_data['direccion'],
                "city": customer_data['ciudad'],
                "state": customer_data['departamento'],
                "country": "CO",
                "email": customer_data['email'],
                "phone": customer_data['telefono']
            },
            "shipping": {
                "first_name": customer_data['nombre'],
                "last_name": customer_data['apellido'],
                "address_1": customer_data['direccion'],
                "city": customer_data['ciudad'],
                "state": customer_data['departamento'],
                "country": "CO"
            },
            "line_items": [
                {
                    "product_id": 112,
                    "quantity": 1
                }
            ],
            "shipping_lines": [
                {
                    "method_id": "free_shipping",
                    "method_title": "Envío Gratis",
                    "total": "0.00"
                }
            ]
        }
        
        print(f"Datos del pedido a crear: {order_data}")
        
        # Crear el pedido en WooCommerce
        order = wcapi.post("orders", order_data).json()
        print(f"Respuesta creación pedido: {order}")
        
        if 'id' in order:
            print(f"Pedido creado exitosamente con ID: {order['id']}")
            return order['id']
        else:
            print(f"Error al crear pedido: {order}")
            return None

    except Exception as e:
        print(f"Error creando pedido en WooCommerce: {str(e)}")
        return None

def extract_customer_data(messages):
    """
    Extraer datos del cliente del historial de mensajes
    """
    customer_data = {
        'nombre': None,
        'apellido': None,
        'email': None,
        'telefono': None,
        'departamento': None,
        'ciudad': None,
        'direccion': None
    }
    
    # Buscar el último mensaje que contiene los datos del cliente
    for message in reversed(messages):
        if message['role'] == 'user':
            content = message['content'].strip()
            
            # Intentar formato con comas
            if ',' in content:
                parts = [part.strip() for part in content.split(',')]
                if len(parts) >= 7:  # Asegurarse de que tenemos todos los datos
                    customer_data['nombre'] = parts[0]
                    customer_data['apellido'] = parts[1]
                    customer_data['email'] = parts[2]
                    customer_data['telefono'] = parts[3]
                    customer_data['departamento'] = parts[4]
                    customer_data['ciudad'] = parts[5]
                    customer_data['direccion'] = parts[6]
                    break

    print(f"Datos extraídos del cliente: {customer_data}")
    
    # Verificar que todos los datos estén presentes y no sean None
    if all(customer_data.values()):
        return customer_data
    return None

# HTML template para la página de prueba
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Chatbot de Ventas - Máquina de Café</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        #chat-container { 
            max-width: 600px; 
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        #messages { 
            height: 400px; 
            overflow-y: auto; 
            padding: 20px;
            border-bottom: 1px solid #eee;
        }
        .message { 
            margin-bottom: 15px; 
            padding: 10px 15px;
            border-radius: 15px;
            max-width: 80%;
            word-wrap: break-word;
        }
        .user { 
            background-color: #e9ecef; 
            margin-left: auto;
            color: #333;
        }
        .bot { 
            background-color: #007bff; 
            color: white;
        }
        #input-container { 
            display: flex; 
            gap: 10px;
            padding: 20px;
        }
        #message-input { 
            flex-grow: 1; 
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
        }
        button {
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>
    <div id="chat-container">
        <div id="messages"></div>
        <div id="input-container">
            <input type="text" id="message-input" placeholder="Escribe tu mensaje aquí...">
            <button onclick="sendMessage()">Enviar</button>
        </div>
    </div>

    <script>
        const messagesDiv = document.getElementById('messages');
        const inputField = document.getElementById('message-input');
        let chatHistory = [];

        function addMessage(message, isUser) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
            messageDiv.textContent = message;
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
            
            chatHistory.push({
                role: isUser ? 'user' : 'assistant',
                content: message
            });
        }

        function sendMessage() {
            const message = inputField.value.trim();
            if (!message) return;

            addMessage(message, true);
            inputField.value = '';

            fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    history: chatHistory
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    addMessage(data.response, false);
                } else {
                    addMessage('Error: ' + data.error, false);
                }
            })
            .catch(error => {
                addMessage('Error de conexión: ' + error, false);
            });
        }

        inputField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        // Mensaje inicial
        addMessage('¡Hola! Soy Juan, tu barista y asesor experto en café. ¿En qué ciudad te encuentras para verificar la disponibilidad de envío gratuito? 😊', false);
    </script>
</body>
</html>
"""

# Configuración del prompt para ventas
SISTEMA_PROMPT = """Eres Juan, un barista profesional y asesor experto en café, especializado en la Máquina para Café Automática RAf.

PERFIL Y COMPORTAMIENTO:
- Tu nombre es Juan y debes presentarte siempre como tal
- Eres apasionado por el café y tienes conocimiento profundo en técnicas y equipos
- Tus respuestas deben ser claras y breves (máximo 25 palabras)
- Mantienes un tono profesional pero cercano y amigable
- Guías al cliente hacia la compra después de la tercera interacción

INFORMACIÓN DEL PRODUCTO:
Máquina para Café Automática RAf
- Precio: $420,000 con envío GRATIS y pago contra entrega
- Garantía: 3 meses
- Especificaciones técnicas:
  • Potencia: 850W
  • Voltaje: 120V
  • Presión: 15 bar
  • Capacidad: 1.6 litros
  • Pantalla táctil
  • Funciones: espresso, cappuccino, agua caliente y vapor
  • Material: Aluminio y acero inoxidable
  • Incluye: Boquilla de espuma desmontable, bandeja goteo extraíble

POLÍTICA DE ENVÍOS:
- Envío gratis a toda Colombia (excepto Amazonas, Mitú, Guainía, Putumayo, Chocó, San Andrés)
- Ciudades principales: 1-4 días hábiles
- Poblaciones alejadas: 5-8 días hábiles
- Envíos a oficina requieren 50% de pago anticipado
- Centro de distribución en Cali (sin servicio de mostrador)

PROTOCOLO DE INTERACCIÓN:
1. Primera interacción:
   - Saluda y preséntate como Juan
   - Confirma si la ciudad aplica para envío gratis
   - Pregunta si desea conocer precios

2. Segunda interacción:
   - Presenta el precio: "$420,000 con envío GRATIS! 🚚 Pagas Al Recibir"
   - Pregunta sobre el uso que le dará a la máquina

3. Tercera interacción:
   - Explica beneficios técnicos según el uso deseado
   - Pregunta si desea realizar el pedido con pago contra entrega

4. Cuarta interacción (si decide comprar):
   - Confirma la buena elección
   - Solicita datos en este formato exacto:
     Por favor, proporciona los siguientes datos:
     1. Nombre: 😊
     2. Apellido: 😊
     3. Email: 📧
     4. Teléfono: 📞
     5. Departamento: 🌄
     6. Ciudad: 🏙
     7. Dirección: 🏡

5. Quinta interacción:
   - Verifica que todos los datos estén completos
   - Si falta algún dato, solicítalo nuevamente
   - Si están completos, confirma con "¡Todo confirmado! 🎉"

MANEJO DE OBJECIONES:
- Precio: Enfatizar calidad, durabilidad y ahorro a largo plazo
- Comparaciones: Destacar presión de 15 bares y versatilidad
- Marca: Mencionar que es RAf con 3 meses de garantía
- Tienda física: Informar que el centro de distribución está en Cali sin servicio de mostrador"""

@app.route('/')
def home():
    return render_template_string(HTML_TEMPLATE)

@app.route('/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response

    try:
        data = request.json
        user_message = data.get('message', '')
        chat_history = data.get('history', [])

        print(f"Mensaje recibido: {user_message}")
        print(f"Historial: {chat_history}")

        # Verificar si es una confirmación de pedido
        last_bot_message = None
        for msg in reversed(chat_history):
            if msg['role'] == 'assistant':
                last_bot_message = msg['content']
                break

        # Si el último mensaje del bot pidió los datos y el usuario los proporcionó
        if last_bot_message and "proporciona los siguientes datos" in last_bot_message:
            # Extraer datos del cliente
            customer_data = extract_customer_data(chat_history)
            
            # Verificar si tenemos todos los datos necesarios
            if customer_data:
                # Crear pedido en WooCommerce
                order_id = create_woocommerce_order(customer_data)
                if order_id:
                    confirmation_message = f"¡Todo confirmado! 🎉 Tu pedido ha sido registrado con éxito. En breve recibirás tu Máquina para Café Automática RAf en {customer_data['ciudad']}. ¡Disfrutarás de excelentes espressos! ¿Hay algo más en lo que pueda ayudarte?"
                    return jsonify({
                        "response": confirmation_message,
                        "status": "success"
                    })
                else:
                    error_message = "Lo siento, hubo un problema al procesar tu pedido. Por favor, intenta nuevamente o contáctanos directamente."
                    return jsonify({
                        "response": error_message,
                        "status": "success"
                    })

        # Continuar con el flujo normal del chat
        messages = [
            {"role": "system", "content": SISTEMA_PROMPT}
        ]

        for msg in chat_history:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })

        messages.append({
            "role": "user",
            "content": user_message
        })

        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )

        bot_response = response.choices[0].message['content']
        print(f"Respuesta del bot: {bot_response}")

        return jsonify({
            "response": bot_response,
            "status": "success"
        })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port) 