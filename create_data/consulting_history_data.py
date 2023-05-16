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
            cur.execute('''
            SELECT student.id AS student_id,student.first_name as 'student_name',student.nick_name as 'student_engname',student.register_no as 'origin',class.id AS ban_id, staff.id AS teacher_id,
            student_documents.remarks AS solution, student_documents.updated_at AS created_at,
            CONCAT(student_document_cate.cate_name, ' ', student_documents.title) AS contents
            FROM staff
            LEFT JOIN teacher_allocation ON teacher_allocation.teacher_id = staff.id
            LEFT JOIN class ON class.id = teacher_allocation.class_id
            LEFT JOIN student ON student.main_class_id = class.id
            LEFT JOIN student_documents ON student_documents.student_id = student.id
            LEFT JOIN student_document_cate ON student_documents.document_cate_id = student_document_cate.id
            WHERE student.del_yn = 'N' AND class.is_ended = 0 AND staff.id IS NOT NULL AND
            (class.name_numeric - 13) % 3 IN (0, 1, 2) AND class.is_regular = 0 AND
            class.name NOT LIKE '%테스트%' AND class.name NOT LIKE '%test%' AND
            class.name NOT LIKE '%패키지%' AND class.name NOT LIKE '%퍼플아카데미%' AND
            class.name NOT LIKE '%기%' AND class.name NOT LIKE '%중간승급%';
            ''')

            data_list = cur.fetchall().copy()
            # print(data_list)
    except:
        print(traceback.format_exc())
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

        sql = "insert into consulting(student_id,student_name,student_engname,origin, ban_id,teacher_id, contents,startdate, category_id, done, solution, created_at, missed)" \
              " values (%(student_id)s,%(student_name)s,%(student_engname)s,%(origin)s,%(ban_id)s,%(teacher_id)s, %(contents)s,'20200101',111, 1, %(solution)s, %(created_at)s, '11110101');"

        cur.executemany(sql, data_list)

        db.commit()
except:
    print(traceback.format_exc())
    print("fail 2")

finally:
    db.close()
