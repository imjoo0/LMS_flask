from LMSapp import db, file_upload
from sqlalchemy.sql import func
from sqlalchemy.orm import backref
from datetime import datetime
from flask import jsonify
from sqlalchemy import create_engine
import json
import callapi
import pandas as pd
#  join 기능
# from LMSapp import Base,Aession
# from sqlalchemy import select , and_
# from sqlalchemy.orm import joinedload,contains_eager
# from sqlalchemy import Column, Integer, String, DateTime, LargeBinary
current_time = datetime.now()
Today = current_time.date()
today_yoil = current_time.weekday() + 1

standard = datetime.strptime('11110101',"%Y%m%d").date()

class User(db.Model):
    __tablename__ = 'user'
    
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.String(50), nullable=False)
    user_pw = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(50))
    eng_name = db.Column(db.String(255))
    mobileno = db.Column(db.String(50))
    email = db.Column(db.String(50))
    
class Question(db.Model):
    __tablename__ = 'question'
    
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.Integer, nullable=False) # 0 :일반 문의 / 1:퇴소문의 / 2:이반문의 / 3:취소/환불 문의  
    title = db.Column(db.String(200), nullable=False)
    contents = db.Column(db.Text(), nullable=False)
    teacher_id = db.Column(db.Integer,nullable=True)
    ban_id = db.Column(db.Integer,nullable=True)
    consulting_history = db.Column(db.Integer,db.ForeignKey('consulting.id'))
    student_id = db.Column(db.Integer,nullable=True)
    create_date = db.Column(db.DateTime(), nullable=False)
    answer = db.Column(db.Integer,nullable=True)
    mobileno = db.Column(db.Text(), nullable=False)
    qa = db.relationship("Answer", uselist=False, back_populates="question", cascade="all, delete", overlaps="qa")
    qcomments = db.relationship("Comment", back_populates="question", cascade='all, delete-orphan',overlaps="qcomments")
    attachments = db.relationship('Attachments', uselist=False,back_populates='question', cascade='all, delete-orphan', single_parent=True)

@file_upload.Model
class Attachments(db.Model):
    __tablename__ = 'attachment'
    
    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('question.id',ondelete='CASCADE'), nullable=False)
    mime_type = db.Column(db.Text())
    data = db.Column(db.LargeBinary)
    file_name = db.Column(db.String(200))
    is_answer = db.Column(db.Integer, nullable=False)
    question = db.relationship("Question", back_populates='attachments')

class Comment(db.Model):
    __tablename__ = 'comment'
    id = db.Column(db.Integer, primary_key=True)
    contents = db.Column(db.Text())
    user_id = db.Column(db.Integer, nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('question.id', ondelete='CASCADE'))
    parent_id = db.Column(db.Integer, db.ForeignKey('comment.id'))
    created_at = db.Column(db.DateTime(), nullable=False)
    # 관계설정
    question = db.relationship("Question", backref=backref('comments', cascade='all, delete-orphan', single_parent=True))
    children = db.relationship("Comment",back_populates='parent', cascade='all, delete-orphan')
    parent = db.relationship("Comment", back_populates='children', remote_side=[id])

