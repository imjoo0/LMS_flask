import config 
import requests
import json
import datetime

headers = {'content-type': 'application/json'}

def json_default(value):
    if isinstance(value, datetime.datetime):
        return value.strftime('%Y-%m-%d')
    raise TypeError('not serializable')

def purple_info(id,url):
    result = requests.post(config.api + url, headers=headers, data=json.dumps({'data':{'id': id}}))
    result = result.json()
    if(len(result) > 0):
        if(len(result) == 1):
            result = result[0]
        return result
    else:
        return False

def purple_ban(id,url):
    result = requests.post(config.api + url, headers=headers, data=json.dumps({'data':{'id': id}}))
    result = result.json()
    if(len(result)>0):
        return result
    else:
        return False

def purple_allinfo(url):
    result = requests.post(config.api + url, headers=headers, data=json.dumps({'data':{}}))
    result = result.json()
    if(len(result) > 0):
        if(len(result) == 1):
            result = result[0]
        return result
    else:
        return False
    
def purple_allban(url):
    result = requests.post(config.api + url, headers=headers, data=json.dumps({'data':{}}))
    result = result.json()
    if(len(result)>0):
        return result
    else:
        return False
    
def get_user(teacher_id):
    return requests.post(config.api + 'get_teacher_info', headers=headers, data=json.dumps({'data':{'id': teacher_id}}))

def find_user(teacher_name):
    result = requests.post(config.api + 'get_teacher_info', headers=headers, data=json.dumps({'data':{'id': teacher_name}}))
    result = result.json()
    print(result)
    if(len(result)>0):
        return result
    else:
        return False
# # 밑에 다 지워도 된다. 
# def get_teacher_info(teacher_id):
#     result = requests.post(config.api + 'get_teacher_info', headers=headers, data=json.dumps({'data':{'id': teacher_id}}))
#     result = result.json()
#     if(len(result)>0):
#         result = result[0]
#     return result
# def get_teacher_info_by_id(teacher_id):
#     result = requests.post(config.api + 'get_teacher_info_by_id', headers=headers, data=json.dumps({'data':{'id': teacher_id}}))
#     result = result.json()
#     if(len(result)>0):
#         result = result[0]
#     return result

# def get_mystudents(teacher_id):
#     result = requests.post(config.api + 'get_mystudents', headers=headers, data=json.dumps({'data':{'id': teacher_id}}))
#     result = result.json()
#     # name / register_no / origin / nick_name / mobileno / pname / pmobileno
#     return result

# def get_mybans(teacher_id):
#     result = requests.post(config.api + 'get_mybans', headers=headers, data=json.dumps({'data':{'id': teacher_id}}))
#     result = result.json()
#     # register_no / name / semester / total_student_num 
#     for i in result:
#         if ((i['semester']-13)%3) == 1:
#             i['semester'] = 1
#         elif ((i['semester']-13)%3) == 2:
#             i['semester'] = 5
#         elif ((i['semester']-13)%3) == 0:
#             i['semester'] = 9
#         else:
#             i['semester'] = i['semester'] 
#     return result

# def all_ban_info():
#     result = requests.post(config.api + 'get_all_ban', headers=headers, data=json.dumps({'data':{}}))
#     result = result.json()
#     # register_no / name / semester 
#     for i in result:
#         if ((i['semester']-13)%3) == 1:
#             i['semester'] = 1
#         elif ((i['semester']-13)%3) == 2:
#             i['semester'] = 5
#         elif ((i['semester']-13)%3) == 0:
#             i['semester'] = 9
#         else:
#             i['semester'] = i['semester'] 
#     return result
# def plus_alpha_info():
#     result = requests.post(config.api + 'get_plusalpha_ban', headers=headers, data=json.dumps({'data':{}}))
#     result = result.json()
#     # register_no / name / semester 
#     for i in result:
#         if ((i['semester']-13)%3) == 1:
#             i['semester'] = 1
#         elif ((i['semester']-13)%3) == 2:
#             i['semester'] = 5
#         elif ((i['semester']-13)%3) == 0:
#             i['semester'] = 9
#         else:
#             i['semester'] = i['semester'] 
#     return result

# # ban_registerno 반 PK 아이디 
# def get_ban(ban_id):
#     result = requests.post(config.api + 'get_ban', headers=headers, data=json.dumps({'data':{'id': ban_id}}))
#     result = result.json()
#     if(len(result)>0):
#         result = result[0]
#     else:
#         return False
#     # register_no / ban_name / semester 
#     # teacher_register_no / teacher_name / teacher_engname /teacher_mobileno / teacher_email
#     # student_num
#     if ((result['semester']-13)%3) == 1:
#         result['semester'] = 1
#     elif ((result['semester']-13)%3) == 2:
#         result['semester'] = 5
#     elif ((result['semester']-13)%3) == 0:
#         result['semester'] = 9
#     else:
#         result['semester'] = result['semester'] 

#     return result

# # student_registerno 학생 PK 아이디 
# def get_student_info(student_id):
#     result = requests.post(config.api + 'get_student_info', headers=headers, data=json.dumps({'data':{ 'id':  student_id }}))
#     result = result.json()
#     if(len(result)>0):
#         result = result[0]
#     return result

# # ban_registerno 반 PK 아이디 -> student
# def get_students(ban_id):
#     result = requests.post(config.api + 'get_students', headers=headers, data=json.dumps({'data':{'id': ban_id}}))
#     result = result.json()
#     return result
#     # register_no / origin / name / pmobileno / pname 

# # # ban_registerno 반 PK 아이디 -> student
# # def get_student(url,data):
# #     result = requests.post(config.api + url, headers=headers, data=json.dumps({'data':{'id': data}}))
# #     result = result.json()
# #     return result
# #     # register_no / origin / name / pmobileno / pname /reco_book_code /register_date
# def get_alimnote(ban_id):
#     result = requests.post(config.api + 'get_alimnote', headers=headers, data=json.dumps({'data':{'id': ban_id}}))
#     result = result.json()
#     return result


# def get_notice(ban_id):
#     result = requests.post(config.api + 'get_notice', headers=headers, data=json.dumps({'data':{'id': ban_id}}))
#     result = result.json()
#     return result

def get_all_student_num():
    result = requests.post(config.api + 'get_all_student_num', headers=headers, data=json.dumps({'data':{}}))
    result = result.json()
    if(len(result)>0):
        result = result[0]
    return result

def get_all_teacher():
    result = requests.post(config.api + 'get_all_teacher', headers=headers, data=json.dumps({'data':{}}))
    result = result.json()
    return result