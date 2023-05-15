from LMSapp.views import *
from LMSapp.models import *
from flask import session  # 세션
from flask import Blueprint, render_template, jsonify, request, redirect, url_for
import json
import callapi
import pymysql
from LMSapp.views import common
import requests
from urllib.parse import unquote
import datetime
from views.main_views import authrize

bp = Blueprint('manage', __name__, url_prefix='/manage')

# 관리부서 메인 페이지
# 테스트 계정 id : T0001 pw동일
@bp.route("/", methods=['GET'])
@authrize
def home(u):
    if request.method == 'GET':
        user = User.query.filter(User.user_id == u['user_id']).first()        
        return render_template('manage.html', user=user,)

# 본원 답변 기능
@bp.route('/answer/<int:id>/<int:done_code>', methods=['POST'])
@authrize
def answer(u,id,done_code):
    if request.method == 'POST':
        answer_title = request.form['answer_title']
        answer_contents = request.form['answer_contents']
        o_ban_id = request.form['o_ban_id']
        target_question = Question.query.get_or_404(id)
        target_question.answer = 1

        if(done_code == 0):
            post_url = 'https://api-alimtalk.cloud.toast.com/alimtalk/v2.2/appkeys/hHralrURkLyAzdC8/messages'
            new_answer = Answer(content=answer_contents,title=answer_title,created_at=Today,reject_code=int(o_ban_id),question_id = id,writer_id = u['id'])
            db.session.add(new_answer)
            data_sendkey = {'senderKey': "616586eb99a911c3f859352a90a9001ec2116489",
                'templateCode': "work_cs_answer",
                'recipientList': [{'recipientNo':target_question.mobileno, 'templateParameter': { '답변내용':answer_contents}, }, ], }
            headers = {"X-Secret-Key": "K6FYGdFS", "Content-Type": "application/json;charset=UTF-8", }
            http_post_requests = requests.post(post_url, json=data_sendkey, headers=headers)
        else:
            target_answer = Answer.query.filter(Answer.question_id == id).first()
            if(answer_title != '' or None):
                print(answer_title)
                target_answer.title = answer_title
            if(answer_contents != '' or None):
                target_answer.content = answer_contents
            target_answer.created_at = Today
            target_answer.reject_code = int(o_ban_id)
            target_answer.question_id = id
            target_answer.writer_id = session['user_registerno']

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

# 본원 답변 종류 바꾸기 
@bp.route('/q_kind/<int:id>', methods=['POST'])
def q_kind(id):
    if request.method == 'POST':
        URI = 'http://118.131.85.245:9888/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2'
        q_kind = request.form['question_kind']
        target_question = Question.query.get_or_404(id)
        payloadText = ''
        if(q_kind == 0):
            Synologytoken = '"PBj2WnZcmdzrF2wMhHXyzafvlF6i1PTaPf5s4eBuKkgCjBCOImWMXivfGKo4PQ8q"'
            payloadText  = '일반 문의로 변경된 문의가 있습니다 \n 제목:'+ target_question.title +'\n'+target_question.contents
        elif(q_kind == 4):
            Synologytoken = '"iMUOvyhPeqCzEeBniTJKf3y6uflehbrB2kddhLUQXHwLxsXHxEbOr2K4qLHvvEIg"'
            payloadText  = '기술 문의로 변경된 문의가 있습니다 \n 제목:'+ target_question.title +'\n'+target_question.contents
        elif(q_kind == 5):
            Synologytoken = '"MQzg6snlRV4MFw27afkGXRmfghHRQVcM77xYo5khI8Wz4zPM4wLVqXlu1O5ppWLv"'
            payloadText  = '내근티처 문의로 변경된 문의가 있습니다 \n 제목:'+ target_question.title +'\n'+target_question.contents
        else:
            Synologytoken = '"PBj2WnZcmdzrF2wMhHXyzafvlF6i1PTaPf5s4eBuKkgCjBCOImWMXivfGKo4PQ8q"'
            if(q_kind == 1):
                payloadText  = '이반 요청으로 변경된 문의가 있습니다 \n 제목:'+ target_question.title +'\n'+target_question.contents
            elif(q_kind==2):
                payloadText  = '퇴소 요청으로 변경된 문의가 있습니다 \n 제목:'+ target_question.title +'\n'+target_question.contents
        
        target_question.category = q_kind
        db.session.commit()
        requestURI = URI + '&token=' + Synologytoken + '&payload={"text": "' + payloadText + '"}'
        try:
            response = requests.get(requestURI)
            response.raise_for_status()
            print(f"statusCode: {response.status_code}")
        except requests.exceptions.RequestException as e:
            print("시놀로지 전송 실패")
            print(e)
        return jsonify({'result': '문의 종류 수정 완료'})
      
