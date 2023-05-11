// 전역변수로 api에서 불러온 정보를 저장 
let switchstudentData, outstudentData, banData, totalOutnum, totalHoldnum, studentsData, reportsData, consultingData, consultingHistoryData, consultingcateData, taskData, taskcateData, questionData, answerData, attachData;
const today = new Date().setHours(0, 0, 0, 0);
const todayyoil = new Date().getDay()

function openPopup(url) {
    var popup = window.open('', 'popup', 'width=800,height=600');
    popup.document.write('<html><body><iframe src="' + url + '" width="100%" height="100%" frameborder="0"></iframe></body></html>');
}
let make_reject_code = function (rc) {
    if (rc == 0) {
        return '❌ 미완료';
    } else {
        return '⭕ 완료';
    }
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
let make_date = function (d) {
    if (d == null) {
        return '➖'
    }
    const date = new Date(d)
    return date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0')
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
    if (priority == 1) return '';
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
    if (category == 0 || category == '0') {
        c = '일반문의'
    } else if (category == 1 || category == '1') {
        c = '퇴소문의'
    } else if (category == 2 || category == '2') {
        c = '이반문의'
    } else if (category == 4 || category == '4') {
        c = '기술 지원 문의'
    } else {
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
async function get_all_ban() {
    try {
        const response = await $.ajax({
            type: "GET",
            url: "/common/all_ban",
            dataType: 'json',
            data: {},
        });
        totalOutnum = 0;
        totalHoldnum = 0
        // switchstudentData = response['switchstudent']
        banData = response['all_ban']
        banData.forEach((elem) => {
            elem.out_student_num = Number(elem.out_student_num)
            elem.hold_student_num = Number(elem.hold_student_num)
            elem.first_student_num = elem.student_num + elem.out_student_num + elem.hold_student_num
            elem.total_out_num = elem.out_student_num + elem.hold_student_num
            elem.out_num_per = answer_rate(elem.total_out_num, elem.first_student_num).toFixed(0)
            totalOutnum += elem.out_student_num
            totalHoldnum += elem.hold_student_num
            // elem.switch_minus_num = switchstudentData.filter(a => a.ban_id == elem.ban_id).length
            // elem.switch_plus_num = switchstudentData.filter(a => a.switch_ban_id == elem.ban_id).length
        });
        banData = response['all_ban'].map((item) => {
            return { ...item, total_out_num_per: Number(answer_rate(item.out_student_num, totalOutnum).toFixed(2)) }
        })
    } catch (error) {
        alert('Error occurred while retrieving data.');
    }
}
async function get_all_students() {
    try{
        const response = await $.ajax({
            url: '/common/all_students',
            type: 'GET',
            data: {},
        });
        studentsData = response['students']
    } catch (error) {
        alert('Error occurred while retrieving data.');
    }
}
async function getStudentsData() {
    let studentsWorker = new Worker("../static/js/students_worker.js");
  
    return new Promise((resolve) => {
        studentsWorker.onmessage = function(event) {
            studentsData = event.data.students;
            resolve(studentsData);
        };
    });
}
function mergeData(banData, studentData) {
    const mergedData = studentData.flatMap(studentItem => {
      const banId = studentItem.ban_id;
      const matchingBans = banData.filter(banItem => banItem.name === studentItem.ban_name);
  
      return matchingBans.map(banItem => ({
        ban_id: banId,
        teacher_name: banItem.teacher_name,
        teacher_engname: banItem.teacher_engname,
        ban_name: banItem.name,
        origin: studentItem.origin,
        student_engname: studentItem.student_engname,
        student_id: studentItem.student_id,
        student_name: studentItem.student_name,
        teacher_id: banItem.teacher_id
      }));
    });
  
    return mergedData;
  }

  
function chunkArray(array, chunkSize) {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      result.push(array.slice(i, i + chunkSize));
    }
    return result;
}

// teacher_id 기준으로 쪼개서 가져오기 
async function getChunkedStudentsData(teacherID) {
    let studentsWorker = new Worker("../static/js/students_worker.js");
    return new Promise((resolve) => {
        studentsWorker.onmessage = function(event) {
            studentsData = event.data.students;
            const filteredData = studentsData.filter((student) => student.teacher_id === teacherID);
            resolve(filteredData);
        };
    });
}
async function getChunkedTasksData(teacherID) {
    let taskWorker = new Worker("../static/js/tasks_worker.js");
    return new Promise((resolve) => {
        taskWorker.onmessage = function(event) {
            taskData = event.data.task;
            const filteredData = taskData.filter((task) => task.teacher_id === teacherID);
            resolve(filteredData);
        };
    });
} 
async function getChunkedConsultingsData(teacherID) {
    let consultingWorker = new Worker("../static/js/consultings_worker.js");  
    return new Promise((resolve) => {
        consultingWorker.onmessage = function(event) {
            consultingData = event.data.consulting;
            const filteredData = consultingData.filter((consulting) => consulting.teacher_id === teacherID);
            resolve(filteredData);
        };
    });
}  
async function get_student_reports() {
    try {
        const response = await $.ajax({
            url: '/common/get_student_reports',
            type: 'GET',
            data: {},
        });
        reportsData = response['reports']
    } catch (error) {
        alert('Error occurred while retrieving data.');
    }
}
// 전체 반 정보(차트) 가져오는 함수 
async function get_total_data() {
    getStudentsData()
    $('#semester').hide();
    $('#detailban').show();
    $('#qubox').hide()
    $('#inTqubox').hide()
    $('#Tqubox').hide()
    $('#sobox').hide()
    $('#ulbox').hide()
    $('#target_ban_info_body').hide()
    try {
        if(!banData){
            $('#inloading').show()
            $('#semester_pagination').hide()
            await get_all_ban().then(() => {
                total_student_num = Number(banData[0].total_student_num)
                // switchstudent_num = switchstudentData.length
                // 학기 별 원생
                onesemester = total_student_num != 0 ? banData.filter(e => e.semester == 1) : 0
                fivesemester = total_student_num != 0 ? banData.filter(e => e.semester == 2) : 0
                ninesemester = total_student_num != 0 ? banData.filter(e => e.semester == 0) : 0

                // 학기별 원생수 및 퇴소 원생 수 
                onesemester_total = onesemester[0].semester_student_num
                oneoutnum = onesemester.reduce((acc, item) => acc + item.out_student_num, 0);
                fivesemester_total = fivesemester[0].semester_student_num
                fiveoutnum = fivesemester.reduce((acc, item) => acc + item.out_student_num, 0);

                ninesemester_total = ninesemester[0].semester_student_num
                nineoutnum = ninesemester.reduce((acc, item) => acc + item.out_student_num, 0);

                let semester_student_table = `
                    <table>
                        <tr>
                            <th class="need"></th>
                            <th>초기 등록 원생 수</th>
                            <th>현재 원생 수</th>
                            <th>퇴소 원생 수 (퇴소율)</th>
                            <th>학기 별 반 리스트</th>
                        </tr>
                        <tr>
                            <th class="need">전체</th>
                            <td>${total_student_num}명</td>
                            <td>${total_student_num - totalOutnum}명</td>
                            <td>${totalOutnum}명(${answer_rate(totalOutnum, total_student_num).toFixed(2)}%)</td>
                            <td><span class='cursor-pointer fs-4' onclick="semesterShow(${3}">📜</span></td>
                        </tr>
                        <tr>
                            <th class="need">1월 학기</th>
                            <td>${onesemester_total}명</td>
                            <td>${onesemester_total - oneoutnum}명</td>
                            <td>${oneoutnum}명(${answer_rate(oneoutnum, onesemester_total).toFixed(2)}%)</td>
                            <td><span class='cursor-pointer fs-4' onclick="semesterShow(${1})">📜</span></td>
                        </tr>
                        <tr>
                            <th class="need">5월 학기</th>
                            <td>${fivesemester_total}명</td>
                            <td>${fivesemester_total - fiveoutnum}명</td>
                            <td>${fiveoutnum}명(${answer_rate(fiveoutnum, fivesemester_total).toFixed(2)}%)</td>
                            <td><span class='cursor-pointer fs-4' onclick="semesterShow(${2})">📜</span></td>
                        </tr>
                        <tr>
                            <th>9월 학기</th>
                            <td>${ninesemester_total}명</td>
                            <td>${ninesemester_total - nineoutnum}명</td>
                            <td>${nineoutnum}명(${answer_rate(nineoutnum, ninesemester_total).toFixed(2)}%)</td>
                            <td><span class='cursor-pointer fs-4' onclick="semesterShow(${0})">📜</span></td>
                        </tr>
                    </table>
                `;
                $('#semester-student-table').html(semester_student_table);

                var chart = Chart.getChart('semester-student-chart')
                if (chart) {
                    chart.destroy()
                }
                // PURPLE 섹션 차트 그리기
                let ctx = document.getElementById('semester-student-chart').getContext('2d');
                let semesterStudentChart = new Chart(ctx, {
                    type: 'scatter',
                    data: {
                        labels: ['퍼플 총 원생', '1월 학기', '5월 학기', '9월 학기'],
                        datasets: [{
                            type: 'bar',
                            label: '원생 수',
                            data: [total_student_num - totalOutnum, onesemester_total - oneoutnum, fivesemester_total - fiveoutnum, ninesemester_total - nineoutnum],
                            backgroundColor: ['#F66F5B77', '#FFBCE277', '#FE85AB77', '#C24F7777'],
                            borderColor: ['#F66F5B', '#FFBCE2', '#FE85AB', '#C24F77'],
                            borderWidth: 2
                        }, {
                            type: 'line',
                            label: '퇴소 원생 수',
                            data: [totalOutnum, oneoutnum, fiveoutnum, nineoutnum],
                            fill: false,
                            borderColor: '#F23966cc',
                            borderWidth: 2
                        }]
                    },
                    options: {
                        maxBarThickness: 60,
                        interaction: {
                            mode: 'index',
                        },
                        plugins: {
                            tooltip: {
                                padding: 10,
                                bodySpacing: 5,
                                bodyFont: {
                                    font: {
                                        family: "pretendard",
                                    }
                                },
                                usePointStyle: true,
                                filter: (item) => item.parsed.y !== null,
                                callbacks: {
                                    label: (context) => {
                                        return ' ' + context.parsed.y + '명';
                                    },
                                },
                            },
                        },
                        scales: {
                            y: {
                                afterDataLimits: (scale) => {
                                    scale.max = scale.max * 1.2;
                                },
                                axis: 'y',
                                display: true,
                                position: 'top',
                                title: {
                                    display: true,
                                    align: 'end',
                                    color: '#2b2b2b',
                                    font: {
                                        size: 10,
                                        family: "pretendard",
                                        weight: 500,
                                    },
                                    text: '단위 : 명'
                                }
                            }
                        }
                    }
                });
                semesterShow(3);
                $('#inloading').hide();
                $('#semester_pagination').show();
                $('#target_ban_info_body').show();
            })
        }
    } catch (error) {
        alert('Error occurred while retrieving data.');
    }
}
function semesterShow(semester) {
    $('#ban_search_input').off('keyup');
    $('#semester').show();
    if (semester == 0) {
        $('#semester_s').html('9월 학기');
        resultData = ninesemester;
    } else if (semester == 1) {
        $('#semester_s').html('1월 학기');
        resultData = onesemester;
    } else if (semester == 2) {
        $('#semester_s').html('5월 학기');
        resultData = fivesemester;
    } else {
        $('#semester_s').html('전체 반')
        resultData = banData;
    }
    ResultpaginationOptions = {
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        pageClassName: 'float-end',
        callback: function (data, pagination) {
            var temp_semester_banlist = '';
            $.each(data, function (index, item) {
                let teacher_name = item.teacher_engname + '( ' + item.teacher_name + ' )'
                temp_semester_banlist += `
                <td class="col-2">${item.name}</td>
                <td class="col-2">${teacher_name}</td>
                <td class="col-1">${item.first_student_num}</td>
                <td class="col-1">${item.student_num}</td>
                <td class="col-1">${item.out_student_num}(<strong>${item.out_num_per}%</strong>)</td>
                <td class="col-1">${item.hold_student_num}</td>
                <td class="col-2"> 총: ${item.total_out_num}명 ( 퇴소 : ${item.out_student_num} / 보류 : ${item.hold_student_num} )</td>
                <td class="col-1"><strong>${item.total_out_num_per}%</strong></td>
                <td class="col-1" data-bs-toggle="modal" data-bs-target="#teacherinfo" onclick="getTeacherInfo(${item.teacher_id})"><span class="cursor-pointer">👉</span></td>;`;
            });
            $('#semester_banlist').html(temp_semester_banlist)
        }
    };

    SemesterContainer = $('#semester_pagination')
    SemesterContainer.pagination(Object.assign(ResultpaginationOptions, { 'dataSource': resultData }))

    $('#ban_search_input').on('keyup', function () {
        var searchInput = $(this).val().toLowerCase();
        var filteredData = resultData.filter(function (data) {
            return (data.hasOwnProperty('name') && data.name.toLowerCase().indexOf(searchInput) !== -1) || (data.hasOwnProperty('teacher_name') && data.teacher_name.toLowerCase().indexOf(searchInput) !== -1) || (data.hasOwnProperty('teacher_engname') && data.teacher_engname.toLowerCase().indexOf(searchInput) !== -1);
        });
        SemesterContainer.pagination('destroy');
        SemesterContainer.pagination(Object.assign(ResultpaginationOptions, { 'dataSource': filteredData }));
    });
}
function sort_data(sort_op) {
    switch (sort_op) {
        case "ban_sort":
            $('#ban_sort').html('<strong>반 ( 이름순 정렬👇 )</strong>')
            $('#teacher_sort').html('선생님 ( 이름 순 정렬👉 )')
            $('#unlearned_sort').html('배정 원생 수 ( 많은 순 정렬👉 )')
            $('#tout_sort').html('반 퇴소율 ( 반 퇴소율 높은 순 정렬👉 )')
            $('#out_sort').html('퇴소율 ( 높은 순 정렬👉 )')
            resultData.sort(function (a, b) {
                var nameA = a.name.toUpperCase(); // 대소문자 구분 없이 비교하기 위해 대문자로 변환
                var nameB = b.name.toUpperCase(); // 대소문자 구분 없이 비교하기 위해 대문자로 변환
                if (nameA < nameB) {
                    return -1;
                }
                if (nameA > nameB) {
                    return 1;
                }
                return 0;
            });
            break;

        case "teacher_sort":
            $('#ban_sort').html('반 ( 이름순 정렬👉 )')
            $('#teacher_sort').html('<strong>선생님 ( 이름 순 정렬👇 )</strong>')
            $('#unlearned_sort').html('배정 원생 수 ( 많은 순 정렬👉 )')
            $('#tout_sort').html('반 퇴소율 ( 반 퇴소율 높은 순 정렬👉 )')
            $('#out_sort').html('퇴소율 ( 높은 순 정렬👉 )')
            resultData.sort(function (a, b) {
                var nameA = a.teacher_name.toUpperCase(); // 대소문자 구분 없이 비교하기 위해 대문자로 변환
                var nameB = b.teacher_name.toUpperCase(); // 대소문자 구분 없이 비교하기 위해 대문자로 변환
                if (nameA < nameB) {
                    return -1;
                }
                if (nameA > nameB) {
                    return 1;
                }
                return 0;
            });
            break;

        case "unlearned_sort":
            $('#ban_sort').html('반 ( 이름순 정렬👉 )')
            $('#teacher_sort').html('선생님 ( 이름 순 정렬👉 )')
            $('#unlearned_sort').html('<strong>관리 원생 수 ( 많은 순 정렬👇 )</strong>')
            $('#tout_sort').html('반 퇴소율 ( 반 퇴소율 높은 순 정렬👉 )')
            $('#out_sort').html('퇴소율 ( 높은 순 정렬👉 )')
            resultData.sort(function (a, b) {
                return b.student_num - a.student_num;
            });
            break;
        case "tout_sort":
            $('#ban_sort').html('반 ( 이름순 정렬👉 )')
            $('#teacher_sort').html('선생님 ( 이름 순 정렬👉 )')
            $('#unlearned_sort').html('배정 원생 수 ( 많은 순 정렬👉 )')
            $('#tout_sort').html('<strong>반 퇴소율 ( 반 퇴소율 높은 순 정렬👇 )</strong>')
            $('#out_sort').html('전체 퇴소율 ( 높은 순 정렬👉 )')
            resultData.sort(function (a, b) {
                return b.out_num_per - a.out_num_per;
            });
            break;
        case "out_sort":
            $('#ban_sort').html('반 ( 이름순 정렬👉 )')
            $('#teacher_sort').html('선생님 ( 이름 순 정렬👉 )')
            $('#unlearned_sort').html('배정 원생 수 ( 많은 순 정렬👉 )')
            $('#tout_sort').html('반 퇴소율 ( 반 퇴소율 높은 순 정렬👉 )')
            $('#out_sort').html('<strong>전체 퇴소율 ( 높은 순 정렬👇 )</strong>')
            resultData.sort(function (a, b) {
                return b.total_out_num_per - a.total_out_num_per;
            });
            break;
    }

    // 데이터 정렬 후 페이지네이션 다시 설정
    SemesterContainer.pagination("destroy");
    SemesterContainer.pagination(
        Object.assign(ResultpaginationOptions, { dataSource: resultData })
    );
}
async function getTeacherInfo(t_id) {
    let info = banData.filter(t => t.teacher_id == t_id)
    if (info.length == 0) {
        let no_data_title = `<h1> ${response.text} </h1>`
        $('#teacherModalLabel').html(no_data_title);
        return
    } else {
        $('.mo_inloading').show()
        $('.monot_inloading').hide()
        $('#teachertitle').html(`${info[0].teacher_engname} TEACHER REPORT`)
        let temp_profile_data = `
                <tbody  style="width:100%;">
                    <tr class="row tagtagtitle">
                        <th class="col-12">담임 선생님 정보</th>
                    </tr>
                    <tr class="row tagtagtitle">
                        <td class="col-4">${info[0].teacher_name}(${info[0].teacher_engname})</th>
                        <td class="col-4"> 📞 ${info[0].teacher_mobileno} </th>
                        <td class="col-4"> ✉️ ${info[0].teacher_email}</th>
                    </tr>
                </tbody>
            `;
        $('#profile_data').html(temp_profile_data);
        try {
            const chunkedConsultingData = consultingData
            if (!consultingData){
                chunkedConsultingData = await getChunkedConsultingsData(t_id);
            }
            const TconsultingData = chunkedConsultingData.filter(c => c.teacher_id == t_id && new Date(c.startdate).setHours(0, 0, 0, 0) <= today &&  c.category_id != 110 && c.category_id != 111)
            let TunlearnedData = TconsultingData.filter(c => c.category_id < 100)
            let unlearned_ttc = null
            unlearned_ttc = TunlearnedData.length
    
            let temp_baninfo = `<tr class="row">
            <th class="col-2">반이름</th>
            <th class="col-1">학기</th>
            <th class="col-1">원생 수</th>
            <th class="col-2">퇴소</th>
            <th class="col-2">퇴소율</th>
            <th class="col-2">보류</th>
            <th class="col-2">미학습</th>
            </tr>`;
            let total_student_num = 0
            // let now_student_num = 0
            let os = 0
            let hs = 0
            info.forEach(ban_data => {
                total_student_num += ban_data.student_num
                os += ban_data.out_student_num
                hs += ban_data.hold_student_num
                unlearned = TunlearnedData.filter(c => c.ban_id == ban_data.ban_id).length
                temp_baninfo += `
                <tr class="row">
                    <td class="col-2">${ban_data.name}</td>
                    <td class="col-1">${make_semester(ban_data.semester)}학기</td>
                    <td class="col-1">${ban_data.student_num}명</td>
                    <td class="col-2">${ban_data.out_student_num}건</td>
                    <td class="col-2">( ${ban_data.out_num_per}% )</td>
                    <td class="col-2">${ban_data.hold_student_num}</td>
                    <td class="col-2">${unlearned}건</td>
                </tr>
                `;
            });
            $('#mybaninfo').html(temp_baninfo);
    
            let temp_teacher_info_student_num = `
                <span>  관리중:${total_student_num}</span><br>
                <span>* 보류:${hs}</span><br>
                <span>* 퇴소:${os}</span>
            `
            $('#teacher_info_student_num').html(temp_teacher_info_student_num)
            var config = {
                type: 'doughnut',
                data: {
                    labels: ['관리중', '보류', '퇴소'],
                    datasets: [
                        {
                            data: [total_student_num, hs, os],
                            backgroundColor: ['#B39CD0', '#ffd400', '#F23966', '#C24F77'],
                            hoverOffset: 4,
                        },
                    ],
                },
                options: {
                    maintainAspectRatio: false,
                    aspectRatio: 1,
                    plugins: {
                        legend: {
                            display: false,
                        },
                    },
                    responsive: true,
                    width: 500,
                    height: 500,
                },
            }
            if (Chart.getChart('total-chart-element')) {
                Chart.getChart('total-chart-element').destroy()
            }
            let ctx = document.getElementById('total-chart-element').getContext('2d');
            let TeacherChart = new Chart(ctx, config).update()

            let everyunlearned = unlearned_ttc==0 ? 0 : TunlearnedData[0].total_unlearned_consulting;
            
            // 미학습 발생
            $('#ucomcom').html(`<td class="col-6">총 ${unlearned_ttc}건 </td><td class="col-6"><strong> ${answer_rate(unlearned_ttc,everyunlearned).toFixed(2)}% </strong></td>`);
            
            let temp_html = `<th class="col-12">`
            if(unlearned_ttc == 0){
                temp_html += `미학습 발생이 없었습니다 🎉</th>`
            }else{
                temp_html += `총 미학습  ${unlearned_ttc}건 <strong> 발생율: ${answer_rate(unlearned_ttc,everyunlearned).toFixed(2)}%</th>`
                let unlearned_cate = [...new Set(TunlearnedData.map(item => item.category))];
                unlearned_cate.forEach((category) => {
                    let num = TunlearnedData.filter(u => u.category == category).length
                    temp_html += `<td class="col-12">${category} : ${num}건 ( 선생님 미학습 발생 중 ${answer_rate(num, unlearned_ttc).toFixed(0)}%) </td>`
                })
            }
            $('#totalreport-row').html(temp_html)
            
            let tconsulting_num = null 
            tconsulting_num = TconsultingData.length
            if(tconsulting_num == 0){
                $('#consulting_chart').html(`<td class="col-4">진행할 상담이 없었습니다</td><td class="col-4">➖</td><td class="col-4" style="color:red">➖</td>`)
            }else{
                let ttd = null
                ttd = tconsulting_num != 0 ? TconsultaskData.filter(c => c.done == 1).length : 0
                $('#consulting_chart').html(`<td class="col-4">${ttd} / ${tconsulting_num}건</td><td class="col-4">${answer_rate(ttd, tconsulting_num).toFixed(0)}%</td><td class="col-4" style="color:red">${make_nodata(TconsultingData.filter(c => c.done == 0 && new Date(c.deadline).setHours(0, 0, 0, 0) < today).length)}</td>`)
            }

            // 업무 데이터
            const chunkedTaskData = taskData
            if(!taskData){
                chunkedTaskData = await getChunkedTasksData(t_id);
            }
            // const TTaskData = chunkedTaskData
            
            let TtasktodayData = null
            TtasktodayData = chunkedTaskData.filter(t => (new Date(t.startdate).setHours(0, 0, 0, 0) <= today && today < new Date(t.deadline).setHours(0, 0, 0, 0)) && ((t.cycle == 0 && t.created_at == null) || (t.cycle == 0 && new Date(t.created_at).setHours(0, 0, 0, 0) == today) || (t.cycle == todayyoil)))
            let today_done = null
            today_done = TtasktodayData.filter(t => t.done == 1).length
            let Ttaskhisory = null
            Ttaskhisory = chunkedTaskData.filter(t => new Date(t.deadline).setHours(0, 0, 0, 0) < today)
            let history_done = null
            history_done = Ttaskhisory.filter(t => t.done == 1).length
            $('#task_chart').html(`<td class="col-4">${today_done}/${TtasktodayData.length}건</td><td class="col-4">${answer_rate(today_done, TtasktodayData.length).toFixed(0)}%</td><td class="col-4">${answer_rate(history_done, Ttaskhisory.length).toFixed(0)}%</td>`);
    
    
            // student data 
            const chunkedStudentData = studentsData
            if(!studentsData){
                chunkedStudentData = await getChunkedStudentsData(t_id);
            }
            // const Tstudent = chunkedStudentData

            $('#displayCount').html(`관리 중인 원생 수: ${chunkedStudentData.length}명`)
            chunkedStudentData.forEach((elem) => {
                elem.unlearned = TunlearnedData.filter(a => a.student_id == elem.student_id).length
                elem.up = answer_rate(elem.unlearned, TunlearnedData.length).toFixed(0)
            });
            var paginationOptions = {
                prevText: '이전',
                nextText: '다음',
                pageSize: 10,
                pageClassName: 'float-end',
                callback: function (data, pagination) {
                    let chartHtml = "";
                    $.each(data, function (index, item) {
                        chartHtml += `
                        <td class="col-3">${item.student_name}( ${item.student_engname} )</td>
                        <td class="col-2">${item.origin}</td>
                        <td class="col-3">${item.pname} ( 📞${item.pmobileno} )</td>
                        <td class="col-3">${item.unlearned}건 ( ${item.up}% ) </td>
                        <td class="col-1" custom-control custom-control-inline custom-checkbox" data-bs-toggle="modal" data-bs-target="#consultinghistory" onclick="get_consulting_history(${item.student_id})">📝</td>`;
                    });
                    $("#s_data").html(chartHtml);
                }
            };
            var StudentContainer = $('#pagingul')
            StudentContainer.pagination(Object.assign(paginationOptions, { 'dataSource': Tstudent }))
        }catch (error) {
            console.log(error);
        }
        $('.mo_inloading').hide()
        $('.monot_inloading').show()
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
                history.go(0)
            },
            error: function (xhr, status, error) {
                alert(xhr.responseText);
            }
        })
        get_consulting()
    }
}


