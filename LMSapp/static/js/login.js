$.ajaxSetup({
    beforeSend: function (xhr, settings) {
        if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrf_token);
        }
    }
});
function sign_in() {
    user_id = $('#user_id').val();
    password = $('#user_pw').val();
    $('#login_msg_title').html('Login')
    $.ajax({
        type: 'POST',
        url: '/login',
        data: JSON.stringify({
            user_id: user_id,
            user_pw: password
        }),
        contentType: 'application/json',
        success: function (response) {
            if (response['result'] == 'success') {
                $.cookie('mytoken', response['token'], { path: '/' });
                window.location.replace('/main')
            }else{
                $('#login_msg_title').html('아이디 패스워드를 확인해 주세요')
            }
        }
    });
}

$('.form-container').keyup('keyup', function (event) {
    if (event.keyCode === 13) {
        $('#btn_login').click();
    }

});

function find_my_id(){
    const teacher_kor_name = $('#teacher_kor_name').val()
    const teacher_eng_name = $('#teacher_eng_name').val()

    $.ajax({
        type: "GET",
        url: "/find_user/"+teacher_kor_name+"/"+teacher_eng_name,
        success: function (response) {
            {
                $('#my_id_box').show()
                if(response['teacher_info'] == 'nodata'){
                    $('#my_id').html('사용자 정보가 없습니다')
                }else{
                    console.log(response['teacher_info'])
                    $('#my_id').html('사용자 정보는 누구누구')
                }
            }
        }
    });
}