@bp.route("/qa", methods=['GET'])
def get_sodata():
    if request.method == 'GET':
        question = []
        answer = []
        attach = []
        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
        try:
            with db.cursor() as cur:
                cur.execute('select * from question')
                question = cur.fetchall()

                cur.execute('SELECT user.eng_name as writer, answer.title,answer.content,answer.created_at,answer.reject_code,answer.question_id FROM LMS.answer left join question on answer.question_id =question.id left join user on user.id = answer.writer_id;')
                answer = cur.fetchall()

                cur.execute('select question_id,file_name,id from attachment')
                attach = cur.fetchall()

        except Exception as e:
            print(e)
        finally:
            db.close()
        return jsonify({'question':question,'answer':answer,'attach':attach})

# 미학습 
@bp.route("/uldata", methods=['GET'])
def uldata():
    if request.method == 'GET':
        target_students = callapi.purple_allinfo('get_all_student')
        if target_students:
            db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
            unlearned_count = {}
            try:
                with db.cursor() as cur:
                    cur.execute(f'SELECT consulting.student_id, COUNT(*) AS unlearned FROM consulting WHERE category_id < 100 and consulting.startdate <= curdate() GROUP BY consulting.student_id;')
                    unlearned_count['status'] = 200
                    unlearned_count['data'] = cur.fetchall()

            except Exception as e:
                print(e)
                unlearned_count['status'] = 401
                unlearned_count['text'] = str(e)
            finally:
                db.close()
            return jsonify({
            'target_students': target_students,
            'unlearned_count': unlearned_count
            })
        else:
            return jsonify({'status': 400, 'text': '데이터가 없습니다.'})
    elif request.method == 'GET':
        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
        unlearned_count = {}
        unlearned_students = []
        try:
            with db.cursor() as cur:
                # cur.execute(f'SELECT consulting.ban_id, COUNT(*) AS unlearned, COUNT(*) / (SELECT COUNT(*) FROM consulting WHERE category_id < 100)*100 AS unlearned_p FROM consulting WHERE category_id < 100 GROUP BY consulting.ban_id;')
                cur.execute(f'SELECT consulting.student_id, COUNT(*) AS unlearned FROM consulting WHERE category_id < 100 GROUP BY consulting.student_id;')
                unlearned_count['status'] = 200
                unlearned_count['data'] = cur.fetchall()
        except Exception as e:
            print(e)
            unlearned_count['status'] = 401
            unlearned_count['text'] = str(e)
        finally:
            db.close()
        if unlearned_count['status'] != 401: 
            if len(unlearned_count['data']) != 0:
                # total_num = 0
                # i=0
                # if(len(unlearned_count['data']) < 5):
                #     total_num = len(unlearned_count['data'])
                # else:
                #     total_num = 5
                # unlearned_count['data'].sort(key=lambda x: (-x['unlearned']))
                # for i in range(total_num):
                #     target_ban = callapi.purple_info(unlearned_count['data'][i]['ban_id'],'get_ban')
                #     unlearned_bans.append(target_ban)
                for data in unlearned_count['data']:
                    target_student = callapi.purple_info(data['student_id'],'get_student_info')
                    if target_student:
                        unlearned_students.append({'target_student': target_student,'unlearned_count':data})
                return({'unlearned_students': unlearned_students})
            else:                
                return jsonify({'status': 400, 'text': '데이터가 없습니다.'})
        else:
            return jsonify({'status': 400, 'text': '데이터가 없습니다.'})    
    
