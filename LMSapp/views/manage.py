from LMSapp.views import *
from LMSapp.models import *
from flask import session  # 세션
from flask import Blueprint, render_template, jsonify, request, redirect, url_for
import config
import json
import callapi
from flask_paginate import Pagination, get_page_parameter, get_page_args
import pymysql

bp = Blueprint('manage', __name__, url_prefix='/manage')

# # json type not seriallizabel 해결 함수
#     # object 인 경우 -> get_student(obj)
# def get_student_json(student):
#     return {
#         'id': student['register_no'],
#         'name': student['name'],
#         'original': student['origin'],
#         'mobileno': student['mobileno'],
#         'parent_name_mobileno': '(' + student['pname'] + ')' + student['pmobileno'],
#         'register_date': student['register_date'].strftime('%Y-%m-%d')
#     }

#     # datetime인 경우 json_default()

# def json_default(value):
#   if isinstance(value, datetime.date):
#     return value.strftime('%Y-%m-%d')
#   raise TypeError('not JSON serializable')
# #   json_data = json.dumps(data, default=json_default) <- 사용시 이 포멧으로

# 관리부서 메인 페이지
# 테스트 계정 id : T0001 pw동일
@bp.route("/", methods=['GET'])
def home():
    if request.method == 'GET':
        user = callapi.get_teacher_info(session['user_id'])
        all_ban = callapi.all_ban_info()
        # ban_teacher= []
        # for ban in all_ban:
        #     ban_teacher.append(callapi.get_ban(ban['register_no']))
        # print(ban_teacher)
        
        all_consulting_category = ConsultingCategory.query.all()
        all_consulting = Consulting.query.all()
        all_task_category = TaskCategory.query.all()
        all_task = Task.query.all()
        all_questions = Question.query.order_by(Question.id.desc())
        #page = request.args.get('page',type=int,default=1)
        #all_questions = all_questions.paginate(page=page, per_page=10)

        return render_template('manage.html', user=user, all_ban=all_ban, consulting_category=all_consulting_category, consultings=all_consulting, task_category=all_task_category, tasks=all_task, questions=all_questions)


@bp.route('/api/get_all_questions', methods=['GET'])
def get_all_questions():
    if request.method == 'GET':
        db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
        try:
            with db.cursor() as cur:
                cur.execute('select title, contents, answer_id, teacher_id from question;')
                all_questions = cur.fetchall();
                print(all_questions)
        except:
            print('err')
        finally:
            db.close()

        return json.dumps(all_questions)


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
                                                contents=received_consulting, startdate=received_consulting_startdate, deadline=received_consulting_deadline)
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
                                                contents=received_consulting, startdate=received_consulting_startdate, deadline=received_consulting_deadline)
                    db.session.add(new_consulting)
                    db.session.commit()
            # 개별 학생일 경우 
            else:
                new_consulting = Consulting(ban_id=received_target_ban, category_id=received_category, student_id=received_target_student,
                                            contents=received_consulting, startdate=received_consulting_startdate, deadline=received_consulting_deadline)
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
            'student_info': students
        })

# 선생님 문의 저장
# @bp.route('/question', methods=['POST'])
# def question():
#     question = request.form['question_contents']
#     print(question)
#     if result == 'fail':
#         return jsonify({'result': '업로드 실패'})

#     return jsonify({'result': '업로드 완료!'})
