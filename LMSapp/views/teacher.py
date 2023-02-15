from flask import Blueprint,render_template, jsonify, request,redirect,url_for,flash
import config 
from datetime import datetime, timedelta, date

bp = Blueprint('teacher', __name__, url_prefix='/teacher')

from flask import session  # 세션
from LMSapp.models import *
from LMSapp.views import *
import json
import pymysql

import callapi

current_time = datetime.now()
Today = current_time.date()
today_yoil = current_time.weekday() + 1
# 선생님 메인 페이지
# 테스트 계정 id : T1031 pw동일  
@bp.route("/", methods=['GET'])
def home():
    if request.method =='GET':
        teacher_info = callapi.get_teacher_info(session['user_id'])
        mystudents_info = callapi.get_mystudents(session['user_id'])
        mybans_info = callapi.get_mybans(session['user_id'])
        all_ban_info = callapi.all_ban_info()
        all_task_category = TaskCategory.query.all()
        my_tasks = TaskBan.query.filter((TaskBan.teacher_id==session['user_registerno']) & (TaskBan.done != 1) ).all()
        all_my_tasks = len(TaskBan.query.filter(TaskBan.teacher_id==session['user_registerno']).all())
        done_tasks = len(TaskBan.query.filter((TaskBan.teacher_id==session['user_registerno']) & (TaskBan.done != 0) ).all())
        not_done_task_per = int((done_tasks/all_my_tasks)*100)

        if len(my_tasks)!=0:
            tc = []
            for task in my_tasks:
                t = Task.query.filter((Task.id==task.task_id) & (Task.startdate <= current_time) & ( current_time <= Task.deadline ) & ( (Task.cycle == today_yoil) | (Task.cycle == 0))).first()
                if(t != None):
                    tc.append(t)
            tc = list(set(tc))

            category_set = []
            for cate in tc:
                category_set.append(cate.category_id)
            category_set = list(set(category_set))
        else:
            category_set = '없음'

        my_questions = Question.query.filter(Question.teacher_id == session['user_registerno']).all()

        return render_template('teacher.html',user=teacher_info,my_bans=mybans_info,all_ban=all_ban_info,students=mystudents_info, questions=my_questions,my_task_category=category_set,all_task_category=all_task_category,all_task_num=all_my_tasks, not_done_task_num=done_tasks,not_done_task_per=not_done_task_per)

def taskcycle():
    my_tasks = TaskBan.query.filter((TaskBan.teacher_id==session['user_registerno']) & (TaskBan.done == 1)).all()
    for task in my_tasks:
        t = Task.query.filter(Task.id==task.task_id).all()[0]
        if t.cycle != 7 and Today <= t.deadline.date():
            task.done = 0
            db.session.commit()
        elif t.cycle == 7 and task.done==1:
            db.session.delete(task)


@bp.route('/api/get_teacher_ban', methods=['GET'])
def get_ban():
    if request.method == 'GET':
        result = []
        mybans_info = callapi.get_mybans(session['user_id'])

        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
        try:
            with db.cursor() as cur:
                for ban in mybans_info:
                    temp = {}
                    # cur.execute(f"select id, ban_id, category_id, student_id, contents, date_format(startdate, '%Y-%m-%d') as startdate, date_format(deadline, '%Y-%m-%d') as deadline, week_code, done, missed from consulting where ban_id = {ban['register_no']};")
                    cur.execute(f"select count(*) as 'count', category_id from consulting where ban_id = {ban['register_no']} group by category_id")
                    temp['consulting'] = cur.fetchall().copy()

                    cur.execute(f"select count(*) as 'count', category from switchstudent where ban_id={ban['register_no']} group by category")
                    temp['switchstudent'] = cur.fetchall().copy()

                    alimnote = callapi.get_alimnote(ban['register_no'])
                    temp['alimnote'] = alimnote

                    result.append({ban['name']: temp.copy()})
                    #result.append(ban['register_no'])
        except:
            print('err')
        finally:
            db.close()

        return json.dumps(result)        
        
