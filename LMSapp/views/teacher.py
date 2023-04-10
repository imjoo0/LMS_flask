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
import requests 
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
        teacher_info = callapi.purple_info(session['user_id'], 'get_teacher_info')
        return render_template('teacher.html', user=teacher_info)
    
# 차트 관련
@bp.route('/get_data', methods=['GET'])
def get_data():
    all_consulting = []
    all_task = []
    ban_data = callapi.purple_info(session['user_id'], 'get_mybans')
    switchstudent = []
    outstudent = []
    my_students = callapi.purple_info(session['user_id'], 'get_mystudents')
    print()
    if len(ban_data) != 0:
        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00',
                                port=3306, database='LMS', cursorclass=pymysql.cursors.DictCursor)
        try:
            with db.cursor() as cur:
                # 상담
                cur.execute("select consulting.id,consulting.ban_id, consulting.student_id, consulting.done, consultingcategory.id as category_id, consulting.week_code, consultingcategory.name as category, consulting.contents, consulting.deadline, consulting.missed, consulting.created_at, consulting.reason, consulting.solution, consulting.result from consulting left join consultingcategory on consulting.category_id = consultingcategory.id where startdate <= %s and teacher_id=%s", (Today,ban_data[0]['id'],))
                all_consulting = cur.fetchall()

                # 업무
                cur.execute("select taskban.id,taskban.ban_id, taskcategory.name as category, task.contents, task.deadline,task.priority,taskban.done,taskban.created_at from taskban left join task on taskban.task_id = task.id left join taskcategory on task.category_id = taskcategory.id where (task.cycle = %s or task.cycle = %s) and task.startdate <= %s and %s <= task.deadline and taskban.teacher_id=%s;", (today_yoil, 0, Today, Today,ban_data[0]['id'],))
                # cur.execute("select taskban.id,taskban.done,taskban.created_at from taskban left join task on taskban.task_id = task.id where (task.cycle = %s or task.cycle = %s) and task.startdate <= %s and %s <= task.deadline and taskban.teacher_id=%s;", (today_yoil, 0, Today, Today, session['user_registerno'],))
                all_task = cur.fetchall()
                
                cur.execute("SELECT ban_id, id, student_id FROM switchstudent WHERE teacher_id = %s GROUP BY ban_id, id, student_id;", (session['user_registerno'],))
                switchstudent = cur.fetchall()

                cur.execute("SELECT ban_id, id, student_id FROM outstudent WHERE teacher_id = %s GROUP BY ban_id, id, student_id;", (session['user_registerno'],))
                outstudent = cur.fetchall()
        except:
            print('err')
        finally:
            db.close()
        return jsonify({'switchstudent': switchstudent,'all_consulting':all_consulting,'all_task':all_task,'my_students':my_students,'outstudent':outstudent,'ban_data':ban_data})
    return jsonify({'ban_data':'없음'})

