from LMSapp.views import *
from LMSapp.models import *
from flask import session  # 세션
from sqlalchemy import and_
from flask import Blueprint, render_template, jsonify, request, redirect, url_for
import json
import callapi
import pymysql
from LMSapp.views import common
from LMSapp.views.main_views import authrize
import requests
from urllib.parse import unquote
import datetime
from urllib.parse import quote
from flask_socketio import join_room, emit
from LMSapp import socketio

bp = Blueprint('manage', __name__, url_prefix='/manage')

# 관리부서 메인 페이지
# 테스트 계정 id : T0001 pw동일
@bp.route("/", methods=['GET'])
@authrize
def home(u):
    if request.method == 'GET':
        global user_mobileno
        user = User.query.filter(User.user_id == u['user_id']).first()     
        user_mobileno = user.mobileno   
        return render_template('manage.html', user=user,)

@socketio.on('new_answer',namespace='/answer') 
def handle_new_answer(q_id):
    emit('new_answer', {'message': 'New answer registered', 'q_id': q_id}, broadcast=True, namespace='/answer')

# 본원 답변 기능
@bp.route('/answer/<int:id>/<int:done_code>', methods=['POST'])
@authrize
def answer(u,id,done_code):
    if request.method == 'POST':
        # answer_title = request.form['answer_title']
        answer_contents = request.form['answer_contents']
        o_ban_id = request.form['o_ban_id']
        if o_ban_id == 'none':
            o_ban_id = 0
        target_question = Question.query.get_or_404(id)
        target_question.answer = 1
        files = request.files.getlist('file_upload')
        for file in files:
            common.save_attachment(file, id, 1)

        if(done_code == 0):
            target_answer = Answer(content=answer_contents,created_at=Today,reject_code=int(o_ban_id),question_id = id,writer_id = u['id'])
            db.session.add(target_answer)
            if target_question.mobileno == '내근':
                teacher = User.query.filter(User.id == target_question.teacher_id).first()
                URI = 'http://118.131.85.245:9888/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2'
                payloadText = teacher.name + ' 선생님 본원 문의 답변이 등록되었습니다  \n'
                payloadText += ' 문의/답변 내용: `{}`\n\n```{}```'.format(target_question.title, answer_contents.replace('\r\n', '\n\n') )
                Synologytoken = '"MQzg6snlRV4MFw27afkGXRmfghHRQVcM77xYo5khI8Wz4zPM4wLVqXlu1O5ppWLv"'
                # requestURI = URI + '&token=' + Synologytoken + '&payload={"text": "' + payloadText + '"}'
                # try:
                #     response = requests.get(requestURI)
                #     response.raise_for_status()
                #     print(f"statusCode: {response.status_code}")
                # except requests.exceptions.RequestException as e:
                #     print("시놀로지 전송 실패")
                #     print(e)
            else:
                post_url = 'https://api-alimtalk.cloud.toast.com/alimtalk/v2.2/appkeys/hHralrURkLyAzdC8/messages'
                data_sendkey = {'senderKey': "616586eb99a911c3f859352a90a9001ec2116489",
                    'templateCode': "work_cs_answer",
                    'recipientList': [{'recipientNo':target_question.mobileno, 'templateParameter': { '답변내용':answer_contents}, }, ], }
                headers = {"X-Secret-Key": "K6FYGdFS", "Content-Type": "application/json;charset=UTF-8", }
                if(user_mobileno != '팀장'):
                    http_post_requests = requests.post(post_url, json=data_sendkey, headers=headers)
        else:
            target_answer = Answer.query.filter(Answer.question_id == id).first()
            if(answer_contents != '' or answer_contents != None):
                target_answer.content = answer_contents
            target_answer.created_at = Today
            if(o_ban_id != -1):
                target_answer.reject_code = int(o_ban_id)
            target_answer.question_id = id
            target_answer.writer_id = u['id']

        if target_question.category == 2 and o_ban_id != 0 :    
            new_switch_student = SwitchStudent(ban_id = target_question.ban_id,switch_ban_id=o_ban_id,teacher_id = target_question.teacher_id,student_id=target_question.student_id,created_at=Today)
            db.session.add(new_switch_student)
            # db.session.commit()
        elif(target_question.category != 2 and o_ban_id != 0 ):
            new_out_student = OutStudent(ban_id = target_question.ban_id,teacher_id = target_question.teacher_id,student_id=target_question.student_id,created_at=Today)
            db.session.add(new_out_student)
            # db.session.commit()

        db.session.commit()
        target_data = {}
        target_data['answer_id'] = target_answer.id
        target_data['answerer'] = User.query.filter(User.id == u['id']).first().name
        target_data['attach'] = []
        attachments = Attachments.query.filter(and_(Attachments.question_id == id, Attachments.is_answer == 1)).all()
        for attachment in attachments:
            attachment_data = {
                'file_name': attachment.file_name,
                'id': attachment.id,
                'is_answer': attachment.is_answer,
                'question_id':id
            }
            target_data['attach'].append(attachment_data)
        return jsonify({'result': '문의 답변 저장 완료','target_data':target_data})

