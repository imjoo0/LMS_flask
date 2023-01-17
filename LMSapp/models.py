from LMSapp import db
from sqlalchemy.sql import func
from datetime import datetime

class User(db.Model):
    __tablename__ = 'user'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(30), nullable=False)
    user_pw = db.Column(db.String(30), nullable=False)
    name =  db.Column(db.String(15), nullable=True)
    eng_name = db.Column(db.String(30), nullable=True)
    mobileno  = db.Column(db.String(30), nullable=True)
    email = db.Column(db.String(50),nullable=True)    
    category = db.Column(db.Integer, nullable=False)
    register_no = db.Column(db.Integer,unique=True)
    classes = db.relationship('Ban', backref='teacher')

class Ban(db.Model):
    __tablename__ = 'ban'

    id=db.Column(db.Integer,primary_key=True)
    register_no = db.Column(db.Integer,unique=True)
    name =  db.Column(db.String(30), nullable=True)
    teacher_id = db.Column(db.Integer,db.ForeignKey('user.register_no'))
    semester =  db.Column(db.Integer, nullable=False)
    notice_num = db.Column(db.Integer, nullable=True)
    inquiry_num = db.Column(db.Integer, nullable=True)
    not_answered_inquiry_num = db.Column(db.Integer, nullable=True)
    # students = db.relationship('Student',secondary = 'class_student',back_populates='classes', lazy = 'dynamic')


class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    subject = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text(), nullable=False)
    create_date = db.Column(db.DateTime(), nullable=False)

class Answer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('question.id', ondelete='CASCADE'))
    question = db.relationship('Question', backref=db.backref('answer_set'))
    content = db.Column(db.Text(), nullable=False)
    create_date = db.Column(db.DateTime(), nullable=False)