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
        target_ban = callapi.purple_allban('get_all_ban')
        return jsonify({'target_ban': target_ban})

# 반 차트 관련 
@bp.route("/souldata/", methods=['GET'])
def souldata():
    if request.method == 'GET':
        target_ban = callapi.purple_ban(id,'get_ban')
        if target_ban:
            db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
            switch_student = {}
            out_student = {}

            try:
                with db.cursor() as cur:
                    cur.execute(f'SELECT ban_id,Count(*) as count FROM LMS.switchstudent GROUP BY ban_id HAVING count > 1;')
                    switch_student['status'] = 200
                    switch_student['data'] = cur.fetchall()

                    cur.execute(f'SELECT ban_id,Count(*) as count FROM LMS.outstudent GROUP BY ban_id HAVING count > 1;')
                    out_student['status'] = 200
                    out_student['data'] = cur.fetchall()
            except Exception as e:
                print(e)
                # switch_student['status'] = 401
                # switch_student['text'] = str(e)
                switch_student['status'] = 401
                switch_student['text'] = str(e)
                out_student['status'] = 401
                out_student['text'] = str(e)
            finally:
                db.close()

            return jsonify({
            'switch_student': switch_student,
            'out_student': out_student
        })
        else:
            return jsonify({'status': 400, 'text': '데이터가 없습니다.'})

@bp.route("/sodata", methods=['GET'])
def get_sodata():
    if request.method == 'GET':
        target_sban = []
        target_oban = []
        o = OutStudent.query.all()
        total_o = len(o)
        s = SwitchStudent.query.all()
        total_s = len(s)
        for sd in s:
            target_sban.append(sd.ban_id)
        for od in o:
            target_oban.append(od.ban_id)

        if(len(target_sban) != 0 or len(target_oban) != 0):
            target_ban = target_sban.copy()
            target_ban.extend(target_oban)
            target_ban = list(set(target_ban))
            sodata = []
            for ban in target_ban:
                od = len(OutStudent.query.filter(OutStudent.ban_id==ban).all())
                sd = len(SwitchStudent.query.filter(SwitchStudent.ban_id==ban).all())
                data = {}
                b = callapi.purple_ban(ban,'get_ban')
                data['register_no'] = b['register_no']
                data['ban_name'] = b['ban_name']
                data['semester'] = b['semester']
                data['teacher_name'] = b['teacher_name'] +'('+b['teacher_engname'] + ')'
                data['standard'] = round((od/total_o)*100)+round((sd/total_s)*100)
                data['out_data'] = str(od) +'('+ str(round((od/total_o)*100)) + '%)' if(total_o != 0) else 0
                data['switch_data'] = str(sd) +'('+ str(round((sd/total_s)*100)) + '%)' if(total_s != 0) else 0
                sodata.append(data)
            sodata.sort(key = lambda x:-x['standard'])

        else:
                sodata = '없음'
        return jsonify({'sodata': sodata,'switch_num':total_s,'outstudent_num':total_o})

@bp.route("/uldata", methods=['GET'])
def get_uldata():
    if request.method == 'GET':
        target_ulban = []
        ul = Consulting.query.filter(Consulting.category_id<100).all()
        ixl_num = len(Consulting.query.filter(Consulting.category_id==1).all())
        sread_num = len(Consulting.query.filter(Consulting.category_id==3).all())
        read_num = len(Consulting.query.filter(Consulting.category_id==4).all())
        intoread_num = len(Consulting.query.filter(Consulting.category_id==5).all()) + len(Consulting.query.filter(Consulting.category_id==7).all())
        writing_num = len(Consulting.query.filter(Consulting.category_id==6).all())

        total_ul = len(ul)

        for u in ul:
            target_ulban.append(u.ban_id)

        if len(target_ulban) != 0:
            target_ulban = list(set(target_ulban))
            uldata = []
            for ban in target_ulban:
                ud = len(Consulting.query.filter((Consulting.ban_id==ban) & (Consulting.category_id<100)).all())
                data = {}
                b = callapi.purple_ban(ban,'get_ban')
                data['register_no'] = b['register_no']
                data['ban_name'] = b['ban_name']
                data['semester'] = b['semester']
                data['teacher_name'] = b['teacher_name'] +'('+b['teacher_engname'] + ')'
                data['standard'] = ud
                data['ul_data'] = str(ud) +'('+ str(round((ud/total_ul)*100)) + '%)' if(total_ul != 0) else 0
                uldata.append(data)
            uldata.sort(key = lambda x:-x['standard'])
        else:
                uldata = '없음'
        return jsonify({'uldata': uldata,'unlearned_num':total_ul,'ixl_num':ixl_num,'sread_num':sread_num,'read_num':read_num,
                            'intoread_num':intoread_num,'writing_num':writing_num,'intoread_num':intoread_num})

        
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