// manage변수 
let switchstudentData, outstudentData, banData, totalOutnum, studentsData, reportsData, consultingData, consultingHistoryData, consultingcateData, taskData, taskcateData, questionData, answerData, attachData, CSdata;
let consultingCount, questionCount, taskCount;
let tempConsultingData,temptaskData;
let AlarmList = []
const studentMap = new Map();
const banMap = new Map();
const attachMap = new Map();

// teacher 변수
let  TstudentMap;
let  TbanMap = new Map();
const consultingStudentMap = new Map();
const TunSubList = {};

let  Tban_data, Tall_consulting, taskConsultingsData, TunlearnedConsultingsData, unlearnedConsultingsCount,
Tmy_students, Tall_task,Tgrouped_task, Ttask_consulting, Tunlearned_student,
Tall_students, Tstudent_consulting, TquestionAnswerdata, TquestionAttachdata,
Tall_writing, Tunsubmit_list;
let groupedData = {};
const TattachMap = new Map();

let isFetching = false;

const today = new Date().setHours(0, 0, 0, 0);
const todayyoil = new Date().getDay()

// 공용 function
function find_min_deadline(unlearned_list) {
    if (unlearned_list.length === 0) {
        return null; // 빈 배열인 경우 null 반환
    }

    let minDeadline = unlearned_list[0].deadline; // 첫 번째 요소로 초기화

    for (let i = 1; i < unlearned_list.length; i++) {
        const currentDeadline = unlearned_list[i].deadline;
        if (currentDeadline < minDeadline) {
            minDeadline = currentDeadline; // 더 작은 deadline을 찾으면 업데이트
        }
    }

    return minDeadline;
}
function find_recent_missed(unlearned_list) {
    if (unlearned_list.length === 0) {
        return null; // 빈 배열인 경우 null 반환
    }

    let recentMissedDate = unlearned_list[0].missed; // 첫 번째 요소로 초기화

    for (let i = 1; i < unlearned_list.length; i++) {
        const currentMissedDate = unlearned_list[i].missed;
        if (currentMissedDate > recentMissedDate) {
            recentMissedDate = currentMissedDate; // 더 최근 날짜를 찾으면 업데이트
        }
    }

    return recentMissedDate;
}
function make_sub(type, startdate) {
    if(startdate){
        // 문자열에서 'T'와 'Z'를 제거한 후 Date 객체로 변환
        const startDateObj = new Date(startdate.replace('T', ' ').replace('Z', ''));

        // 한국 시간 기준으로 변경
        const startDateInKorea = new Date(startDateObj.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));

        // 계산된 마감일을 담을 변수
        let endDateInKorea = new Date(startDateInKorea);

        if (type === "1" || type === "2" || type === "5") {
            endDateInKorea.setDate(endDateInKorea.getDate() + 14);
        } else if (type === "3" || type === "4") {
            endDateInKorea.setDate(endDateInKorea.getDate() + 7);
        } else {
            endDateInKorea.setDate(endDateInKorea.getDate() + 5);
        }

        // 날짜를 "YYYY-MM-DD" 형식의 문자열로 반환
        const year = endDateInKorea.getFullYear();
        const month = String(endDateInKorea.getMonth() + 1).padStart(2, '0');
        const day = String(endDateInKorea.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }else{return '마감일 데이터 없음'}
}
function make_type(type){
    if(type=="1"){
        return "오거나이저"
    }else if(type=="2"){
        return "인투리딩 라이팅"
    }else if(type=="3"){
        return "새들리어"
    }else if(type=="4"){
        return "보캐블러리"
    }else if(type=="5"){
        return "인투리딩 서머리"
    }else{
        return "리딩익스플로러 서머리"
    }
}
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
        return '반려 (❌)';
    } else if(rc == null){
        return '미응답';
    }else {
        return ' 승인 (⭕)';
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
    if (c != 1 && c != 8) {
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

// manage_function 
async function get_all_data() {
    try {
        const response = await $.ajax({
            url: '/common/all_ban',
            type: 'GET',
            dataType: 'json',
            data: {},
        });
        let all_data = response.all_data
        totalOutnum = 0;
        let temp_o_ban_id = '<option value="none" selected>이반 처리 결과를 선택해주세요</option><option value=0>반려</option>' 
        var { temp_banData, temp_studentsData } = all_data.reduce(
            (acc, item) => {
                if (!banMap.has(item.ban_id)) {

                    banMap.set(item.ban_id, {
                    ban_name: item.ban_name,
                    teacher_email: item.teacher_email,
                    teacher_name: item.teacher_engname + ' (' + item.teacher_name + ')'
                    });
                    
                    const student_num = Number(item.student_num);
                    const out_student_num = Number(item.out_student_num);
                    const hold_student_num = Number(item.hold_student_num);
                    const total_out_num = out_student_num + hold_student_num;
                    const first_student_num = item.student_num - total_out_num;
                    const out_num_per = answer_rate(total_out_num, student_num).toFixed(0);
                    totalOutnum += total_out_num

                    temp_o_ban_id += `<option value="${item.ban_id}_${item.teacher_id}_${item.name}">${item.name} (${make_semester(item.semester)}월 학기)</option>`
            
                    acc.temp_banData.push({
                    ban_id: item.ban_id,
                    name: item.ban_name,
                    hold_student_num: item.hold_student_num,
                    name_numeric: item.name_numeric,
                    out_student_num: item.out_student_num,
                    semester: item.semester,
                    semester_student_num: item.semester_student_num,
                    teacher_email: item.teacher_email,
                    teacher_engname: item.teacher_engname,
                    teacher_id: item.teacher_id,
                    teacher_mobileno: item.teacher_mobileno,
                    teacher_name: item.teacher_name,
                    total_student_num: item.total_student_num,
                    student_num,
                    out_student_num,
                    hold_student_num,
                    total_out_num,
                    first_student_num,
                    out_num_per
                    });
                }
          
                studentMap.set(item.student_id,{
                    origin:item.origin,
                    student_name: item.student_name + ' (' + item.student_engname + ')',
                    mobileno : student.mobileno
                })
                acc.temp_studentsData.push({
                    ban_id: item.ban_id,
                    ban_name: item.ban_name,
                    birthday: item.birthday,
                    teacher_id: item.teacher_id,
                    category_id: item.category_id,
                    nick_name: item.student_engname,
                    origin: item.origin,
                    register_date: item.register_date,
                    smobileno: item.smobileno,
                    student_engname: item.student_engname,
                    student_id: item.student_id,
                    student_name: item.student_name
                });
          
                return acc;
            },
            { temp_banData: [], temp_studentsData: [], banMap: new Map(), studentMap:new Map() }
        );
        $('#o_ban_id2').html(temp_o_ban_id)
        banData = temp_banData
        studentsData = temp_studentsData  
        get_total_data();
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