class Answer(db.Model):
    __tablename__ = 'answer'

    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('question.id'), unique=True, nullable=False)
    title = db.Column(db.Text(), nullable=False)
    content = db.Column(db.Text(), nullable=False)
    created_at = db.Column(db.DateTime(), nullable=False)
    reject_code = db.Column(db.Integer,nullable=True) # 1이면 반려 
    writer_id = db.Column(db.Integer)
    # 관계설정 
    question = db.relationship("Question", backref="qanswer")

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
    teacher_id = db.Column(db.Integer,nullable=True)
    ban_id = db.Column(db.Integer,nullable=True)
    category_id = db.Column(db.Integer, db.ForeignKey('consultingcategory.id'))
    student_id = db.Column(db.Integer,nullable=True)
    origin = db.Column(db.String(100), nullable=True)
    student_name = db.Column(db.String(255), nullable=True)
    student_engname = db.Column(db.String(255), nullable=True)
    contents = db.Column(db.Text)
    startdate = db.Column(db.Date)
    deadline = db.Column(db.Date)
    done = db.Column(db.Integer,nullable=True)
    week_code = db.Column(db.Integer,nullable=True)
    missed = db.Column(db.DateTime(), nullable=False)
    reason = db.Column(db.Text)
    solution = db.Column(db.Text)
    result = db.Column(db.Text)
    created_at = db.Column(db.DateTime)

    # 관계 설정 
    question_attach = db.relationship('Question',backref='qconsulting',lazy=True)
    
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
    taskbans = db.relationship('TaskBan', uselist=False, back_populates='task', cascade='all, delete-orphan', single_parent=True)
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
    task_id = db.Column(db.Integer, db.ForeignKey('task.id', ondelete='CASCADE'))
    done = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime)

    task = db.relationship("Task", back_populates='taskbans', single_parent=True)

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
            # print(t_id)
            for t in t_id:
                task = Task.query.filter((Task.id==t) & (Task.startdate <= Today) & ( Today <= Task.deadline ) & (Task.cycle == today_yoil or Task.cycle == 0)).first()
                if task != None:
                    result['task_data'].append(task)
                    result['cate_data'].append(task.categories)       
            result['cate_data'] = list(set(result['cate_data']))
        return result
    
    @classmethod
    def get_ban(cls,teacher_id,task_id):
        #  해야 하는 업무들 가져오기 (task_id가 중복되지 않도록)
        tb = cls.query.filter(cls.teacher_id == teacher_id ,cls.task_id == task_id).with_entities(cls.id,cls.ban_id).all()
        tb = [{'id':taskbanlist[0], 'ban':callapi.purple_ban(taskbanlist[1],'get_ban')['ban_name']} for taskbanlist in tb]
        tb = json.dumps(tb)
        return tb

    # @classmethod
    # def query(cls):
    #     return msession.query(cls)
    
engine = create_engine('mysql+pymysql://jung:wjdgus00@192.168.6.3:3306/purple_learning_counseling')
class IXL_DF(db.Model):
    __tablename__ = 'student_ixl_df'
    __bind_key__ = 'graph_db'  # db1 데이터베이스에 바인딩됨
    
    student_id = db.Column(db.Integer, primary_key=True)
    SkillPermaCode = db.Column(db.Text())
    evalueation = db.Column(db.Text()) # 학습 평가 
    date = db.Column(db.Text())
    class_id = db.Column(db.Integer)

    # def load_data(self):
    #     # 데이터베이스 연결
    #     conn = engine.connect()
        
    #     # 쿼리 실행
    #     ixl_test_df = pd.read_sql('SELECT * FROM ixl_test_df', con=conn).fillna('')
    #     ixl_summary_df = pd.read_sql('SELECT * FROM ixl_summary_df', con=conn).fillna('')
    #     ixl_summary_df = ixl_summary_df.applymap(lambda x: int(x))
        
    #     advancement_test_score_df = pd.read_sql('SELECT * FROM advancement_test_score_df', con=conn).fillna('')
    #     ixl_classification_score_summary = pd.read_sql('SELECT * FROM ixl_classification_score_summary', con=conn)
    #     ixl_problem_info = pd.read_sql('SELECT * FROM ixl_problem_info', con=conn).applymap(lambda x: self.decrypt(str(x)))
    #     update_date = pd.read_sql('SELECT * FROM update_date', con=conn).applymap(lambda x: self.decrypt(str(x)))
    #     student_list = pd.read_sql('SELECT * FROM student_list_df', con=conn).fillna('')
    #     student_list['원번'] = student_list['원번'].apply(lambda x: self.decrypt(str(x)))
    #     student_list['학생명'] = student_list['학생명'].apply(lambda x: self.decrypt(str(x)))
    #     student_id_dictionary = dict(zip(student_list['원번'], student_list['student_id']))
    #     temp_list_in_student_ = sorted(list(set(student_list['진행학기'])))
        
    #     print(ixl_test_df)
    #     # 데이터베이스 연결 종료
    #     conn.close()
        
    #     # 여기서 가져온 데이터를 활용하여 필요한 작업 수행
        
    #     # 필요한 작업을 수행한 후에는 결과를 반환하거나 적절하게 활용할 수 있습니다.
    #     return 'Data Loaded Successfully'

class IXL_TEST_DF(db.Model):
    __tablename__ = 'ixl_test_df'
    __bind_key__ = 'graph_db'  # db1 데이터베이스에 바인딩됨
    
    student_id = db.Column(db.Integer, primary_key=True)
    L_languagearts = db.Column(db.Text())
    L_readinglevel = db.Column(db.Text())
    L_Vocabulary = db.Column(db.Text())
    L_Reading_Strategies = db.Column(db.Text())
    L_Writing_Strategies = db.Column(db.Text())
    L_Grammar_Mechanics = db.Column(db.Text())



