from LMSapp.views import *
from LMSapp.models import *
from flask import session  # 세션
from flask import Blueprint, render_template, jsonify, request, redirect, url_for
import config
import json
import callapi
import pymysql
import callapi

bp = Blueprint('admin', __name__, url_prefix='/admin')

# 관리자 메인 페이지
# 테스트 계정 id : admin2 pw동일
@bp.route("/", methods=['GET'])
def home():
    if request.method == 'GET':
        user = callapi.get_teacher_info(session['user_id'])
        return render_template('admin.html', user=user)

@bp.route("/sodata", methods=['GET'])
def get_sodata():
    if request.method == 'GET':
        target_sban = []
        target_oban = []
        o = OutStudent.query.all()
        total_o = len(o)
        s = SwitchStudent.query.all()
        total_s = len(s)
        for sd in s:
            target_sban.append(sd.ban_id)
        for od in o:
            target_oban.append(od.ban_id)

        if(len(target_sban) != 0 or len(target_oban) != 0):
            target_ban = target_sban.copy()
            target_ban.extend(target_oban)
            target_ban = list(set(target_ban))
            sodata = []
            for ban in target_ban:
                od = len(OutStudent.query.filter(OutStudent.ban_id==ban).all())
                sd = len(SwitchStudent.query.filter(SwitchStudent.ban_id==ban).all())
                data = {}
                b = callapi.get_ban(ban)
                data['register_no'] = b['register_no']
                data['ban_name'] = b['ban_name']
                data['semester'] = b['semester']
                data['teacher_name'] = b['teacher_name'] +'('+b['teacher_engname'] + ')'
                data['standard'] = round((od/total_o)*100)+round((sd/total_s)*100)
                data['out_data'] = str(od) +'('+ str(round((od/total_o)*100)) + '%)' if(total_o != 0) else 0
                data['switch_data'] = str(sd) +'('+ str(round((sd/total_s)*100)) + '%)' if(total_s != 0) else 0
                sodata.append(data)
            sodata.sort(key = lambda x:-x['standard'])

        else:
                sodata = '없음'
        return jsonify({'sodata': sodata,'switch_num':total_s,'outstudent_num':total_o})

@bp.route("/uldata", methods=['GET'])
def get_uldata():
    if request.method == 'GET':
        target_ulban = []
        ul = Consulting.query.filter(Consulting.category_id<100).all()
        ixl_num = len(Consulting.query.filter(Consulting.category_id==1).all())
        sread_num = len(Consulting.query.filter(Consulting.category_id==3).all())
        read_num = len(Consulting.query.filter(Consulting.category_id==4).all())
        intoread_num = len(Consulting.query.filter(Consulting.category_id==5).all()) + len(Consulting.query.filter(Consulting.category_id==7).all())
        writing_num = len(Consulting.query.filter(Consulting.category_id==6).all())

        total_ul = len(ul)

        for u in ul:
            target_ulban.append(u.ban_id)

        if len(target_ulban) != 0:
            target_ulban = list(set(target_ulban))
            uldata = []
            for ban in target_ulban:
                ud = len(Consulting.query.filter((Consulting.ban_id==ban) & (Consulting.category_id<100)).all())
                data = {}
                b = callapi.get_ban(ban)
                data['register_no'] = b['register_no']
                data['ban_name'] = b['ban_name']
                data['semester'] = b['semester']
                data['teacher_name'] = b['teacher_name'] +'('+b['teacher_engname'] + ')'
                data['standard'] = ud
                data['ul_data'] = str(ud) +'('+ str(round((ud/total_ul)*100)) + '%)' if(total_ul != 0) else 0
                uldata.append(data)
            uldata.sort(key = lambda x:-x['standard'])
        else:
                uldata = '없음'
        return jsonify({'uldata': uldata,'unlearned_num':total_ul,'ixl_num':ixl_num,'sread_num':sread_num,'read_num':read_num,
                            'intoread_num':intoread_num,'writing_num':writing_num,'intoread_num':intoread_num})

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
        teacher = callapi.get_teacher_info_by_id(t_id)
        chart_data = {}
        # chart_data['ss'] = len(SwitchStudent.query.filter(SwitchStudent.teacher_id == teacher['register_no']).all())
        # chart_data['os'] = len(OutStudent.query.filter(OutStudent.teacher_id == teacher['register_no']).all())
        mybans_info = callapi.get_mybans(teacher['user_id'])
        
        #  상담 차트
        chart_data['ttc'] = 0
        chart_data['ttd'] = 0
        chart_data['unlearned_ttc'] = 0
        # 미학습 총 발생 건수 
        chart_data['unlearned_ttd'] = len(Consulting.query.filter(Consulting.category_id < 100).all())
        for b in mybans_info:
            # 나한테 발생한 미학습 총 건수 
            chart_data['unlearned_ttc'] += len(Consulting.query.filter((b['register_no'] == Consulting.ban_id)&(Consulting.category_id < 100)).all()) 
            # 선생님 해야하는 상담 수 
            chart_data['ttc'] += len(Consulting.query.filter(b['register_no'] == Consulting.ban_id).all())
            # 선생님 상담 완수 건수 
            c = Consulting.query.filter((b['register_no'] == Consulting.ban_id)&(Consulting.done==1)).all()
            chart_data['ttd'] += len(c)

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
        return jsonify({'teacher_info': teacher,'chart_data':chart_data,'my_bans':mybans_info})