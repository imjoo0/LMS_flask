from flask import Blueprint,render_template, jsonify, request,redirect,url_for,flash
# file-upload 로 자동 바꿈 방지 모듈 
from werkzeug.utils import secure_filename
from flask_file_upload import FileUpload
from datetime import datetime, timedelta, date
import pytz
import unicodedata
from io import BytesIO
import callapi
import pymysql
from LMSapp.views.main_views import authrize
import hashlib
bp = Blueprint('common', __name__, url_prefix='/common')
file_upload = FileUpload()

from flask import send_file 
from LMSapp.models import *
from LMSapp.views import *
from LMSapp import socketio

db_connection = DBConnection()
# 날짜 
current_time = datetime.utcnow()
korea_timezone = pytz.timezone('Asia/Seoul')
korea_time = current_time + timedelta(hours=9)
korea_time = korea_timezone.localize(korea_time)

Today = korea_time.date()
today_yoil = korea_time.weekday() + 1
standard = datetime.strptime('11110101', "%Y%m%d").date()

def save_attachment(file, q_id, is_answer):
    try:
        # 파일명을 유니코드 NFC로 정규화
        file_name = unicodedata.normalize('NFC', file.filename)
        mime_type = file.mimetype
        data = file.stream.read()

        attachment = Attachments(
            file_name=file_name,
            mime_type=mime_type,
            data=data,
            question_id=q_id,
            is_answer = is_answer
        )

        print(attachment)
        db.session.add(attachment)
        db.session.commit()

        return True  # 성공적으로 저장된 경우 True 반환

    except Exception as e:
        # 파일 저장 실패 처리
        db.session.rollback()
        return str(e)  # 에러 메시지 반환

# 비번 변경
# 오늘 해야 할 업무 완료 저장 
@bp.route("/put_user", methods=['POST'])
@authrize
def put_user(u):
    new_pw = request.form['new_pw']
    hashed_password = hashlib.sha256(new_pw.encode('utf-8')).hexdigest()
    target_user = User.query.get_or_404(u['id'])
    target_user.user_pw = hashed_password
    db.session.commit()
    return jsonify({'result': 'success'})

# 통계 자료
@bp.route("/all_ban", methods=['GET'])
def get_all_ban():
    if request.method == 'GET':
        all_data = callapi.purple_allinfo('get_all_ban_student_online')
        return jsonify({'all_data':all_data})

@bp.route("/all_students", methods=['GET'])
def get_all_students():
    if request.method == 'GET':
        students = callapi.purple_allinfo('get_all_student_online')
        return jsonify({'students':students})
 
@bp.route("/consulting_chunk", methods=['GET'])
def get_consulting_chunk():
    if request.method == 'GET':
        page = request.args.get('page', default=1, type=int)  # 클라이언트에서 전달한 페이지 번호 2
        page_size = request.args.get('page_size', default=10000, type=int)  # 클라이언트에서 전달한 페이지 크기
        offset = (page - 1) * page_size  # 오프셋 계산
        consulting = []
        total_count = 0

        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS', cursorclass=pymysql.cursors.DictCursor)
        try:
            with db.cursor() as cur:
                # 전체 데이터 개수 조회
                cur.execute("SELECT COUNT(*) AS total_count FROM consulting;")
                result = cur.fetchone()
                total_count = result['total_count']

                # 페이징된 데이터 조회
                cur.execute(f"SELECT consulting.id, consulting.teacher_id, user.eng_name as teacher_engname, user.name as teacher_name, user.mobileno as teacher_mobileno, consulting.ban_id, consulting.student_id, consulting.done, consultingcategory.id AS category_id, consulting.week_code, consultingcategory.name AS category, consulting.student_name, consulting.student_engname, consulting.origin, consulting.contents, consulting.startdate AS startdate, consulting.deadline AS deadline, consulting.missed, consulting.created_at, consulting.reason, consulting.solution, consulting.result FROM consulting LEFT JOIN consultingcategory ON consulting.category_id = consultingcategory.id LEFT JOIN user ON consulting.teacher_id = user.id ORDER BY consulting.startdate DESC LIMIT %s, %s;", (offset, page_size))
                consulting = cur.fetchall()

        except Exception as e:
            print(e)
        finally:
            db.close()

        return jsonify({'consulting': consulting, 'total_count': total_count})