def make_cate(id):
    if(id == 3):
        return '일반 문의'
    elif(id == 4):
        return '기술 문의'
    elif(id == 5):
        return '내근티처 문의'
    elif(id == 1):
        return '이반 요청'
    elif(id == 2):
        return '퇴소 요청'
    else:
        return '-'

# 본원 답변 종류 바꾸기 
@bp.route('/q_kind/<int:id>', methods=['POST'])
def q_kind(id):
    if request.method == 'POST':
        URI = 'http://118.131.85.245:9888/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2'
        q_kind = int(request.form['question_kind'])
        target_question = Question.query.get_or_404(id)
        before_kind = make_cate(target_question.category)
        target_question.category = q_kind
        db.session.commit()
        payloadText = before_kind+'에서 ➡️ '
        if(q_kind == 3):
            Synologytoken = '"PBj2WnZcmdzrF2wMhHXyzafvlF6i1PTaPf5s4eBuKkgCjBCOImWMXivfGKo4PQ8q"'
            payloadText  += '일반 문의로 변경된 문의가 있습니다'
        elif(q_kind == 4):
            Synologytoken = '"iMUOvyhPeqCzEeBniTJKf3y6uflehbrB2kddhLUQXHwLxsXHxEbOr2K4qLHvvEIg"'
            payloadText  += '기술 문의로 변경된 문의가 있습니다'
        elif(q_kind == 5):
            Synologytoken = '"MQzg6snlRV4MFw27afkGXRmfghHRQVcM77xYo5khI8Wz4zPM4wLVqXlu1O5ppWLv"'
            payloadText  += '내근티처 문의로 변경된 문의가 있습니다'
        else:
            Synologytoken = '"PBj2WnZcmdzrF2wMhHXyzafvlF6i1PTaPf5s4eBuKkgCjBCOImWMXivfGKo4PQ8q"'
            if(q_kind == 1):
                payloadText  += '이반 요청으로 변경된 문의가 있습니다'
            elif(q_kind==2):
                payloadText  += '퇴소 요청으로 변경된 문의가 있습니다'
        payloadText += ' 제목: `{}`\n\n```{}```'.format(target_question.title, target_question.contents.replace('\r\n', '\n\n') )
        link_url = '\n[링크 바로가기]http://purpleacademy.net:6725/manage/?q_id={}&q_type={}'.format(id,q_kind)
        link_url = link_url.replace('%', '%25')
        payloadText += quote(link_url)  # payloadText 인코딩

        requestURI = URI + '&token=' + Synologytoken + '&payload={"text": "' + payloadText + '"}'
        try:
            response = requests.get(requestURI)
            response.raise_for_status()
            print(f"statusCode: {response.status_code}")
        except requests.exceptions.RequestException as e:
            print("시놀로지 전송 실패")
            print(e)
        return jsonify({'result': '문의 종류 수정 완료'})
      
