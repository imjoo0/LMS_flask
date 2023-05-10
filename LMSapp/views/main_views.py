from flask import Blueprint,render_template, jsonify, request,redirect,url_for
from functools import wraps
import jwt
import hashlib
import datetime
bp = Blueprint('main', __name__, url_prefix='/')

# 로그인 
from flask import session  # 세션
from LMSapp.views import *
import callapi
import config
from LMSapp.models import *

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
        return redirect(url_for('user.home'))
    return render_template('login.html')

@bp.route('/main')
@authrize
def home(user):
    if user is not None:
        print(user.category)
        if user.category == 1 :
            return redirect(url_for('manage.home'))
        elif user.cateogry == 0:
            return redirect(url_for('admin.home'))
        else:
            return redirect(url_for('teacher.home'))


@bp.route('/login', methods=['POST'])
def sign_in():
    user_id = request.form.get('user_id')
    user_pw = request.form.get('user_pw')
    hashed_pw = hashlib.sha256(user_pw.encode('utf-8')).hexdigest()
    result = User.query.filter(User.user_id == user_id and User.user_pw == user_pw).first()
    print(result)
    if result is not None:
        payload = {
            'user_id' : result.user_id,
            'id':result.id
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
        return redirect(url_for('user.home'))
    else:
        return redirect('/login')


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
