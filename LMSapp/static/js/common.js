// manage변수 
let switchstudentData, outstudentData, banData, totalOutnum, studentsData, reportsData, consultingData, consultingHistoryData, consultingcateData, taskData, taskcateData, questionData, answerData, attachData, CSdata;
let consultingCount, questionCount, taskCount;
let tempConsultingData,temptaskData;
let AlarmList = []
const studentMap = new Map();
const banMap = new Map();
const TstudentMap = new Map();
const TbanMap = new Map();
const attachMap = new Map();
const consultingStudentMap = new Map();

// teacher 변수
let  Tconsulting_category, Tban_data, Tall_consulting, taskConsultingsData, unlearnedConsultingsData, unlearnedConsultingsCount, Tmy_students, Tall_task, Ttask_consulting, Tunlearned_student, Tall_students, Tstudent_consulting, TquestionAnswerdata, TquestionAttachdata;
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
        $('#ban_report_loading').show()
        $('#ban_report_notloading').hide()
        const banstudentsWorker = new Worker("../static/js/bans_worker.js");
        const teacherdataWorker = new Worker("../static/js/students_worker.js")
        let temp_ban_option = '<option value="none" selected>반을 선택해주세요</option>';
        banstudentsWorker.postMessage('get_banstudentsData');
        teacherdataWorker.postMessage('get_teacherdata')
        banstudentsWorker.onmessage = function (event) {
            $('#ban_chart_list').empty()
            let all_data = event.data.all_data
            let total_first_student_num = all_data.length;
            let total_out_student = total_first_student_num != 0 ? all_data.filter(s=>s.category_id != 1) : []
            let every_out_student_num = total_out_student.length
            let total_out_student_num = 0
            let total_hold_student_num = 0
            if(every_out_student_num != 0){
                total_out_student_num = total_out_student.filter(s=>s.category_id != 3).length;
                total_hold_student_num = total_out_student.filter(s=>s.category_id == 3).length;
            }
            let total_now_student_num = total_first_student_num - every_out_student_num
            if(total_now_student_num <= 0){
                alert('담당중인 반이 없습니다')
                return
            }
            Tmy_students = []
            let temp_ban_list = ''
            var { temp_banData, temp_studentsData } = all_data.reduce(
                (acc, item) => {
                    if (!TbanMap.has(item.ban_id)) {
                        let semester = make_semester(item.semester)
                        // 반 차트를 그리기 위한 변수 선언 
                        let first_student = all_data.filter(s=>s.ban_id == item.ban_id)
                        let first_student_num = first_student.length
                        let out_student_num = first_student_num != 0 ? first_student.filter(s=>s.category_id == 2 || s.category_id == 8).length : 0 
                        let hold_student_num = first_student_num != 0 ? first_student.filter(s=>s.category_id == 3).length : 0 
                        let now_student_num = first_student_num - out_student_num - hold_student_num

                        temp_ban_list += `
                            <tr class="row">
                                <th class="col-4">${item.ban_name}반 ( ${semester}학기 )</th>
                                <td class="col-2">${now_student_num}</td>
                                <td class="col-2">${hold_student_num}</td>
                                <td class="col-2">${out_student_num}</td>
                                <td class="col-2" data-bs-toggle="modal" data-bs-target="#ban_student_list" onclick="get_student(${item.ban_id})">✔️</td>
                            </tr>
                        `

                        TbanMap.set(item.ban_id, {
                            ban_name: item.ban_name,
                            ban_startdate:item.startdate
                        });
                
                        acc.temp_banData.push({
                        ban_id: item.ban_id,
                        name: item.ban_name,
                        semester:semester,
                        startdate:item.startdate,
                        teacher_id: item.teacher_id
                        });
                        temp_ban_option += `<option value=${item.ban_id}>${item.name} (${item.semester}월 학기)</option>`;

                    }
              
                    TstudentMap.set(item.student_id,{
                        origin:item.origin,
                        ban_id:item.ban_id,
                        ban_name:item.ban_name,
                        birthday: item.birthday,
                        mobileno: item.mobileno,
                        student_name: item.name + ' (' + item.nick_name + ')',
                        category_id : item.category_id
                    })
                    acc.temp_studentsData.push({
                        student_id: item.student_id,
                        teacher_id: item.teacher_id,
                        ban_id: item.ban_id,
                        ban_name: item.ban_name,
                        birthday: item.birthday,
                        category_id: item.category_id,
                        eng_name: item.nick_name,
                        name: item.name,
                        origin: item.origin,
                        birthday: item.birthday,
                        mobileno: item.mobileno
                    });

                    if(item.category_id == 1){
                        Tmy_students.push({
                            student_id: item.student_id,
                            teacher_id: item.teacher_id,
                            ban_id: item.ban_id,
                            ban_name: item.ban_name,
                            birthday: item.birthday,
                            category_id: item.category_id,
                            eng_name: item.nick_name,
                            name: item.name,
                            origin: item.origin,
                            birthday: item.birthday,
                            mobileno: item.mobileno
                        })
                    }
                    return acc;
                },
                { temp_banData: [], temp_studentsData: [], TbanMap: new Map(), TstudentMap:new Map() }
            );
            Tban_data = temp_banData
            Tall_students = temp_studentsData
            $('#my_ban_list').html(temp_ban_option)
            let temp_ban_chart = `
            <div class="d-flex justify-content-start align-items-start flex-column w-100 my-2">
                <h5 class="mb-3"> 📌 초기 배정 원생 수:  ${total_first_student_num}</h5>
                <div class="row w-100">
                    <div class="chart-wrapper col-sm-5"style="margin-left:30%">
                        <canvas id="total-chart-element" class="total-chart-element p-sm-3 p-2"></canvas>
                        <div class ="chart-data-summary">
                            <span>관리중:${total_now_student_num}</span><br>
                            <span>* 보류:${total_hold_student_num}</span><br>
                            <span>* 퇴소:${total_out_student_num}</span>
                        </div>
                    </div>
                </div>
                <div class="col-sm-12 d-flex justify-content-center align-items-center">
                    <table class="table text-center" id="class_list">
                        <tbody style="width:100%;">
                            <tr class="row">
                                <th class="col-4">반</th>
                                <th class="col-2">관리중</th>
                                <th class="col-2">보류</th>
                                <th class="col-2">퇴소</th>
                                <th class="col-2">원생 목록</th>  
                            </tr>    
                            ${temp_ban_list}
                        </tbody>
                    </table>
                </div>
            </div>
            `;
            $('#ban_chart_list').html(temp_ban_chart);
            return home_chart(total_now_student_num, total_hold_student_num, total_out_student_num).then(()=>{
                teacherdataWorker.onmessage = function (event) {
                    Tall_consulting = event.data.all_consulting
                    Tconsulting_category = event.data.all_consulting_category
                    Tall_task =  event.data.all_task
                    let todayConsultingsData = Tall_consulting.length > 0 ? Tall_consulting.filter(consulting => (consulting.done == 1 && new Date(consulting.created_at).setHours(0, 0, 0, 0) === today) || (consulting.done == 0) ) : []; 
                    var { temp_taskConsultingsData, temp_unlearnedConsultingsData } = todayConsultingsData.reduce(
                        (acc, item) => {
                            const student = TstudentMap.get(item.student_id)
                            if(item.week_code < 0){
                                acc.temp_taskConsultingsData.push({
                                    ban_id:item.ban_id,
                                    ban_name:student.ban_name,
                                    contents: item.contents,
                                    category_id: item.category_id,
                                    category: item.category,
                                    startdate:item.startdate,
                                    deadline:item.deadline,
                                    done:item.done,
                                    created_at:item.created_at,
                                    missed:item.missed,
                                    reason:item.reason,
                                    result:item.result,
                                    solution:item.solution,
                                    week_code:item.week_code,
                                    student_id:item.student_id,
                                    student_name:student.student_name,
                                    student_birthday:student.birthday,
                                    student_mobileno:student.mobileno,
                                    student_category:student.category_id,
                                    origin:item.origin,
                                    id:item.id
                                });
                            }else{
                                acc.temp_unlearnedConsultingsData.push({
                                    ban_id:item.ban_id,
                                    ban_name:student.ban_name,
                                    contents: item.contents,
                                    category_id: item.category_id,
                                    category: item.category,
                                    startdate:item.startdate,
                                    deadline:item.deadline,
                                    done:item.done,
                                    created_at:item.created_at,
                                    missed:item.missed,
                                    reason:item.reason,
                                    result:item.result,
                                    solution:item.solution,
                                    week_code:item.week_code,
                                    student_id:item.student_id,
                                    student_name:student.student_name,
                                    student_birthday:student.birthday,
                                    student_mobileno:student.mobileno,
                                    student_category:student.category_id,
                                    origin:item.origin,
                                    id:item.id
                                })
                            }
                            let str_studentid = String(item.student_id)
                            if(consultingStudentMap.has(str_studentid)) {
                                const existingconsulting = consultingStudentMap.get(str_studentid);
                                existingconsulting.push({
                                    ban_id:item.ban_id,
                                    ban_name:student.ban_name,
                                    contents: item.contents,
                                    category_id: item.category_id,
                                    category: item.category,
                                    startdate:item.startdate,
                                    deadline:item.deadline,
                                    done:item.done,
                                    created_at:item.created_at,
                                    missed:item.missed,
                                    reason:item.reason,
                                    result:item.result,
                                    solution:item.solution,
                                    week_code:item.week_code,
                                    student_id:item.student_id,
                                    student_name:student.student_name,
                                    student_birthday:student.birthday,
                                    student_mobileno:student.mobileno,
                                    student_category:student.category_id,
                                    origin:item.origin,
                                    id:item.id
                                });
                            }else {
                                consultingStudentMap.set(str_studentid,[{
                                    ban_id:item.ban_id,
                                    ban_name:student.ban_name,
                                    contents: item.contents,
                                    category_id: item.category_id,
                                    category: item.category,
                                    startdate:item.startdate,
                                    deadline:item.deadline,
                                    done:item.done,
                                    created_at:item.created_at,
                                    missed:item.missed,
                                    reason:item.reason,
                                    result:item.result,
                                    solution:item.solution,
                                    week_code:item.week_code,
                                    student_id:item.student_id,
                                    student_name:student.student_name,
                                    student_birthday:student.birthday,
                                    student_mobileno:student.mobileno,
                                    student_category:student.category_id,
                                    origin:item.origin,
                                    id:item.id
                                }]);
                            }
        
                            return acc;
                        },
                        { temp_taskConsultingsData: [], temp_unlearnedConsultingsData: [], consultingStudentMap: new Map() }
                    );
                    taskConsultingsData = temp_taskConsultingsData
                    unlearnedConsultingsData = temp_unlearnedConsultingsData
                    unlearnedConsultingsCount = unlearnedConsultingsData.length
                    if(unlearnedConsultingsCount != 0){
                        Tunlearned_student = Tmy_students.reduce((acc, student) => {
                        const consultingList = unlearnedConsultingsData.filter(c => c.student_id === student.student_id);
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
                                    'student_name': student.name + '(' + student.eng_name + ')',
                                    'student_mobileno': student.mobileno,
                                    'student_birthday': student.birthday,
                                    'ban_id': student.ban_id,
                                    'ban_name': student.ban_name,
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
                                    'student_name': student.name + '(' + student.eng_name + ')',
                                    'student_mobileno': student.mobileno,
                                    'student_birthday': student.birthday,
                                    'ban_id': student.ban_id,
                                    'ban_name': student.ban_name,
                                    'consulting_done':1,
                                    'todoconsulting_num':todoconsulting_num,
                                    'deadline': make_date('3000-01-01'),
                                    'missed': missed_date('1111-01-01')
                                });
                            }
                        }
                            return acc;
                        }, []);
                    }
                    home_task()
                };
            })
        };
        
    
        
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
