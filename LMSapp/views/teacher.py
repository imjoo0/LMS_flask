import callapi
import pymysql
import json
from LMSapp.views import *
from LMSapp.models import *
from flask import current_app, session
from flask import Blueprint, render_template, jsonify, request, redirect, url_for, flash
from datetime import datetime, timedelta, date
import pytz
# file-upload 로 자동 바꿈 방지 모듈
from LMSapp.views import common
from LMSapp.views.main_views import authrize
import requests 
import sys
import pandas as pd
from urllib.parse import quote
from flask_socketio import join_room, emit
from LMSapp import socketio
bp = Blueprint('teacher', __name__, url_prefix='/teacher')

# 선생님 메인 페이지
@bp.route("/", methods=['GET'])
@authrize
def home(u):
    if request.method == 'GET':
        print(Today)
        teacher_info = User.query.filter(User.user_id == u['user_id']).first()
        return render_template('teacher.html', user=teacher_info)
# 차트 관련
@bp.route('/get_banstudents_data', methods=['GET'])
@authrize
def get_banstudents_data(u):
    global ban_data 
    ban_data = []
    ban_id_set = set()
    all_data = callapi.call_api(u['id'], 'get_myban_student_online')
    takeovers = TakeOverUser.query.filter(TakeOverUser.teacher_id == u['id']).all()
    if len(takeovers) != 0 :
        for takeover in takeovers:
            all_data += callapi.call_api(takeover.takeover_id, 'get_myban_student_online')
    # 중복된 ban_id를 제거하기 위해 set을 사용하여 고유한 값만 유지합니다.
    for data in all_data:
        ban_id = data['ban_id']
        startdate = data['startdate']
        if ban_id not in ban_id_set:
            ban_data.append({'ban_id': ban_id, 'startdate': startdate})
            ban_id_set.add(ban_id)
    return jsonify({'all_data':all_data})

# 차트 관련
@bp.route('/get_teacher_data', methods=['GET'])
@authrize
def get_teacher_data(u):
    all_consulting = []
    all_task = []
    all_consulting_category = []
    # 상담
    for ban in ban_data:
        query = '''
        SELECT consulting.origin, consulting.student_name, consulting.student_engname, consulting.id, consulting.ban_id, consulting.student_id, consulting.done, consultingcategory.id as category_id, consulting.week_code, consultingcategory.name as category, consulting.contents, consulting.startdate, consulting.deadline, consulting.missed, consulting.created_at, consulting.reason, consulting.solution, consulting.result
        FROM consulting
        LEFT JOIN consultingcategory ON consulting.category_id = consultingcategory.id
        WHERE (consulting.category_id < 100 AND consulting.done = 0 AND %s <= consulting.startdate AND consulting.startdate <= curdate() and consulting.ban_id=%s)
        OR (consulting.category_id < 100 AND consulting.done != 0 AND consulting.ban_id=%s)
        OR (consulting.category_id >= 100 AND consulting.startdate <= curdate() and consulting.ban_id=%s)
        '''
        params = ({ban['startdate']},ban['ban_id'],ban['ban_id'],ban['ban_id'], ) 
        all_consulting.extend(common.db_connection.execute_query(query, params))

        query = "select taskban.id,taskban.ban_id, taskcategory.name as category, task.contents, task.deadline,task.priority,taskban.done,taskban.created_at from taskban left join task on taskban.task_id = task.id left join taskcategory on task.category_id = taskcategory.id where ( (task.category_id = 11) or ( (task.cycle = %s) or (task.cycle = 0) ) ) and ( task.startdate <= curdate() and curdate() <= task.deadline ) and taskban.ban_id=%s;"
        params = (today_yoil,ban['ban_id'],)
        all_task.extend(common.db_connection.execute_query(query, params))  

    query = "SELECT * FROM LMS.consultingcategory;"
    all_consulting_category = common.db_connection.execute_query(query, )
            
    return jsonify({'all_consulting':all_consulting,'all_task':all_task,'all_consulting_category':all_consulting_category})

# 문의 리스트 / 문의 작성   
@socketio.on('new_question',namespace='/question') 
def handle_new_question(q_id):
    emit('new_question', {'message': 'New question registered', 'q_id': q_id}, broadcast=True, namespace='/question')

