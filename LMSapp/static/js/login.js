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
    if(teacher_kor_name==""){
        teacher_kor_name = "입력없음"
    }
    if(teacher_eng_name==""){
        teacher_eng_name = "입력없음"
    }
    console.log(teacher_kor_name)
    console.log(teacher_eng_name)
    $.ajax({
        type: "GET",
        url: "/find_user/"+teacher_kor_name+"/"+teacher_eng_name,
        success: function (response) {
            {
                result = response['teacher_info']
                if(result == 'nodata'){
                    $('#my_id_box').hide()
                    // $('#register_request_box').show()
                    var con_val = confirm('상담 페이지 계정 정보가 존재하지 않습니다, 본원에서 검색해보시겠습니까?')
                    if(con_val){
                        $.ajax({
                            type: "GET",
                            url: "/find_purple_user/"+teacher_kor_name+"/"+teacher_eng_name,
                            success: function (response) {
                                {
                                    result = response['teacher_info']
                                    if(result == 'nodata'){
                                        $('#my_id_box').hide()
                                        alert('본원에 등록된 정보가 없습니다_purpleacademy.co.kr 계정 가입을 먼저 진행해주세요')
                                    }else{
                                        let temp_result =''
                                        for(i=0;i<result.length;i++){
                                            teacher_id = result[i].id
                                            temp_result += `
                                                <p>👉 ${i+1}번 후보</p>
                                                <div class="col-sm-3 mb-sm-0 mb-2"><span>✅ 이름</span></div>
                                                <div class="col-sm-9">
                                                    <p id="selname${teacher_id}" val=${result[i].name}>${make_nullcate(result[i].name)}</p>
                                                    <p id="seleng_name${teacher_id}" val=${result[i].eng_name}> (${make_nullcate(result[i].eng_name)})</p>
                                                </div>
                                                <div class="col-sm-3 mb-sm-0 mb-2"><span>✅ 생년월일</span></div>
                                                <div class="col-sm-9">
                                                    <p>${make_nullcate(result[i].birthday)}</p>
                                                </div>
                                                <div class="col-sm-3 mb-sm-0 mb-2"><span>✅ 퍼플 가입일</span></div>
                                                <div class="col-sm-9">
                                                    <p>${make_nullcate(result[i].joining_date)}</p>
                                                </div>
                                                <div class="col-sm-3 mb-sm-0 mb-2"><span>✅ 아이디</span></div>
                                                <div class="col-sm-9">
                                                    <p>${result[i].user_id}</p>
                                                </div>
                                                <div class="col-sm-3 mb-sm-0 mb-2"><span>✅ 이메일</span></div>
                                                <div class="col-sm-9">
                                                    <p>${make_part(result[i].category)}</p>
                                                </div>
                                                <div class="col-sm-3 mb-sm-0 mb-2"><span>✅ 연락처</span></div>
                                                <div class="col-sm-9">
                                                    <p>${result[i].mobileno}</p>
                                                </div>
                                                <div class="col-sm-3 mb-sm-0 mb-2"><span>✅ 이메일</span></div>
                                                <div class="col-sm-9">
                                                    <p>${result[i].email}</p>
                                                </div>
                                                <div class="modal-footer">
                                                    <button class="btn btn-success" onclick="select_teacher_info(${teacher_id})">등록 요청</button>
                                                </div>
                                            `;
                                        }
                                        $('#my_id_box').html(temp_result)
                                        $('#my_id_box').show()
                                    }
                                }
                            }
                        });
                    }
                }else{
                    let temp_result =''
                    for(i=0;i<result.length;i++){
                        temp_result += `
                        <p>👉 ${i+1}번 후보</p>
                        <div class="col-sm-3 mb-sm-0 mb-2"><span>✅ 이름</span></div>
                        <div class="col-sm-9">
                            <p>${make_nullcate(result[i].name)} (${make_nullcate(result[i].eng_name)})</p>
                        </div>
                        <div class="col-sm-3 mb-sm-0 mb-2"><span>✅ 아이디</span></div>
                        <div class="col-sm-9">
                            <p>${result[i].user_id}</p>
                        </div>
                        <div class="col-sm-3 mb-sm-0 mb-2"><span>✅ 이메일</span></div>
                        <div class="col-sm-9">
                            <p>${make_part(result[i].category)}</p>
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
$('.enter_key').keyup('keyup', function (event) {
    if (event.keyCode === 13) {
        $('#findidenter').click();
    }
});

function select_teacher_info(teacher_id){
    const teacher_kor_name = $(`#selname${teacher_id}`)
    const teacher_eng_name = $(`#seleng_name${teacher_id}`)
    $.ajax({
        type: "POST",
        url: "/find_user/"+teacher_kor_name+"/"+teacher_eng_name,
        data: {
        },
        success: function (response) {
            {
                result = response['teacher_info']
                if(result == 'nodata'){
                    $('#my_id_box').hide()
                    $('#register_request_box').show()
                    alert('본원에 등록된 정보가 없습니다-본원에 문의하세요')
                }else if(result == 'dup'){
                    $('#my_id_box').hide()
                    $('#register_request_box').show()
                    alert('중복되는 아이디가 있습니다')
                }else{
                    let temp_result = `
                        <p>👉 내 정보</p>
                        <div class="col-sm-3 mb-sm-0 mb-2"><span>✅ 아이디</span></div>
                        <div class="col-sm-9">
                            <p>${new_id}</p>
                        </div>
                        <div class="col-sm-3 mb-sm-0 mb-2"><span>✅ 연락처</span></div>
                        <div class="col-sm-9">
                            <p>${new_mobileno}</p>
                        </div>
                        <div class="col-sm-3 mb-sm-0 mb-2"><span>✅ 이메일</span></div>
                        <div class="col-sm-9">
                            <p>${new_email}</p>
                        </div>
                        `
                    $('#my_id_box').html(temp_result)
                    $('#my_id_box').show()
                    $('#register_request_box').hide()
                    alert('등록이 완료되었습니다')
                }
            }
        }
    });
}
function regi_my_id(teacher_id){
    const my_pw = $('#new_pw1').val()
    
}
