from flask import Flask
from flask_sqlalchemy import SQLAlchemy
# declarative 모듈 사용 
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

import config
from flask_wtf.csrf import CSRFProtect  # csrf

# 전역 변수로 db, migrate 객체를 만든 다음 create_app 함수 안에서 init_app 메서드를 이용해 app에 등록
# db 객체를 create_app 함수 안에서 생성하면 블루프린트와 같은 다른 모듈에서 사용할수 없기 때문에 db, migrate와 같은 객체를 create_app 함수 밖에 생성하고, 해당 객체를 앱에 등록할 때는 create_app 함수에서 init_app 함수를 통해 진행한다.
db = SQLAlchemy()
engine = create_engine('mysql+pymysql://purple:wjdgus00@127.0.0.1:3306/LMS?charset=utf8', echo=True)
Aession = sessionmaker(bind=engine)
Base = declarative_base(bind=engine)

csrf = CSRFProtect()

def create_app():
    app = Flask(__name__)
    app.config.from_object(config) # config.py 파일에 작성한 항목을 읽기 위해
    
    # orm
    db.init_app(app)
    csrf.init_app(app)

    from . import models

    # bp
    from .views import main_views
    app.register_blueprint(main_views.bp)

    from .views import teacher
    app.register_blueprint(teacher.bp)

    from .views import manage
    app.register_blueprint(manage.bp)

    from .views import admin
    app.register_blueprint(admin.bp)

    return app

# flask db init < 데이터베이스초기화 : flask db init 명령은 데이터베이스를 관리하는 초기 파일들을 다음처럼 migrations 디렉터리에 자동으로 생성 ( 명령은 최초 한 번만 수행 )
# 앞으로 모델을 추가하거나 변경할 때는 flask db migrate 명령과 flask db upgrade 명령만 사용
# flask db migrate : 모델을 새로 생성하거나 변경할 때 사용 (실행하면 작업파일이 생성된다.)
# flask db upgrade : 모델의 변경 내용을 실제 데이터베이스에 적용할 때 사용 (위에서 생성된 작업파일을 실행하여 데이터베이스를 변경한다.)


