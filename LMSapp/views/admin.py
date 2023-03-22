from LMSapp.views import *
from LMSapp.models import *
from flask import session  # 세션
from flask import Blueprint, render_template, jsonify, request, redirect, url_for
import config
import json
import callapi
import pymysql

bp = Blueprint('admin', __name__, url_prefix='/admin')

# 관리자 메인 페이지
# 테스트 계정 id : admin2 pw동일
@bp.route("/", methods=['GET'])
def home():
    if request.method == 'GET':
        user = callapi.purple_info(session['user_id'],'get_teacher_info')
        return render_template('admin.html', user=user)
    
@bp.route("/teacher_data", methods=['GET'])
def get_teacher_data():
    if request.method == 'GET':
        all_teacher = callapi.get_all_teacher()
        total = callapi.get_all_student_num()

        all_teacher.sort(key = lambda x:(-x['total_student_num']))
        return jsonify({'all_teacher': all_teacher,'total':total})

@bp.route("/<int:t_id>", methods=['GET'])
def get_teacher(t_id):
    if request.method == 'GET':
        teacher = callapi.purple_info(t_id,'get_teacher_info_by_id')
        chart_data = {}
        ban_data = []
        # chart_data['ss'] = len(SwitchStudent.query.filter(SwitchStudent.teacher_id == teacher['register_no']).all())
        # chart_data['os'] = len(OutStudent.query.filter(OutStudent.teacher_id == teacher['register_no']).all())
        mybans_info = callapi.purple_ban(teacher['user_id'],'get_mybans')
        
        #  상담 차트
        chart_data['ttc'] = 0
        chart_data['ttd'] = 0
        chart_data['unlearned_ttc'] = 0
        # 미학습 총 발생 건수 
        chart_data['unlearned_ttd'] = len(Consulting.query.filter(Consulting.category_id < 100).all())
        for b in mybans_info:
            data = {}
            data['name'] = b['name']
            data['semester'] = b['semester']
            data['total_student_num'] = b['total_student_num']
            data['out_s'] = len(OutStudent.query.filter(OutStudent.ban_id == b['register_no']).all())
            data['switch_s'] = len(SwitchStudent.query.filter(SwitchStudent.ban_id == b['register_no']).all())
            data['unlearned'] = len(Consulting.query.filter((b['register_no'] == Consulting.ban_id)&(Consulting.category_id < 100)).all()) 

            # 나한테 발생한 미학습 총 건수 
            chart_data['unlearned_ttc'] += data['unlearned']
            # 선생님 해야하는 상담 수 
            chart_data['ttc'] += len(Consulting.query.filter(b['register_no'] == Consulting.ban_id).all())
            # 선생님 상담 완수 건수 
            c = Consulting.query.filter((b['register_no'] == Consulting.ban_id)&(Consulting.done==1)).all()
            chart_data['ttd'] += len(c)

            ban_data.append(data)



        if(chart_data['ttc'] != 0):
            # 선생님 상담 완수율 
            chart_data['cp'] = round((chart_data['ttd']/chart_data['ttc'])*100)
        else:
            chart_data['cp'] = 0
        if  chart_data['unlearned_ttd'] != 0:
            chart_data['unlearned_cp'] = round((chart_data['unlearned_ttc'] / chart_data['unlearned_ttd'])*100)
        else:
            chart_data['unlearned_cp'] = 0
        
        # 졸업 / 퇴소 한 학생 
        chart_data['outstudent_num'] = len(OutStudent.query.filter(OutStudent.teacher_id == teacher['register_no']).all())
        if(chart_data['outstudent_num'] != 0):
            chart_data['outstudent_num_p'] = round((chart_data['outstudent_num'] / len(OutStudent.query.all()))*100)
        else:
            chart_data['outstudent_num_p'] = 0
        # 이반 한 학생  
        chart_data['switchstudent_num'] = len(SwitchStudent.query.filter(SwitchStudent.teacher_id == teacher['register_no']).all())
        if(chart_data['switchstudent_num'] != 0):
            chart_data['switchstudent_num_p'] = round((chart_data['switchstudent_num'] / len(SwitchStudent.query.all()))*100)
        else:
            chart_data['switchstudent_num_p'] = 0
        # 업무 개수
        chart_data['total_todo'] = len(TaskBan.query.filter(TaskBan.teacher_id == teacher['register_no']).all())
        chart_data['total_done'] = len((TaskBan.query.filter((TaskBan.teacher_id == teacher['register_no']) & ( TaskBan.done==1)) ).all())
        if(chart_data['total_todo'] != 0):
            chart_data['ttp'] = round(chart_data['total_done']/chart_data['total_todo']*100)
        else:
            chart_data['ttp'] = 0
        return jsonify({'teacher_info': teacher,'chart_data':chart_data,'my_bans':ban_data})