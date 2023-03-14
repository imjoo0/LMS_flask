from flask import Blueprint,render_template, jsonify, request,redirect,url_for,flash
from datetime import datetime, timedelta, date
# file-upload 로 자동 바꿈 방지 모듈 
from LMSapp.views import common

bp = Blueprint('teacher', __name__, url_prefix='/teacher')

from flask import session
from LMSapp.models import *
from LMSapp.views import *
import json
from config import pydbinfo
import pymysql
import callapi

current_time = datetime.now()
Today = current_time.date()
today_yoil = current_time.weekday() + 1

standard = datetime.strptime('11110101',"%Y%m%d").date()

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
    if request.method =='GET':
        teacher_info = callapi.purple_info(session['user_id'],'get_teacher_info')
        mystudents_info = callapi.purple_info(session['user_id'],'get_mystudents')
        total_student_num = len(mystudents_info)
        mybans_info = callapi.purple_ban(session['user_id'],'get_mybans')
        ban_data = []
        #  상담 차트
        ttc = 0
        ttd = 0
        unlearned_ttc = 0
        unlearned_ttd = len(Consulting.query.filter(Consulting.category_id < 100).all())
        for b in mybans_info:
            data = {}
            data['register_no'] = b['register_no']
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
        total_done = len(TaskBan.get_task_category(teacher_info['register_no'],1)['task_data'])
        total_todo = len(TaskBan.get_task_category(teacher_info['register_no'],0)['task_data']) + total_done
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
        mybans_info = callapi.purple_ban(session['user_id'],'get_mybans')

        db = pymysql.connect(**pydbinfo)
        try:
            with db.cursor() as cur:
                for ban in mybans_info:
                    temp = {}
                    # cur.execute(f"select id, ban_id, category_id, student_id, contents, date_format(startdate, '%Y-%m-%d') as startdate, date_format(deadline, '%Y-%m-%d') as deadline, week_code, done, missed from consulting where ban_id = {ban['register_no']};")
                    cur.execute(f"select count(*) as 'count', category_id from consulting where ban_id = {ban['register_no']} group by category_id")
                    temp['consulting'] = cur.fetchall().copy()

                    cur.execute(f"select count(*) as 'count', category from switchstudent where ban_id={ban['register_no']} group by category")
                    temp['switchstudent'] = cur.fetchall().copy()

                    alimnote = callapi.purple_info(ban['register_no'],'get_alimnote')
                    temp['alimnote'] = alimnote

                    result.append({ban['name']: temp.copy()})
                    #result.append(ban['register_no'])
        except:
            print('err')
        finally:
            db.close()

        return json.dumps(result)        

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
        db = pymysql.connect(**pydbinfo)
        mybans_info = callapi.purple_ban(session['user_id'],'get_mybans')
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
@bp.route("/mystudents/<int:ban_id>/<int:is_done>", methods=['GET'])
def mystudents(ban_id,is_done):
    if request.method == 'GET':
        # 오늘의 부재중 
        if ban_id == 1:
            my_students = callapi.purple_info(session['user_id'],'get_mystudents')
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
            my_students = callapi.purple_info(ban_id,'get_students')
            consulting_student_list = []
            for student in my_students:
                consultings = Consulting.query.filter((Consulting.student_id==student['register_no']) & (Consulting.done == is_done)  & (Consulting.startdate <= current_time) & (Consulting.missed != Today)).all()
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
                    h = ConsultingHistory.query.filter(ConsultingHistory.consulting_id == consulting.id).first()
                    consulting_data['history_id'] = h.id
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

# 추가 상담 실행 함수 
@bp.route("/plus_consulting/<int:student_id>/<int:b_id>", methods=['POST'])
def plus_consulting(student_id,b_id):
    if request.method =='POST':
         # 상담 사유
        received_contents = request.form['consulting_contents']
        # 상담부터 생성
        newconsulting =  Consulting(ban_id=b_id,category_id=110,student_id=student_id,contents=received_contents,startdate=Today,deadline=Today,done=0,missed=standard)
        db.session.add(newconsulting)
        db.session.commit()
        # 상담 사유
        received_reason = request.form['consulting_reason']
        # 제공 가이드
        received_solution = request.form['consulting_solution']
        # 제공 가이드
        received_result = request.form['consulting_result']
            
        new_history = ConsultingHistory(consulting_id=newconsulting.id,reason=received_reason,solution=received_solution,result=received_result,created_at=Today)
        db.session.add(new_history)
        newconsulting.done = 1
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
        # 첨부 파일 처리 
        file = request.files['file-upload']
        if question_category == '일반':
            cateory = 0
            new_question = Question(category=cateory,title=title,contents=contents,teacher_id=teacher,create_date=create_date,answer=0)
        else :
            ban_id = request.form['ban_id']
            student_id = request.form['target_student'] 
            history_id = request.form['consulting_history']
            if question_category == '퇴소':
                cateory = 1
            elif question_category == '이반':
                cateory = 2
            else:
                cateory = 3
            new_question = Question(consulting_history=history_id,category=cateory,title=title,contents=contents,teacher_id=teacher,ban_id=ban_id,student_id=student_id,create_date=create_date,answer=0)
        db.session.add(new_question)
        db.session.commit()
        common.save_attachment(file,new_question.id)
        return redirect('/')


    
 