@bp.route('/modal_question/<int:id>', methods=['GET'])
def modal_question(id):
    if request.method == 'GET':
        target_question = {}
        q = Question.query.get_or_404(id)
        target_bandata = callapi.purple_info(q.ban_id,'get_target_students')
        query = '''
                    SELECT question.id,question.category,question.title,question.contents,question.teacher_id,question.ban_id,
                    question.student_id,question.create_date,question.answer,
                    question.consulting_history,question.mobileno,consulting.solution,consulting.reason,consulting.week_code,consultingcategory.name as consulting_category,consulting.category_id as consulting_categoryid,consulting.created_at as consulting_created_at ,
                    answer.id as answer_id, user.eng_name as answerer, answer.title as answer_title,answer.content as answer_contents ,answer.created_at as answer_created_at,answer.reject_code as answer_reject_code
                    from LMS.question
                    left join answer on answer.question_id = question.id 
                    left join user on user.id = answer.writer_id 
                    left join consulting on question.consulting_history = consulting.id 
                    left join consultingcategory on consulting.category_id = consultingcategory.id 
                    WHERE question.id = %s;
                '''
        params = (id,)
        target_question['question'] = common.db_connection.execute_query(query, params)

        query = 'select question_id,file_name,id as attach_id,attachment.is_answer from attachment where attachment.question_id = %s;'
        target_question['attach'] = common.db_connection.execute_query(query, params)

        return jsonify({'target_question':target_question,'target_bandata':target_bandata})

@bp.route('/is_it_done/<int:id>', methods=['GET'])
def is_it_done(id):
    if request.method == 'GET':
        q = Question.query.get_or_404(id)
        target_answer = []
        if(q.answer == 1):
            query = 'SELECT user.eng_name as answerer, answer.title,answer.content as answer_contents,answer.created_at,answer.reject_code,answer.question_id,question.category FROM LMS.answer left join question on answer.question_id =question.id left join user on user.id = answer.writer_id where question.id = %s;'
            params = (id, )
            target_answer = common.db_connection.execute_query(query, params)
        return jsonify({'target_answer':target_answer})

@bp.route('/new_question/<int:id>', methods=['GET'])
def new_question(id):
    if request.method == 'GET':
        target_question = {}
        q = Question.query.get_or_404(id)
        query = '''
                SELECT question.id,question.category,question.title,question.contents,question.teacher_id,question.ban_id,
                question.student_id,question.create_date,question.answer,
                question.consulting_history,question.mobileno,consulting.solution,consulting.reason,consulting.week_code,consultingcategory.name as consulting_category,consulting.category_id as consulting_categoryid,consulting.created_at as consulting_created_at ,
                answer.id as answer_id, user.eng_name as answerer, answer.title as answer_title,answer.content as answer_contents ,answer.created_at as answer_created_at,answer.reject_code as answer_reject_code
                from LMS.question
                left join answer on answer.question_id = question.id 
                left join user on user.id = answer.writer_id 
                left join consulting on question.consulting_history = consulting.id 
                left join consultingcategory on consulting.category_id = consultingcategory.id 
                WHERE question.id = %s;
                '''
        params = (id, )
        target_question['question'] = common.db_connection.execute_query(query, params)

        query = 'select question_id,file_name,id,attachment.is_answer from attachment where attachment.question_id = %s;'
        target_question['attach'] = common.db_connection.execute_query(query, params)

        return jsonify({'target_question':target_question})
 
              
