from flask import Blueprint,render_template, jsonify, request,redirect,url_for,flash
import config 
from datetime import datetime, timedelta, date

bp = Blueprint('teacher', __name__, url_prefix='/teacher')

from flask import session  # 세션
from LMSapp.models import *
from LMSapp.views import *

import callapi

# 선생님 메인 페이지
# 테스트 계정 id : T1031 pw동일  
@bp.route("/", methods=['GET'])
def home():
    if request.method =='GET':
        teacher_info = callapi.get_teacher_info(session['user_id'])

        mystudents_info = callapi.get_mystudents(session['user_id'])

        mybans_info = callapi.get_mybans(session['user_id'])

        all_ban_info = callapi.all_ban_info()

        all_task_category = TaskCategory.query.all()
  
        # task_id를 기준으로 소팅 
        my_tasks = TaskBan.query.filter(TaskBan.teacher_id==teacher_info['register_no']).all()

        my_tasks.sort(key = lambda x:x.task_id)
        tc = []
        for task in my_tasks:
            tc.append(task.task_id)        
        tc = list(set(tc))

        category_set = []
        for cate in tc:
            t = Task.query.filter(Task.id==cate).all()[0]
            category_set.append(t.category_id)
        category_set = list(set(category_set))

        target_task = []
        for category in category_set:
            target_data = {}
            target_data['category'] = TaskCategory.query.filter(TaskCategory.id == category).all()[0].name
            target_data['task'] = []
            for t in tc:
                task_data = {}
                task_data['task']=Task.query.filter(Task.id == t).all()[0]
                task_data['ban_data'] = []
                for tb in my_tasks:
                    if t == tb.task_id:
                        data = {}
                        data['id'] = tb.id
                        ban = callapi.get_ban(tb.ban_id)
                        data['ban'] = ban['ban_name']
                        task_data['ban_data'].append(data)
                target_data['task'].append(task_data)
            target_task.append(target_data)


        # for t in tc:
        #     target_data = {}
        #     target_data['task'] = Task.query.filter(Task.id == t).all()[0]
        #     target_data['category_id'] =  target_data['task'].category_id
        #     target_data['task_data'] = []
        #     for tb in my_tasks:
        #         if t == tb.task_id:
        #             data = {}
        #             data['id'] = tb.id
        #             data['ban'] = callapi.get_ban(tb.ban_id)
        #             target_data['task_data'].append(data)
        #     target_task.append(target_data)

                

        # i=0
        # j=1
        # for i in range(len(target_task)):
        #     for j in range(len(target_task)-1):
        #         if target_task[i]['category_id'] == target_task[j]['category_id']:
        #             target_task[i]['task_data'].append(target_task[j])
        #             target_task.pop(j)    
        # print(target_task)
        

            
        # for target in target_task:
        

        #     intersection = list(set(task_category.tasks) & set(user.tasks))

        # 로그인한 사용자의 업무들의 카테고리 중복 제거해서 저장 
        # tc=[]
        # for t in user.tasks:
        #     tc.append(t.category_id)
        # list(set(tc))

        # for task_category in all_task_category:
        #     if task_category.id in tc :
        #         intersection = list(set(task_category.tasks) & set(user.tasks))
        #         tatal_task_num = len(intersection)-1
        #         print(tatal_task_num)
        #         for i in range(tatal_task_num):
        #             if (intersection[i].contents == intersection[i+1].contents):
        #                 print(intersection[i])
        # for t in tc:
        #     target_task.append(list(st.intersection(all_task_category[t-1].tasks)))
        # print(target_task)

        my_questions = Question.query.filter(Question.teacher_id == session['user_registerno']).all()
        print(my_questions)
        return render_template('teacher.html',user=teacher_info,my_bans=mybans_info,all_ban=all_ban_info,all_task_category=all_task_category,target_task=target_task,students=mystudents_info, questions=my_questions)

# 테스트 계정 id : T1031 pw동일  
@bp.route("/<int:id>", methods=['POST','GET'])
def update_done(id):
    target_task = TaskBan.query.get_or_404(id)
    target_task.done = 1
    try:
        db.session.commit()
        return redirect('/')
    except:
        return 'There was an issue updating your work'

# 선생님 문의 저장 
@bp.route('/question/<int:id>', methods=['GET','POST'])
def question(id):
    if request.method == 'POST':
        question_category = request.form['question_category']
        title = request.form['question_title']
        contents = request.form['question_contents']
        teacher = session['user_registerno']
        create_date = datetime.now().date()

        if question_category == '일반':
            new_question = Question(category=0,title=title,contents=contents,teacher_id=teacher,create_date=create_date)
        elif question_category == '이반':
            ban_id = request.form['ban_id']
            student_id = request.form['target_student'] 
            new_ban = request.form['new_ban_id']
            new_question = Question(category=2,title=title,contents=contents,teacher_id=teacher,ban_id=ban_id,student_id=student_id,new_ban_id=new_ban,create_date=create_date)
        elif question_category == '퇴소':
            ban_id = request.form['o_ban_id']
            student_id = request.form['o_target_student'] 
            new_question = Question(category=1,title=title,contents=contents,teacher_id=teacher,ban_id=ban_id,student_id=student_id,create_date=create_date)
        elif question_category == '취소/환불':
            ban_id = request.form['o_ban_id']
            student_id = request.form['o_target_student'] 
            new_question = Question(category=3,title=title,contents=contents,teacher_id=teacher,ban_id=ban_id,student_id=student_id,create_date=create_date)
        
        db.session.add(new_question)
        db.session.commit()

        # 시행 안댐.. alert 기능  
        flash("문의 저장완료 되었습니다")
        return redirect('/')

    elif request.method == 'GET':
        q = Question.query.filter(Question.id == id).all()[0]
        teacher_info = callapi.get_teacher_info(session['user_id'])
        a = Answer.query.filter(Answer.question_id == id).all()[0]
        
        if q.category == 0:
            return jsonify({
            'cateogry':'일반문의',
            'title': q.title,
            'contents':q.contents,
            'create_date':q.create_date,
            'teacher': teacher_info['name'],
            'teacher_e': teacher_info['engname'],
            'answer' : a.content,
            'answer_at': a.created_at
            })
        else:
            s = callapi.get_student_info(q.student_id )

            b = callapi.get_ban(q.ban_id )    

            if q.category == 2:
                return jsonify({
                'cateogry':'이반 요청',
                'title': q.title,
                'contents':q.contents,
                'create_date':q.create_date,
                'teacher': teacher_info['name'],
                'teacher_e':teacher_info['engname'],
                'student': s['name'],
                'student_origin': s['origin'],
                'ban' : b['name'],
                'answer' : a.content,
                'answer_at': a.created_at,
                'reject' : a.reject_code
                })
            else:
                return jsonify({
                'cateogry':'퇴소 요청',
                'title': q.title,
                'contents':q.contents,
                'create_date':q.create_date,
                'teacher': teacher_info['name'],
                'teacher_e':teacher_info['engname'],
                'student': s['name'],
                'student_origin': s['origin'],
                'ban' : b['name'],
                'answer' : a.content,
                'answer_at': a.created_at,
                'reject' : a.reject_code
                })
            


# 문의 / 답변 조회 
# @bp.route('/question/<int:id>', methods=['GET','POST'])
# def question(id):
#     question = Question()
#     if request.method == 'GET':
#         return hello
