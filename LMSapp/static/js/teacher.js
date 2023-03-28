// xss 공격 체크 함수 
// function XSSCheck(str, level) {
//     if (level == undefined || level == 0) {
//         str = str.replace(/\<|\>|\"|\'|\%|\;|\(|\)|\&|\+|\-/g, "");
//     } else if (level != undefined && level == 1) {
//         str = str.replace(/\</g, "&lt;");
//         str = str.replace(/\>/g, "&gt;");
//     }
//     return str;
// }

// 처음 get 할때 뿌려질 정보 보내는 함수 
$(document).ready(function () {
    task_doneview(0)
})

// 본원 문의 관련 함수 
//  문의 종류가 선택되면 모달창 뷰를 바꿔주는 함수 
function change_question_kind(str){
    if( str == "일반"){
        $('#invisible_for_2').hide();
        $('#question_box').show();
    }else{
        $('#invisible_for_2').show();
        $('#question_box').show();
    }
}
function go_back(){
    $('#questiondetail').hide();
    $('#questionlist').show();
    $('#teachers_student_list').show();
    $('#make_plus_consulting').hide();
    $('#banstudentlistModalLabel').html('원생목록')
}
function q_category(category){
    if(category == 0){
        category = '일반문의'
    }else if(category == 1){
        category = '취소/환불/퇴소 문의'
    }else{
        category = '이반문의'
    }
    return category
}

function get_question_list(){
    $.ajax({
        type: "GET",
        url: "/teacher/question",
        data: {},
        success: function(response){
            let temp_html = ''
            for(i=0;i<response['questions'].length;i++){
                var id = response['questions'][i]['id']
                var category = q_category(response['questions'][i]['category'])
                var title = response['questions'][i]['title']
                var create_date = response['questions'][i]['create_date']
                var done_code = response['questions'][i]['answer']
                if(done_code == 0){
                    answer = '미응답'
                }else{
                    answer = `${create_date}날 답변`
                }
                var comments = response['questions'][i]['comments']
                
                temp_html += `
                <td class="col-3">${category}</td>
                <td class="col-4">${title}</td>
                <td class="col-3" onclick="get_question(${id},${done_code})"> ${answer} </td>
                <td class="col-1" onclick="delete_question(${id})"> ❌ </td>
                <td class="col-1"> ${comments} </td>
                `;
            }
            $('#teacher_question_list').html(temp_html)
        }
    })
}
// 문의 내용 상세보기
// async function get_question(q_id,done_code){
//     await $.ajax({
//        type: "GET",
//        url: "/teacher/question/"+q_id,
//        data: {},
//        success: function (response) {
//         category = response["category"]
//         title = response["title"]
//         contents = response["contents"]
//         teacher = response["teacher"]
//         teacher_e = response["teacher_e"]
//         create_date = response["create_date"]
//         answer = response['answer']
//         answer_at = response['answer_at']
//         comments = response['comment']
//         attach = response['attach']
//         let code = 0;
//         let temp_comment = `     
//         <input class="border rounded-0 form-control form-control-sm" type="text" id="comment_contents"
//         placeholder="댓글을 남겨주세요">
//         <button onclick="post_comment(${q_id},${0})">등록</button>
//         `;
//         $('#comment_post_box').html(temp_comment)
    
//         $('#comments').empty()
//         if( comments.length != 0 ){
//             for(i=0;i<comments.length;i++){
//                 c_id = comments[i]['c_id']
//                 c_contents = comments[i]['c_contents']
//                 c_created_at = comments[i]['c_created_at']
//                 writer = comments[i]['writer']
//                 parent_id = comments[i]['parent_id']

