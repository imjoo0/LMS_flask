from flask_wtf import FlaskForm
from wtforms import StringField,IntegerField
from wtforms import PasswordField
from wtforms.validators import DataRequired, EqualTo
from LMSapp.models import User

# class RegisterForm(FlaskForm):
#     user_id = StringField('user_id', validators=[DataRequired()])
#     user_category = IntegerField('user_category', validators=[DataRequired()])
#     register_no = IntegerField('register_no',validators=[DataRequired()])
#     user_pw = PasswordField('user_pw', validators=[DataRequired(), EqualTo('re_user_pw')]) #비밀번호 확인
#     re_user_pw = PasswordField('re_user_pw', validators=[DataRequired()])
    
class LoginForm(FlaskForm):
    class UserPassword(object):
        def __init__(self, message=None):
            self.message = message
            
        def __call__(self, form, field):
            user_id = form['user_id'].data
            user_pw = field.data
            
            usertable = User.query.filter_by(user_id=user_id).first()
            if usertable == None:
                raise ValueError('존재하지 않는 유저 입니다.')
            if usertable.user_pw != user_pw:
                raise ValueError('비밀번호 틀림')
                
    user_id = StringField('user_id', validators=[DataRequired()])
    user_pw = PasswordField('user_pw', validators=[DataRequired(), UserPassword()])