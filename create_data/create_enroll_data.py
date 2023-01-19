import datetime
import traceback
import pymysql
from sshtunnel import SSHTunnelForwarder


data_list = []
with SSHTunnelForwarder(
        ('15.164.36.206'),
        ssh_username="ec2-user",
        ssh_pkey="D:/privatekey/purple_academy_privkey.pem",
        remote_bind_address=('purple-lms-mariadb-1.cdpnol1tlujr.ap-northeast-2.rds.amazonaws.com', 3306)
) as tunnel:
    db = pymysql.connect(
        host='127.0.0.1', user="readonly",
        password="purpledbreadonly12!@", port=tunnel.local_bind_port, database='purple-lms',
        cursorclass=pymysql.cursors.DictCursor,
    )
    try:
        with db.cursor() as cur:
            # semester 계산기 
            # cur.execute("select class.name_numeric") 
            cur.execute("select distinct enroll.student_id as 'student', teacher_allocation.class_id as 'ban', teacher_allocation.teacher_id as 'teacher' from enroll left join teacher_allocation on enroll.class_id = teacher_allocation.class_id;")
            data_list = cur.fetchall().copy()
                
    except:
        print("fail 1")
    finally:
        db.close()

db = pymysql.connect(
        host='purpleacademy.net', user="purple",
        password="wjdgus00", port=3306, database='LMS',
        cursorclass=pymysql.cursors.DictCursor,
    )

try:
    with db.cursor() as cur:
        print('데이터 저장 진행 중 ')

        sql = "insert into enroll(ban, student,teacher)" \
              " values (%(ban)s, %(student)s, %(teacher)s);"

        cur.executemany(sql, data_list)

        db.commit()
except:
    print(traceback.format_exc())
    print("fail 2")

finally:
    db.close()