//                 if(parent_id == 0){
//                     let temp_comments = `
//                     <div id="for_comment${c_id}" style="margin-top:10px">
//                         <p class="p_comment">${c_contents}  (작성자 : ${writer} | ${c_created_at} )</p>
//                     </div>
//                     <details style="margin-top:0px;margin-right:5px;font-size:0.9rem;">
//                         <summary><strong>대댓글 달기</strong></summary>
//                             <input class="border rounded-0 form-control form-control-sm" type="text" id="comment_contents${c_id}"
//                             placeholder=" 대댓글 ">
//                             <button onclick="post_comment(${q_id},${c_id})">등록</button>
//                         </details>
//                     `;
//                     $('#comments').append(temp_comments);
//                 }else{
//                     let temp_comments = `
//                     <p class="c_comment"> ➖ ${c_contents}  (작성자 : ${writer} | ${c_created_at} )</p>
//                     `;
//                     $(`#for_comment${parent_id}`).append(temp_comments);
//                 }
                
//             }
//         }
//         if(category == '일반문의'){
//             code = 1
//             $('#consulting_history_attach').hide()
//             temp_question_list = `
//                 <div class="modal-body-select-container">
//                     <span class="modal-body-select-label">문의 종류</span>
//                     <p>${category}</p>
//                 </div>
//                 <div class="modal-body-select-container">
//                     <span class="modal-body-select-label">제목</span>
//                     <p>${title}</p>
//                 </div>
//                 <div class="modal-body-select-container">
//                     <span class="modal-body-select-label">내용</span>
//                     <p>${contents}</p>
//                 </div>
//                 <div class="modal-body-select-container">
//                     <span class="modal-body-select-label">작성자</span>
//                     <p>${teacher} ( ${teacher_e} )</p>
//                 </div>
//                 <div class="modal-body-select-container">
//                     <span class="modal-body-select-label">작성일</span>
//                     <p>${create_date}</p>
//                 </div>
//                 <div class="modal-body-select-container">
//                     <span class="modal-body-select-label">첨부파일</span>
//                     <a href="/common/downloadfile/question/${q_id}" download="${attach}">${attach}</a>
//                 </div>
//             `;
//         }else{
//             if(category == '이반 요청'){code = 2}else{code=3}
//             $('#consulting_history_attach').show()
//             ban = response["ban"]
//             student = response["student"]
//             student_origin = response["student_origin"]
//             reject = response["reject"]
//             temp_question_list = `
//                 <div class="modal-body-select-container">
//                     <span class="modal-body-select-label">문의 종류</span>
//                     <p>${category}</p>
//                 </div>
//                 <div class="modal-body-select-container">
//                     <span class="modal-body-select-label">제목</span>
//                     <p>${title}</p>
//                 </div>
//                 <div class="modal-body-select-container">
//                     <span class="modal-body-select-label">내용</span>
//                     <p>${contents}</p>
//                 </div>
//                 <div class="modal-body-select-container">
//                     <span class="modal-body-select-label">작성자</span>
//                     <p>${teacher} ( ${teacher_e} )</p>
//                 </div>
//                 <div class="modal-body-select-container">
//                     <span class="modal-body-select-label">작성일</span>
//                     <p>${create_date}</p>
//                 </div>
//                 <div class="modal-body-select-container">
//                     <span class="modal-body-select-label">대상 반 | 학생</span>
//                     <p>${ban} ➖ ${student} ( ${student_origin} )</p>
//                 </div>
//                 <div class="modal-body-select-container">
//                     <span class="modal-body-select-label">처리</span>
//                     <p>${reject}</p>
//                 </div>
//                 <div class="modal-body-select-container">
//                     <span class="modal-body-select-label">첨부파일</span>
//                     <a href="/common/downloadfile/question/${q_id}" download="${attach}">${attach}</a>
//                 </div>
//             `;
//             let history = response['history']
//             let reason = history['reason']
//             let solution = history['solution']
//             let result = history['result']
//             let created_at = history['created_at']
//             let temp_his = `
//             <div class="modal-body-select-container">
//                 <span class="modal-body-select-label">상담 사유</span>
//                 <p>${reason}</p>
//             </div>
//             <div class="modal-body-select-container">
//                 <span class="modal-body-select-label">제공한 가이드</span>
//                 <p>${solution}</p>
//             </div>
//             <div class="modal-body-select-container">
//                 <span class="modal-body-select-label">상담 결과</span>
//                 <p>${result}</p>
//             </div>
//             <div class="modal-body-select-container">
//                 <span class="modal-body-select-label">상담 일시</span>
//                 <p>${created_at}</p>
//             </div>
//             `;
//             $('#cha').html(temp_his);
//         }
//         let temp_answer_list = `
//         <div class="modal-body-select-container">
//         <span class="modal-body-select-label">응답</span>
//         <p>${answer}</p>
//         </div>
//         <div class="modal-body-select-container">
//             <span class="modal-body-select-label">응답일</span>
//             <p>${answer_at}</p>
//         </div>`
//         $('#teacher_answer').html(temp_answer_list);
//         $('#teacher_question').html(temp_question_list);

