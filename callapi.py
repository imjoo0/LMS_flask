import config 
import requests
import json
import datetime

headers = {'content-type': 'application/json'}

def json_default(value):
    if isinstance(value, datetime.datetime):
        return value.strftime('%Y-%m-%d')
    raise TypeError('not serializable')

def purple_ban(id,url):
    result = requests.post(config.api + url, headers=headers, data=json.dumps({'data':{'id': id}}))
    result = result.json()
    if(len(result)>0):
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

# new 정리
def call_api(id,url):
    result = requests.post(config.api + url, headers=headers, data=json.dumps({'data':{'id': id}}))
    result = result.json()
    return result
    
def purple_allinfo(url):
    result = requests.post(config.api + url, headers=headers, data=json.dumps({'data':{}}))
    result = result.json()
    if(len(result) > 0):
        if(len(result) == 1):
            result = result[0]
        return result
    else:
        return False

def purple_info(id,url):
    result = requests.post(config.api + url, headers=headers, data=json.dumps({'data':{'id': id}}))
    result = result.json()
    if(len(result) > 0):
        if(len(result) == 1):
            result = result[0]
        return result
    else:
        return False

    # 퍼플 라이팅 정보 가져오기
def call_purplewriting(ban_id):
    responese = requests.get('https://writing.purpleacademy.co.kr/api/getunsubmitstudents', headers={'bid': ban_id})
    result = json.loads(responese.text)
    return result