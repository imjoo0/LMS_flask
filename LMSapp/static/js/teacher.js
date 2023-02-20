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

// 진행한 상담 조회
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

function get_consulting_student(ban_regi,is_done){
    if(ban_regi == 0){
        $('#consulting_student_list').hide();
        $('#consulting_msg').html('상담할 반을 선택해주세요');
    }else{
        $.ajax({
            type: "GET",
            url: "/teacher/mystudents/"+ban_regi+"/"+is_done,
            data: {},
            success: function (response) {
                if(response["consulting_student_list"] == '없음'){
                    $('#consulting_student_list').hide();
                    let temp_consulting_contents_box = `
                    <p> 오늘의 상담 업무를 완료했습니다 🎉</p>
                    `;
                    $('#consulting_msg').html(temp_consulting_contents_box);
                }else{
                    $('#consulting_msg').empty();
                    $('#consulting_student_list').show();
                    $('#today_consulting_box').empty()
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
                        <td class="col-2" data-bs-toggle="modal" data-bs-target="#consultinghistory" onclick="get_consulting(${student_id},${is_done})">상담 실행</td> 
                        </tr>
                        `;
                        $('#today_consulting_box').append(temp_consulting_contents_box);
                    }
                }
            }
        });
    }
    
    $('#today_consulting_box').show();
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
                            id="consulting_reason${consulting_id}" style="width: 75%;"placeholder=${history_reason}>
                    </div>
                    <div class="modal-body-select-container">
                        <span class="modal-body-select-label">제공한 가이드</span>
                        <input class="modal-body-select" type="text" size="50"
                            id="consulting_solution${consulting_id}" style="width: 75%;" placeholder=${history_solution}>
                    </div>
                    <div class="modal-body-select-container">
                        <span class="modal-body-select-label">상담 결과</span>
                        <textarea class="modal-body-select" type="text" rows="5" cols="25"
                            id="consulting_result${consulting_id}" style="width: 75%;" placeholder=${history_result}></textarea>
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
function post_bulk_consultings(c_length,is_done){
    for(i=0;i<c_length;i++){
        target = $('#target_consulting_id'+i).val()
        console.log(target)
        post_target_consulting(target,is_done)
    }
}
function post_target_consulting(consulting,is_done){
    consulting_missed = $(`input:checkbox[id="missed"]`).is(":checked")
    consulting_reason = $('#consulting_reason'+consulting).val()
    consulting_solution = $('#consulting_solution'+consulting).val()
    consulting_result = $('#consulting_result'+consulting).val()
    if((consulting_reason == "")){
        consulting_reason="noupdate"
    }else if((consulting_solution == "")){
        consulting_solution="noupdate"
    }else if((consulting_result == "")){
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
			}}
		})
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
                    let priority = target['priority']
                    if(priority > 2){
                        let temp_task_contents_box = `
                        <p>⭐우선업무: ${contents} (마감 : ${deadline})</p>
                        <form method="post" class="make_row" id="task_ban_box_incomplete${category_id}${i}">
                        <input type="hidden" name="csrf_token" value="{{ csrf_token() }}" style="display: block;"/>
                        </form>
                        `;
                        $(tcb).append(temp_task_contents_box);
                    }else{
                        let temp_task_contents_box = `
                        <p>✅ ${contents}  (마감 : ${deadline}) </p>
                        <form method="post" class="make_row" id="task_ban_box_incomplete${category_id}${i}">
                        <input type="hidden" name="csrf_token" value="{{ csrf_token() }}" style="display: block;"/>
                        </form>
                        `;
                        $(tcb).append(temp_task_contents_box);
                    }
                    
                    $('#task_ban_box_incomplete'+i).empty()
                    $('#task_ban_box_complete'+i).empty()
                    let target_ban = target['task_ban']
                    for(j=0;j<target_ban.length;j++){
                        let target_ban_data = target_ban[j]
                        let task_id = target_ban_data['id']
                        let name = target_ban_data['ban']
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
    $('input:checkbox[name=taskid]').each(function(index){
        if($(this).is(":checked")==true){
            return update_done($(this).val())
        }
    });
}
function update_done(target){
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

get_data()
