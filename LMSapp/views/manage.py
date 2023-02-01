from LMSapp.views import *
from LMSapp.models import *
from flask import session  # 세션
from flask import Blueprint, render_template, jsonify, request, redirect, url_for
import config
import json
import callapi

bp = Blueprint('manage', __name__, url_prefix='/manage')


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
        all_questions = Question.query.all()
        return render_template('manage.html', user=user, all_ban=all_ban, consulting_category=all_consulting_category, consultings=all_consulting,task_category =  all_task_category,tasks=all_task,questions=all_questions)

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
            target_class = Ban.query.all()
            for c in target_class:
                for s in c.students:
                    new_consulting = Consulting(ban_id=c.register_no, category_id=received_category, student_id=s.register_no,
                                                contents=received_consulting, startdate=received_consulting_startdate, deadline=received_consulting_deadline)
                    db.session.add(new_consulting)
                    db.session.commit()
        # 개별 반 선택 된 경우 
        else:
            #  상담을 진행할 학생 저장
            received_target_student = request.form['consulting_target_student']
            # 전체 학생일 경우 
            if received_target_student == '전체학생':
                target_student_list = Ban.query.filter(Ban.register_no == received_target_ban).all()[0].students.all()
                for student in target_student_list:
                    new_consulting = Consulting(ban_id=received_target_ban, category_id=received_category, student_id=student.register_no,
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
        # 전체 반이 선택 된 경우
        if received_target_ban == '전체 반':
            target_class = Ban.query.all()
            for c in target_class:
                    new_task = Task(ban_id=c.register_no, category_id=received_category, teacher_id=c.teacher_id,
                                                contents=received_task, startdate=received_task_startdate, deadline=received_task_deadline,url=received_task_url,priority=received_task_priority,cycle=received_task_cycle)
                    db.session.add(new_task)
                    db.session.commit()
        # 개별 반 선택 된 경우 
        else:
            target_teacher = Ban.query.filter(Ban.register_no == received_target_ban).all()[0].teacher_id
            new_task = Task(ban_id=received_target_ban, category_id=received_category, teacher_id=target_teacher,
                                        contents=received_task, startdate=received_task_startdate, deadline=received_task_deadline,url=received_task_url,priority=received_task_priority,cycle=received_task_cycle)
            db.session.add(new_task)
            db.session.commit()
        return redirect('/')

@bp.route("/ban/<int:id>", methods=['GET'])
def get_ban(id):
    if request.method == 'GET':
        target_ban = callapi.get_ban(id)
        print(target_ban['register_no'])
        students = callapi.get_students(target_ban['register_no'])
        print(students)
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
