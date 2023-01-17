# import os

# BASE_DIR = os.path.dirname(__file__)
# SQLALCHEMY_DATABASE_URI = 'sqlite:///{}'.format(os.path.join(BASE_DIR, 'pybo.db'))
SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://purple:wjdgus00@purpleacademy.net:3306/LMS'

SQLALCHEMY_TRACK_MODIFICATIONS = False

SECRET_KEY = 'asdfasdfasdfqwerty' # 해시값은 임의로 적음