@bp.route("/consulting_category", methods=['GET'])
def get_all_consulting_category():
    if request.method == 'GET':
        consulting_category = []
        
        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
        try:
            with db.cursor() as cur:
                cur.execute(f"SELECT * FROM consultingcategory WHERE id > 100 && id != 110 && id != 111;")
                consulting_category = cur.fetchall()

        except:
                print('err')
        finally:
                db.close()        
        return jsonify({'consulting_category':consulting_category})
 
@bp.route("/task_category", methods=['GET'])
def get_all_task_category():
    if request.method == 'GET':
        task_category = []
        
        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
        try:
            with db.cursor() as cur:
                cur.execute(f"SELECT * FROM taskcategory;")
                task_category = cur.fetchall()

        except:
                print('err')
        finally:
                db.close()        
        return jsonify({'task_category':task_category})

@bp.route('/get_consulting_history/<int:student_id>', methods=['GET'])
def get_consulting_history(student_id):
    if request.method == 'GET':
        all_consulting = []
        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
        try:
            with db.cursor() as cur:
                cur.execute("select consulting.id, consulting.ban_id, consulting.category_id, consulting.student_id, consulting.contents, consulting.week_code, consulting.done, consulting.category_id, date_format(consulting.startdate, '%Y-%m-%d') as startdate, date_format(consulting.deadline, '%Y-%m-%d') as deadline, consultingcategory.name from consulting left join consultingcategory on consultingcategory.id = consulting.category_id;")
                all_consulting = cur.fetchall()
        except Exception as e:
            print(e)
        finally:
            db.close()

        return json.dumps(all_consulting)

@bp.route('/api/delete_consulting/<string:contents>/<int:ban_id>', methods=['GET'])
def delete_consulting(contents,ban_id):
    result = {}
    if request.method == 'GET':
        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
        try:
            with db.cursor() as cur:
                cur.execute('DELETE FROM consulting WHERE contents=%s AND ban_id=%s', (contents, ban_id))
                db.commit()
                result['status'] = 200
                result['text'] = 'Success'
        except Exception as e:
            print(e)
            result['status'] = 401
            result['text'] = str(e)
        finally:
            db.close()
        return jsonify(result)


@bp.route('/api/get_task', methods=['GET'])
def get_task():
    if request.method == 'GET':
        all_task = []
        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
        try:
            with db.cursor() as cur:
                cur.execute("select task.id, task.category_id, task.contents, task.url, task.attachments, date_format(task.startdate, '%Y-%m-%d') as startdate, date_format(task.deadline, '%Y-%m-%d') as deadline, task.priority, task.cycle, taskcategory.name from task left join taskcategory on task.category_id = taskcategory.id;")
                all_task = cur.fetchall()
        except Exception as e:
            print(e)
        finally:
            db.close()

        return json.dumps(all_task)

# 오늘 해야할 업무의 반 이름들 
@bp.route("/taskban/<int:task_id>", methods=['GET'])
def taskban(task_id):
    if request.method == 'GET':
        tb = TaskBan.query.filter(TaskBan.task_id == task_id).all()
        return json.dumps(tb)
        # return jsonify({'target_taskban':tb})

@bp.route('/api/update_consulting', methods=['GET'])
def update_task():
    if request.method == 'GET':
        result = {}
        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
        try:
            with db.cursor() as cur:
                #cur.execute(f'update consulting set content='' where id={id}')
                result['status'] = 200
                result['text'] = str(request.args.get('text'))
        except Exception as e:
            print(e)
            result['status'] = 401
            result['text'] = str(e)
        finally:
            db.close()

        return result


@bp.route('/api/delete_task/<int:id>', methods=['GET'])
def delete_task(id):
    result = {}
    if request.method == 'GET':
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

# 업무 요청  
@bp.route("/request_task", methods=['GET'])
def request_task():
    if request.method == 'GET':
        all_task_category = []
        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
        try:
            with db.cursor() as cur:
                cur.execute("select taskcategory.id, taskcategory.name from taskcategory;")
                all_task_category = cur.fetchall()
        except Exception as e:
            print(e)
        finally:
            db.close()

        return jsonify({'all_task_category':all_task_category})

