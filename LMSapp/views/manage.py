from LMSapp.views import *
from LMSapp.models import *
from flask import session  # 세션
from flask import Blueprint, render_template, jsonify, request, redirect, url_for
import config
import json
import callapi
import pymysql
import callapi

bp = Blueprint('manage', __name__, url_prefix='/manage')

# 관리부서 메인 페이지
# 테스트 계정 id : T0001 pw동일
@bp.route("/", methods=['GET'])
def home():
    if request.method == 'GET':
        user = callapi.get_teacher_info(session['user_id'])
        all_ban = callapi.all_ban_info()
        
        all_consulting_category = ConsultingCategory.query.filter(ConsultingCategory.id > 100).all()
        all_consulting = Consulting.query.all()
        all_task_category = TaskCategory.query.all()
        all_task = Task.query.all()
        all_questions = Question.query.order_by(Question.id.desc())

        return render_template('manage.html', user=user, all_ban=all_ban, consulting_category=all_consulting_category, consultings=all_consulting, task_category=all_task_category, tasks=all_task, questions=all_questions)


@bp.route('/api/get_all_questions/<int:done_code>', methods=['GET'])
def get_all_questions(done_code):
    if request.method == 'GET':
        all_questions = []
        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
        try:
            with db.cursor() as cur:
                if(done_code == 0):
                    cur.execute('select id, category, title, contents, answer from question where answer != 1;')
                else:
                    cur.execute('select id, category, title, contents, answer from question where answer = 1;')
                all_questions = cur.fetchall();
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
                all_consulting = cur.fetchall();
        except Exception as e:
            print(e)
        finally:
            db.close()

        return json.dumps(all_consulting)


@bp.route('/api/get_task', methods=['GET'])
def get_task():
    if request.method == 'GET':
        all_task = []
        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
        try:
            with db.cursor() as cur:
                cur.execute("select task.id, task.category_id, task.contents, task.url, task.attachments, date_format(task.startdate, '%Y-%m-%d') as startdate, date_format(task.deadline, '%Y-%m-%d') as deadline, task.priority, task.cycle, taskcategory.name, taskban.ban_id, taskban.teacher_id, taskban.done from task left join taskcategory on task.category_id = taskcategory.id left join taskban on task.id = taskban.task_id;")
                all_task = cur.fetchall();
        except Exception as e:
            print(e)
        finally:
            db.close()

        return json.dumps(all_task)

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


@bp.route("/ban", methods=['GET', 'POST'])
def request_consulting():
    if request.method == 'POST':
        #  상담 카테고리 저장
        received_category = request.form['consulting_category']
        #  상담 내용 저장
        received_consulting = request.form['consulting_contents']
        #  상담을 진행할 반 저장
        received_target_ban = request.form['consulting_target_ban']
        #  상담을 진행할 시작일 저장
        received_consulting_startdate = request.form['consulting_date']
        #  상담을 마무리할 마감일 저장
        received_consulting_deadline = request.form['consulting_deadline']
        
        # 전체 반이 선택 된 경우
        if received_target_ban == '전체 반':
            target_class = callapi.all_ban_info()
            for c in target_class:
                students = callapi.get_students(c['register_no'])
                for s in students:
                    new_consulting = Consulting(ban_id=c['register_no'], category_id=received_category, student_id=s['register_no'],
                                                contents=received_consulting, startdate=received_consulting_startdate, deadline=received_consulting_deadline,done=0,missed='1111-01-01')
                    db.session.add(new_consulting)
                    db.session.commit()
        # 개별 반 선택 된 경우 
        else:
            #  상담을 진행할 학생 저장
            received_target_student = request.form['consulting_target_student']
            # 전체 학생일 경우 
            if received_target_student == '전체학생':
                target_student_list = callapi.get_students(received_target_ban)
                for student in target_student_list:
                    new_consulting = Consulting(ban_id=received_target_ban, category_id=received_category, student_id=student['register_no'],
                                                contents=received_consulting, startdate=received_consulting_startdate, deadline=received_consulting_deadline,done=0,missed='1111-01-01')
                    db.session.add(new_consulting)
                    db.session.commit()
            # 개별 학생일 경우 
            else:
                new_consulting = Consulting(ban_id=received_target_ban, category_id=received_category, student_id=received_target_student,
                                            contents=received_consulting, startdate=received_consulting_startdate, deadline=received_consulting_deadline,done=0,missed='1111-01-01')
                db.session.add(new_consulting)
                db.session.commit()
        return redirect('/')
                
