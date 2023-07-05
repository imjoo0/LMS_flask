from os.path import join, dirname, realpath

SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://purple:wjdgus00@127.0.0.1:3306/LMS'

SQLALCHEMY_BINDS = {
    'graph_db': 'mysql+pymysql://jung:wjdgus00@192.168.6.3:3307/purple_learning_counseling'
}
SQLALCHEMY_TRACK_MODIFICATIONS = False

SECRET_KEY = 'asdfasdfasdfqwerty' # 해시값은 임의로 적음

api = 'http://118.131.85.245:23744/'

UPLOAD_FOLDER = join(dirname(realpath(__file__)), "/LMSapp/static/uploads/")
ALLOWED_EXTENSIONS = ["jpg", "png", "mov", "mp4", "mpg","pdf"]
MAX_CONTENT_LENGTH = 1000 * 1024 * 1024  # 1000mb
DEBUG = True

# config.py

class Config:
    DB_HOST = '127.0.0.1'
    DB_USER = 'purple'
    DB_PASSWORD = 'wjdgus00'
    DB_PORT = 3306
    DB_DATABASE = 'LMS'
