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
        $('#invisible_for_2').css('display','block');
        $('#question_box').css('display','block');
    }else if( str == "퇴소"){
        $('#invisible_for_1').css('display','block');
        $('#question_box').css('display','block');
    }else{
        $('#invisible_for_1').css('display','none');
        $('#invisible_for_2').css('display','none');
        $('#question_box').css('display','block');
    }
}

function post_question(str){
    let question_contents = $('#question_contents').val();
    $.ajax({
        type: "POST",
        url: "/teacher/question",
        data: question_contents,
        cache: false,
        contentType: false,
        processData: false,
        success: function (response) {
            alert(response["result"])
            if (response["result"]=='문의가 전송되었습니다') {
            window.location.replace('/teacher')
        }else {window.location.href='/'}
        }
    });
}

function get_answer(q_id){
    questionlist = $('#questionlist').css('display','none');
    console.log(q_id)
    // $.ajax({
    //     type: "GET",
    //     url: "/teacher/question/q_id",
    //     data: {},
    //     success: function (response) {
    //         alert(response["result"])
    //         if (response["result"]=='문의가 전송되었습니다') {
    //         window.location.replace('/teacher')
    //     }else {window.location.href='/'}
    //     }
    // });
}