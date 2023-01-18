from LMSapp import db
from sqlalchemy.sql import func
from datetime import datetime
from sqlalchemy_serializer import SerializerMixin


class User(db.Model):
    __tablename__ = 'user'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(50), nullable=False)
    user_pw = db.Column(db.String(50), nullable=False)
    name =  db.Column(db.String(50), nullable=True)
    eng_name = db.Column(db.String(50), nullable=True)
    mobileno  = db.Column(db.String(50), nullable=True)
    email = db.Column(db.String(100),nullable=True)    
    category = db.Column(db.Integer, nullable=False)
    register_no = db.Column(db.Integer,unique=True)
    bans = db.relationship('Ban', backref='teacher')

    # 선생님이 남긴 문의 
    # questions = db.relationship('Question', backref='teacher')

class Ban(db.Model):
    __tablename__ = 'ban'

    id=db.Column(db.Integer,primary_key=True)
    register_no = db.Column(db.Integer,unique=True)
    name =  db.Column(db.String(100), nullable=True)
    teacher = db.Column(db.Integer,db.ForeignKey('user.register_no'))
    semester =  db.Column(db.Integer, nullable=False)
    notice_num = db.Column(db.Integer, nullable=True)
    inquiry_num = db.Column(db.Integer, nullable=True)
    not_answered_inquiry_num = db.Column(db.Integer, nullable=True)
    students = db.relationship('Student',secondary = 'ban_student',back_populates='bans', lazy = 'dynamic')

class Student(db.Model):
    __tablename__ = 'student'

    id=db.Column(db.Integer,primary_key=True)
    original = db.Column(db.String(45), nullable=True)
    register_no = db.Column(db.Integer,unique=True)
    name =  db.Column(db.String(50), nullable=True)
    mobileno =  db.Column(db.String(100), nullable=True)
    parent_name =  db.Column(db.String(50), nullable=True)
    parent_mobileno =  db.Column(db.String(100), nullable=True)
    recommend_book_code = db.Column(db.Integer,nullable=True)
    register_date = db.Column(db.String(30), nullable=True)
    bans = db.relationship('Ban', secondary = 'ban_student', back_populates='students', lazy = 'dynamic')

db.Table('ban_student',
    db.Column('bs_ban',db.Integer,db.ForeignKey('ban.register_no')),
    db.Column('bs_student',db.Integer,db.ForeignKey('student.register_no'))
)

# class Ban_Student(db.Model):
#     __tablename__ = 'ban_student'

#     id=db.Column(db.Integer,primary_key=True)
#     bs_ban = db.Column(db.Integer,db.ForeignKey('ban.register_no'))
#     bs_student = db.Column(db.Integer,db.ForeignKey('student.register_no'))
#     bs_teacher = db.Column(db.Integer,db.ForeignKey('user.register_no'))
#     bs_is_out_code = db.Column(db.Integer,nullable=False)
#     switch_ban = db.Column(db.Integer,db.ForeignKey('ban.register_no'),nullable=True)

class Question(db.Model):
    __tablename__ = 'question'
    
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(200), nullable=False)
    contents = db.Column(db.Text(), nullable=False)
    teacher = db.Column(db.Integer,db.ForeignKey('user.register_no'))
    ban = db.Column(db.Integer,db.ForeignKey('ban.register_no'))
    # consulting_history = db.Column(db.Integer,db.ForeignKey('consulting_history.id'))
    student = db.Column(db.Integer,db.ForeignKey('student.register_no'))
    create_date = db.Column(db.DateTime(), nullable=False)

# class Answer(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     question_id = db.Column(db.Integer, db.ForeignKey('question.id', ondelete='CASCADE'))
#     question = db.relationship('Question', backref=db.backref('answer_set'))
#     content = db.Column(db.Text(), nullable=False)
#     create_date = db.Column(db.DateTime(), nullable=False)
