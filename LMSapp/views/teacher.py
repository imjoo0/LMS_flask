import callapi
import pymysql
import json
from LMSapp.views import *
from LMSapp.models import *
from flask import current_app, session
from flask import Blueprint, render_template, jsonify, request, redirect, url_for, flash, send_file
from datetime import datetime, timedelta, date
import pytz
# file-upload 로 자동 바꿈 방지 모듈
from LMSapp.views import common
from LMSapp.views.main_views import authrize
import requests 
import sys
import config
import pandas as pd
from urllib.parse import quote
from flask_socketio import join_room, emit
from LMSapp import socketio

# 암호화 
from cryptography.fernet import Fernet
# 그래프 그리기 
import matplotlib.pyplot as plt
import numpy as np
import io
import base64

def encrypt(data, is_out_string=True):
    key = config.key
    f = Fernet(key)
    if isinstance(data, bytes):
        ou = f.encrypt(data) # 바이트형태이면 바로 암호화
    else:
        ou = f.encrypt(data.encode('utf-8')) # 인코딩 후 암호화
    if is_out_string is True:
        return ou.decode('utf-8') # 출력이 문자열이면 디코딩 후 반환
    else:
        return ou

def decrypt(data, is_out_string=True):
    key = config.key
    f = Fernet(key)
    if isinstance(data, bytes):
        ou = f.decrypt(data) # 바이트형태이면 바로 복호화
    else:
        ou = f.decrypt(data.encode('utf-8')) # 인코딩 후 복호화
    if is_out_string is True:
        return ou.decode('utf-8') # 출력이 문자열이면 디코딩 후 반환
    else:
        return ou

bp = Blueprint('teacher', __name__, url_prefix='/teacher')

# 선생님 메인 페이지
@bp.route("/", methods=['GET'])
@authrize
def home(u):
    if request.method == 'GET':
        teacher_info = User.query.filter(User.user_id == u['user_id']).first()
        consulting_categories = ConsultingCategory.query.filter(ConsultingCategory.id != 100).all()
        return render_template('teacher.html', user=teacher_info, consulting_categories=consulting_categories)

