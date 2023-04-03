import callapi
import pymysql
import json
from LMSapp.views import *
from LMSapp.models import *
from flask import session
from flask import Blueprint, render_template, jsonify, request, redirect, url_for, flash
from datetime import datetime, timedelta, date
# file-upload 로 자동 바꿈 방지 모듈
from LMSapp.views import common

bp = Blueprint('teacher', __name__, url_prefix='/teacher')


current_time = datetime.now()
Today = current_time.date()
today_yoil = current_time.weekday() + 1
standard = datetime.strptime('11110101', "%Y%m%d").date()

# def task_cycle(){
    # UPDATE taskban A LEFT JOIN task B
    # ON A.task_id= B.id
    # SET A.done = 0
    # WHERE date_format(A.created_at, '%Y-%m-%d') < date_format(curdate(),'%Y-%m-%d') AND B.cycle < 6 AND A.done = 1
# }

# 선생님 메인 페이지
# 테스트 계정 id : T1031 pw동일


@bp.route("/", methods=['GET'])
def home():
    if request.method == 'GET':
        teacher_info = callapi.purple_info(
            session['user_id'], 'get_teacher_info')
        return render_template('teacher.html', user=teacher_info)

# 문의 요청 관련 함수
@bp.route("/get_ban_student/<int:b_id>", methods=['GET'])
def get_ban_student(b_id):
    if request.method == 'GET':
        students = callapi.purple_info(b_id, 'get_student_simple')
        return jsonify(students)


@bp.route("/attach_consulting_history/<int:s_id>", methods=['GET'])
def attach_consulting_history(s_id):
    if request.method == 'GET':
        consulting_history = []
        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00',
                             port=3306, database='LMS', cursorclass=pymysql.cursors.DictCursor)
        try:
            with db.cursor() as cur:
                cur.execute("SELECT consulting.id as id, consultingcategory.name as category, consulting.contents, consulting.result from consulting left join consultingcategory on consultingcategory.id = consulting.category_id where consulting.done=1 and consulting.created_at is not null and consulting.student_id=%s;", (s_id))
                consulting_history = cur.fetchall()
        except:
            print('err')
        finally:
            db.close()
        print(consulting_history)
        return jsonify({'consulting_history': consulting_history})


@bp.route('/question', methods=['GET', 'POST'])
def question():
    if request.method == 'GET':
        data = []
        my_questions = Question.query.filter(
            Question.teacher_id == session['user_registerno']).all()
        for q in my_questions:
            qdata = {}
            qdata['id'] = q.id
            qdata['category'] = q.category
            qdata['title'] = q.title
            qdata['answer'] = q.answer
            qdata['comments'] = len(q.qcomments)
            if (q.answer != 0):
                qdata['answer_created_at'] = q.qa.created_at.strftime(
                    '%Y-%m-%d')
            data.append(qdata)
        return json.dumps(data)

    elif request.method == 'POST':
        question_category = request.form['question_category']
        title = request.form['question_title']
        contents = request.form['question_contents']
        teacher = session['user_registerno']
        create_date = datetime.now().date()
        # 첨부 파일 처리
        file = request.files['file-upload']
        if question_category == '일반':
            cateory = 0
            new_question = Question(category=cateory, title=title, contents=contents,
                                    teacher_id=teacher, create_date=create_date, answer=0)
        else:
            ban_id = request.form['ban_id']
            student_id = request.form['target_student']
            print(student_id)
            history_id = request.form['consulting_history']
            if question_category == '퇴소':
                cateory = 1
            else:
                cateory = 2
            new_question = Question(consulting_history=history_id, category=cateory, title=title, contents=contents,
                                    teacher_id=teacher, ban_id=ban_id, student_id=student_id, create_date=create_date, answer=0)
        db.session.add(new_question)
        db.session.commit()
        common.save_attachment(file, new_question.id)
        return redirect('/')

