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
    $('.append_st').hide()
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
                $('.append_st').show()
            }
        }
    });
}

$('.form-container').keyup('keyup', function (event) {
    if (event.keyCode === 13) {
        $('#btn_login').click();
    }

});