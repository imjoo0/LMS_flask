from LMSapp import create_app,scheduler,socketio

if __name__ == '__main__':
    scheduler.start()
    create_app().run(host='0.0.0.0',port='2305',debug=True)

