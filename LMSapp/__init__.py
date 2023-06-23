from flask import Flask
from flask_sqlalchemy import SQLAlchemy

# 파일 업로드
from flask_file_upload.file_upload import FileUpload

import config
import pymysql
from flask_wtf.csrf import CSRFProtect  # csrf
file_upload = FileUpload()
csrf = CSRFProtect()
# 전역 변수로 db, migrate 객체를 만든 다음 create_app 함수 안에서 init_app 메서드를 이용해 app에 등록
# db 객체를 create_app 함수 안에서 생성하면 블루프린트와 같은 다른 모듈에서 사용할수 없기 때문에 db, migrate와 같은 객체를 create_app 함수 밖에 생성하고, 해당 객체를 앱에 등록할 때는 create_app 함수에서 init_app 함수를 통해 진행한다.
db = SQLAlchemy()

# declarative 모듈 사용 
# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker
# from sqlalchemy.ext.declarative import declarative_base
# engine = create_engine('mysql+pymysql://purple:wjdgus00@127.0.0.1:3306/LMS?charset=utf8', echo=True)
# Aession = sessionmaker(bind=engine)
# Base = declarative_base(bind=engine)

# 양방향 통신
from flask_socketio import SocketIO, emit
socketio = SocketIO()

# 스케줄러 생성
from apscheduler.schedulers.background import BackgroundScheduler
from pytz import timezone
from datetime import datetime, timedelta

scheduler = BackgroundScheduler(timezone=timezone('Asia/Seoul'))

# 스케줄러에 작업 추가 매일 12시마다 실행 (오후3시 테스트)
@scheduler.scheduled_job('cron', hour='3')
def update_database():
    try:
        pydb = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
        with pydb.cursor() as cursor:
            query= "UPDATE taskban AS A INNER JOIN task AS B ON A.task_id = B.id SET A.done = 0 WHERE B.cycle != 0 OR B.category_id = 11;"
            cursor.execute(query)
        pydb.commit()
    except Exception as e:
        print(f"Error: {e}")
        pydb.rollback()
    finally:
        pydb.close()

def create_app():
    app = Flask(__name__,static_folder="static")
    app.config.from_object(config) # config.py 파일에 작성한 항목을 읽기 위해
    
    # orm
    db.init_app(app)
    csrf.init_app(app)
    file_upload.init_app(app, db)

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

    from .views import common
    app.register_blueprint(common.bp)

    # SocketIO 초기화 및 애플리케이션에 연결
    socketio.init_app(app)

    return app