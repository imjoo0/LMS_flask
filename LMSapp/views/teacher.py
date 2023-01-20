from flask import Blueprint,render_template, jsonify, request,redirect,url_for,flash
import config 
from datetime import datetime, timedelta, date
bp = Blueprint('teacher', __name__, url_prefix='/teacher')

from flask import session  # 세션
from LMSapp.models import *
from LMSapp.views import *

# 메인 페이지 
@bp.route("/", methods=['GET'])
def home():
    if request.method =='GET':
        user = User.query.filter(User.user_id == session['user_id']).all()[0]
        all_ban = Ban.query.all()
        for b in user.bans:
            print(b.students.all())
        return render_template('teacher.html',user=user,all_ban = all_ban)

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