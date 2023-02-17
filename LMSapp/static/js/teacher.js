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

function get_consulting_history(){
    let is_missed = $('#history_done option:selected').val()
    let is_ban = $('#history_ban option:selected').val()
    if(is_missed == 0){
      $('#consulting_history_box').show()
      $('#missed_consulting_history_box').hide()
    }else if(is_missed == 1){
      $('#consulting_history_box').hide()
      $('#missed_consulting_history_box').show()
    }else{
        $('#missed_consulting_history_box').hide()
        $('#consulting_history_box').hide()
    }
    done_consulting_history_view(is_ban,is_missed)
}
function change(id){
    new_id = 'consultinghistorydiary'+String(id)
    $('#consultinghistorydiary').attr('id',new_id);
}
// 반이 선택 되면 모달창 뷰를 바꿔주는 함수 
function done_consulting_history_view(is_ban,is_missed){
    $.ajax({
        type: "GET",
        url: "/teacher/done_consulting/"+is_ban+'/'+is_missed,
        data: {},
        success: function (response) {
            if(response["consulting_history"] == '없음'){
                $('#missed_consulting_history_box').hide()
                $('#consulting_history_box').hide()
                $('#h_title').show();
            }else{
                $('#h_title').hide();
                $('#missed_consulting_history_student_list').empty()
                $('#consulting_history_student_list').empty()
                for(i=0;i<response["consulting_history"].length;i++){
                    let target = response["consulting_history"][i]
                    let student_name = target['name']
                    let register_no = target['s_id']
                    let mobileno = target['mobileno']
                    let student_reco_book_code = target['reco_book_code']
                    if(target['kind'] != '완료 상담'){ // 부재중 상담
                        let consulting_missed = target['kind']
                        let temp_ch_contents_box = `
                        <td class="col-3">${student_name}</td>
                            <td class="col-3">${mobileno}</td>
                            <td class="col-2">${student_reco_book_code}</td>
                            <td class="col-2">${consulting_missed}</td>
                            <td class="col-2" onclick="change(${register_no})">상담 수정</td>
                        `;
                        $('#missed_consulting_history_student_list').append(temp_ch_contents_box);

                        $('#consultinghistorydiary'+register_no).empty()
                        let target_consulting = target['consultings']
                        for(j=0;j<target_consulting.length;j++){
                            let target_consulting_data = target_consulting[j]
                            let consulting_id = target_consulting_data['c_id']
                            let contents = target_consulting_data['contents']
                            let category = target_consulting_data['category']
                            let deadline = target_consulting_data['deadline']
                            let temp_consulting_box = `
                            <p id=${consulting_id}>✅<strong>${category}</strong></br>${contents}</br>*마감: ~${deadline}까지</br></p>
                            <div class="modal-body-select-container">
                                <span class="modal-body-select-label">상담 사유</span>
                                <input class="modal-body-select" type="text" size="50" id="consulting_reason${consulting_id}" style="width: 75%;">
                            </div>
                            <div class="modal-body-select-container">
                                <span class="modal-body-select-label">제공한 가이드</span>
                                <input class="modal-body-select" type="text" size="50" id="consulting_solution${consulting_id}" style="width: 75%;">
                            </div>
                            <div class="modal-body-select-container">
                                <span class="modal-body-select-label">상담 결과</span>
                                <textarea class="modal-body-select" type="text"rows="5" cols="25" id="consulting_result${consulting_id}" style="width: 75%;"></textarea>
                            </div>
                            <div class="d-flex justify-content-center mt-4 mb-2" id="consulting_button_box">
                                <button class="btn btn-dark" onclick="post_target_consulting(${consulting_id},${register_no})" style="margin-right:5px">저장</button>
                            </div>  
                            `;
                            $('#consultinghistorydiary'+register_no).append(temp_consulting_box);
                        }
                        
                    }else{
                        let consulting_num = target['consulting_num']
                        let temp_ch_contents_box = `
                        <td class="col-3">${student_name}</td>
                            <td class="col-3">${mobileno}</td>
                            <td class="col-2">${student_reco_book_code}</td>
                            <td class="col-2">${consulting_num}</td>
                            <td class="col-2" onclick="done_consulting_history_view('${ register_no }')">상담 내역 확인하기</td>
                        `;
                        $('#consulting_history_student_list').append(temp_ch_contents_box);
                    }
                    
                }
                
            }
        }
            // alert(response["title"])
        //     if (response["result"]=='문의가 전송되었습니다') {
        //     window.location.replace('/teacher')
        // }else {window.location.href='/'}
    });

}


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

