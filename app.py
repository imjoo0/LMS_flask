from LMSapp import create_app,scheduler,socketio

if __name__ == '__main__':
    scheduler.start()
    app = create_app()
    # socketio.run(app,host='0.0.0.0', debug=True)
    socketio.run(app,host='0.0.0.0',port=6725, debug=True)