# 차트 관련
@bp.route('/get_data', methods=['GET'])
def get_data():
    if request.method == 'GET':
        all_consulting = []
        all_task = []
        ban_data = callapi.purple_info(session['user_id'], 'get_mybans')
        switchstudent = []
        outstudent = []
        alimnote = []
        my_students = callapi.purple_info(session['user_id'], 'get_mystudents')
        if len(ban_data) != 0:
            db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00',
                                 port=3306, database='LMS', cursorclass=pymysql.cursors.DictCursor)
            try:
                with db.cursor() as cur:
                    # 상담
                    cur.execute("select id, student_id, category_id , done, deadline from consulting where created_at IS NULL and startdate <= %s and teacher_id=%s", (Today, session['user_registerno'],))
                    all_consulting = cur.fetchall()

                    # 업무
                    cur.execute("select taskban.id,task.id as task_id,taskban.ban_id, taskcategory.name as category, task.contents, task.deadline,task.priority,taskban.done,taskban.created_at from taskban left join task on taskban.task_id = task.id left join taskcategory on task.category_id = taskcategory.id where (task.cycle = %s or task.cycle = %s) and task.startdate <= %s and %s <= task.deadline and taskban.teacher_id=%s;", (today_yoil, 0, Today, Today, session['user_registerno'],))
                    # cur.execute("select taskban.id,taskban.done,taskban.created_at from taskban left join task on taskban.task_id = task.id where (task.cycle = %s or task.cycle = %s) and task.startdate <= %s and %s <= task.deadline and taskban.teacher_id=%s;", (today_yoil, 0, Today, Today, session['user_registerno'],))
                    all_task = cur.fetchall()
                    
                    cur.execute("SELECT ban_id, id, student_id FROM switchstudent WHERE teacher_id = %s GROUP BY ban_id, id, student_id;", (session['user_registerno'],))
                    switchstudent = cur.fetchall()

                    cur.execute("SELECT ban_id, id, student_id FROM outstudent WHERE teacher_id = %s GROUP BY ban_id, id, student_id;", (session['user_registerno'],))
                    outstudent = cur.fetchall()

                    alimnote = callapi.purple_info(session['register_no'],'get_alimnote_teacher')
            except:
                print('err')
            finally:
                db.close()
            return jsonify({'switchstudent': switchstudent,'all_consulting':all_consulting,'all_task':all_task,'my_students':my_students,'outstudent':outstudent,'ban_data':ban_data,'alimnote':alimnote})
        return jsonify({'ban_data':'없음'})
        
# 오늘 해야 할 업무들의 카데고리
@bp.route("/task/<int:done_code>", methods=['GET','POST'])
def task_category(done_code):
    if request.method == 'GET':
        target_cate = []
        result = TaskBan.get_task_category(session['user_registerno'],done_code)
        if len(result['cate_data']) != 0:   
            for cate in result['cate_data']:
                cate_data = {}
                cate_data['id'] = cate.id
                cate_data['name'] = cate.name
                target_cate.append(cate_data)
        target_task = []
        if len(result['task_data'])!=0:   
            for task in result['task_data']:
                task_data = {}
                task_data['id'] = task.id
                task_data['category'] = task.category_id
                task_data['contents'] = task.contents
                task_data['url'] = task.url
                task_data['priority'] = task.priority
                task_data['deadline'] = task.deadline.strftime('%Y-%m-%d')
                target_task.append(task_data)
            target_task.sort(key=lambda x: (-x['priority'],x['deadline']))
        else: 
            target_task = '없음'
        return jsonify({'target_task':target_task,'target_cate':target_cate})
    elif request.method =='POST':
        # done_code = 완료한 task의 id
        target_task = TaskBan.query.get_or_404(done_code)
        target_task.done = 1
        target_task.created_at = Today
        try:
            db.session.commit()
            return jsonify({'result': '완료'})
        except:
            return jsonify({'result': '업무완료 실패'})    

# 오늘 해야할 업무의 반 이름들 
@bp.route("/taskban/<int:task_id>/<int:done_code>", methods=['GET'])
def taskban(task_id,done_code):
    if request.method == 'GET':
        # tb = json.loads(TaskBan.get_ban(session['user_registerno'],task_id))
        # return jsonify({'target_taskban':tb})
        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
        mybans_info = callapi.purple_info(session['user_id'],'get_mybans')
        taskban = {}
        try:
            with db.cursor() as cur:
                cur.execute(f"select taskban.id, taskban.ban_id from taskban where taskban.teacher_id = {session['user_registerno']} and taskban.task_id={task_id} and taskban.done = {done_code};" )
                taskban['status'] = 200
                taskban['data'] = cur.fetchall()
        except Exception as e:
            print(e)
            taskban['status'] = 401
            taskban['text'] = str(e)
        finally:
            db.close()

        return jsonify({
            'mybans_info':mybans_info,
            'target_taskban': taskban
            })

# 선생님이 담당 중인 반 학생중 상담을 하지 않은 학생(is_done = 0) 상담을 한 학생(is_done = 1) 정보
@bp.route("/mystudents/<int:is_done>", methods=['GET'])
def mystudents(is_done):
    if request.method == 'GET':
        all_consulting = {}
        my_students = callapi.purple_info(session['user_id'],'get_mystudents')
        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
        try:
            with db.cursor() as cur:
                if is_done == 2:
                    cur.execute("select id, student_id,category_id,deadline,created_at from consulting where startdate <= %s and teacher_id=%s and missed=%s;",(Today,session['user_registerno'],Today,))
                else:
                    cur.execute("select id, student_id,category_id,deadline,created_at from consulting where startdate <= %s and teacher_id=%s and done=%s;",(Today,session['user_registerno'],is_done,))
                all_consulting['status'] = 200
                all_consulting['data'] = cur.fetchall()
        except Exception as e:
            print(e)
            all_consulting['status'] = 401
            all_consulting['text'] = str(e)
        finally:
            db.close()
        return jsonify({
            'my_students': my_students,
            'all_consulting': all_consulting,
        })


