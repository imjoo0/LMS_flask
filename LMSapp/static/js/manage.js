// const today = new Date();
var selectedBanList = [];
var selectedStudentList = [];
// API 호출
function getParameter(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}
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

        const studentMap = new Map();
        for (let i = 0; i < studentsData.length; i++) {
        const student = studentsData[i];
        studentMap.set(student.student_id, {
            origin: student.origin
        });
        }

        // 반 데이터를 Map으로 매핑
        const banMap = new Map();
        for (let i = 0; i < banData.length; i++) {
        const ban = banData[i];
        banMap.set(ban.ban_id, {
            ban_name: ban.name,
            teacher_name: ban.teacher_engname + ' (' + ban.teacher_name + ')'
        });
        }

        // questionData를 순회하면서 필요한 정보를 매핑하여 저장
        for (let i = 0; i < questionData.length; i++) {
            const question = questionData[i];
            const ban = banMap.get(question.ban_id);
            const student = studentMap.get(question.student_id);

            question.origin = student ? student.origin : '원생 정보 없음';
            question.student_name = student ? student.student_name : '원생 정보 없음';
            question.student_engname = student ? student.student_engname : '원생 정보 없음';
            question.ban_name = ban ? ban.ban_name : '';
            question.teacher_name = ban ? ban.teacher_name : '';
        }
        
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
$(document).ready(async function () {
    $('.nav-link').on('click', function () {
        $('.nav-link').removeClass('active');
        $(this).addClass('active');
    })
    var target = document.getElementById('request_consultingban_listbox');
    let modalObserver = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.target.style.cssText.includes('display: none;')){
                $('#my_consulting_request .modal-dialog').addClass('modal-handling');
                $('#my_consulting_request .modal-dialog').addClass('modal-xl');
                $('#my_consulting_request .modal-dialog').removeClass('modal-lg');
                $('#my_consulting_request .modal-dialog').attr('style','max-width:90%;');
            } else {
                $('#my_consulting_request .modal-dialog').removeClass('modal-handling');
                $('#my_consulting_request .modal-dialog').removeClass('modal-xl');
                $('#my_consulting_request .modal-dialog').addClass('modal-lg');
                $('#my_consulting_request .modal-dialog').attr('style',null);
            }
        })
    })
    let config = {
        attributes: true,
    };
    modalObserver.observe(target, config);
})
$(window).on('load', async function () {
    try {
        if(!getIsFetching()){
            try{     
                setIsFetching(true);
                let q_type =  getParameter("q_type");
                let q_id = getParameter("q_id");
                if(q_id !== "" && q_type !== ""){
                    const response = await $.ajax({
                        url: `modal_question/${q_id}`,
                        type: 'GET',
                        dataType: 'json',
                        data: {},
                    })
                    let target_question = response.target_question
                    let target_bandata = response.target_bandata
                    $("#soanswer").modal("show");
                    $('.cs_inloading').show()
                    $('.not_inloading').hide()
                    $('.cs_inloading').hide()
                    $('.not_inloading').show()
                    $('#consulting_history_attach').hide()
                    $('#manage_answer').hide()
                    let question_detail_data = target_question['question'][0]
                    let contents = question_detail_data.contents.replace(/\n/g, '</br>')
                    let temp_question_list = `
                    <div class="modal-body-select-container">
                        <div class="modal-body-select-label"><span class="modal-body-select-container-span">제목</span></div>
                        <div>${question_detail_data.title}</div>
                    </div>
                    <div class="modal-body-select-container">
                        <div class="modal-body-select-label"><span class="modal-body-select-container-span">작성일</span></div>
                        <div>${make_hours(question_detail_data.create_date)}</div>
                    </div>
                    <div class="modal-body-select-container" style="padding: 12px 0">
                        <div class="modal-body-select-label"><span class="modal-body-select-container-span">문의 종류</span></div>
                        <div class="w-25">${q_category(question_detail_data.category)}</div>
                        <div class="modal-body-select-label"><span class="modal-body-select-container-span">문의 변경</span></div>
                        <select id="question_kind" class="modal-body-select w-25">
                            <option value="none" selected>변경X</option>
                            <option value=0>일반 문의</option>
                            <option value=5>내근티처 문의</option>
                            <option value=4>기술지원 문의</option>
                            <option value=2>이반 요청</option>
                            <option value=1>퇴소 요청</option>
                        </select>
                    </div>
                    <div class="modal-body-select-container">
                        <div class="modal-body-select-label"><span class="modal-body-select-container-span">대상 반</span></div>
                        <div>${target_bandata[0].ban_name} ➖ 담임 T : ${question_detail_data.teacher_engname}  ( ${question_detail_data.teacher_name} )</div>
                    </div>
                    <div class="modal-body-select-container">
                        <div class="modal-body-select-label"><span class="modal-body-select-container-span">학생</span></div>`
                    if(question_detail_data.student_id != 0){
                        let student_data = target_bandata.filter(s => s.student_id == question_detail_data.student_id)[0]
                        temp_question_list += `<p>${student_data.first_name} ( *${student_data.nick_name} 원번: ${student_data.register_no})</p>`
                    }
                    else{
                        temp_question_list += `<div>특정 원생 선택 없음</div>`
                    }
                    temp_question_list += `
                        </div>
                        <div class="d-flex flex-column justify-content-start py-3">
                            <div class="modal-body-select-label"><span class="modal-body-select-container-span">첨부파일</span></div>
                    `
                    let attach = target_question['attach']
                    if(attach.length != 0){
                        attach.forEach((a)=>{
                            temp_question_list +=`<a class="pt-3 px-3" href="/common/downloadfile/question/${q_id}/attachment/${a.id}" download="${a.file_name}">${a.file_name}</a>`
                        })
                    }else{
                        temp_question_list +=`<div class="pt-3 px-2">첨부 파일 없음</div>`
                    }
                    temp_question_list += 
                    `
                        </div>
                        <div class="d-flex flex-column justify-content-start py-3">
                            <div class="modal-body-select-label"><span class="modal-body-select-container-span">내용</span></div>
                            <div class="mt-4 ps-2">${contents}</div>
                        </div>
                    `
                    $('#teacher_question').html(temp_question_list);
                    let temp_his = `<div> 상담내역이 없습니다 </div>`;
                    let category = ''
                    if(question_detail_data.consulting_history){
                        let solution = question_detail_data.solution.replace(/\n/g, '</br>')
                        if (question_detail_data.consulting_categoryid < 100) {
                            category = `${question_detail_data.week_code}주간 ${question_detail_data.consulting_category}상담`
                        } else {
                            category = `${question_detail_data.consulting_category} ${question_detail_data.consulting_category}`
                        }
                        temp_his = `
                        <div class="modal-body-select-container">
                            <div class="modal-body-select-label align-items-start"><span class="modal-body-select-container-span">상담 종류</span></div>
                            <div style="width:16.666%; margin-right:20px;">${category}</div>
                            <div class="modal-body-select-label align-items-start"><span class="modal-body-select-container-span">상담 사유</span></div>
                            <div style="width:16.666%; margin-right:20px;">${question_detail_data.reason}</div>
                            <div class="modal-body-select-label align-items-start"><span class="modal-body-select-container-span">상담 일시</span></div>
                            <div style="width:16.666%; margin-right:20px;">${make_date(question_detail_data.created_at)}</div>
                        </div>
                        <div class="d-flex flex-column py-3">
                            <div class="modal-body-select-label mt-3"><span class="modal-body-select-container-span">제공 가이드</span></div>
                            <div class="mt-3 px-2">${solution}</div>
                        </div>
                        `;
                        $('#cha').html(temp_his);
                        $('#consulting_history_attach').show()
                    }
                    if (question_detail_data.answer == 0) {
                        if (question_detail_data.category == 2){
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
                        $('#teacher_answer').empty();
                        $('#teacher_answer').hide()
                        $('#manage_answer').sShow()
                        $('#manage_answer_1').show()
                        $('#manage_answer_2').hide()
                        $('#manage_answer_3').hide()
                        $('#button_box').html(`<button class="btn btn-success" type="submit" onclick="post_answer(${q_id},${question_detail_data.category},${0})">저장</button>`);
                    } else {
                        $('#manage_answer').hide()
                        let answer_data = target_question['answer'][0]
                        let temp_answer_list = `
                        <div class="modal-body-select-container">
                            <div class="modal-body-select-label"><span class="modal-body-select-container-span">답변자</span></div>
                            <div class="w-25">${make_nullcate(answer_data.writer)}</div>
                            <div class="modal-body-select-label"><span class="modal-body-select-container-span">응답일</span></div>
                            <div class="w-25">${make_date(answer_data.created_at)}</div>
                        </div>
                        <div class="d-flex flex-column justify-content-start py-3">
                            <div class="modal-body-select-label"><span class="modal-body-select-container-span">내용</span></div>
                            <textarea class="modal-body-select w-100 mt-3" type="text" rows="15" cols="25"
                            id="answer_content_modi">${answer_data.content}</textarea>
                        </div>
                        `;
                        $('#teacher_answer').html(temp_answer_list);
                        $('#button_box').html(`<button class="btn btn-success" type="submit" onclick="post_answer(${q_id},${question_detail_data.category},${1})">수정</button>`);
                        $('#teacher_answer').show()
                    }
                }
                await get_total_data()
                // await get_all_question()
                // if(q_id !== "" && q_type !== ""){
                //     if(q_type== 1 ||  q_type==2){                        
                //         so_paginating(0);
                //     }else if(q_type== 0){
                //         paginating(0);
                //     }else if(q_type== 5){
                //         inTpaginating(0);
                //     }else if(q_type== 4){
                //         paginating(0);
                //     }
                // }
            }catch (error) {
                alert('Error occurred while retrieving data2.');
            }finally {
                setIsFetching(false);
            }
        }
    } catch (error) {
        console.log(error)
        alert(error)
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
async function get_question_list(q_type){
    $('#question_view').val(0); 
    $('#question_search_input').off('keyup');
    $('.cs_inloading').show()
    $('.not_inloading').hide()
    $('#detailban').hide()
    $('#qubox').hide()
    $('#Tqubox').hide()
    $('#inTqubox').hide()
    $('#ulbox').hide()
    $('#sobox').hide()
    if (!questionData) {
        // 얘를 워커를 사용하는 식으로 변경 
        // q_type의 문의 먼저 최근 문의 1-5000건씩 가져오기 
        await get_all_question()
    }
    if(!CSdata){
        const csWorker = new Worker("../static/js/cs_worker.js");
        csWorker.postMessage('getCSdata')
        csWorker.onmessage = function (event) {
            CSdata = event.data.all_cs_data;
        };
    }
    let copy_data = questionData.slice()
    let qdata = copy_data.filter(q=>q.category == q_type)
    if(q_type == 1){
        qdata = qdata.concat(copy_data.filter(q => q.category == 2))
    }

    let total_q_num = qdata.length
    let q_noanswer = total_q_num != 0 ? qdata.filter(a => a.answer == 0).length : 0

    let temp_newso = `
    <td class="col-4">${total_q_num}  건</td>
    <td class="col-4">${total_q_num - q_noanswer}  건</td>
    <td class="col-4">${q_noanswer}  건</td>`;
    $('#newso').html(temp_newso)
    
    question_paginating(qdata,0)
    $('#question_view').change(function() {
        question_paginating(qdata,$(this).val())
    });
}
// 문의 관리
function question_paginating(qdata,done_code){
    $('#question_view').val(done_code); 
    $('.cs_inloading').hide()
    $('.not_inloading').show()
    $('#questionbox').show()
    $('#no_data_msg').hide()
    $('#so_question').show()
    $('#so_pagination').show()
    let copy_data = qdata.slice()
    console.log(copy_data)
    let target = copy_data.length > 0 ? copy_data.filter(q=>q.answer == done_code) : 0;
    console.log(target)
    var container = $('#so_pagination');
    var paginationOptions = {
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        pageClassName: 'float-end',
        callback: function (data, pagination) {
            var dataHtml = '';
            $.each(data, function (index, item) {
                dataHtml += `
                <td class="col-1">${make_date(item.create_date)}</td>
                <td class="col-1">${q_category(item.category)}</td>
                <td class="col-1">${item.ban_name}</td>
                <td class="col-1">${item.teacher_name}</td>
                <td class="col-1">${item.origin}</td>
                <td class="col-2">${item.title}</td>
                <td class="col-3">${make_small_char(item.contents)}</td>
                `;
                if(item.category != 10){
                    dataHtml += `
                    <td class="col-1 custom-control custom-control-inline custom-checkbox" data-bs-toggle="modal" data-bs-target="#soanswer" onclick="get_question_detail(${item.id})"><span class="cursor">✏️</span></td>
                    <td class="col-1" onclick="delete_question(${item.id})"><span class="cursor">❌</span></td>`
                }else{
                    dataHtml += `
                    <td class="col-1 custom-control custom-control-inline custom-checkbox" data-bs-toggle="modal" data-bs-target="#soanswer" onclick="get_cs_detail(${item.id})"><span class="cursor">✏️</span></td>
                    <td class="col-1">삭제 불가</td>`
                }
            });
            $('#so_tr').html(dataHtml);
        }
    };
    if(target == 0){
        $('#so_question').hide();
        $('#so_pagination').hide();
        let temp_nodatamasg = $(`#question_view option[value="${done_code}"]`).text() + '이 없습니다';
        $('#no_data_msg').html(temp_nodatamasg);
        $('#no_data_msg').show();
        return;
    }
    target.sort(function (a, b) {
        return new Date(b.create_date) - new Date(a.create_date);
    });
    container.pagination(Object.assign(paginationOptions, { 'dataSource': target }))

    $('#question_search_input').on('keyup', function () {
        var searchInput = $(this).val().toLowerCase();
        let copy_data = target.slice();
        if(searchInput == ""){
            container.pagination('destroy');
            container.pagination(Object.assign(paginationOptions, { 'dataSource': copy_data }));
        }else{
            var filteredData = copy_data.filter(function (data) {
                return ((data.hasOwnProperty('origin') && data.origin.toLowerCase().indexOf(searchInput) !== -1)||(data.hasOwnProperty('ban_name') && data.ban_name.toLowerCase().indexOf(searchInput) !== -1)||(data.hasOwnProperty('teacher_name') && data.teacher_name.toLowerCase().indexOf(searchInput) !== -1));
            });
            filteredData.sort(function (a, b) {
                return new Date(b.create_date) - new Date(a.create_date);
            });
            container.pagination('destroy');
            container.pagination(Object.assign(paginationOptions, { 'dataSource': filteredData }));
        }
    });

}
// 문의 내용 상세보기
async function get_question_detail(q_id){
    $('.cs_inloading').show()
    $('.not_inloading').hide()
    $('#consulting_history_attach').hide()
    $('#manage_answer').hide()
    let question_detail_data = questionData.filter(q => q.id == q_id)[0]
    // student_data = studentsData.filter(s => s.student_id == question_detail_data.student_id)[0]
    const attachMap = new Map();
    for (let i = 0; i < attachData.length; i++) {
        const attach = attachData[i];
        const questionId = attach.question_id;
        if (attachMap.has(questionId)) {
            const existingAttach = attachMap.get(questionId);
            existingAttach.push({
            attach_id: attach.id,
            file_name: attach.file_name
            });
        } else {
            attachMap.set(questionId, [{
            attach_id: attach.id,
            file_name: attach.file_name
            }]);
        }
    }
    const answerMap = new Map();
    for (let i = 0; i < answerData.length; i++) {
        const answer = answerData[i];
        answerMap.set(answer.question_id, {
            reject_code: answer.reject_code,
            answerer: answer.writer ,
            created_at:answer.created_at,
            content:answer.content
        }); 
    }
    const attach = attachMap.get(q_id);
    const answer = answerMap.get(q_id)
    let contents = question_detail_data.contents.replace(/\n/g, '</br>')
    $('.cs_inloading').hide()
    $('.not_inloading').show()
    // 문의 상세 내용 
    let temp_question_list = `
    <div class="modal-body-select-container">
        <div class="modal-body-select-label"><span class="modal-body-select-container-span">제목</span></div>
        <div>${question_detail_data.title}</div>
    </div>
    <div class="modal-body-select-container">
        <div class="modal-body-select-label"><span class="modal-body-select-container-span">작성일</span></div>
        <div>${make_hours(question_detail_data.create_date)}</div>
    </div>
    <div class="modal-body-select-container" style="padding: 12px 0">
        <div class="modal-body-select-label"><span class="modal-body-select-container-span">문의 종류</span></div>
        <div class="w-25">${q_category(question_detail_data.category)}</div>
        <div class="modal-body-select-label"><span class="modal-body-select-container-span">문의 변경</span></div>
        <select id="question_kind" class="modal-body-select w-25">
            <option value="none" selected>변경X</option>
            <option value=0>일반 문의</option>
            <option value=5>내근티처 문의</option>
            <option value=4>기술지원 문의</option>
            <option value=2>이반 요청</option>
            <option value=1>퇴소 요청</option>
        </select>
    </div>
    <div class="modal-body-select-container">
        <div class="modal-body-select-label"><span class="modal-body-select-container-span">대상 반</span></div>
        <div>${question_detail_data.ban_name} ➖ 담임 T : ${question_detail_data.teacher_name} </div>
    </div>
    <div class="modal-body-select-container">
        <div class="modal-body-select-label"><span class="modal-body-select-container-span">학생</span></div>
        <div>${question_detail_data.student_name} ( *${question_detail_data.student_engname} 원번: ${question_detail_data.origin})</div>
    </div>
    `
    temp_question_list += `
    <div class="d-flex flex-column justify-content-start py-3">
        <div class="modal-body-select-label"><span class="modal-body-select-container-span">첨부파일</span></div>
    `
    if(attach){
        attach.forEach((a)=>{
            temp_question_list +=`<a class="pt-3 px-2" href="/common/downloadfile/question/${q_id}/attachment/${a.attach_id}" download="${a.file_name}">${a.file_name}</a>`
        })
    }else{
        temp_question_list +=`<div class="pt-3 px-2">첨부 파일 없음</div>`
    }
    temp_question_list += `
        </div>
        <div class="d-flex flex-column justify-content-start py-3">
            <div class="modal-body-select-label"><span class="modal-body-select-container-span">내용</span></div>
            <div class="mt-4 ps-2">${contents}</div>
        </div>    
    `
    $('#teacher_question').html(temp_question_list);
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
    if(!answer) {
        $('#teacher_answer').empty();
        $('#teacher_answer').hide()
        $('#manage_answer').show()
        $('#manage_answer_1').show()
        $('#button_box').html(`<button class="btn btn-success" type="submit" onclick="post_answer(${q_id},${question_detail_data.category},${0})">저장</button>`);
    }else{
        $('#manage_answer').hide()
        let temp_answer_list = ''
        if (question_detail_data.category == 1 || question_detail_data.category == 2) {
            temp_answer_list = `
            <div class="modal-body-select-container">
               <div class="modal-body-select-label"><span class="modal-body-select-container-span">처리</span></div>
               <div>${make_answer_code(answer.reject_code)}</div>
            </div>`
        }
        temp_answer_list += `
        <div class="modal-body-select-container">
            <div class="modal-body-select-label"><span class="modal-body-select-container-span">답변자</span></div>
            <div class="w-25">${make_nullcate(answer.writer)}</div>
            <div class="modal-body-select-label"><span class="modal-body-select-container-span">응답일</span></div>
            <div class="w-25">${make_date(answer.created_at)}</div>
        </div>
        <div class="d-flex flex-column justify-content-start py-3">
            <div class="modal-body-select-label"><span class="modal-body-select-container-span">내용</span></div>
            <textarea class="modal-body-select w-100 mt-3" type="text" rows="15" cols="25"
            id="answer_content_modi">${answer.content}</textarea>
        </div>
        `;
        $('#teacher_answer').html(temp_answer_list);
        $('#teacher_answer').show()
        $('#button_box').html(`<button class="btn btn-success" type="submit" onclick="post_answer(${q_id},${question_detail_data.category},${1})">수정</button>`);
    }
    // 상담 일지 처리 
    let temp_his = `<div> 상담내역이 없습니다 </div>`;
    let category = ''
    if(question_detail_data.consulting_history){
        let solution = question_detail_data.solution.replace(/\n/g, '</br>')
        if (question_detail_data.consulting_categoryid < 100) {
            category = `${question_detail_data.week_code}주간 ${question_detail_data.consulting_category}상담`
        } else {
            category = `${question_detail_data.consulting_category} ${question_detail_data.consulting_category}`
        }
        temp_his = `
        <div class="modal-body-select-container">
            <div class="modal-body-select-label align-items-start"><span class="modal-body-select-container-span">상담 종류</span></div>
            <div style="width:16.666%; margin-right:20px;">${category}</div>
            <div class="modal-body-select-label align-items-start"><span class="modal-body-select-container-span">상담 사유</span></div>
            <div style="width:16.666%; margin-right:20px;">${question_detail_data.reason}</div>
            <div class="modal-body-select-label align-items-start"><span class="modal-body-select-container-span">상담 일시</span></div>
            <div style="width:16.666%; margin-right:20px;">${make_date(question_detail_data.created_at)}</div>
        </div>
        <div class="d-flex flex-column py-3">
            <div class="modal-body-select-label mt-3"><span class="modal-body-select-container-span">제공 가이드</span></div>
            <div class="mt-3 px-2">${solution}</div>
        </div>
        `;
        $('#cha').html(temp_his);
        $('#consulting_history_attach').show()
    }
}
// 과거 cs 문의 상세보기
async function get_cs_detail(q_id) {
    $('.cs_inloading').show()
    $('.not_inloading').hide()
    $('#button_box').empty();
    let question_detail_data = CSdata.filter(cs=>cs.id == q_id)[0]
    // let contents = question_detail_data.contents.replace(/\n/g, '</br>')
    $('.cs_inloading').hide()
    $('.not_inloading').show()

    $('#consulting_history_attach').hide()
    $('#manage_answer').hide()

    // 문의 상세 내용 
    let temp_question_list = `
    <div class="modal-body-select-container">
        <div class="modal-body-select-label"><span class="modal-body-select-container-span">제목</span></div>
        <div>이전 페이지 CS</div>
    </div>
    <div class="modal-body-select-container">
        <div class="modal-body-select-label"><span class="modal-body-select-container-span">작성일</span></div>
        <div>${question_detail_data.created_at}</div>
    </div>
    <div class="modal-body-select-container" style="padding: 12px 0">
        <div class="modal-body-select-label"><span class="modal-body-select-container-span">문의 종류</span></div>
        <div class="w-25">${question_detail_data.category}문의</div>
    </div>
    <div class="modal-body-select-container">
        <div class="modal-body-select-label"><span class="modal-body-select-container-span">대상 반</span></div>
        <div>${question_detail_data.ban_name} ➖ 담임 T : ${question_detail_data.teacher_name} </div>
    </div>
    <div class="modal-body-select-container">
        <div class="modal-body-select-label"><span class="modal-body-select-container-span">학생</span></div>
        <div>${question_detail_data.student_name} ( ${question_detail_data.origin}) </div>
    </div>
    <div class="d-flex flex-column justify-content-start py-3">
        <div class="modal-body-select-label"><span class="modal-body-select-container-span">내용</span></div>
        <div class="mt-4 ps-2">${question_detail_data.question_contents}</div>
    </div>
    `
    $('#teacher_question').html(temp_question_list);

    let temp_answer_list = `
    <div class="modal-body-select-container">
        <div class="modal-body-select-label"><span class="modal-body-select-container-span">답변자</span></div>
        <div class="w-25">${make_nullcate(question_detail_data.answerer)}</div>
        <div class="modal-body-select-label"><span class="modal-body-select-container-span">응답일</span></div>
        <div class="w-25">${make_date(question_detail_data.created_at)}</div>
    </div>
    <div class="d-flex flex-column justify-content-start py-3">
        <div class="modal-body-select-label"><span class="modal-body-select-container-span">내용</span></div>
        <div class="mt-4 ps-2">${question_detail_data.answer_contents}</div>
    </div>
    `;
    $('#teacher_answer').html(temp_answer_list);
    $('#teacher_answer').show()
}
// 본원 답변 기능 
async function post_answer(q_id, category,done_code) {
    let q_kind = $('#question_kind').val()
    if(q_kind == 'none'){
        if(done_code == 0){
            const response = await $.ajax({
                type: "GET",
                url: "/manage/is_it_done/"+q_id,
                dataType: 'json',
                data: {},
            });
            let target_answer = response['target_answer']
            if(target_answer.length > 0){
                target_answer = target_answer[0]
                let answerer = make_nullcate(target_answer.answerer)
                alert(answerer+'(이)가 이미 응답한 문의 입니다')
                
                $('#manage_answer').hide()
                let temp_answer_list = `
                <div class="modal-body-select-container">
                    <div class="modal-body-select-label"><span class="modal-body-select-container-span">답변자</span></div>
                    <div class="w-25">${answerer}</div>
                    <div class="modal-body-select-label"><span class="modal-body-select-container-span">응답일</span></div>
                    <div class="w-25">${make_date(target_answer.created_at)}</div>
                </div>
                <div class="d-flex flex-column justify-content-start py-3">
                    <div class="modal-body-select-label"><span class="modal-body-select-container-span">내용</span></div>
                    <textarea class="modal-body-select w-100 mt-3" type="text" rows="15" cols="25"
                    id="answer_content_modi">${target_answer.answer_contents}</textarea>
                </div>
                `;
                $('#teacher_answer').html(temp_answer_list);
                $('#button_box').html(`<button class="btn btn-success" type="submit" onclick="post_answer(${q_id},${target_answer.category},${1})">수정</button>`);
                $('#teacher_answer').show()
                
                // var con_val = confirm('수정하시겠습니까?')
                // if (con_val == true) {
                //     post_answer(q_id,target_answer.category,1);
                // }else{
                //     return
                // }
                return
            }else{
                // 정상 저장의 경우 
                answer_contents = $('#answer_contents').val()
                o_ban_id = 0
                if(category == 2) {
                    o_ban_id = Number($('#o_ban_id2').val().split('_')[0])
                }else if(category == 3 || category == 1){
                    o_ban_id = $('#o_ban_id').val()
                }
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
    // if (!consultingData) {
    //     await get_all_consulting().then(() => {
    //         $('.cs_inloading').hide()
    //         $('.not_inloading').show()
    //     });
    // }
    $('.cs_inloading').hide()
    $('.not_inloading').show()
    all_uc_consulting = consultingData.filter(c=>c.category_id > 100)
    studentsData.forEach((elem) => {
        elem.unlearned = consultingData.filter(a => a.student_id == elem.student_id && a.category_id < 100).length
        elem.up = answer_rate(elem.unlearned, all_uc_consulting.length).toFixed(2)
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
    $('#task_ban').html(temp_ban_option)

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
        $('#task_ban').html(temp_ban_option)
    });
}
function show_ban_selection() {
    var selectedOptions = ''
    for (i = 0; i < selectedBanList.length; i++) {
        // bid+tid+bname+sid+sname
        var value = selectedBanList[i].split('_')
        selectedOptions += `
        <td class="col-11">${value[2]}</td>
        <td class="col-1" onclick="delete_selected_ban(${i})"><span class="cursor">❌</span></td>`;
        $('#target_task_bans').html(selectedOptions);
    }
}
function task_ban_change(btid) {
    if (btid.includes('_')) {
        // 개별 반 처리
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

function post_task_request() {
    let task_cateogry = $('#task_category_list').val()
    let task_date = $('#task_date').val()
    let task_deadline = $('#task_deadline').val()
    let task_contents = $('#task_contents').val()

    if(task_cateogry == 0){
        alert('카테고리를 선택해 주세요')
        reutrn
    }
    if(!task_date || !task_deadline){
        alert('업무 시작/종료일을 선택해 주세요')
        reutrn
    }
    if(!task_contents){
        alert('업무 내용을 적어주세요')
        reutrn
    }
    let task_cycle = $('#task_cycle').val()
    let task_priority = $('#task_priority').val()
    // 다중 선택 대상 선택일 경우  )
    if (selectedBanList.length == 0) {
        let selected = Number($('select[name="task_target_ban[]"]').val()[0])
        $.ajax({
            url: '/manage/task/'+selected,
            type: 'POST',
            data: JSON.stringify({
                task_category_list: task_cateogry,
                task_date: task_date,
                task_deadline: task_deadline,
                task_contents: task_contents,
                task_cycle:task_cycle,
                task_priority:task_priority
            }),
            contentType: 'application/json',
            success: function(response) {
              // 요청이 성공했을 때의 처리
              if(response['result'] == 'success'){
                alert('업무 요청이 완료되었습니다')
                window.location.reload()
              }
            },
            error: function(error) {
              // 요청이 실패했을 때의 처리
              console.log(error);
            }
        });
    }else{
        $.ajax({
            url: `/manage/task/0`,
            type: 'POST',
            data: JSON.stringify({ 
                selectedBanList: selectedBanList,
                task_category_list: task_cateogry,
                task_date: task_date,
                task_deadline: task_deadline,
                task_contents: task_contents,
                task_cycle:task_cycle,
                task_priority:task_priority
            }),
            contentType: 'application/json',
            success: function(response) {
                if(response['result'] == 'success'){
                    alert('업무 요청이 완료되었습니다')
                    window.location.reload()
                }
            },
            error: function(error) {
              // 요청이 실패했을 때의 처리
              console.log(error);
            }
        });
    }
    //     console.log(selectedBanList)
    //     let total_ban_selections = selectedStudentList.filter(value=>!(value.includes('_')))
    //     let total_student_selections = selectedStudentList.filter(value => value.includes('-1'));
    //     const totalPromises = [];

    //     // 전체 반 대상 
    //     if (total_ban_selections.length != 0) {
    //         total_ban_selections.forEach(value => {
    //             v = Number(value)
    //             const promise = $.ajax({
    //                 type: "POST",
    //                 url: '/manage/consulting/all_ban/' + v,
    //                 // data: JSON.stringify(jsonData), // String -> json 형태로 변환
    //                 data: {
    //                     consulting_category: consulting_category,
    //                     consulting_contents: consulting_contents,
    //                     consulting_date: consulting_date,
    //                     consulting_deadline: consulting_deadline
    //                 }
    //             })
    //             totalPromises.push(promise);
    //         })
    //     }
    //     // 전체 학생 대상
    //     if (total_student_selections.length != 0) {
    //         total_student_selections.forEach(value => {
    //             v = value.split('_')
    //             totalstudent_ban_id = Number(v[0])
    //             totalstudent_teacher_id = Number(v[1])
    //             const promise = $.ajax({
    //                 type: "POST",
    //                 url:`/manage/consulting/ban/${totalstudent_ban_id}/${totalstudent_teacher_id}/${v[2]}/`,
    //                 // data: JSON.stringify(jsonData), // String -> json 형태로 변환
    //                 data: {
    //                     consulting_category: consulting_category,
    //                     consulting_contents: consulting_contents,
    //                     consulting_date: consulting_date,
    //                     consulting_deadline: consulting_deadline
    //                 }
    //             })
    //             totalPromises.push(promise);
    //         })
    //     }
    //     // 개별 학생 대상 인 경우  
    //     let indivi_student_selections = selectedStudentList.filter(value => (value.includes('_')) && !(value.includes('-1')));
    //     if (indivi_student_selections.length != 0) {
    //         indivi_student_selections.forEach(value => {
    //             v = String(value).split('_')
    //             s_info = studentsData.filter(a => a.student_id ==  Number(v[3]))[0]
    //             const promise = $.ajax({
    //                 type: "POST",
    //                 url: '/manage/consulting/' + v[0] + '/' + v[1] + '/' + v[3]+ '/',
    //                 // data: JSON.stringify(jsonData), // String -> json 형태로 변환
    //                 data: {
    //                     student_name : s_info['student_name'],
    //                     student_engname : s_info['student_engname'],
    //                     origin : s_info['origin'],
    //                     consulting_category: consulting_category,
    //                     consulting_contents: consulting_contents,
    //                     consulting_date: consulting_date,
    //                     consulting_deadline: consulting_deadline
    //                 }
    //             })
    //             totalPromises.push(promise);
    //         })
    //     }
    //     Promise.all(totalPromises).then((responses) => {
    //         let isSuccess = true;
    //         responses.forEach(response => {
    //             if (response['result'] !== 'success') {
    //                 isSuccess = false;
    //             }
    //         })
    //         if (isSuccess) {
    //             alert('상담 요청 완료');
    //             window.location.reload();
    //         } else {
    //             alert('상담 요청 실패');
    //         }
    //     })
    // }
}

// 상담 요청 관련 함수 
async function request_consulting() {
    $('#consultingban_search_input').off('keyup');
    $('.mo_inloading').show()
    $('.monot_inloading').hide()
    if (!consultingcateData) {
        await get_all_consultingcate()
    }
    $('.mo_inloading').hide()
    $('.monot_inloading').show()

    $('#result_tbox').empty()
    $('#select_student').hide()
    $("#consulting_date").datepicker({ dateFormat: 'yy-mm-dd' });
    $("#consulting_deadline").datepicker({ dateFormat: 'yy-mm-dd' });

    let copy_data = studentsData.slice();
    let target_studentData = copy_data.filter(s=>s.category_id == 1)
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
    target_studentData.forEach(student_data => {
        let value = `${student_data.ban_id}_${student_data.teacher_id}_${student_data.ban_name}_${student_data.student_id}_${student_data.student_name}`; // btid
        temp_student_option += `<option value="${value}">${student_data.student_name} ( ${student_data.student_engname} / ${student_data.origin} ) - ${student_data.ban_name}</option>`;
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
        var filteredData = target_studentData.filter(function (data) {
            return (data.hasOwnProperty('student_name') && data.student_name.toLowerCase().indexOf(searchInput) !== -1) || (data.hasOwnProperty('student_engname') && data.student_engname.toLowerCase().indexOf(searchInput) !== -1) || (data.hasOwnProperty('origin') && data.origin.toLowerCase().indexOf(searchInput) !== -1);
        });
        filteredData.forEach(student_data => {
            let value = `${student_data.ban_id}_${student_data.teacher_id}_${student_data.ban_name}_${student_data.student_id}_${student_data.student_name}`; // btid
            temp_student_option += `<option value="${value}">${student_data.student_name} ( ${student_data.student_engname} / ${student_data.origin} )  - ${student_data.ban_name}</option>`;
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
    for (i = 0; i < selectedStudentList.length; i++) {
        // bid+tid+bname+sid+sname
        if(selectedStudentList[i].includes('_')){
            var value = selectedStudentList[i].split('_')
            if(value.length > 3){
                selectedOptions += `
                <td class="col-4">${value[2]}</td>
                <td class="col-6">${value[4]}</td>
                <td class="col-2" onclick="delete_selected_student(${i})"><span class="cursor">❌</span></td>`;
            }else{
                selectedOptions += `
                <td class="col-4">${value[2]}</td>
                <td class="col-6">전체 원생 대상 진행</td>
                <td class="col-2" onclick="delete_selected_student(${i})"><span class="cursor">❌</span></td>`;
            }
        }else{
            var value = selectedStudentList[i]
            if(value==0 || value =='0'){
                selectedOptions += `<td class="col-10">전체 반 대상 진행</td><td class="col-2" onclick="delete_selected_student(${i})"><span class="cursor">❌</span></td>`
            }else if(value==1 || value =='1'){
                selectedOptions += `<td class="col-10">PLUS/ALPHA반 대상 진행</td><td class="col-2" onclick="delete_selected_student(${i})"><span class="cursor">❌</span></td>`
            }else if(value==2 || value =='2'){
                selectedOptions += `<td class="col-10">NF/Inter반 대상 진행</td><td class="col-2" onclick="delete_selected_student(${i})"><span class="cursor">❌</span></td>`
            }else if(value==3 || value =='3'){
                selectedOptions += `<td class="col-10">16기 대상 진행</td><td class="col-2" onclick="delete_selected_student(${i})"><span class="cursor">❌</span></td>`
            }else if(value==4 || value =='4'){
                selectedOptions += `<td class="col-10">17기 대상 진행</td><td class="col-2" onclick="delete_selected_student(${i})"><span class="cursor">❌</span></td>`
            }else{
                selectedOptions += `<td class="col-10">18기 대상 진행</td><td class="col-2" onclick="delete_selected_student(${i})"><span class="cursor">❌</span></td>`
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
    if(consulting_category == 0){
        alert('카테고리를 선택해 주세요')
        reutrn
    }
    consulting_contents = $('#consulting_contents').val()
    consulting_date = $('#consulting_date').val()
    consulting_deadline = $('#consulting_deadline').val()
    // 다중 선택 대상 선택일 경우  )
    if (selectedStudentList.length != 0) {
        let total_ban_selections = selectedStudentList.filter(value=>!(value.includes('_')))
        let total_student_selections = selectedStudentList.filter(value => value.includes('-1'));
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

async function get_request_consulting() {
    $('.mo_inloading').show();
    $('.not_inloading').hide();
    $('#request_consultingban_listbox').hide();
    $('#request_consulting_listbox').show();
    $('#my_consulting_requestModalLabel').html('요청한 상담 목록');
    Consultingcontainer = $('#consulting-pagination');
    ConsultingpaginationOptions = {
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        callback: function (data, pagination) {
            var dataHtml = '';
            $.each(data, function (index, consulting) {
            data = banData.filter(b => b.ban_id == consulting.ban_id)[0];
            consulting.ban_name = '-';
            if (data) {
                consulting.ban_name = data.name;
            }
            dataHtml += `
            <td class="col-2">"${make_date(consulting.startdate)}" ~ <strong>"${make_date(consulting.deadline)}"</strong></td>
            <td class="col-1">${consulting.category}</td>
            <td class="col-2">${make_small_char(consulting.contents)}</td>
            <td class="col-1">${consulting.ban_name}</td>
            <td class="col-1">${make_nullcate(consulting.teacher_name)} (${make_nullcate(consulting.teacher_engname)})</td>
            <td class="col-1">${make_nullcate(consulting.student_name)} (${make_nullcate(consulting.student_engname)})</td>
            <td class="col-1">${consulting.origin}</td>
            <td class="col-1">${make_reject_code(consulting.done)}</td>
            <td class="col-1" onclick="get_consultingdetail(${consulting.id})"> <span class="cursor">🔍</span> </td>
            <td class="col-1" onclick="delete_consulting(${consulting.id},${consulting.category_id})"> <span class="cursor">🗑️</span> </td>`;
            });
            // $('#consulting-option').html(idxHtml);
            $('#tr-row').html(dataHtml);
        }
    };
    if(!consultingData){
        $('.mo_inloading').show();
        $('.not_inloading').hide();
        $('#history_cate').html('<option value="none">전체 데이터 로딩중 . . . (카테고리 선택은 조금 대기해주세요)</option>');
        $('.waitplz').hide()
        consultingData = []
        let currentPage = 1;  // 현재 페이지 번호
        let pageSize = 5000;  // 페이지당 데이터 개수

        // await get_all_consulting()
        const consultingsWorker = new Worker("../static/js/consultings_worker.js");
        function fetchData() {
            consultingsWorker.postMessage({ page: currentPage, pageSize });
        }
        // Function to handle messages from the Web Worker
        consultingsWorker.onmessage = function (event) {
            $('.mo_inloading').show();
            $('.not_inloading').hide();
            $('#history_cate').html('<option value="none">전체 데이터 로딩중 . . . (카테고리 선택은 조금 대기해주세요)</option>');
            $('.waitplz').hide()
            let consultingCount = event.data.total_count
            consultingData = event.data.consulting;
            req_consultings = consultingData.filter(c => c.category_id > 100);
            Consultingcontainer.pagination(Object.assign(ConsultingpaginationOptions, { 'dataSource': req_consultings }));
            $('.mo_inloading').hide();
            $('.not_inloading').show();
            if(consultingData.length == consultingCount){
                return show_request_consulting()
            }
            // currentPage++
            pageSize=consultingCount
            fetchData();
        };
        fetchData();
    }
    show_request_consulting();
}
async function show_request_consulting() {
    $('#consulting_list_search_input').off('keyup');
    const updateSearchResult = function () {
        let copy_data = req_consultings.slice();
        const selectedCategory = $('#history_cate').val();
        const searchInput = $('#consulting_list_search_input').val().toLowerCase();
        if (selectedCategory != 'none' && searchInput == "") {
            copy_data = copy_data.filter((e) => {
            return e.category == selectedCategory;
            });
            Consultingcontainer.pagination('destroy');
            Consultingcontainer.pagination(Object.assign(ConsultingpaginationOptions, { 'dataSource': copy_data }));
        } else if (selectedCategory != 'none' && searchInput != "") {
            copy_data = copy_data.filter(function (d) {
            return (
                (d.category == selectedCategory) &&
                (d.hasOwnProperty('student_name') && d.student_name.toLowerCase().indexOf(searchInput) !== -1) ||
                (d.hasOwnProperty('origin') && d.origin.toLowerCase().indexOf(searchInput) !== -1)
            );
            });
            Consultingcontainer.pagination('destroy');
            Consultingcontainer.pagination(Object.assign(ConsultingpaginationOptions, { 'dataSource': copy_data }));
        } else if (selectedCategory == 'none' && searchInput != "") {
            copy_data = copy_data.filter(function (d) {
            return (
                (d.hasOwnProperty('student_name') && d.student_name.toLowerCase().indexOf(searchInput) !== -1) ||
                (d.hasOwnProperty('origin') && d.origin.toLowerCase().indexOf(searchInput) !== -1)
            );
            });
            Consultingcontainer.pagination('destroy');
            Consultingcontainer.pagination(Object.assign(ConsultingpaginationOptions, { 'dataSource': copy_data }));
        } else {
            Consultingcontainer.pagination('destroy');
            Consultingcontainer.pagination(Object.assign(ConsultingpaginationOptions, { 'dataSource': copy_data }));
        }
    };
    $('.mo_inloading').hide();
    $('.not_inloading').show();
    $('.waitplz').show()
    let copy_data = consultingData.slice();
    req_consultings = copy_data.filter(c => c.category_id > 100);
    Consultingcontainer.pagination(Object.assign(ConsultingpaginationOptions, { 'dataSource': req_consultings }));
    let category_set = new Set(req_consultings.map(c => c.category));
    let category_list = [...category_set];
    var idxHtml = `<option value="none">전체</option>`;
    $.each(category_list, function (idx, val) {
        idxHtml += `<option value="${val}">${val}</option>`;
    });
    $('#history_cate').html(idxHtml);
    $('#consulting_list_search_input').show();
    $('#history_cate, #consulting_list_search_input').on('change keyup', updateSearchResult);
    $('input[name="is_requ"]').change(function() {
        let selectedValue = $('input[name="is_requ"]:checked').val();
        if(selectedValue == 'none'){
            let copy_data = consultingData.slice();
            req_consultings = copy_data
        }else if(selectedValue == 0){
            let copy_data = consultingData.slice();
            req_consultings = copy_data.filter(c => c.category_id > 100);
        }else if(selectedValue == 1){
            let copy_data = consultingData.slice();
            req_consultings = copy_data.filter(c => c.category_id < 100);
        }else{
            let copy_data = consultingData.slice();
            req_consultings = copy_data.filter(c => c.category_id == 100);
        }
        Consultingcontainer.pagination(Object.assign(ConsultingpaginationOptions, { 'dataSource': req_consultings }))
        let category_set = new Set(req_consultings.map(c => c.category));
        let category_list = [...category_set];
        var idxHtml = `<option value="none">전체</option>`;
        $.each(category_list, function (idx, val) {
            idxHtml += `<option value="${val}">${val}</option>`;
        });
        $('#history_cate').html(idxHtml);
    });
}  
function sort_consultingoption(sortBy) {
    switch (sortBy) {
        case "name_desc":
            $('#student_name_sort').html('<strong>원생 이름순 정렬👇</strong>')    
            $('#deadline_sort').html('마감일 정렬👉')
            $('#startdate_sort').html('최근순 정렬👉')         
            $('#consulting_sort').html('미진행 정렬👉')        
            req_consultings.sort(function (a, b) {
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
            req_consultings.sort(function (a, b) {
                return new Date(a.deadline) - new Date(b.deadline);
            });
            break;
        
        case "startdate_desc":
            $('#student_name_sort').html('원생 이름순 정렬👉')    
            $('#deadline_sort').html('마감일 정렬👉') 
            $('#startdate_sort').html('<strong>최근순 정렬👇</strong>')        
            $('#consulting_sort').html('미진행 정렬👉')        
            req_consultings.sort(function (a, b) {
                return new Date(b.startdate) - new Date(a.startdate);
            });
            break;
    
        case "consulting_desc":
            $('#student_name_sort').html('원생 이름순 정렬👉')    
            $('#deadline_sort').html('마감일 정렬👉')    
            $('#startdate_sort').html('최근순 정렬👉')
            $('#consulting_sort').html('<strong>미진행 정렬👇</strong>') 
            req_consultings.sort(function (a, b) {
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
      Object.assign(ConsultingpaginationOptions, { dataSource: req_consultings })
    );
}
function get_consultingdetail(consulting_id) {
    const consulting_history = req_consultings.filter(c=>c.id == consulting_id)[0]
    const teacher_ban_info = banData.filter(b=>b.ban_id == consulting_history.ban_id)[0]
    $('#my_consulting_requestModalLabel').html(`${teacher_ban_info.name}반 ${teacher_ban_info.teacher_name}( ${teacher_ban_info.teacher_engname} )T의 ${consulting_history.category}`);
    
    let temp_his = ``;
    if(consulting_history.done == 0){
        temp_his += `
        <div class="modal-body-select-container">
            <div class="modal-body-select-label">✔️</div>
            <div>미진행</div>
        </div>
        `
    }else{
        temp_his += `
        <div class="modal-body-select-container">
            <div class="modal-body-select-label"><span class="modal-body-select-container-span">상담</span></div>
            <div class="w-25">상담 완료</div>
            <div class="modal-body-select-label"><span class="modal-body-select-container-span">상담 일시</span></div>
            <div class="w-25">${make_date(consulting_history.created_at)}</div>
        </div>
        `
    }
    temp_his += `
        <div class="modal-body-select-container">
            <div class="modal-body-select-label"><span class="modal-body-select-container-span">원생</span></div>
            <div class="w-25">${consulting_history.student_engname} (${consulting_history.student_name})</div>
            <div class="modal-body-select-label"><span class="modal-body-select-container-span">원번</span></div>
            <div class="w-25">${consulting_history.origin}</div>
        </div>
        <div class="d-flex flex-column justify-content-start py-3">
            <div class="modal-body-select-label"><span class="modal-body-select-container-span">내용</span></div>
            <div class="mt-3 px-2">${consulting_history.category}</div>
            <div class="mt-2 px-2">${consulting_history.contents.replace(/\n/g, '</br>')}</div>
        </div>
    `;

    if(consulting_history.done == 1){
        let solution = consulting_history.solution.replace(/\n/g, '</br>')
        temp_his += `
        <div class="d-flex flex-column justify-content-start py-3">
            <div class="modal-body-select-label"><span class="modal-body-select-container-span">상담 사유</span></div>
            <div class="mt-3 px-2">${consulting_history.reason}</div>
        </div>
        <div class="d-flex flex-column justify-content-start py-3">
            <div class="modal-body-select-label"><span class="modal-body-select-container-span">제공한 가이드</span></div>
            <div class="mt-3 px-2">${solution}</div>
        </div>
        `
    }

    temp_his += `
        <div class="w-100 pt-3 d-flex justify-content-center">
            <button class="btn btn-danger" onclick="get_request_consulting()">목록</button>
        </div>
    `
    $('#consulting_history_contents_box').html(temp_his);
    $('#request_consulting_listbox').hide();
    $('#request_consultingban_listbox').show();
}

// 요청 업무관리 기능 
async function get_task(){
    $('.mo_inloading').show()
    $('.not_inloading').hide()
    if (!taskData) {
        await get_all_task().then(() => {
            if (taskData.length > 0) {
                taskGrouped = taskData.reduce((acc, item) => {
                    const v = `${item.name}_${item.contents}_${item.startdate}_${item.deadline}_${item.cycle}_${item.priority}_${item.id}`;
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
                            console.log(key)
                            let task_info = key.split('_')
                            category_list.push(task_info[0])
                            dataHtml += `
                                <td class="col-1"> ${make_duedate(task_info[2],task_info[3])}</td>
                                <td class="col-3">"${task_info[2]}" ~ </br>"${task_info[3]}"</td>
                                <td class="col-1">${make_priority(task_info[5])}</td>
                                <td class="col-1">${make_cycle(task_info[4])}</td>
                                <td class="col-2">${task_info[0]} 업무</td>
                                <td class="col-2">${make_small_char(task_info[1])}</td>
                                <td class="col-1" onclick ="get_taskban('${key}')"> <span class="cursor">🔍</span> </td>
                                <td class="col-1" onclick ="delete_tasks('${task_info[6]}')" ><span class="cursor">🗑️</span></td>
                                `;
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
                        <td class="col-1" onclick ="get_taskban('${key}')"> <span class="cursor">🔍</span> </td>`;
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
                    <td class="col-1" onclick ="get_taskban('${key}')"> <span class="cursor">🔍</span> </td>`;
                }
            });
            $('#task-tr').html(dataHtml);
        }
    })
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
async function delete_tasks(idx) {
    idx = Number(idx)
    const csrf = $('#csrf_token').val();
    var con_val = confirm('요청된 업무를 전부 삭제하시겠습니까?')
    if (con_val == true) {
        await $.ajax({
            url: '/manage/api/every_delete_tasks/' + idx,
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

