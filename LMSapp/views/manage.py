from flask import Blueprint,render_template, jsonify, request,redirect,url_for
import config,json 

bp = Blueprint('manage', __name__, url_prefix='/manage')

from flask import session  # 세션
from LMSapp.models import *
from LMSapp.views import *

# 관리부서 메인 페이지
# 테스트 계정 id : T0001 pw동일  
@bp.route("/", methods=['GET'])
def home():
    if request.method =='GET':
        user = User.query.filter(User.user_id == session['user_id']).all()[0]
        all_ban = Ban.query.all()
        all_consulting_category = ConsultingCategory.query.all()
        all_consulting = Consulting.query.all()
        return render_template('manage.html',user=user,all_ban = all_ban,consulting_category = all_consulting_category, consultings = all_consulting)

# json type not seriallizabel 해결 함수
    # object 인 경우 -> get_student(obj)
def get_student(student):
    return {
        'name' : student.name,
        'original' : student.original,
        'mobileno' : student.mobileno,
        'parent_name_mobileno' : '('+ student.parent_name + ')' + student.parent_mobileno,
        'register_date' : student.register_date.strftime('%Y-%m-%d')
    }
    
    # datetime인 경우 json_default()    
def json_default(value):
  if isinstance(value, datetime.date):
    return value.strftime('%Y-%m-%d')
  raise TypeError('not JSON serializable')
#   json_data = json.dumps(data, default=json_default) <- 사용시 이 포멧으로

@bp.route("/ban/<int:id>", methods=['GET'])
def get_ban(id):
    if request.method =='GET':
        target_ban = Ban.query.filter(Ban.register_no == id).all()[0]
        # target_ban의 담임 선생님 정보
        teacher_info = User.query.filter(User.register_no == target_ban.teacher_id).all()[0]
        students = target_ban.students.all()
        student_info = []
        for student in students:
            student_info.append(json.dumps(get_student(student)))
        return jsonify({
            'target_ban' : target_ban.register_no,
            'name':target_ban.name,
            'teacher_name': teacher_info.name,
            'teacher_e_name':teacher_info.eng_name,
            'teacher_mobileno' : teacher_info.mobileno,
            'teacher_email' : teacher_info.email,
            'students_num' : len(students),
            'student_info':student_info
        })

# 선생님 문의 저장 
# @bp.route('/question', methods=['POST'])
# def question():
#     question = request.form['question_contents']
#     print(question)
#     if result == 'fail':
#         return jsonify({'result': '업로드 실패'})

#     return jsonify({'result': '업로드 완료!'})