@bp.route("/get_questiondata", methods=['GET'])
@authrize
def get_questiondata(u):
    query = '''
    SELECT question.id,question.category,question.title,question.contents,question.contents as question_contents,question.teacher_id,question.ban_id,question.student_id,question.create_date,question.answer,question.consulting_history,question.mobileno,consulting.solution,consulting.contents as consulting_contents,consulting.reason,consulting.week_code,consultingcategory.name as consulting_category,consulting.category_id as consulting_categoryid,consulting.created_at as consulting_created_at ,
    answer.id as answer_id, user.eng_name as answerer, answer.title as answer_title,answer.content as answer_contents ,answer.created_at as answer_created_at,answer.reject_code as answer_reject_code
    from LMS.question
    left join answer on answer.question_id = question.id 
    left join user on user.id = answer.writer_id 
    left join consulting on question.consulting_history = consulting.id 
    left join consultingcategory on consulting.category_id = consultingcategory.id 
    where question.teacher_id = %s
    ORDER BY 
    question.answer,
    question.create_date DESC;
    '''
    params = (u['id'], )
    question = common.db_connection.execute_query(query, params)
    query = 'select attachment.question_id,attachment.file_name,attachment.id,attachment.is_answer from attachment LEFT JOIN question on attachment.question_id = question.id where question.teacher_id = %s ORDER BY question.category,question.answer, question.create_date;'
    attach = common.db_connection.execute_query(query, params)
    
    return jsonify({'question':question,'attach':attach})

@bp.route('/question', methods=[ 'POST'])
@authrize
def question(u):
    if request.method == 'POST':
        URI = 'http://118.131.85.245:9888/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2'
        category = int(request.form['question_category'])
        title = request.form['question_title']
        contents = request.form['question_contents']
        teacher = u['id']
        ban_id = request.form['my_ban_list']
        student_id = request.form['student_list']
        teacher_mobileno = request.form.get('teacher_mobileno', None)
        teacher_name = request.form.get('teacher_name', None)
        teacher_engname = request.form.get('teacher_engname', None)
        create_date = datetime.now()
        q_type = 1
        payloadText = teacher_name+'( '+ teacher_engname +' )님으로 부터 ' 
        if category == 2 or category == 1:
            Synologytoken = '"PBj2WnZcmdzrF2wMhHXyzafvlF6i1PTaPf5s4eBuKkgCjBCOImWMXivfGKo4PQ8q"'
            payloadText += '이반 / 퇴소 요청이 등록되었습니다 \n' 
            history_id = request.form['h_select_box']
            new_question = Question(consulting_history=history_id, category=category, title=title, contents=contents,teacher_id=teacher,mobileno=teacher_mobileno, ban_id=ban_id, student_id=student_id, create_date=create_date, answer=0)
        else:
            if category == 3:
                q_type = 3
                # # 영교부에서 재택T 문의 관리 하는 시놀로지 채팅 방 token 값 받아야 함. 
                Synologytoken = '"PBj2WnZcmdzrF2wMhHXyzafvlF6i1PTaPf5s4eBuKkgCjBCOImWMXivfGKo4PQ8q"'
                payloadText += '일반 문의가 등록되었습니다 \n' 
            elif category == 4: 
                q_type = 4
                payloadText += '기술 문의가 등록되었습니다 \n' 
                Synologytoken = '"iMUOvyhPeqCzEeBniTJKf3y6uflehbrB2kddhLUQXHwLxsXHxEbOr2K4qLHvvEIg"'
            elif category ==5: 
                q_type = 5
                payloadText += '내근티처 문의가 등록되었습니다 \n' 
                Synologytoken = '"MQzg6snlRV4MFw27afkGXRmfghHRQVcM77xYo5khI8Wz4zPM4wLVqXlu1O5ppWLv"'
            new_question = Question(category=category, title=title, contents=contents,teacher_id=teacher,mobileno=teacher_mobileno, ban_id=ban_id, student_id=student_id, create_date=create_date, answer=0)
        db.session.add(new_question)
        db.session.commit()
        handle_new_question(new_question.id)
        
        payloadText += '제목: `{}`\n\n```{}```'.format(title, contents.replace('\r\n', '\n\n') )
        link_url = '\n[링크 바로가기]http://purpleacademy.net:6725/manage/?q_id={}&q_type={}'.format(new_question.id,q_type)
        link_url = link_url.replace('%', '%25')
        encoded_link_url  = quote(link_url)  # payloadText 인코딩
        payloadText += encoded_link_url
        files = request.files.getlist('file_upload')
        for file in files:
            common.save_attachment(file, new_question.id, 0)
        # requestURI = URI + '&token=' + Synologytoken + '&payload={"text": "' + payloadText + '"}'
        # try:
        #     response = requests.get(requestURI)
        #     response.raise_for_status()
        #     print(f"statusCode: {response.status_code}")
        # except requests.exceptions.RequestException as e:
        #     print("시놀로지 전송 실패")
        #     print(e)
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
        URI = 'http://118.131.85.245:9888/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2'
        Synologytoken = '"PBj2WnZcmdzrF2wMhHXyzafvlF6i1PTaPf5s4eBuKkgCjBCOImWMXivfGKo4PQ8q"'
        target_consulting = Consulting.query.get_or_404(id)
        # 상담 사유
        received_reason = request.form['consulting_reason']
        # 제공 가이드
        received_solution = request.form['consulting_solution']
        if(is_done == 0):
            target_consulting.reason = received_reason
            target_consulting.solution = received_solution
            target_consulting.created_at = Today
            if(target_consulting.week_code < 0):
                payloadText = target_consulting.contents + ' 상담 작성 알람 \n' 
                payloadText += '내용: `{}`\n\n```{}```'.format(received_reason, received_solution.replace('\r\n', '\n\n') )
                # link_url = '\n[링크 바로가기]http://purpleacademy.net:6725/manage/?c_id={}'.format(new_question.id,q_type)
                # encoded_link_url  = quote(link_url)  # payloadText 인코딩
                # payloadText += encoded_link_url
                requestURI = URI + '&token=' + Synologytoken + '&payload={"text": "' + payloadText + '"}'
                try:
                    response = requests.get(requestURI)
                    response.raise_for_status()
                    print(f"statusCode: {response.status_code}")
                except requests.exceptions.RequestException as e:
                    print("시놀로지 전송 실패")
                    print(e)
        else:
            if(received_reason != "작성 내역이 없습니다"):
                target_consulting.reason = received_reason
            if(received_solution != "작성 내역이 없습니다"):    
                target_consulting.solution = received_solution
        target_consulting.done = 1
        db.session.commit()
        
    return{'result':'완료'}

