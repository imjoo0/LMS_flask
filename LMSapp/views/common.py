from flask import Blueprint,render_template, jsonify, request,redirect,url_for,flash
# file-upload 로 자동 바꿈 방지 모듈 
from werkzeug.utils import secure_filename
from flask_file_upload import FileUpload
from io import BytesIO
import callapi
import pymysql
from flask import session

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
    attachment = Attachments(
        file_name=secure_filename(file.filename),
        mime_type=file.mimetype,
        data=file.read(),
        question_id = q_id
    )
    db.session.add(attachment)
    db.session.commit()

# @bp.route('/uploads/<int:id>')
# def upload_file(id):
#     file = request.files['file-upload']
#     save_attachment(file,id)

# 통계 자료
@bp.route("/all_ban", methods=['GET'])
def get_ban():
    if request.method == 'GET':
        all_ban = callapi.purple_allinfo('get_all_info')
        switchstudent = []
        outstudent = []
        consulting = []
        task = []
        
        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
        try:
            with db.cursor() as cur:
                cur.execute("SELECT ban_id,switch_ban_id,teacher_id,student_id FROM switchstudent;")
                switchstudent = cur.fetchall()

                cur.execute("SELECT ban_id,teacher_id,student_id,created_at as out_created FROM outstudent;")
                outstudent = cur.fetchall()

                cur.execute(f"select consulting.id,consulting.ban_id, consulting.student_id, consulting.done, consultingcategory.id as category_id, consulting.week_code, consultingcategory.name as category, consulting.contents, consulting.deadline, consulting.missed, consulting.created_at, consulting.reason, consulting.solution, consulting.result from consulting left join consultingcategory on consulting.category_id = consultingcategory.id")
                consulting = cur.fetchall()

                cur.execute(f"select task.id, task.category_id, task.contents, task.url, task.attachments, date_format(task.startdate, '%Y-%m-%d') as startdate, date_format(task.deadline, '%Y-%m-%d') as deadline, task.priority, task.cycle, taskcategory.name, taskban.ban_id, taskban.teacher_id, taskban.done from task left join taskcategory on task.category_id = taskcategory.id left join taskban on task.id = taskban.task_id where taskban.ban_id={id};" )
                task = cur.fetchall()
        except:
                print('err')
        finally:
                db.close()        
        return jsonify({'all_ban': all_ban,'switchstudent': switchstudent,'outstudent': outstudent,'consulting':consulting,'task':task})
        
@bp.route('/downloadfile/question/<int:q_id>')
def download_file(q_id):
    attachment = Attachments.query.filter_by(question_id=q_id).first()
    if attachment is None:
        return "File not found."
    return send_file(BytesIO(attachment.data),as_attachment=True, mimetype=attachment.mime_type,download_name=attachment.file_name )
    # # # 파일 저장
    # save_path = os.path.join(config.UPLOAD_FOLDER, uploadto)
    # with open(save_path, 'wb') as f:
    #     f.write(attachment.data)

# 문의 조회 기능 
# 본원 답변 기능
@bp.route('/question/<int:id>', methods=['GET','POST'])
def question(id):
    if request.method == 'GET':
        q = Question.query.filter(Question.id == id).first()
        teacher_info = callapi.purple_info(q.teacher_id,'get_teacher_info_by_id')
        a = Answer.query.filter(Answer.question_id == id).first()
        c = Comment.query.filter(Comment.question_id == id).all()
        return_data = {}
        attach = q.attachments
        if attach is None:
            return_data['attach'] = "없음"
        else:
            return_data['attach'] = attach.file_name
        if q.category == 0:
            return_data['category'] = '일반문의' 
            return_data['history'] = '없음'
        else:
            h = ConsultingHistory.query.filter(ConsultingHistory.id == q.consulting_history).first()
            return_data['history'] = {}
            return_data['history']['id'] = h.consulting_id
            return_data['history']['reason'] = h.reason
            return_data['history']['solution'] = h.solution
            return_data['history']['result'] = h.result
            return_data['history']['created_at'] = h.created_at.strftime('%Y-%m-%d')
            if q.category == 1 : 
                return_data['category'] ='퇴소 요청' 
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
            s = callapi.purple_info(q.student_id,'get_student_info')
            b = callapi.purple_ban(q.ban_id,'get_ban' )    
            return_data['student'] = s['name']
            return_data['student_origin'] = s['origin']
            return_data['ban'] = b['ban_name']
        return_data['comment'] = []
        for comment in c :
            comment_data = {}
            comment_data['c_id'] = comment.id
            comment_data['c_contents'] = comment.contents
            comment_data['c_created_at'] = comment.created_at.strftime('%Y-%m-%d')
            comment_data['parent_id'] = comment.parent_id
            if(q.teacher_id == comment.user_id):
                comment_data['writer'] = return_data['teacher']
            else:
                comment_data['writer'] = '퍼플'
            return_data['comment'].append(comment_data)

        return jsonify(return_data)
    
    elif request.method == 'POST':
        target_question = Question.query.get_or_404(id)
        target_question.answer = 1
        answer_title = request.form['answer_title']
        answer_contents = request.form['answer_contents']
        o_ban_id = int(request.form['o_ban_id'])
        new_answer = Answer(content=answer_contents,title=answer_title,created_at=Today,reject_code=o_ban_id,question_id = id)
        db.session.add(new_answer)
        if target_question.category == 2 and o_ban_id != 0 :    
            new_switch_student = SwitchStudent(ban_id = target_question.ban_id,switch_ban_id=o_ban_id,teacher_id = target_question.teacher_id,student_id=target_question.student_id,created_at=Today)
            db.session.add(new_switch_student)
            # db.session.commit()
        elif(target_question.category != 2 and o_ban_id != 0 ):
            new_out_student = OutStudent(ban_id = target_question.ban_id,teacher_id = target_question.teacher_id,student_id=target_question.student_id,created_at=Today)
            db.session.add(new_out_student)
            # db.session.commit()
        db.session.commit()
        return jsonify({'result': '문의 답변 저장 완료'})

# 문의 삭제기능 
@bp.route('/delete_question/<int:id>', methods=['POST'])
def del_question(id):
    if request.method == 'POST':
        target_question = Question.query.get_or_404(id)
        db.session.delete(target_question)
        db.session.commit()
        return jsonify('삭제 완료')
    
# 댓글 작성 / 조회 
@bp.route('/comment/<int:id>/<int:is_coco>', methods=['GET','POST'])
def comment(id,is_coco):
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
        new_comment = Comment(contents=comment_contents,user_id=session['user_registerno'],question_id=id,created_at=Today,parent_id=is_coco)
        db.session.add(new_comment)
        db.session.commit()
        return jsonify({'result': '댓글 작성 완료'})