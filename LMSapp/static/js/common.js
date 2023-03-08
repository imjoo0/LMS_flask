// 문의 댓글 기능 
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
			url:'/teacher/comment/'+q_id+'/'+is_coco,
			// data: JSON.stringify(jsonData), // String -> json 형태로 변환
            data: {
                comment_contents:comment_contents,
            },
            success: function (response) {{
				alert(response["result"])
			}}
		})
}

// 문의 삭제 함수 
async function delete_question(q_id){
    var con_val = confirm('정말 삭제하시겠습니까?')
    if(con_val == true){
    await $.ajax({
        type: 'POST',
        url: '/teacher/delete_question/' + q_id ,
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

// 문의 내용 상세보기
async function get_question(q_id,done_code){
    await $.ajax({
       type: "GET",
       url: "/common/question/"+q_id,
       data: {},
       success: function (response) {
        category = response["category"]
        title = response["title"]
        contents = response["contents"]
        teacher = response["teacher"]
        teacher_e = response["teacher_e"]
        create_date = response["create_date"]
        answer = response['answer']
        answer_at = response['answer_at']
        comments = response['comment']
        attach = response['attach']
        let code = 0;
        let temp_comment = `     
        <input class="border rounded-0 form-control form-control-sm" type="text" id="comment_contents"
        placeholder="댓글을 남겨주세요">
        <button onclick="post_comment(${q_id},${0})">등록</button>
        `;
        $('#comment_post_box').html(temp_comment)
    
        $('#comments').empty()
        if( comments.length != 0 ){
            for(i=0;i<comments.length;i++){
                c_id = comments[i]['c_id']
                c_contents = comments[i]['c_contents']
                c_created_at = comments[i]['c_created_at']
                writer = comments[i]['writer']
                parent_id = comments[i]['parent_id']

                if(parent_id == 0){
                    let temp_comments = `
                    <div id="for_comment${c_id}" style="margin-top:10px">
                        <p class="p_comment">${c_contents}  (작성자 : ${writer} | ${c_created_at} )</p>
                    </div>
                    <details style="margin-top:0px;margin-right:5px;font-size:0.9rem;">
                        <summary><strong>대댓글 달기</strong></summary>
                            <input class="border rounded-0 form-control form-control-sm" type="text" id="comment_contents${c_id}"
                            placeholder=" 대댓글 ">
                            <button onclick="post_comment(${q_id},${c_id})">등록</button>
                        </details>
                    `;
                    $('#comments').append(temp_comments);
                }else{
                    let temp_comments = `
                    <p class="c_comment"> ➖ ${c_contents}  (작성자 : ${writer} | ${c_created_at} )</p>
                    `;
                    $(`#for_comment${parent_id}`).append(temp_comments);
                }
                
            }
        }
        if(category == '일반문의'){
            code = 1
            $('#consulting_history_attach').hide()
            temp_question_list = `
                <div class="modal-body-select-container">
                    <span class="modal-body-select-label">문의 종류</span>
                    <p>${category}</p>
                </div>
                <div class="modal-body-select-container">
                    <span class="modal-body-select-label">제목</span>
                    <p>${title}</p>
                </div>
                <div class="modal-body-select-container">
                    <span class="modal-body-select-label">내용</span>
                    <p>${contents}</p>
                </div>
                <div class="modal-body-select-container">
                    <span class="modal-body-select-label">작성자</span>
                    <p>${teacher} ( ${teacher_e} )</p>
                </div>
                <div class="modal-body-select-container">
                    <span class="modal-body-select-label">작성일</span>
                    <p>${create_date}</p>
                </div>
                <div class="modal-body-select-container">
                    <span class="modal-body-select-label">첨부파일</span>
                    <a href="/common/downloadfile/question/${q_id}" download="${attach}">${attach}</a>
                </div>
            `;
        }else{
            if(category == '이반 요청'){code = 2}else{code=3}
            $('#consulting_history_attach').show()
            ban = response["ban"]
            student = response["student"]
            student_origin = response["student_origin"]
            reject = response["reject"]
            temp_question_list = `
                <div class="modal-body-select-container">
                    <span class="modal-body-select-label">문의 종류</span>
                    <p>${category}</p>
                </div>
                <div class="modal-body-select-container">
                    <span class="modal-body-select-label">제목</span>
                    <p>${title}</p>
                </div>
                <div class="modal-body-select-container">
                    <span class="modal-body-select-label">내용</span>
                    <p>${contents}</p>
                </div>
                <div class="modal-body-select-container">
                    <span class="modal-body-select-label">작성자</span>
                    <p>${teacher} ( ${teacher_e} )</p>
                </div>
                <div class="modal-body-select-container">
                    <span class="modal-body-select-label">작성일</span>
                    <p>${create_date}</p>
                </div>
                <div class="modal-body-select-container">
                    <span class="modal-body-select-label">대상 반 | 학생</span>
                    <p>${ban} ➖ ${student} ( ${student_origin} )</p>
                </div>
                <div class="modal-body-select-container">
                    <span class="modal-body-select-label">처리</span>
                    <p>${reject}</p>
                </div>
                <div class="modal-body-select-container">
                    <span class="modal-body-select-label">첨부파일</span>
                    <a href="/common/downloadfile/question/${q_id}" download="${attach}">${attach}</a>
                </div>
            `;
            let history = response['history']
            let reason = history['reason']
            let solution = history['solution']
            let result = history['result']
            let created_at = history['created_at']
            let temp_his = `
            <div class="modal-body-select-container">
                <span class="modal-body-select-label">상담 사유</span>
                <p>${reason}</p>
            </div>
            <div class="modal-body-select-container">
                <span class="modal-body-select-label">제공한 가이드</span>
                <p>${solution}</p>
            </div>
            <div class="modal-body-select-container">
                <span class="modal-body-select-label">상담 결과</span>
                <p>${result}</p>
            </div>
            <div class="modal-body-select-container">
                <span class="modal-body-select-label">상담 일시</span>
                <p>${created_at}</p>
            </div>
            `;
            $('#cha').html(temp_his);
        }
        let temp_answer_list = `
        <div class="modal-body-select-container">
        <span class="modal-body-select-label">응답</span>
        <p>${answer}</p>
        </div>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">응답일</span>
            <p>${answer_at}</p>
        </div>`
        $('#teacher_answer').html(temp_answer_list);
        $('#teacher_question').html(temp_question_list);

        if(done_code == 0){
            $('#comment_box').hide()
            $('#manage_answer_'+1).show()
            $('#manage_answer_'+2).hide()
            $('#manage_answer_'+3).hide()
            if(code == 2){
                $('#manage_answer_'+2).show()
                $('#manage_answer_'+3).hide()
            }else{
                $('#manage_answer_'+3).show()
                $('#manage_answer_'+2).hide()
            }
            
            let temp_button_box = `
            <button class="btn btn-dark" type="submit" onclick="post_answer(${q_id},${code})">저장</button>
            <button type="button" class="btn btn-danger" data-bs-dismiss="modal">취소</button>
            `
            $('#button_box').html(temp_button_box);
        }else if(done_code == 1){
            $('#manage_answer_1').hide()
            $('#manage_answer_2').hide()
            $('#manage_answer_3').hide()
            $('#comment_box').show()
        }else{
            $('#questionlist').hide()
            $('#questiondetail').show()
        }
    }

   });
   $('#questionlist').hide()
   $('#questiondetail').show()
}

// 본원 답변 기능 
function post_answer(q_id,code){
    answer_title = $('#answer_title'+code).val()
    answer_contents = $('#answer_contents'+code).val()
    o_ban_id = 0
    if(code != 1){
        o_ban_id = $('#o_ban_id'+code).val()
    }
    $.ajax({
        type: "POST",
        url: "/common/question/"+q_id,
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