# 요청 업무 저장 
@bp.route("/task", methods=['POST'])
def make_task():
    if request.method == 'POST':
        #  업무 카테고리 저장
        received_category = request.form['task_category']
        #  업무 내용 저장
        received_task = request.form['task_contents']
        #  업무을 진행할 시작일 저장
        received_task_startdate = datetime.datetime.strptime(request.form['task_date'], "%Y-%m-%d").date()

        #  업무을 마무리할 마감일 저장
        received_task_deadline = request.form['task_deadline']
        # 업무 우선순위
        received_task_priority = request.form['task_priority']
        # 업무 주기
        received_task_cycle = request.form['task_cycle']
        
        task = Task(category_id=received_category,contents=received_task,startdate=received_task_startdate,deadline=received_task_deadline,priority=received_task_priority,cycle=received_task_cycle)
        db.session.add(task)
        db.session.commit()

        #  업무 진행할 반 저장
        received_target_ban = request.form.getlist('task_target_ban[]')

        if '_' in received_target_ban[0]:
            for target in received_target_ban:
                task_data = target.split('_')
                teacher_id=int(task_data[1])
                new_task = TaskBan(ban_id=int(task_data[0]),teacher_id=teacher_id, task_id=task.id ,done=0)
                db.session.add(new_task)
                db.session.commit()

                teacher_mobile_no = User.query.filter(User.id == teacher_id).first().mobileno
                if(received_task_startdate < Today and (teacher_mobile_no != "입력 바랍니다" or teacher_mobile_no != "000-0000-0000")):
                    post_url = 'https://api-alimtalk.cloud.toast.com/alimtalk/v2.2/appkeys/hHralrURkLyAzdC8/messages'
                    data_sendkey = {'senderKey': "616586eb99a911c3f859352a90a9001ec2116489",
                        'templateCode': "task_cs",
                        'recipientList': [{'recipientNo':teacher_mobile_no, 'templateParameter': { '반 이름':task_data[2], '업무내용': received_task, '마감기한': received_task_deadline}, }, ], }
                    headers = {"X-Secret-Key": "K6FYGdFS", "Content-Type": "application/json;charset=UTF-8", }
                    http_post_requests = requests.post(post_url, json=data_sendkey, headers=headers)

        # 전체 반이 선택 된 경우
        else:
            # 전체 반에 진행 
            if received_target_ban[0] == '0':
                targets = callapi.purple_allinfo('get_all_ban_teacher')
            elif received_target_ban[0] == '1':   
                targets = callapi.purple_allinfo('get_plusalpha_ban_teacher')
            elif received_target_ban[0] == '2': 
                targets = callapi.purple_allinfo('get_nfinter_ban_teacher')
            elif received_target_ban[0] == '3': 
                targets = callapi.purple_allinfo('get_sixteen_ban_teacher')
            elif received_target_ban[0] == '4': 
                targets = callapi.purple_allinfo('get_seventeen_ban_teacher')
            elif received_target_ban[0] == '5': 
                targets = callapi.purple_allinfo('get_eighteen_ban_teacher')
            
            for target in targets:
                new_task = TaskBan(ban_id=target['ban_id'],teacher_id=target['teacher_id'], task_id=task.id ,done=0)
                db.session.add(new_task)
                db.session.commit()
                if(received_task_startdate < Today and (target['mobileno'] != "입력 바랍니다" or target['mobileno'] != "000-0000-0000")):
                    post_url = 'https://api-alimtalk.cloud.toast.com/alimtalk/v2.2/appkeys/hHralrURkLyAzdC8/messages'
                    data_sendkey = {'senderKey': "616586eb99a911c3f859352a90a9001ec2116489",
                        'templateCode': "task_cs",
                        'recipientList': [{'recipientNo':target['mobileno'], 'templateParameter': { '반 이름':target['ban_name'], '업무내용': received_task, '마감기한': received_task_deadline}, }, ], }
                    headers = {"X-Secret-Key": "K6FYGdFS", "Content-Type": "application/json;charset=UTF-8", }
                    http_post_requests = requests.post(post_url, json=data_sendkey, headers=headers)
        return redirect('/manage')

