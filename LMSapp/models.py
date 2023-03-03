from LMSapp import db,Base,Session
from sqlalchemy.sql import func
from datetime import datetime

#  join 기능
from sqlalchemy import select 

msession = Session()

class Question(db.Model):
    __tablename__ = 'question'
    
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.Integer, nullable=False) # 0 :일반 문의 / 1:퇴소문의 / 2:이반문의 / 3:취소/환불 문의  
    title = db.Column(db.String(200), nullable=False)
    contents = db.Column(db.Text(), nullable=False)
    teacher_id = db.Column(db.Integer,nullable=True)
    ban_id = db.Column(db.Integer,nullable=True)
    consulting_history = db.Column(db.Integer,db.ForeignKey('consulting_history.id'))
    student_id = db.Column(db.Integer,nullable=True)
    create_date = db.Column(db.DateTime(), nullable=False)
    comments = db.relationship("Comment", back_populates="question")
    
    answer = db.Column(db.Integer,nullable=True)

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

class Task(Base):
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
    bans = db.relationship('TaskBan')

    @classmethod
    def query(cls):
        return msession.query(cls)


class TaskBan(Base):
    __tablename__ = 'taskban'

    id=db.Column(db.Integer,primary_key=True)
    ban_id = db.Column(db.Integer,nullable=True)
    teacher_id = db.Column(db.Integer,nullable=True)
    task_id = db.Column(db.Integer,db.ForeignKey('task.id'))
    done = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime)

    @classmethod
    def query(cls):
        return msession.query(cls)
    
    # task 와 taskban 조인하는 함수 
    # 세션 클래스 사용 , sqlalchemy에서 조인 수행 
    @classmethod
    def get_taskbaninfo(self,teacher):
        stmt = select(Task.contents, TaskBan.ban_id).\
                join(TaskBan).\
                where(Task.id == TaskBan.ban_id and TaskBan.teacher_id == teacher)
        result = msession.execute(stmt)
        rows = result.fetchall()
        
        for row in rows:
            print(row)




