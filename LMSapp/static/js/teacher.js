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
    $('#today_task_box').show();
})

//  문의 종류가 선택되면 모달창 뷰를 바꿔주는 함수 
function change_question_kind(str){
    if( str == "이반"){
        $('#invisible_for_1').hide();
        $('#invisible_for_2').show();
        $('#question_box').show();
    }else if( str == "퇴소" || str == "취소/환불"){
        $('#invisible_for_2').hide();
        $('#invisible_for_1').show();
        $('#question_box').show();
    }else{
        $('#invisible_for_1').hide();
        $('#invisible_for_2').hide();
        $('#question_box').show();
    }
}

function consulting_view(ban_regi){
    ban_regi = Number(ban_regi)
    if(ban_regi == 0){
        $('#consulting_title').html('상담할 반을 선택해주세요 ')
        $('#today_consulting_box').hide();
        $('#today_done_consulting_box').hide();
    }else if(ban_regi == 1){
        // get_done_task()
        $('#consulting_title').html('오늘 완료한 상담 목록')
    }else{
        $('#consulting_title').html('오늘의 상담')
        get_consulting(ban_regi)
        $('#today_done_consulting_box').hide();
    }
}

async function get_consulting(ban_regi){
    await $.ajax({
        type: "GET",
        url: "/teacher/consulting/"+ban_regi,
        data: {},
        success: function (response) {
            if(response["consulting"] == '없음'){
                let temp_consulting_contents_box = `
                <p> 오늘의 상담 업무를 완료했습니다 🎉</p>
                `;
                $('#today_consulting_box').html(temp_consulting_contents_box);
            }else{
                $('#today_consulting_box').empty()
                for(i=0;i<response["consulting"].length;i++){
                    let target = response["consulting"][i]
                    let student_name = target['name']
                    let register_no = target['s_id']
                    let mobileno = target['mobileno']
                    let student_reco_book_code = target['reco_book_code']
                    let consulting_num = target['consulting_num']
                    
                    let temp_consulting_contents_box = `
                        <div data-bs-toggle="modal" data-bs-target="#consultinghistory${register_no}">
                            <strong>${student_name} 상담 ${consulting_num}건</strong> 📞${mobileno} | 추천도서:${student_reco_book_code}
                        </div>
                        <div class="modal fade" id="consultinghistory${register_no}" tabindex="-1"
                            aria-labelledby="consultinghistoryModalLabel" aria-hidden="true">
                            <div class="modal-dialog modal-dialog-centered modal-xl">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title" id="consultinghistoryModalLabel">
                                            <img src="#" style="width: 30px;">&nbsp;&nbsp;${student_name}상담일지 작성
                                        </h5>
                                        <button type="button" class="btn btn-close btn-close-white" data-bs-dismiss="modal"></button>
                                    </div>
                                    <div class="modal-body py-4 px-5">
                                        <form action="/teacher/consulting" method="POST">
                                            <input type="hidden" name="csrf_token" value="{{ csrf_token() }}" style="display: block;"/>
                                            <div class="modal-body-select-container"  id="consultingneeded">
                                                <span class="modal-body-select-label">진행 할 상담 목록</span>
                                                <div id="consultinglist${register_no}" class="modal-body-select">
                                                </div>
                                            </div>
                                            <div class="modal-body-select-container"  id="consultinghistory_kind">
                                                <span class="modal-body-select-label">진행 할 상담</span>
                                                <select id="consultinghistory_kind${register_no}" class="modal-body-select" name="consultinghistory_category">
                                                    <option value="none" selected>진행 할 상담을 선택해주세요</option>
                                                </select>
                                            </div>
                                            <div id="consulting_box">
                                                <div class="modal-body-select-container">
                                                    <span class="modal-body-select-label">상담 사유</span>
                                                    <input class="modal-body-select" type="text" size="50" name="consulting_reson" style="width: 75%;">
                                                </div>
                                                <div class="modal-body-select-container">
                                                    <span class="modal-body-select-label">제공한 가이드</span>
                                                    <input class="modal-body-select" type="text" size="50" name="consulting_solution" style="width: 75%;">
                                                </div>
                                                <div class="modal-body-select-container">
                                                    <span class="modal-body-select-label">상담 결과</span>
                                                    <textarea id="consulting_contents" class="modal-body-select" type="text"rows="5" cols="25" name="consulting_result" style="width: 75%;"></textarea>
                                                </div>
                                                <div class="modal-body-select-container">
                                                <span class="modal-body-select-label">부재중</span>
                                                <label><input type="checkbox" name="missed" value="missed">부재중</label>
                                                </div>
                                            </div>
                                            <div class="d-flex justify-content-center mt-4 mb-2">
                                                <button class="btn btn-dark" type="submit">저장</button>
                                            </div>
                                        </form>
                                    </div>           
                                </div>
                            </div>
                        </div>
                    `;
                    $('#today_consulting_box').append(temp_consulting_contents_box);
                    
                    $('#consultinghistory_kind'+register_no).empty()
                    let target_consulting = target['consultings']
                    for(j=0;j<target_consulting.length;j++){
                        let target_consulting_data = target_consulting[j]
                        let consulting_id = target_consulting_data['c_id']
                        let contents = target_consulting_data['contents']
                        let category = target_consulting_data['category']
                        let deadline = target_consulting_data['deadline']

                        let temp_consulting_list = `
                            <p>✅<strong>${category}</strong> ${contents} *마감: ~${deadline}까지</p>
                        `;
                        let temp_consulting_contents_box = `
                            <option value=${consulting_id}>${contents}</option>
                        `;
                        $('#consultinghistory_kind'+register_no).append(temp_consulting_contents_box);
                        $('#consultinglist'+register_no).append(temp_consulting_list);
                    }
                }
            }
        }
    });
    $('#today_consulting_box').show();
    $('#today_done_consulting_box').hide();
}

