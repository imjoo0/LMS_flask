from os.path import join, dirname, realpath

SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://purple:wjdgus00@127.0.0.1:3306/LMS'

SQLALCHEMY_TRACK_MODIFICATIONS = False

SECRET_KEY = 'asdfasdfasdfqwerty' # 해시값은 임의로 적음

api = 'http://118.131.85.245:23744/'

UPLOAD_FOLDER = join(dirname(realpath(__file__)), "/LMSapp/static/uploads/")
ALLOWED_EXTENSIONS = ["jpg", "png", "mov", "mp4", "mpg","pdf"]
MAX_CONTENT_LENGTH = 1000 * 1024 * 1024  # 1000mb



# MySQL 연결
# (host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
dbinfo = mysql.connector.connect(
    host='127.0.0.1',
    port = '3306',
    user='purple',
    password='wjdgus00',
    database='LMS'
)