@bp.route("/get_questiondata", methods=['GET'])
def get_questiondata():
    if request.method == 'GET':
        page = request.args.get('page', default=0, type=int)  # 받은 questionData.length 0
        page_size = request.args.get('page_size', default=1000, type=int)  # 클라이언트에서 전달한 페이지 크기

        # offset = (page - 1) * page_size  # 오프셋 계산 > 51-1*10
        offset = 0
        question_count = 0
        total_count = 0
        question = []
        attach = []
        query = "SELECT COUNT(*) AS total_count FROM question;"
        # result = cur.fetchone()
        # question_count = result[0]['total_count']
        question_count = common.db_connection.execute_query(query, )[0]['total_count']
        query = '''
                SELECT SUM(total_count) AS total_count
                FROM (
                    SELECT COUNT(*) AS total_count
                    FROM question
                    UNION ALL
                    SELECT COUNT(*) AS total_count
                    FROM cs
                ) AS t;
                '''
        # result = cur.fetchone()
        # total_count = result['total_count']
        total_count = common.db_connection.execute_query(query, )[0]['total_count']
        if page < question_count : 
            query = '''
            SELECT question.id,question.category,question.title,question.contents,question.contents as question_contents,question.teacher_id,question.ban_id,question.student_id,question.create_date,question.answer,question.consulting_history,question.mobileno,consulting.solution,consulting.contents as consulting_contents,consulting.reason,consulting.week_code,consultingcategory.name as consulting_category,consulting.category_id as consulting_categoryid,consulting.created_at as consulting_created_at ,
            answer.id as answer_id, user.eng_name as answerer, answer.title as answer_title,answer.content as answer_contents ,answer.created_at as answer_created_at,answer.reject_code as answer_reject_code
            from LMS.question
            left join answer on answer.question_id = question.id 
            left join user on user.id = answer.writer_id 
            left join consulting on question.consulting_history = consulting.id 
            left join consultingcategory on consulting.category_id = consultingcategory.id 
            ORDER BY 
            question.answer,
            question.create_date DESC
            LIMIT %s, %s;
            '''
            params = (page,page_size,)
            question = common.db_connection.execute_query(query, params)
            query = 'select attachment.question_id,attachment.file_name,attachment.id,attachment.is_answer from attachment LEFT JOIN question on attachment.question_id = question.id ORDER BY question.category,question.answer, question.create_date DESC LIMIT %s, %s;'
            attach = common.db_connection.execute_query(query, params)
        else:
            attach = []
            offset = page - question_count
            if offset < total_count :
                query = 'SELECT * FROM LMS.cs ORDER BY cs.create_date LIMIT %s, %s;'
                params = (offset,page_size,)
                question = common.db_connection.execute_query(query, params)
        return jsonify({'question':question, 'total_count': total_count,'attach':attach})

@bp.route("/get_taskdata", methods=['GET'])
def get_taskdata():
    if request.method == 'GET':
        page = request.args.get('page', default=0, type=int)  # 받은 questionData.length 0
        page_size = request.args.get('page_size', default=1000, type=int)  # 클라이언트에서 전달한 페이지 크기
        total_count = 0
        task = []
        query = "SELECT COUNT(*) AS total_count FROM taskban;"
        total_count = common.db_connection.execute_query(query, )[0]['total_count']

        query = '''
        SELECT task.id,task.category_id, task.contents, task.url, task.attachments, 
        task.startdate, task.deadline, task.priority, task.cycle, taskcategory.name as category, taskban.id as taskban_id, taskban.ban_id, taskban.teacher_id, taskban.done ,taskban.created_at
        FROM task 
        LEFT JOIN taskcategory ON task.category_id = taskcategory.id LEFT JOIN taskban ON task.id = taskban.task_id
        ORDER BY  
        task.startdate DESC,
        taskban.done
        LIMIT %s, %s;
        '''
        params = (page,page_size,)
        task = common.db_connection.execute_query(query, params)
        return jsonify({'task':task, 'total_count': total_count})
   
@bp.route("/consulting_category", methods=['GET'])
def get_all_consulting_category():
    if request.method == 'GET':
        consulting_category = []
        query = "SELECT * FROM consultingcategory WHERE id > 100"
        consulting_category = common.db_connection.execute_query(query, )
        return jsonify({'consulting_category':consulting_category})
 
@bp.route("/task_category", methods=['GET'])
def get_all_task_category():
    if request.method == 'GET':
        task_category = []
        query = "SELECT * FROM taskcategory;"
        task_category = common.db_connection.execute_query(query, )
        return jsonify({'task_category':task_category})


@bp.route('/api/delete_task/<int:id>', methods=['POST'])
def delete_task(id):
    result = {}
    if request.method == 'POST':
        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
        try:
            with db.cursor() as cur:
                cur.execute(f'delete from taskban where id={id}')
                db.commit()
                result['status'] = 200
                result['text'] = id
        except Exception as e:
            print(e)
            result['status'] = 401
            result['text'] = str(e)
        finally:
            db.close()

        return result