@bp.route("/consulting_chunk_by_teacher", methods=['GET'])
def get_consulting_chunk_by_teacher():
    if request.method == 'GET':
        # 이전에 부른 ban_id 
        teacher_id_history = request.args.get('teacher_id_history', default=1, type=int)
        t_id = request.args.get('t_id', default=0, type=int)  # 클라이언트에서 전달한 불러야 하는 t_id 
        consulting = []
        total_count = 0

        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS', cursorclass=pymysql.cursors.DictCursor)
        try:
            with db.cursor() as cur:
                # 전체 데이터 개수 조회
                cur.execute("SELECT COUNT(*) AS total_count FROM consulting;")
                result = cur.fetchone()
                total_count = result['total_count']
                
                if(t_id != 0):
                    cur.execute(f"SELECT consulting.id, consulting.teacher_id, user.eng_name as teacher_engname, user.name as teacher_name, user.mobileno as teacher_mobileno, consulting.ban_id, consulting.student_id, consulting.done, consultingcategory.id AS category_id, consulting.week_code, consultingcategory.name AS category, consulting.student_name, consulting.student_engname, consulting.origin, consulting.contents, consulting.startdate AS startdate, consulting.deadline AS deadline, consulting.missed, consulting.created_at, consulting.reason, consulting.solution, consulting.result FROM consulting LEFT JOIN consultingcategory ON consulting.category_id = consultingcategory.id LEFT JOIN user ON consulting.teacher_id = user.id where consulting.teacher_id = %s;",(t_id,))
                    consulting = cur.fetchall()
                else:
                    # consulting 정보 조회 (teacher_id 별로 묶음)
                    cur.execute(f"SELECT consulting.id, consulting.teacher_id, user.eng_name as teacher_engname, user.name as teacher_name, user.mobileno as teacher_mobileno, consulting.ban_id, consulting.student_id, consulting.done, consultingcategory.id AS category_id, consulting.week_code, consultingcategory.name AS category, consulting.student_name, consulting.student_engname, consulting.origin, consulting.contents, consulting.startdate AS startdate, consulting.deadline AS deadline, consulting.missed, consulting.created_at, consulting.reason, consulting.solution, consulting.result FROM consulting LEFT JOIN consultingcategory ON consulting.category_id = consultingcategory.id LEFT JOIN user ON consulting.teacher_id = user.id where consulting.teacher_id != %s ORDER BY consulting.teacher_id;", (teacher_id_history,))
                    consulting = cur.fetchall()

        except Exception as e:
            print(e)
        finally:
            db.close()

        return jsonify({'consulting': consulting, 'total_count': total_count})

@bp.route("/task_chunk_by_teacher", methods=['GET'])
def get_task_chunk_by_teacher():
    if request.method == 'GET':
        teacher_id_history = request.args.get('teacher_id_history', default=1, type=int)
        t_id = request.args.get('t_id', default=0, type=int)  # 클라이언트에서 전달한 불러야 하는 t_id 
        task = []
        total_count = 0

        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS', cursorclass=pymysql.cursors.DictCursor)
        try:
            with db.cursor() as cur:
                # 전체 데이터 개수 조회
                cur.execute("SELECT COUNT(*) AS total_count FROM taskban;")
                result = cur.fetchone()
                total_count = result['total_count']
                
                if(t_id != 0):
                    cur.execute(f"select task.id,task.category_id, task.contents, task.url, task.attachments, task.startdate as startdate, task.deadline as deadline, task.priority, task.cycle, taskcategory.name,taskban.id as taskban_id, taskban.ban_id, taskban.teacher_id, taskban.done from task left join taskcategory on task.category_id = taskcategory.id left join taskban on task.id = taskban.task_id where taskban.teacher_id = %s;",(t_id,))
                    task.extend(cur.fetchall())
                else:
                    cur.execute(f"select task.id,task.category_id, task.contents, task.url, task.attachments, task.startdate as startdate, task.deadline as deadline, task.priority, task.cycle, taskcategory.name,taskban.id as taskban_id, taskban.ban_id, taskban.teacher_id, taskban.done from task left join taskcategory on task.category_id = taskcategory.id left join taskban on task.id = taskban.task_id where taskban.teacher_id != %s ORDER BY taskban.teacher_id;",(teacher_id_history,))
                    task.extend(cur.fetchall())

        except Exception as e:
            print(e)
        finally:
            db.close()

        return jsonify({'task': task, 'total_count': total_count})

