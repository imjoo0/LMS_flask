var totalData = 0; //총 데이터 수
var dataPerPage = 6;
var pageCount = 10; //페이징에 나타낼 페이지 수
var globalCurrentPage = 1; //현재 페이지
var data_list;
var consultingData = [];
var taskData = [];
const today = new Date().setHours(0, 0, 0, 0);
let make_recobook = function(c){
    if( c == null){
        return '❌'
    } else if(c == 'NOT'){
        result = c + ' (추천도서없음)'
        return result
    }else{
        return c
    }
}
let make_reject_code = function(rc){
    if( rc == 0){
        return '❌(반려)';
    }else{
        return '⭕(승인)';
    }
}
let make_date = function(d){
    if(d==null){
        return '❌'
    }
    const date = new Date(d)
    return date.getFullYear()+'-'+(date.getMonth()+ 1).toString().padStart(2, '0')+'-'+date.getDate().toString().padStart(2, '0')
}
let missed_date = function(d){
    const date = new Date(d)
    const standard = new Date('1111-01-01')
    if(date.getTime() == standard.getTime()){
        return "없음"
    }else if(date.setHours(0, 0, 0, 0) == today){
        return "오늘"
    }else{
        return date.getFullYear()+'-'+(date.getMonth()+ 1).toString().padStart(2, '0')+'-'+date.getDate().toString().padStart(2, '0')
    }
}
let make_priority = function(priority) {
    if(priority==1) return '';
    else if(priority==2) return '오후업무';
    else if(priority==3) return '오전업무🌞';
    else return '긴급업무⚡';
}
let answer_rate =  function(answer, all) {
    if(Object.is(answer/all, NaN)) return 0;
    else return answer/all*100;
}
let make_semester=function(semester){
    if (semester == 1){
        return 1;
    }else if(semester == 2){
        return 5;
    }else if(semester == 0){
        return 9;
    }else{
        return semester
    }
}
function q_category(category) {
    if (category == 0 || category == '0' ) {
        c ='일반문의'
    }else if(category == 1 || category == '1' ) {
        c ='퇴소문의'
    }else{
        c ='이반문의'
    }
    return c
}
// 전체 반 정보(차트) 가져오는 함수 
async function get_total_data() {
    $('#semester').hide();
    $('#detailban').show();
    $('#qubox').hide()
    $('#sobox').hide()
    $('#ulbox').hide()
    $('#target_ban_info_body').hide()
    $('#inloading').show()
    $('#semester_pagination').hide()
    await $.ajax({
        type: "GET",
        url: "/common/all_ban",
        dataType: 'json',
        data: {},
        success: function (response) {
            // sodata
            outstudentData = response['outstudent']
            switchstudentData = response['switchstudent']
            console.log(response['all_ban'])
            total_student_num = response['all_ban'][0].total_student_num
            outstudent_num = outstudentData.length;
            switchstudent_num = switchstudentData.length

            first_total = total_student_num + outstudent_num

            // // 학습 데이터
            // consultingData = response['consulting']

            // // 업무 데이터 
            // taskData = response['task']

            // all_student = response['all_ban']

            // 전체 데이터 
            
            response['all_ban'].forEach((elem) => {
                elem.out_num = outstudentData.filter(a => a.ban_id == elem.ban_id).length
                elem.out_num_per = answer_rate(elem.out_num, outstudent_num).toFixed(2)
                elem.switch_minus_num = switchstudentData.filter(a => a.ban_id == elem.ban_id).length
                elem.switch_plus_num = switchstudentData.filter(a => a.switch_ban_id == elem.ban_id).length
            });
            response['all_ban'].sort((a, b) => b.out_num_per - a.out_num_per)

            // result = response['all_ban'].map(obj1 => {
            //     let out_student = outstudentData.find(obj2 => obj1.ban_id === obj2.ban_id);
            //     let switch_student = switchstudentData.find(obj2 => obj1.ban_id === obj2.ban_id);
            //     let out_created = out_student ? out_student.out_created : null;
            //     const switch_ban_id = switch_student ? switch_student.switch_ban_id : null;
            //     return { ...obj1, out_created, switch_ban_id };
            // });

            console.log(result)

            // 학기 별 원생
            onesemester = total_student_num != 0 ? result.filter(e => e.semester == 1) : 0
            fivesemester = total_student_num != 0 ? result.filter(e => e.semester == 2) : 0
            ninesemester = total_student_num != 0 ? result.filter(e => e.semester == 0) : 0

            // 학기별 원생수 및 퇴소 원생 수 
            onesemester_total = onesemester[0].semester_student_num
            oneoutstudent = onesemester != 0 ? onesemester.filter(e => e.out_created != null).length : 0
            first_onesemester = onesemester_total + oneoutstudent

            fivesemester_total = fivesemester[0].semester_student_num
            fiveoutstudent = fivesemester != 0 ? fivesemester.filter(e => e.out_created != null).length : 0
            first_fivesemester = fivesemester_total + fiveoutstudent

            ninesemester_total = ninesemester[0].semester_student_num
            nineoutstudent = ninesemester != 0 ? ninesemester.filter(e => e.out_created != null).length : 0
            first_ninesemester = ninesemester_total + nineoutstudent

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
                        <td>${first_total}명</td>
                        <td>${total_student_num}명</td>
                        <td>${outstudent_num}명(${answer_rate(outstudent_num, first_total).toFixed(1)}%)</td>
                        <td><span class='cursor-pointer fs-4' onclick="allsemesterShow()">📜</span></td>
                    </tr>
                    <tr>
                        <th class="need">1월 학기</th>
                        <td>${first_onesemester}명</td>
                        <td>${onesemester_total}명</td>
                        <td>${oneoutstudent}명(${answer_rate(oneoutstudent, first_onesemester).toFixed(1)}%)</td>
                        <td><span class='cursor-pointer fs-4' onclick="semesterShow(${1})">📜</span></td>
                    </tr>
                    <tr>
                        <th class="need">5월 학기</th>
                        <td>${first_fivesemester}명</td>
                        <td>${fivesemester_total}명</td>
                        <td>${fiveoutstudent}명(${answer_rate(fiveoutstudent, first_fivesemester).toFixed(1)}%)</td>
                        <td><span class='cursor-pointer fs-4' onclick="semesterShow(${2})">📜</span></td>
                    </tr>
                    <tr>
                        <th>9월 학기</th>
                        <td>${first_ninesemester}명</td>
                        <td>${ninesemester_total}명</td>
                        <td>${nineoutstudent}명(${answer_rate(nineoutstudent, first_ninesemester).toFixed(1)}%)</td>
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
                        data: [total_student_num, onesemester_total, fivesemester_total, ninesemester_total],
                        backgroundColor: ['#F66F5B77', '#FFBCE277', '#FE85AB77', '#C24F7777'],
                        borderColor: ['#F66F5B', '#FFBCE2', '#FE85AB', '#C24F77'],
                        borderWidth: 2
                    }, {
                        type: 'line',
                        label: '퇴소 원생 수',
                        data: [outstudent_num, oneoutstudent, fiveoutstudent, nineoutstudent],
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
            allsemesterShow();
        },
        error: function (xhr, status, error) {
            alert('xhr.responseText');
        }
    })
    $('#inloading').hide()
    $('#semester_pagination').show()
    $('#target_ban_info_body').show()

}