# 홈화면에 필요한 데이터  
@bp.route('/get_home_data', methods=['GET'])
@authrize
def get_home_data(u):
    current_time = datetime.utcnow()
    korea_timezone = pytz.timezone('Asia/Seoul')
    korea_time = current_time + timedelta(hours=9)
    korea_time = korea_timezone.localize(korea_time)

    Today = korea_time.date()
    today_yoil = korea_time.weekday() + 1
    standard = datetime.strptime('11110101', "%Y%m%d").date()

    unlearned_consulting = []
    task_ban = []
    task_consulting = []

    my_students = callapi.call_api(u['id'], 'get_myban_student_online')
    ban_data = callapi.call_api(u['id'],'get_mybanid')
    
    # 퇴사의 경우 강제로 퇴사한 선생님의 반을 다른 선생님의 반으로 편입시킬때 사용
    # takeovers = TakeOverUser.query.filter(TakeOverUser.teacher_id == u['id']).all()
    # takeovers_num = len(takeovers)
    # if takeovers_num != 0 :
    #     for takeover in takeovers:
    #         ban_data += callapi.call_api(takeover.takeover_user, 'get_mybanid')
    
    # 상담
    for ban in ban_data:
        # 상담 해야 하는 날짜가 오늘 이상인 경우 , 내가 담당한 반의 consulting 기록들을 가져옵니다 
        # 상담 요청일(startdate)가 반 시작일 ban['startdate']값보다 커야 합니다 .
        #  consulting.cateogry_id < 100 = 미학습 상담 ( 자동 생성 )
        # 상담 중 진행하지 않은 미학습 상담 기록만 가져옵니다 
        # 미학습 상담의 경우 반 시작일에 생성된 경우는 제외 합니다.

        query = '''
            SELECT consulting.origin, consulting.student_name, consulting.student_engname, consulting.id, consulting.ban_id, consulting.student_id, consulting.done, consultingcategory.id as category_id, consulting.week_code, consultingcategory.name as category, consulting.contents, consulting.startdate, consulting.deadline, consulting.missed, consulting.created_at, consulting.reason, consulting.solution, consulting.result
        FROM consulting
        LEFT JOIN consultingcategory ON consulting.category_id = consultingcategory.id
        WHERE (consulting.category_id < 100 AND consulting.done = 0 AND %s <= consulting.startdate AND consulting.startdate <= curdate() and consulting.ban_id=%s)
        '''
        params = ({ban['startdate']},ban['ban_id'], ) 
        unlearned_consulting = common.db_connection.execute_query(query, params)

        # 본원에서 요청한 상담을 업무로 가져옵니다 
        # 본원 요청 업무 : week_code < 0
        # 오늘 완료한 경우 가져옵니다 
        # 완료하지 않은 경우 가져옵니다 
        query = '''
        SELECT consulting.origin, consulting.student_name, consulting.student_engname, consulting.id, consulting.ban_id, consulting.student_id, consulting.done, consultingcategory.id as category_id, consulting.week_code, consultingcategory.name as category, consulting.contents, consulting.startdate, consulting.deadline, consulting.missed, consulting.created_at, consulting.reason, consulting.solution, consulting.result
        FROM consulting
        LEFT JOIN consultingcategory ON consulting.category_id = consultingcategory.id
        WHERE (consulting.week_code < 0 AND consulting.startdate <= curdate() AND consulting.ban_id=%s)
        AND ( (consulting.done = 0) OR (consulting.done = 1 AND consulting.created_at = CURDATE()) )
        '''
        params = (ban['ban_id'], ) 
        task_consulting = common.db_connection.execute_query(query, params)
        
        # 업무의 경우엔, task의 category 가 11 이라 상시 업무 인 경우 
        # 업무 cycle 이 오늘 요일이 된 경우 
        # 업무의 startdate가 오늘 이상인 경우 이고 deadline 을 넘기지 않은 경우 
        # 오늘 완수한 업무이거나 done이 0인 경우
        query = '''
        select taskban.id,taskban.ban_id, taskcategory.name as category, task.contents, task.deadline,task.priority,taskban.done,taskban.created_at 
        from taskban 
        left join task on taskban.task_id = task.id 
        left join taskcategory on task.category_id = taskcategory.id 
        where ( (task.category_id = 11) or ( (task.cycle = %s) or (task.cycle = 0) ) ) and ( task.startdate <= curdate() and curdate() <= task.deadline ) and taskban.ban_id=%s
        AND ( (taskban.done = 1 AND DATE(taskban.created_at) = CURDATE()) OR taskban.done = 0 );'''

        params = (today_yoil,ban['ban_id'],)
        task_ban = common.db_connection.execute_query(query, params)

    return jsonify({'my_students':my_students, 'unlearned_consulting':unlearned_consulting, 'task_consulting':task_consulting, 'task_ban':task_ban})


