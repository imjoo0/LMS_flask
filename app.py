from LMSapp import create_app,scheduler,config

if __name__ == '__main__':
    scheduler.start()
    create_app().run('0.0.0.0', port=config.PORT, debug=True)
