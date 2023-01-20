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
            cur.execute("select enroll.class_id as class_id, enroll.student_id as student_id, teacher_allocation.teacher_id as teacher_id from enroll left join class on class.id = enroll.class_id left join teacher_allocation on teacher_allocation.class_id = enroll.class_id where class.is_regular = 0 and class.is_ended=0 and class.name not like '%Test%' and class.name not like '%테스트%';")
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

        sql = "insert into enroll(ban_id, student_id,teacher_id)" \
              " values (%(class_id)s, %(student_id)s, %(teacher_id)s);"

        cur.executemany(sql, data_list)

        db.commit()
except:
    print(traceback.format_exc())
    print("fail 2")

finally:
    db.close()