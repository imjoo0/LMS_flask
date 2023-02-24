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
                data['out_data'] = str(od) +'('+ str(round((od/total_o)*100)) + '%)' if(total_o != 0) else 0
                data['switch_data'] = str(sd) +'('+ str(round((sd/total_s)*100)) + '%)' if(total_s != 0) else 0
                sodata.append(data)
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
                data['ul'] = ul
                data['ul_data'] = str(ud) +'('+ str(round((ud/total_ul)*100)) + '%)' if(total_ul != 0) else 0
                uldata.append(data)
            uldata.sort(key = lambda x:-x['ul'])
        else:
                uldata = '없음'
        return jsonify({'uldata': uldata,'unlearned_num':total_ul,'ixl_num':ixl_num,'sread_num':sread_num,'read_num':read_num,
                            'intoread_num':intoread_num,'writing_num':writing_num,'intoread_num':intoread_num})

@bp.route("/teacher_data", methods=['GET'])
def get_teacher_data():
    if request.method == 'GET':
        all_ban = callapi.get_all_ban()
        total = callapi.get_all_student_num()
        print(total)
        print(all_ban)
                uldata = '없음'
        return jsonify({'all_ban': all_ban,'total':total})