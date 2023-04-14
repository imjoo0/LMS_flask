// const today = new Date();
var selectedBanList = [];
var selectedStudentList = [];
// 처음 get 할때 뿌려질 정보 보내는 함수 
$(document).ready(function () {
    get_total_data();
    $('.nav-link').on('click', function () {
        $('.nav-link').removeClass('active');
        $(this).addClass('active');
    })

})
async function get_all_question() {
    try {
        const response = await $.ajax({
            url: '/manage/qa',
            type: 'GET',
            data: {},
        })
        questionData = response['question']
        answerData = response['answer']
        attachData = response['attach']
    } catch (error) {
        alert('Error occurred while retrieving data.');
    }
}
async function get_all_consultingcate() {
    try {
        const response = await $.ajax({
            url: '/manage/consulting_category',
            type: 'GET',
            data: {},
        });
        consultingcateData = response['consulting_category']
    } catch (error) {
        alert('Error occurred while retrieving data.');
    }
}
async function get_all_taskcate() {
    try {
        const response = await $.ajax({
            url: '/manage/task_category',
            type: 'GET',
            data: {},
        });
        taskcateData = response['task_category']
    } catch (error) {
        alert('Error occurred while retrieving data.');
    }
}
function main_view() {
    if (!banData) {
        get_total_data()
    }
    $('#qubox').hide()
    $('#sobox').hide()
    $('#ulbox').hide()
    $('#detailban').show()
}

// 이반 * 퇴소 
async function sodata() {
    $('#qubox').hide()
    $('#ulbox').hide()
    $('#detailban').hide()
    $('#sobox').show()
    let container = $('#sob_pagination')
    if (outstudent_num == 0 && switchstudent_num == 0) {
        let no_data_title = '이반 * 퇴소 발생이 없었어요'
        $('#sotitle').html(no_data_title);
        $('#sotable').hide()
        return
    } else {
        $('#sotitle').empty();
        switch_out_bans = banData.filter(e => e.out_num != 0 || e.switch_minus_num != 0)
        container.pagination({
            dataSource: switch_out_bans,
            prevText: '이전',
            nextText: '다음',
            pageClassName: 'float-end',
            pageSize: 5,
            callback: function (switch_out_bans, pagination) {
                var temp_html = '';
                $.each(switch_out_bans, function (index, item) {
                    let student_num = Number(item.student_num)
                    let teacher_name = item.teacher_engname + '( ' + item.teacher_name + ' )'

                    temp_html += `
                    <td class="col-1">${index + 1}위</td>
                    <td class="col-1">${item.name}</td>
                    <td class="col-1">${make_semester(item.semester)}월 학기</td>
                    <td class="col-1">${teacher_name}</td>
                    <td class="col-1">${student_num}</td>
                    <td class="col-1">${student_num - item.switch_plus_num + item.switch_minus_num + item.out_num}</td>
                    <td class="col-1">${item.switch_plus_num}</td>
                    <td class="col-3"> 총: ${item.switch_minus_num + item.out_num}명 ( 퇴소 : ${item.out_num}명 / 이반 : ${item.switch_minus_num}명 )</td>
                    <td class="col-1"><strong>${item.out_num_per} %</strong></td>
                    <td class="col-1" data-bs-toggle="modal" data-bs-target="#teacherinfo" onclick="getTeacherInfo(${item.teacher_id})"><span class="cursor-pointer">👉</td>
                    `;
                });
                $('#static_data1').html(temp_html);
            }
        })
    }
    $('.cs_inloading').show()
    $('.not_inloading').hide()
    if (!questionData) {
        await get_all_question().then(() => {
            $('.cs_inloading').hide()
            $('.not_inloading').show()
        });
    }
    $('.cs_inloading').hide()
    $('.not_inloading').show()
    so_paginating(0)
}
    // 이반 퇴소 문의 관리
