
// const today = new Date();
var selectedBanList = [];
var selectedStudentList = [];

// 처음 get 할때 뿌려질 정보 보내는 함수 
$(document).ready(function () {
    get_data();
    $('.nav-link').on('click', function () {
        $('.nav-link').removeClass('active');
        $(this).addClass('active');
    })

})
// 전체 반 정보(차트) 가져오는 함수 
async function get_data() {
    $('#semester').hide();
    $('#detailban').show();
    $('#qubox').hide()
    $('#sobox').hide()
    $('#ulbox').hide()
    $('#target_ban_info_body').hide()
    $('#inloading').show()
    await $.ajax({
        type: "GET",
        url: "/common/all_ban",
        dataType: 'json',
        data: {},
        success: function (response) {
            // QA 데이터
            questionData = response['question']
            answerData = response['answer']
            attachData = response['attach']

            // sodata
            outstudentData = response['outstudent']
            switchstudentData = response['switchstudent']

            total_student_num = response['all_ban'].length
            outstudent_num = outstudentData.length;
            switchstudent_num = switchstudentData.length
            
            first_total = total_student_num+outstudent_num

            // 학습 데이터
            consultingData = response['consulting']
            // 업무 데이터 
            taskData = response['task']

            // 전체 데이터 
            const result = response['all_ban'].map(obj1 => {
                const out_student = outstudentData.find(obj2 => obj1.student_id === obj2.student_id);
                const switch_student = switchstudentData.find(obj2 => obj1.student_id === obj2.student_id);
                const out_created = out_student ? out_student.out_created : null;
                const switch_ban_id = switch_student ? switch_student.switch_ban_id : null;
                return { ...obj1, out_created, switch_ban_id };
            });

            // 반으로 묶인 데이터 ban_id / student_num / semester / teacher_id
            const banGrouped = result.reduce((acc, item) => {
                const v = item.ban_id;
              
                if (!acc[v]){
                  acc[v] = {teacher_id:item.teacher_id, ban_id:item.ban_id, semester:item.semester,students: [], total_out_count: 0 , total_out_per:0, total_switch_count: 0 , total_switch_per:0};
                }
                if(item.out_created != null){
                  acc[v].total_out_count+=1;
                  acc[v].total_out_per = answer_rate(acc[v].total_out_count,outstudent_num).toFixed(1)
                }else if(item.switch_ban_id != null){
                  acc[v].total_switch_count+=1;
                  acc[v].total_switch_per = answer_rate(acc[v].total_switch_count,switchstudent_num).toFixed(1)
                }
              
                acc[v].students.push(item);
              
                return acc;
            }, {});
            allData = Object.values(banGrouped).sort((a, b) => {
                if(b.total_out_per !== a.total_out_per){
                    return b.total_out_per - a.total_out_per; // total_out_per가 큰 순으로 정렬
                } else {
                    return b.students.length - a.students.length; // students.length가 큰 순으로 정렬
                }
            });
            // 학기 별 원생
            onesemester = total_student_num != 0 ? result.filter(e => e.semester == 1) : 0
            fivesemester = total_student_num != 0 ? result.filter(e => e.semester == 2) : 0
            ninesemester = total_student_num != 0 ? result.filter(e => e.semester == 0) : 0

            // 학기별 원생수 및 퇴소 원생 수 
            onesemester_total = onesemester != 0 ? onesemester.length : 0
            oneoutstudent = onesemester != 0 ? onesemester.filter(e => e.out_created != null).length : 0
            first_onesemester = onesemester_total+oneoutstudent

            fivesemester_total = fivesemester != 0 ? fivesemester.length : 0
            fiveoutstudent = fivesemester != 0 ? fivesemester.filter(e => e.out_created != null).length : 0
            first_fivesemester = fivesemester_total+fiveoutstudent

            ninesemester_total = ninesemester != 0 ? ninesemester.length : 0
            nineoutstudent = ninesemester != 0 ? ninesemester.filter(e => e.out_created != null).length : 0
            first_ninesemester = ninesemester_total+nineoutstudent

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
                        <td>${outstudent_num}명(${answer_rate(outstudent_num,first_total).toFixed(1)}%)</td>
                        <td><span class='cursor-pointer fs-4' onclick="allsemesterShow()">📜</span></td>
                    </tr>
                    <tr>
                        <th class="need">1월 학기</th>
                        <td>${first_onesemester}명</td>
                        <td>${onesemester_total}명</td>
                        <td>${oneoutstudent}명(${answer_rate(oneoutstudent,first_onesemester).toFixed(1)}%)</td>
                        <td><span class='cursor-pointer fs-4' onclick="semesterShow(${1})">📜</span></td>
                    </tr>
                    <tr>
                        <th class="need">5월 학기</th>
                        <td>${first_fivesemester}명</td>
                        <td>${fivesemester_total}명</td>
                        <td>${fiveoutstudent}명(${answer_rate(fiveoutstudent,first_fivesemester).toFixed(1)}%)</td>
                        <td><span class='cursor-pointer fs-4' onclick="semesterShow(${2})">📜</span></td>
                    </tr>
                    <tr>
                        <th>9월 학기</th>
                        <td>${first_ninesemester}명</td>
                        <td>${ninesemester_total}명</td>
                        <td>${nineoutstudent}명(${answer_rate(nineoutstudent,first_ninesemester).toFixed(1)}%)</td>
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
    $('#target_ban_info_body').show()

}
function allsemesterShow() {
    $('#semester').show();
    $('#semester_s').html('전체 반')
    data = allData
    //  const v = `${item.ban_id}_${item.student_num}_${item.semester}_${item.teacher_id}`;
    let temp_semester_banlist = ''
    let temp_ban_option = '<option value=0 selected>반을 선택해주세요</option>';
    let temp_o_ban_id = '<option value="none" selected>이반 처리 결과를 선택해주세요</option><option value=0>반려</option>'
    // let temp_banlist = '<option value=0 selected>반을 선택해주세요</option>';
    data.forEach(ban_data => {
        let ban_id = ban_data['students'][0].ban_id
        let name = ban_data['students'][0].name
        let semester = ban_data['students'][0].semester
        let student_num = ban_data['students'][0].student_num
        let teacher_name = ban_data['students'][0].teacher_name
        
        let value = `${ban_id}_${ban_data['students'][0].teacher_id}_${name}`;
        // 원생 목록 
        // let out_num = ban_data[key].filter(s => s.out_created != null || s.switch_ban_id != null).length;
        let total_out_count = ban_data['total_out_count']  + ban_data['total_switch_count']
        let total_out_per = ban_data['total_out_per']
        let selectmsg = `<option value="${value}">${name} (${make_semester(semester)}월 학기)</option>`;
        temp_ban_option += selectmsg
        temp_o_ban_id += selectmsg
        temp_semester_banlist += `
        <td class="col-2">${name}</td>
        <td class="col-2">${teacher_name}</td>
        <td class="col-2">${student_num + total_out_count}</td>
        <td class="col-2">${student_num}</td>
        <td class="col-2">${total_out_count}명  (${total_out_per}%)</td>
        <td class="col-2" data-bs-toggle="modal" data-bs-target="#target_ban_info" onclick="getBanChart(${ban_id})"><span class="cursor-pointer">👉</span></td>`;
    });
    $('#semester_banlist').html(temp_semester_banlist)
    // $('#ban_list').html(temp_ban_option)
    $('#consulting_target_ban').html(temp_ban_option)
    $('#task_target_ban').html(temp_ban_option)
    $('#o_ban_id2').html(temp_o_ban_id)
}

function semesterShow(semester) {
    $('#semester').show();
    data = allData.filter(e => e.semester == semester)
    $('#semester_s').html(make_semester(semester)+'월 학기');
    // key값 `${item.ban_id}_${item.student_num}_${item.semester}_${item.teacher_id}`;
    let temp_semester_banlist = ''
    data.forEach(ban_data => {
        let ban_id = ban_data['students'][0].ban_id
        let name = ban_data['students'][0].name
        let student_num = ban_data['students'][0].student_num
        let teacher_name = ban_data['students'][0].teacher_name
        
        // 원생 목록 
        // let out_num = ban_data[key].filter(s => s.out_created != null || s.switch_ban_id != null).length;
        let total_out_count = ban_data['total_out_count'] + ban_data['total_switch_count']
        let total_out_per = ban_data['total_out_per']

        temp_semester_banlist += `
        <td class="col-2">${name}</td>
        <td class="col-2">${teacher_name}</td>
        <td class="col-2">${student_num + total_out_count}</td>
        <td class="col-2">${student_num}</td>
        <td class="col-2">${total_out_count}명  (${total_out_per}%)</td>
        <td class="col-2" data-bs-toggle="modal" data-bs-target="#target_ban_info" onclick="getBanChart(${ban_id})"><span class="cursor-pointer">👉</span></td>`;
    });
    $('#semester_banlist').html(temp_semester_banlist)
}

// 반 별 차트 정보 보내주는 함수 
function getBanChart(ban_id) {
    // key값 `${item.ban_id}_${item.student_num}_${item.semester}_${item.teacher_id}`;
    result = data.filter(e=>e.ban_id == ban_id)[0]
    $('#target_ban_info_requestModalLabel').html(result['students'][0].name + '반 상세 현황')
    if(result.length <= 0){
        let no_data_title = `<h1> ${response.text} </h1>`
        $('#s_data').html(no_data_title);
        $('#pagingul').hide();
        return
    }else{
        // 이반 학생 
        let switch_student = result['students'].filter(s=>s.switch_ban_id != null).length;
        // 퇴소 학생 
        let out_student = result['students'].filter(s=>s.out_created != null).length;
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
        my_task_data = taskData.filter(t=>t.ban_id == ban_id && t.startdate <= today )
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
// 이반 * 퇴소 
// 조회
function sodata(){
    $('#qubox').hide()
    $('#ulbox').hide()
    $('#detailban').hide()
    $('#sobox').show()
    if (outstudent_num == 0 && switchstudent_num == 0 ) {
            let no_data_title = '이반 * 퇴소 발생이 없었어요'
            $('#sotitle').html(no_data_title);
            $('#sotable').hide()
            return
    }
    switch_out_bans = allData.filter(e=>e.total_out_count != 0 || e.total_switch_count != 0)
    $('#sotitle').empty();

    let temp_html = ``
    for (i = 0; i < switch_out_bans.length; i++) {
        let ban_id = switch_out_bans[i].students[0].ban_id
        let name = switch_out_bans[i].students[0].name
        let student_num = switch_out_bans[i].students[0].student_num
        let teacher_name = switch_out_bans[i].students[0].teacher_name
        
        let total_out_count = switch_out_bans[i]['total_out_count']
        let total_out_per = switch_out_bans[i]['total_out_per']

        let total_switch_count = switch_out_bans[i]['total_switch_count']
        let total_switch_per = switch_out_bans[i]['total_switch_per']

        temp_html += `
        <td class="col-1">${i+1}위</td>
        <td class="col-2">${name}</td>
        <td class="col-1">${make_semester(switch_out_bans[i]['students'][0].semester)}월 학기</td>
        <td class="col-1">${student_num+total_switch_count+total_out_count}</td>
        <td class="col-1">${student_num}</td>
        <td class="col-1">${teacher_name}</td>
        <td class="col-2">${total_switch_count}(${total_switch_per}%)</td>
        <td class="col-2">${total_out_count}(${total_out_per}%)</td>
        <td class="col-1" data-bs-toggle="modal" data-bs-target="#target_ban_info" onclick="getBanChart(${ban_id})">👉</td>
        `;
    }
    $('#static_data1').html(temp_html)
    so_paginating(0)
}

// 이반 퇴소 문의 관리
function so_paginating(done_code) {
    // let container = $('#so_pagination')
    soquestionData = questionData.length > 0 ? questionData.filter(q=>q.category != 0) : 0
    total_soquestion_num = soquestionData.length
    sodata_noanswer = soquestionData.filter(a => a.answer == 0).length

    let temp_newso = `
    <td class="col-4">${total_soquestion_num}  건</td>
    <td class="col-4">${total_soquestion_num - sodata_noanswer}  건</td>
    <td class="col-4">${sodata_noanswer}  건</td>
    `;
    $('#newso').html(temp_newso)
    if(total_soquestion_num!=0){
        $('#no_data_msg').hide()
        $('#so_question').show()
        $('#so_pagination').show()
        qdata = soquestionData.filter(a => a.answer == done_code)
        var dataHtml = '';
        $.each(qdata, function (index, item) {
            let category = q_category(item.category)
            dataHtml += `
            <td class="col-2">${category}</td>
            <td class="col-4">${item.title}</td>
            <td class="col-4">${item.contents}</td>
            <td class="col-2"> <button class="custom-control custom-control-inline custom-checkbox" data-bs-toggle="modal"
            data-bs-target="#soanswer" onclick="get_question_detail(${item.id},${done_code})">✏️</button> 
            <button onclick="delete_question(${item.id})">❌</button></td>`;
        });
        $('#so_tr').html(dataHtml);
    }else{
        $('#so_question').hide()
        $('#so_pagination').hide()
        $('#no_data_msg').html('문의가 없습니다')
        $('#no_data_msg').show()
    }
}

// 문의 내용 상세보기
async function get_question_detail(q_id,done_code) {
    // $('#questionlist').hide()
    $('#consulting_history_attach').hide()
    $('#manage_answer').hide()
    question_detail_data = questionData.filter(q => q.id == q_id)[0]
    student_data = allData.filter(a=>a.teacher_id == question_detail_data.teacher_id && a.ban_id == question_detail_data.ban_id)[0]['students'].filter(s=>s.student_id
       == question_detail_data.student_id)[0]
    attach = attachData.filter(a=>a.question_id == q_id)[0]['file_name']
    // 
    console.log(question_detail_data)
    console.log(student_data)
    console.log(attach)
    // 문의 상세 내용 
    let temp_question_list = `
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">문의 종류</span>
        <p>${q_category(question_detail_data.cateogry)}</p>
    </div>
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">제목</span>
        <p>${question_detail_data.title}</p>
    </div>
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">내용</span>
        <p>${question_detail_data.contents}</p>
    </div>
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">작성일</span>
        <p>${question_detail_data.create_date}</p>
    </div>
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">대상 반 | 학생</span>
        <p>${student_data.ban_name} ➖ ${student_data.student_name}</p>
    </div>
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">첨부파일</span>
        <a href="/common/downloadfile/question/${q_id}" download="${attach}">${attach}</a>
    </div>`;
    $('#teacher_question').html(temp_question_list);

    // 상담 일지 처리 
    if(question_detail_data.category == 0){
        $('#consulting_history_attach').hide()
    }else{
        $('#consulting_history_attach').show()
        consulting_history = consultingData.filter(c=>c.id == question_detail_data.consulting_history)[0]
        let category = ''
        if(consulting_history.category_id < 100 ){
            category = `${consulting_history.week_code}주간 ${consulting_history.category}상담`
        }else{
            category = `${consulting_history.category} ${consulting_history.contents}`
        }
        let temp_his = `
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">상담 종류</span>
            <p>${category}</p>
        </div>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">상담 사유</span>
            <p>${consulting_history.reason}</p>
        </div>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">제공한 가이드</span>
            <p>${consulting_history.solution}</p>
        </div>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">상담 결과</span>
            <p>${consulting_history.result}</p>
        </div>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">상담 일시</span>
            <p>${make_date(consulting_history.created_at)}</p>
        </div>
        `;
        $('#cha').html(temp_his);
    }
    // 응답 처리 
    if(done_code == 0){
        $('#teacher_answer').hide()
        $('#manage_answer').show()
        $('#manage_answer_1').show()
        if(question_detail_data.category == 1){
            $('#manage_answer_2').hide()
            $('#manage_answer_3').show()
         }else if(question_detail_data.category == 2){
            $('#manage_answer_2').show()
            $('#manage_answer_3').hide()
         }else{
            $('#manage_answer_2').hide()
            $('#manage_answer_3').hide()
         }
         $('#button_box').html(`<button class="btn btn-success" type="submit" onclick="post_answer(${q_id},${question_detail_data.category})">저장</button>`);
    }else{
        $('#manage_answer').hide()
        $('#teacher_answer').show()
        answer_data = answerData.filter(a=>question_id == q_id)[0]
        let temp_answer_list = `
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">답변 제목</span>
            <input class="modal-body-select" type="text" size="50" id="answer_title" style="width: 75%;">
        </div>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">답변 내용</span>
            <textarea id="answer_contents" class="modal-body-select" type="text" rows="5" cols="25"
                name="answer_contents1" style="width: 75%;"></textarea>
        </div>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">응답일</span>
            <p>${answer_data.created_at}</p>
        </div>`;
        if(question_detail_data.category != 0){
           temp_answer_list += `<div class="modal-body-select-container">
           <span class="modal-body-select-label">처리</span>
           <p>${make_reject_code(answer_data.reject_code)}</p>
           </div>`
        }
        $('#teacher_answer').html(temp_answer_list);
    }
    
}
// 본원 답변 기능 
function post_answer(q_id,category){
    answer_title = $('#answer_title').val()
    answer_contents = $('#answer_contents').val()
    o_ban_id = 0
    if(category != 0){
        o_ban_id = $('#o_ban_id'+category).val()
    }
    $.ajax({
        type: "POST",
        url: "/manage/answer/"+q_id,
        data: {
            answer_title:answer_title,
            answer_contents:answer_contents,
            o_ban_id:o_ban_id
        },
        success: function (response) {{
            alert(response["result"])
            window.location.replace('/')
        }}
    });
}

// 미학습 (학습관리)
async function uldata() {
    $('#qubox').hide()
    $('#sobox').hide()
    $('#detailban').hide()
    $('#ulbox').show()
    let container = $('#ul_pagination')
    await $.ajax({
        url: '/manage/uldata',
        type: 'GET',
        data: {},
        success: function (response) {
            target_students = response['target_students']
            unlearned_count = response['unlearned_count']['data']

            if (response['status'] == 400 || unlearned_count.length == 0) {
                let no_data_title = `<h1> ${response.text} </h1>`
                $('#ultitle').html(no_data_title);
                $('#ul_data_box').hide()
                $('#ul_pagination').hide()
                return
            }
            $('#ultitle').empty();
            $('#ul_data_box').show()
            $('#ul_pagination').show()

            // 미학습 높은 순 정렬 
            unlearned_count.sort((a, b) => {
                return b.unlearned - a.unlearned
            });
            container.pagination({
                dataSource: unlearned_count,
                prevText: '이전',
                nextText: '다음',
                pageSize: 10,
                callback: function (unlearned_count, pagination) {
                    var dataHtml = '';
                    $.each(unlearned_count, function (index, consulting) {
                        let student_data = target_students.filter(a => a.student_id == consulting.student_id)[0]
                        let student_id = student_data['student_id']
                        let name = student_data['name']
                        let mobileno = student_data['mobileno']
                        let reco_book_code = student_data['reco_book_code']
                        let ban_name = student_data['ban_name']
                        // let total_index = (pagination.currentPage - 1) * pagination.pageSize + index + 1; // 전체 데이터의 인덱스 계산
                        dataHtml += `
                        <td class="col-1">${index + 1}</td>
                        <td class="col-2">${name}</td>
                        <td class="col-2">${consulting.unlearned}</td>
                        <td class="col-2">${ban_name}</td>
                        <td class="col-2">${mobileno}</td>
                        <td class="col-2">${reco_book_code}</td>
                        <td class="col-1"> <button class="modal-tbody-btn" onclick="get_student_detail(${student_id})">📝</button> `;
                    });
                    $('#static_data2').html(dataHtml);
                }
            })
        },
        error: function (xhr, status, error) {
            alert(xhr.responseText);
        }
    })

}

// 업무 요청 관련 함수 
async function request_task() {
    $("#task_date").datepicker({ dateFormat: 'yy-mm-dd' });
    $("#task_deadline").datepicker({ dateFormat: 'yy-mm-dd' });
    await $.ajax({
        url: '/manage/request_task',
        type: 'GET',
        data: {},
        success: function (response) {
            let temp_task_category_list = '<option value=0 selected>업무 카테고리를 선택해주세요</option>';
            for (i = 0; i < response['all_task_category'].length; i++) {
                let id = response['all_task_category'][i]['id']
                let name = response['all_task_category'][i]['name']
                temp_task_category_list += `
                <option value=${id}>${name}</option>
                `;
                $('#task_category_list').html(temp_task_category_list)
            }
        }
    })
}
function show_ban_selection() {
    var selectedOptions = ''
    for (i = 0; i < selectedBanList.length; i++) {
        // bid+tid+bname+sid+sname
        var value = selectedBanList[i].split('_')
        selectedOptions += `
        <td class="col-11">${value[2]}</td>
        <td class="col-1" onclick="delete_selected_ban(${i})">❌</td>`;
        $('#target_task_bans').html(selectedOptions);
    }
}
function task_ban_change(btid) {
    if (btid.includes('_')) {
        // 다중 반 처리
        $('#target_task_bans').show()
        $('#task_msg').html('👇 개별 반 대상 진행합니다 (대상 반을 확인해 주세요)')
        if (selectedBanList.indexOf(btid) === -1) {
            selectedBanList.push(btid);
        }
        $('select[name="task_target_ban[]"]').val(selectedBanList);
        return show_ban_selection()
    } else {
        selectedBanList.length = 0
        $('#target_task_bans').empty()
        if (btid == 0) {
            // 전체 반 대상 진행 일 경우 처리 
            $('#task_msg').html('👉 전체 반 대상 진행합니다 (소요되는 시간이 있으니 저장 클릭후 화면이 이동하기 전 까지 대기 해 주세요)')
        } else if (btid == 1) {
            // plus alpha 처리
            $('#task_msg').html('👉 PLUS/ALPHA반 대상 진행합니다 (소요되는 시간이 있으니 저장 클릭후 화면이 이동하기 전 까지 대기 해 주세요)')
        } else if (btid == 2) {
            // nf 노블 처리 
            $('#task_msg').html('👉 NF/NOVEL반 대상 진행합니다 (소요되는 시간이 있으니 저장 클릭후 화면이 이동하기 전 까지 대기 해 주세요)')
        }
    }
}
function delete_selected_ban(idx) {
    selectedBanList.splice(idx, 1)
    $('select[name="task_target_ban[]"]').val(selectedBanList);
    return show_ban_selection()
}

// 상담 요청 관련 함수 
async function request_consulting() {
    $('#result_tbox').empty()
    $('#select_student').hide()
    $("#consulting_date").datepicker({ dateFormat: 'yy-mm-dd' });
    $("#consulting_deadline").datepicker({ dateFormat: 'yy-mm-dd' });
    await $.ajax({
        url: '/manage/request_consulting',
        type: 'GET',
        data: {},
        success: function (response) {
            let temp_consulting_category_list = '<option value=0 selected>상담카테고리를 선택해주세요</option>';
            for (i = 0; i < response['all_consulting_category'].length; i++) {
                let id = response['all_consulting_category'][i]['id']
                let name = response['all_consulting_category'][i]['name']
                temp_consulting_category_list += `
                <option value=${id}>${name}</option>
                `;
                $('#consulting_category_list').html(temp_consulting_category_list)
            }
        }
    })
}
async function ban_change(btid) {
    // 다중 반 처리
    if (btid.includes('_')) {
        $('#select_student').show()
        $('#consulting_msg').html('👇 개별 반 대상 진행합니다 (대상 학생을 확인해 주세요)')
        value = btid.split('_')
        // ban_id _ teacher_id _ name 
        studentData = allData.filter(a=>a.ban_id == value[0])[0].students
        let temp_target_student = `<option value="${btid}_-1_전체 학생 대상 진행">✔️${value[2]}반 전체 학생 대상 진행</option>`;
        for (var i = 0; i < studentData.length; i++) {
            let sname = studentData[i]['student_name'];
            temp_target_student += `<option value="${btid}_${studentData[i]['student_id']}_${sname}"> ${sname}</option>`;
        }
        $('#consulting_target_students').html(temp_target_student)
    } else {
        $('#select_student').hide()
        $('#result_tbox').empty()
        if (btid == 0) {
            // 전체 반 대상 진행 일 경우 처리 
            $('#consulting_msg').html('👉 전체 반 대상 진행합니다 (소요되는 시간이 있으니 저장 클릭후 알람메시지가 나올 때 까지 대기 해 주세요)')
        } else if (btid == 1) {
            // plus alpha 처리
            $('#consulting_msg').html('👉 PLUS/ALPHA반 대상 진행합니다 (소요되는 시간이 있으니 저장 클릭후 알람메시지가 나올 때 까지 대기 해 주세요)')
        } else if (btid == 2) {
            // nf 노블 처리 
            $('#consulting_msg').html('👉 NF/NOVEL반 대상 진행합니다 (소요되는 시간이 있으니 저장 클릭후 알람메시지가 나올 때 까지 대기 해 주세요)')
        }
    }
}

$('#consulting_target_students').change(function () {
    var selectedValues = $(this).val()[0];
    if (selectedStudentList.indexOf(selectedValues) === -1) {
        selectedStudentList.push(selectedValues);
    }
    return show_selections();
});
function show_selections() {
    $('#result_tbox').empty()
    for (i = selectedStudentList.length - 1; i >= 0; i--) {
        // 전체 반이 선택된 경우 
        if (String(selectedStudentList[i]).includes('-1')) {
            // 같은 반 친구들 교집합을 저장 
            let total_student_selections = selectedStudentList.filter(value => ((String(value).split('_')[0] == selectedStudentList[i].split('_')[0]) && (!(value.includes('-1')))));
            if (total_student_selections.length != 0) {
                total_student_selections.forEach(value => {
                    selectedStudentList.splice(selectedStudentList.indexOf(value), 1);
                })
            }
        }
    }
    var selectedOptions = ''
    for (i = 0; i < selectedStudentList.length; i++) {
        // bid+tid+bname+sid+sname
        var value = selectedStudentList[i].split('_')
        selectedOptions += `
        <td class="col-4">${value[2]}</td>
        <td class="col-6">${value[4]}</td>
        <td class="col-2" onclick="delete_selected_student(${i})">❌</td>`;
        $('#result_tbox').html(selectedOptions);
    }
}
function delete_selected_student(idx) {
    selectedStudentList.splice(idx, 1)

    // 선택 된거 보여주기 
    return show_selections();
}
function post_consulting_request() {
    consulting_category = $('#consulting_category_list').val()
    consulting_contents = $('#consulting_contents').val()
    consulting_date = $('#consulting_date').val()
    consulting_deadline = $('#consulting_deadline').val()
    // 다중 선택 대상 선택일 경우  
    if (selectedStudentList.length != 0) {
        let total_student_selections = selectedStudentList.filter(value => value.includes('-1'));
        // 전체 학생 대상 인 경우
        if (total_student_selections.length != 0) {
            total_student_selections.forEach(value => {
                v = String(value).split('_')
                $.ajax({
                    type: "POST",
                    url: '/manage/consulting/request_all_student/' + v[0] + '/' + v[1],
                    // data: JSON.stringify(jsonData), // String -> json 형태로 변환
                    data: {
                        consulting_category: consulting_category,
                        consulting_contents: consulting_contents,
                        consulting_date: consulting_date,
                        consulting_deadline: consulting_deadline
                    },
                    success: function (response) {
                        if (response != 'success') {
                            alert('상담 요청 실패')
                        }
                    }
                })
            })
            alert('상담요청 완료');
        }
        // 개별 학생 대상 인 경우  
        let indivi_student_selections = selectedStudentList.filter(value => !(value.includes('-1')));
        if (indivi_student_selections.length != 0) {
            indivi_student_selections.forEach(value => {
                v = String(value).split('_')
                $.ajax({
                    type: "POST",
                    url: '/manage/consulting/request_indivi_student/' + v[0] + '/' + v[1] + '/' + v[3],
                    // data: JSON.stringify(jsonData), // String -> json 형태로 변환
                    data: {
                        consulting_category: consulting_category,
                        consulting_contents: consulting_contents,
                        consulting_date: consulting_date,
                        consulting_deadline: consulting_deadline
                    },
                    success: function (response) {
                        if (response != 'success') {
                            alert('상담 요청 실패')
                        }
                    }
                })
                alert(v[2] + '반 ' + v[4] + '원생 상담요청 완료');
            })
        }
        window.location.reload()
        // 전체 반 대상 선택 일 경우 
    } else {
        b_type = $('#consulting_target_aban').val()[0]
        console.log(b_type)
        $.ajax({
            type: "POST",
            url: '/manage/consulting/all_ban/' + b_type,
            // data: JSON.stringify(jsonData), // String -> json 형태로 변환
            data: {
                consulting_category: consulting_category,
                consulting_contents: consulting_contents,
                consulting_date: consulting_date,
                consulting_deadline: consulting_deadline
            },
            success: function (response) {
                if (response['result'] != 'success') {
                    alert('상담 요청 실패')
                } else {
                    alert('해당 반 전체에 상담요청 완료')
                    window.location.reload()
                }
            }
        })
    }
}

// CS 관리 
function paginating(done_code) {
    $('#detailban').hide()
    $('#sobox').hide()
    $('#ulbox').hide()
    $('#qubox').show()
    let container = $('#pagination')
    $.ajax({
        url: '/manage/api/get_all_questions/' + done_code,
        type: 'get',
        data: {},
        success: function (data) {
            container.pagination({
                dataSource: JSON.parse(data),
                prevText: '이전',
                nextText: '다음',
                pageClassName: 'float-end',
                pageSize: 5,
                callback: function (data, pagination) {
                    var dataHtml = '';
                    $.each(data, function (index, item) {
                        if (item.d == 0) { item.category = '일반문의' }
                        else if (item.category == 1) { item.category = '퇴소 요청' }
                        else if (item.category == 2) { item.category = '이반 요청' }
                        else { item.category = '취소/환불 요청' }
                        dataHtml += `
                    <td class="col-2">${item.category}</td>
                    <td class="col-4">${item.title}</td>
                    <td class="col-4">${item.contents}</td>
                    <td class="col-2"> <button class="custom-control custom-control-inline custom-checkbox" data-bs-toggle="modal"
                    data-bs-target="#answer" onclick="get_question(${item.id},${done_code})">✏️</button> 
                    <button onclick="delete_question(${item.id})">❌</button></td>`;
                    });
                    $('#alim-tr').html(dataHtml);
                }
            })
        }
    })
}

// 과거 코드
function go_back() {
    $('#for_taskban_list').hide();
    $('#for_task_list').show();
}
async function get_consulting() {
    let container = $('#consulting-pagination')
    var category_list = []
    await $.ajax({
        url: '/manage/api/get_consulting',
        type: 'get',
        data: {},
        success: function (data) {
            console.log(data)
            $.each([...JSON.parse(data)], function (idx, val) {
                category_list.push(val.name)
            });
            consultingData = data;
            container.pagination({
                dataSource: JSON.parse(data),
                prevText: '이전',
                nextText: '다음',
                pageSize: 10,
                callback: function (data, pagination) {
                    var dataHtml = '';
                    var idxHtml = `<option value="none">전체</option>`;
                    $.each(data, function (index, consulting) {
                        dataHtml += `
                    <td class="col-3">${consulting.startdate} ~ ${consulting.deadline}</td>
                    <td class="col-2">${consulting.name}</td>
                    <td class="col-1"> 미진행 </td>
                    <td class="col-4"> ${consulting.contents}</td>
                    <td class="col-2">
                        <button class="modal-tbody-btn" onclick="update_consulting(${consulting.id})">✏️</button> 
                        <button class="modal-tbody-btn" onclick="delete_consulting(${consulting.id})">❌</button>
                    </td>`;
                    });
                    category_set = new Set(category_list)
                    category_list = [...category_set]
                    $.each(category_list, function (idx, val) {
                        idxHtml += `<option value="${val}">${val}</option>`
                    })
                    $('#consulting-option').html(idxHtml);
                    $('#tr-row').html(dataHtml);
                }
            })
        },
        error: function (xhr, status, error) {
            alert(xhr.responseText);
        }
    })
}
async function sort_consulting(value) {
    var dataHtml = '';
    let container = $('#consulting-pagination')
    const data = await JSON.parse(consultingData).filter((e) => {
        if (value == 'none') {
            return e.name
        } else {
            return e.name == value;
        }
    })
    await container.pagination({
        dataSource: data,
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        callback: function (data, pagination) {
            console.log(data)
            var dataHtml = '';
            $.each(data, function (index, consulting) {
                dataHtml += `
                    <td class="col-3">${consulting.startdate} ~ ${consulting.deadline}</td>
                    <td class="col-2">${consulting.name}</td>
                    <td class="col-1"> 미진행 </td>
                    <td class="col-4"> ${consulting.contents}</td>
                    <td class="col-2"> <button onclick="update_consulting(${consulting.id})">✏️</button> 
                    <button onclick="delete_consulting(${consulting.id})">❌</button></td>`;
            });
            $('#tr-row').html(dataHtml);
        }
    })
}

async function update_consulting(idx) {
    await $.ajax({
        url: '/manage/api/update_consulting',
        type: 'get',
        data: { 'text': 'good' },
        success: function (data) {
            console.log(data)
        }
    })
}

async function get_task() {
    let container = $('#task-pagination')
    var category_list = []
    await $.ajax({
        url: '/manage/api/get_task',
        type: 'get',
        data: {},
        success: function (data) {
            $.each([...JSON.parse(data)], function (idx, val) {
                category_list.push(val.name)
                // 카테고리의 이름만 저장 
            });
            taskData = JSON.parse(data);
            container.pagination({
                dataSource: JSON.parse(data),
                prevText: '이전',
                nextText: '다음',
                pageSize: 10,
                callback: function (data, pagination) {
                    var dataHtml = '';
                    var idxHtml = `<option value="" selected>카테고리를 선택해주세요</option><option value="none">전체</option>`;
                    $.each(data, function (index, task) {
                        let progress = '';
                        let startdate = new Date(task.startdate)
                        let deadline = new Date(task.deadline)
                        if (today < startdate) {
                            progress = '예정'
                        } else if ((startdate <= today) && (today <= deadline)) {
                            progress = '진행 중'
                        } else {
                            progress = '마감'
                        }
                        dataHtml += `
                    <td class="col-3">${task.startdate} ~ ${task.deadline} (${progress})</td>               
                    <td class="col-3">${task.name}업무</td>          
                    <td class="col-4"> ${task.contents}</td>
                    <td class="col-2">
                        <button class="modal-tbody-btn" onclick="get_taskban(${task.id})">🔍</button>
                        <button class="modal-tbody-btn" onclick="delete_task(${task.id})">❌</button>
                    </td>`;
                    });
                    category_set = new Set(category_list)
                    category_list = [...category_set]
                    $.each(category_list, function (idx, val) {
                        idxHtml += `<option value="${val}">${val}</option>`
                    })
                    $('#task-category-select').html(idxHtml);
                    $('#task-tr').html(dataHtml);
                }
            })

        },
        error: function (xhr, status, error) {
            alert(xhr.responseText);
        }
    })
}

async function sort_task(value) {
    var dataHtml = '';
    let container = $('#task-pagination')
    const data = taskData.filter((e) => {
        if (value == 'none') {
            return e.name
        } else {
            return e.name == value;
        }
    })
    await container.pagination({
        dataSource: data,
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        callback: function (data, pagination) {
            var dataHtml = '';
            var idxHtml = `<option value="none" selected>카테고리를 선택해주세요</option>`;
            $.each(data, function (index, task) {
                let progress = '';
                let startdate = new Date(task.startdate)
                let deadline = new Date(task.deadline)
                if (today < startdate) {
                    progress = '예정'
                } else if ((startdate <= today) && (today <= deadline)) {
                    progress = '진행 중'
                } else {
                    progress = '마감'
                }
                dataHtml += `
                    <td class="col-3">${task.startdate} ~ ${task.deadline} (${progress})</td>              
                    <td class="col-3">${task.name}업무</td>    
                    <td class="col-4"> ${task.contents}</td>
                    <td class="col-2"> <button onclick="get_taskban(${task.id})">✏️</button>
                    <button onclick="delete_task(${task.id})">❌</button></td>`;
            });

            $('#task-tr').html(dataHtml);
        }
    })
}

function get_taskban(task_id) {
    $('#taskModalLabel').html('반 별 진행 내역');
    $('#for_task_list').hide();
    $('#for_taskban_list').show();
    $.ajax({
        type: "GET",
        url: "/manage/taskban/" + task_id,
        data: {},
        success: function (response) {
            let temp_task_ban_box = '';
            for (i = 0; i < response['target_taskban'].length; i++) {
                let target = response['target_taskban'][i]
                let id = target["id"]
                let ban = target["ban"]
                let done = target["done"]
                if (done == 0) {
                    done = '미진행'
                } else {
                    done = '진행완료'
                }
                temp_task_ban_box += `
                <td class="col-4">${ban}</td>
                <td class="col-4">${done}</td>
                <td class="col-4">✖️</td>
                `;
                $('#taskban_list').html(temp_task_ban_box);
            }
        }
    });
}

async function delete_consulting(idx) {
    const csrf = $('#csrf_token').val();
    var con_val = confirm('정말 삭제하시겠습니까?')
    if (con_val == true) {
        await $.ajax({
            url: '/manage/api/delete_consulting/' + idx,
            type: 'get',
            headers: { 'content-type': 'application/json' },
            data: {},
            success: function (data) {
                if (data.status == 200) {
                    alert(`삭제되었습니다.`)
                } else {
                    alert(`실패 ${data.status} ${data.text}`)
                }
            },
            error: function (xhr, status, error) {
                alert(xhr.responseText);
            }
        })
        get_consulting()
    }
}

async function delete_task(idx) {
    var con_val = confirm('정말 삭제하시겠습니까')
    if (con_val == true) {
        await $.ajax({
            url: '/manage/api/delete_task/' + idx,
            type: 'get',
            headers: { 'content-type': 'application/json' },
            data: {},
            success: function (data) {
                if (data.status == 200) {
                    alert(`삭제되었습니다.`)
                } else {
                    alert(`실패 ${data.status} ${data.text}`)
                }
            },
            error: function (xhr, status, error) {
                alert(xhr.responseText);
            }
        })
        get_task()
    }
}

function plusconsulting(student_id, is_done) {
    $.ajax({
        type: "GET",
        url: "/manage/get_consulting_history/" + student_id,
        data: {},
        success: function (response) {
            if (response["consulting_list"] == '없음') {
                $('#consultinghistoryModalLabelt').html('진행 한 상담이 없습니다.')
                //     $('#consulting_list').hide();
                //     let temp_consulting_contents_box = `
                //     <p> 오늘의 상담 업무를 완료했습니다 🎉</p>
                //     `;
                //     $('#consulting_msg').html(temp_consulting_contents_box);
            } else {
                $('#consultinghistoryModalLabelt').html('상담일지 작성')
                $('#consulting_write_box').empty();
                let r_target = response["consulting_list"]
                for (i = 0; i < r_target.length; i++) {
                    let target = r_target[i]
                    let category = target['category']
                    let consulting_id = target['c_id']
                    let contents = target['contents']
                    let consulting_missed = target['consulting_missed']
                    let deadline = target['deadline']
                    if (is_done == 1) {
                        let history_reason = target['history_reason']
                        let history_solution = target['history_solution']
                        let history_result = target['history_result']
                        let history_created = target['history_created']
                        let temp_consulting_contents_box = `
                    <input type="hidden" id="target_consulting_id${i}" value="${consulting_id}" style="display: block;" />
                    <p >✅<strong>${category}</strong></br>${contents}</br>*마감:
                        ~${deadline}까지 | 부재중 : ${consulting_missed}</br></p>
                    <div class="modal-body-select-container">
                        <span class="modal-body-select-label">상담 사유</span>
                        <input class="modal-body-select" type="text" size="50"
                            id="consulting_reason${consulting_id}" style="width: 75%;" placeholder="${history_reason}">
                    </div>
                    <div class="modal-body-select-container">
                        <span class="modal-body-select-label">제공한 가이드</span>
                        <input class="modal-body-select" type="text" size="50"
                            id="consulting_solution${consulting_id}" style="width: 75%;" placeholder="${history_solution}">
                    </div>
                    <div class="modal-body-select-container">
                        <span class="modal-body-select-label">상담 결과</span>
                        <textarea class="modal-body-select" type="text" rows="5" cols="25"
                            id="consulting_result${consulting_id}" style="width: 75%;" placeholder="${history_result}"></textarea>
                    </div>
                    <p>상담 일시 : ${history_created}</p>
                    `;
                        $('#consulting_write_box').append(temp_consulting_contents_box);
                    } else {
                        let temp_consulting_contents_box = `
                    <input type="hidden" id="target_consulting_id${i}" value="${consulting_id}" style="display: block;" />
                    <p >✅<strong>${category}</strong></br>${contents}</br>*마감:
                        ~${deadline}까지 | 부재중 : ${consulting_missed}</br></p>
                    <div class="modal-body-select-container">
                        <span class="modal-body-select-label">상담 사유</span>
                        <input class="modal-body-select" type="text" size="50"
                            id="consulting_reason${consulting_id}" style="width: 75%;">
                    </div>
                    <div class="modal-body-select-container">
                        <span class="modal-body-select-label">제공한 가이드</span>
                        <input class="modal-body-select" type="text" size="50"
                            id="consulting_solution${consulting_id}" style="width: 75%;">
                    </div>
                    <div class="modal-body-select-container">
                        <span class="modal-body-select-label">상담 결과</span>
                        <textarea class="modal-body-select" type="text" rows="5" cols="25"
                            id="consulting_result${consulting_id}" style="width: 75%;"></textarea>
                    </div>
                    `;
                        $('#consulting_write_box').append(temp_consulting_contents_box);
                    }

                }
                let temp_post_box = `
                <p>✔️ 상담 결과 이반 / 취소*환불 / 퇴소 요청이 있었을시 본원 문의 버튼을 통해 승인 요청을 남겨주세요</p>
                    <div class="modal-body-select-container">
                    <span class="modal-body-select-label">부재중</span>
                    <label><input type="checkbox" id="missed">부재중</label>
                    </div>
                    <div class="d-flex justify-content-center mt-4 mb-2" id="consulting_button_box">
                        <button class="btn btn-dark"
                            onclick="post_bulk_consultings(${r_target.length},${is_done})"
                            style="margin-right:5px">저장</button>
                    </div>
                `;
                $('#consulting_write_box').append(temp_post_box);
            }
        }
    });
    // $('#today_consulting_box').show();
}