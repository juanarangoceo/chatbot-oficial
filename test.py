from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    return '<h1>¡Hola! El servidor está funcionando.</h1>'

if __name__ == '__main__':
    print("Iniciando servidor en http://localhost:8080")
    app.run(host='localhost', port=8080, debug=True) 