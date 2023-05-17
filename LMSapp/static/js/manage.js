// const today = new Date();
var selectedBanList = [];
var selectedStudentList = [];
// API 호출 
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
// 처음 get 할때 뿌려질 정보 보내는 함수 
$(document).ready(function () {
    $('.nav-link').on('click', function () {
        $('.nav-link').removeClass('active');
        $(this).addClass('active');
    })
})
$(window).on('load', async function () {
    try {
        await get_total_data();
    } catch (error) {
        alert('Error occurred while retrieving data.');
    }
});

function main_view() {
    $('#qubox').hide()
    $('#Tqubox').hide()
    $('#inTqubox').hide()
    $('#sobox').hide()
    $('#ulbox').hide()
    $('#detailban').show()
}

// 이반 * 퇴소 
async function sodata() {
    $('#qubox').hide()
    $('#Tqubox').hide()
    $('#inTqubox').hide()
    $('#ulbox').hide()
    $('#detailban').hide()
    $('#sobox').show()
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
    soqData = questionData.filter(q => q.category != 0 && q.category != 4 && q.category != 5)
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
                pageSize: 10,
                pageClassName: 'float-end',
                callback: function (data, pagination) {
                    var dataHtml = '';
                    $.each(data, function (index, item) {
                        ban = banData.filter(b => b.ban_id == item.ban_id)[0]
                        item.ban_name = ban.name
                        item.teacher_name = ban.teacher_engname + '( ' + ban.teacher_name + ' )'
                        let category = q_category(item.category)
                        let contents = item.contents
                        if(contents && contents.length > 30) {
                            contents = contents.substring(0, 30) + ' ▪️▪️▪️ ';
                        }
                        dataHtml += `
                        <td class="col-1">${make_date(item.create_date)}</td>
                        <td class="col-1">${category}</td>
                        <td class="col-1">${item.ban_name}</td>
                        <td class="col-2">${item.teacher_name}</td>
                        <td class="col-2">${item.title}</td>
                        <td class="col-3">${contents}</td>
                        <td class="col-1 custom-control custom-control-inline custom-checkbox" data-bs-toggle="modal" data-bs-target="#soanswer" onclick="get_soquestion_detail(${item.id},${done_code})">✏️</td>
                        <td class="col-1" onclick="delete_question(${item.id})">❌</td>
                        `;
                    });
                    $('#so_tr').html(dataHtml);
                }
            };

            var container = $('#so_pagination');

            qdata.sort(function (a, b) {
                return new Date(b.create_date) - new Date(a.create_date);
            });
            container.pagination(Object.assign(paginationOptions, { 'dataSource': qdata }))

            $('#so_search_input').on('keyup', function () {
                var searchInput = $(this).val().toLowerCase();
                var filteredData = qdata.filter(function (data) {
                    return (data.hasOwnProperty('ban_name') && data.ban_name.toLowerCase().indexOf(searchInput) !== -1)||(data.hasOwnProperty('teacher_name') && data.teacher_name.toLowerCase().indexOf(searchInput) !== -1);
                });
                filteredData.sort(function (a, b) {
                    return new Date(b.create_date) - new Date(a.create_date);
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
    }else if (!studentsData && consultingData) {
        await get_all_students().then(() => {
            $('.cs_inloading').hide()
            $('.not_inloading').show()
        });
    }else if (studentsData && !consultingData) {
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
    console.log(student_data)
    attach = attachData.filter(a => a.question_id == q_id)
    // 문의 상세 내용 
    let temp_question_list = `
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">문의 종류</span>
        <p>${q_category(question_detail_data.category)}</p>
    </div>
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">문의 종류 변경하기</span>
        <select id="question_kind" class="modal-body-select">
            <option value="none" selected>문의 종류 변경 하지 않기</option>
            <option value=0>일반 문의</option>
            <option value=5>내근티처 문의</option>
            <option value=4>기술지원 문의</option>
            <option value=2>이반 요청</option>
            <option value=1>퇴소 요청</option>
        </select>
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
    </div>`
    if(student_data){
        temp_question_list += `
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">학생</span>
            <p>${student_data.student_name} ( *${student_data.student_engname} 원번: ${student_data.origin} )</p>
        </div>`
    }
    temp_question_list +=`
    <div class="modal-body-select-container">
    <span class="modal-body-select-label">첨부파일</span>
    <div class="make_col">
    `
    if(attach.length != 0){
        attach.forEach((a)=>{
            temp_question_list +=`<a href="/common/downloadfile/question/${q_id}/attachment/${a.id}" download="${a.file_name}">${a.file_name}</a>`
        })
    }else{
        temp_question_list +=`<p>첨부 파일 없음</p>`
    }
    temp_question_list += `</div></div>`
    $('#teacher_question').html(temp_question_list);
    // 상담 일지 처리 
    console.log(question_detail_data)
    let consulting_history = consultingData.filter(c => c.id == question_detail_data.consulting_history)
    console.log(consulting_history)
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
    if (question_detail_data.category == 2) {
        let temp_o_ban_id = '<option value="none" selected>이반 처리 결과를 선택해주세요</option><option value=0>반려</option>'
        banData.forEach(ban_data => {
            let value = `${ban_data.ban_id}_${ban_data.teacher_id}_${ban_data.name}`;
            let selectmsg = `<option value="${value}">${ban_data.name} (${make_semester(ban_data.semester)}월 학기)</option>`;
            temp_o_ban_id += selectmsg
        });
        $('#o_ban_id2').html(temp_o_ban_id)
        $('#manage_answer_2').show()
        $('#manage_answer_3').hide()
    }else{
        $('#manage_answer_2').hide()
        $('#manage_answer_3').show()
    }
    if(done_code == 0) {
        $('#teacher_answer').hide()
        $('#manage_answer').show()
        $('#manage_answer_1').show()
        $('#button_box').html(`<button class="btn btn-success" type="submit" onclick="post_answer(${q_id},${question_detail_data.category},${0})">저장</button>`);
    }else{
        $('#manage_answer').hide()
        answer_data = answerData.filter(a => a.question_id == q_id)[0]
        let temp_answer_list = `
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">답변 내용</span>
            <input class="modal-body" style="border-block-width:0;border-left:0;border-right:0" type="text" size="50"
            id="answer_content_modi" placeholder="${answer_data.content}">
        </div>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">답변자</span>
            <p>${make_nullcate(answer_data.writer)}</p>
        </div>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">응답일</span>
            <p>${make_date(answer_data.created_at)}</p>
        </div>
        <div class="modal-body-select-container">
           <span class="modal-body-select-label">처리</span>
           <p>${make_answer_code(answer_data.reject_code)}</p>
        </div>
        `;
        $('#teacher_answer').html(temp_answer_list);
        $('#teacher_answer').show()
        $('#button_box').html(`<button class="btn btn-success" type="submit" onclick="post_answer(${q_id},${question_detail_data.category},${1})">수정</button>`);
    }
}
// 일반 문의 
async function csdata() {
    $('#detailban').hide()
    $('#sobox').hide()
    $('#ulbox').hide()
    $('#qubox').show()
    $('#Tqubox').hide()
    $('#inTqubox').hide()

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
                pageSize: 10,
                pageClassName: 'float-end',
                callback: function (data, pagination) {
                    var dataHtml = '';
                    $.each(data, function (index, item) {
                        ban = banData.filter(b => b.ban_id == item.ban_id)[0]
                        item.ban_name = ban.name
                        item.teacher_name = ban.teacher_engname + '( ' + ban.teacher_name + ' )'
                        let contents = item.contents
                        if(contents && contents.length > 30) {
                            contents = contents.substring(0, 30) + ' ▪️▪️▪️ ';
                        }
                        dataHtml += `
                        <td class="col-1">${make_date(item.create_date)}</td>
                        <td class="col-1">일반문의</td>
                        <td class="col-1">${item.ban_name}</td>
                        <td class="col-2">${item.teacher_name}</td>
                        <td class="col-2">${item.title}</td>
                        <td class="col-3">${contents}</td>
                        <td class="col-1 custom-control custom-control-inline custom-checkbox" data-bs-toggle="modal" data-bs-target="#soanswer" onclick="get_question_detail(${item.id},${done_code})">✏️</td>
                        <td class="col-1" onclick="delete_question(${item.id})">❌</td>
                        `;
                    });
                    $('#alim_tr').html(dataHtml);
                }
            };
            var container = $('#pagination');
            qdata.sort(function (a, b) {
                return new Date(b.create_date) - new Date(a.create_date);
            });
            container.pagination(Object.assign(paginationOptions, { 'dataSource': qdata }));

            $('#cs_search_input').on('keyup', function () {
                var searchInput = $(this).val().toLowerCase();
                var filteredData = qdata.filter(function (data) {
                    return data.hasOwnProperty('ban_name') && data.ban_name.toLowerCase().indexOf(searchInput) !== -1 || (data.hasOwnProperty('teacher_name') && data.teacher_name.toLowerCase().indexOf(searchInput) !== -1);
                });
                filteredData.sort(function (a, b) {
                    return new Date(b.create_date) - new Date(a.create_date);
                });
                container.pagination('destroy');
                container.pagination(Object.assign(paginationOptions, { 'dataSource': filteredData }));
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
// 기술 지원 문의 
async function Tcsdata() {
    $('#detailban').hide()
    $('#sobox').hide()
    $('#ulbox').hide()
    $('#qubox').hide()
    $('#Tqubox').show()
    $('#inTqubox').hide()

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
    Tpaginating(0)
}
function Tpaginating(done_code) {
    $('#Tcs_search_input').off('keyup');
    csqData = questionData.filter(q => q.category == 4)
    total_question_num = csqData.length
    csdata_noanswer = total_question_num != 0 ? csqData.filter(a => a.answer == 0).length : 0

    let temp_newcs = `
    <td class="col-4">${total_question_num}  건</td>
    <td class="col-4">${total_question_num - csdata_noanswer}  건</td>
    <td class="col-4">${csdata_noanswer}  건</td>
    `;
    $('#newTcs').html(temp_newcs)

    if (total_question_num != 0) {
        qdata = csqData.length > 0 ? csqData.filter(a => a.answer == done_code) : [];
        if (qdata.length != 0) {
            $('#Tcsno_data_msg').hide()
            $('#Tcs_teacher_question').show()
            $('#pagination').show()
            var paginationOptions = {
                prevText: '이전',
                nextText: '다음',
                pageSize: 10,
                pageClassName: 'float-end',
                callback: function (data, pagination) {
                    var dataHtml = '';
                    $.each(data, function (index, item) {
                        ban = banData.filter(b => b.ban_id == item.ban_id)[0]
                        item.ban_name = ban.name
                        item.teacher_name = ban.teacher_engname + '( ' + ban.teacher_name + ' )'
                        let contents = item.contents
                        if(contents && contents.length > 30) {
                            contents = contents.substring(0, 30) + ' ▪️▪️▪️ ';
                        }
                        dataHtml += `
                        <td class="col-1">${make_date(item.create_date)}</td>
                        <td class="col-1">기술지원문의</td>
                        <td class="col-1">${item.ban_name}</td>
                        <td class="col-2">${item.teacher_name}</td>
                        <td class="col-2">${item.title}</td>
                        <td class="col-3">${contents}</td>
                        <td class="col-1 custom-control custom-control-inline custom-checkbox" data-bs-toggle="modal" data-bs-target="#soanswer" onclick="get_question_detail(${item.id},${done_code})">✏️</td>
                        <td class="col-1" onclick="delete_question(${item.id})">❌</td>
                        `;
                    });
                    $('#Talim_tr').html(dataHtml);
                }
            };
            var container = $('#Tpagination');
            qdata.sort(function (a, b) {
                return new Date(b.create_date) - new Date(a.create_date);
            });
            container.pagination(Object.assign(paginationOptions, { 'dataSource': qdata }));

            $('#Tcs_search_input').on('keyup', function () {
                var searchInput = $(this).val().toLowerCase();
                var filteredData = qdata.filter(function (data) {
                    return (data.hasOwnProperty('ban_name') && data.ban_name.toLowerCase().indexOf(searchInput) !== -1) || (data.hasOwnProperty('teacher_name') && data.teacher_name.toLowerCase().indexOf(searchInput) !== -1);
                });
                filteredData.sort(function (a, b) {
                    return new Date(b.create_date) - new Date(a.create_date);
                });
                container.pagination('destroy');
                container.pagination(Object.assign(paginationOptions, { 'dataSource': filteredData }));
            });

        } else {
            $('#Tcs_teacher_question').hide()
            $('#Tpagination').hide()
            let temp_nodatamasg = $(`#Tcs_question_view option[value="${done_code}"]`).text() + '가 없습니다';
            $('#Tcsno_data_msg').html(temp_nodatamasg)
            $('#Tcsno_data_msg').show()
        }
    } else {
        $('#Tcs_teacher_question').hide()
        $('#Tpagination').hide()
        $('#Tcsno_data_msg').html('문의가 없습니다')
        $('#Tcsno_data_msg').show()
    }
}
// 일반 문의 
async function inTdata() {
    $('#detailban').hide()
    $('#sobox').hide()
    $('#ulbox').hide()
    $('#qubox').hide()
    $('#Tqubox').hide()
    $('#inTqubox').show()

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
    inTpaginating(0)
}
function inTpaginating(done_code) {
    $('#inTcs_search_input').off('keyup');
    csqData = questionData.filter(q => q.category == 5)
    total_question_num = csqData.length
    csdata_noanswer = total_question_num != 0 ? csqData.filter(a => a.answer == 0).length : 0

    let temp_newcs = `
    <td class="col-4">${total_question_num}  건</td>
    <td class="col-4">${total_question_num - csdata_noanswer}  건</td>
    <td class="col-4">${csdata_noanswer}  건</td>
    `;
    $('#inTnewcs').html(temp_newcs)

    if (total_question_num != 0) {
        qdata = csqData.length > 0 ? csqData.filter(a => a.answer == done_code) : [];
        if (qdata.length != 0) {
            $('#inTcsno_data_msg').hide()
            $('#inTcs_teacher_question').show()
            $('#inTpagination').show()
            var paginationOptions = {
                prevText: '이전',
                nextText: '다음',
                pageSize: 10,
                pageClassName: 'float-end',
                callback: function (data, pagination) {
                    var dataHtml = '';
                    $.each(data, function (index, item) {
                        ban = banData.filter(b => b.ban_id == item.ban_id)[0]
                        item.ban_name = ban.name
                        item.teacher_name = ban.teacher_engname + '( ' + ban.teacher_name + ' )'
                        let contents = item.contents
                        if(contents && contents.length > 30) {
                            contents = contents.substring(0, 30) + ' ▪️▪️▪️ ';
                        }
                        dataHtml += `
                        <td class="col-1">${make_date(item.create_date)}</td>
                        <td class="col-1">내근티처 문의</td>
                        <td class="col-1">${item.ban_name}</td>
                        <td class="col-2">${item.teacher_name}</td>
                        <td class="col-2">${item.title}</td>
                        <td class="col-3">${contents}</td>
                        <td class="col-1 custom-control custom-control-inline custom-checkbox" data-bs-toggle="modal" data-bs-target="#soanswer" onclick="get_question_detail(${item.id},${done_code})">✏️</td>
                        <td class="col-1" onclick="delete_question(${item.id})">❌</td>
                    `;
                    });
                    $('#inTalim_tr').html(dataHtml);
                }
            };
            var container = $('#inTpagination');
            qdata.sort(function (a, b) {
                return new Date(b.create_date) - new Date(a.create_date);
            });
            container.pagination(Object.assign(paginationOptions, { 'dataSource': qdata }));

            $('#inTcs_search_input').on('keyup', function () {
                var searchInput = $(this).val().toLowerCase();
                var filteredData = qdata.filter(function (data) {
                    return data.hasOwnProperty('ban_name') && data.ban_name.toLowerCase().indexOf(searchInput) !== -1 || (data.hasOwnProperty('teacher_name') && data.teacher_name.toLowerCase().indexOf(searchInput) !== -1);
                });
                filteredData.sort(function (a, b) {
                    return new Date(b.create_date) - new Date(a.create_date);
                });
                container.pagination('destroy');
                container.pagination(Object.assign(paginationOptions, { 'dataSource': filteredData }));
            });

        } else {
            $('#inTcs_teacher_question').hide()
            $('#inTpagination').hide()
            let temp_nodatamasg = $(`#inTcs_question_view option[value="${done_code}"]`).text() + '가 없습니다';
            $('#inTcsno_data_msg').html(temp_nodatamasg)
            $('#inTcsno_data_msg').show()
        }
    } else {
        $('#inTcs_teacher_question').hide()
        $('#inTpagination').hide()
        $('#inTcsno_data_msg').html('문의가 없습니다')
        $('#inTcsno_data_msg').show()
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

    // 문의 상세 내용 
    let temp_question_list = `
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">문의 종류</span>
        <p>${q_category(question_detail_data.category)}</p>
    </div>
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">문의 종류 변경하기</span>
        <select id="question_kind" class="modal-body-select">
            <option value="none" selected>문의 종류 변경 하지 않기</option>
            <option value=0>일반 문의</option>
            <option value=5>내근티처 문의</option>
            <option value=4>기술지원 문의</option>
            <option value=2>이반 요청</option>
            <option value=1>퇴소 요청</option>
        </select>
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
        <span class="modal-body-select-label">학생</span>`
    
    if(question_detail_data.student_id != 0){
        student_data = studentsData.filter(s => s.student_id == question_detail_data.student_id)[0]
        temp_question_list += `<p>${student_data.student_name} ( *${student_data.student_engname} 원번: ${student_data.origin} )</p>`
    }
    else{
        temp_question_list += `<p>특정 원생 선택 없음</p>`
    }
    temp_question_list += `</div>
    <div class="modal-body-select-container">
    <span class="modal-body-select-label">첨부파일</span>
    <div class="make_col">
    `
    attach = attachData.filter(a => a.question_id == q_id)
    if(attach.length != 0){
        attach.forEach((a)=>{
            temp_question_list +=`<a href="/common/downloadfile/question/${q_id}/attachment/${a.id}" download="${a.file_name}">${a.file_name}</a>`
        })
    }else{
        temp_question_list +=`<p>첨부 파일 없음</p>`
    }
    temp_question_list += `</div></div>`
    $('#teacher_question').html(temp_question_list);

    // 응답 처리 
    if (done_code == 0) {
        $('#teacher_answer').hide()
        $('#manage_answer').show()
        $('#manage_answer_1').show()
        $('#manage_answer_2').hide()
        $('#manage_answer_3').hide()
        $('#button_box').html(`<button class="btn btn-success" type="submit" onclick="post_answer(${q_id},${question_detail_data.category},${0})">저장</button>`);
    } else {
        $('#manage_answer').hide()
        answer_data = answerData.filter(a => a.question_id == q_id)[0]
        let temp_answer_list = `
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">답변 내용</span>
            <input class="modal-body" style="border-block-width:0;border-left:0;border-right:0" type="text" size="50"
            id="answer_content_modi" placeholder="${answer_data.content}">
        </div>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">답변자</span>
            <p>${make_nullcate(answer_data.writer)}</p>
        </div>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">응답일</span>
            <p>${make_date(answer_data.created_at)}</p>
        </div>`;
        $('#teacher_answer').html(temp_answer_list);
        $('#button_box').html(`<button class="btn btn-success" type="submit" onclick="post_answer(${q_id},${question_detail_data.category},${1})">수정</button>`);
        $('#teacher_answer').show()
    }

}
// 본원 답변 기능 
function post_answer(q_id, category,done_code) {
    let q_kind = $('#question_kind').val()
    if(q_kind == 'none'){
        if(done_code == 0){
            // 저장의 경우 
            answer_contents = $('#answer_contents').val()
            o_ban_id = 0
            if(category == 2) {
                o_ban_id = Number($('#o_ban_id2').val().split('_')[0])
            }else if(category == 3 || category == 1){
                o_ban_id = $('#o_ban_id').val()
            }
        }else{
            // 수정의 경우
            answer_contents = $('#answer_content_modi').val()
            o_ban_id = 0
            if(category == 2) {
                o_ban_id = Number($('#o_ban_id2').val().split('_')[0])
            }else if(category == 3 || category == 1){
                o_ban_id = $('#o_ban_id').val()
            }
        }
        
        $.ajax({
            type: "POST",
            url: "/manage/answer/" + q_id +'/'+ done_code,
            data: {
                answer_contents: answer_contents,
                o_ban_id: o_ban_id
            },
            success: function (response) {
                {
                    if(response['result'] == '문의 답변 저장 완료'){
                        alert("문의 답변 완료")
                        window.location.reload()
                    }else{
                        alert('문의 답변 저장 실패')
                    }
                }
            }
        });
    }else{
        $.ajax({
            type: "POST",
            url: "/manage/q_kind/" + q_id,
            data: {
                question_kind: q_kind
            },
            success: function (response) {
                {
                    if(response['result'] == '문의 종류 수정 완료'){
                        alert(response["result"])
                        window.location.reload()
                    }else{
                        alert('문의 종류 수정 실패')
                    }
                }
            }
        });
    }
    
}
// 미학습 (학습관리)
async function uldata() {
    $('#qubox').hide()
    $('#sobox').hide()
    $('#detailban').hide()
    $('#Tqubox').hide()
    $('#inTqubox').hide()
    $('#ulbox').show()
    let container = $('#ul_pagination')
    $('.cs_inloading').show()
    $('.not_inloading').hide()
    if (!consultingData) {
        await get_all_consulting().then(() => {
            $('.cs_inloading').hide()
            $('.not_inloading').show()
        });
    }
    $('.cs_inloading').hide()
    $('.not_inloading').show()
    // all_uc_consulting = consultingData[0].total_unlearned_consulting
    // studentsData.forEach((elem) => {
    //     elem.unlearned = consultingData.filter(a => a.student_id == elem.student_id && a.category_id < 100).length
    //     elem.up = answer_rate(elem.unlearned, all_uc_consulting).toFixed(2)
    // });
    // studentsData.sort((a, b) => {
    //     if (b.up !== a.up) {
    //         return b.up - a.up;
    //     } else {
    //         return b.unlearned - a.unlearned; // students.length가 큰 순으로 정렬
    //     }
    // });

    // if (studentsData.length == 0) {
    //     let no_data_title = `<h1> ${response.text} </h1>`
    //     $('#ultitle').html(no_data_title);
    //     $('#ul_data_box').hide()
    //     $('#ul_pagination').hide()
    //     return
    // }
    $('#ultitle').empty();
    $('#ul_data_box').show()
    $('#ul_pagination').show()
    container.pagination({
        dataSource: consultingData,
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        callback: function (consultingData, pagination) {
            var dataHtml = '';
            $.each(consultingData, function (index, student) {
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
            temp_ban_option += `<option value="${value}">${ban_data.name} (${make_semester(ban_data.semester)}월 학기)</option>`;
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
            $('#task_msg').html('👉 NF/Inter반 대상 진행합니다 (소요되는 시간이 있으니 저장 클릭후 화면이 이동하기 전 까지 대기 해 주세요)')
        }else if (btid == 3) {
            $('#task_msg').html('👉 16기 반 대상 진행합니다 (소요되는 시간이 있으니 저장 클릭후 알람메시지가 나올 때 까지 대기 해 주세요)')
        }else if (btid == 4) {
            $('#task_msg').html('👉 17기 반 대상 진행합니다 (소요되는 시간이 있으니 저장 클릭후 알람메시지가 나올 때 까지 대기 해 주세요)')
        }else if (btid == 5) {
            $('#task_msg').html('👉 18기 반 대상 진행합니다 (소요되는 시간이 있으니 저장 클릭후 알람메시지가 나올 때 까지 대기 해 주세요)')
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
    $('#consultingban_search_input').off('keyup');
    $('.mo_inloading').show()
    $('.monot_inloading').hide()
    if (!consultingcateData && studentsData) {
        await get_all_consultingcate()
    } else if (consultingcateData && !studentsData) {
        await get_all_students()
    } else if (!consultingcateData && !studentsData) {
        await get_all_students()
        await get_all_consultingcate()
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
        let value = `${ban_data.ban_id}_${ban_data.teacher_id}_${ban_data.name}_-1_전체 학생 대상 진행`;
        temp_ban_option += `<option value="${value}">${ban_data.name} (${make_semester(ban_data.semester)}월 학기)</option>`;
    });
    $('#consulting_target_ban').html(temp_ban_option)

    let temp_student_option = '<option value=0 selected>원생을 선택해주세요</option>';
    studentsData.forEach(student_data => {
        let value = `${student_data.ban_id}_${student_data.teacher_id}_${student_data.ban_name}_${student_data.student_id}_${student_data.student_name}`; // btid
        temp_student_option += `<option value="${value}">${student_data.student_name} ( ${student_data.student_engname} / ${student_data.origin} )</option>`;
    });
    $('#consulting_target_student').html(temp_student_option)

    $('#consultingban_search_input').on('keyup', function () {
        $('#consulting_target_ban').show()
        $('#consulting_target_student').hide()
        let temp_ban_option = '<option value=0 selected>반을 선택해주세요</option>';
        var searchInput = $(this).val().toLowerCase();
        var filteredData = banData.filter(function (data) {
            return (data.hasOwnProperty('name') && data.name.toLowerCase().indexOf(searchInput) !== -1) || (data.hasOwnProperty('teacher_name') && data.teacher_name.toLowerCase().indexOf(searchInput) !== -1) || (data.hasOwnProperty('teacher_engname') && data.teacher_engname.toLowerCase().indexOf(searchInput) !== -1);
        });
        filteredData.forEach(ban_data => {
            let value = `${ban_data.ban_id}_${ban_data.teacher_id}_${ban_data.name}_-1_전체 학생 대상 진행`;
            temp_ban_option += `<option value="${value}">${ban_data.name} (${make_semester(ban_data.semester)}월 학기)</option>`;
        });
        $('#consulting_target_ban').html(temp_ban_option)
    });

    $('#consultingstudent_search_input').on('keyup', function () {
        $('#consulting_target_ban').hide()
        $('#consulting_target_student').show()
        let temp_student_option = '<option value=0 selected>원생을 선택해주세요</option>';
        var searchInput = $(this).val().toLowerCase();
        var filteredData = studentsData.filter(function (data) {
            return (data.hasOwnProperty('student_name') && data.student_name.toLowerCase().indexOf(searchInput) !== -1) || (data.hasOwnProperty('student_engname') && data.student_engname.toLowerCase().indexOf(searchInput) !== -1) || (data.hasOwnProperty('origin') && data.origin.toLowerCase().indexOf(searchInput) !== -1);
        });
        filteredData.forEach(student_data => {
            let value = `${student_data.ban_id}_${student_data.teacher_id}_${student_data.ban_name}_${student_data.student_id}_${student_data.student_name}`; // btid
            temp_student_option += `<option value="${value}">${student_data.student_name} ( ${student_data.student_engname} / ${student_data.origin} )</option>`;
            });
        $('#consulting_target_student').html(temp_student_option)
    });

}

$('#consulting_target_aban').change(function () {
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
    console.log(selectedStudentList)
    for (i = 0; i < selectedStudentList.length; i++) {
        // bid+tid+bname+sid+sname
        if(selectedStudentList[i].includes('_')){
            var value = selectedStudentList[i].split('_')
            if(value.length > 3){
                selectedOptions += `
                <td class="col-4">${value[2]}</td>
                <td class="col-6">${value[4]}</td>
                <td class="col-2" onclick="delete_selected_student(${i})">❌</td>`;
            }else{
                selectedOptions += `
                <td class="col-4">${value[2]}</td>
                <td class="col-6">전체 원생 대상 진행</td>
                <td class="col-2" onclick="delete_selected_student(${i})">❌</td>`;
            }
        }else{
            var value = selectedStudentList[i]
            if(value==0 || value =='0'){
                selectedOptions += `<td class="col-10">전체 반 대상 진행</td><td class="col-2" onclick="delete_selected_student(${i})">❌</td>`
            }else if(value==1 || value =='1'){
                selectedOptions += `<td class="col-10">PLUS/ALPHA반 대상 진행</td><td class="col-2" onclick="delete_selected_student(${i})">❌</td>`
            }else if(value==2 || value =='2'){
                selectedOptions += `<td class="col-10">NF/Inter반 대상 진행</td><td class="col-2" onclick="delete_selected_student(${i})">❌</td>`
            }else if(value==3 || value =='3'){
                selectedOptions += `<td class="col-10">16기 대상 진행</td><td class="col-2" onclick="delete_selected_student(${i})">❌</td>`
            }else if(value==4 || value =='4'){
                selectedOptions += `<td class="col-10">17기 대상 진행</td><td class="col-2" onclick="delete_selected_student(${i})">❌</td>`
            }else{
                selectedOptions += `<td class="col-10">18기 대상 진행</td><td class="col-2" onclick="delete_selected_student(${i})">❌</td>`
            }
        }
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
        let total_ban_selections = selectedStudentList.filter(value=>!(value.includes('_')))
        console.log(total_ban_selections)
        let total_student_selections = selectedStudentList.filter(value => value.includes('-1'));
        console.log(total_student_selections)
        const totalPromises = [];

        // 전체 반 대상 
        if (total_ban_selections.length != 0) {
            total_ban_selections.forEach(value => {
                v = Number(value)
                const promise = $.ajax({
                    type: "POST",
                    url: '/manage/consulting/all_ban/' + v,
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
        // 전체 학생 대상
        if (total_student_selections.length != 0) {
            total_student_selections.forEach(value => {
                v = value.split('_')
                totalstudent_ban_id = Number(v[0])
                totalstudent_teacher_id = Number(v[1])
                const promise = $.ajax({
                    type: "POST",
                    url:`/manage/consulting/ban/${totalstudent_ban_id}/${totalstudent_teacher_id}/${v[2]}/`,
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
        // 개별 학생 대상 인 경우  
        let indivi_student_selections = selectedStudentList.filter(value => (value.includes('_')) && !(value.includes('-1')));
        if (indivi_student_selections.length != 0) {
            indivi_student_selections.forEach(value => {
                v = String(value).split('_')
                s_info = studentsData.filter(a => a.student_id ==  Number(v[3]))[0]
                console.log(s_info)
                const promise = $.ajax({
                    type: "POST",
                    url: '/manage/consulting/' + v[0] + '/' + v[1] + '/' + v[3]+ '/',
                    // data: JSON.stringify(jsonData), // String -> json 형태로 변환
                    data: {
                        student_name : s_info['student_name'],
                        student_engname : s_info['student_engname'],
                        origin : s_info['origin'],
                        consulting_category: consulting_category,
                        consulting_contents: consulting_contents,
                        consulting_date: consulting_date,
                        consulting_deadline: consulting_deadline
                    }
                })
                totalPromises.push(promise);
            })
        }
        console.log(totalPromises)
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
    }
}

async function get_request_consulting(){
    $('#request_consultingban_listbox').hide();
    $('#request_consulting_listbox').show();
    $('#my_consulting_requestModalLabel').html('요청한 상담 목록');
    $('#consulting_list_search_input').off('keyup');
    $('.mo_inloading').show()
    $('.not_inloading').hide()
    if (!consultingData) {
        await get_all_consulting()
    }
    const updateSearchResult = function () {
        let copy_data = consultingData.slice();
        const selectedCategory = $('#history_cate').val();
        const searchInput = $('#consulting_list_search_input').val().toLowerCase();
        if(selectedCategory != 'none' && searchInput ==""){
            copy_data = copy_data.filter((e) => {
                return e.category == selectedCategory;
            })
            Consultingcontainer.pagination('destroy');
            Consultingcontainer.pagination(Object.assign(ConsultingpaginationOptions, { 'dataSource': copy_data }));
        }else if(selectedCategory != 'none' && searchInput !=""){
            copy_data = copy_data.filter(function (d) {
                return (
                  (d.category == selectedCategory) &&
                  (d.hasOwnProperty('student_name') && d.student_name.toLowerCase().indexOf(searchInput) !== -1) ||
                  (d.hasOwnProperty('origin') && d.origin.toLowerCase().indexOf(searchInput) !== -1)
                );
            })
            Consultingcontainer.pagination('destroy');
            Consultingcontainer.pagination(Object.assign(ConsultingpaginationOptions, { 'dataSource': copy_data }));
        }else if(selectedCategory == 'none' && searchInput !=""){
            copy_data = copy_data.filter(function (d) {
                return (
                  (d.hasOwnProperty('student_name') && d.student_name.toLowerCase().indexOf(searchInput) !== -1) ||
                  (d.hasOwnProperty('origin') && d.origin.toLowerCase().indexOf(searchInput) !== -1)
                );
            })
            Consultingcontainer.pagination('destroy');
            Consultingcontainer.pagination(Object.assign(ConsultingpaginationOptions, { 'dataSource': copy_data }));
        }else{
            Consultingcontainer.pagination('destroy');
            Consultingcontainer.pagination(Object.assign(ConsultingpaginationOptions, { 'dataSource': copy_data }));
        }
    };
    Consultingcontainer = $('#consulting-pagination');
    ConsultingpaginationOptions = {
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        callback: function (data, pagination) {
            var dataHtml = '';
            $.each(data, function (index, consulting) {
                consulting.ban_name = banData.filter(b=>b.ban_id == consulting.ban_id)[0].name
                let contents = consulting.contents;
                if(contents && contents.length > 50) {
                    contents = contents.substring(0, 40) + ' ▪️▪️▪️ ';
                }
                dataHtml += `
                <td class="col-2">"${make_date(consulting.startdate)}" ~ <strong>"${make_date(consulting.deadline)}"</strong></td>
                <td class="col-1">${consulting.category}</td>
                <td class="col-2">${contents}</td>
                <td class="col-1">${consulting.ban_name}</td>
                <td class="col-1">${make_nullcate(consulting.teacher_name)} (${make_nullcate(consulting.teacher_engname)})</td>
                <td class="col-1">${consulting.teacher_mobileno}</td>
                <td class="col-1">${make_nullcate(consulting.student_name)} (${make_nullcate(consulting.student_engname)})</td>
                <td class="col-1">${consulting.origin}</td>
                <td class="col-1">${make_reject_code(consulting.done)}</td>
                <td class="col-1" onclick="get_consultingdetail(${consulting.id})"> 🔍 </td>`;
            });
            // $('#consulting-option').html(idxHtml);
            $('#tr-row').html(dataHtml);
        }
    };

    let category_set = new Set(consultingData.map(c => c.category));
        let category_list = [...category_set];
        var idxHtml = `<option value="none">전체</option>`;
        $.each(category_list, function (idx, val) {
          idxHtml += `<option value="${val}">${val}</option>`;
        });
    $('#history_cate').html(idxHtml);
    $('#history_cate, #consulting_list_search_input').on('change keyup', updateSearchResult);

    consultingData.sort(function (a, b) {
        return new Date(b.startdate) - new Date(a.startdate);
    });
    Consultingcontainer.pagination(Object.assign(ConsultingpaginationOptions, { 'dataSource': consultingData }))
    $('.mo_inloading').hide();
    $('.not_inloading').show();
}
function sort_consultingoption(sortBy) {
    switch (sortBy) {
        case "name_desc":
            $('#student_name_sort').html('<strong>원생 이름순 정렬👇</strong>')    
            $('#deadline_sort').html('마감일 정렬👉')
            $('#startdate_sort').html('최근순 정렬👉')         
            $('#consulting_sort').html('미진행 정렬👉')        
            consultingData.sort(function (a, b) {
                var nameA = a.student_name.toUpperCase(); // 대소문자 구분 없이 비교하기 위해 대문자로 변환
                var nameB = b.student_name.toUpperCase(); // 대소문자 구분 없이 비교하기 위해 대문자로 변환
                if (nameA < nameB) {
                    return -1;
                }
                if (nameA > nameB) {
                    return 1;
                }
                return 0;
            });
            break;
    
        case "deadline_desc":
            $('#student_name_sort').html('원생 이름순 정렬👉')    
            $('#deadline_sort').html('<strong>마감일 정렬👇</strong>')
            $('#startdate_sort').html('최근순 정렬👉')     
            $('#consulting_sort').html('미진행 정렬👉')        
            consultingData.sort(function (a, b) {
                return new Date(a.deadline) - new Date(b.deadline);
            });
            break;
        
        case "startdate_desc":
            $('#student_name_sort').html('원생 이름순 정렬👉')    
            $('#deadline_sort').html('마감일 정렬👉') 
            $('#startdate_sort').html('<strong>최근순 정렬👇</strong>')        
            $('#consulting_sort').html('미진행 정렬👉')        
            consultingData.sort(function (a, b) {
                return new Date(b.startdate) - new Date(a.startdate);
            });
            break;
    
        case "consulting_desc":
            $('#student_name_sort').html('원생 이름순 정렬👉')    
            $('#deadline_sort').html('마감일 정렬👉')    
            $('#startdate_sort').html('최근순 정렬👉')
            $('#consulting_sort').html('<strong>미진행 정렬👇</strong>') 
            consultingData.sort(function (a, b) {
                if (a.done === 0 && b.done === 1) {
                    return -1;
                }
                if (a.done === 1 && b.done === 0) {
                    return 1;
                }
                return 0;
            });
            break;
    }
  
    // 데이터 정렬 후 페이지네이션 다시 설정
    Consultingcontainer.pagination("destroy");
    Consultingcontainer.pagination(
      Object.assign(ConsultingpaginationOptions, { dataSource: consultingData })
    );
}

function get_consultingdetail(consulting_id) {
    const consulting_history = consultingData.filter(c=>c.id == consulting_id)[0]
    const teacher_ban_info = banData.filter(b=>b.ban_id == consulting_history.ban_id)[0]
    $('#my_consulting_requestModalLabel').html(`${teacher_ban_info.name}반 ${teacher_ban_info.teacher_name}( ${teacher_ban_info.teacher_engname} )T의 ${consulting_history.category}상담`);

    let temp_his = `
        <button type="button" class="btn btn-back" onclick="get_request_consulting()">상담 목록으로 돌아가기🔙 </button>
        <p class="mt-lg-4 mt-5">원생 : ${consulting_history.student_engname} ( ${consulting_history.student_name} )</p>
        <p class="mt-lg-4 mt-5">원번 : ${consulting_history.origin}</p>
        <p class="mt-lg-4 mt-5">✅ ${consulting_history.category}</p>
        <p mt-lg-4 mt-5>✅ ${consulting_history.contents.replace(/\n/g, '</br>')}</p>
    `;
    if(consulting_history.done == 0){
        temp_his += `
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">상담</span>
            <p>미진행</p>
        </div>
        `
    }else{
        temp_his += `
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">상담 사유</span>
            <input class="modal-body" style="border-block-width:0;border-left:0;border-right:0" type="text" size="50"id="consulting_reason" placeholder="${consulting_history.reason}">
        </div>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">제공한 가이드</span>
            <input class="modal-body" style="border-block-width:0;border-left:0;border-right:0" type="text" size="50"
                id="consulting_solution" placeholder="${consulting_history.solution}">
        </div>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">상담 일시</span>
            <p>${make_date(consulting_history.created_at)}</p>
        </div>
        `
    }
    console.log(temp_his)
    $('#consulting_history_contents_box').html(temp_his)

    $('#request_consulting_listbox').hide()
    $('#request_consultingban_listbox').show()
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
                if (key.includes(value) || value == "none") {
                    let consulting_info = key.split('_')
                    dataHtml += `
                    <td class="col-1">${make_duedate(consulting_info[2], consulting_info[3])}</td>
                    <td class="col-3">${consulting_info[2]} ~ ${consulting_info[3]}</td>
                    <td class="col-2">${consulting_info[0]}</td>
                    <td class="col-5"> ${consulting_info[1]}</td>
                    <td class="col-1" onclick ="get_consultingban('${key}')"> 🔍 </td>`;
                }
            });
            $('#tr-row').html(dataHtml);
        }
    })
}

// 요청 업무관리 기능 
async function get_task(){
    $('.mo_inloading').show()
    $('.not_inloading').hide()
    if (!taskData) {
        await get_all_task().then(() => {
            if (taskData.length > 0) {
                taskGrouped = taskData.reduce((acc, item) => {
                    const v = `${item.name}_${item.contents}_${item.startdate}_${item.deadline}_${item.cycle}_${item.priority}`;
                    if (!acc[v]) {
                        acc[v] = [];
                    }
                    acc[v].push(
                        {'ban_id':item.ban_id,'done':item.done,'taskban_id':item.taskban_id}
                    );
                    return acc;
                }, {});
                // 결과를 객체의 배열로 변환 -> 상담 별 배열 
               taskGroupedresult = Object.entries(taskGrouped).map(([v, items]) => {
                    return { [v]: items };
                });
                let container = $('#task-pagination')
                var category_list = []
                container.pagination({
                    dataSource: taskGroupedresult,
                    prevText: '이전',
                    nextText: '다음',
                    pageSize: 10,
                    callback: function (taskGroupedresult, pagination) {
                        var idxHtml = `<option value="none">전체</option>`;
                        var dataHtml = '';
                        $.each(taskGroupedresult, function (index, task) {
                            let key = Object.keys(task)[0]
                            let task_info = key.split('_')
                            category_list.push(task_info[0])
                            dataHtml += `
                                <td class="col-1"> ${make_duedate(task_info[2],task_info[3])}</td>
                                <td class="col-3">"${task_info[2]}" ~ </br>"${task_info[3]}"</td>
                                <td class="col-1">${make_priority(task_info[5])}</td>
                                <td class="col-1">${make_cycle(task_info[4])}</td>
                                <td class="col-2">${task_info[0]} 업무</td>
                                <td class="col-3">${task_info[1]}</td>
                                <td class="col-1" onclick ="get_taskban('${key}')"> 🔍 </td>`;
                        });
                        category_set = new Set(category_list)
                        category_list = [...category_set]
                        $.each(category_list, function (idx, val) {
                            idxHtml += `<option value="${val}">${val}</option>`
                        })
                        $('#task-option').html(idxHtml);
                        $('#task-tr').html(dataHtml);
                    }
                })
            }
            $('#taskModalLabel').html('요청한 업무 목록');
            $('#for_task_list').show()
            $('#for_taskban_list').hide()
            $('.mo_inloading').hide()
            $('.not_inloading').show()
            $('#requ_task_list').show()
        });
    }else{
        if (taskData.length > 0) {
            taskGrouped = taskData.reduce((acc, item) => {
                const v = `${item.name}_${item.contents}_${item.startdate}_${item.deadline}_${item.cycle}_${item.priority}`;
                if (!acc[v]) {
                    acc[v] = [];
                }
                acc[v].push(
                    {'ban_id':item.ban_id,'done':item.done,'taskban_id':item.taskban_id}
                );
                return acc;
            }, {});
            // 결과를 객체의 배열로 변환 -> 상담 별 배열 
           taskGroupedresult = Object.entries(taskGrouped).map(([v, items]) => {
                return { [v]: items };
            });
        }
        let container = $('#task-pagination')
        var category_list = []
        container.pagination({
            dataSource: taskGroupedresult,
            prevText: '이전',
            nextText: '다음',
            pageSize: 10,
            callback: function (taskGroupedresult, pagination) {
                var idxHtml = `<option value="none">전체</option>`;
                var dataHtml = '';
                $.each(taskGroupedresult, function (index, task) {
                    let key = Object.keys(task)[0]
                    let task_info = key.split('_')
                    category_list.push(task_info[0])
                    dataHtml += `
                        <td class="col-1"> ${make_duedate(task_info[2],task_info[3])}</td>
                        <td class="col-3">"${task_info[2]}" ~ </br>"${task_info[3]}"</td>
                        <td class="col-1">${make_priority(task_info[5])}</td>
                        <td class="col-1">${make_cycle(task_info[4])}</td>
                        <td class="col-2">${task_info[0]} 업무</td>
                        <td class="col-3">${task_info[1]}</td>
                        <td class="col-1" onclick ="get_taskban('${key}')"> 🔍 </td>`;
                });
                category_set = new Set(category_list)
                category_list = [...category_set]
                $.each(category_list, function (idx, val) {
                    idxHtml += `<option value="${val}">${val}</option>`
                })
                $('#task-option').html(idxHtml);
                $('#task-tr').html(dataHtml);
            }
        })
        $('.mo_inloading').hide()
        $('.not_inloading').show()
        $('#requ_task_list').show()
        $('#for_task_list').show()
        $('#for_taskban_list').hide()
        $('#taskModalLabel').html('요청한 업무 목록');
    }
}
function get_taskban(key){
    $('#taskreqban_search_input').off('keyup');
    tinfo =  key.split('_')
    $('#taskModalLabel').html(tinfo[0]+' | "'+tinfo[1]+'" 업무를 진행중인 반 목록');
    $('#for_task_list').hide()
    $('#for_taskban_list').show()
    
    var paginationOptions = {
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        pageClassName: 'float-end',
        callback: function (data, pagination) {
            var dataHtml = '';
            $.each(data, function (index, item) {
                baninfo = banData.filter(b=>b.ban_id == item.ban_id)[0]
                item.ban_name =  baninfo.name
                item.teacher_name =  baninfo.teacher_name
                item.teacher_engname =  baninfo.teacher_engname
                item.teacher_mobileno =  baninfo.teacher_mobileno
                item.teacher_email =  baninfo.teacher_email
                dataHtml += `
                    <td class="col-2">${item.ban_name}</td>
                    <td class="col-2">${item.teacher_name}( ${item.teacher_engname} )</td>
                    <td class="col-2">${item.teacher_mobileno}</td>
                    <td class="col-2">${item.teacher_email}</td>
                    <td class="col-3">${make_reject_code(item.done)}</td>
                    <td class="col-1"><button class="modal-tbody-btn" onclick="delete_task(${item.taskban_id})">🗑️</button></td>`;
            });
            $('#taskban_list').html(dataHtml);
        }
    };
    var container = $('#taskbanpagination');
    container.pagination(Object.assign(paginationOptions, {'dataSource': taskGroupedresult.filter(t=>t[key])[0][key]}))

    $('#taskreqban_search_input').on('keyup', function () {
        var searchInput = $(this).val().toLowerCase();
        var filteredData = taskGroupedresult.filter(t=>t[key])[0][key].filter(function (data) {
            return data.hasOwnProperty('ban_name') && data.ban_name.toLowerCase().indexOf(searchInput) !== -1 || data.hasOwnProperty('teacher_name') && data.teacher_name.toLowerCase().indexOf(searchInput) !== -1 || data.hasOwnProperty('teacher_engname') && data.teacher_engname.toLowerCase().indexOf(searchInput) !== -1;
        });
        container.pagination('destroy');
        container.pagination(Object.assign(paginationOptions, { 'dataSource': filteredData }));
    });
}  

function go_taskback() {
    $('#for_task_list').show()
    $('#for_taskban_list').hide()
    $('#taskModalLabel').html('요청한 업무 목록');
}  

async function sort_task(value) {
    var dataHtml = '';
    let container = $('#task-pagination')
    container.pagination({
        dataSource: taskGroupedresult,
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        callback: function (taskGroupedresult, pagination) {
            var dataHtml = '';
            $.each(taskGroupedresult, function (index, task) {
                let key = Object.keys(task)[0]
                if(key.includes(value) || value =="none"){
                    let task_info = key.split('_')
                    dataHtml += `
                    <td class="col-1"> ${make_duedate(task_info[2],task_info[3])}</td>
                    <td class="col-3">"${task_info[2]}" ~ </br>"${task_info[3]}"</td>
                    <td class="col-1">${make_priority(task_info[5])}</td>
                    <td class="col-1">${make_cycle(task_info[4])}</td>
                    <td class="col-2">${task_info[0]} 업무</td>
                    <td class="col-3">${task_info[1]}</td>
                    <td class="col-1" onclick ="get_taskban('${key}')"> 🔍 </td>`;
                }
            });
            $('#task-tr').html(dataHtml);
        }
    })
}

// 과거 코드



// function get_taskban(task_id) {
//     $('#taskModalLabel').html('반 별 진행 내역');
//     $('#for_task_list').hide();
//     $('#for_taskban_list').show();
//     $.ajax({
//         type: "GET",
//         url: "/manage/taskban/" + task_id,
//         data: {},
//         success: function (response) {
//             let temp_task_ban_box = '';
//             for (i = 0; i < response['target_taskban'].length; i++) {
//                 let target = response['target_taskban'][i]
//                 let id = target["id"]
//                 let ban = target["ban"]
//                 let done = target["done"]
//                 if (done == 0) {
//                     done = '미진행'
//                 } else {
//                     done = '진행완료'
//                 }
//                 temp_task_ban_box += `
//                 <td class="col-4">${ban}</td>
//                 <td class="col-4">${done}</td>
//                 <td class="col-4">✖️</td>
//                 `;
//                 $('#taskban_list').html(temp_task_ban_box);
//             }
//         }
//     });
// }

async function delete_consulting(contents, ban_id) {
    const csrf = $('#csrf_token').val();
    var con_val = confirm('정말 삭제하시겠습니까?')
    if (con_val == true) {
        await $.ajax({
            url: '/manage/api/delete_consulting/' + contents+'/'+ban_id,
            type: 'get',
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

async function delete_ban_consulting(idx) {
    const csrf = $('#csrf_token').val();
    
}
async function delete_task(idx) {
    const csrf = $('#csrf_token').val();
    var con_val = confirm('정말 삭제하시겠습니까?')
    if (con_val == true) {
        await $.ajax({
            url: '/manage/api/delete_task/' + idx,
            type: 'get',
            headers: { 'content-type': 'application/json' },
            data: {},
            success: function (data) {
                if (data.status == 200) {
                    alert(`삭제되었습니다.`)
                    window.location.reload()
                } else {
                    alert(`실패 ${data.status} ${data.text}`)
                }
            },
            error: function (xhr, status, error) {
                alert(xhr.responseText);
            }
        })
    }
}