@bp.route('/api/every_delete_tasks/<int:id>', methods=['POST'])
def every_delete_tasks(id):
    result = {}
    if request.method == 'POST':
        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
        try:
            with db.cursor() as cur:
                cur.execute(f'DELETE task, taskban FROM task LEFT JOIN taskban ON taskban.task_id = task.id WHERE task.id = {id};')
                db.commit()
                result['status'] = 200
                result['text'] = id
        except Exception as e:
            print(e)
            result['status'] = 401
            result['text'] = str(e)
        finally:
            db.close()

        return result

# 업무 요청  
@bp.route("/request_task", methods=['GET'])
def request_task():
    if request.method == 'GET':
        all_task_category = []
        query = "select taskcategory.id, taskcategory.name from taskcategory;"
        all_task_category = common.db_connection.execute_query(query, )
        return jsonify({'all_task_category':all_task_category})

# 요청 업무 저장 
@bp.route("/task/<int:b_type>", methods=['POST'])
def make_task(b_type):
    if request.method == 'POST':
        #  업무 카테고리 저장
        received_category = request.json.get('task_category_list')
        #  업무 내용 저장
        received_task = request.json.get('task_contents')
        #  업무을 진행할 시작일 저장
        received_task_startdate = datetime.datetime.strptime(request.json.get('task_date'), "%Y-%m-%d").date()

        #  업무을 마무리할 마감일 저장
        received_task_deadline = request.json.get('task_deadline')
        # 업무 우선순위
        received_task_priority = request.json.get('task_priority')
        # 업무 주기
        received_task_cycle = request.json.get('task_cycle')
        task_yoil = ''
        if(received_task_cycle == 1):
            task_yoil = '월요일 업무'
        elif(received_task_cycle == 2):
            task_yoil = '화요일 업무'
        elif(received_task_cycle == 3):
            task_yoil = '수요일 업무'
        elif(received_task_cycle == 4):
            task_yoil = '목요일 업무'
        elif(received_task_cycle == 5):
            task_yoil = '금요일 업무'
        else:
            task_yoil = '주기 무관 업무'
        task = Task(category_id=received_category,contents=received_task,startdate=received_task_startdate,deadline=received_task_deadline,priority=received_task_priority,cycle=received_task_cycle)
        db.session.add(task)
        db.session.commit()

        #  업무 진행할 반 저장
        if b_type > 100:
            arrayData = request.get_json()
            received_target_ban = arrayData['selectedBanList']
            for target in received_target_ban:
                task_data = target.split('_')
                teacher_id=int(task_data[1])
                new_task = TaskBan(ban_id=int(task_data[0]),teacher_id=teacher_id, task_id=task.id ,done=0)
                db.session.add(new_task)
                teacher_mobile_no = User.query.filter(User.id == teacher_id).first().mobileno
                # post_url = 'https://api-alimtalk.cloud.toast.com/alimtalk/v2.2/appkeys/hHralrURkLyAzdC8/messages'
                # data_sendkey = {'senderKey': "616586eb99a911c3f859352a90a9001ec2116489",
                #     'templateCode': "task_cs",
                #     'recipientList': [{'recipientNo':teacher_mobile_no, 'templateParameter': { '반이름':task_data[2], '업무내용': received_task,'요일':task_yoil, '마감기한': received_task_deadline}, }, ], }
                # headers = {"X-Secret-Key": "K6FYGdFS", "Content-Type": "application/json;charset=UTF-8", }
                # http_post_requests = requests.post(post_url, json=data_sendkey, headers=headers)
                db.session.commit()
        # 전체 반이 선택 된 경우
        else:
            # 전체 반에 진행 
            if b_type == 0:
                targets = callapi.purple_allinfo('get_all_ban_teacher')
            elif b_type == 1:   
                targets = callapi.purple_allinfo('get_plusalpha_ban_teacher')
            elif b_type == 2: 
                targets = callapi.purple_allinfo('get_nfinter_ban_teacher')
            elif b_type == 3: 
                targets = callapi.purple_allinfo('get_sixteen_ban_teacher')
            elif b_type == 4: 
                targets = callapi.purple_allinfo('get_seventeen_ban_teacher')
            elif b_type == 5: 
                targets = callapi.purple_allinfo('get_eighteen_ban_teacher')
            
            for target in targets:
                new_task = TaskBan(ban_id=target['ban_id'],teacher_id=target['teacher_id'], task_id=task.id ,done=0)
                db.session.add(new_task)
                # post_url = 'https://api-alimtalk.cloud.toast.com/alimtalk/v2.2/appkeys/hHralrURkLyAzdC8/messages'
                # data_sendkey = {'senderKey': "616586eb99a911c3f859352a90a9001ec2116489",
                #     'templateCode': "task_cs",
                #     'recipientList': [{'recipientNo':target['mobileno'], 'templateParameter': { '반이름':target['ban_name'], '업무내용': received_task,'요일':task_yoil, '마감기한': received_task_deadline}, }, ], }
                # headers = {"X-Secret-Key": "K6FYGdFS", "Content-Type": "application/json;charset=UTF-8", }
                # http_post_requests = requests.post(post_url, json=data_sendkey, headers=headers)
                db.session.commit()
        return jsonify({'result':'success'})