# 문의 리스트 / 문의 작성    
@bp.route('/question', methods=['GET', 'POST'])
def question():
    if request.method == 'GET':
        data = []
        my_questions = Question.query.filter(Question.teacher_id == session['user_registerno']).all()
        for q in my_questions:
            qdata = {}
            qdata['id'] = q.id
            qdata['category'] = q.category
            qdata['title'] = q.title
            qdata['contents'] = q.contents
            qdata['ban_id'] = q.ban_id
            qdata['student_id'] = q.student_id
            qdata['create_date'] = q.create_date.strftime('%Y-%m-%d')
            qdata['answer'] = q.answer
            # qdata['comments'] = len(q.qcomments)
            qdata['consluting'] = q.consulting_history
            # print(q.comments)
            # qdata['comment_data'] = q.comments
            # if(qdata['comments'] != 0):
            #     for comment in q.qcomments :
            #         qdata['comment_data'] = {}
            #         qdata['comment_data']['c_id'] = comment.id
            #         qdata['comment_data']['c_contents'] = comment.contents
            #         qdata['comment_data']['c_created_at'] = comment.created_at.strftime('%Y-%m-%d')
            #         qdata['comment_data']['parent_id'] = comment.parent_id
            #         if(q.teacher_id == comment.user_id):
            #             qdata['comment_data']['writer'] = '나'
            #         else:
            #             qdata['comment_data']['writer'] = '퍼플'
            if (q.answer != 0):
                qdata['answer_data'] = {}
                qdata['answer_data']['id']=q.qa.id
                qdata['answer_data']['title']=q.qa.title
                qdata['answer_data']['content']=q.qa.content
                qdata['answer_data']['reject_code']=q.qa.reject_code
                qdata['answer_data']['created_at']=q.qa.created_at.strftime('%Y-%m-%d')
            if (q.attachments is None):
                qdata['attach'] = "없음"
            else:
                qdata['attach'] = q.attachments.file_name
            data.append(qdata)
        return data

    elif request.method == 'POST':
        question_category = request.form['question_category']
        title = request.form['question_title']
        contents = request.form['question_contents']
        teacher = session['user_registerno']
        ban_id = request.form['ban_id']
        student_id = request.form['target_student']
        create_date = datetime.now().date()
        # 첨부 파일 처리
        file = request.files['file-upload']
        if question_category == '일반':
            cateory = 0
            new_question = Question(category=cateory, title=title, contents=contents,teacher_id=teacher, ban_id=ban_id, student_id=student_id, create_date=create_date, answer=0)
        else:
            history_id = request.form['consulting_history']
            if question_category == '퇴소':
                cateory = 1
            else:
                cateory = 2
            new_question = Question(consulting_history=history_id, category=cateory, title=title, contents=contents,teacher_id=teacher, ban_id=ban_id, student_id=student_id, create_date=create_date, answer=0)
        db.session.add(new_question)
        db.session.commit()
        common.save_attachment(file, new_question.id)

        URI = "http://118.131.85.245:9888/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2"
        Synologytoken = "PBj2WnZcmdzrF2wMhHXyzafvlF6i1PTaPf5s4eBuKkgCjBCOImWMXivfGKo4PQ8q"
        payloadText = ""

        requestURI = f"{URI}&token={Synologytoken}&payload=%7B%22text%22%3A%20%22{payloadText}%22%7D"

        try:
            response = requests.get(requestURI)
            if response.status_code == 200:
                print("시놀로지 전송 성공")
            else:
                print("시놀로지 전송 실패")
        except requests.exceptions.RequestException as e:
            print("시놀로지 전송 실패")
            print(e)

        return redirect('/')
# 오늘 해야 할 업무 완료 저장 
@bp.route("/task/<int:tb_id>", methods=['POST'])
def task(tb_id):
    if request.method =='POST':
        # tb_id = 완료한 taskban의 id
        target_taskban = TaskBan.query.get_or_404(tb_id)
        target_taskban.done = 1
        target_taskban.created_at = Today
        try:
            db.session.commit()
            return jsonify({'result': '완료'})
        except:
            return jsonify({'result': '업무완료 실패'})    
    
# 상담일지 작성 및 수정  is_done=0 작성 / is_done=1 수정 
@bp.route("/consulting_history/<int:id>/<int:is_done>", methods=['POST'])
def consulting_history(id,is_done):
    if request.method =='POST':
        # 부재중 체크 (id-consulting_id)
        received_missed = request.form['consulting_missed']
        target_consulting = Consulting.query.get_or_404(id)
        if received_missed == "true":
            target_consulting.missed = Today
            target_consulting.done = 0
            try:
                db.session.commit()
                return jsonify({'result': '완료'})
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
                if(received_reason !="작성 내역이 없습니다"):
                    target_consulting.reason = received_reason
                if(received_solution !="작성 내역이 없습니다"):    
                    target_consulting.solution = received_solution
                if(received_result !="작성 내역이 없습니다"):    
                    target_consulting.result = received_result
                if((received_reason !="작성 내역이 없습니다") or (received_solution !="작성 내역이 없습니다") or (received_result !="작성 내역이 없습니다")):
                    target_consulting.created_at = Today
            target_consulting.done = 1
            db.session.commit()
        return{'result':'완료'}

# 추가 상담 실행 함수 
@bp.route("/plus_consulting/<int:student_id>/<int:b_id>/<int:t_id>", methods=['POST'])
def plus_consulting(student_id,b_id,t_id):
    # 상담 제목
    received_contents = request.form['consulting_contents']
    # 상담 사유
    received_reason = request.form['consulting_reason']
    # 제공 가이드
    received_solution = request.form['consulting_solution']
    # 제공 결과
    received_result = request.form['consulting_result']
    # 상담생성 
    newconsulting =  Consulting(teacher_id=t_id,ban_id=b_id,category_id=110,student_id=student_id,contents=received_contents,startdate=Today,deadline=Today,done=1,missed=standard,reason=received_reason,solution=received_solution,result=received_result,created_at=Today)
    db.session.add(newconsulting)
    db.session.commit()
    return{'result':'추가 상담 저장 완료'}
