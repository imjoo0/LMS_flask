from flask import Blueprint,render_template, jsonify, request,redirect,url_for,flash
import config 
from datetime import datetime, timedelta, date
# file-upload 로 자동 바꿈 방지 모듈 
from werkzeug.utils import secure_filename
from flask_file_upload import FileUpload
from io import BytesIO
import common

bp = Blueprint('common', __name__, url_prefix='/common')
file_upload = FileUpload()

from flask import send_file 
# from LMSapp import Aession
from LMSapp.models import *
from LMSapp.views import *
# import json
# import pymysql

# import callapi,os

# current_time = datetime.now()
# Today = current_time.date()
# today_yoil = current_time.weekday() + 1

standard = datetime.strptime('11110101',"%Y%m%d").date()

def save_attachment(file, q_id):
    attachment = Attachments(
        file_name=secure_filename(file.filename),
        mime_type=file.mimetype,
        data=file.read(),
        question_id = q_id
    )
    db.session.add(attachment)
    db.session.commit()

@bp.route('/downloadfile/question/<int:q_id>')
def download_file(q_id):
    attachment = Attachments.query.filter_by(question_id=q_id).first()
    if attachment is None:
        return "File not found."
    return send_file(BytesIO(attachment.data),as_attachment=True, mimetype=attachment.mime_type,download_name=attachment.file_name )
    # # # 파일 저장
    # save_path = os.path.join(config.UPLOAD_FOLDER, uploadto)
    # with open(save_path, 'wb') as f:
    #     f.write(attachment.data)