//         if(done_code == 0){
//             $('#manage_answer_1').show()
//             $('#comment_box').hide()
//             if(code == 1){
//                 $('#manage_answer_2').hide()
//                 $('#manage_answer_3').hide()
//             }else if(code == 2){
//                 $('#manage_answer_2').show()
//                 $('#manage_answer_3').hide()
//             }else{
//                 $('#manage_answer_3').show()
//                 $('#manage_answer_2').hide()
//             }
//             let temp_button_box = `
//             <button class="btn btn-dark" type="submit" onclick="post_answer(${q_id},${code})">저장</button>
//             <button type="button" class="btn btn-danger" data-bs-dismiss="modal">취소</button>
//             `
//             $('#button_box').html(temp_button_box);
//         }else if(done_code == 1){
//             $('#manage_answer_1').hide()
//             $('#manage_answer_2').hide()
//             $('#manage_answer_3').hide()
//             $('#comment_box').show()
//         }else{
//             $('#questionlist').hide()
//             $('#questiondetail').show()
//         }
//     }

//    });
//    $('#questionlist').hide()
//    $('#questiondetail').show()
// }
function get_ban_student(b_id){
    $.ajax({
        type: "GET",
        url: "/manage/ban/"+b_id,
        data: {},
        success: function (response) {
            // let target_ban = response['target_ban']
            if (response['status'] == 400){
                return
            }
            data_list = response['student_info']

            $('#student_list').empty()
            for (var i = 0; i < data_list.length; i++) {
                target = data_list[i]
                let id = target['register_no']
                let name = target['name'];
                let temp_target_student = `<option value="${id}"> ${name} </option>`;
                $('#student_list').append(temp_target_student)
            } 
        },
        error:function(xhr, status, error){
                alert('xhr.responseText');
            }
    })
}


// 상담 수행 관련 함수
function get_consulting_history(){
    let is_done = $('#history_done option:selected').val()
    let ban_id = $('#history_ban option:selected').val()
    done_consulting_history_view(ban_id,is_done)
}

