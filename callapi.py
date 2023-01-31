import config 
import requests
import json

headers = {'content-type': 'application/json'}

# session['user_id'] 선생님 아이디 
def get_user(teacher_id):
    return requests.post(config.api + 'get_teacher_info', headers=headers, data=json.dumps({'data':{'id': teacher_id}}))

def get_teacher_info(teacher_id):
    result = requests.post(config.api + 'get_teacher_info', headers=headers, data=json.dumps({'data':{'id': teacher_id}}))
    result = result.json()
    result = result[0]
    return result

def get_mystudents(teacher_id):
    result = requests.post(config.api + 'get_mystudents', headers=headers, data=json.dumps({'data':{'id': teacher_id}}))
    result = result.json()
    result = result[0]
    return result

def get_mybans(teacher_id):
    result = requests.post(config.api + 'get_mybans', headers=headers, data=json.dumps({'data':{'id': teacher_id}}))
    result = result.json()
    result = result[0]
    return result

def all_ban_info():
    result = requests.post(config.api + 'get_all_ban', headers=headers, data=json.dumps({'data':{}}))
    result = result.json()
    result = result[0]
    return result

# ban_registerno 반 PK 아이디 
def get_ban(ban_id):
    result = requests.post(config.api + 'get_mybans', headers=headers, data=json.dumps({'data':{'id': ban_id}}))
    result = result.json()
    result = result[0]
    return result

# student_registerno 학생 PK 아이디 
def get_student_info(student_id):
    result = requests.post(config.api + 'get_student_info', headers=headers, data=json.dumps({'data':{ 'id':  student_id }}))
    result = result.json()
    result = result[0]
    return result