# 추가 상담 실행 함수 
@bp.route("/plus_consulting/<int:student_id>/<int:b_id>", methods=['POST'])
def plus_consulting(student_id,b_id):
    t_id = request.form['t_id']
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
    # consulting_category
    consulting_category = request.form['consulting_category']
    # 상담생성 
    newconsulting =  Consulting(teacher_id=t_id,ban_id=b_id,category_id=consulting_category,student_id=student_id,student_name=student_name,student_engname=student_engname,origin=origin,contents=received_contents,startdate=Today,deadline=Today,done=1,missed=standard,reason=received_reason,solution=received_solution,created_at=Today)
    db.session.add(newconsulting)
    db.session.commit()
    return{'result':'추가 상담 저장 완료'}


@bp.route("/take_over_user", methods=['GET'])
@authrize
def take_over_user(u):
    take_over_user = {}
    query = 'SELECT id, user_id, name, eng_name from LMS.user where user.mobileno = %s and id != %s;'
    params = ('내근',u['id'], )
    take_over_user = common.db_connection.execute_query(query, params)
        
    return{'take_over_user':take_over_user}

@bp.route("/take_over_post", methods=['POST'])
@authrize
def take_over_post(u):
    if request.method =='POST':
        teacher_id = request.form['teacher_id']
        teacher_user = request.form['teacher_user']
        history_takes = TakeOverUser.query.filter(TakeOverUser.teacher_id == teacher_id).all()
        if len(history_takes) != 0:
            for history in history_takes:
                new_take = TakeOverUser(teacher_id=u['id'], takeover_id=history.takeover_id, takeover_user=history.takeover_user)
                db.session.add(new_take)
        new_take = TakeOverUser(teacher_id=u['id'], takeover_id=teacher_id, takeover_user=teacher_user)
        db.session.add(new_take)
        db.session.commit()
        return jsonify({'result': '퇴사 처리 완료'})