function allsemesterShow() {
    SemesterContainer = $('#semester_pagination')
    $('#semester').show();
    $('#semester_s').html('전체 반')
    // 반으로 묶인 데이터 ban_id / student_num / semester / teacher_id
    const banGrouped = result.reduce((acc, item) => {
        const v = item.ban_id;

        if (!acc[v]) {
            acc[v] = { teacher_id: item.teacher_id, ban_name: item.name, ban_id: item.ban_id, semester: item.semester, students: [], total_out_count: 0, total_out_per: 0, total_switch_count: 0, total_switch_per: 0 };
        }
        if (item.out_created != null) {
            acc[v].total_out_count += 1;
            acc[v].total_out_per = answer_rate(acc[v].total_out_count, outstudent_num).toFixed(1)
        } else if (item.switch_ban_id != null) {
            acc[v].total_switch_count += 1;
            acc[v].total_switch_per = answer_rate(acc[v].total_switch_count, switchstudent_num).toFixed(1)
        }

        acc[v].students.push(item);

        return acc;
    }, {});
    allData = Object.values(banGrouped).sort((a, b) => {
        if (b.total_out_per !== a.total_out_per) {
            return b.total_out_per - a.total_out_per; // total_out_per가 큰 순으로 정렬
        } else {
            return b.students.length - a.students.length; // students.length가 큰 순으로 정렬
        }
    });
    //  const v = `${item.ban_id}_${item.student_num}_${item.semester}_${item.teacher_id}`;
    SemesterContainer.pagination({
        dataSource: allData,
        prevText: '이전',
        nextText: '다음',
        pageClassName: 'float-end',
        pageSize: 10,
        callback: function (allData, pagination) {
            let temp_semester_banlist = ''
            $.each(allData, function (index, item) {
                let ban_id = item['students'][0].ban_id
                let name = item['students'][0].name
                let student_num = item['students'][0].student_num
                let teacher_name = item['students'][0].teacher_name
                let teacher_id = item['students'][0].teacher_id
                // 원생 목록 
                // let out_num = item[key].filter(s => s.out_created != null || s.switch_ban_id != null).length;
                let total_out_count = item['total_out_count'] + item['total_switch_count']
                let total_out_per = item['total_out_per']
                temp_semester_banlist += `
                <td class="col-2">${name}</td>
                <td class="col-2">${teacher_name}</td>
                <td class="col-2">${student_num + total_out_count}</td>
                <td class="col-2">${student_num}</td>
                <td class="col-2">${total_out_count}명  (${total_out_per}%)</td>
                <td class="col-1" data-bs-toggle="modal" data-bs-target="#teacherinfo" onclick="getTeacherInfo(${teacher_id})"><span class="cursor-pointer">✅</span></td>;
                <td class="col-1" data-bs-toggle="modal" data-bs-target="#target_ban_info" onclick="getBanChart(${ban_id})"><span class="cursor-pointer">✅</span></td>`;
            });
            $('#semester_banlist').html(temp_semester_banlist)
        }
    })
}

