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
// $(document).ready(function () {
//     task_doneview();
// })

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

function task_doneview(done_code){
    if(done_code == 0){
        $('#task_ban_box_incomplete').show();
        $('#task_ban_box_complete').hide();
    }else{
        $('#task_ban_box_complete').show();
        $('#task_ban_box_incomplete').hide();
    }
}

function get_task(category_id){
    $.ajax({
        type: "GET",
        url: "/teacher/"+category_id,
        data: {},
        success: function (response) {
            let tcb = '#task_contents_box'+category_id
            if(response["task"] == '없음'){
                let temp_task_contents_box = `
                <p> 오늘은 할 업무가 없습니다🎉</p>
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
                    <form method="post" class="make_row" id="task_ban_box_complete${category_id}${i}">
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
                        if(done != 1){
                            $('#task_ban_box_incomplete'+category_id+i).append(temp_task_ban_box);
                        }else{
                            $('#task_ban_box_complete'+category_id+i).append(temp_task_ban_box);
                        }
                    }
                }
            }
            // alert(response["title"])
        //     if (response["result"]=='문의가 전송되었습니다') {
        //     window.location.replace('/teacher')
        // }else {window.location.href='/'}
        }
    });
}
function get_task_done(){
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
            data: {task_ids:chk_Val},
            success: function (response) {{
				console.log(response);
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


