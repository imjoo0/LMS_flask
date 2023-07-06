from LMSapp import create_app, scheduler, socketio

if __name__ == '__main__':
    app = create_app()
    socketio.init_app(app, async_mode='eventlet')  # asyncio를 사용하기 위해 async_mode를 'eventlet_asyncio'로 설정
    # socketio.init_app(app, async_mode='eventlet', cors_allowed_origins='*')  # asyncio를 사용하기 위해 async_mode를 'eventlet_asyncio'로 설정
    scheduler.start()
    socketio.run(app, host='0.0.0.0', port='2305', debug=True)
