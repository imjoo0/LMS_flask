from flask import Blueprint,render_template, jsonify, request,redirect,url_for
import config 

bp = Blueprint('main', __name__, url_prefix='/')
#  "main"은 블루프린트의 "별칭"이다. 이 별칭은 나중에 자주 사용할 url_for 함수에서 사용된다. 그리고 url_prefix는 라우팅 함수의 애너테이션 URL 앞에 기본으로 붙일 접두어 URL을 의미한다. 
#  예를 들어 main_views.py 파일의 URL 프리픽스에 url_prefix='/' 대신 url_prefix='/main'이라고 입력했다면 hello_pybo 함수를 호출하는 URL은 localhost:5000/이 아니라 localhost:5000/main/이 된다.

# 로그인 
from flask import session  # 세션
from LMSapp.forms import LoginForm
from LMSapp.models import User

SECRET_KEY = config.SECRET_KEY


@bp.route('/')
def mainpage():
    user = session.get('user_id', None)
    user_category = session.get('user_category',0)
    # user_category = session.get('user_category', None)
    # if user == None:
    #     return redirect('login')
    # elif user != None and user_category == 1:
    #     return redirect(url_for('learn_manage'))
    # elif user != None and user_category == 2:
    #     return redirect(url_for('manager'))
    # return render_template('perform.html',user=user)
    if user == None:
        return redirect('login')
    else:
        if user_category == 2:
            user = User.query.filter(User.user_id == session['user_id']).all()[0]
            return render_template('teacher.html',user=user)
        else :
            return render_template('index.html')


@bp.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        session['user_id'] = form.data.get('user_id')
        user_register_no = User.query.filter(
            User.user_id == session['user_id']).all()[0].register_no
        session['register_no'] = user_register_no
        user_category = User.query.filter(
            User.user_id == session['user_id']).all()[0].category
        session['user_category'] = user_category
        return redirect('/')  # 성공하면 home.html로
    return render_template('login.html', form=form)


# 로그아웃 API
@bp.route("/logout", methods=['GET'])
def logout():
    form = LoginForm()
    session.pop('user_id', None)
    return redirect('/')

