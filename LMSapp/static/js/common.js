// manage변수 
let switchstudentData, outstudentData, banData, totalOutnum, totalHoldnum, studentsData, reportsData, consultingData, consultingHistoryData, consultingcateData, taskData, taskcateData, questionData, answerData, attachData, CSdata;
let consultingCount, questionCount, taskCount;
let tempConsultingData,temptaskData;
let AlarmList = []
const studentMap = new Map();
const banMap = new Map();
const attachMap = new Map();

// teacher 변수
let  Tconsulting_category, Tban_data, Tall_consulting, Tmy_students, Tall_task, Ttask_consulting, Tunlearned_student, Tall_students, Tstudent_consulting, TquestionAnswerdata, TquestionAttachdata;
const TattachMap = new Map();

let isFetching = false;

const today = new Date().setHours(0, 0, 0, 0);
const todayyoil = new Date().getDay()

// 공용 function
function getIsFetching(){
    return isFetching;
}
function setIsFetching(value){
    isFetching = value;
}
function deleteCookie(name) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}
function logout() {
    $.ajax({
        type: "GET",
        url: "/logout",
        data: {},
        success: function (response) {
            if (response['result'] === 'success') {
                deleteCookie('mytoken');
                window.location.href = '/';
            } else {
                window.location.href = '/';
            }
        }
    })
}
function put_user(){
    let new_pw1 = $('#new_password1').val()
    let new_pw2 = $('#new_password2').val()
    if(new_pw1 != new_pw2){
        alert('비밀번호가 동일하지 않습니다')
        return;
    }
    $.ajax({
        type: "POST",
        url: "/common/put_user",
        data: {
            new_pw : new_pw1
        },
        success: function (response) {
            {
                if(response['result'] == 'success'){
                    alert('패스워드가 수정되었습니다')
                    window.location.reload();
                }
            }
        }
    });
}
let make_reject_code = function (rc) {
    if (rc == 0) {
        return '❌ 미완료';
    } else {
        return '⭕ 완료';
    }
}
let make_part = function (c) {
    if (c == 1 || c == '1') {
        return '관리부서';
    } else if (c == 2 || c == '2'){
        return '담임 T';
    } else{
        return '최고 관리자';
    }
}
let make_small_char = function(c){
    if(c && c.length > 30) {
        c = c.substring(0, 30) + ' ▪️▪️▪️ ';
    }
    return c
}
let make_answer_code = function(rc){
    if( rc == 0){
        return '❌ 반려';
    } else {
        return '⭕ 승인';
    }
}
let make_cycle = function (c) {
    if (c == 1) {
        return '월요일 마다';
    } else if (c == 2) {
        return '화요일 마다';
    } else if (c == 3) {
        return '수요일 마다';
    } else if (c == 4) {
        return '목요일 마다';
    } else if (c == 5) {
        return '금요일 마다';
    } else {
        return '주기 없음';
    }
}
let make_out = function(c) {
    if (c != 1) {
        return '이반퇴소원생';
    }
    return '';
}
let make_hours = function(time){
    var date = new Date(time);

    // 한국 시간으로 변환
    var koreaTime = date.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
    return koreaTime
} 
let make_date_with_yoil = function (d) {
    if (d == null) {
        return '➖';
    }
    const date = new Date(d);
    const options = { timeZone: "Asia/Seoul", weekday: "long", year: "numeric", month: "long", day: "numeric" };
    const koreaTime = date.toLocaleString("ko-KR", options);
    
    return koreaTime;
}
let make_date = function (d) {
    if (d == null) {
        return '➖';
    }
    const date = new Date(d);
    const options = { timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric" };
    const koreaTime = date.toLocaleString("ko-KR", options);
    
    return koreaTime;
}
let make_nullcate = function (d) {
    if (d == null || d == "") {
        return '➖'
    }
    return d;
}
let missed_date = function (d) {
    const date = new Date(d)
    const standard = new Date('1111-01-01')
    if (date.getTime() == standard.getTime()) {
        return "없음"
    } else if (date.setHours(0, 0, 0, 0) == today) {
        return "오늘"
    } else {
        return date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0')
    }
}
let make_priority = function (priority) {
    if (priority == 1) return '무관';
    else if (priority == 2) return '오후업무';
    else if (priority == 3) return '오전업무🌞';
    else return '긴급업무⚡';
}
let answer_rate = function (answer, all) {
    if (Object.is(answer / all, NaN) || Object.is(answer / all, Infinity)) return 0;
    else return answer / all * 100;
}
let make_semester = function (semester) {
    if (semester == 1) {
        return 1;
    } else if (semester == 2) {
        return 5;
    } else if (semester == 0) {
        return 9;
    } else {
        return semester
    }
}
function q_category(category) {
    if (category == 1 || category == '1') {
        c = '퇴소문의'
    } else if (category == 2 || category == '2') {
        c = '이반문의'
    }else if (category == 3 || category == '3') {
        c = '일반문의'
    } else if (category == 4 || category == '4') {
        c = '기술 지원 문의'
    }else {
        c = '내근티처 문의'
    }
    return c
}
function make_nodata(d) {
    if (d == 0) {
        return '없음'
    } else {
        return d + '건'
    }
}
function make_duedate(s, d) {
    sdate = new Date(s).setHours(0, 0, 0, 0)
    ddate = new Date(d).setHours(0, 0, 0, 0)
    if (today < sdate) {
        return '진행 예정'
    } else if (sdate <= today && today <= ddate) {
        return '진행 중'
    } else if (ddate < today) {
        return '마감'
    } else {
        return '오류'
    }
}
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// teacher_function
async function get_teacher_data(){
    try{
        const response = await $.ajax({
            url: '/teacher/get_teacher_data',
            type: 'GET',
            dataType: 'json',
            data: {},
        });
        Tban_data = response.ban_data
        Tall_consulting = response.all_consulting
        Tconsulting_category = response.all_consulting_category
        Tall_task = response.all_task
        Tall_task =  Tall_task.length > 0 ? Tall_task.filter(task => (task.done == 1 && new Date(task.created_at).setHours(0, 0, 0, 0) === today)||(task.done == 0)) : [];
        // student_consulting 
        Tall_students = response.my_students
        Tmy_students = Tall_students.filter(s=>s.category_id == 1)
        Tstudent_consulting = Tall_students.reduce((acc, student) => {
            const consultingList = Tall_consulting.filter(c => c.student_id === student.student_id);
            const ulconsultings =  consultingList.length > 0 ? consultingList.filter(c => c.category_id < 100) : []
            const ulearned_num =  ulconsultings.length
            let todoconsulting = consultingList.length > 0 ? consultingList.filter(c => c.done == 0) : []
            let todoconsulting_num = todoconsulting.length
            const doneconsulting =consultingList.length > 0 ? consultingList.filter(c => c.done == 1) : []
            const doneconsulting_num = doneconsulting.length
            if(student.category_id == 1){
                acc.push({
                    'teacher_id': student.teacher_id,
                    'student_id': student.student_id,
                    'student_origin': student.origin,
                    'student_name': student.name + '(' + student.nick_name + ')',
                    'student_mobileno': student.mobileno,
                    'student_category': student.category_id,
                    'student_birthday': student.birthday,
                    'ban_id': student.ban_id,
                    'ban_name': student.classname,
                    'todoconsulting':todoconsulting,
                    'todoconsulting_num':todoconsulting_num,
                    'doneconsulting':doneconsulting,
                    'doneconsulting_num':doneconsulting_num,
                    'ulconsultings':ulconsultings,
                    'ulearned_num':ulearned_num,
                    'is_out_student':0
                });
            }else{
                todoconsulting = todoconsulting.filter(c=>c.category_id < 100)
                todoconsulting_num = todoconsulting.length
                acc.push({
                    'teacher_id': student.teacher_id,
                    'student_id': student.student_id,
                    'student_origin': student.origin,
                    'student_name': student.name + '(' + student.nick_name + ')',
                    'student_mobileno': student.mobileno,
                    'student_category': student.category_id,
                    'student_birthday': student.birthday,
                    'ban_id': student.ban_id,
                    'ban_name': student.classname,
                    'todoconsulting':todoconsulting,
                    'todoconsulting_num':todoconsulting_num,
                    'doneconsulting':doneconsulting,
                    'doneconsulting_num':doneconsulting_num,
                    'ulearned_num':ulearned_num,
                    'is_out_student':1
                });
            }
            return acc;
        }, []);
        Tunlearned_student = Tmy_students.reduce((acc, student) => {
            const consultingList = Tall_consulting.filter(c => c.student_id === student.student_id && c.category_id < 100);
            const unlearned_num = consultingList.length;
            if (unlearned_num>0){
                const todoconsulting = consultingList.filter(c => c.done == 0)
                const todoconsulting_num = todoconsulting.length
                if(todoconsulting_num > 0) {
                    const deadline = todoconsulting.reduce((prev, current) => {
                        let prevDueDate = new Date(prev.deadline).setHours(0, 0, 0, 0);
                        let currentDueDate = new Date(current.deadline).setHours(0, 0, 0, 0);
                        return currentDueDate < prevDueDate ? current : prev;
                    }, todoconsulting[0]);
                    const missed = todoconsulting.reduce((prev, current) => {
                        let prevDueDate = new Date(prev.missed).setHours(0, 0, 0, 0);
                        let currentDueDate = new Date(current.missed).setHours(0, 0, 0, 0);
                        return currentDueDate < prevDueDate ? prev : current;
                    }, todoconsulting[0]);
                    acc.push({
                        'teacher_id': student.teacher_id,
                        'student_id': student.student_id,
                        'student_origin': student.origin,
                        'student_name': student.name + '(' + student.nick_name + ')',
                        'student_mobileno': student.mobileno,
                        'student_birthday': student.birthday,
                        'ban_id': student.ban_id,
                        'ban_name': student.classname,
                        'consulting_done':0,
                        'todoconsulting_num':todoconsulting_num,
                        'deadline': make_date(deadline.deadline),
                        'missed': missed_date(missed.missed)
                    });
                }else{
                    acc.push({
                        'teacher_id': student.teacher_id,
                        'student_id': student.student_id,
                        'student_origin': student.origin,
                        'student_name': student.name + '(' + student.nick_name + ')',
                        'student_mobileno': student.mobileno,
                        'student_birthday': student.birthday,
                        'ban_id': student.ban_id,
                        'ban_name': student.classname,
                        'consulting_done':1,
                        'todoconsulting_num':todoconsulting_num,
                        'deadline': make_date('3000-01-01'),
                        'missed': missed_date('1111-01-01')
                    });
                }
            }
            return acc;
        }, []);
    } catch (error) {
        alert('Error occurred while retrieving data1.');
    }
}
async function get_teacher_question() {
    try {
        const response = await $.ajax({
            type: "GET",
            url: "/teacher/get_questiondata",
            dataType: 'json',
            data: {},
        });
        TquestionAnswerdata = response.question
        TquestionAttachdata = response.attach
        TquestionAttachdata.forEach((attach) => {
            const question_id = attach.question_id
            if(TattachMap.has(question_id)) {
                const existingAttach = TattachMap.get(question_id);
                existingAttach.push({
                attach_id: attach.id,
                file_name: attach.file_name,
                is_answer: attach.is_answer
                });
            }else {
                TattachMap.set(question_id, [{
                attach_id: attach.id,
                file_name: attach.file_name,
                is_answer: attach.is_answer
                }]);
            }
        })
    } catch (error) {
        alert('Error occurred while retrieving data.');
    }
}

// manage_function 
async function get_all_data() {
    try {
        const bansWorker = new Worker("../static/js/bans_worker.js");
        bansWorker.postMessage('get_bansData');
        const studentsWorker = new Worker("../static/js/students_worker.js");
        studentsWorker.postMessage('get_studentsData');
        studentsWorker.onmessage = function (event) {
            studentsData = event.data.students
            for (let i = 0; i < studentsData.length; i++) {
                const student = studentsData[i];
                studentMap.set(student.student_id, {
                    origin: student.origin,
                    student_name:student.student_name + ' (' + student.student_engname + ')',
                });
            }
        };
        bansWorker.onmessage = function (event) {
            banData = event.data.all_ban
            totalOutnum = 0;
            totalHoldnum = 0
            let temp_o_ban_id = '<option value="none" selected>이반 처리 결과를 선택해주세요</option><option value=0>반려</option>'
            banData.forEach((elem) => {
                elem.out_student_num = Number(elem.out_student_num)
                elem.hold_student_num = Number(elem.hold_student_num)
                elem.total_out_num = elem.out_student_num + elem.hold_student_num
                elem.first_student_num = elem.student_num - elem.total_out_num
                elem.out_num_per = answer_rate(elem.total_out_num, elem.first_student_num).toFixed(0)
                totalOutnum += elem.out_student_num
                totalHoldnum += elem.hold_student_num
                let value = `${elem.ban_id}_${elem.teacher_id}_${elem.name}`;
                let selectmsg = `<option value="${value}">${elem.name} (${make_semester(elem.semester)}월 학기)</option>`;
                temp_o_ban_id += selectmsg
                banMap.set(elem.ban_id, {
                    ban_name: elem.name,
                    teacher_email: elem.teacher_email,
                    teacher_name: elem.teacher_engname +'( '+ elem.teacher_name +' )'
                });
            });
            $('#o_ban_id2').html(temp_o_ban_id)
            banData =banData.map((item) => {
                return { ...item, total_out_num_per: Number(answer_rate(item.out_student_num, totalOutnum).toFixed(2)) }
            })
            get_total_data();
        };

    } catch (error) {
        alert('Error occurred while retrieving data.44');
    }
}
async function get_cs_data() {
    try {
        if(!CSdata){
            const csWorker = new Worker("../static/js/cs_worker.js");
            const message = new Promise((resolve, reject) => {
                csWorker.onmessage = function (event) {
                    resolve(event.data.all_cs_data);
                    resolve(event.data.question);
                    resolve(event.data.answer);
                    resolve(event.data.attach);
                };
                csWorker.onerror = function (error) {
                    reject(error);
                };

            });
            csWorker.postMessage('getCSdata');
            CSdata = await message;
        }
    } catch (error) {
        alert('Error occurred while retrieving data.');
    }
}

// 상담 기록 조회 
function get_consulting_history(s_id) {
    student_info = studentsData.filter(s => s.student_id == s_id)[0]
    $('#consultinghistoryModalLabelt').html(`${student_info.ban_name}반 ${student_info.student_name} ( ${student_info.student_engname} * ${student_info.origin} )원생`)
    consultings = consultingData.filter(c => c.student_id == s_id && new Date(c.startdate).setHours(0, 0, 0, 0) <= today)
    done_consultings = consultings.filter(c => c.done == 1)
    notdone_consultings = consultings.filter(c => c.done == 0)
    consultinglist_len = consultings.length
    let cant_consulting_list = notdone_consultings.length > 0 ? notdone_consultings.filter(c => c.created_at != null) : 0;
    notdone_consultings = consultinglist_len > 0 ? notdone_consultings.filter(c => c.created_at == null) : 0

    // 미학습 상담
    let temp_student_unlearned = `
    <td class="col-3"> 총: ${consultinglist_len}건 완수: ${done_consultings.length} / ${consultinglist_len}건 ( ${answer_rate(done_consultings.length, consultinglist_len).toFixed(0)}% )</td> 
    <td class="col-3" style="color:red">${make_nodata(consultings.filter(c => new Date(c.deadline).setHours(0, 0, 0, 0) < today).length + cant_consulting_list.length)}</td>
    <td class="col-3">${student_info.unlearned}건 </td>
    <td class="col-3">${student_info.up}% </td>`
    $('#student_unlearned').html(temp_student_unlearned)
    let IsG3 = make_IsG3(student_info.ban_name)
    unlearnedconsulting = consultingData.filter(c => c.student_id == s_id && new Date(c.startdate).setHours(0, 0, 0, 0) <= today && c.category_id < 100)
    let temp_student_unlearned_totalreport = ''
    if (IsG3) {
        temp_student_unlearned_totalreport = `
        <th class="col-2">IXL</th>
        <th class="col-2">리딩</th>
        <th class="col-3">인투리딩 미응시</th>
        <th class="col-3">라이팅 과제 미제출</th>
        <th class="col-2">홈페이지 미접속</th>
        <td class="col-2">${make_nodata(unlearnedconsulting.filter(u => u.category_id == 1).length)}</td>
        <td class="col-2">${make_nodata(unlearnedconsulting.filter(u => u.category_id == 4).length)}</td>
        <td class="col-3">${make_nodata(unlearnedconsulting.filter(u => u.category_id == 5).length)}</td>
        <td class="col-3">${make_nodata(unlearnedconsulting.filter(u => u.category_id == 6).length)}</td>
        <td class="col-2">${make_nodata(unlearnedconsulting.filter(u => u.category_id == 2).length)}</td>
        `;
    } else {
        temp_student_unlearned_totalreport = `
        <th class="col-2">IXL</th>
        <th class="col-2">리딩</th>
        <th class="col-2">리특</th>
        <th class="col-2">인투리딩 미응시</th>
        <th class="col-2">라이팅 과제 미제출</th>
        <th class="col-2">미접속</th>
        <td class="col-2">${make_nodata(unlearnedconsulting.filter(u => u.category_id == 1).length)}</td>
        <td class="col-2">${make_nodata(unlearnedconsulting.filter(u => u.category_id == 4).length)}</td>
        <td class="col-2">${make_nodata(unlearnedconsulting.filter(u => u.category_id == 3).length)}</td>
        <td class="col-2">${make_nodata(unlearnedconsulting.filter(u => u.category_id == 5).length)}</td>
        <td class="col-2">${make_nodata(unlearnedconsulting.filter(u => u.category_id == 6).length)}</td>
        <td class="col-2">${make_nodata(unlearnedconsulting.filter(u => u.category_id == 2).length)}</td>
    `;
    }
    $('#student_unlearned_totalreport').html(temp_student_unlearned_totalreport);

    if (cant_consulting_list.length > 0) {
        $('#consulting_cant_write_box').empty();
        for (i = 0; i < cant_consulting_list.length; i++) {
            let target = cant_consulting_list[i]
            let category = target['week_code'] + '주간  ' + target['category']
            let contents = target['contents']
            let consulting_missed = missed_date(target['missed'])
            let startdate = make_date(target['startdate'])
            let deadline = make_date(target['deadline'])
            let history_created = target['created_at']
            let temp_consulting_contents_box = `
            <p class="mt-lg-4 mt-5">✅<strong>${category}</strong></br><strong>
            ➖상담 시작일:${startdate} ~
            ➖상담 마감일:~${deadline}까지 </strong>| 부재중 : ${consulting_missed}</br>
                <strong style="color:red;">➖ 이미 원생이 ${make_date(history_created)}일 날 학습을 완료했습니다. (  ✏️ 추천: 원생목록에서 추가 상담 진행)</strong></br>
                ${contents}</br> 
            </p>
            `;
            $('#consulting_cant_write_box').append(temp_consulting_contents_box);
        }
    }
    if (consultinglist_len == 0) {
        $('#consultinghistoryModalLabelt').html('진행 할 수 있는 상담이 없습니다.* 원생 목록에서 추가 상담을 진행해주세요 *')
    } else {
        consultings.sort((a, b) => { return make_date(a.deadline) - make_date(b.deadline) });
        $('#consulting_write_box').empty();
        for (i = 0; i < consultinglist_len; i++) {
            let target = consultings[i]
            let category = target['category']
            let consulting_id = target['id']
            let contents = target['contents']
            let consulting_missed = missed_date(target['missed'])
            let startdate = make_date(target['startdate'])
            let deadline = make_date(target['deadline'])
            if (target['category_id'] < 100) {
                category = target['week_code'] + '주간  ' + category
            }
            let temp_consulting_contents_box = `
            <input type="hidden" id="target_consulting_id${i}" value="${consulting_id}" style="display: block;" />
            <p class="mt-lg-4 mt-5">✅<strong>${category}</strong></br><strong>
            ➖상담 시작일:${startdate} ~
            ➖상담 마감일:~${deadline}까지 </strong>| 부재중 : ${consulting_missed}</br>
                <strong>➖ 진행 해야 하는 상담 </strong></br>
                ${contents}</br> 
            </p>
            `;
            $('#consulting_write_box').append(temp_consulting_contents_box);
        }
        for (i = 0; i < done_consultings.length; i++) {
            let target = done_consultings[i]
            let category = target['category']
            let consulting_id = target['id']
            let contents = target['contents']
            let consulting_missed = missed_date(target['missed'])
            let startdate = make_date(target['startdate'])
            let deadline = make_date(target['deadline'])
            let history_created = target['created_at']
            if (target['category_id'] < 100) {
                category = target['week_code'] + '주간  ' + category
            }
            let history_reason = target['reason'] == null ? '입력해주세요' : target['reason']
            let history_solution = target['solution'] == null ? '입력해주세요' : target['solution']
            let history_result = target['result'] == null ? '입력해주세요' : target['result']
            let temp_consulting_contents_box = `
            <input type="hidden" id="target_consulting_id${i}" value="${consulting_id}" style="display: block;" />
            <p class="mt-lg-4 mt-5">✅<strong>${category}</strong></br><strong>
            ➖상담 시작일:${startdate}까지~
            ➖상담 마감일:~${deadline}까지 </strong>| 부재중 : ${consulting_missed}</br>
                <strong>상담 일시 : ${make_date(history_created)}</strong></br>
                ${contents}</br> 
            </p>
            <div class="modal-body-select-container">
                <span class="modal-body-select-label">상담 사유</span>
                <input class="modal-body-select" type="text" size="50"
                    id="consulting_reason${consulting_id}" placeholder="${history_reason}">
            </div>
            <div class="modal-body-select-container">
                <span class="modal-body-select-label">제공한 가이드</span>
                <input class="modal-body-select" type="text" size="50"
                    id="consulting_solution${consulting_id}" placeholder="${history_solution}">
            </div>
            <div class="modal-body-select-container">
                <span class="modal-body-select-label">상담 결과</span>
                <textarea class="modal-body-select" type="text" rows="5" cols="25"
                    id="consulting_result${consulting_id}" placeholder="${history_result}"></textarea>
            </div>
            <p>상담 일시 : ${make_date(history_created)}</p>
            `;
            $('#consulting_write_box').append(temp_consulting_contents_box);
        }
    }
}

// 문의 삭제 함수 
async function delete_question(q_id) {
    var con_val = confirm('정말 삭제하시겠습니까?')
    if (con_val == true) {
        await $.ajax({
            type: 'POST',
            url: '/common/delete_question/' + q_id,
            data: {},
            success: function (data) {
                alert(data)
                questionData = questionData.filter(function(item) {
                    return item.id !== q_id;
                });
                attachData = attachData.filter(function(item) {
                    return item.question_id !== q_id;
                });
                main_view()
            },
            error: function (xhr, status, error) {
                alert(xhr.responseText);
            }
        })
    }
}

// 상담 삭제 함수
async function delete_consulting(id,category){
    const csrf = $('#csrf_token').val();
    var con_val = confirm('삭제 후 복구 할 수 없습니다. 정말 삭제하시겠습니까?')
    if (con_val == true) {
        if(category < 100){
            alert('미학습 상담은 삭제할 수 없습니다')
            return;
        }
        await $.ajax({
            url: '/common/delete_consulting/' + id,
            type: 'POST',
            headers: { 'content-type': 'application/json' },
            data: {},
            success: function (data) {
                if (data.status == 200) {
                    alert(`삭제되었습니다.`)
                    window.location.reload()
                }else{
                    alert(`실패 ${data.status} ${data.text}`)
                }
            },
            error: function (xhr, status, error) {
                alert(xhr.responseText);
            }
        })
    }
}
