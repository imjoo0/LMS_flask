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

standard = datetime.strptime('11110101',"%Y%m%d").date()

# def task_cycle(){
#     UPDATE taskban A LEFT JOIN task B
#     ON A.task_id= B.id 
#     SET A.done = 0
#     WHERE date_format(A.created_at, '%Y-%m-%d') < date_format(curdate(),'%Y-%m-%d') AND B.cycle < 6 AND A.done = 1
# }

# 선생님 메인 페이지
# 테스트 계정 id : T1031 pw동일  
@bp.route("/", methods=['GET'])
def home():
    if request.method =='GET':
        teacher_info = callapi.get_teacher_info(session['user_id'])
        mystudents_info = callapi.get_mystudents(session['user_id'])
        total_student_num = len(mystudents_info)
        mybans_info = callapi.get_mybans(session['user_id'])
        ban_data = []
        #  상담 차트
        ttc = 0
        ttd = 0
        unlearned_ttc = 0
        unlearned_ttd = len(Consulting.query.filter(Consulting.category_id < 100).all())
        for b in mybans_info:
            data = {}
            data['name'] = b['name']
            data['semester'] = b['semester']
            data['total_student_num'] = b['total_student_num']
            data['out_s'] = len(OutStudent.query.filter(OutStudent.ban_id == b['register_no']).all())
            data['switch_s'] = len(SwitchStudent.query.filter(SwitchStudent.ban_id == b['register_no']).all())
            data['unlearned'] = len(Consulting.query.filter((b['register_no'] == Consulting.ban_id)&(Consulting.category_id < 100)).all()) 
            unlearned_ttc += data['unlearned']
            ttc += len(Consulting.query.filter(b['register_no'] == Consulting.ban_id).all())
            c = Consulting.query.filter((b['register_no'] == Consulting.ban_id)&(Consulting.done==1)).all()
            ttd += len(c)

            ban_data.append(data)

        if(ttc != 0):
            cp = round((ttd/ttc)*100)
        else:
            cp = 0
        if(unlearned_ttd != 0):
            unlearned_cp = round((unlearned_ttc/unlearned_ttd)*100)
        else:
            unlearned_cp = 0
        
        # 졸업 / 퇴소 한 학생 
        outstudent_num = len(OutStudent.query.filter(OutStudent.teacher_id == teacher_info['register_no']).all())
        if(outstudent_num != 0):
            outstudent_num_p = round((outstudent_num / len(OutStudent.query.all()))*100)
        else:
            outstudent_num_p = 0
        # 이반 한 학생  
        switchstudent_num = len(SwitchStudent.query.filter(SwitchStudent.teacher_id == teacher_info['register_no']).all())
        if(switchstudent_num != 0):
            switchstudent_num_p = round((switchstudent_num / len(SwitchStudent.query.all()))*100)
        else:
            switchstudent_num_p = 0
        # 업무 개수
        total_todo = len(TaskBan.query.filter(TaskBan.teacher_id == teacher_info['register_no']).all())
        total_done = len((TaskBan.query.filter((TaskBan.teacher_id == teacher_info['register_no']) & ( TaskBan.done==1)) ).all())
        if(total_todo != 0):
            ttp = round(total_done/total_todo*100)
        else:
            ttp = 0
        
        my_questions = Question.query.filter(Question.teacher_id == session['user_registerno']).all()

        return render_template('teacher.html',unlearned_ttd=unlearned_ttd,unlearned_ttc=unlearned_ttc,unlearned_cp=unlearned_cp,cp=cp,ttc=ttc,ttd=ttd,total_todo=total_todo,total_done=total_done,ttp=ttp,switchstudent_num=switchstudent_num,switchstudent_num_p=switchstudent_num_p,outstudent_num_p=outstudent_num_p,outstudent_num=outstudent_num,total_student_num=total_student_num,user=teacher_info,my_bans=ban_data,students=mystudents_info, questions=my_questions)

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

