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
//     get_farmer();
//     get_review();
// })




//  문의 종류가 선택되면 모달창 뷰를 바꿔주는 함수 
function change_question_kind(str){
    if( str == "이반"){
        $('#invisible_for_1').hide();
        $('#invisible_for_2').show();
        $('#question_box').show();
    }else if( str == "퇴소" || "취소/환불"){
        $('#invisible_for_2').hide();
        $('#invisible_for_1').show();
        $('#question_box').show();
    }else{
        $('#invisible_for_1').hide();
        $('#invisible_for_2').hide();
        $('#question_box').show();
    }
}
function update_done(taskid){
    console.log(taskid)
}
function get_answer(q_id){
    $('#questionlist').hide()
    console.log(q_id)
    $.ajax({
        type: "GET",
        url: "/teacher/question/"+q_id,
        data: {},
        success: function (response) {
            // alert(response["title"])
        //     if (response["result"]=='문의가 전송되었습니다') {
        //     window.location.replace('/teacher')
        // }else {window.location.href='/'}
        cateogry = response["cateogry"]
        title = response["title"]
        contents = response["contents"]
        teacher = response["teacher"]
        teacher_e = response["teacher_e"]
        create_date = response["create_date"]
        if(cateogry == '일반문의'){
            let temp_question_list = `
            <ul>
                <li>종류 : ${cateogry} </li>
                <li>제목 : ${title}</li>
                <li>문의 : ${contents}</li>
                <li>작성자 : ${teacher} ( ${teacher_e} )</li>
                <li>작성일 : ${create_date}</li>
            </ul>
            <ul>
                <li>응답 : 응답이 아직 없어요 😵‍💫
            </ul>
            `;
            $('#questiondetail_box').append(temp_question_list);
        }
        else{
            ban = response["ban"]
            student = response["student"]
            student_origin = response["student_origin"]
            let temp_question_list = `
            <ul>
                <li>종류 : ${cateogry} </li>
                <li>제목 : ${title}</li>
                <li>문의 : ${contents}</li>
                <li>작성자 : ${teacher} ( ${teacher_e} )</li>
                <li>작성일 : ${create_date}</li>
                <li>대상 반 | 학생: ${ban} ➖ ${student} ( ${student_origin} )</li>
            </ul>
            <ul>
                <li>응답 : 반려 / 승인 처리 😵‍💫
            </ul>
            `;
            $('#questiondetail_box').append(temp_question_list);

        }
        
        }
    });
    $('#questiondetail').show()
}

function go_back(){
    $('#questiondetail_box').empty();
    $('#questiondetail').hide();
    $('#questionlist').show();
}