@bp.route("/task", methods=['GET'])
def get_all_task():
    if request.method == 'GET':
        task = []
        
        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
        try:
            with db.cursor() as cur:
                cur.execute(f"select task.id,task.category_id, task.contents, task.url, task.attachments, date_format(task.startdate, '%Y-%m-%d') as startdate, date_format(task.deadline, '%Y-%m-%d') as deadline, task.priority, task.cycle, taskcategory.name,taskban.id as taskban_id, taskban.ban_id, taskban.teacher_id, taskban.done from task left join taskcategory on task.category_id = taskcategory.id left join taskban on task.id = taskban.task_id;" )
                task = cur.fetchall()

        except:
                print('err')
        finally:
                db.close()        
        return jsonify({'task':task})

from urllib.parse import quote

@bp.route('/downloadfile/question/<int:q_id>/attachment/<int:att_id>')
def download_attachment(q_id, att_id):
    attachment = Attachments.query.filter_by(id=att_id, question_id=q_id).first()
    if attachment is None:
        return "File not found."
    
    # 파일 이름을 URL에 안전한 형식으로 인코딩
    encoded_filename = quote(attachment.file_name)
    
    return send_file(BytesIO(attachment.data), as_attachment=True, mimetype=attachment.mime_type, download_name=encoded_filename)

# 문의 조회 기능 

# 문의 삭제기능 
@bp.route('/delete_question/<int:id>', methods=['POST'])
def del_question(id):
    if request.method == 'POST':
        result = {}
        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
        try:
            with db.cursor() as cur:
                cur.execute(f'DELETE question, answer, attachment FROM question LEFT JOIN answer ON answer.question_id = question.id LEFT JOIN attachment ON attachment.question_id = question.id  WHERE question.id = {id};')
                db.commit()
                result['status'] = 200
                result['text'] = id
        except Exception as e:
            print(e)
            result['status'] = 401
            result['text'] = str(e)
        finally:
            db.close()
        return jsonify('삭제 완료')

# 상담 삭제 기능
@bp.route('/delete_consulting/<int:id>', methods=['POST'])
def delete_consulting(id):
    result = {}
    if request.method == 'POST':
        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
        try:
            with db.cursor() as cur:
                cur.execute('DELETE FROM consulting WHERE id=%s', (id))
                db.commit()
                result['status'] = 200
                result['text'] = 'Success'
        except Exception as e:
            print(e)
            result['status'] = 401
            result['text'] = str(e)
        finally:
            db.close()
        return jsonify(result)