# 선생님의 업무와 상담 관련 데이터 
@bp.route('/get_teacher_data', methods=['GET'])
@authrize
def get_teacher_data(u):
    current_time = datetime.utcnow()
    korea_timezone = pytz.timezone('Asia/Seoul')
    korea_time = current_time + timedelta(hours=9)
    korea_time = korea_timezone.localize(korea_time)

    Today = korea_time.date()
    today_yoil = korea_time.weekday() + 1
    standard = datetime.strptime('11110101', "%Y%m%d").date()

    all_consulting = []
    all_task = []

    my_students = callapi.call_api(u['id'], 'get_myban_student_online')
    ban_data = callapi.call_api(u['id'],'get_mybanid')
    
    # 퇴사의 경우 강제로 퇴사한 선생님의 반을 다른 선생님의 반으로 편입시킬때 사용
    # takeovers = TakeOverUser.query.filter(TakeOverUser.teacher_id == u['id']).all()
    # takeovers_num = len(takeovers)
    # if takeovers_num != 0 :
    #     for takeover in takeovers:
    #         ban_data += callapi.call_api(takeover.takeover_user, 'get_mybanid')

    # 상담
    for ban in ban_data:
        # 상담 해야 하는 날짜가 오늘 이상인 경우 , 내가 담당한 반의 consulting 기록들을 가져옵니다 
        # 상담 요청일(startdate)가 반 시작일 ban['startdate']값보다 커야 합니다 .
        #  consulting.cateogry_id < 100 = 미학습 상담 ( 자동 생성 )
        #  consulting.cateogry_id > 100 = 본원 요청 상담 
        #  consulting.cateogry_id = 100 = 선생님 자체 상담 - 미학습 상담 ~ 본원 요청 상담 카테고리 전부 가능 
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
        # 업무의 경우엔, task의 category 가 11 이라 상시 업무 인 경우 
        # 업무 cycle 이 오늘 요일이 된 경우 
        # 업무의 startdate가 오늘 이상인 경우 이고 deadline 을 넘기지 않은 경우 
        # 오늘 완수한 업무이거나 done이 0인 경우
        query = '''
        select taskban.id,taskban.ban_id, taskcategory.name as category, task.contents, task.deadline,task.priority,taskban.done,taskban.created_at 
        from taskban 
        left join task on taskban.task_id = task.id 
        left join taskcategory on task.category_id = taskcategory.id 
        where ( (task.category_id = 11) or ( (task.cycle = %s) or (task.cycle = 0) ) ) and ( task.startdate <= curdate() and curdate() <= task.deadline ) and taskban.ban_id=%s
        AND ( (taskban.done = 1 AND DATE(taskban.created_at) = CURDATE()) OR taskban.done = 0 );'''

        params = (today_yoil,ban['ban_id'],)
        all_task.extend(common.db_connection.execute_query(query, params))  

    return jsonify({'all_consulting':all_consulting,'all_task':all_task})

#퍼플 라이팅 미제출 명단 데이터
@bp.route('/get_purplewriting_data', methods=['GET'])
def get_purplewriting_data():
    ban_id = request.args.get('ban_id',type=str) 
    r = callapi.call_purplewriting(ban_id)
    for item in r:
        item['ban_id'] = ban_id
    return jsonify({'result':r})

#업무 데이터
@bp.route('/get_task_data', methods=['GET'])
def get_task_data():
    ban_id = request.args.get('ban_id',type=int)
    korea_time = current_time + timedelta(hours=9)
    korea_time = pytz.timezone('Asia/Seoul').localize(korea_time)
    today_yoil = korea_time.weekday() + 1
    task_consulting = []
    task = []
    consulting = []
    # 본원에서 요청한 상담을 업무로 가져옵니다 
    # 본원 요청 업무 : week_code < 0
    # 오늘 완료한 경우 가져옵니다 
    # 완료하지 않은 경우 가져옵니다 
    query = '''
    SELECT consulting.origin, consulting.student_name, consulting.student_engname, consulting.id, consulting.ban_id, consulting.student_id, consulting.done, consultingcategory.id as category_id, consulting.week_code, consultingcategory.name as category, consulting.contents, consulting.startdate, consulting.deadline, consulting.missed, consulting.created_at, consulting.reason, consulting.solution, consulting.result
    FROM consulting
    LEFT JOIN consultingcategory ON consulting.category_id = consultingcategory.id
    WHERE (consulting.week_code < 0 AND consulting.startdate <= curdate() AND consulting.ban_id=%s)
    AND ( (consulting.done = 0) OR (consulting.done = 1 AND consulting.created_at = CURDATE()) )
    '''
    params = (ban_id, ) 
    task_consulting = common.db_connection.execute_query(query, params)
    # 업무의 경우엔, task의 category 가 11 이라 상시 업무 인 경우 
    # 업무 cycle 이 오늘 요일이 된 경우 
    # 업무의 startdate가 오늘 이상인 경우 이고 deadline 을 넘기지 않은 경우 
    # 오늘 완수한 업무이거나 done이 0인 경우
    query = '''
    select taskban.id,taskban.ban_id, taskcategory.name as category, task.contents, task.deadline,task.priority,taskban.done,taskban.created_at 
    from taskban 
    left join task on taskban.task_id = task.id 
    left join taskcategory on task.category_id = taskcategory.id 
    WHERE ( (task.category_id = 11) or ( (task.cycle = %s) or (task.cycle = 0) ) ) and ( task.startdate <= CURDATE() and CURDATE() <= task.deadline ) and taskban.ban_id=%s
    AND ( (taskban.done = 1 AND DATE(taskban.created_at) = CURDATE()) OR taskban.done = 0 );'''
    params = (today_yoil,ban_id,)
    task = common.db_connection.execute_query(query, params)

    return jsonify({'task_consulting':task_consulting,'task':task})

