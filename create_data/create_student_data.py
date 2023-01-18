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
            cur.execute("select student.id as 'register_no', student.register_no as 'original', student.first_name as 'name', student.mobileno as 'mobileno', parent.name as 'pname', parent.mobileno as 'pmobileno', student.created_at as 'register_date',  A.pack_code as 'reco_book_code' , A.package_date as 'reco_book_date' from student left join (select register_no, pack_code, max(package_date) as 'package_date' from book_package_history group by register_no) A on student.register_no = A.register_no left join parent on  parent.id = student.parent_id;")
            data_list = cur.fetchall().copy()
            for i in data_list:
                if ((i['bname_numeric']-13)%3) == 1:
                    i['bname_numeric'] = 1
                elif ((i['bname_numeric']-13)%3) == 2:
                    i['bname_numeric'] = 5
                elif ((i['bname_numeric']-13)%3) == 0:
                    i['bname_numeric'] = 9
                else:
                    i['bname_numeric'] = i['bname_numeric'] 
                
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

        sql = "insert into ban(register_no, name,teacher,semester)" \
              " values (%(id)s, %(bname)s, %(teacher)s, %(bname_numeric)s);"

        cur.executemany(sql, data_list)

        db.commit()
except:
    print(traceback.format_exc())
    print("fail 2")

finally:
    db.close()