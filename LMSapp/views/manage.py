from LMSapp.views import *
from LMSapp.models import *
from LMSapp.views import common
from LMSapp import pydb

from flask import session  # 세션
from flask import Blueprint, render_template, jsonify, request, redirect, url_for
import json
import callapi
import pymysql

bp = Blueprint('manage', __name__, url_prefix='/manage')

# 관리부서 메인 페이지
# 테스트 계정 id : T0001 pw동일
@bp.route("/", methods=['GET'])
def home():
    if request.method == 'GET':
        user = callapi.purple_info(session['user_id'],'get_teacher_info')
        all_ban = callapi.purple_allban('get_all_ban')
        
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
        try:
            with pydb.cursor() as cur:
                cur.execute('select id, category, title, contents, answer from question where answer = %s;',(done_code,))
                all_questions = cur.fetchall()
        except:
            print('err')
        finally:
            pydb.close()
        
        return json.dumps(all_questions)

@bp.route('/api/get_consulting', methods=['GET'])
def get_consulting():
    if request.method == 'GET':
        all_consulting = []
        try:
            with pydb.cursor() as cur:
                cur.execute("select consulting.id, consulting.ban_id, consulting.category_id, consulting.student_id, consulting.contents, consulting.week_code, consulting.done, consulting.category_id, date_format(consulting.startdate, '%Y-%m-%d') as startdate, date_format(consulting.deadline, '%Y-%m-%d') as deadline, consultingcategory.name from consulting left join consultingcategory on consultingcategory.id = consulting.category_id;")
                all_consulting = cur.fetchall()
        except Exception as e:
            print(e)
        finally:
            pydb.close()

        return json.dumps(all_consulting)

@bp.route('/api/get_task', methods=['GET'])
def get_task():
    if request.method == 'GET':
        all_task = []
        try:
            with pydb.cursor() as cur:
                cur.execute("select task.id, task.category_id, task.contents, task.url, task.attachments, date_format(task.startdate, '%Y-%m-%d') as startdate, date_format(task.deadline, '%Y-%m-%d') as deadline, task.priority, task.cycle, taskcategory.name from task left join taskcategory on task.category_id = taskcategory.id;")
                all_task = cur.fetchall()
        except Exception as e:
            print(e)
        finally:
            pydb.close()

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
        try:
            with pydb.cursor() as cur:
                #cur.execute(f'update consulting set content='' where id={id}')
                result['status'] = 200
                result['text'] = str(request.args.get('text'))
        except Exception as e:
            print(e)
            result['status'] = 401
            result['text'] = str(e)
        finally:
            pydb.close()

        return result


@bp.route('/api/delete_consulting/<int:id>', methods=['GET'])
def delete_consulting(id):
    result = {}
    if request.method == 'GET':
        try:
            with pydb.cursor() as cur:
                cur.execute(f'delete from consulting where id={id}')
                pydb.commit()
                result['status'] = 200
                result['text'] = id
        except Exception as e:
            print(e)
            result['status'] = 401
            result['text'] = str(e)
        finally:
            pydb.close()

        return result


@bp.route('/api/delete_task/<int:id>', methods=['GET'])
def delete_task(id):
    result = {}
    if request.method == 'GET':
        try:
            with pydb.cursor() as cur:
                cur.execute(f'delete from task where id={id}')
                pydb.commit()
                result['status'] = 200
                result['text'] = id
        except Exception as e:
            print(e)
            result['status'] = 401
            result['text'] = str(e)
        finally:
            pydb.close()

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
            target_class = callapi.purple_allban('get_all_ban')
            for c in target_class:
                students = callapi.purple_info(c['register_no'],'get_students')
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
                target_student_list = callapi.purple_info(received_target_ban,'get_students')
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
            target_class = callapi.purple_allban('get_all_ban')
            for c in target_class:
                new_task = TaskBan(ban_id=c['register_no'],teacher_id=c['teacher_register_no'], task_id=task.id ,done=0)
                db.session.add(new_task)
                db.session.commit()
        elif received_target_ban == 'plusalpha':
            target_class = callapi.purple_allban('get_plusalpha_ban')
            for c in target_class:
                new_task = TaskBan(ban_id=c['register_no'],teacher_id=c['teacher_register_no'], task_id=task.id,done=0)
                db.session.add(new_task)
                db.session.commit()
        # 개별 반 선택 된 경우 
        else:
            target_teacher = callapi.purple_ban(received_target_ban,'get_ban')
            target_teacher =  target_teacher['teacher_register_no']
            new_task = TaskBan(ban_id=received_target_ban,teacher_id=target_teacher, task_id=task.id,done=0)
            db.session.add(new_task)
            db.session.commit()
        return redirect('/')

@bp.route("/ban/<int:id>", methods=['GET'])
def get_ban(id):
    if request.method == 'GET':
        target_ban = callapi.purple_ban(id,'get_ban')
        if target_ban:
            switch_student = {}
            out_student = {}
            consulting = {}
            task = {}
            try:
                with pydb.cursor() as cur:
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
                pydb.close()
            alimnote = callapi.purple_info(id,'get_alimnote')
            notice = callapi.purple_info(id,'get_notice')
            students = callapi.purple_info(target_ban['register_no'],'get_students')

            return jsonify({
            # 'target_ban': target_ban['register_no'],
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
        

@bp.route("/insert_question", methods=['GET'])
def insert_question():
    if request.method == 'GET':
        try:
            with pydb.cursor() as cur:
                #cur.execute(f'delete from task where id={id}')
                #pydb.commit()
                result['status'] = 200
                result['text'] = id
        except Exception as e:
            print(e)
            result['status'] = 401
            result['text'] = str(e)
        finally:
            pydb.close()

        return result

# 선생님 문의 저장
# @bp.route('/question', methods=['POST'])
# def question():
#     question = request.form['question_contents']
#     print(question)
#     if result == 'fail':
#         return jsonify({'result': '업로드 실패'})

#     return jsonify({'result': '업로드 완료!'})