# 오늘 완료 한 업무  get
@bp.route("/taskdone", methods=['GET'])
def taskdone():
    if request.method == 'GET':
        my_tasks = TaskBan.query.filter((TaskBan.teacher_id==session['user_registerno']) & (TaskBan.done == 1)).all()

        tc = []
        for task in my_tasks:
            t = Task.query.filter((Task.id==task.task_id) & (Task.startdate <= current_time) & ( current_time <= Task.deadline )).first()
            # 오늘의 업무만 저장 
            if t != None:
                tc.append(t.contents)
        tc = list(set(tc))
        if(len(tc)==0):
            return jsonify({'task': '없음'})
        else:
            return jsonify({'task' : tc})

# 오늘 해야 할 업무 get / post 
@bp.route("/<int:id>", methods=['POST','GET'])
def task(id):
    if request.method =='POST':
        target_task = TaskBan.query.get_or_404(id)
        target_task.done = 1
        try:
            db.session.commit()
            return jsonify({'result': '완료'})
        except:
            return jsonify({'result': '업무완료 실패'})
    elif request.method == 'GET':
        my_tasks = TaskBan.query.filter((TaskBan.teacher_id==session['user_registerno']) & (TaskBan.done != 1)).all()

        tc = []
        for task in my_tasks:
            t = Task.query.filter((Task.id==task.task_id) & (Task.startdate <= current_time) & ( current_time <= Task.deadline )).first()
            # 오늘의 업무만 저장 
            if t != None:
                tc.append(t)
        tc = list(set(tc))
        
        category_task = []
        for task in tc:
            if (task.category_id == id) and (task.cycle == today_yoil or task.cycle == 0 ) : # 주기가 월-금인 경우 
                    category_task.append(task)


        # 우선순위 정렬 
        category_task.sort(key=lambda x : (-x.priority, x.deadline)) 
        
        target_task = []
        if(len(category_task)==0):
            return jsonify({'task': '없음'})
        else:
            for task in category_task:
                task_data = {}
                task_data['contents'] = task.contents
                task_data['url'] = task.url
                task_data['priority'] = task.priority
                task_data['deadline'] = task.deadline.strftime('%Y-%m-%d')
                task_data['task_ban'] = []
                for tb in my_tasks:
                    if task.id == tb.task_id:
                        data = {}
                        data['id'] = tb.id
                        data['done'] = tb.done
                        ban = callapi.get_ban(tb.ban_id)
                        data['ban'] = ban['ban_name']
                        task_data['task_ban'].append(data)
                target_task.append(task_data)
            return jsonify({'task' : target_task})

# 반별 오늘 해야 할 상담 목록 
@bp.route("/consulting", methods=['GET'])
def missed_consulting():
    if request.method == 'GET':
        my_students = callapi.get_mystudents(session['user_registerno'])
        consulting_list = []
        for student in my_students:
            consultings = Consulting.query.filter((Consulting.student_id==student['register_no']) & (Consulting.done != 1) & (Consulting.missed.date() == Today)).all()
            print(consultings)
            target_data = {}
            target_data['s_id'] = student['register_no']
            target_data['name'] = student['name'] + '(' + student['origin'] + ')'
            target_data['mobileno'] = student['mobileno']
            target_data['consultings'] = []
            for consulting in consultings:
                consulting_data = {}
                consulting_data['c_id'] = consulting.id
                consulting_data['deadline'] = consulting.deadline.strftime('%Y-%m-%d')
                category = ConsultingCategory.query.filter(ConsultingCategory.id == consulting.category_id).first()
                if(consulting.category_id < 101):
                    consulting_data['category'] = str(consulting.week_code) + '주 미학습 상담을 진행해주세요 '
                    consulting_data['week_code'] = consulting.week_code
                    consulting_data['contents'] = category.name +' '+ consulting.contents
                else:
                   consulting_data['category'] = category.name
                   consulting_data['week_code'] = 0
                   consulting_data['contents'] = consulting.contents
                target_data['consultings'].append(consulting_data)
            if(len(target_data['consultings'])!=0):
                target_data['consultings'].sort(key = lambda x:(x['deadline'],-x['week_code']))
                target_data['consulting_num'] = len(target_data['consultings'])
                consulting_list.append(target_data)
        if(len(consulting_list)==0):
            return jsonify({'consulting': '없음'})
        else: 
            consulting_list.sort(key = lambda x:(-x['consulting_num'],x['consulting_missed']))
            return jsonify({'consulting': consulting_list})
