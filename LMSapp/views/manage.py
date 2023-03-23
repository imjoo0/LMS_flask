from LMSapp.views import *
from LMSapp.models import *
from flask import session  # 세션
from flask import Blueprint, render_template, jsonify, request, redirect, url_for
import json
import callapi
import pymysql
from LMSapp.views import common

bp = Blueprint('manage', __name__, url_prefix='/manage')

# 관리부서 메인 페이지
# 테스트 계정 id : T0001 pw동일
@bp.route("/", methods=['GET'])
def home():
    if request.method == 'GET':
        user = callapi.purple_info(session['user_id'],'get_teacher_info')
        # all_ban = callapi.purple_allban('get_all_ban')
        
        # all_consulting = Consulting.query.all()
        # all_task = Task.query.all()
        # all_questions = Question.query.order_by(Question.id.desc())

        # return render_template('manage.html', user=user, all_ban=all_ban, consulting_category=all_consulting_category, consultings=all_consulting, task_category=all_task_category, tasks=all_task, questions=all_questions)
        return render_template('manage.html', user=user,)

# 반 차트 관련 
@bp.route("/ban/<int:id>", methods=['GET'])
def get_ban(id):
    if request.method == 'GET':
        target_ban = callapi.purple_ban(id,'get_ban')
        if target_ban:
            db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
            switch_student = {}
            out_student = {}
            consulting = {}
            task = {}
            try:
                with db.cursor() as cur:
                    cur.execute(f'select id, ban_id from outstudent')
                    switch_student['status'] = 200
                    out_student['data'] = cur.fetchall()

                    cur.execute(f'select id, ban_id from switchstudent')
                    switch_student['status'] = 200
                    switch_student['data'] = cur.fetchall()

                    cur.execute(f"select id, ban_id, category_id, student_id, contents, startdate, deadline, week_code, done, missed from consulting")
                    consulting['status'] = 200
                    consulting['data'] = cur.fetchall()

                    cur.execute(f"select task.id, task.category_id, task.contents, task.url, task.attachments, date_format(task.startdate, '%Y-%m-%d') as startdate, date_format(task.deadline, '%Y-%m-%d') as deadline, task.priority, task.cycle, taskcategory.name, taskban.ban_id, taskban.teacher_id, taskban.done from task left join taskcategory on task.category_id = taskcategory.id left join taskban on task.id = taskban.task_id where taskban.ban_id={id};" )
                    task['status'] = 200
                    task['data'] = cur.fetchall()
            except Exception as e:
                print(e)
                # switch_student['status'] = 401
                # switch_student['text'] = str(e)
                consulting['status'] = 401
                consulting['text'] = str(e)
                task['status'] = 401
                task['text'] = str(e)
            finally:
                db.close()
            alimnote = callapi.purple_info(id,'get_alimnote')
            notice = callapi.purple_info(id,'get_notice')
            students = callapi.purple_info(target_ban['register_no'],'get_students')

            return jsonify({
            'target_ban': target_ban,
            'student_info': students,
            'all_alim' : alimnote['all'],
            'answer_alim' : alimnote['answer'],
            'switch_student': switch_student,
            'out_student': out_student,
            'notice': notice,
            'consulting': consulting,
            'task': task,
            })
        else:
            return jsonify({'status': 400, 'text': '데이터가 없습니다.'})

# 이반 퇴소 
@bp.route("/sodata", methods=['GET'])
def sodata():
    if request.method == 'GET':
        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
        switch_out_count = {}
        switch_out_bans = []

        try:
            with db.cursor() as cur:
                cur.execute(f'SELECT COALESCE(switchstudent.ban_id, outstudent.ban_id) AS ban_id, COALESCE(switch_count, 0) AS switch_count, COALESCE(out_count, 0) AS out_count FROM (SELECT ban_id, COUNT(*) AS switch_count FROM switchstudent GROUP BY ban_id) AS switch_counts LEFT OUTER JOIN (SELECT ban_id, COUNT(*) AS out_count FROM outstudent GROUP BY ban_id) AS out_counts ON switch_counts.ban_id = out_counts.ban_id LEFT OUTER JOIN switchstudent ON switch_counts.ban_id = switchstudent.ban_id LEFT OUTER JOIN outstudent ON out_counts.ban_id = outstudent.ban_id UNION SELECT COALESCE(switch_counts.ban_id, out_counts.ban_id) AS ban_id, COALESCE(switch_count, 0) AS switch_count, COALESCE(out_count, 0) AS out_count FROM (SELECT ban_id, COUNT(*) AS switch_count FROM switchstudent GROUP BY ban_id) AS switch_counts RIGHT OUTER JOIN (SELECT ban_id, COUNT(*) AS out_count FROM outstudent GROUP BY ban_id) AS out_counts ON switch_counts.ban_id = out_counts.ban_id WHERE switch_counts.ban_id IS NULL;')
                switch_out_count['status'] = 200
                switch_out_count['data'] = cur.fetchall()
        except Exception as e:
            print(e)
            switch_out_count['status'] = 401
            switch_out_count['text'] = str(e)
        finally:
            db.close()
        if switch_out_count['status'] != 401: 
            if len(switch_out_count['data']) != 0:
                for data in switch_out_count['data']:
                    target_ban = callapi.purple_ban(data['ban_id'],'get_ban')
                    switch_out_bans.append(target_ban)
                return ({'switch_out_bans': switch_out_bans,'switch_out_count':switch_out_count})
            else:
                return jsonify({'status': 400, 'text': '데이터가 없습니다.'})
        
        else:
            return jsonify({'status': 400, 'text': '데이터가 없습니다.'})