# 상담 요청  
@bp.route("/request_consulting", methods=['GET'])
def request_consulting():
    if request.method == 'GET':
        all_consulting_category = []
        query = "select consultingcategory.id, consultingcategory.name from consultingcategory where consultingcategory.id > 100;"
        all_consulting_category = common.db_connection.execute_query(query, )
        return jsonify({'all_consulting_category':all_consulting_category})
    
# 전체 반 원생 상담 요청 저장
@bp.route("/consulting/ban/<int:b_id>/<int:t_id>/<string:b_name>/", methods=['POST'])
def request_ban_student(b_id,t_id,b_name):
    if request.method == 'POST':
        # URL 디코딩을 수행하여 공백 문자열을 공백으로 변환
        b_name = unquote(b_name)
        #  상담 카테고리 저장
        received_consulting_category = request.form['consulting_category']
        #  상담 내용 저장
        received_consulting_contents = request.form['consulting_contents']
        #  상담을 진행할 시작일 저장
        received_consulting_startdate = datetime.datetime.strptime( request.form['consulting_date'], "%Y-%m-%d").date()

        #  상담을 마무리할 마감일 저장
        received_consulting_deadline = request.form['consulting_deadline']
        targets = callapi.purple_info(b_id,'get_student_simple')
        for target in targets:
            new_consulting = Consulting(ban_id=b_id,teacher_id=t_id, category_id=received_consulting_category, student_id=target['s_id'],student_name=target['student_name'],student_engname=target['student_engname'],origin=target['origin'],contents=received_consulting_contents, startdate=received_consulting_startdate, deadline=received_consulting_deadline,done=0,missed='1111-01-01')
            db.session.add(new_consulting)
            db.session.commit()

        teacher_mobile_no = User.query.filter(User.id == t_id).first().mobileno
        post_url = 'https://api-alimtalk.cloud.toast.com/alimtalk/v2.2/appkeys/hHralrURkLyAzdC8/messages'
        data_sendkey = {'senderKey': "616586eb99a911c3f859352a90a9001ec2116489",
        'templateCode': "consulting_cs",
        'recipientList': [{'recipientNo':teacher_mobile_no, 'templateParameter': { '원번':b_name, '원생이름': '전체 원생 대상', '상담내용': received_consulting_contents, '마감기한': received_consulting_deadline}, }, ], }
        headers = {"X-Secret-Key": "K6FYGdFS", "Content-Type": "application/json;charset=UTF-8", }
        http_post_requests = requests.post(post_url, json=data_sendkey, headers=headers)

        return jsonify({'result':'success'})    