# 학생에게 해야할 상담 목록 ( is_done = 0 ) 상담을 한 목록 (is_done = 1)
@bp.route("/consulting/<int:id>/<int:is_done>", methods=['GET','POST'])
def consulting(id,is_done):
    if request.method == 'GET':
        # (id-student_id) / 미래에 해야하는 상담은 제외
        consultings = Consulting.query.filter((Consulting.student_id==id) & (Consulting.done == is_done)  & (Consulting.startdate <= current_time)).all()
        if(len(consultings)!=0):
            consulting_list = []
            for consulting in consultings:
                consulting_data = {}
                consulting_data['c_id'] = consulting.id
                consulting_data['deadline'] = consulting.deadline.strftime('%Y-%m-%d')
                consulting_data['consulting_missed'] = consulting.missed.date()
                category = ConsultingCategory.query.filter(ConsultingCategory.id == consulting.category_id).first()
                if(consulting.category_id < 101):
                    consulting_data['category'] = str(consulting.week_code) + '주 미학습 상담을 진행해주세요 '
                    consulting_data['week_code'] = consulting.week_code
                    consulting_data['contents'] = category.name +' '+ consulting.contents
                else:
                    consulting_data['category'] = category.name
                    consulting_data['week_code'] = 0
                    consulting_data['contents'] = consulting.contents
                if(consulting_data['consulting_missed'] < consulting.missed.date()):
                    consulting_data['consulting_missed'] = consulting.missed.date()
                if( (consulting_data['consulting_missed']- standard).days == 0):
                    consulting_data['consulting_missed'] = '없음'
                elif( (consulting_data['consulting_missed']- Today).days == 0):
                    consulting_data['consulting_missed'] = '오늘'
                if(is_done == 1):
                    consulting_data['history_reason'] = consulting.reason
                    consulting_data['history_solution'] = consulting.solution
                    consulting_data['history_result'] = consulting.result
                    consulting_data['history_created'] = consulting.created_at.strftime('%Y-%m-%d')
                consulting_list.append(consulting_data)
            consulting_list.sort(key = lambda x:(-x['week_code'],x['deadline']))
            return jsonify({'consulting_list': consulting_list})
        else:
            return jsonify({'consulting_list': '없음'})
            
    elif request.method =='POST':
        # 부재중 체크 (id-consulting_id)
        received_missed = request.form['consulting_missed']
        target_consulting = Consulting.query.get_or_404(id)
        if received_missed == "true":
            target_consulting.missed = Today
            target_consulting.done = 0
            try:
                db.session.commit()
                return jsonify({'result': '부재중 처리 완료'})
            except:
                return jsonify({'result': '부재중 처리 실패'})
        else:
             # 상담 사유
            received_reason = request.form['consulting_reason']
            # 제공 가이드
            received_solution = request.form['consulting_solution']
            # 제공 가이드
            received_result = request.form['consulting_result']

            if(is_done == 0):
                target_consulting.reason = received_reason
                target_consulting.solution = received_solution
                target_consulting.result = received_result
                target_consulting.created_at = Today
            else:
                if(received_reason !="noupdate"):
                    target_consulting.reason = received_reason
                if(received_solution !="noupdate"):    
                    target_consulting.solution = received_solution
                if(received_result !="noupdate"):    
                    target_consulting.result = received_result
                if((received_reason !="noupdate") or (received_solution !="noupdate") or (received_result !="noupdate")):
                    target_consulting.created_at = Today
            target_consulting.done = 1
            db.session.commit()
            return{'result':'상담일지 저장 완료'}

# 추가 상담 실행 함수 
@bp.route("/plus_consulting/<int:student_id>/<int:b_id>", methods=['POST'])
def plus_consulting(student_id,b_id):
    if request.method =='POST':
         # 상담 제목
        received_contents = request.form['consulting_contents']
        # 상담 사유
        received_reason = request.form['consulting_reason']
        # 제공 가이드
        received_solution = request.form['consulting_solution']
        # 제공 결과
        received_result = request.form['consulting_result']
        # 상담생성 
        newconsulting =  Consulting(ban_id=b_id,category_id=110,student_id=student_id,contents=received_contents,startdate=Today,deadline=Today,done=1,missed=standard,reason=received_reason,solution=received_solution,result=received_result,created_at=Today)
        db.session.add(newconsulting)
        db.session.commit()
        return{'result':'상담일지 저장 완료'}