#미학습 데이터
@bp.route('/get_unlearned_data', methods=['GET'])
def get_unlearned_data():
    ban_id = request.args.get('ban_id',type=int)
    startdate = request.args.get('startdate')
    unlearned = []
    # 상담 중 진행하지 않은 미학습 상담 기록만 가져옵니다 
    # 미학습 상담의 경우 반 시작일에 생성된 경우는 제외 합니다. 
    query = '''
        SELECT consulting.origin, consulting.student_name, consulting.student_engname, consulting.id, consulting.ban_id, consulting.student_id, consulting.done, consultingcategory.id as category_id, consulting.week_code, consultingcategory.name as category, consulting.contents, consulting.startdate, consulting.deadline, consulting.missed, consulting.created_at, consulting.reason, consulting.solution, consulting.result
    FROM consulting
    LEFT JOIN consultingcategory ON consulting.category_id = consultingcategory.id
    WHERE (consulting.category_id < 100 AND consulting.done = 0 AND %s <= consulting.startdate AND consulting.startdate <= curdate() and consulting.ban_id=%s)
    '''
    params = (startdate,ban_id, ) 
    unlearned = common.db_connection.execute_query(query, params)
    
    return jsonify({'unlearned':unlearned})

# 선생님 상담 기록 데이터
@bp.route("/get_teacherconsultinghistory/<int:done_count>", methods=['GET'])
@authrize
def get_teacherconsultinghistory(u, done_count):
    t_consulting = []
    
    # 정렬 방법: created_at 기준으로 내림차순 정렬
    # done_count는 페이지 번호로, 페이지당 500개의 결과를 가져옵니다.
    query = '''
    SELECT consulting.origin, consulting.student_name, consulting.student_engname, consulting.id, consulting.ban_id, consulting.student_id, consulting.done, consultingcategory.id as category_id, consulting.week_code, consultingcategory.name as category, consulting.contents, consulting.startdate, consulting.deadline, consulting.missed, consulting.created_at, consulting.reason, consulting.solution, consulting.result
    ,1 as writer
    FROM consulting
    LEFT JOIN consultingcategory ON consulting.category_id = consultingcategory.id
    WHERE consulting.done = 1 and teacher_id = %s
    ORDER BY consulting.created_at DESC
    LIMIT %s, 500;  -- 페이지당 500개씩 가져옵니다.
    '''
    
    # done_count에 따라 오프셋 계산
    offset = (done_count - 1) * 500
    
    params = (u['id'], offset)
    t_consulting = common.db_connection.execute_query(query, params)
    return jsonify({'t_consulting': t_consulting})