function semesterShow(semester) {
    $('#semester').show();
    data = allData.filter(e => e.semester == semester)
    $('#semester_s').html(make_semester(semester) + '월 학기');
    // key값 `${item.ban_id}_${item.student_num}_${item.semester}_${item.teacher_id}`;
    SemesterContainer.pagination({
        dataSource: data,
        prevText: '이전',
        nextText: '다음',
        pageClassName: 'float-end',
        pageSize: 10,
        callback: function (data, pagination) {
            let temp_semester_banlist = ''
            $.each(data, function (index, item) {
                let ban_id = item['students'][0].ban_id
                let name = item['students'][0].name
                let student_num = item['students'][0].student_num
                let teacher_name = item['students'][0].teacher_name
                let teacher_id = item['students'][0].teacher_id
                // 원생 목록 
                // let out_num = item[key].filter(s => s.out_created != null || s.switch_ban_id != null).length;
                let total_out_count = item['total_out_count'] + item['total_switch_count']
                let total_out_per = item['total_out_per']

                temp_semester_banlist += `
                <td class="col-2">${name}</td>
                <td class="col-2">${teacher_name}</td>
                <td class="col-2">${student_num + total_out_count}</td>
                <td class="col-2">${student_num}</td>
                <td class="col-2">${total_out_count}명  (${total_out_per}%)</td>
                <td class="col-1" data-bs-toggle="modal" data-bs-target="#teacherinfo" onclick="getTeacherInfo(${teacher_id})"><span class="cursor-pointer">✅</span></td>;
                <td class="col-1" data-bs-toggle="modal" data-bs-target="#target_ban_info" onclick="getBanChart(${ban_id})"><span class="cursor-pointer">✅</span></td>`;
            });
            $('#semester_banlist').html(temp_semester_banlist)
        }
    })
}
function getTeacherInfo(t_id){
    let info = allData.filter(t=>t.teacher_id == t_id)
    if (info.length == 0){
        let no_data_title = `<h1> ${response.text} </h1>`
        $('#teacherModalLabel').html(no_data_title);
        return
    }
    teacher_data = info[0].students[0]
    $('#teachertitle').html(teacher_data.teacher_name + '( '+ teacher_data.teacher_engname + ' )'+'선생님 현황 ( '+ teacher_data.teacher_mobileno +' | '+ teacher_data.teacher_email
    + ' )');
    $('#mybaninfo').empty();
    for(i=0;i<my_bans.length;i++){
        let name = my_bans[i]['name'];
        let semester = my_bans[i]['semester'];
        let total_student_num = my_bans[i]['total_student_num'];
        let out_s = my_bans[i]['out_s'];
        let switch_s = my_bans[i]['switch_s'];
        let unlearned = my_bans[i]['unlearned'];

        let temp_baninfo = `
            <td class="col-2">${name}</td>
            <td class="col-1">${semester}학기</td>
            <td class="col-1">${total_student_num}명</td>
            <td class="col-2"> ${out_s}건</td>
            <td class="col-2"> ${switch_s}건</td>
            <td class="col-2"> ${unlearned}건</td>
            <td class="col-2"> 임시3 (5%) </td>
        `;

    }
    let total_student_num = 0
    let total_switch_count = 0
    let total_out_count = 0
    let my_consulting = consultingData.filter(a => a.teacher_id == t_id && a.startdate <= today)
    let u_consulting_my = my_consulting.filter(a => a.category_id < 100);
    info.forEach(ban_data => {
        let ban_id = ban_data['students'][0].ban_id
        let name = ban_data['students'][0].name
        let semester = ban_data['students'][0].semester
        let student_num = ban_data['students'][0].student_num
        let switch_count = ban_data.total_switch_count
        let out_count = ban_data.total_out_count
        let unlearned = u_consulting_my.filter(a.ban_id == ban_id).length;

        total_student_num += ban_data['students'][0].student_num
        
        let temp_baninfo = `
        <td class="col-2">${name}</td>
        <td class="col-2">${semester}학기</td>
        <td class="col-2">${student_num}명</td>
        <td class="col-2"> ${out_count}건</td>
        <td class="col-2"> ${switch_count}건</td>
        <td class="col-2"> ${unlearned}건</td>
        `;
        $('#mybaninfo').append(temp_baninfo);
    });
            
    let os = teacher_data['total_out_count']
    let ss = teacher_data['total_switch_count']
    let ttp = tt+os+ss
    let temp_teacher_info_student_num = `
        <span>관리중:${ total_student_num }</span><br>
        <span>* 이반:${ ss }</span><br>
        <span>* 퇴소:${ os }</span>
    `
    $('#teacher_info_student_num').html(temp_teacher_info_student_num)
    new Chart($(('#total-chart-element')), {
        type: 'doughnut',
        data: {
            labels: ['관리중', '이반', '퇴소'],
            datasets: [
                {
                    data: [tt, ss, os],
                    backgroundColor: ['#B39CD0', '#ffd400', '#F23966'],
                    hoverOffset: 4,
                },
            ],
        },
        options: {
            plugins: {
                legend: {
                    display: false,
                },
            },
        },
    });

    $.ajax({
        type: "GET",
        url: "/admin/"+t_id,
        data: {},
        success: function (response) {
            if (response['status'] == 400){
                let no_data_title = `<h1> ${response.text} </h1>`
                $('#teacherModalLabel').html(no_data_title);
                return
            }
            let chart = response['chart_data']
            let name = response['teacher_info']['name'] + '(' + response['teacher_info']['engname'] + ')';
            let mobileno = response['teacher_info']['mobileno'];
            let email = response['teacher_info']['email']
            
            // 업무
            let total_todo = chart['total_todo']
            let total_done = chart['total_done']
            let task_p = chart['ttp']
            $('#task_chart').html(`${total_done}/${total_todo}`)
            $('#task_p').html(`${task_p}%`)

            // 상담
            let ttc = chart['ttc']
            let ttd = chart['ttd']
            let cp = chart['cp']
            $('#consulting_chart').html(`${ttd}/${ttc}`)
            $('#cp').html(`${cp}%`)

            // 미학습 상담
            let unlearned_ttc = chart['unlearned_ttc']
            let unlearned_ttd = chart['unlearned_ttd']
            let unlearned_cp = chart['unlearned_cp']
            $('#unlearned_chart').html(`${unlearned_ttc}/${unlearned_ttd}`)
            $('#unlearned_cp').html(`${unlearned_cp}%`)

                                

        },
        error:function(xhr, status, error){
                alert(xhr.responseText);
            }
    })
}
// 반 상세 정보 보내주는 함수 
function getBanChart(ban_id) {
    // key값 `${item.ban_id}_${item.student_num}_${item.semester}_${item.teacher_id}`;
    result = allData.filter(e => e.ban_id == ban_id)[0]
    $('#target_ban_info_requestModalLabel').html(result['students'][0].name + '반 상세 현황')
    if (result.length <= 0) {
        let no_data_title = `<h1> ${response.text} </h1>`
        $('#s_data').html(no_data_title);
        $('#pagingul').hide();
        return
    } else {
        // 이반 학생 
        let switch_student = result['students'].filter(s => s.switch_ban_id != null).length;
        // 퇴소 학생 
        let out_student = result['students'].filter(s => s.out_created != null).length;
        let students_num = result['students'][0]['student_num'];
        let teacher_name = result['students'][0]['teacher_name']
        let teacher_e_name = result['students'][0]['teacher_engname']
        let teacher_mobileno = result['students'][0]['teacher_mobileno']
        let teacher_email = result['students'][0]['teacher_email']

        // 상담
        let all_uc_consulting = consultingData.filter(a => a.category_id < 100).length;
        let my_consulting = consultingData.filter(a => a.ban_id == ban_id && a.startdate <= today)
        let u_consulting_my = my_consulting.filter(a => a.category_id < 100);

        let consulting_ixl = u_consulting_my.filter(a => a.category_id == 1).length
        let consulting_reading = u_consulting_my.filter(a => a.category_id == 4).length
        let consulting_speacial = u_consulting_my.filter(a => a.category_id == 3).length
        let consulting_writing = u_consulting_my.filter(a => a.category_id == 6).length
        let consulting_homepage = u_consulting_my.filter(a => a.category_id == 2).length
        let consulting_intoreading = u_consulting_my.filter(a => a.category_id == 5 || a.category_id == 7).length

        // let switchstudent_num = response['switchstudent_num']
        // let switchstudent_num_p = response['switchstudent_num_p']
        // let outstudent_num = response['outstudent_num']
        // let outstudent_num_p = response['outstudent_num_p']
        // let unlearned_ttd = response['unlearned_ttd']
        // let unlearned_ttc = response['unlearned_ttc']

        let temp_profile_data = `
        <tbody  style="width:100%;">
            <tr class="row" style="background: #DCE6F2;">
                <th class="col-12">담임 선생님 정보</th>
            </tr>
            <tr class="row" style="background:#DCE6F2;">
                <td class="col-4">${teacher_name}(${teacher_e_name})</th>
                <td class="col-4"> 📞 ${teacher_mobileno} </th>
                <td class="col-4"> ✉️ ${teacher_email}</th>
            </tr>
        </tbody>
        `;
        $('#profile_data').html(temp_profile_data);

        let temp_ban_data = `
        <tbody  style="width:100%;">
            <tr class="row">
                <th class="col-3">현 원생 수</th>
                <th class="col-3">이반</th>
                <th class="col-3">퇴소</th>
                <th class="col-3">미학습</th>
            </tr>
            <tr class="row">
                <td class="col-3">${students_num}</td>
                <td class="col-3">${switch_student}</td>
                <td class="col-3">${out_student}(${answer_rate(out_student, outstudent_num).toFixed(2)}%)</td>
                <td class="col-3">${u_consulting_my.length}(${answer_rate(u_consulting_my.length, all_uc_consulting).toFixed(2)}%) </td>
            </tr>
        </tbody>
        `;

        $('#ban_data').html(temp_ban_data);

        result['students'].forEach((elem) => {
            elem.unlearned = u_consulting_my.filter(a => a.student_id == elem.student_id).length
            elem.up = answer_rate(elem.unlearned, u_consulting_my.length).toFixed(0)
        });
        result['students'].sort((a, b) => b.up - a.up)
        data_list = result['students']
        totalData = data_list.length

        displayData(totalData, 1, dataPerPage, data_list, ban_id);
        paging(totalData, dataPerPage, pageCount, 1, data_list, ban_id);
        $('#student_data').show()
        $('#pagingul').show();
        my_task_data = taskData.filter(t => t.ban_id == ban_id && t.startdate <= today)
        done_task = my_task_data.filter(a => a.done == 1).length
        done_consulting = my_consulting.filter(a => a.done == 1).length
        let temp_ban_statistics = `
        <table class="table text-center" id="unlearned" style="margin-left:1%; margin-right: 4%;width: 50%;">
                <tbody  style="width:100%;">
                    <tr class="row" style="background: #DCE6F2;">
                        <th class="col-12">미학습 관리</th>
                    </tr>
                    <tr class="row">
                        <th class="col-2">IXL</th>
                        <th class="col-2">리딩</th>
                        <th class="col-2">리특</th>
                        <th class="col-2">라이팅</th>
                        <th class="col-2">미접속</th>
                        <th class="col-2">인투리딩</th>
                    </tr>
                    <tr class="row">
                        <td class="col-2">${consulting_ixl}(${answer_rate(consulting_ixl, u_consulting_my.length).toFixed(2)}%)</td>
                        <td class="col-2">${consulting_reading}(${answer_rate(consulting_reading, u_consulting_my.length).toFixed(1)}%)</td>
                        <td class="col-2">${consulting_speacial}(${answer_rate(consulting_speacial, u_consulting_my.length).toFixed(1)}%) </td>
                        <td class="col-2">${consulting_writing}(${answer_rate(consulting_writing, u_consulting_my.length).toFixed(1)}%) </td>
                        <td class="col-2">${consulting_homepage}(${answer_rate(consulting_homepage, u_consulting_my.length).toFixed(1)}%) </td>
                        <td class="col-2">${consulting_intoreading}(${answer_rate(consulting_intoreading, u_consulting_my.length).toFixed(1)}%) </td>
                    </tr>
                </tbody>
            </table>
            <table class="table text-center" id="teaching" style="margin-right: 4%; width: 50%;">
                <tbody  style="width:100%;">
                    <tr class="row" style="background: #DCE6F2;">
                        <th class="col-12">상담*업무 관리</th>
                    </tr>
                    <tr class="row">
                        <th class="col-6">업무</th>
                        <th class="col-6">상담</th>
                    </tr>
                    <tr class="row">
                        <td class="col-3">${done_task}/${my_task_data.length}</td>
                        <td class="col-3">${answer_rate(done_task, my_task_data.length).toFixed(0)}%</td>
                        <td class="col-3">${done_consulting}/${my_consulting.length}</td>
                        <td class="col-3">${answer_rate(done_consulting, my_consulting.length).toFixed(0)}%</td>
                    </tr>
                </tbody>
            </table>  
        `;
        $('#ban_statistics').html(temp_ban_statistics);
    }
}