function so_paginating(done_code) {
    $('#so_search_input').off('keyup');
    soqData = questionData.filter(q => q.category != 0)
    total_soquestion_num = soqData.length
    sodata_noanswer = total_soquestion_num != 0 ? soqData.filter(a => a.answer == 0).length : 0

    let temp_newso = `
    <td class="col-4">${total_soquestion_num}  건</td>
    <td class="col-4">${total_soquestion_num - sodata_noanswer}  건</td>
    <td class="col-4">${sodata_noanswer}  건</td>`;
    $('#newso').html(temp_newso)

    if (total_soquestion_num != 0) {
        qdata = soqData.length > 0 ? soqData.filter(a => a.answer == done_code) : [];
        if (qdata.length != 0) {
            $('#no_data_msg').hide()
            $('#so_question').show()
            $('#so_pagination').show()

            var paginationOptions = {
                prevText: '이전',
                nextText: '다음',
                pageSize: 5,
                pageClassName: 'float-end',
                callback: function (data, pagination) {
                    var dataHtml = '';
                    $.each(data, function (index, item) {
                        ban = banData.filter(b => b.ban_id == item.ban_id)[0]
                        item.ban_name = ban.name
                        item.teacher_name = ban.teacher_engname + '( ' + ban.teacher_name + ' )'
                        let category = q_category(item.category)
                        dataHtml += `
                      <td class="col-1">${category}</td>
                      <td class="col-1">${item.ban_name}</td>
                      <td class="col-2">${item.teacher_name}</td>
                      <td class="col-2">${item.title}</td>
                      <td class="col-4">${item.contents}</td>
                      <td class="col-1 custom-control custom-control-inline custom-checkbox" data-bs-toggle="modal" data-bs-target="#soanswer" onclick="get_soquestion_detail(${item.id},${done_code})">✏️</td>
                      <td class="col-1" onclick="delete_question(${item.id})">❌</td>
                    `;
                    });
                    $('#so_tr').html(dataHtml);
                }
            };

            var container = $('#so_pagination');

            container.pagination(Object.assign(paginationOptions, { 'dataSource': qdata }))

            $('#so_search_input').on('keyup', function () {
                var searchInput = $(this).val().toLowerCase();
                var filteredData = qdata.filter(function (data) {
                    return data.hasOwnProperty('ban_name') && data.ban_name.toLowerCase().indexOf(searchInput) !== -1;
                });
                container.pagination('destroy');
                container.pagination(Object.assign(paginationOptions, { 'dataSource': filteredData }));
            });
        } else {
            $('#so_question').hide()
            $('#so_pagination').hide()
            let temp_nodatamasg = $(`#question_view option[value="${done_code}"]`).text() + '이 없습니다';
            $('#no_data_msg').html(temp_nodatamasg)
            $('#no_data_msg').show()
        }
    } else {
        $('#so_question').hide()
        $('#so_pagination').hide()
        $('#no_data_msg').html('이반 / 퇴소 요청이 없었습니다')
        $('#no_data_msg').show()
    }
}
    // 이반 퇴소 요청 내용 상세보기