# 반별 오늘 해야 할 상담 목록 
@bp.route("consulting/<int:id>", methods=['GET','POST'])
def consulting(id):
    if request.method == 'GET':
        my_students = callapi.get_students(id)
        consulting_list = []
        for student in my_students:
            consultings = Consulting.query.filter((Consulting.student_id==student['register_no']) & (Consulting.done != 1)  & (Consulting.startdate <= current_time) & ( current_time <= Consulting.deadline )).all()
            target_data = {}
            target_data['s_id'] = student['register_no']
            target_data['name'] = student['name'] + '(' + student['origin'] + ')'
            target_data['mobileno'] = student['mobileno']
            target_data['reco_book_code'] = student['reco_book_code']    
            target_data['consulting_missed'] = datetime.strptime('11110101',"%Y%m%d").date()
            target_data['consultings'] = []

            for consulting in consultings:
                consulting_data = {}
                consulting_data['c_id'] = consulting.id
                consulting_data['deadline'] = consulting.deadline.strftime('%Y-%m-%d')
                category = ConsultingCategory.query.filter(ConsultingCategory.id == consulting.category_id).first()
                if(consulting.category_id < 101):
                    consulting_data['category'] = str(consulting.week_code) + '주 미학습 상담을 진행해주세요 '
                    consulting_data['week_code'] = consulting.week_code
                    consulting_data['contents'] = category.name +' '+ consulting.contents
                else:
                   consulting_data['category'] = category.name
                   consulting_data['week_code'] = 0
                   consulting_data['contents'] = consulting.contents
                if(target_data['consulting_missed'] < consulting.missed.date()):
                    target_data['consulting_missed'] = consulting.missed.date()
                target_data['consultings'].append(consulting_data)
            standard = datetime.strptime('11110101',"%Y%m%d").date()
            if(len(target_data['consultings'])!=0):
                if((target_data['consulting_missed'] - standard).days == 0):
                    target_data['consulting_missed'] = '없음'
                elif((target_data['consulting_missed'] - Today).days == 0):
                    target_data['consulting_missed'] = '오늘'
                target_data['consultings'].sort(key = lambda x:(x['deadline'],-x['week_code']))
                target_data['consulting_num'] = len(target_data['consultings'])
                consulting_list.append(target_data)
        
        if(len(consulting_list)==0):
            return jsonify({'consulting': '없음'})
        else: 
            consulting_list.sort(key = lambda x:(-x['consulting_num'],x['consulting_missed']))
            return jsonify({'consulting': consulting_list})
            
    elif request.method =='POST':
        # 부재중 체크 
        received_missed = request.form['consulting_missed']
        target_consulting = Consulting.query.get_or_404(id)
        print(received_missed)
        print(target_consulting)
        if received_missed == "true":
            target_consulting.missed = Today
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
            new_history = ConsultingHistory(consulting_id=id,reason=received_reason,solution=received_solution,result=received_result,created_at=Today)
            target_consulting.done = 1
            db.session.add(new_history)
            db.session.commit()
            return{'result':'상담일지 저장 완료'}
    
