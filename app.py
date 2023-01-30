from LMSapp import create_app

if __name__ == '__main__':
    create_app().run('0.0.0.0', port=6725, debug=True)