import callapi
import pymysql
import json
from LMSapp.views import *
from LMSapp.models import *
from flask import current_app, session
from flask import Blueprint, render_template, jsonify, request, redirect, url_for, flash
from datetime import datetime, timedelta, date
# file-upload 로 자동 바꿈 방지 모듈
from LMSapp.views import common
from LMSapp.views.main_views import authrize
import requests 
import sys

# 양방향 연결 
# from LMSapp import socketio

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
# @socketio.on('connect')
# def handle_connect():
#     print('Client connected')
    
# @socketio.on('disconnect')
# def handle_disconnect():
#     print('Client disconnected')

# def get_new_consulting_data(consulting_id):
#         # 데이터베이스에서 consulting_id에 해당하는 새로운 상담 데이터 조회
#         db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS', cursorclass=pymysql.cursors.DictCursor)
#         try:
#             with db.cursor() as cur:
#                 cur.execute("select consulting.student_id, consulting.origin, consulting.student_name, consulting.student_engname,consulting.id,consulting.ban_id, consulting.student_id, consulting.done, consultingcategory.id as category_id, consulting.week_code, consultingcategory.name as category, consulting.contents, consulting.startdate,consulting.deadline, consulting.missed, consulting.created_at, consulting.reason, consulting.solution, consulting.result from consulting left join consultingcategory on consulting.category_id = consultingcategory.id where startdate <= %s and id = %s", ((Today,consulting_id,)))
#                 new_consulting = cur.fetchone()
#         except Exception as e:
#             print(e)
#         finally:
#             db.close()

#         return new_consulting



# @authrize
# def some_view_function(u):
#     handle_database_notification(u['id'])

# def handle_database_notification(user_id):
#     # 데이터베이스 연결 설정
#     with current_app.app_context():
#         db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS', cursorclass=pymysql.cursors.DictCursor)
#         db.autocommit(True)

#         with db.cursor() as cur:
#             # 변경 이벤트 감지를 위한 SQL 알림 설정
#             cur.execute("LISTEN consulting_notification;")
#             cur.execute("LISTEN task_notification;")
#             while True:
#                 db.poll()
#                 while db.notifies:
#                     notify = db.notifies.pop(0)
#                     table_name = notify.channel.split('_')[0]  # 알림 채널에서 테이블 이름 추출
#                     if table_name == 'consulting':
#                         # 변경 알림을 클라이언트에게 전송
#                         socketio.emit('consulting_change', {'message': 'Consulting data changed'}, broadcast=True)
#                         if notify.payload.get('teacher_id') == user_id:
#                             # 변경된 데이터를 페이지로 전달
#                             new_consulting = get_new_consulting_data(notify.payload['consulting_id'])
#                             socketio.emit('new_consulting', {'data': new_consulting}, broadcast=True)
#                     # elif table_name == 'task':
#                     #     # 변경 알림을 클라이언트에게 전송
#                     #     socketio.emit('task_change', {'message': 'Task data changed'}, broadcast=True)
#                     #     if notify.payload.get('teacher_id') == u['id']:
#                     #         # 변경된 데이터를 페이지로 전달
#                     #         new_task = get_new_task_data(notify.payload['task_id'])
#                     #         socketio.emit('new_task', {'data': new_task}, broadcast=True)


# # 데이터베이스 변경 이벤트 감지를 위한 스레드 시작
# import threading
# notification_thread = threading.Thread(target=handle_database_notification)
# notification_thread.start()

# # 데이터베이스 변경 이벤트 감지를 위한 스레드 시작
# import threading
# notification_thread = threading.Thread(target=handle_database_notification)
# notification_thread.start()

# 선생님 메인 페이지
@bp.route("/", methods=['GET'])
@authrize
def home(u):
    if request.method == 'GET':
        teacher_info = callapi.purple_info(u['user_id'], 'get_teacher_info')
        return render_template('teacher.html', user=teacher_info)
    