async function get_soquestion_detail(q_id, done_code) {
    $('.cs_inloading').show()
    $('.not_inloading').hide()
    if (!studentsData && !consultingData) {
        await get_all_students()
        await get_all_consulting().then(() => {
            $('.cs_inloading').hide()
            $('.not_inloading').show()
        });
    } else if (!studentsData && consultingData) {
        await get_all_students().then(() => {
            $('.cs_inloading').hide()
            $('.not_inloading').show()
        });
    } else if (studentsData && !consultingData) {
        await get_all_consulting().then(() => {
            $('.cs_inloading').hide()
            $('.not_inloading').show()
        });
    }
    $('.cs_inloading').hide()
    $('.not_inloading').show()
    $('#consulting_history_attach').hide()
    $('#manage_answer').hide()
    question_detail_data = questionData.filter(q => q.id == q_id)[0]
    student_data = studentsData.filter(s => s.student_id == question_detail_data.student_id)[0]
    attach = attachData.filter(a => a.question_id == q_id)[0]['file_name']
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
        <p>${make_date(question_detail_data.create_date)}</p>
    </div>
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">대상 반</span>
        <p>${question_detail_data.ban_name} ➖ 담임 T : ${question_detail_data.teacher_name} </p>
    </div>
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">학생</span>
        <p>${student_data.student_name} ( *${student_data.student_engname} 원번: ${student_data.origin} )</p>
    </div>
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">첨부파일</span>
        <a href="/common/downloadfile/question/${q_id}" download="${attach}">${attach}</a>
    </div>`;
    $('#teacher_question').html(temp_question_list);
    // 상담 일지 처리 
    let consulting_history = consultingData.filter(c => c.id == question_detail_data.consulting_history)
    let temp_his = ''
    if (consulting_history.length != 0) {
        let category = ''
        if (consulting_history[0].category_id < 100) {
            category = `${consulting_history[0].week_code}주간 ${consulting_history[0].category}상담`
        } else {
            category = `${consulting_history[0].category} ${consulting_history[0].contents}`
        }
        temp_his = `
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">상담 종류</span>
            <p>${category}</p>
        </div>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">상담 사유</span>
            <p>${consulting_history[0].reason}</p>
        </div>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">제공한 가이드</span>
            <p>${consulting_history[0].solution}</p>
        </div>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">상담 결과</span>
            <p>${consulting_history[0].result}</p>
        </div>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">상담 일시</span>
            <p>${make_date(consulting_history[0].created_at)}</p>
        </div>
        `;
    } else {
        temp_his = `
        <p> 상담내역이 없습니다 </p>
        `;
    }
    $('#cha').html(temp_his);
    $('#consulting_history_attach').show()

    // 응답 처리 
    if (done_code == 0) {
        $('#teacher_answer').hide()
        $('#manage_answer').show()
        $('#manage_answer_1').show()
        if (question_detail_data.category == 1) {
            $('#manage_answer_2').hide()
            $('#manage_answer_3').show()
        } else {
            let temp_o_ban_id = '<option value="none" selected>이반 처리 결과를 선택해주세요</option><option value=0>반려</option>'
            banData.forEach(ban_data => {
                let value = `${ban_data.id}_${ban_data.teacher_id}_${ban_data.name}`;
                let selectmsg = `<option value="${value}">${ban_data.name} (${make_semester(ban_data.semester)}월 학기)</option>`;
                temp_o_ban_id += selectmsg
            });
            $('#o_ban_id2').html(temp_o_ban_id)
            $('#manage_answer_2').show()
            $('#manage_answer_3').hide()
        }
        $('#button_box').html(`<button class="btn btn-success" type="submit" onclick="post_answer(${q_id},${question_detail_data.category})">저장</button>`);
    } else {
        $('#manage_answer').hide()
        answer_data = answerData.filter(a => a.question_id == q_id)[0]
        let temp_answer_list = `
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">답변 제목</span>
            <p>${answer_data.title}</p>
        </div>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">답변 내용</span>
            <p>${answer_data.content}</p>
        </div>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">응답일</span>
            <p>${make_date(answer_data.created_at)}</p>
        </div>
        <div class="modal-body-select-container">
           <span class="modal-body-select-label">처리</span>
           <p>${make_reject_code(answer_data.reject_code)}</p>
        </div>
        `;
        $('#teacher_answer').html(temp_answer_list);
        $('#teacher_answer').show()
    }
}
// 일반 문의 
async function csdata() {
    $('#detailban').hide()
    $('#sobox').hide()
    $('#ulbox').hide()
    $('#qubox').show()

    $('.cs_inloading').show()
    $('.not_inloading').hide()
    if (!questionData) {
        await get_all_question().then(() => {
            $('.cs_inloading').hide()
            $('.not_inloading').show()
        });
    }
    $('.cs_inloading').hide()
    $('.not_inloading').show()
    paginating(0)
}
function paginating(done_code) {
    $('#cs_search_input').off('keyup');
    csqData = questionData.filter(q => q.category == 0)
    total_question_num = csqData.length
    csdata_noanswer = total_question_num != 0 ? csqData.filter(a => a.answer == 0).length : 0

    let temp_newcs = `
    <td class="col-4">${total_question_num}  건</td>
    <td class="col-4">${total_question_num - csdata_noanswer}  건</td>
    <td class="col-4">${csdata_noanswer}  건</td>
    `;
    $('#newcs').html(temp_newcs)

    if (total_question_num != 0) {
        qdata = csqData.length > 0 ? csqData.filter(a => a.answer == done_code) : [];
        if (qdata.length != 0) {
            $('#csno_data_msg').hide()
            $('#cs_teacher_question').show()
            $('#pagination').show()
            var paginationOptions = {
                prevText: '이전',
                nextText: '다음',
                pageSize: 5,
                pageClassName: 'float-end',
                callback: function (data, pagination) {
                  var dataHtml = '';
                  $.each(data, function (index, item) {
                    ban = banData.filter(b=>b.ban_id == item.ban_id)[0]
                    item.ban_name = ban.name
                    item.teacher_name = ban.teacher_engname+'( '+ban.teacher_name+' )'
                    dataHtml += `
                    <td class="col-1">일반문의</td>
                    <td class="col-1">${item.ban_name}</td>
                    <td class="col-2">${item.teacher_name}</td>
                    <td class="col-2">${item.title}</td>
                    <td class="col-4">${item.contents}</td>
                    <td class="col-1 custom-control custom-control-inline custom-checkbox" data-bs-toggle="modal" data-bs-target="#soanswer" onclick="get_question_detail(${item.id},${done_code})">✏️</td>
                    <td class="col-1" onclick="delete_question(${item.id})">❌</td>
                    `;
                  });
                  $('#alim_tr').html(dataHtml);
                }
            };
            var container = $('#pagination');
            container.pagination(Object.assign(paginationOptions, {'dataSource': qdata}));
            
            $('#cs_search_input').on('keyup', function() {
                var searchInput = $(this).val().toLowerCase();
                var filteredData = qdata.filter(function(data) {
                    return data.hasOwnProperty('ban_name') && data.ban_name.toLowerCase().indexOf(searchInput) !== -1;
                });
                container.pagination('destroy');
                container.pagination(Object.assign(paginationOptions, {'dataSource': filteredData}));
            });
              
        } else {
            $('#cs_teacher_question').hide()
            $('#pagination').hide()
            let temp_nodatamasg = $(`#cs_question_view option[value="${done_code}"]`).text() + '가 없습니다';
            $('#csno_data_msg').html(temp_nodatamasg)
            $('#csno_data_msg').show()
        }
    } else {
        $('#cs_teacher_question').hide()
        $('#pagination').hide()
        $('#csno_data_msg').html('문의가 없습니다')
        $('#csno_data_msg').show()
    }
}
    // 일반 문의 상세보기