# 댓글 작성 / 조회 
@bp.route('/comment/<int:id>/<int:is_coco>', methods=['GET','POST'])
@authrize
def comment(u,id,is_coco):
    if request.method == 'GET':
        q = Comment.query.filter(Comment.question_id == id).all()
        teacher_info = callapi.purple_info(q.teacher_id,'get_teacher_info_by_id')
        a = Answer.query.filter(Answer.question_id == id).first()
        return_data = {}
        if q.category == 0: return_data['category'] = '일반문의' 
        elif q.category == 1 : return_data['category'] ='퇴소 요청' 
        elif q.category == 2: return_data['category'] ='이반 요청' 
        else: return_data['category'] = '취소/환불 요청' 
        return_data['title'] = q.title
        return_data['contents'] = q.contents
        return_data['create_date'] = q.create_date.strftime('%Y-%m-%d')
        return_data['teacher'] = teacher_info['name']
        return_data['teacher_e'] = teacher_info['engname']
        if q.answer == 1 :return_data['answer'] = a.content
        else: return_data['answer'] = '✖️'
        if q.answer == 1:return_data['answer_at'] = a.created_at.strftime('%Y-%m-%d')
        else:return_data['answer_at'] = '✖️'
        if (q.category != 0 and q.answer == 1 and a.reject_code != 0): return_data['reject'] = '승인'
        elif(q.answer == 0): return_data['reject'] = '대기중'
        else: return_data['reject'] = '반려'
        if q.category != 0:
            s = callapi.purple_info(q.student_id ,'get_student_info')
            b = callapi.purple_ban(q.ban_id,'get_ban')    
            
            return_data['student'] = s['name']
            return_data['student_origin'] = s['origin']
            return_data['ban'] = b['ban_name']

        return jsonify(return_data)
    
    elif request.method == 'POST':
        # target_question = Question.query.get_or_404(id)
        comment_contents = request.form['comment_contents'] 
        new_comment = Comment(contents=comment_contents,user_id=u['id'],question_id=id,created_at=Today,parent_id=is_coco)
        db.session.add(new_comment)
        db.session.commit()
        return jsonify({'result': '댓글 작성 완료'})

# without callapi
# import datetime
# import traceback
# from sshtunnel import SSHTunnelForwarder
# @bp.route("/all_ban_students_data", methods=['GET'])
# def get_all_ban_students_data():
#     if request.method == 'GET':
#         data_list = []
#         with SSHTunnelForwarder(
#                 ('15.164.36.206'),
#                 ssh_username="ec2-user",
#                 ssh_pkey="D:/privatekey/purple_academy_privkey.pem",
#                 remote_bind_address=('purple-lms-mariadb-1.cdpnol1tlujr.ap-northeast-2.rds.amazonaws.com', 3306)
#         )as tunnel:
#             db = pymysql.connect(
#                 host='127.0.0.1', user="readonly",
#                 password="purpledbreadonly12!@", port=tunnel.local_bind_port, database='purple-lms',
#                 cursorclass=pymysql.cursors.DictCursor,
#             )
#             try:
#                 with db.cursor() as cur:
#                     # semester 계산기 
#                     # cur.execute("select class.name_numeric") 
#                     cur.execute("select staff.id, staff.name as eng_name, staff.name_kor as name, staff.staff_id as user_id,SHA2(staff.staff_id, 256) as user_pw, staff.mobileno,staff.email,staff.department as category from staff where staff.id = 366;")
#                     data_list = cur.fetchall().copy()
#                     print(data_list)
                        
#             except:
#                 print("fail 1")
#             finally:
#                 db.close()

#         db=pymysql.connect(
#                 host='purpleacademy.net', user="purple",
#                 password="wjdgus00", port=3306, database='LMS',
#                 cursorclass=pymysql.cursors.DictCursor,
#             )

#         try:
#             with db.cursor() as cur:
#                 print('데이터 저장 진행 중 ')

#                 # sql = "insert into user(id,user_id,user_pw,name,eng_name,mobileno,email,category)" \
#                 #     " values (%(id)s, %(user_id)s, %(user_pw)s,%(name)s, %(eng_name)s, %(mobileno)s, %(email)s, %(category)s);"

#                 # cur.executemany(sql, data_list)

#                 # db.commit()
#         except:
#             print(traceback.format_exc())
#             print("fail 2")

#         finally:
#             db.close()


@bp.route("/get_student_reports", methods=['GET'])
def get_student_reports():
    if request.method == 'GET':
        reports = callapi.purple_allinfo('get_student_reports')
        return jsonify({'reports':reports})

# socket-io
@socketio.on('message')
def handle_message(data):
    print('received message: ' + data)