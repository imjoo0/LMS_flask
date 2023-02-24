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
        all_ban = callapi.all_ban_info()
        total = 0
        # for b in all_ban:
        #     target = get_ban(b['register_no'])
        #     print(target)
            # total += target['student_num']
        return render_template('admin.html', user=user,all_ban=all_ban)
    
@bp.route('/chart',methods =['GET'])
def draw_chart():
        switch_num = len(SwitchStudent.query.all())
        outstudent_num = len(OutStudent.query.all())
        unlearned_num = len(Consulting.query.filter(Consulting.category_id<100).all())
        ixl_num = len(Consulting.query.filter(Consulting.category_id==1).all())
        sread_num = len(Consulting.query.filter(Consulting.category_id==3).all())
        read_num = len(Consulting.query.filter(Consulting.category_id==4).all())
        intoread_num = len(Consulting.query.filter(Consulting.category_id==5).all()) + len(Consulting.query.filter(Consulting.category_id==7).all())
        writing_num = len(Consulting.query.filter(Consulting.category_id==6).all())


        return jsonify({'ixl_num':ixl_num,'sread_num':sread_num,'read_num':read_num,
                               'intoread_num':intoread_num,'writing_num':writing_num,'intoread_num':intoread_num,
                               'switch_num':switch_num,'outstudent_num':outstudent_num,'unlearned_num':unlearned_num})




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
            list(set(target_oban))
            list(set(target_sban))
            if(len(target_sban) != 0 or len(target_oban) != 0):
                print('찍히나')
                target_ban = target_sban.copy()
                target_ban.extend(target_oban)
                list(set(target_oban))
                sodata = []
                for ban in target_ban:
                    od = OutStudent.query.filter(OutStudent.ban_id==ban).all()
                    sd = SwitchStudent.query.filter(SwitchStudent.ban_id==ban).all()
                    data = {}
                    b = callapi.get_ban(ban)
                    data['register_no'] = b['register_no']
                    data['ban_name'] = b['ban_name']
                    data['semester'] = b['semester']
                    data['teacher_name'] = b['teacher_name'] +'('+b['teacher_engname'] + ')'
                    data['out_data'] = str(len(od)) +'('+ str(round((od/total_o)*100)) + '%)' if(total_o != 0) else 0
                    data['switch_data'] = str(len(sd)) +'('+ str(round((sd/total_s)*100)) + '%)' if(total_s != 0) else 0
                    sodata.append(data)
            else:
                 sodata = '없음'

            print(sodata)
            return jsonify({'sodata': sodata})