# 원생 상담 기록 데이터
@bp.route("/get_consultinghistory/<int:student_id>", methods=['GET'])
@authrize
def get_consultinghistory(u, student_id):
    consulting_history = []
    query = '''
    SELECT consulting.id, consulting.ban_id, consulting.student_id, consulting.done, consultingcategory.id as category_id, consulting.week_code, consultingcategory.name as category, consulting.contents, consulting.startdate, consulting.deadline, consulting.missed, consulting.created_at, consulting.reason, consulting.solution, consulting.result,
    0 as writer
    FROM consulting
    LEFT JOIN consultingcategory ON consulting.category_id = consultingcategory.id
    LEFT JOIN user ON consulting.teacher_id = user.id
    WHERE consulting.teacher_id != %s and consulting.done = 1 and student_id =%s;
    '''
    params = (u['id'], student_id)
    consulting_history = common.db_connection.execute_query(query, params)
    
    return jsonify({'consulting_history':consulting_history})

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
        current_time = datetime.utcnow()
        korea_timezone = pytz.timezone('Asia/Seoul')
        korea_time = current_time + timedelta(hours=9)
        korea_time = korea_timezone.localize(korea_time)
        Today = korea_time.date()
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
        current_time = datetime.utcnow()
        korea_timezone = pytz.timezone('Asia/Seoul')
        korea_time = current_time + timedelta(hours=9)
        korea_time = korea_timezone.localize(korea_time)
        Today = korea_time.date()
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
        current_time = datetime.utcnow()
        korea_timezone = pytz.timezone('Asia/Seoul')
        korea_time = current_time + timedelta(hours=9)
        korea_time = korea_timezone.localize(korea_time)
        Today = korea_time.date()
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


#  데이터 그리기 
def plot_widget_line_graph(data, y1_color, y2_color, y1_col_name, y2_col_name):
    # 1. 기본 스타일 설정
    plt.style.use('default')
    plt.rcParams['axes.unicode_minus'] = False
    font_size = 9

    # 2. 데이터 준비
    x = range(len(data))
    x_tick = [item['date'] for item in data]
    if len(x_tick) > 7:
        x_tick = ['' if x_tick.index(i) % 2 == 1 else i for i in x_tick]

    # null 또는 빈 문자열인 값을 NaN으로 변경
    y1 = [item[y1_col_name] if str(item[y1_col_name]).strip() not in ['', 'nan'] else np.nan for item in data]
    y2 = [item[y2_col_name] if str(item[y2_col_name]).strip() not in ['', 'nan'] else np.nan for item in data]

    # 3. 그래프 생성
    fig, ax1 = plt.subplots(figsize=(10, 6))

    # 왼쪽 y 축 (SR) 설정
    ax1.set_xlabel('Date')
    ax1.set_ylabel(y1_col_name, color=y1_color)
    ax1.plot(x, y1, '-s', color=y1_color, markersize=5, linewidth=2, alpha=0.8, label=y1_col_name)
    ax1.tick_params(axis='both', direction='in', labelsize=font_size)

    # 오른쪽 y 축 (Lexile) 설정
    ax2 = ax1.twinx()
    ax2.set_ylabel(y2_col_name, color=y2_color)
    ax2.plot(x, y2, '-s', color=y2_color, markersize=5, linewidth=2, alpha=0.8, label=y2_col_name)
    ax2.tick_params(axis='y', direction='in', labelsize=font_size)

    # x 축 눈금 설정 (모든 월을 표시)
    ax1.set_xticks(x)
    ax1.set_xticklabels(x_tick, rotation=45)

    # 연속된 월에만 선으로 연결
    for i in range(len(x) - 1):
        if data[i]['date'] == data[i + 1]['date'] and not (np.isnan(y1[i]) or np.isnan(y1[i + 1])):
            ax1.plot([x[i], x[i + 1]], [y1[i], y1[i + 1]], color=y1_color, linestyle='-', linewidth=2)
            ax1.plot([x[i], x[i + 1]], [y2[i], y2[i + 1]], color=y2_color, linestyle='-', linewidth=2)

    # y1 및 y2의 범위 조정
    ax1.set_ylim(min(y1) - 0.5, max(y1) + 0.5)
    ax2.set_ylim(min(y2) - 10, max(y2) + 10)

    # Legend에 'AR' 추가
    ax1.legend(loc='upper left', fontsize=font_size)
    ax2.legend(loc='upper right', fontsize=font_size)

    plt.title(f'{y1_col_name} and {y2_col_name} Over Time')

    plt.grid(True)
    plt.tight_layout()

    img_buffer = io.BytesIO()
    plt.savefig(img_buffer, format='png')
    img_buffer.seek(0)
    img_data = base64.b64encode(img_buffer.read()).decode('utf-8')
    return img_data

