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
            cur.execute("select staff.id, staff.name as eng_name, staff.name_kor as name, staff.staff_id as user_id,SHA2(staff.staff_id, 256) as user_pw, staff.mobileno,staff.email,staff.department as category from staff where staff.id = 366;")
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

        sql = "insert into user(id,user_id,user_pw,name,eng_name,mobileno,email,category)" \
              " values (%(id)s, %(user_id)s, %(user_pw)s,%(name)s, %(eng_name)s, %(mobileno)s, %(email)s, %(category)s);"

        cur.executemany(sql, data_list)

        db.commit()
except:
    print(traceback.format_exc())
    print("fail 2")

finally:
    db.close()