# 오늘 해야 할 업무 카테고리
@bp.route("/<int:done_code>", methods=['GET','POST'])
def task(done_code):
    if request.method == 'GET':
        # done_code == 1 이면 완료한 업무 
        # done_code == 0 이면 오늘의 업무
        if(done_code == 1): 
            my_tasks = TaskBan.query.filter((TaskBan.teacher_id==session['user_registerno']) & (TaskBan.done == done_code) & (TaskBan.created_at == Today)).all()
        else: 
            my_tasks = TaskBan.query.filter((TaskBan.teacher_id==session['user_registerno']) & (TaskBan.done == done_code)).all()
        if len(my_tasks)!=0:
            tc = []
            for task in my_tasks:
                t = Task.query.filter((Task.id==task.task_id) & (Task.startdate <= current_time) & ( current_time <= Task.deadline ) & (Task.cycle == today_yoil or Task.cycle == 0)).first()
                # 오늘의 업무만 저장 
                if t != None:
                    tc.append(t)
            
            tc = list(set(tc))
            if(len(tc) == 0 ):
                target_task = '없음'
                category_set = '없음'
            else:
                # 우선순위 정렬 
                tc.sort(key=lambda x : (-x.priority, x.deadline)) 
                target_task = []
                category_set = []
                for task in tc:
                    category_set.append(str(task.category_id) +'@'+(TaskCategory.query.filter(TaskCategory.id == task.category_id).first().name))
                    task_data = {}
                    task_data['category'] = task.category_id
                    task_data['contents'] = task.contents
                    task_data['url'] = task.url
                    task_data['priority'] = task.priority
                    task_data['deadline'] = task.deadline.strftime('%Y-%m-%d')
                    if(done_code == 0):
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
                category_set = list(set(category_set))
        else: 
            category_set = '없음'
            target_task = '없음'
        return jsonify({'task_category' : category_set,'target_task':target_task})
        
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

# 선생님이 담당 중인 반 학생중 상담을 하지 않은 학생(is_done = 0) 상담을 한 학생(is_done = 1) 정보
@bp.route("/mystudents/<int:ban_id>/<int:is_done>", methods=['GET'])
def mystudents(ban_id,is_done):
    if request.method == 'GET':
        # 오늘의 부재중 
        if ban_id == 1:
            my_students = callapi.get_mystudents(session['user_id'])
            consulting_student_list = []
            for student in my_students:
                consultings = Consulting.query.filter((Consulting.student_id==student['register_no']) & (Consulting.done == is_done)  & (Consulting.missed == Today) & (Consulting.startdate <= current_time) ).all()
                if(len(consultings) != 0):
                    target_data = {}
                    target_data['s_id'] = student['register_no']
                    target_data['name'] = student['name'] + '(' + student['origin'] + ')'
                    target_data['mobileno'] = student['mobileno']
                    target_data['reco_book_code'] = '-'
                    target_data['consulting_num'] = len(consultings)
                    consulting_student_list.append(target_data)
        else:
            my_students = callapi.get_students(ban_id)
            consulting_student_list = []
            for student in my_students:
                consultings = Consulting.query.filter((Consulting.student_id==student['register_no']) & (Consulting.done == is_done)  & (Consulting.startdate <= current_time) ).all()
                if(len(consultings) != 0):
                    target_data = {}
                    target_data['s_id'] = student['register_no']
                    target_data['name'] = student['name'] + '(' + student['origin'] + ')'
                    target_data['mobileno'] = student['mobileno']
                    target_data['reco_book_code'] = student['reco_book_code']
                    target_data['consulting_num'] = len(consultings)
                    consulting_student_list.append(target_data)
        if(len(consulting_student_list) != 0):
            consulting_student_list.sort(key = lambda x:(-x['consulting_num']))
            return jsonify({'consulting_student_list': consulting_student_list})
        else:
            return jsonify({'consulting_student_list': '없음'})