def plot_widget_bar_line_graph(data, y1_color, y2_color, y1_col_name, y2_col_name):
    # 1. 기본 스타일 설정
    plt.style.use('default')
    plt.rcParams['axes.unicode_minus'] = False
    font_size = 9

    # 2. 데이터 준비
    x = [i for i in range(0,len(data))]

    x_tick = [item['date'] for item in data]

    if len(x_tick) > 7:
        x_tick = ['' if x_tick.index(i) % 2 == 1 else i for i in x_tick]

    y1 = [item[y1_col_name] if item[y1_col_name] not in ['', None] else np.nan for item in data]
    y1[-1] = 0 if np.isnan(y1[-1]) else y1[-1]
    y2 = [item[y2_col_name] if item[y2_col_name] not in ['', None] else np.nan for item in data]

    print(y1)
    print(y2)

    # 3. 그래프 그리기
    fig, ax1 = plt.subplots(figsize=(10, 6))
    plt.setp(ax1, xticks=x, xticklabels=x_tick)
    bar = ax1.bar(x, y1, color=y1_color, width=0.8, alpha=0.8, label = y1_col_name)
    ax1.tick_params(axis='x', direction='in', labelsize = font_size-1)
    ax1.tick_params(axis='y', direction='in', labelsize = font_size)

    if y1.count(np.nan) != len(y1):
        ymax = np.nanmax(y1)
        ymin = 0
        yterm = (ymax-ymin)/3
        ax1.set_ylim(0, ymax+yterm)
        if ymax > 100000:
            ax1.tick_params(axis='both', direction='in', labelsize = font_size-1)
    else:
        ax1.set_yticks([])

    ax2 = ax1.twinx()
    lns = ax2.plot(x, y2, '-s', color=y2_color, markersize=5, linewidth=2, alpha=0.8, label = y2_col_name)
    ax2.tick_params(axis='y', direction='in', labelsize = font_size)
    
    if y2.count(np.nan) != len(y2):
        ymax = np.nanmax(y2)
        ymin = np.nanmin(y2)
        yterm = (ymax-ymin)/3
        if ymin-yterm < 0:
            ax2.set_ylim(0, ymax+yterm)
        else:
            ax2.set_ylim(ymin-yterm, ymax+yterm)
            
        if ymax+yterm > 100000:
            ax2.tick_params(axis='both', direction='in', labelsize = font_size-1)
    else:
        ax2.set_yticks([])

    lns = lns + [bar]
    labs = [l.get_label() for l in lns]
    ax1.legend(lns, labs, loc = 'center', bbox_to_anchor=(0.5, -0.2), ncol= len(lns), fontsize = font_size-1)

    ax2.set_zorder(ax1.get_zorder() + 10)
    ax1.patch.set_visible(False)

    plt.grid(True)
    plt.tight_layout()

    img_buffer = io.BytesIO()
    plt.savefig(img_buffer, format='png')
    img_buffer.seek(0)
    img_data = base64.b64encode(img_buffer.read()).decode('utf-8')
    return img_data

