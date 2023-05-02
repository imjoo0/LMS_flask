from LMSapp.views import *
from LMSapp.models import *
from flask import session  # 세션
from flask import Blueprint, render_template, jsonify, request, redirect, url_for
import json
import callapi
import pymysql
from LMSapp.views import common
import requests

bp = Blueprint('manage', __name__, url_prefix='/manage')

# 관리부서 메인 페이지
# 테스트 계정 id : T0001 pw동일
@bp.route("/", methods=['GET'])
def home():
    if request.method == 'GET':
        user = callapi.purple_info(session['user_id'],'get_teacher_info')        
        return render_template('manage.html', user=user,)

# 본원 답변 기능
@bp.route('/answer/<int:id>', methods=['POST'])
def answer(id):
    if request.method == 'POST':
        post_url = 'https://api-alimtalk.cloud.toast.com/alimtalk/v2.2/appkeys/hHralrURkLyAzdC8/messages'
        target_question = Question.query.get_or_404(id)
        target_question.answer = 1
        answer_title = request.form['answer_title']
        answer_contents = request.form['answer_contents']
        o_ban_id = request.form['o_ban_id']

        data_sendkey = {'senderKey': "616586eb99a911c3f859352a90a9001ec2116489",
                  'templateCode': "work_cs_answer",
                  'recipientList': [{'recipientNo':target_question.mobileno, 'templateParameter': { '답변내용':answer_contents}, }, ], }
        
        headers = {"X-Secret-Key": "K6FYGdFS", "Content-Type": "application/json;charset=UTF-8", }
        http_post_requests = requests.post(post_url, json=data_sendkey, headers=headers)

        new_answer = Answer(content=answer_contents,title=answer_title,created_at=Today,reject_code=int(o_ban_id),question_id = id)
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
    
# 이반 퇴소 
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

                cur.execute('SELECT answer.title,answer.content,answer.created_at,answer.reject_code,answer.question_id FROM LMS.answer left join question on answer.question_id =question.id')
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
                cur.execute(f"SELECT * FROM consultingcategory WHERE id > 100 && id != 110;")
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
        received_task_startdate = request.form['task_date']
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
                new_task = TaskBan(ban_id=int(task_data[0]),teacher_id=int(task_data[1]), task_id=task.id ,done=0)
                db.session.add(new_task)
                db.session.commit()
        # 전체 반이 선택 된 경우
        else:
            # 전체 반에 진행 
            if received_target_ban[0] == '0':
                targets = callapi.purple_allinfo('get_all_ban_teacher')
            elif received_target_ban[0] == '1':   
                targets = callapi.purple_allinfo('get_plusalpha_ban_teacher')
            else:
                targets = callapi.purple_allinfo('get_nfinter_ban_teacher')
            
            for target in targets:
                new_task = TaskBan(ban_id=target['ban_id'],teacher_id=target['teacher_id'], task_id=task.id ,done=0)
                db.session.add(new_task)
                db.session.commit()
        return redirect('/')

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
# 상담 요청 저장
@bp.route("/consulting/<int:b_id>/<int:t_id>/<int:s_id>", methods=['POST'])
def request_indivi_student(b_id,t_id,s_id):
    if request.method == 'POST':
        #  상담 카테고리 저장
        received_consulting_category = request.form['consulting_category']
        #  상담 내용 저장
        received_consulting_contents = request.form['consulting_contents']
        #  상담을 진행할 시작일 저장
        received_consulting_startdate = request.form['consulting_date']
        #  상담을 마무리할 마감일 저장
        received_consulting_deadline = request.form['consulting_deadline']
        new_consulting = Consulting(ban_id=b_id,teacher_id=t_id, category_id=received_consulting_category, student_id=s_id,contents=received_consulting_contents, startdate=received_consulting_startdate, deadline=received_consulting_deadline,done=0,missed='1111-01-01')
        db.session.add(new_consulting)
        db.session.commit()

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
        received_consulting_startdate = request.form['consulting_date']
        #  상담을 마무리할 마감일 저장
        received_consulting_deadline = request.form['consulting_deadline']
        # 전체 반 대상 진행 일 경우 처리
        if b_type == 0:
            targets = callapi.purple_allinfo('get_all_ban_student_simple')
        # plus alpha 처리   
        elif b_type == 1:
            targets = callapi.purple_allinfo('get_plusalpha_ban')
        # nf 노블 처리 
        else:
            targets = callapi.purple_allinfo('get_nfnovel_ban')
        for target in targets:
            new_consulting = Consulting(ban_id=target['ban_id'],teacher_id=target['teacher_id'], category_id=received_consulting_category, student_id=target['student_id'],contents=received_consulting_contents, startdate=received_consulting_startdate, deadline=received_consulting_deadline,done=0,missed='1111-01-01')
            db.session.add(new_consulting)
            db.session.commit()
        
        return jsonify({'result':'success'})    
    
@bp.route("/ban_student/<int:b_id>", methods=['GET'])
def get_select_student(b_id):
    if request.method == 'GET':
        students = callapi.purple_info(b_id,'get_students')
        return jsonify({'students': students})        

@bp.route("/insert_question", methods=['GET'])
def insert_question():
    if request.method == 'GET':
        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
        try:
            with db.cursor() as cur:
                #cur.execute(f'delete from task where id={id}')
                #db.commit()
                result['status'] = 200
                result['text'] = id
        except Exception as e:
            print(e)
            result['status'] = 401
            result['text'] = str(e)
        finally:
            db.close()

        return result