# 학생에게 해야할 상담 목록 ( is_done = 0 ) 상담을 한 목록 (is_done = 1)
@bp.route("/consulting/<int:id>/<int:is_done>", methods=['GET','POST'])
def consulting(id,is_done):
    if request.method == 'GET':
        # (id-student_id)
        if is_done == 0:
            consultings = Consulting.query.filter((Consulting.student_id==id) & (Consulting.done == is_done)  & (Consulting.startdate <= current_time) & ( current_time <= Consulting.deadline )).all()
        else :
            consultings = Consulting.query.filter((Consulting.student_id==id) & (Consulting.done == is_done) & (Consulting.startdate <= current_time)).all()
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
                    h = ConsultingHistory.query.filter(ConsultingHistory.consulting_id == consulting.id).first()
                    consulting_data['history_reason'] = h.reason
                    consulting_data['history_solution'] = h.solution
                    consulting_data['history_result'] = h.result
                    consulting_data['history_created'] = h.created_at.strftime('%Y-%m-%d')
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
            
            target_consulting_history = ConsultingHistory.query.filter(ConsultingHistory.consulting_id == id).first()
            if((is_done == 0) and (target_consulting_history == None)):
                new_history = ConsultingHistory(consulting_id=id,reason=received_reason,solution=received_solution,result=received_result,created_at=Today)
                db.session.add(new_history)
            else:
                if(received_reason !="noupdate"):
                    target_consulting_history.reason = received_reason
                if(received_solution !="noupdate"):    
                    target_consulting_history.solution = received_solution
                if(received_result !="noupdate"):    
                    target_consulting_history.result = received_result
                if((received_reason !="noupdate") or (received_solution !="noupdate") or (received_result !="noupdate")):
                    target_consulting_history.created_at = Today
            target_consulting.done = 1
            db.session.commit()
            return{'result':'상담일지 저장 완료'}
       
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
            new_question = Question(category=0,title=title,contents=contents,teacher_id=teacher,create_date=create_date,answer=0)
        elif question_category == '이반':
            ban_id = request.form['ban_id']
            student_id = request.form['target_student'] 
            new_ban = request.form['new_ban_id']
            new_question = Question(category=2,title=title,contents=contents,teacher_id=teacher,ban_id=ban_id,student_id=student_id,new_ban_id=new_ban,create_date=create_date,answer=0)
        elif question_category == '퇴소':
            ban_id = request.form['o_ban_id']
            student_id = request.form['o_target_student'] 
            new_question = Question(category=1,title=title,contents=contents,teacher_id=teacher,ban_id=ban_id,student_id=student_id,create_date=create_date,answer=0)
        elif question_category == '취소/환불':
            ban_id = request.form['o_ban_id']
            student_id = request.form['o_target_student'] 
            new_question = Question(category=3,title=title,contents=contents,teacher_id=teacher,ban_id=ban_id,student_id=student_id,create_date=create_date,answer=0)
        
        db.session.add(new_question)
        db.session.commit()
        return redirect('/')

# 본원 답변 조회 
@bp.route('/question/<int:id>', methods=['GET','POST'])
def question(id):
    if request.method == 'GET':
        q = Question.query.filter(Question.id == id).first()
        teacher_info = callapi.get_teacher_info_by_id(q.teacher_id)
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
        return_data['new_ban'] = q.new_ban_id
        if q.answer == 1 :return_data['answer'] = a.content
        else: return_data['answer'] = '✖️'
        if q.answer == 1:return_data['answer_at'] = a.created_at.strftime('%Y-%m-%d')
        else:return_data['answer_at'] = '✖️'
        if (q.category != 0 and q.answer == 1 and a.reject_code != 0): return_data['reject'] = '승인'
        elif(q.answer == 0): return_data['reject'] = '대기중'
        else: return_data['reject'] = '반려'
        if q.category != 0:
            s = callapi.get_student_info(q.student_id )
            b = callapi.get_ban(q.ban_id )    

            return_data['student'] = s['name']
            return_data['student_origin'] = s['origin']
            return_data['ban'] = b['ban_name']

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
                    
# 댓글 작성 / 조회 
@bp.route('/comment/<int:id>/<int:is_coco>', methods=['GET','POST'])
def comment(id,is_coco):
    if request.method == 'GET':
        q = Question.query.filter(Question.id == id).first()
        teacher_info = callapi.get_teacher_info_by_id(q.teacher_id)
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
        return_data['new_ban'] = q.new_ban_id
        if q.answer == 1 :return_data['answer'] = a.content
        else: return_data['answer'] = '✖️'
        if q.answer == 1:return_data['answer_at'] = a.created_at.strftime('%Y-%m-%d')
        else:return_data['answer_at'] = '✖️'
        if (q.category != 0 and q.answer == 1 and a.reject_code != 0): return_data['reject'] = '승인'
        elif(q.answer == 0): return_data['reject'] = '대기중'
        else: return_data['reject'] = '반려'
        if q.category != 0:
            s = callapi.get_student_info(q.student_id )
            b = callapi.get_ban(q.ban_id )    

            return_data['student'] = s['name']
            return_data['student_origin'] = s['origin']
            return_data['ban'] = b['ban_name']

        return jsonify(return_data)
    
    elif request.method == 'POST':
        # target_question = Question.query.get_or_404(id)
        comment_contents = request.form['comment_contents']
        try:
            new_comment = Comment(contents=comment_contents,user_id=session['user_registerno'],question_id=id,created_at=Today)
            db.session.add(new_comment)
            db.session.commit()
            return jsonify({'result': '댓글 작성 완료'})
        except:
            return jsonify({'result': '댓글 작성 실패'})
        
 