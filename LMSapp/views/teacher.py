from flask import Blueprint,render_template, jsonify, request,redirect,url_for,flash
import config 
from datetime import datetime, timedelta, date
import requests
bp = Blueprint('teacher', __name__, url_prefix='/teacher')

from flask import session  # 세션
from LMSapp.models import *
from LMSapp.views import *


headers = {'content-type': 'application/json'}
url = 'http://118.131.85.245:23744/'

# 선생님 메인 페이지
# 테스트 계정 id : T1031 pw동일  
@bp.route("/", methods=['GET'])

def home():
    if request.method =='GET':
        res = requests.post(url=url + 'get_parent', headers=headers, data={'id': 'purple_test'})
        print(res.json())
        user = User.query.filter(User.user_id == session['user_id']).all()[0]
        all_ban = Ban.query.all()
        all_task_category = TaskCategory.query.all()

        # task_id를 기준으로 소팅 
        user.tasks.sort(key = lambda x:x.task_id)
        tc = []
        for task in user.tasks:
            tc.append(task.task_id)        
        tc = list(set(tc))

        target_task = []
        for t in tc:
            target_data = {}
            target_data['task'] = Task.query.filter(Task.id == t).all()[0]
            target_data['task_data'] = []
            for tb in user.tasks:
                if t == tb.task_id:
                    data = {}
                    data['id'] = tb.id
                    data['ban'] = Ban.query.filter(Ban.register_no == tb.ban_id).all()[0]
                    target_data['task_data'].append(data)
            target_task.append(target_data)

        print(target_task)
            
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
        return render_template('teacher.html',user=user,all_ban = all_ban,all_task_category=all_task_category,target_task=target_task)

# 테스트 계정 id : T1031 pw동일  
@bp.route("/<int:id>", methods=['POST','GET'])
def update_done(id):
    target_task = TaskClass.query.get_or_404(id)
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
        teacher = session['register_no']
        create_date = datetime.now()
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
        t = User.query.filter(User.register_no == q.teacher_id).all()[0]
        
        if q.category == 0:
            return jsonify({
            'cateogry':'일반문의',
            'title': q.title,
            'contents':q.contents,
            'create_date':q.create_date,
            'teacher': t.name,
            'teacher_e':t.eng_name,
            })
        else:
            s = Student.query.filter(Student.register_no == q.student_id).all()[0]
            b = Ban.query.filter(Ban.register_no == q.ban_id).all()[0]
            if q.category == 2:
                return jsonify({
                'cateogry':'이반 요청',
                'title': q.title,
                'contents':q.contents,
                'create_date':q.create_date,
                'teacher': t.name,
                'teacher_e':t.eng_name,
                'student': s.name,
                'student_origin': s.original,
                'ban' : b.name
                })
            else:
                return jsonify({
                'cateogry':'퇴소 요청',
                'title': q.title,
                'contents':q.contents,
                'create_date':q.create_date,
                'teacher': t.name,
                'teacher_e':t.eng_name,
                'student': s.name,
                'student_origin': s.original,
                'ban' : b.name
                })
            


# 문의 / 답변 조회 
# @bp.route('/question/<int:id>', methods=['GET','POST'])
# def question(id):
#     question = Question()
#     if request.method == 'GET':
#         return hello