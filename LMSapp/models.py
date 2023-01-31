from LMSapp import db
from sqlalchemy.sql import func
from datetime import datetime

class Question(db.Model):
    __tablename__ = 'question'
    
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(200), nullable=False)
    contents = db.Column(db.Text(), nullable=False)
    teacher_id = db.Column(db.Integer,db.ForeignKey('user.register_no'))
    ban_id = db.Column(db.Integer,db.ForeignKey('ban.register_no'),nullable=True)
    new_ban_id = db.Column(db.Integer,db.ForeignKey('ban.register_no'),nullable=True)
    # consulting_history = db.Column(db.Integer,db.ForeignKey('consulting_history.id'))
    student_id = db.Column(db.Integer,db.ForeignKey('student.register_no'))
    create_date = db.Column(db.DateTime(), nullable=False)

# class Answer(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     question_id = db.Column(db.Integer, db.ForeignKey('question.id', ondelete='CASCADE'))
#     question = db.relationship('Question', backref=db.backref('answer_set'))
#     content = db.Column(db.Text(), nullable=False)
#     create_date = db.Column(db.DateTime(), nullable=False)

class ConsultingCategory(db.Model):
    __tablename__ = 'consultingcategory'
    
    id=db.Column(db.Integer,primary_key=True)
    name = db.Column(db.String(45), nullable=True)
    consultings = db.relationship('Consulting', backref='consultingcategory')


class Consulting(db.Model):
    __tablename__ = 'consulting'
    
    id=db.Column(db.Integer,primary_key=True)
    ban_id = db.Column(db.Integer, db.ForeignKey('ban.register_no'))
    category_id = db.Column(db.Integer, db.ForeignKey('consultingcategory.id'))
    student_id = db.Column(db.Integer, db.ForeignKey('student.register_no'))
    contents = db.Column(db.Text)
    attachments = db.Column(db.String(45), nullable=True)
    startdate = db.Column(db.DateTime)
    deadline = db.Column(db.DateTime)
    # consultinghistories = db.relationship('ConsultingHistory',backref='consulting')

class TaskCategory(db.Model):
    __tablename__ = 'taskcategory'
    
    id=db.Column(db.Integer,primary_key=True)
    name = db.Column(db.String(45), nullable=True)
    tasks = db.relationship('Task', backref='taskcategory')


class Task(db.Model):
    __tablename__ = 'task'
    
    id=db.Column(db.Integer,primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('taskcategory.id'))
    contents = db.Column(db.Text)
    url = db.Column(db.Text)
    attachments = db.Column(db.Text)
    startdate = db.Column(db.DateTime)
    deadline = db.Column(db.DateTime)
    priority = db.Column(db.Integer, nullable=True)
    cycle = db.Column(db.Integer, nullable=True)
    
    # 관계 설정 
    # bans = db.relationship('Ban',secondary ='task_ban',back_populates='tasks', lazy = 'dynamic')
    bans = db.relationship('TaskBan')
    teachers = db.relationship('TaskBan')

# db.Table('task_ban',
#     db.Column('ban_id',db.Integer,db.ForeignKey('ban.register_no')),
#     db.Column('task_id',db.Integer,db.ForeignKey('task.id')),
#     db.Column('done',db.Integer)
# )

class TaskBan(db.Model):
    __tablename__ = 'task_ban'

    id=db.Column(db.Integer,primary_key=True)
    ban_id = db.Column(db.ForeignKey('ban.register_no'), primary_key=True)
    teacher_id = db.Column(db.ForeignKey('user.register_no'), primary_key=True)
    task_id = db.Column(db.ForeignKey('task.id'), primary_key=True)
    done = db.Column(db.Integer, nullable=True)