@bp.route('/get_mybans', methods=['GET'])
@authrize
def get_mybans(u):
    all_consulting = []
    all_task = []
    ban_data = callapi.call_api(u['user_id'], 'get_mybans_new')
    my_students = callapi.call_api(u['id'], 'get_mystudents_new')
    db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00',port=3306, database='LMS', cursorclass=pymysql.cursors.DictCursor)
    try:
        with db.cursor() as cur:
            # 상담
            cur.execute("select consulting.student_id, consulting.origin, consulting.student_name, consulting.student_engname,consulting.id,consulting.ban_id, consulting.student_id, consulting.done, consultingcategory.id as category_id, consulting.week_code, consultingcategory.name as category, consulting.contents, consulting.startdate,consulting.deadline, consulting.missed, consulting.created_at, consulting.reason, consulting.solution, consulting.result from consulting left join consultingcategory on consulting.category_id = consultingcategory.id where startdate <= %s and teacher_id=%s", (Today,u['id'],))
            all_consulting = cur.fetchall()
            # 업무
            cur.execute("select taskban.id,taskban.ban_id, taskcategory.name as category, task.contents, task.deadline,task.priority,taskban.done,taskban.created_at from taskban left join task on taskban.task_id = task.id left join taskcategory on task.category_id = taskcategory.id where ( (task.category_id = 11) or ( (task.cycle = %s) or (task.cycle = 0) ) ) and ( task.startdate <= %s and %s <= task.deadline ) and taskban.teacher_id=%s;", (today_yoil, Today, Today,u['id'],))
            all_task = cur.fetchall()
    except:
        print('err:', sys.exc_info())
    finally:
        db.close()
    return jsonify({'ban_data':ban_data,'all_consulting':all_consulting,'all_task':all_task,'my_students':my_students})

# @bp.route('/get_mystudents', methods=['GET'])
# @authrize
# def get_mystudents(u):
#     my_students = callapi.purple_ban(u['id'], 'get_mystudents_new')
#     if(my_students):
#         return jsonify({'my_students':my_students})
#     return jsonify({'my_students':'없음'})

# 문의 리스트 / 문의 작성    
@bp.route('/question', methods=['GET', 'POST'])
@authrize
def question(u):
    if request.method == 'GET':
        data = []
        my_questions = Question.query.filter(Question.teacher_id == u['id']).all()
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
            qdata['consluting'] = q.consulting_history
            if (q.answer != 0 and q.qa is not None):
                qdata['answer_data'] = {}
                qdata['answer_data']['id']=q.qa.id
                qdata['answer_data']['content']=q.qa.content
                qdata['answer_data']['reject_code']=q.qa.reject_code
                qdata['answer_data']['created_at']=q.qa.created_at.strftime('%Y-%m-%d')
            if (q.attachments is None):
                qdata['attach'] = "없음"
            else:
                my_attachments = Attachments.query.filter(Attachments.question_id == q.id).all()
                qdata['attach'] = []
                for qa in my_attachments:
                    qdata['attach'].append({
                        'id': qa.id,
                        'file_name':qa.file_name
                    })
            data.append(qdata)
        return data
    elif request.method == 'POST':
        URI = 'http://118.131.85.245:9888/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2'
        # groupToken = {
        #         '행정파트': '"PBj2WnZcmdzrF2wMhHXyzafvlF6i1PTaPf5s4eBuKkgCjBCOImWMXivfGKo4PQ8q"',
        #         '내근티처': '"MQzg6snlRV4MFw27afkGXRmfghHRQVcM77xYo5khI8Wz4zPM4wLVqXlu1O5ppWLv"',
        #         '개발관리': '"iMUOvyhPeqCzEeBniTJKf3y6uflehbrB2kddhLUQXHwLxsXHxEbOr2K4qLHvvEIg"',
        # }
        category = int(request.form['question_category'])
        title = request.form['question_title']
        contents = request.form['question_contents']
        teacher = u['id']
        ban_id = request.form['my_ban_list']
        student_id = request.form['student_list']
        teacher_mobileno = request.form.get('teacher_mobileno', None)
        teacher_name = request.form.get('teacher_name', None)
        teacher_engname = request.form.get('teacher_engname', None)
        create_date = datetime.now().date()
        payloadText  = teacher_name+'( '+ teacher_engname +' )님으로 부터 ' 
        # 첨부 파일 처리
        if category == 0:
            # 영교부에서 재택T 문의 관리 하는 시놀로지 채팅 방 token 값 받아야 함. 
            Synologytoken = '"PBj2WnZcmdzrF2wMhHXyzafvlF6i1PTaPf5s4eBuKkgCjBCOImWMXivfGKo4PQ8q"'
            payloadText += '일반 문의가 등록되었습니다 \n' 
            new_question = Question(category=category, title=title, contents=contents,teacher_id=teacher,mobileno=teacher_mobileno, ban_id=ban_id, student_id=student_id, create_date=create_date, answer=0)
        elif category == 4: 
            payloadText += '기술 문의가 등록되었습니다 \n' 
            Synologytoken = '"iMUOvyhPeqCzEeBniTJKf3y6uflehbrB2kddhLUQXHwLxsXHxEbOr2K4qLHvvEIg"'
            new_question = Question(category=category, title=title, contents=contents,teacher_id=teacher,mobileno=teacher_mobileno, ban_id=ban_id, student_id=student_id, create_date=create_date, answer=0)
        elif category ==5: 
            payloadText += '내근티처 문의가 등록되었습니다 \n' 
            Synologytoken = '"MQzg6snlRV4MFw27afkGXRmfghHRQVcM77xYo5khI8Wz4zPM4wLVqXlu1O5ppWLv"'
            new_question = Question(category=category, title=title, contents=contents,teacher_id=teacher,mobileno=teacher_mobileno, ban_id=ban_id, student_id=student_id, create_date=create_date, answer=0)
        else:
            Synologytoken = '"PBj2WnZcmdzrF2wMhHXyzafvlF6i1PTaPf5s4eBuKkgCjBCOImWMXivfGKo4PQ8q"'
            payloadText += '이반 / 퇴소 요청이 등록되었습니다 \n' 
            history_id = request.form['h_select_box']
            new_question = Question(consulting_history=history_id, category=category, title=title, contents=contents,teacher_id=teacher,mobileno=teacher_mobileno, ban_id=ban_id, student_id=student_id, create_date=create_date, answer=0)
        payloadText += '제목: `'+ title +'`\n'+'```\n'+contents+'\n```'
        db.session.add(new_question)
        db.session.commit()
        files = request.files.getlist('file_upload')
        for file in files:
            common.save_attachment(file, new_question.id)
        requestURI = URI + '&token=' + Synologytoken + '&payload={"text": "' + payloadText + '"}'
        try:
            response = requests.get(requestURI)
            response.raise_for_status()
            print(f"statusCode: {response.status_code}")
        except requests.exceptions.RequestException as e:
            print("시놀로지 전송 실패")
            print(e)
        return jsonify({'result': '완료'})

