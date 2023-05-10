from LMSapp import create_app,scheduler

if __name__ == '__main__':
    scheduler.start()
    create_app().run('0.0.0.0', port=6725, debug=True)