from LMSapp import db, file_upload
from sqlalchemy.sql import func
from datetime import datetime
from flask import jsonify
# import json
#  join 기능
# from LMSapp import Base,Aession
# from sqlalchemy import select , and_
# from sqlalchemy.orm import joinedload,contains_eager
# from sqlalchemy import Column, Integer, String, DateTime, LargeBinary
current_time = datetime.now()
Today = current_time.date()
today_yoil = current_time.weekday() + 1

standard = datetime.strptime('11110101',"%Y%m%d").date()

class Question(db.Model):
    __tablename__ = 'question'
    
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.Integer, nullable=False) # 0 :일반 문의 / 1:퇴소문의 / 2:이반문의 / 3:취소/환불 문의  
    title = db.Column(db.String(200), nullable=False)
    contents = db.Column(db.Text(), nullable=False)
    teacher_id = db.Column(db.Integer,nullable=True)
    ban_id = db.Column(db.Integer,nullable=True)
    consulting_history = db.Column(db.Integer,db.ForeignKey('consultinghistory.id'))
    student_id = db.Column(db.Integer,nullable=True)
    create_date = db.Column(db.DateTime(), nullable=False)
    comments = db.relationship("Comment", back_populates="question")
    attachment = db.relationship('Attachments', back_populates='questions', lazy=True)
    answer = db.Column(db.Integer,nullable=True)

@file_upload.Model
class Attachments(db.Model):
    __tablename__ = 'attachment'
    
    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('question.id',ondelete='CASCADE'), nullable=False)
    mime_type = db.Column(db.Text())
    data = db.Column(db.LargeBinary)
    file_name = db.Column(db.String(200))
    questions = db.relationship('Question', backref=db.backref('attachments', lazy='dynamic'),cascade="all,delete")

class Comment(db.Model):
    __tablename__ = 'comment'
    id = db.Column(db.Integer, primary_key=True)
    contents = db.Column(db.Text())
    user_id = db.Column(db.Integer, nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('question.id'))
    parent_id = db.Column(db.Integer, db.ForeignKey('comment.id'))
    created_at = db.Column(db.DateTime(), nullable=False)
    # 관계설정
    question = db.relationship("Question", back_populates="comments")
    parent = db.relationship("Comment", remote_side=[id])
    children = db.relationship("Comment", remote_side=[parent_id])

class Answer(db.Model):
    __tablename__ = 'answer'

    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('question.id',ondelete='CASCADE'))
    title = db.Column(db.Text(), nullable=False)
    content = db.Column(db.Text(), nullable=False)
    created_at = db.Column(db.DateTime(), nullable=False)
    reject_code = db.Column(db.Integer,nullable=True) # 1이면 반려 

class OutStudent(db.Model):
    __tablename__ = "outstudent"

    id = db.Column(db.Integer, primary_key=True)
    ban_id = db.Column(db.Integer,nullable=True)
    teacher_id = db.Column(db.Integer,nullable=True)
    student_id = db.Column(db.Integer,nullable=True)
    created_at = db.Column(db.DateTime(), nullable=False)

class SwitchStudent(db.Model):
    __tablename__ = "switchstudent"

    id = db.Column(db.Integer, primary_key=True)
    ban_id = db.Column(db.Integer,nullable=True)
    switch_ban_id = db.Column(db.Integer,nullable=True)
    teacher_id = db.Column(db.Integer,nullable=True)
    student_id = db.Column(db.Integer,nullable=True)
    created_at = db.Column(db.DateTime(), nullable=False)

class ConsultingCategory(db.Model):
    __tablename__ = 'consultingcategory'
    
    id=db.Column(db.Integer,primary_key=True)
    name = db.Column(db.String(45), nullable=True)
    consultings = db.relationship('Consulting', backref='consultingcategory')

class Consulting(db.Model):
    __tablename__ = 'consulting'
    
    id=db.Column(db.Integer,primary_key=True)
    ban_id = db.Column(db.Integer,nullable=True)
    category_id = db.Column(db.Integer, db.ForeignKey('consultingcategory.id'))
    student_id = db.Column(db.Integer,nullable=True)
    contents = db.Column(db.Text)
    startdate = db.Column(db.DateTime)
    deadline = db.Column(db.DateTime)
    done = db.Column(db.Integer,nullable=True)
    week_code = db.Column(db.Integer,nullable=True)
    missed = db.Column(db.DateTime(), nullable=False)
    # 관계 설정 
    history = db.relationship('ConsultingHistory',backref='consulting')

class ConsultingHistory(db.Model):
    __tablename__ = 'consultinghistory'
    
    id=db.Column(db.Integer,primary_key=True)
    consulting_id = db.Column(db.Integer,db.ForeignKey('consulting.id'))
    reason = db.Column(db.Text)
    solution = db.Column(db.Text)
    result = db.Column(db.Text)
    created_at = db.Column(db.DateTime)
    
class TaskCategory(db.Model):
    __tablename__ = 'taskcategory'
    
    id=db.Column(db.Integer,primary_key=True)
    name = db.Column(db.String(45), nullable=True)

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
    taskban = db.relationship('TaskBan',backref='task',lazy=True)
    # @classmethod
    # def query(cls):
    #     return msession.query(cls)
    
    # @classmethod
    # def get_taskbaninfo(cls,teacher):
    #     bans = msession.query(cls).join(TaskBan).options(contains_eager(cls.taskban)).filter(TaskBan.teacher_id==teacher).fetchall()
    #     for ban in bans:
    #         print(ban)
    #     return bans
    @classmethod
    def get_task_contents(cls,task_id):
        t = cls.query.filter((id==task_id) & (cls.startdate <= current_time) & ( current_time <= cls.deadline ) & (cls.cycle == today_yoil or cls.cycle == 0)).first()
        if t != None:
            print(t.taskban)
        
class TaskBan(db.Model):
    __tablename__ = 'taskban'

    id=db.Column(db.Integer,primary_key=True)
    ban_id = db.Column(db.Integer,nullable=True)
    teacher_id = db.Column(db.Integer,nullable=True)
    task_id = db.Column(db.Integer,db.ForeignKey('task.id'))
    done = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime)

    tasks = db.relationship('Task',backref='taskbans',lazy=True)

    @classmethod
    def get_teacher_task(cls,teacher_id,done):
        result = []
        #  해야 하는 업무들 가져오기 (task_id가 중복되지 않도록)
        t_id = [value for (value,) in list(set(cls.query.filter(teacher_id == teacher_id , done == done).with_entities(cls.task_id).all()))]
        for t in t_id:
            task = Task.query.filter((Task.id==t) & (Task.startdate <= current_time) & ( current_time <= Task.deadline ) & (Task.cycle == today_yoil or Task.cycle == 0)).first()
            result.append(task)
            # result.append(jsonify({'task': task.__dict__}))
        return result

    # @classmethod
    # def query(cls):
    #     return msession.query(cls)
    
# task 와 taskban 조인하는 함수 
# 세션 클래스 사용 , sqlalchemy에서 조인 수행 
# def get_join_tb_result():
#     with Session() as msession:
#         result = msession.query(Task).options(joinedload(cls.bans)).all()
#         return [dict(id=row.id, contents=row.contents, bans=TaskBan.ban_id) for row in result]
    