# 개별 원생 상담 요청 저장
@bp.route("/consulting/<int:b_id>/<int:t_id>/<int:s_id>/", methods=['POST'])
def request_indivi_student(b_id,t_id,s_id):
    if request.method == 'POST':
        received_ban_name = request.form['ban_name']
        #  상담 카테고리 저장
        received_consulting_category = request.form['consulting_category']
        #  상담 내용 저장
        received_consulting_contents = request.form['consulting_contents']
        #  상담을 진행할 시작일 저장
        received_consulting_startdate = datetime.datetime.strptime( request.form['consulting_date'], "%Y-%m-%d").date()
        #  상담을 마무리할 마감일 저장
        received_consulting_deadline = request.form['consulting_deadline']
        # 원생 정보
        student_name = request.form['student_name']
        student_engname = request.form['student_engname']
        origin = request.form['origin']
        teacher = User.query.filter(User.id == t_id).first()
        teacher_mobile_no = teacher.mobileno

        new_consulting = Consulting(ban_id=b_id,teacher_id=t_id, category_id=received_consulting_category, student_id=s_id,student_name=student_name,student_engname=student_engname,origin=origin,contents=received_consulting_contents, startdate=received_consulting_startdate, deadline=received_consulting_deadline,done=0,missed='1111-01-01',week_code=-1)
        db.session.add(new_consulting)
        db.session.commit()
        if(teacher_mobile_no == '내근'):
            URI = 'http://118.131.85.245:9888/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2'
            payloadText = teacher.name + ' 선생님 ' + received_ban_name + '반 ' + student_name +'( '+ origin +' )원생의 상담 요청이 등록되었습니다. \n'
            payloadText += '마감기한: `{}`\n\n```{}```'.format(received_consulting_deadline, received_consulting_contents.replace('\r\n', '\n\n') )
            Synologytoken = '"MQzg6snlRV4MFw27afkGXRmfghHRQVcM77xYo5khI8Wz4zPM4wLVqXlu1O5ppWLv"'
            requestURI = URI + '&token=' + Synologytoken + '&payload={"text": "' + payloadText + '"}'
            try:
                response = requests.get(requestURI)
                response.raise_for_status()
                print(f"statusCode: {response.status_code}")
            except requests.exceptions.RequestException as e:
                print("시놀로지 전송 실패")
                print(e)
        else:
            post_url = 'https://api-alimtalk.cloud.toast.com/alimtalk/v2.2/appkeys/hHralrURkLyAzdC8/messages'
            data_sendkey = {
                'senderKey': "616586eb99a911c3f859352a90a9001ec2116489",
                'templateCode': "consulting_cs",
                'recipientList': [{'recipientNo':teacher_mobile_no, 'templateParameter': { '원번':origin, '원생이름': student_name, '상담내용': received_consulting_contents, '마감기한': received_consulting_deadline}, }, ], 
            }
            headers = {"X-Secret-Key": "K6FYGdFS", "Content-Type": "application/json;charset=UTF-8", }
            http_post_requests = requests.post(post_url, json=data_sendkey, headers=headers)
        
        return jsonify({'result':'success'})
   
# 전체 반에 상담 요청 저장
@bp.route("/consulting/all_ban/<int:b_type>", methods=['POST'])
def request_all_ban(b_type):
    if request.method == 'POST':
        #  상담 카테고리 저장
        received_consulting_category = request.form['consulting_category']
        #  상담 내용 저장
        received_consulting_contents = request.form['consulting_contents']
        #  상담을 진행할 시작일 저장
        received_consulting_startdate = datetime.datetime.strptime( request.form['consulting_date'], "%Y-%m-%d").date()
        #  상담을 마무리할 마감일 저장
        received_consulting_deadline = request.form['consulting_deadline']
        # 전체 반 대상 진행 일 경우 처리
        if b_type == 0:
            targets = callapi.purple_allinfo('get_all_ban_student_simple')
        # plus alpha 처리   
        elif b_type == 1:
            targets = callapi.purple_allinfo('get_plusalpha_ban')
        # nf 노블 처리 
        elif b_type == 2:
            targets = callapi.purple_allinfo('get_nfinter_ban')
        elif b_type == 3:
            targets = callapi.purple_allinfo('get_sixteen_ban')
        elif b_type == 4:
            targets = callapi.purple_allinfo('get_seventeen_ban')
        elif b_type == 5:
            targets = callapi.purple_allinfo('get_eightteen_ban')
        ban_info = []
        existing_info = set()
        for target in targets:
            info = {}
            info['mobileno'] = target['mobileno']
            info['ban_name'] = target['ban_name']
            info_key = (info['mobileno'], info['ban_name'])  # 중복 체크를 위한 키
            new_consulting = Consulting(ban_id=target['ban_id'],teacher_id=target['teacher_id'], category_id=received_consulting_category, student_id=target['student_id'],student_name=target['student_name'],student_engname=target['student_engname'],origin=target['origin'],contents=received_consulting_contents, startdate=received_consulting_startdate, deadline=received_consulting_deadline,done=0,missed='1111-01-01')
            db.session.add(new_consulting)
            db.session.commit()
            # 동일한 데이터가 이미 존재하는 경우 스킵
            if info_key in existing_info:
                continue
            existing_info.add(info_key)  # 새로운 데이터를 추가
            ban_info.append(info)
        for ban in ban_info:
            post_url = 'https://api-alimtalk.cloud.toast.com/alimtalk/v2.2/appkeys/hHralrURkLyAzdC8/messages'
            data_sendkey = {'senderKey': "616586eb99a911c3f859352a90a9001ec2116489",
                    'templateCode': "consulting_cs",
                    'recipientList': [{'recipientNo':ban['mobileno'], 'templateParameter': { '원번':ban['ban_name'], '원생이름': '전체 원생 대상', '상담내용': received_consulting_contents, '마감기한': received_consulting_deadline}, }, ], }
            headers = {"X-Secret-Key": "K6FYGdFS", "Content-Type": "application/json;charset=UTF-8", }
            http_post_requests = requests.post(post_url, json=data_sendkey, headers=headers)
        
        return jsonify({'result':'success'})    