function displayData(totalData, currentPage, dataPerPage,data_list,b_id) {
    let chartHtml = "";

    //Number로 변환하지 않으면 아래에서 +를 할 경우 스트링 결합이 되어버림.. 
    currentPage = Number(currentPage);
    dataPerPage = Number(dataPerPage);
    let last_item = (currentPage - 1) * dataPerPage + dataPerPage;
    if( last_item > totalData){
        last_item = totalData
    }
    for (
        var i = (currentPage - 1) * dataPerPage; //11*5 = 55
        i < last_item; // 55+5
        i++
    ) {
        target = data_list[i]
        let register_no = target['student_id']
        let name = target['student_name'];
        let mobileno = target['mobileno'];
        let parent_name_mobileno = target['pname'] +'('+target['pmobileno']+')';
        let unlearned = target['unlearned'];
        let up = target['up'];
        chartHtml +=`
        <td class="col-2">${name}</td>
        <td class="col-2">${mobileno} </td>
        <td class="col-3">${parent_name_mobileno}</td>
        <td class="col-2">${make_recobook(target['reco_book_code'])} </td>
        <td class="col-2">${unlearned}(${up}%)</td><br>
        <td class="col-1"> <button class="modal-tbody-btn" data-bs-toggle="modal" data-bs-target="#consultinghistory" onclick="get_consulting_history(${register_no})">📝</button><br>
        `;
    } 
    $("#s_data").html(chartHtml);
}