# 상담 요청  
@bp.route("/request_consulting", methods=['GET'])
def request_consulting():
    if request.method == 'GET':
        all_consulting_category = []
        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
        try:
            with db.cursor() as cur:
                cur.execute("select consultingcategory.id, consultingcategory.name from consultingcategory where consultingcategory.id > 100 and consultingcategory.id != 110;")
                all_consulting_category = cur.fetchall()
        except Exception as e:
            print(e)
        finally:
            db.close()

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
        print(teacher_mobile_no)
        if(received_consulting_startdate < Today and (teacher_mobile_no != "입력 바랍니다" or teacher_mobile_no != "000-0000-0000")):
            post_url = 'https://api-alimtalk.cloud.toast.com/alimtalk/v2.2/appkeys/hHralrURkLyAzdC8/messages'
            data_sendkey = {'senderKey': "616586eb99a911c3f859352a90a9001ec2116489",
            'templateCode': "consulting_cs",
            'recipientList': [{'recipientNo':teacher_mobile_no, 'templateParameter': { '원번':b_name, '원생이름': '전체 원생 대상', '상담내용': received_consulting_contents, '마감기한': received_consulting_deadline}, }, ], }
            headers = {"X-Secret-Key": "K6FYGdFS", "Content-Type": "application/json;charset=UTF-8", }
            http_post_requests = requests.post(post_url, json=data_sendkey, headers=headers)

        return jsonify({'result':'success'})    

# 개별 원생 상담 요청 저장
@bp.route("/consulting/<int:b_id>/<int:t_id>/<int:s_id>/", methods=['POST'])
def request_indivi_student(b_id,t_id,s_id,origin,s_name):
    if request.method == 'POST':
        post_url = 'https://api-alimtalk.cloud.toast.com/alimtalk/v2.2/appkeys/hHralrURkLyAzdC8/messages'
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
        new_consulting = Consulting(ban_id=b_id,teacher_id=t_id, category_id=received_consulting_category, student_id=s_id,student_name=student_name,student_engname=student_engname,origin=origin,contents=received_consulting_contents, startdate=received_consulting_startdate, deadline=received_consulting_deadline,done=0,missed='1111-01-01')
        db.session.add(new_consulting)
        db.session.commit()

        teacher_mobile_no = User.query.filter(User.id == t_id).first().mobileno
        if(received_consulting_startdate < Today and (teacher_mobile_no != "입력 바랍니다" or teacher_mobile_no != "000-0000-0000")):
            post_url = 'https://api-alimtalk.cloud.toast.com/alimtalk/v2.2/appkeys/hHralrURkLyAzdC8/messages'
            data_sendkey = {'senderKey': "616586eb99a911c3f859352a90a9001ec2116489",
            'templateCode': "consulting_cs",
            'recipientList': [{'recipientNo':teacher_mobile_no, 'templateParameter': { '원번':origin, '원생이름': s_name, '상담내용': received_consulting_contents, '마감기한': received_consulting_deadline}, }, ], }
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
            if(received_consulting_startdate < Today and(ban['mobileno'] != "입력 바랍니다" or ban['mobileno'] != "000-0000-0000")):
                post_url = 'https://api-alimtalk.cloud.toast.com/alimtalk/v2.2/appkeys/hHralrURkLyAzdC8/messages'
                data_sendkey = {'senderKey': "616586eb99a911c3f859352a90a9001ec2116489",
                        'templateCode': "consulting_cs",
                        'recipientList': [{'recipientNo':ban['mobileno'], 'templateParameter': { '원번':ban['ban_name'], '원생이름': '전체 원생 대상', '상담내용': received_consulting_contents, '마감기한': received_consulting_deadline}, }, ], }
                headers = {"X-Secret-Key": "K6FYGdFS", "Content-Type": "application/json;charset=UTF-8", }
                http_post_requests = requests.post(post_url, json=data_sendkey, headers=headers)
        
        return jsonify({'result':'success'})    

@bp.route("/ban_student/<int:b_id>", methods=['GET'])
def get_select_student(b_id):
    if request.method == 'GET':
        students = callapi.purple_info(b_id,'get_students')
        return jsonify({'students': students})        