function done_consulting_history_view(ban_id,is_done){
    $.ajax({
        type: "GET",
        url: "/teacher/mystudents/"+ban_id+'/'+is_done,
        data: {},
        success: function (response) {
            if(response["consulting_student_list"] == '없음'){
                $('#consulting_history_box').hide()
                $('#h_title').show();
            }else{
                $('#h_title').hide();
                $('#consulting_history_box').show()
                $('#consulting_history_student_list').empty()
                for(i=0;i<response["consulting_student_list"].length;i++){
                    let target = response["consulting_student_list"][i]
                    let student_name = target['name']
                    let student_id = target['s_id']
                    let mobileno = target['mobileno']
                    let student_reco_book_code = target['reco_book_code']
                    let consulting_num = target['consulting_num']
                    let temp_consulting_contents_box = `
                    <tr class="row">
                    <td class="col-3">${student_name}</td>
                    <td class="col-3">${mobileno}</td>
                    <td class="col-2">${student_reco_book_code}</td>
                    <td class="col-2">${consulting_num}</td>
                    <td class="col-2" data-bs-toggle="modal" data-bs-target="#consultinghistory" onclick="get_consulting(${student_id},${is_done})">상담일지 수정/작성</td> 
                    </tr>
                    `;
                    $('#consulting_history_student_list').append(temp_consulting_contents_box);
                }
            }
        }
            // alert(response["title"])
        //     if (response["result"]=='문의가 전송되었습니다') {
        //     window.location.replace('/teacher')
        // }else {window.location.href='/'}
    });

}
function get_consulting_student(is_done){
    $.ajax({
        type: "GET",
        url: "/teacher/mystudents/"+is_done,
        data: {},
        success: function (response) {
            const result = response['my_students'].reduce((acc, student) => {
                const consultingList = response['all_consulting']['data'].filter(consulting => consulting.student_id === student.register_no);
                
                if(consultingList.length>0){
                    const deadline = consultingList.reduce((prev, current) => {
                        const prevDueDate = prev.deadline instanceof Date ? prev.deadline.getTime() : Number.POSITIVE_INFINITY;
                        const currentDueDate = current.deadline instanceof Date ? current.deadline.getTime() : Number.POSITIVE_INFINITY;
                        return currentDueDate < prevDueDate ? current : prev;
                    }, consultingList[0]);
                    acc.push({
                        'student_id': student.register_no,
                        'student_name': student.name,
                        'student_mobileno': student.mobileno,
                        'ban_name': student.classname,
                        'consulting_num': consultingList.length,
                        'consultings': consultingList,
                        'deadline' : deadline.deadline
                    });
                }
                return acc;
            },[]);
            if(result.length > 0){
                $('#consulting_title').html('오늘의 상담');
                let temp_consulting_contents_box =''
                for(i=0;i<result.length;i++){
                    var ban_name = result[i]['ban_name']
                    var student_id = result[i]['student_id']
                    var student_name = result[i]['student_name']
                    var mobileno = result[i]['student_mobileno']
                    var consulting_num = result[i]['consulting_num']
                    var deadline = result[i]['deadline']
                    temp_consulting_contents_box += `
                    <td class="col-3">${ban_name}</td>
                    <td class="col-2">${student_name}</td>
                    <td class="col-3">${mobileno}</td>
                    <td class="col-1">${consulting_num}</td>
                    <td class="col-2">${deadline}</td>
                    <td class="col-2" data-bs-toggle="modal" data-bs-target="#consultinghistory" onclick="get_consulting(${student_id},${is_done})">상담 실행</td> 
                    `;
                    $('#today_consulting_box').html(temp_consulting_contents_box);
                }
            }else{
                $('#consulting_title').html('오늘의 상담이 없습니다.');
            }
        }
    });
}
function get_consulting(student_id,is_done){
    $.ajax({
        type: "GET",
        url: "/teacher/consulting/"+student_id+"/"+is_done,
        data: {},
        success: function (response) {
            if(response["consulting_list"] == '없음'){
                $('#consultinghistoryModalLabelt').html('진행 할 상담이 없습니다.')
            //     $('#consulting_list').hide();
            //     let temp_consulting_contents_box = `
            //     <p> 오늘의 상담 업무를 완료했습니다 🎉</p>
            //     `;
            //     $('#consulting_msg').html(temp_consulting_contents_box);
            }else{
                $('#consultinghistoryModalLabelt').html('상담일지 작성')
                $('#consulting_write_box').empty();
                let r_target = response["consulting_list"]
                for(i=0;i<r_target.length;i++){
                    let target = r_target[i]
                    let category = target['category']
                    let consulting_id = target['c_id']
                    let contents = target['contents']
                    let consulting_missed = target['consulting_missed']
                    let deadline = target['deadline']
                if(is_done == 1){
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
                }else{
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
function attach_consulting_history(student_id,is_done){
    $.ajax({
        type: "GET",
        url: "/teacher/consulting/"+student_id+"/"+is_done,
        // data: JSON.stringify(jsonData), // String -> json 형태로 변환
        data: {},
        success: function (response) {
            if(response['consulting_list'] == '없음'){
                let temp_consulting_contents_box = `<option value="none" selected>상담을 우선 진행해주세요</option>`;
                $('#h_select_box').append(temp_consulting_contents_box)
            }else{
                $('#h_select_box').empty();
                let target = response["consulting_list"]
                for(i=0;i<target.length;i++){
                    let h_id = target[i]['history_id']
                    let consulting = target[i]['contents']
                    let history_result = target[i]['history_result']
                    let temp_consulting_contents_box = `
                     <option value=${h_id}>${consulting} - 상담결과: ${history_result}</option>
                    `;
                    $('#h_select_box').append(temp_consulting_contents_box)                    
                }
            }
        }
    });
}
function post_bulk_consultings(c_length,is_done){
    for(i=0;i<c_length;i++){
        target = $('#target_consulting_id'+i).val()
        post_target_consulting(target,is_done)
    }
}
function post_target_consulting(consulting,is_done){
    consulting_missed = $(`input:checkbox[id="missed"]`).is(":checked")
    consulting_reason = $('#consulting_reason'+consulting).val()
    consulting_solution = $('#consulting_solution'+consulting).val()
    consulting_result = $('#consulting_result'+consulting).val()
    if((consulting_reason.length == 0)){
        consulting_reason="noupdate"
    }if((consulting_solution.length == 0)){
        consulting_solution="noupdate"
    }if((consulting_result.length == 0)){
        consulting_result="noupdate"
    }
    $.ajax({
            type: "POST",
			url:'/teacher/consulting/'+consulting+'/'+is_done,
			// data: JSON.stringify(jsonData), // String -> json 형태로 변환
            data: {
                consulting_reason:consulting_reason,
                consulting_solution:consulting_solution,
                consulting_result:consulting_result,
                consulting_missed:consulting_missed,
            },
            success: function (response) {{
				alert(response["result"])
                window.location.reload()
			}}
		})
}
function plusconsulting(student_id,b_id){
    $('#teachers_student_list').hide();
    $('#make_plus_consulting').show();
    $('#banstudentlistModalLabel').html('추가 상담 상담일지 작성')
    let temp_button = `
    <button class="btn btn-dark" onclick=plusconsulting_history(${student_id},${b_id})>저장</button>
    `;
    $('#plusconsulting_button_box').html(temp_button)
}
function plusconsulting_history(student_id,b_id){
    consulting_contents = $('#plus_consulting_contents').val()
    consulting_reason = $('#plus_consulting_reason').val()
    consulting_solution = $('#plus_consulting_solution').val()
    consulting_result = $('#plus_consulting_result').val()
    $.ajax({
        type: "POST",
        url:'/teacher/plus_consulting/'+student_id+'/'+b_id,
        // data: JSON.stringify(jsonData), // String -> json 형태로 변환
        data: {
            consulting_contents:consulting_contents,
            consulting_reason:consulting_reason,
            consulting_solution:consulting_solution,
            consulting_result:consulting_result
        },
        success: function (response) {{
            alert(response["result"])
            window.location.reload()
        }}
    })
}

// 오늘의 업무 관련 함수 
async function task_doneview(done_code){
    if(done_code == 0){
        $('#task_title').html('오늘의 업무')
        $('#today_task_box0').show();
        $('#today_task_box1').hide();
        $('#task_button').show()
    }else{
        $('#task_title').html('오늘 완료한 업무')
        $('#today_task_box0').hide();
        $('#today_task_box1').show();
        $('#task_button').hide()
    }
    await $.ajax({
        type: "GET",
        url: "/teacher/task/"+done_code,
        data: {},
        success: function (response) {
            if((response["target_task"] == '없음')||(response["target_task"].length == 0)){
                if(done_code == 0){
                    $('#today_task_box0').html('오늘의 업무 끝 😆');
                    $('#today_task_box1').empty()
                }else{
                    $('#today_task_box1').html('완수한 업무가 없어요');
                    $('#today_task_box0').empty()
                }
            }else{
                $('#cate_menu').empty()
                $('#today_task_box'+done_code).empty()
                let range = 12/response['target_cate'].length;
                for(i=0;i<response['target_cate'].length;i++){
                    let category_id = response['target_cate'][i]['id'];
                    let name = response['target_cate'][i]['name'];
                    let temp_cate_menu = `
                    <th class="col-${range}">${name}</th>
                    `;
                    $('#cate_menu').append(temp_cate_menu)
                    let temp_for_task = `
                    <td class="col-${range}" id="for_task${done_code}${category_id}"></td>
                    `;
                    $('#today_task_box'+done_code).append(temp_for_task)
                    $(`#for_task${done_code}${category_id}`).empty()
                }
                for(i=0;i<response["target_task"].length;i++){
                    let id = response["target_task"][i]['id']
                    let category = response["target_task"][i]['category']
                    let contents = response["target_task"][i]['contents']
                    let deadline = response["target_task"][i]['deadline']
                    let priority = response["target_task"][i]['priority']
                    if(priority > 2){
                        let temp_task_contents_box = `
                        <details>
                            <summary onclick="get_taskban(${id},${done_code})">⭐우선업무:<strong>${contents}</strong>(마감 : ${deadline})</summary>
                            <div class="make_row" id="task_ban_box_incomplete${done_code}${id}">
                            </div>
                        </details>  
                        `;
                        $(`#for_task${done_code}${category}`).append(temp_task_contents_box);
                    }else{
                        let temp_task_contents_box = `
                        <details>
                            <summary onclick="get_taskban(${id},${done_code})">✅<strong>${contents}</strong>(마감 : ${deadline})</summary>
                            <div class="make_row" id="task_ban_box_incomplete${done_code}${id}">
                            </div>
                        </details> 
                        `;
                        $(`#for_task${done_code}${category}`).append(temp_task_contents_box);
                    }
                }
            }
        }
    });
}
function get_taskban(task_id,idx){
    $.ajax({
        type: "GET",
        url: "/teacher/taskban/"+task_id+"/"+idx,
        data: {},
        success: function (response) {
            $(`#task_ban_box_incomplete${idx}${task_id}`).empty();
            for(i=0;i<response['target_taskban']['data'].length;i++){
                let target = response['target_taskban']['data'][i]
                let id = target["id"]
                let ban_id = target["ban_id"]
                let ban =  function(ban_id) {
                    return response['mybans_info'].filter( a => a.register_no == ban_id)[0]['name'];
                }
                let temp_task_ban_box = '' 
                if(idx == 0){
                    temp_task_ban_box= `
                    <label><input type="checkbox" name="taskid" value="${id}"/>${ban(ban_id)}</label>
                    `;
                }else{
                    temp_task_ban_box = `<p>➖ ${ban(ban_id)} </p>`
                }
                
                $(`#task_ban_box_incomplete${idx}${task_id}`).append(temp_task_ban_box);
            }
        }
        
    });
}
function get_update_done(){
    $('input:checkbox[name=taskid]').each(function(index){
        if($(this).is(":checked")==true){
            return update_done($(this).val())
        }
    });
}
function update_done(target){
    $.ajax({
            type: "POST",
			url:'/teacher/task/'+target,
			// data: JSON.stringify(jsonData), // String -> json 형태로 변환
            data: {},
            success: function (response) {{
				if(response['result'] == '완료'){
                }else{
                    alert(response["result"])
                }
                window.location.replace('/teacher')
			}}
		})
}

// 남규님 
function get_data(){
    $.ajax({
        type: "GET",
        url: "/teacher/api/get_teacher_ban",
        data: {},
        success: function (response) {
        console.log(response)
        } 
    });
}