function consulting_history_view(ban_regi){
    ban_regi = Number(ban_regi)
    if(ban_regi == 0){
        $('#consulting_title').html('상담할 반을 선택해주세요 ')
        $('#consulting_history_student_list').hide();
    }else{
        $('#consulting_title').html('오늘의 상담')
        get_consulting(ban_regi)
    }
}
function consulting_view(ban_regi){
    ban_regi = Number(ban_regi)
    if(ban_regi == 0){
        $('#consulting_title').html('상담할 반을 선택해주세요 ')
        $('#consulting_student_list').hide();
    }else{
        $('#consulting_title').html('오늘의 상담')
        get_consulting_student(ban_regi)
    }
}
async function get_consulting_student(ban_regi){
    await $.ajax({
        type: "GET",
        url: "/teacher/mystudents/"+ban_regi+"/"+0,
        data: {},
        success: function (response) {
            console.log(response['consulting_student_list'])
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
                    <td class="col-2" data-bs-toggle="modal" data-bs-target="#consultinghistory" onclick="get_consulting(${student_id})">상담 실행</td> 
                    </tr>
                    `;
                    $('#today_consulting_box').append(temp_consulting_contents_box);
                }
            }
        }
    });
    $('#today_consulting_box').show();
}
async function get_consulting(student_id){
    await $.ajax({
        type: "GET",
        url: "/teacher/consulting/"+student_id,
        data: {},
        success: function (response) {
            console.log(response['consulting'])
            if(response["consulting"] == '없음'){
                $('#consulting').hide();
                let temp_consulting_contents_box = `
                <p> 오늘의 상담 업무를 완료했습니다 🎉</p>
                `;
                $('#consulting_msg').html(temp_consulting_contents_box);
            }else{
                $('#consulting_msg').empty();
                $('#consulting').show();
                $('#today_consulting_box').empty()
                for(i=0;i<response["consulting"].length;i++){
                    let target = response["consulting"][i]
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
                    <td class="col-2" data-bs-toggle="modal" data-bs-target="#consultinghistory" onclick="get_consulting(${student_id})">상담 실행</td> 
                    </tr>
                    `;
                    $('#today_consulting_box').append(temp_consulting_contents_box);
                }
            }
        }
    });
    $('#today_consulting_box').show();
}
function post_target_consulting(consulting){
    consulting_missed = $('input:checkbox[id="missed"]').is(":checked")
    consulting_reason = $('#consulting_reason'+String(consulting)).val()
    consulting_solution = $('#consulting_solution'+String(consulting)).val()
    consulting_result = $('#consulting_result'+String(consulting)).val()
    $.ajax({
            type: "POST",
			url:'/teacher/consulting/'+consulting,
			// data: JSON.stringify(jsonData), // String -> json 형태로 변환
            data: {
                consulting_reason:consulting_reason,
                consulting_solution:consulting_solution,
                consulting_result:consulting_result,
                consulting_missed:consulting_missed,
            },
            success: function (response) {{
				alert(response["result"])
                if(response["result"] != '상담일지 저장 완료'){
                    return window.location.href='/'
                }
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
    $('input:checkbox[name=taskid]').each(function(index){
        if($(this).is(":checked")==true){
            return update_done($(this).val())
        }
    });
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