# 오늘 해야 할 업무 완료 저장 
@bp.route("/task/<int:tb_id>", methods=['POST'])
def task(tb_id):
    if request.method =='POST':
        # tb_id = 완료한 taskban의 id
        target_taskban = TaskBan.query.get_or_404(tb_id)
        target_taskban.created_at = Today
        target_taskban.done = 1
        try:
            db.session.commit()
            return jsonify({'result': '완료'})
        except:
            return jsonify({'result': '업무완료 실패'})    

@bp.route("/consulting_missed/<int:id>", methods=['POST'])
def consulting_missed(id):
    if request.method =='POST':
        target_consulting = Consulting.query.get_or_404(id)
        target_consulting.missed = Today
        target_consulting.done = 0
        try:
            db.session.commit()
            return jsonify({'result': '완료'})
        except:
            return jsonify({'result': '부재중 처리 실패'})

# 상담일지 작성 및 수정  is_done=0 작성 / is_done=1 수정 
@bp.route("/consulting_history/<int:id>/<int:is_done>", methods=['POST'])
def consulting_history(id,is_done):
    if request.method =='POST':
        # 부재중 체크 (id-consulting_id)
        target_consulting = Consulting.query.get_or_404(id)
        # 상담 사유
        received_reason = request.form['consulting_reason']
        # 제공 가이드
        received_solution = request.form['consulting_solution']
        if(is_done == 0):
            target_consulting.reason = received_reason
            target_consulting.solution = received_solution
            target_consulting.created_at = Today
        else:
            if(received_reason !="작성 내역이 없습니다"):
                target_consulting.reason = received_reason
            if(received_solution !="작성 내역이 없습니다"):    
                target_consulting.solution = received_solution
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
    # 원생 정보
    student_name = request.form['student_name']
    student_engname = request.form['student_engname']
    origin = request.form['origin']
    # 상담생성 
    newconsulting =  Consulting(teacher_id=t_id,ban_id=b_id,category_id=110,student_id=student_id,student_name=student_name,student_engname=student_engname,origin=origin,contents=received_contents,startdate=Today,deadline=Today,done=1,missed=standard,reason=received_reason,solution=received_solution,created_at=Today)
    db.session.add(newconsulting)
    db.session.commit()
    return{'result':'추가 상담 저장 완료'}