# 완성 한 상담 목록 
@bp.route("done_consulting/<int:id>", methods=['GET','POST'])
def done_consulting(id):
    if request.method == 'GET':
        my_students = callapi.get_students(id)
        consulting_list = []
        for student in my_students:
            consultings = Consulting.query.filter((Consulting.student_id==student['register_no']) & (Consulting.done == 1)).all()
            target_data = {}
            target_data['s_id'] = student['register_no']
            target_data['name'] = student['name'] + '(' + student['origin'] + ')'
            target_data['mobileno'] = student['mobileno']
            target_data['reco_book_code'] = student['reco_book_code']      
            target_data['consultings'] = []
            for consulting in consultings:
                consulting_data = {}
                consulting_data['history'] = ConsultingHistory(ConsultingHistory.consulting_id  == consulting.id).first()
                category = ConsultingCategory.query.filter(ConsultingCategory.id == consulting.category_id).first()
                if(consulting.category_id < 101):
                    consulting_data['category'] = str(consulting.week_code) + '주 미학습 상담 진행건 '
                    consulting_data['contents'] = category.name +' '+ consulting.contents
                else:
                   consulting_data['category'] = category.name
                   consulting_data['contents'] = consulting.contents
                target_data['consultings'].append(consulting_data)
            
            if(len(target_data['consultings'])!=0):
                target_data['consultings'].sort(key = lambda x:(-x['week_code']))
                target_data['consulting_num'] = len(target_data['consultings'])
                consulting_list.append(target_data)
        
        if(len(consulting_list)==0):
            return jsonify({'consulting_history': '없음'})
        else: 
            consulting_list.sort(key = lambda x:(-x['consulting_num']))
            return jsonify({'consulting_history': consulting_list})
            
  

# 선생님 문의 저장 
@bp.route('/question', methods=['POST'])
def request_question():
    if request.method == 'POST':
        question_category = request.form['question_category']
        title = request.form['question_title']
        contents = request.form['question_contents']
        teacher = session['user_registerno']
        create_date = datetime.now().date()

        if question_category == '일반':
            new_question = Question(category=0,title=title,contents=contents,teacher_id=teacher,create_date=create_date)
        elif question_category == '이반':
            ban_id = request.form['ban_id']
            student_id = request.form['target_student'] 
            new_ban = request.form['new_ban_id']
            new_question = Question(category=2,title=title,contents=contents,teacher_id=teacher,ban_id=ban_id,student_id=student_id,new_ban_id=new_ban,create_date=create_date)
        elif question_category == '퇴소':
            ban_id = request.form['o_ban_id']
            student_id = request.form['o_target_student'] 
            new_question = Question(category=1,title=title,contents=contents,teacher_id=teacher,ban_id=ban_id,student_id=student_id,create_date=create_date)
        elif question_category == '취소/환불':
            ban_id = request.form['o_ban_id']
            student_id = request.form['o_target_student'] 
            new_question = Question(category=3,title=title,contents=contents,teacher_id=teacher,ban_id=ban_id,student_id=student_id,create_date=create_date)
        
        db.session.add(new_question)
        db.session.commit()
        return redirect('/')

# 본원 답변 조회 
@bp.route('/question/<int:id>', methods=['GET'])
def answer(id):
    if request.method == 'GET':
        q = Question.query.filter(Question.id == id).all()[0]
        teacher_info = callapi.get_teacher_info(session['user_id'])
        a = Answer.query.filter(Answer.question_id == q.id).all()
        return_data = {}
        return_data['category'] = '일반문의' if q.category == 0 else '퇴소 요청' if q.category == 1 else '이반 요청'if q.category == 2 else '취소/환불 요청' 
        return_data['title'] = q.title
        return_data['contents'] = q.contents
        return_data['create_date'] = q.create_date.strftime('%Y-%m-%d')
        return_data['teacher'] = teacher_info['name']
        return_data['teacher_e'] = teacher_info['engname']
        return_data['answer'] = a.content if len(a)  > 0 else '✖️'
        return_data['answer_at'] = a.created_at if len(a) > 0  else '✖️'
        return_data['reject'] = a.reject_code if q.category != 0 and len(a) > 0 else ''
         
        if q.category != 0:
            s = callapi.get_student_info(q.student_id )
            b = callapi.get_ban(q.ban_id )    

            return_data['student'] = s['name']
            return_data['student_origin'] = s['origin']
            return_data['ban'] = b['ban_name']

        return jsonify(return_data)
                    




# 문의 / 답변 조회 
# @bp.route('/question/<int:id>', methods=['GET','POST'])
# def question(id):
#     question = Question()
#     if request.method == 'GET':
#         return hello