@bp.route('/nomal_question_detail/<int:id>', methods=['GET'])
def nomal_question_detail(id):
    if request.method == 'GET':
        q = Question.query.filter(Question.id == id).first()
        return_data = {}
        return_data['title'] = q.title
        return_data['contents'] = q.contents
        return_data['create_date'] = q.create_date.strftime('%Y-%m-%d')
        return_data['answer_title'] = q.qa.title
        return_data['answer_content'] = q.qa.content
        return_data['answer_reject_code'] = q.qa.reject_code
        return_data['answer_created_at'] = q.qa.created_at.strftime('%Y-%m-%d')

        if  q.attachments is None:
            return_data['attach'] = "없음"
        else:
            return_data['attach'] = q.attachments.file_name
        # if q.category == 0:
        # #     return_data['history'] = '없음'
        # else:
        #     return_data['history'] = q.qconsulting.id
        #     return_data['history_reason'] = q.qconsulting.reason
        #     return_data['history_solution'] = q.qconsulting.solution
        #     return_data['history_result'] = q.qconsulting.result
        #     return_data['history_created_at'] = q.qconsulting.created_at.strftime('%Y-%m-%d')
        # if q.category != 0:
        #     s = callapi.purple_info(q.student_id,'get_student_info')
        #     b = callapi.purple_info(q.ban_id,'get_ban' )    
        #     return_data['student'] = s['name']
        #     return_data['ban'] = b['ban_name']
        return_data['comment'] = []
        for comment in q.qcomments :
            comment_data = {}
            comment_data['c_id'] = comment.id
            comment_data['c_contents'] = comment.contents
            comment_data['c_created_at'] = comment.created_at.strftime('%Y-%m-%d')
            comment_data['parent_id'] = comment.parent_id
            if(q.teacher_id == comment.user_id):
                comment_data['writer'] = '나'
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
 
     
@bp.route('/question_detail/<int:id>/<int:answer>/<int:category>', methods=['GET'])
def get_question_detail(id,answer,category):
    if request.method == 'GET':
        q = Question.query.filter((Question.id == id)).first()
        return_data = {}
        return_data['title'] = q.title
        return_data['contents'] = q.contents
        return_data['create_date'] = q.create_date.strftime('%Y-%m-%d')

        if(answer == 0):
            return_data['answer_title'] = '미응답'
            return_data['answer_content'] = '미응답'
            return_data['answer_reject_code'] = '미응답'
            return_data['answer_created_at'] = '미응답'
        else:
            return_data['answer_title'] = q.qa.title
            return_data['answer_content'] = q.qa.content
            return_data['answer_created_at'] = q.qa.created_at.strftime('%Y-%m-%d')
            return_data['answer_reject_code'] = q.qa.reject_code

        if  q.attachments is None:
            return_data['attach'] = "없음"
        else:
            return_data['attach'] = q.attachments.file_name

        if category == 0:
            return_data['answer_reject_code'] = ''
            return_data['history'] = ''
            return_data['history_reason'] = ''
            return_data['history_solution'] = ''
            return_data['history_result'] = ''
            return_data['history_created_at'] = ''
            return_data['student'] = ''
            return_data['ban'] = ''
        else:
            s = callapi.purple_info(q.student_id,'get_student_info')
            b = callapi.purple_info(q.ban_id,'get_ban' )    
            return_data['student'] = s['name']
            return_data['ban'] = b['ban_name']
            if(q.qconsulting.done != 0):
                return_data['history'] = q.qconsulting.id
                return_data['history_reason'] = q.qconsulting.reason
                return_data['history_solution'] = q.qconsulting.solution
                return_data['history_result'] = q.qconsulting.result
                return_data['history_created_at'] = q.qconsulting.created_at.strftime('%Y-%m-%d')
            else:
                return_data['history'] = ''
                return_data['history_reason'] = ''
                return_data['history_solution'] = ''
                return_data['history_result'] = ''
                return_data['history_created_at'] = ''

        return_data['comment'] = []
        for comment in q.qcomments :
            comment_data = {}
            comment_data['c_id'] = comment.id
            comment_data['c_contents'] = comment.contents
            comment_data['c_created_at'] = comment.created_at.strftime('%Y-%m-%d')
            comment_data['parent_id'] = comment.parent_id
            if(q.teacher_id == comment.user_id):
                comment_data['writer'] = '나'
            else:
                comment_data['writer'] = '퍼플'
            return_data['comment'].append(comment_data)

        return jsonify(return_data)