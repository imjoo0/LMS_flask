from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
import mysql.connector

# MySQL 연결
# (host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
db = mysql.connector.connect(
    host='127.0.0.1',
    port = '3306',
    user='purple',
    password='wjdgus00',
    database='LMS'
)

# 스케줄러 생성
scheduler = BackgroundScheduler()

# 스케줄러에 작업 추가
@scheduler.scheduled_job('cron', hour='0')
def update_database():
    today = datetime.today().strftime('%Y-%m-%d')
    # 데이터베이스 업데이트 작업 수행
    cursor = db.cursor()
    query= "UPDATE taskban A LEFT JOIN task B ON A.task_id= B.id SET A.done = 0 WHERE date_format(A.created_at, '%Y-%m-%d') < date_format(%s,'%Y-%m-%d') AND B.cycle < 6 AND A.done = 1"
    cursor.execute(query, (today,))
    db.commit()
    cursor.close()