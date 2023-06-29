from LMSapp import create_app, socketio
from flask_socketio import emit
from flask import Flask
from flask_cors import CORS
import eventlet 
eventlet.monkey_patch()


app = Flask(__name__)
CORS(app)
app.app_context().push()
app.config.from_object('config')
app.app_context().push()

@app.route('/new_question/<int:q_id>')
def new_question(q_id):
    # Emit event to connected clients via socketio
    socketio.emit('new_question', {'message': 'New question registered', 'q_id': q_id}, broadcast=True, namespace='/question')
    return 'New question emitted'
    
if __name__ == '__main__':
    app = create_app()
    socketio.init_app(app, async_mode='eventlet')
    socketio.run(app, host='0.0.0.0', port='2305', debug=True)

