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
            # cur.execute("select class.name_numeric") 
            cur.execute("select student.id as 'register_no',student.main_class_id as 'ban_id', staff.id as 'teacher_id', student.register_no as 'original', student.first_name as 'name', student.mobileno as 'mobileno', parent.name as 'pname', parent.mobileno as 'pmobileno', student.created_at as 'register_date',  A.pack_code as 'reco_book_code' , A.package_date as 'reco_book_date' from student left join (select register_no, pack_code, max(package_date) as 'package_date' from book_package_history group by register_no) A on student.register_no = A.register_no left join parent on  parent.id = student.parent_id left join class on class.id = student.main_class_id left join teacher_allocation on teacher_allocation.class_id = student.main_class_id left join staff on teacher_allocation.teacher_id = staff.id where class.is_regular = 0 and class.is_ended=0 and class.name not like '%Test%' and class.name not like '%테스트%' and class.name not like '%(%';")
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

        sql = "insert into student(original, ban_id,teacher_id, register_no,name,mobileno,parent_name,parent_mobileno,recommend_book_code,register_date)" \
              " values (%(original)s,%(ban_id)s,%(teacher_id)s, %(register_no)s, %(name)s, %(mobileno)s, %(pname)s, %(pmobileno)s, %(reco_book_code)s, %(register_date)s);"

        cur.executemany(sql, data_list)

        db.commit()
except:
    print(traceback.format_exc())
    print("fail 2")

finally:
    db.close()
