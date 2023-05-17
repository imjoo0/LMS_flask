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
    let teacher_kor_name = $('#teacher_kor_name').val()
    let teacher_eng_name = $('#teacher_eng_name').val()
    if(teacher_kor_name=""){
        teacher_kor_name = "입력없음"
    }
    if(teacher_eng_name=""){
        teacher_eng_name = "입력없음"
    }
    $.ajax({
        type: "GET",
        url: "/find_user/"+teacher_kor_name+"/"+teacher_eng_name,
        success: function (response) {
            {
                result = response['teacher_info']
                if(result == 'nodata'){
                    $('#my_id_box').hide()
                    $('#register_request_box').show()
                }else{
                    let temp_result =''
                    for(i=0;i<result.length;i++){
                        temp_result += `
                        <div class="col-sm-3 mb-sm-0 mb-2"><span>✅ ${i+1}번 후보</span></div>
                        <div class="col-sm-3 mb-sm-0 mb-2"><span>✅ 아이디</span></div>
                        <div class="col-sm-9">
                            <p>${result[i].user_id}</p>
                        </div>
                        <div class="col-sm-3 mb-sm-0 mb-2"><span>✅ 연락처</span></div>
                        <div class="col-sm-9">
                            <p>${result[i].mobileno}</p>
                        </div>
                        <div class="col-sm-3 mb-sm-0 mb-2"><span>✅ 이메일</span></div>
                        <div class="col-sm-9">
                            <p>${result[i].email}</p>
                        </div>
                        `
                    }
                    $('#my_id_box').html(temp_result)
                    $('#my_id_box').show()
                    $('#register_request_box').hide()
                }
            }
        }
    });
}