async function get_question_detail(q_id, done_code) {
    $('.cs_inloading').show()
    $('.not_inloading').hide()
    if (!studentsData) {
        await get_all_students().then(() => {
            $('.cs_inloading').hide()
            $('.not_inloading').show()
        });
    }
    $('.cs_inloading').hide()
    $('.not_inloading').show()

    $('#consulting_history_attach').hide()
    $('#manage_answer').hide()
    question_detail_data = questionData.filter(q => q.id == q_id)[0]
    student_data = studentsData.filter(s => s.student_id == question_detail_data.student_id)[0]
    attach = attachData.filter(a => a.question_id == q_id)[0]['file_name']
    // 문의 상세 내용 
    let temp_question_list = `
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">문의 종류</span>
        <p>일반문의</p>
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
        <p>${make_date(question_detail_data.create_date)}</p>
    </div>
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">대상 반</span>
        <p>${question_detail_data.ban_name} ➖ 담임 T : ${question_detail_data.teacher_name} </p>
    </div>
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">학생</span>
        <p>${student_data.student_name} ( *${student_data.student_engname} 원번: ${student_data.origin} )</p>
    </div>
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">첨부파일</span>
        <a href="/common/downloadfile/question/${q_id}" download="${attach}">${attach}</a>
    </div>`;
    $('#teacher_question').html(temp_question_list);

    // 응답 처리 
    if (done_code == 0) {
        $('#teacher_answer').hide()
        $('#manage_answer').show()
        $('#manage_answer_1').show()
        $('#manage_answer_2').hide()
        $('#manage_answer_3').hide()
        $('#button_box').html(`<button class="btn btn-success" type="submit" onclick="post_answer(${q_id},${question_detail_data.category})">저장</button>`);
    } else {
        $('#manage_answer').hide()
        answer_data = answerData.filter(a => a.question_id == q_id)[0]
        let temp_answer_list = `
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">답변 제목</span>
            <p>${answer_data.title}</p>
        </div>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">답변 내용</span>
            <p>${answer_data.content}</p>
        </div>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">응답일</span>
            <p>${make_date(answer_data.created_at)}</p>
        </div>`;
        $('#teacher_answer').html(temp_answer_list);
        $('#teacher_answer').show()
    }

}
    // 본원 답변 기능 
function post_answer(q_id, category) {
    answer_title = $('#answer_title').val()
    answer_contents = $('#answer_contents').val()
    o_ban_id = 0
    if (category != 0) {
        o_ban_id = $('#o_ban_id' + category).val()
    }
    $.ajax({
        type: "POST",
        url: "/manage/answer/" + q_id,
        data: {
            answer_title: answer_title,
            answer_contents: answer_contents,
            o_ban_id: o_ban_id
        },
        success: function (response) {
            {
                alert(response["result"])
                window.location.reload()
            }
        }
    });
}

// 미학습 (학습관리)
async function uldata() {
    $('#qubox').hide()
    $('#sobox').hide()
    $('#detailban').hide()
    $('#ulbox').show()
    let container = $('#ul_pagination')
    $('.cs_inloading').show()
    $('.not_inloading').hide()
    if (!studentsData && !consultingData) {
        await get_all_students()
        await get_all_consulting().then(() => {
            $('.cs_inloading').hide()
            $('.not_inloading').show()
        });
    } else if (!studentsData && consultingData) {
        await get_all_students().then(() => {
            $('.cs_inloading').hide()
            $('.not_inloading').show()
        });
    } else if (studentsData && !consultingData) {
        await get_all_consulting().then(() => {
            $('.cs_inloading').hide()
            $('.not_inloading').show()
        });
    }
    $('.cs_inloading').hide()
    $('.not_inloading').show()
    all_uc_consulting = consultingData[0].total_unlearned_consulting
    studentsData.forEach((elem) => {
        elem.unlearned = consultingData.filter(a => a.student_id == elem.student_id && a.category_id < 100).length
        elem.up = answer_rate(elem.unlearned, all_uc_consulting).toFixed(2)
    });
    studentsData.sort((a, b) => {
        if (b.up !== a.up) {
            return b.up - a.up;
        } else {
            return b.unlearned - a.unlearned; // students.length가 큰 순으로 정렬
        }
    });

    if (studentsData.length == 0) {
        let no_data_title = `<h1> ${response.text} </h1>`
        $('#ultitle').html(no_data_title);
        $('#ul_data_box').hide()
        $('#ul_pagination').hide()
        return
    }
    $('#ultitle').empty();
    $('#ul_data_box').show()
    $('#ul_pagination').show()
    container.pagination({
        dataSource: studentsData,
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        callback: function (studentsData, pagination) {
            var dataHtml = '';
            $.each(studentsData, function (index, student) {
                consultings = consultingData.filter(c => c.category_id < 100 && c.student_id == student.student_id)
                unlearned_ixl = make_nodata(consultings.filter(a => a.category_id == 1).length)
                unlearned_reading = make_nodata(consultings.filter(a => a.category_id == 4).length)
                unlearned_speacial = make_nodata(consultings.filter(a => a.category_id == 3).length)
                unlearned_writing = make_nodata(consultings.filter(a => a.category_id == 6).length)
                unlearned_homepage = make_nodata(consultings.filter(a => a.category_id == 2).length)
                unlearned_intoreading = make_nodata(consultings.filter(a => a.category_id == 5 || a.category_id == 7).length)

                dataHtml += `
                <td class="col-1">${student.ban_name}</td>
                <td class="col-1">${student.origin}</td>
                <td class="col-1">${student.student_name}</br>( ${student.student_engname} )</td>
                <td class="col-1">${student.pname}</br>( ${student.pmobileno} )</td>
                <td class="col-1">${unlearned_ixl}</td>
                <td class="col-1">${unlearned_reading}</td>
                <td class="col-1">${unlearned_speacial}</td>
                <td class="col-1">${unlearned_intoreading}</td>
                <td class="col-1">${unlearned_writing}</td>
                <td class="col-1">${unlearned_homepage}</td>
                <td class="col-1">${student.unlearned}건 (${student.up}%) </td>
                <td class="col-1 custom-control custom-control-inline custom-checkbox" data-bs-toggle="modal" data-bs-target="#consultinghistory" onclick="get_consulting_history(${student.student_id})">📝</td>`;
            });
            $('#static_data2').html(dataHtml);
        }
    })
    $('#search-input').on('keyup', function () {
        var searchInput = $(this).val().toLowerCase();
        var filteredData = studentsData.filter(function (student) {
            return student.student_name.toLowerCase().indexOf(searchInput) !== -1 || student.origin.toLowerCase().indexOf(searchInput) !== -1 || student.ban_name.toLowerCase().indexOf(searchInput) !== -1;
        });
        container.pagination('destroy');
        container.pagination({
            dataSource: filteredData,
            prevText: '이전',
            nextText: '다음',
            pageSize: 10,
            callback: function (filteredData, pagination) {
                var dataHtml = '';
                $.each(filteredData, function (index, student) {
                    consultings = consultingData.filter(c => c.category_id < 100 && c.student_id == student.student_id)
                    unlearned_ixl = make_nodata(consultings.filter(a => a.category_id == 1).length)
                    unlearned_reading = make_nodata(consultings.filter(a => a.category_id == 4).length)
                    unlearned_speacial = make_nodata(consultings.filter(a => a.category_id == 3).length)
                    unlearned_writing = make_nodata(consultings.filter(a => a.category_id == 6).length)
                    unlearned_homepage = make_nodata(consultings.filter(a => a.category_id == 2).length)
                    unlearned_intoreading = make_nodata(consultings.filter(a => a.category_id == 5 || a.category_id == 7).length)

                    dataHtml += `
                    <td class="col-1">${student.ban_name}</td>
                    <td class="col-1">${student.origin}</td>
                    <td class="col-1">${student.student_name}</br>( ${student.student_engname} )</td>
                    <td class="col-1">${student.pname}</br>( ${student.pmobileno} )</td>
                    <td class="col-1">${unlearned_ixl}</td>
                    <td class="col-1">${unlearned_reading}</td>
                    <td class="col-1">${unlearned_speacial}</td>
                    <td class="col-1">${unlearned_intoreading}</td>
                    <td class="col-1">${unlearned_writing}</td>
                    <td class="col-1">${unlearned_homepage}</td>
                    <td class="col-1">${student.unlearned}건 (${student.up}%) </td>
                    <td class="col-1 custom-control custom-control-inline custom-checkbox" data-bs-toggle="modal" data-bs-target="#consultinghistory" onclick="get_consulting_history(${student.student_id})">📝</td>`;
                });
                $('#static_data2').html(dataHtml);
            }
        })
    });

}