# 후에 수정 
# 미학습 
@bp.route("/uldata", methods=['GET'])
def uldata():
    if request.method == 'GET':
        target_students = callapi.purple_allinfo('get_all_student')
        if target_students:
            unlearned_count = {}
            query = 'SELECT consulting.student_id, COUNT(*) AS unlearned FROM consulting WHERE category_id < 100 and consulting.startdate <= curdate() GROUP BY consulting.student_id;'
            unlearned_count['status'] = 200
            unlearned_count['data'] = common.db_connection.execute_query(query, )
            return jsonify({
            'target_students': target_students,
            'unlearned_count': unlearned_count
            })
        else:
            return jsonify({'status': 400, 'text': '데이터가 없습니다.'})
    # elif request.method == 'GET':
    #     db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
    #     unlearned_count = {}
    #     unlearned_students = []
    #     try:
    #         with db.cursor() as cur:
    #             # cur.execute(f'SELECT consulting.ban_id, COUNT(*) AS unlearned, COUNT(*) / (SELECT COUNT(*) FROM consulting WHERE category_id < 100)*100 AS unlearned_p FROM consulting WHERE category_id < 100 GROUP BY consulting.ban_id;')
    #             cur.execute(f'SELECT consulting.student_id, COUNT(*) AS unlearned FROM consulting WHERE category_id < 100 GROUP BY consulting.student_id;')
    #             unlearned_count['status'] = 200
    #             unlearned_count['data'] = cur.fetchall()
    #     except Exception as e:
    #         print(e)
    #         unlearned_count['status'] = 401
    #         unlearned_count['text'] = str(e)
    #     finally:
    #         db.close()
    #     if unlearned_count['status'] != 401: 
    #         if len(unlearned_count['data']) != 0:
    #             # total_num = 0
    #             # i=0
    #             # if(len(unlearned_count['data']) < 5):
    #             #     total_num = len(unlearned_count['data'])
    #             # else:
    #             #     total_num = 5
    #             # unlearned_count['data'].sort(key=lambda x: (-x['unlearned']))
    #             # for i in range(total_num):
    #             #     target_ban = callapi.purple_info(unlearned_count['data'][i]['ban_id'],'get_ban')
    #             #     unlearned_bans.append(target_ban)
    #             for data in unlearned_count['data']:
    #                 target_student = callapi.purple_info(data['student_id'],'get_student_info')
    #                 if target_student:
    #                     unlearned_students.append({'target_student': target_student,'unlearned_count':data})
    #             return({'unlearned_students': unlearned_students})
    #         else:                
    #             return jsonify({'status': 400, 'text': '데이터가 없습니다.'})
    #     else:
    #         return jsonify({'status': 400, 'text': '데이터가 없습니다.'})    
 