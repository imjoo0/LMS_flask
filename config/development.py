from config.default import *

SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://purple:wjdgus00@127.0.0.1:3306/LMS'
SQLALCHEMY_TRACK_MODIFICATIONS = False
SECRET_KEY = "asdfasdfasdfqwerty"

api = 'http://118.131.85.245:23744/'

UPLOAD_FOLDER = join(dirname(realpath(__file__)), "/LMSapp/static/uploads/")
ALLOWED_EXTENSIONS = ["jpg", "png", "mov", "mp4", "mpg","pdf"]
MAX_CONTENT_LENGTH = 1000 * 1024 * 1024  # 1000mb

PORT = 2305