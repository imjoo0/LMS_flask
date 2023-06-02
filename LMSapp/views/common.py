from flask import Blueprint,render_template, jsonify, request,redirect,url_for,flash
# file-upload 로 자동 바꿈 방지 모듈 
from werkzeug.utils import secure_filename
from flask_file_upload import FileUpload
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

# 날짜 
current_time = datetime.now()
Today = current_time.date()
today_yoil = current_time.weekday() + 1

standard = datetime.strptime('11110101',"%Y%m%d").date()

def save_attachment(file, q_id):
    try:
        # 파일명을 유니코드 NFC로 정규화
        file_name = unicodedata.normalize('NFC', file.filename)
<<<<<<< HEAD
        # file_name = secure_filename(normalized_filename.replace('\0', '').replace(' ', '_'))
=======
>>>>>>> 94d4a3906e484d679f1d2dace527a4a474941c7a
        mime_type = file.mimetype
        data = file.stream.read()

        attachment = Attachments(
            file_name=file_name,
            mime_type=mime_type,
            data=data,
            question_id=q_id
        )

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
def get_ban():
    if request.method == 'GET':
        all_ban = callapi.purple_allinfo('get_all_ban')
        # consulting = []
        switchstudent = []
        
        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
        try:
            with db.cursor() as cur:
                cur.execute("SELECT ban_id,switch_ban_id,teacher_id,student_id FROM switchstudent;")
                switchstudent = cur.fetchall()

                # cur.execute(f"SELECT consulting.id, consulting.teacher_id,consulting.ban_id, consulting.student_id, consulting.done, consultingcategory.id AS category_id, consulting.week_code, consultingcategory.name AS category, consulting.contents, DATE_FORMAT(consulting.startdate, '%Y-%m-%d') AS startdate, DATE_FORMAT(consulting.deadline, '%Y-%m-%d') AS deadline, consulting.missed, consulting.created_at, consulting.reason, consulting.solution, consulting.result, (SELECT COUNT(*) FROM consulting WHERE (category_id < 100 && consulting.startdate <= curdate())) AS total_unlearned_consulting FROM consulting LEFT JOIN consultingcategory ON consulting.category_id = consultingcategory.id;")
                # consulting = cur.fetchall()
        except:
                print('err')
        finally:
                db.close()        
        return jsonify({'all_ban':all_ban,'switchstudent': switchstudent})

@bp.route("/get_student_reports", methods=['GET'])
def get_student_reports():
    if request.method == 'GET':
        reports = callapi.purple_allinfo('get_student_reports')
        return jsonify({'reports':reports})
    
@bp.route("/all_students", methods=['GET'])
def get_all_students():
    if request.method == 'GET':
        students = callapi.purple_allinfo('get_all_ban_student')
        return jsonify({'students':students})

@bp.route("/consulting", methods=['GET'])
def get_all_consulting():
    if request.method == 'GET':
        consulting = []
        # consulting_history = callapi.purple_allinfo('get_all_consulting_history') 
        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
        try:
            with db.cursor() as cur:
                cur.execute(f"SELECT consulting.id, consulting.teacher_id, user.eng_name as teacher_engname,user.name as teacher_name,user.mobileno as teacher_mobileno, consulting.ban_id, consulting.student_id, consulting.done, consultingcategory.id AS category_id, consulting.week_code, consultingcategory.name AS category,consulting.student_name,consulting.student_engname,consulting.origin, consulting.contents, DATE_FORMAT(consulting.startdate, '%Y-%m-%d') AS startdate, DATE_FORMAT(consulting.deadline, '%Y-%m-%d') AS deadline, consulting.missed, consulting.created_at, consulting.reason, consulting.solution, consulting.result, (SELECT COUNT(*) FROM consulting WHERE (category_id < 100 && consulting.startdate <= curdate())) AS total_unlearned_consulting FROM consulting LEFT JOIN consultingcategory ON consulting.category_id = consultingcategory.id LEFT JOIN user ON consulting.teacher_id = user.id;")
                consulting = cur.fetchall()

        except:
                print('err')
        finally:
                db.close()        
        return jsonify({'consulting':consulting})
       
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
        target_question = Question.query.get_or_404(id)
        if(target_question.answer == 1):
            target_answer = Answer.query.filter(Answer.question_id == id).first()
            db.session.delete(target_answer)
        db.session.delete(target_question)
        db.session.commit()
        return jsonify('삭제 완료')
    
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