@bp.route("/task", methods=['GET', 'POST'])
def request_task():
    if request.method == 'POST':
        #  업무 카테고리 저장
        received_category = request.form['task_category']
        #  업무 내용 저장
        received_task = request.form['task_contents']
        #  업무을 진행할 반 저장
        received_target_ban = request.form['task_target_ban']
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
        
        # 전체 반이 선택 된 경우
        if received_target_ban == '전체 반':
            target_class = callapi.all_ban_info()
            for c in target_class:
                new_task = TaskBan(ban_id=c['register_no'],teacher_id=c['teacher_id'], task_id=task.id )
                db.session.add(new_task)
                db.session.commit()
        # 개별 반 선택 된 경우 
        else:
            target_teacher = callapi.get_ban(received_target_ban)
            target_teacher =  target_teacher['teacher_register_no']
            new_task = TaskBan(ban_id=received_target_ban,teacher_id=target_teacher, task_id=task.id)
            db.session.add(new_task)
            db.session.commit()
        return redirect('/')

@bp.route("/ban/<int:id>", methods=['GET'])
def get_ban(id):
    if request.method == 'GET':
        target_ban = callapi.get_ban(id)
        if target_ban:
            # switchstudent_num_p = 0
            # # 이반 한 학생  
            # switchstudent_num = len(SwitchStudent.query.filter(SwitchStudent.ban_id == id).all())
            # if(switchstudent_num != 0):
            #     switchstudent_num_p = round((switchstudent_num / len(SwitchStudent.query.all()))*100)
            #  # 졸업 / 퇴소 한 학생
            # outstudent_num_p = 0
            # outstudent_num = len(OutStudent.query.filter(OutStudent.ban_id == id).all())
            # if(outstudent_num != 0): 
            #     outstudent_num_p = round((outstudent_num / len(OutStudent.query.all()))*100)
            # # 미학습 발생 
            # unlearned_ttc = 0
            # unlearned_ttd = len(Consulting.query.filter((Consulting.category_id < 100)&(Consulting.ban_id==id)).all()) 
            # if(unlearned_ttd != 0):
            #     unlearned_ttc = round((unlearned_ttd / len(Consulting.query.filter(Consulting.category_id < 100).all()))*100)

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

                    cur.execute(f"select id, ban_id, category_id, student_id, contents, date_format(startdate, '%Y-%m-%d') as startdate, date_format(deadline, '%Y-%m-%d') as deadline, week_code, done, missed from consulting")
                    consulting['status'] = 200
                    consulting['data'] = cur.fetchall()

                    cur.execute(f"select task.id, task.category_id, task.contents, task.url, task.attachments, date_format(task.startdate, '%Y-%m-%d') as startdate, date_format(task.deadline, '%Y-%m-%d') as deadline, task.priority, task.cycle, taskcategory.name, taskban.ban_id, taskban.teacher_id, taskban.done from task left join taskcategory on task.category_id = taskcategory.id left join taskban on task.id = taskban.task_id where taskban.ban_id={id};" )
                    task['status'] = 200
                    task['data'] = cur.fetchall()
            except Exception as e:
                print(e)
                switch_student['status'] = 401
                switch_student['text'] = str(e)
                consulting['status'] = 401
                consulting['text'] = str(e)
                task['status'] = 401
                task['text'] = str(e)
            finally:
                db.close()
            alimnote = callapi.get_alimnote(id)[0]
            notice = callapi.get_notice(id)
            students = callapi.get_students(target_ban['register_no'])
            # student_info = []
            # for student in students:
            #      student_info.append(json.dumps(get_student_json(student)))
            # print(student_info)

            return jsonify({
            'target_ban': target_ban['register_no'],
            'name': target_ban['ban_name'],
            'teacher_name': target_ban['teacher_name'],
            'teacher_e_name': target_ban['teacher_engname'],
            'teacher_mobileno': target_ban['teacher_mobileno'],
            'teacher_email': target_ban['teacher_email'],
            'students_num': target_ban['student_num'],
            'student_info': students,
            'all_alim' : alimnote['all'],
            'answer_alim' : alimnote['answer'],
            'switch_student': switch_student,
            'out_student': out_student,
            'notice': notice,
            'consulting': consulting,
            'task': task,
            # # chart 
            # 'switchstudent_num' :switchstudent_num,
            # 'switchstudent_num_p':switchstudent_num_p,
            # 'outstudent_num':outstudent_num,
            # 'outstudent_num_p':outstudent_num_p,
            # 'unlearned_ttd':unlearned_ttd,
            # 'unlearned_ttc':unlearned_ttc
        })
        else:
            return jsonify({'status': 400, 'text': '데이터가 없습니다.'})
        

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