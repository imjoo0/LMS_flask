from LMSapp.views import *
from LMSapp.models import *
from flask import session  # 세션
from flask import Blueprint, render_template, jsonify, request, redirect, url_for
import config
import json
import callapi
from flask_paginate import Pagination, get_page_parameter, get_page_args
import pymysql
import callapi

bp = Blueprint('admin', __name__, url_prefix='/admin')

# 관리자 메인 페이지
# 테스트 계정 id : admin2 pw동일
@bp.route("/", methods=['GET'])
def home():
    if request.method == 'GET':
        user = callapi.get_teacher_info(session['user_id'])
        all_ban = callapi.all_ban_info()
        total = 0
        for b in all_ban:
            target = get_ban(b['register_no'])
            print(target)
            # total += target['student_num']
        
        switch_num = len(SwitchStudent.query.all())
        outStudent_num = len(OutStudent.query.all())
        unlearned_num = len(Consulting.query.filter(Consulting.category_id<100).all())
        ixl_num = len(Consulting.query.filter(Consulting.category_id==1).all())
        hpage_num = len(Consulting.query.filter(Consulting.category_id==2).all())
        sread_num = len(Consulting.query.filter(Consulting.category_id==3).all())
        read_num = len(Consulting.query.filter(Consulting.category_id==4).all())
        tintoread_num = len(Consulting.query.filter(Consulting.category_id==5).all())
        writing_num = len(Consulting.query.filter(Consulting.category_id==6).all())
        intoread_num = len(Consulting.query.filter(Consulting.category_id==7).all())


        return render_template('admin.html', user=user, ixl_num=ixl_num,hpage_num=hpage_num,sread_num=sread_num,read_num=read_num,
                               tintoread_num=tintoread_num,writing_num=writing_num,intoread_num=intoread_num,
                               all_ban=all_ban,total=total,switch_num=switch_num,outStudent_num=outStudent_num,unlearned_num=unlearned_num)



@bp.route("/ban/<int:id>", methods=['GET'])
def get_ban(id):
    if request.method == 'GET':
        target_ban = callapi.get_ban(id)
        if target_ban:
            db = pymysql.connect(host='127.0.0.1', user='purple', password='wjdgus00', port=3306, database='LMS',cursorclass=pymysql.cursors.DictCursor)
            switch_student = {}
            consulting = {}
            task = {}

            try:
                with db.cursor() as cur:
                    cur.execute(f'select id, ban_id, switch_ban_id, teacher_id, student_id, category from switchstudent where ban_id={id}')
                    switch_student['status'] = 200
                    switch_student['data'] = cur.fetchall()

                    cur.execute(f"select id, ban_id, category_id, student_id, contents, date_format(startdate, '%Y-%m-%d') as startdate, date_format(deadline, '%Y-%m-%d') as deadline, week_code, done, missed from consulting where ban_id={id}")
                    consulting['status'] = 200
                    consulting['data'] = cur.fetchall()

                    cur.execute(f"select task.id, task.category_id, task.contents, task.url, task.attachments, date_format(task.startdate, '%Y-%m-%d') as startdate, date_format(task.deadline, '%Y-%m-%d') as deadline, task.priority, task.cycle, taskcategory.name, taskban.ban_id, taskban.teacher_id, taskban.done from task left join taskcategory on task.category_id = taskcategory.id left join taskban on task.id = taskban.task_id where taskban.ban_id={id};" )
                    task['status'] = 200
                    task['data'] = cur.fetchall()
            except Exception as e:
                print(e)
                switch_student['status'] = 401
                switch_student['text'] = str(e)
                consulting['status'] = 401
                consulting['text'] = str(e)
                task['status'] = 401
                task['text'] = str(e)
            finally:
                db.close()
            alimnote = callapi.get_alimnote(id)[0]
            notice = callapi.get_notice(id)
            students = callapi.get_students(target_ban['register_no'])
            # student_info = []
            # for student in students:
            #      student_info.append(json.dumps(get_student_json(student)))
            # print(student_info)

            return jsonify({
            'target_ban': target_ban['register_no'],
            'name': target_ban['ban_name'],
            'teacher_name': target_ban['teacher_name'],
            'teacher_e_name': target_ban['teacher_engname'],
            'teacher_mobileno': target_ban['teacher_mobileno'],
            'teacher_email': target_ban['teacher_email'],
            'students_num': target_ban['student_num'],
            'student_info': students,
            'all_alim' : alimnote['all'],
            'answer_alim' : alimnote['answer'],
            'switch_student': switch_student,
            'notice': notice,
            'consulting': consulting,
            'task': task
        })
        else:
            return jsonify({'status': 400, 'text': '데이터가 없습니다.'})

