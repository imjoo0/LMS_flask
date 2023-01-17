from flask import Blueprint,render_template, jsonify, request,redirect,url_for
import config 

bp = Blueprint('teacher', __name__, url_prefix='/')

# 메인 페이지 
@bp.route("/", methods=['GET'])
def home():
    return render_template('teacher.html')