function paging(totalData, dataPerPage, pageCount, currentPage, data_list, b_id) {
    totalPage = Math.ceil(totalData / dataPerPage); //총 페이지 수

    if (totalPage < pageCount) {
        pageCount = totalPage;
    }

    let pageGroup = Math.ceil(currentPage / pageCount); // 페이지 그룹 1/10 1~10까지는 '1' , 11~20 까지는 2 , 21~30까지는 3 
    let last = pageGroup * pageCount; //화면에 보여질 마지막 페이지 번호

    if (last > totalPage) {
        last = totalPage;
    }
    let first = last - (pageCount - 1); //화면에 보여질 첫번째 페이지 번호
    let next = last + 1;
    let prev = first - 1;

    let pageHtml = "";

    if (prev > 0) {
        pageHtml += "<li><a class='cursor-pointer' id='prev'> 이전 </a></li>";
    }

    //페이징 번호 표시 
    for (var i = first; i <= last; i++) {
        if (currentPage == i) {
            pageHtml +=
                "<li class='on'><a class='cursor-pointer' id='" + i + "'>" + i + "</a></li>";
        } else {
            pageHtml += "<li><a class='cursor-pointer' id='" + i + "'>" + i + "</a></li>";
        }
    }

    if (last < totalPage) {
        pageHtml += "<li><a class='cursor-pointer' id='next' > 다음 </a></li>";
    }

    $("#pagingul").html(pageHtml);
    let displayCount = "";
    displayCount = " 원생 명단 1 - " + totalPage + " 페이지 / " + totalData + "건";
    $("#displayCount").text(displayCount);

    //페이징 번호 클릭 이벤트 
    $("#pagingul li a").click(function () {
        let $id = $(this).attr("id");
        selectedPage = $(this).text();

        if ($id == "next") selectedPage = next;
        if ($id == "prev") selectedPage = prev;

        //전역변수에 선택한 페이지 번호를 담는다...
        globalCurrentPage = selectedPage;

        //페이징 표시 재호출
        paging(totalData, dataPerPage, pageCount, selectedPage, data_list,b_id);
        //글 목록 표시 재호출
        displayData(totalData, selectedPage, dataPerPage,data_list,b_id);
    });
}


function post_comment(q_id,is_coco){
    let comment_contents = ''
    if(is_coco == 0 ){
        comment_contents = $('#comment_contents').val()
    }else{
        comment_contents = $(`#comment_contents${is_coco}`).val()
    }
    if((comment_contents.length == 0)){
        alert('댓글 내용을 입력해주세요')
    }
    $.ajax({
            type: "POST",
			url:'/common/comment/'+q_id+'/'+is_coco,
			// data: JSON.stringify(jsonData), // String -> json 형태로 변환
            data: {
                comment_contents:comment_contents,
            },
            success: function (response) {{
				alert(response["result"])
                get_question_detail(q_id)    
			}}
		})
}

// 문의 삭제 함수 
async function delete_question(q_id){
    var con_val = confirm('정말 삭제하시겠습니까?')
    if(con_val == true){
    await $.ajax({
        type: 'POST',
        url: '/common/delete_question/' + q_id ,
        data: {},
        success: function(data){
            alert(data)
            history.go(0)
        },
        error: function(xhr, status, error){
            alert(xhr.responseText);
        }
    })
    get_consulting()
    }
}