def plot_widget_stacked_bar_line_graph(self, widget, ax1, ax2, data, y1_color, y2_color, y3_color, y1_col_name, y2_col_name, y3_col_name):

    ax1.clear()
    ax2.clear()

    # 1. 기본 스타일 설정
    plt.style.use('default')
    plt.rcParams['font.family'] = 'Malgun Gothic'
    plt.rcParams['axes.unicode_minus'] = False
    font_size = 9

    # 2. 데이터 준비
    x = [i for i in range(0,len(data))]
    x_tick = data['date'].tolist()
    if len(x_tick) > 7:
        x_tick = ['' if x_tick.index(i) % 2 == 1 else i for i in x_tick]

    y1 = [i if i not in ['',np.nan] else 0 for i in data[y1_col_name]]
    y2 = [i if i not in ['',np.nan] else 0 for i in data[y2_col_name]]
    y3 = [float(i) if i not in ['',np.nan] else np.nan for i in data[y3_col_name]]

    y_1_2 = [y1[i] + y2[i] for i in range(len(y1))]        

    # 3. 그래프 그리기
    plt.setp(ax1, xticks=x, xticklabels=x_tick)

    bar1 = ax1.bar(x, y1, color=y1_color, width=0.7, alpha=0.75, label = y1_col_name)
    bar2 = ax1.bar(x, y2, color=y2_color, width=0.7, alpha=0.75, label = y2_col_name, bottom = y1)
    ax1.tick_params(axis='both', direction='in', labelsize = font_size)

    if y1.count(np.nan) != len(y1):
        ymax = max(y_1_2)
        ax1.set_ylim(0, ymax * 1.3)
    else:
        ax1.set_yticks([])

    lns = ax2.plot(x, y3, '-s', color=y3_color, markersize=5, linewidth=2, alpha=0.8, label = y3_col_name)
    ax2.tick_params(axis='y', direction='in', labelsize = font_size)
    
    if y3.count(np.nan) != len(y3):
        ax2.set_ylim(0, 1.1)
        ax2.yaxis.set_major_formatter(lambda x, pos: str(int(x*100)) + '%')
    else:
        ax2.set_yticks([])

    lns = lns + [bar1] + [bar2]
    labs = [l.get_label() for l in lns]
    ax1.legend(lns, labs, loc = 'center', bbox_to_anchor=(0.5, -0.2), ncol= len(lns), fontsize = font_size-1)

    ax2.set_zorder(ax1.get_zorder() + 10)
    ax1.patch.set_visible(False)

    widget.canvas.draw()

def plot_widget_double_bar_line_graph(self, widget, ax1, classification_list, student_score_list, mean_score_list):
    
    # 1. 기본 스타일 설정
    ax1.clear()
    plt.style.use('default')
    plt.rcParams['font.family'] = 'Malgun Gothic'
    font_size = 9

    # 2. 데이터 준비
    x = np.arange(len(classification_list))
    plt.setp(ax1, xticks=x, xticklabels = classification_list)
    ax1.tick_params(axis='both', direction='in', labelsize = font_size)
    if len(classification_list) < 4:
        width = 0.35
    elif len(classification_list) == 4:
        width = 0.3
    else:
        width = 0.25

    # 3. 그래프 그리기

    bar1 = ax1.bar(x - width/2, student_score_list, width, color = '#3399ff', label='학생 점수')
    bar2 = ax1.bar(x + width/2, mean_score_list, width, color = '#FF3F4B', label='단계 평균')

    for bar in bar1:
        plt.annotate(sround(bar.get_height(),1), xy=(bar.get_x() + width/3, bar.get_height()+0.15), fontsize=font_size)

    for bar in bar2:
        plt.annotate(sround(bar.get_height(),1), xy=(bar.get_x() + width/3, bar.get_height()+0.15), fontsize=font_size)

    bar = [bar1] + [bar2]
    ax1.set_ylim(0, 110)

    labs = [l.get_label() for l in bar]
    ax1.legend(bar, labs, loc = 'center', bbox_to_anchor=(0.5, -0.2), ncol= len(bar), fontsize = font_size-1)
    widget.canvas.draw()

def sround(num, digit=0):
        m, n = divmod((num * (10 ** digit)), 1)
        if n == 0.5:
            return (num * (10 ** digit) + 0.5) / (10 ** digit)
        else:
            return round(num, digit)

