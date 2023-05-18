from flask import Blueprint,render_template, jsonify, request,redirect,url_for
from functools import wraps
import jwt
import hashlib
bp = Blueprint('main', __name__, url_prefix='/')

# 로그인 
from flask import session  # 세션
from LMSapp.views import *
import callapi
import config
from LMSapp.models import *
import datetime
from sqlalchemy import and_,or_
SECRET_KEY = config.SECRET_KEY

def authrize(f):
    @wraps(f)
    def decorated_function(*args, **kws):
        if not 'mytoken' in request.cookies:
            return render_template('login.html')
        try:
            token = request.cookies['mytoken']
            user = jwt.decode(token,SECRET_KEY, algorithms=['HS256'])
            return f(user, *args, **kws)
        except jwt.ExpiredSignatureError or jwt.exceptions.DecodeError:
            return render_template('login.html')

    return decorated_function

@bp.route('/')
@authrize
def login(user):
    if user is not None:
        return redirect(url_for('main.home'))
    return render_template('login.html')

@bp.route('/main')
@authrize
def home(user):
    if user is not None:
        print(type(user['category']))
        if user['category'] == 1 or user['category'] == '1':
            return redirect(url_for('manage.home'))
        elif user['category'] == 0 or user['category'] == '0':
            return redirect(url_for('admin.home'))
        else:
            return redirect(url_for('teacher.home'))


@bp.route('/login', methods=['POST'])
def sign_in():
    data = request.get_json()
    user_id = data.get('user_id')
    user_pw = data.get('user_pw')
    hashed_pw = hashlib.sha256(user_pw.encode('utf-8')).hexdigest()
    result = User.query.filter_by(user_id=user_id, user_pw=hashed_pw).first()
    if result is not None:
        payload = {
            'user_id' : result.user_id,
            'id':result.id,
            'category':result.category,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=82800) #23시간 후 만료     
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
        # session['user_id'] = result.user_id,
        # session['user_registerno'] = result.id
        return jsonify({'result': 'success', 'token': token})
    else:
        return jsonify({'result':'fail', 'msg': 'id, pw 를 확인해주세요'})


# 로그아웃 API
@bp.route("/logout", methods=['GET'])
def logout():
    token_receive = request.cookies.get('mytoken')
    try:
        payload = jwt.decode(token_receive, SECRET_KEY, algorithms=['HS256'])
        return jsonify({
            'result': 'success',
            'token': jwt.encode(payload, SECRET_KEY, algorithm='HS256'),
            'msg': '로그아웃 성공'
        })
    except jwt.ExpiredSignatureError or jwt.exceptions.DecodeError:
        return jsonify({
            'result': 'fail',
            'msg': '로그아웃 실패'
        })

@bp.route('/find_user/<string:teacher_kor_name>/<string:teacher_eng_name>', methods=['GET','POST'])
def find_user(teacher_kor_name,teacher_eng_name):
    if request.method == 'GET':
        teacher_info = User.query.filter(or_(User.name == teacher_kor_name, User.eng_name == teacher_eng_name)).all()
        if(len(teacher_info) > 0):
            result = []
            for teacher in teacher_info:
                if(teacher):
                    t_result = {}
                    t_result['name']=teacher.name
                    t_result['eng_name']=teacher.eng_name
                    t_result['user_id']=teacher.user_id
                    t_result['mobileno']=teacher.mobileno
                    t_result['email']=teacher.email
                    t_result['category']=teacher.category
                    result.append(t_result)    
            return jsonify({'teacher_info': result})
        else:
            return jsonify({'teacher_info': 'nodata'})
    else:
        teacher_id = request.form['teacher_id']
        new_user = User(id=teacher_id,name=teacher_kor_name,eng_name=teacher_eng_name)
        print(new_user)
        
        # return jsonify({'teacher_info': 'success'})


@bp.route('/find_purple_user/<string:teacher_kor_name>/<string:teacher_eng_name>', methods=['GET'])
def find_purple_user(teacher_kor_name,teacher_eng_name):
    if request.method == 'GET':
        print(teacher_eng_name)
        print(teacher_kor_name)
        teacher_info = callapi.find_user(teacher_eng_name,teacher_kor_name)
        print(teacher_info)
        if(teacher_info == False):
            return jsonify({'teacher_info': 'nodata'})
        else:
            print(teacher_info)
            for teacher in teacher_info:
                if(teacher):
                    print(teacher)
            return jsonify({'teacher_info': teacher_info})