# 미학습 
@bp.route("/uldata", methods=['GET'])
def uldata():
    if request.method == 'GET':
        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
        unlearned_count = {}
        unlearned_bans = []

        try:
            with db.cursor() as cur:
                cur.execute(f'SELECT consulting.ban_id, COUNT(*) AS unlearned, COUNT(*) / (SELECT COUNT(*) FROM consulting WHERE category_id < 100)*100 AS unlearned_p FROM consulting WHERE category_id < 100 GROUP BY consulting.ban_id;')
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
                total_num = 0
                i=0
                if(len(unlearned_count['data']) < 5):
                    total_num = len(unlearned_count['data'])
                else:
                    total_num = 5
                unlearned_count['data'].sort(key=lambda x: (-x['unlearned_p']))
                for i in range(total_num):
                    target_ban = callapi.purple_ban(unlearned_count['data'][i]['ban_id'],'get_ban')
                    unlearned_bans.append(target_ban)
                return ({'unlearned_bans': unlearned_bans,'unlearned_count':unlearned_count})
            else:
                return jsonify({'status': 400, 'text': '데이터가 없습니다.'})
        
        else:
            return jsonify({'status': 400, 'text': '데이터가 없습니다.'})    
    
@bp.route('/api/get_all_questions/<int:done_code>', methods=['GET'])
def get_all_questions(done_code):
    if request.method == 'GET':
        all_questions = []
        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
        try:
            with db.cursor() as cur:
                cur.execute('select id, category, title, contents, answer from question where answer = %s;',(done_code,))
                all_questions = cur.fetchall()
        except:
            print('err')
        finally:
            db.close()
        
        return json.dumps(all_questions)

@bp.route('/api/get_consulting', methods=['GET'])
def get_consulting():
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

@bp.route('/api/delete_consulting/<int:id>', methods=['GET'])
def delete_consulting(id):
    result = {}
    if request.method == 'GET':
        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
        try:
            with db.cursor() as cur:
                cur.execute(f'delete from consulting where id={id}')
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
                cur.execute(f'delete from task where id={id}')
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
        # 업무 참고 url
        received_task_url = request.form['task_url']
        # 업무 우선순위
        received_task_priority = request.form['task_priority']
        # 업무 주기
        received_task_cycle = request.form['task_cycle']
        
        task = Task(category_id=received_category,contents=received_task,startdate=received_task_startdate,deadline=received_task_deadline,url=received_task_url,priority=received_task_priority,cycle=received_task_cycle)
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
                targets = callapi.purple_allinfo('get_nfnovel_ban_teacher')
            
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

# 전체 반에 요청 상담 저장
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
        print(b_type) 
        if b_type == 0:
            targets = callapi.purple_allinfo('get_all_ban_student')
        # plus alpha 처리   
        elif b_type == 1:
            targets = callapi.purple_allinfo('get_plusalpha_ban')
        # nf 노블 처리 
        else :
            targets = callapi.purple_allinfo('get_nfnovel_ban')
        for target in targets:
            new_consulting = Consulting(ban_id=target['ban_id'],teacher_id=target['teacher_id'], category_id=received_consulting_category, student_id=target['student_id'],contents=received_consulting_contents, startdate=received_consulting_startdate, deadline=received_consulting_deadline,done=0,missed='1111-01-01')
            db.session.add(new_consulting)
            db.session.commit()
        
        return jsonify({'result':'success'})

# 반 전체 학생에게 요청 상담 저장
@bp.route("/consulting/request_all_student/<int:b_id>/<int:t_id>", methods=['POST'])
def request_all_student(b_id,t_id):
    if request.method == 'POST':
        #  상담 카테고리 저장
        received_consulting_category = request.form['consulting_category']
        #  상담 내용 저장
        received_consulting_contents = request.form['consulting_contents']
        #  상담을 진행할 시작일 저장
        received_consulting_startdate = request.form['consulting_date']
        #  상담을 마무리할 마감일 저장
        received_consulting_deadline = request.form['consulting_deadline']
        students = callapi.purple_info(b_id,'get_student_simple')
        for student in students:
            new_consulting = Consulting(ban_id=b_id,teacher_id=t_id, category_id=received_consulting_category, student_id=student['register_no'],contents=received_consulting_contents, startdate=received_consulting_startdate, deadline=received_consulting_deadline,done=0,missed='1111-01-01')
            db.session.add(new_consulting)
            db.session.commit()
        return jsonify({'success'})

# 개별 학생에게 요청 상담 저장
@bp.route("/consulting/request_indivi_student/<int:b_id>/<int:t_id>/<int:s_id>", methods=['POST'])
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

        return jsonify({'success'})
    
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

# 선생님 문의 저장
# @bp.route('/question', methods=['POST'])
# def question():
#     question = request.form['question_contents']
#     print(question)
#     if result == 'fail':
#         return jsonify({'result': '업로드 실패'})

#     return jsonify({'result': '업로드 완료!'})