# 원생 IXL 기록 데이터
@bp.route("/get_IXL_program/<string:student_origin>", methods=['GET'])
def get_IXL_program(student_origin):
    query = '''
    SELECT student_id from program_student where origin = %s
    '''
    params = (student_origin)
    student_id = common.db_connection.execute_query(query, params)
    student_id = student_id[0]['student_id']

    db = pymysql.connect(host='118.131.85.245', user='jung', password='wjdgus00',port=9243, database='purple_learning_counseling', cursorclass=pymysql.cursors.DictCursor)
    try:
        with db.cursor() as cur:
            # ixl 데이터 
            cur.execute('''
                    SELECT * FROM student_ixl_df where student_id = %s
            ''',(student_id, ) )
            student_ixl_df = cur.fetchall()
            # plot_widget_line_graph(reading_score_graph_ax1, reading_score_graph_ax2, student_reading_data_sample_tmp, 'blue', 'red', 'SR', 'Lexile')
            # 여기는 앞으로 고정 값으로 보내줄겁니다 .
            # cur.execute('''
            #         SELECT * FROM ixl_problem_info
            # ''', )
            # basic_info = cur.fetchall()
            # for info in basic_info:
            #     info['단계'] = decrypt(info['단계'])
            #     info['대분류'] = decrypt(info['대분류'])
            #     info['스킬넘버'] = decrypt(info['스킬넘버'])
            #     info['주제'] = decrypt(info['주제'])
            #     info['퍼마코드'] = decrypt(info['퍼마코드'])
    except:
        print('err:', sys.exc_info())
    finally:
        db.close()
    return jsonify({'student_ixl_df':student_ixl_df})


# 원생 리딩 기록 데이터
@bp.route("/get_reading_program/<string:student_origin>", methods=['GET'])
def get_reading_program(student_origin):
    query = '''
    SELECT student_id from program_student where origin = %s
    '''
    params = (student_origin)
    student_id = common.db_connection.execute_query(query, params)
    student_id = student_id[0]['student_id']

    try:
        db = pymysql.connect(host='118.131.85.245', user='jung', password='wjdgus00',port=9243, database='purple_learning_counseling', cursorclass=pymysql.cursors.DictCursor)
        with db.cursor() as cur:
            # 도서 데이터 
            cur.execute("SELECT * FROM reading_data where student_id = %s",(student_id, ) )
            student_reading_data = cur.fetchall()
        
        columns_to_process = ['SR', 'Lexile', 'AR', 'Lexile_BookLevel', 'BC', 'WC', 'Quiz', 'WC/권', '목표WC', '달성률']
        for item in student_reading_data:
            for col_name in columns_to_process:
                if col_name in ['SR', 'AR']:
                    item[col_name] = '' if item[col_name] in ['nan', ''] else sround(float(item[col_name]), 1)
                elif col_name in ['Lexile', 'Lexile_BookLevel', 'BC', 'WC', 'Quiz', 'WC/권', '목표WC', '달성률']:
                    item[col_name] = '' if item[col_name] in ['nan', ''] else int(float(item[col_name]))

        img_data = plot_widget_line_graph(student_reading_data, 'blue', 'red', 'SR', 'Lexile')
        img2_data = plot_widget_bar_line_graph(student_reading_data, 'skyblue', 'grey', 'BC', 'WC') 
        img3_data = plot_widget_line_graph(student_reading_data, 'green', 'blue', 'AR', 'WC/권') 
        img4_data = plot_widget_line_graph(student_reading_data, 'yellow', 'blue', 'Lexile_BookLevel', 'WC/권') 

        # df = pd.DataFrame(student_reading_data)
        # target_df = df.to_json(orient='records')
        # JSON 응답에 이미지 데이터 추가
        response_data = {
            "image1": img_data,
            "image2": img2_data,
            "image3": img3_data,
            "image4": img4_data,
            "student_reading_data": student_reading_data
        }

        return jsonify(response_data)   
    except Exception as e:
        print('Error:', e)
    finally:
        if db:
            db.close()