function task_doneview(done_code){
    if(done_code == 0){
        $('#task_title').html('오늘의 업무')
        $('#today_task_box').show();
        $('#today_done_box').hide();
    }else if(done_code == 1){
        get_done_task()
    }
}

async function get_task(category_id){
    await $.ajax({
        type: "GET",
        url: "/teacher/"+category_id,
        data: {},
        success: function (response) {
            let tcb = '#task_contents_box'+category_id
            if(response["task"] == '없음'){
                let temp_task_contents_box = `
                <p> 오늘의 업무를 완료했습니다! 🎉</p>
                `;
                $(tcb).html(temp_task_contents_box);
            }else{
                let target_task = response["task"]
                 $(tcb).empty()
                for(i=0;i<target_task.length;i++){
                    let target = target_task[i]
                    let contents = target['contents']
                    let deadline = target['deadline']
                    let temp_task_contents_box = `
                    <p>✅ ${contents}  마감 : ${deadline} 까지 </p>
                    <form method="post" class="make_row" id="task_ban_box_incomplete${category_id}${i}">
                    <input type="hidden" name="csrf_token" value="{{ csrf_token() }}" style="display: block;"/>
                    </form>
                    `;
                    $('#task_ban_box_incomplete'+i).empty()
                    $('#task_ban_box_complete'+i).empty()
                    $(tcb).append(temp_task_contents_box);
                    let target_ban = target['task_ban']
                    for(j=0;j<target_ban.length;j++){
                        let target_ban_data = target_ban[j]
                        let task_id = target_ban_data['id']
                        let name = target_ban_data['ban']
                        let done = target_ban_data['done']
                        let temp_task_ban_box = `
                        <label><input type="checkbox" name="taskid" value="${task_id}">${name}</label>
                        `;
                        $('#task_ban_box_incomplete'+category_id+i).append(temp_task_ban_box);
                    }
                }
            }
            // alert(response["title"])
        //     if (response["result"]=='문의가 전송되었습니다') {
        //     window.location.replace('/teacher')
        // }else {window.location.href='/'}
        }
    });
    $('#today_task_box').show();
    $('#today_done_box').hide();
}

async function get_done_task(){
    $('#task_title').html('완료한 업무')
    $('#today_task_box').hide();
    $('#today_done_box').show();

    await $.ajax({
        type: "GET",
        url: "/teacher/taskdone",
        data: {},
        success: function (response) {
            if(response["task"] == '없음'){
                let temp_task_contents_box = `
                <p> 오늘 완료한 업무가 없어요 😅</p>
                `;
                $('#today_done_box').html(temp_task_contents_box);
            }else{
                 $('#today_done_box').empty()
                for(i=0;i<response["task"].length;i++){
                    let target = response["task"][i]
                    console.log(target)
                    let temp_task_contents_box = `
                    <p>✅ ${target} </p>
                    `;
                    $('#today_done_box').append(temp_task_contents_box);
                }
            }
        }
    });
}
function get_update_done(){
    $('input:checkbox[name=taskid]').each(
        function(i,iVal){
           let target = Number(iVal.defaultValue);
           console.log(target)
           return update_done(target)
        }
    );
}
function update_done(target){
    console.log(target)
    $.ajax({
            type: "POST",
			url:'/teacher/'+target,
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

async function get_answer(q_id){
     await $.ajax({
        type: "GET",
        url: "/teacher/question/"+q_id,
        data: {},
        success: function (response) {
        console.log(response)
            // alert(response["title"])
        //     if (response["result"]=='문의가 전송되었습니다') {
        //     window.location.replace('/teacher')
        // }else {window.location.href='/'}
        category = response["category"]
        title = response["title"]
        contents = response["contents"]
        teacher = response["teacher"]
        teacher_e = response["teacher_e"]
        create_date = response["create_date"]
        answer = response['answer']
        answer_at = response['answer_at']

        if(category == '일반문의'){
            let temp_question_list = `
            <ul>
                <li>종류 : ${category} </li>
                <li>제목 : ${title}</li>
                <li>문의 : ${contents}</li>
                <li>작성자 : ${teacher} ( ${teacher_e} )</li>
                <li>작성일 : ${create_date}</li>
                <li>답변 : ${answer}</li>
                <li>답변일 : ${answer_at}</li>
            </ul>
            `;
            $('#questiondetail_box').append(temp_question_list);
        }
        else{
            ban = response["ban"]
            student = response["student"]
            student_origin = response["student_origin"]
            reject = response["reject"]
            answer = response["answer"]
            answer_at = response["answer_at"]
            let temp_question_list = `
            <ul>
                <li>종류 : ${category} </li>
                <li>제목 : ${title}</li>
                <li>문의 : ${contents}</li>
                <li>작성자 : ${teacher} ( ${teacher_e} )</li>
                <li>작성일 : ${create_date}</li>
                <li>대상 반 | 학생: ${ban} ➖ ${student} ( ${student_origin} )</li>
                <li>처리 : ${ reject } </li>
                <li>응답 : ${answer} </li>
                <li>응답일 : ${answer_at} </li>
            </ul>
            `;
            $('#questiondetail_box').append(temp_question_list);
        }
        }
    });
    $('#questionlist').hide()
    $('#questiondetail').show()
}

function go_back(){
    $('#questiondetail_box').empty();
    $('#questiondetail').hide();
    $('#questionlist').show();
}


