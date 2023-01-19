from flask import Blueprint,render_template, jsonify, request,redirect,url_for
import config 

bp = Blueprint('manage', __name__, url_prefix='/manage')

from flask import session  # 세션
from LMSapp.models import *
from LMSapp.views import *

# 메인 페이지 
@bp.route("/", methods=['GET'])
def home():
    if request.method =='GET':
        user = User.query.filter(User.user_id == session['user_id']).all()[0]
        return render_template('manage.html',user=user)

# 선생님 문의 저장 
# @bp.route('/question', methods=['POST'])
# def question():
#     question = request.form['question_contents']
#     print(question)
#     if result == 'fail':
#         return jsonify({'result': '업로드 실패'})

#     return jsonify({'result': '업로드 완료!'})