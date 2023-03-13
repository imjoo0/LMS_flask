from LMSapp import db, file_upload
from sqlalchemy.sql import func
from sqlalchemy.orm import backref
from datetime import datetime
from flask import jsonify
import json
import callapi
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
    attachments = db.relationship('Attachments',backref='question',cascade="all,delete")
    answer = db.Column(db.Integer,nullable=True)

@file_upload.Model
class Attachments(db.Model):
    __tablename__ = 'attachment'
    
    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('question.id',ondelete='CASCADE'), nullable=False)
    mime_type = db.Column(db.Text())
    data = db.Column(db.LargeBinary)
    file_name = db.Column(db.String(200))

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
    children = db.relationship("Comment", 
                               backref=backref('parent', remote_side=[id]),
                               back_populates='parent')

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

    tasks = db.relationship('Task',backref = 'categories',lazy=True)

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
    def get_task_category(cls,teacher_id,done):
        result = {}
        result['task_data'] = []
        result['cate_data'] = []
        #  해야 하는 업무들 가져오기 (task_id가 중복되지 않도록)
        if done == 1:
            t_id = [value for (value,) in list(set(cls.query.filter(cls.teacher_id == teacher_id , cls.done == done, cls.created_at == Today).with_entities(cls.task_id).all()))]
        else:
            t_id = [value for (value,) in list(set(cls.query.filter(cls.teacher_id == teacher_id , cls.done == done).with_entities(cls.task_id).all()))]
        if len(t_id)!=0:
            for t in t_id:
                task = Task.query.filter((Task.id==t) & (Task.startdate <= current_time) & ( current_time <= Task.deadline ) & (Task.cycle == today_yoil or Task.cycle == 0)).first()
                if task != None:
                    result['task_data'].append(task)
                    result['cate_data'].append(task.categories)            
            result['cate_data'] = list(set(result['cate_data']))
        return result
    
    @classmethod
    def get_ban(cls,teacher_id,task_id):
        #  해야 하는 업무들 가져오기 (task_id가 중복되지 않도록)
        tb = cls.query.filter(cls.teacher_id == teacher_id ,cls.task_id == task_id).with_entities(cls.id,cls.ban_id).all()
        tb = [{'id':taskbanlist[0], 'ban':callapi.get_ban(taskbanlist[1])['ban_name']} for taskbanlist in tb]
        tb = json.dumps(tb)
        return tb

    # @classmethod
    # def query(cls):
    #     return msession.query(cls)
    
# task 와 taskban 조인하는 함수 
# 세션 클래스 사용 , sqlalchemy에서 조인 수행 
# def get_join_tb_result():
#     with Session() as msession:
#         result = msession.query(Task).options(joinedload(cls.bans)).all()
#         return [dict(id=row.id, contents=row.contents, bans=TaskBan.ban_id) for row in result]
    