// 상담 기록 조회 
function get_consulting_history(s_id) {
    student_info = studentsData.filter(s => s.student_id == s_id)[0]
    consultings = consultingData.filter(c => c.student_id == s_id)
    done_consultings = consultings.filter(c => c.done == 1)
    notdone_consultings = consultings.filter(c => c.done == 0)
    consultinglist_len = consultings.length
    $('#consultinghistoryModalLabelt').html(`${student_info.ban_name}반 ${student_info.student_name} ( ${student_info.student_engname} *${student_info.origin} )원생 총 ${consultings.length}건 상담`)
    let cant_consulting_list = notdone_consultings.length > 0 ? notdone_consultings.filter(c => c.created_at != null) : 0;
    consultings = consultinglist_len > 0 ? notdone_consultings.filter(c => c.created_at == null) : 0

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
// 업무 요청 관련 함수 
async function request_task() {
    $('#taskban_search_input').off('keyup');
    $('.mo_inloading').show()
    $('.monot_inloading').hide()
    if (!taskcateData) {
        // await get_all_students()
        await get_all_taskcate().then(() => {
            $('.mo_inloading').hide()
            $('.monot_inloading').show()
        });
    }
    $('.mo_inloading').hide()
    $('.monot_inloading').show()

    $("#task_date").datepicker({ dateFormat: 'yy-mm-dd' });
    $("#task_deadline").datepicker({ dateFormat: 'yy-mm-dd' });

    let temp_ban_option = '<option value=0 selected>반을 선택해주세요</option>';
    banData.forEach(ban_data => {
        let value = `${ban_data.ban_id}_${ban_data.teacher_id}_${ban_data.name}`;
        temp_ban_option += `<option value="${value}">${ban_data.name} (${make_semester(ban_data.semester)}월 학기)</option>`;
    });
    $('#task_target_ban').html(temp_ban_option)

    let temp_task_category_list = '<option value=0 selected>업무 카테고리를 선택해주세요</option>';
    taskcateData.forEach(task_data => {
        temp_task_category_list += `<option value="${task_data.id}">${task_data.name}</option>`;
    });
    $('#task_category_list').html(temp_task_category_list)
    
    $('#taskban_search_input').on('keyup', function () {
        let temp_ban_option = '<option value=0 selected>반을 선택해주세요</option>';
        var searchInput = $(this).val().toLowerCase();
        var filteredData = banData.filter(function (data) {
            return (data.hasOwnProperty('name') && data.name.toLowerCase().indexOf(searchInput) !== -1) || (data.hasOwnProperty('teacher_name') && data.teacher_name.toLowerCase().indexOf(searchInput) !== -1) || (data.hasOwnProperty('teacher_engname') && data.teacher_engname.toLowerCase().indexOf(searchInput) !== -1);
        });
        filteredData.forEach(ban_data => {
            let value = `${ban_data.ban_id}_${ban_data.teacher_id}_${ban_data.name}`;
            temp_ban_option +=  `<option value="${value}">${ban_data.name} (${make_semester(ban_data.semester)}월 학기)</option>`;
        });
        $('#task_target_ban').html(temp_ban_option)
    });
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
async function request_consulting(){
    $('#consultingban_search_input').off('keyup');
    $('.mo_inloading').show()
    $('.monot_inloading').hide()
    if (!consultingcateData && studentsData) {
        // await get_all_students()
        await get_all_consultingcate().then(() => {
            $('.mo_inloading').hide()
            $('.monot_inloading').show()
        });
    }else if(consultingcateData && !studentsData){
        await get_all_students().then(() => {
            $('.mo_inloading').hide()
            $('.monot_inloading').show()
        });
    }else if(!consultingcateData && !studentsData){
        await get_all_students()
        await get_all_consultingcate().then(() => {
            $('.mo_inloading').hide()
            $('.monot_inloading').show()
        });
    }
    $('.mo_inloading').hide()
    $('.monot_inloading').show()

    $('#result_tbox').empty()
    $('#select_student').hide()
    $("#consulting_date").datepicker({ dateFormat: 'yy-mm-dd' });
    $("#consulting_deadline").datepicker({ dateFormat: 'yy-mm-dd' });
    
    let temp_consulting_category_list = '<option value=0 selected>상담카테고리를 선택해주세요</option>';
    consultingcateData.forEach(cate_data => {
        temp_consulting_category_list += `<option value="${cate_data.id}">${cate_data.name}</option>`;
    });
    $('#consulting_category_list').html(temp_consulting_category_list)

    let temp_ban_option = '<option value=0 selected>반을 선택해주세요</option>';
    banData.forEach(ban_data => {
        let value = `${ban_data.ban_id}_${ban_data.teacher_id}_${ban_data.name}`;
        temp_ban_option += `<option value="${value}">${ban_data.name} (${make_semester(ban_data.semester)}월 학기)</option>`;
    });
    $('#consulting_target_ban').html(temp_ban_option)

    $('#consultingban_search_input').on('keyup', function () {
        let temp_ban_option = '<option value=0 selected>반을 선택해주세요</option>';
        var searchInput = $(this).val().toLowerCase();
        var filteredData = banData.filter(function (data) {
            return (data.hasOwnProperty('name') && data.name.toLowerCase().indexOf(searchInput) !== -1) || (data.hasOwnProperty('teacher_name') && data.teacher_name.toLowerCase().indexOf(searchInput) !== -1) || (data.hasOwnProperty('teacher_engname') && data.teacher_engname.toLowerCase().indexOf(searchInput) !== -1);
        });
        filteredData.forEach(ban_data => {
            let value = `${ban_data.ban_id}_${ban_data.teacher_id}_${ban_data.name}`;
            temp_ban_option += `<option value="${value}">${ban_data.name} (${make_semester(ban_data.semester)}월 학기)</option>`;
        });
        $('#consulting_target_ban').html(temp_ban_option)
    });
    
}
async function ban_change(btid) {
    // 다중 반 처리
    if (btid.includes('_')) {
        $('#select_student').show()
        $('#consulting_msg').html('👇 개별 반 대상 진행합니다 (대상 학생을 확인해 주세요)')
        value = btid.split('_')
        // ban_id _ teacher_id _ name 
        
        selectedbanSData = studentsData.filter(a => a.ban_id == value[0])
        console.log(studentsData)
        let temp_target_student = `<option value="${btid}_-1_전체 학생 대상 진행">✔️${value[2]}반 전체 학생 대상 진행</option>`;
        selectedbanSData.forEach(student_data => {
            temp_target_student += `<option value="${btid}_${student_data.student_id}_${student_data.student_name}"> ${student_data.student_name} ( ${student_data.student_engname} )</option>`;
        });
        $('#consulting_target_students').html(temp_target_student)

        $('#consultingstudent_search_input').on('keyup', function () {
            let temp_target_student = `<option value="${btid}_-1_전체 학생 대상 진행">✔️${value[2]}반 전체 학생 대상 진행</option>`;
            var searchInput = $(this).val().toLowerCase();
            var filteredData = selectedbanSData.filter(function (data) {
                return (data.hasOwnProperty('student_name') && data.student_name.toLowerCase().indexOf(searchInput) !== -1) || (data.hasOwnProperty('origin') && data.origin.toLowerCase().indexOf(searchInput) !== -1) || (data.hasOwnProperty('student_engname') && data.student_engname.toLowerCase().indexOf(searchInput) !== -1);
            });
            filteredData.forEach(student_data => {
                temp_target_student += `<option value="${btid}_${student_data.student_id}_${student_data.student_name}"> ${student_data.student_name} ( ${student_data.student_engname} )</option>`;
            });
            $('#consulting_target_students').html(temp_target_student)
        });

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
    // 다중 선택 대상 선택일 경우  )
    if (selectedStudentList.length != 0) {
        let total_student_selections = selectedStudentList.filter(value => value.includes('-1'));
        const totalPromises = [];
        // 전체 학생 대상 인 경우
        if (total_student_selections.length != 0) {
            total_student_selections.forEach(value => {
                v = value.split('_')
                totalstudent_ban_id = Number(v[0])
                totalstudent_teacher_id = Number(v[1])
                target_student_selections = allData.filter(a => a.ban_id == totalstudent_ban_id)[0]['students']
                target_student_selections.forEach(value => {
                    const promise = $.ajax({
                        type: "POST",
                        url: '/manage/consulting/' + totalstudent_ban_id + '/' + totalstudent_teacher_id + '/' + value['student_id'],
                        // data: JSON.stringify(jsonData), // String -> json 형태로 변환
                        data: {
                            consulting_category: consulting_category,
                            consulting_contents: consulting_contents,
                            consulting_date: consulting_date,
                            consulting_deadline: consulting_deadline
                        }
                    })
                    totalPromises.push(promise);
                })
            })
        }
        // 개별 학생 대상 인 경우  
        let indivi_student_selections = selectedStudentList.filter(value => !(value.includes('-1')));
        if (indivi_student_selections.length != 0) {
            indivi_student_selections.forEach(value => {
                v = String(value).split('_')
                const promise = $.ajax({
                    type: "POST",
                    url: '/manage/consulting/' + v[0] + '/' + v[1] + '/' + v[3],
                    // data: JSON.stringify(jsonData), // String -> json 형태로 변환
                    data: {
                        consulting_category: consulting_category,
                        consulting_contents: consulting_contents,
                        consulting_date: consulting_date,
                        consulting_deadline: consulting_deadline
                    }
                })
                totalPromises.push(promise);
            })
        }
        Promise.all(totalPromises).then((responses) => {
            let isSuccess = true;
            responses.forEach(response => {
                if (response['result'] !== 'success') {
                    isSuccess = false;
                }
            })
            if (isSuccess) {
                alert('상담 요청 완료');
                window.location.reload();
            } else {
                alert('상담 요청 실패');
            }
        })
    } else {
        b_type = $('#consulting_target_aban').val()[0]
        // b_type에 따라 전체 학생, 플러스/알파반, NF/NOVEL반으로 구분하여 API 호출
        b_type = $('#consulting_target_aban').val()[0]
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

// 요청 상담 관리 기능 
async function get_request_consulting(){
    $('#my_consulting_requestModalLabel').html('요청한 상담 목록');
    $('.mo_inloading').show()
    $('.not_inloading').hide()
    if (!consultingData){
        await get_all_consulting().then(() => {
            // 컨설팅 정보로 
            requeConsultings = consultingData.filter(c=>c.category_id > 100)
            const consultingGrouped = requeConsultings.reduce((acc, item) => {
                const v = `${item.category}_${item.contents}_${item.startdate}_${item.deadline}`;
            
                if (!acc[v]){
                acc[v] = { bans: []};
                }
            
                acc[v].bans.push(
                    item.reduce((acc, ban) => {
                        if (!acc[ban.ban_id]){
                            acc[v] = { done: []};
                        }
                    
                        acc[v].done.push(
                            ban.done
                        );
                    
                        return acc;
                    }, {})
                );
                return acc;
            }, {});
            // 결과를 객체의 배열로 변환 -> 상담 별 배열 
            consultingGroupedresult = Object.entries(consultingGrouped).map(([v, items]) => {
                return { [v]: items };
            });
            console.log(consultingGroupedresult)
            $('.mo_inloading').hide()
            $('.not_inloading').show()
            $('#request_consulting_listbox').show()
            $('#request_consultingban_listbox').hide()
        });
    }else{
        requeConsultings = consultingData.filter(c=>c.category_id > 100)
        const consultingGrouped = requeConsultings.reduce((acc, item) => {
            const v = `${item.category}_${item.contents}_${item.startdate}_${item.deadline}`;
          
            if (!acc[v]){
              acc[v] = { bans: []};
            }
          
            acc[v].bans.push(item);
          
            return acc;
        }, {});

        // 결과를 객체의 배열로 변환 -> 상담 별 배열 
        consultingGroupedresult = Object.entries(consultingGrouped).map(([v, items]) => {
            return { [v]: items };
        });
        $('.mo_inloading').hide()
        $('.not_inloading').show()
        $('#request_consulting_listbox').show()
        $('#request_consultingban_listbox').hide()
    }
    let container = $('#consulting-pagination')

    var category_list = []
    container.pagination({
        dataSource: consultingGroupedresult,
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        callback: function (consultingGroupedresult, pagination) {
            var idxHtml = `<option value="none">전체</option>`;
            var dataHtml = '';
            $.each(consultingGroupedresult, function (index, consulting) {
                let key = Object.keys(consulting)[0]
                let consulting_info = key.split('_')
                category_list.push(consulting_info[0])
                dataHtml += `
                    <td class="col-1"> ${make_duedate(consulting_info[2],consulting_info[3])}</td>
                    <td class="col-3">"${consulting_info[2]}" ~ "${consulting_info[3]}"</td>
                    <td class="col-2">${consulting_info[0]}</td>
                    <td class="col-5"> ${consulting_info[1]}</td>
                    <td class="col-1" onclick ="get_consultingban('${key}')"> ✏️ </td>`;
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
}

function get_consultingban(key){
    $('consultingreqban_search_input').off('keyup');
    result = consultingGroupedresult.filter(c=>c[key])[0].bans.reduce((acc, item) => {
        if (!acc[item.ban_id]){
          acc[item.ban_id] = { students: []};
        }
        acc[item.ban_id].students.push(item);
        return acc;
    }, {});
    target_bans = Object.entries(result).map(([v, items]) => {
        return { [v]: items };
    });
    cinfo =  key.split('_')
    $('#my_consulting_requestModalLabel').html(cinfo[0]+' | "'+cinfo[1]+'" 상담을 진행중인 반 목록');
    $('#request_consulting_listbox').hide()
    $('#request_consultingban_listbox').show()

    var paginationOptions = {
        prevText: '이전',
        nextText: '다음',
        pageSize: 5,
        pageClassName: 'float-end',
        callback: function (data, pagination) {
            var dataHtml = '';
            $.each(data, function (index, item) {
                let key = Number(Object.keys(item)[0])
                baninfo = banData.filter(b=>b.ban_id == key)[0]
                item[key].ban_name = baninfo.name
                item[key].teacher_name = baninfo.teacher_name
                item[key].teacher_engname = baninfo.teacher_engname
                item[key].teacher_mobileno = baninfo.teacher_mobileno
                item[key].teacher_email = baninfo.teacher_email
                total_c =  item[key].students.length
                done_c = item[key].students.filter(s=>s.done == 1).length
                dataHtml += `
                    <td class="col-2">${item[key].ban_name}</td>
                    <td class="col-2">${item[key].teacher_name}( ${item[key].teacher_engname} )</td>
                    <td class="col-2">${item[key].teacher_mobileno}</td>
                    <td class="col-2">${item[key].teacher_email}</td>
                    <td class="col-3">${done_c}/${total_c} <strong> (${answer_rate(done_c,total_c).toFixed(0)}%)</strong></td>
                    <td class="col-1"><button class="modal-tbody-btn" onclick="delete_consulting(${item[key].id})">🗑️</button></td>`;
            });
            $('#consultingbandone').html(dataHtml);
        }
    };

    var container = $('#consultingban_pagination');
    container.pagination(Object.assign(paginationOptions, {'dataSource': target_bans }))

    console.log(target_bans)
    var filteredData = target_bans.filter(function (data) {
        console.log(data)
        let key = Object.keys(data)[0]
        console.log(data[key])
        console.log(data[key].ban_name)
    });
    console.log(filteredData)

    $('consultingreqban_search_input').on('keyup', function () {
        var searchInput = $(this).val().toLowerCase();
        var filteredData = target_bans.filter(function (data) {
            let key = Object.keys(data)[0]
            return data[key].hasOwnProperty('ban_name') && data[key].ban_name.toLowerCase().indexOf(searchInput) !== -1 || data[key].hasOwnProperty('teacher_name') && data[key].teacher_name.toLowerCase().indexOf(searchInput) !== -1 || data[key].hasOwnProperty('teacher_engname') && data[key].teacher_engname.toLowerCase().indexOf(searchInput) !== -1;
        });
        container.pagination('destroy');
        container.pagination(Object.assign(paginationOptions, { 'dataSource': filteredData }));
    });

}

function go_back() {
    $('#request_consultingban_listbox').hide();
    $('#request_consulting_listbox').show();
    $('#my_consulting_requestModalLabel').html('요청한 상담 목록');
}  
async function sort_consulting(value) {
    let container = $('#consulting-pagination')
    container.pagination({
        dataSource: consultingGroupedresult,
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        callback: function (consultingGroupedresult, pagination) {
            var dataHtml = '';
            $.each(consultingGroupedresult, function (index, consulting) {
                let key = Object.keys(consulting)[0]
                if(key.includes(value) || value =="none"){
                    let consulting_info = key.split('_')
                    dataHtml += `
                    <td class="col-1"> ${make_duedate(consulting_info[2],consulting_info[3])}</td>
                    <td class="col-3">${consulting_info[2]} ~ ${consulting_info[3]}</td>
                    <td class="col-2">${consulting_info[0]}</td>
                    <td class="col-5"> ${consulting_info[1]}</td>
                    <td class="col-1" onclick ="get_consultingban('${key}')"> ✏️ </td>`;
                }
            });
            $('#tr-row').html(dataHtml);
        }
    })
}

// 과거 코드
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