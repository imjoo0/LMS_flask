function edit_personal_info(){
    $.ajax({
        type: "POST",
        url: "/teacher/personal",
        data: {},
        success: function (response) {
            if (response['result'] === 'success') {
                $.removeCookie('mytoken', response['token'])
                alert(response['msg'])
                window.location.href = '/';
            } else {
                alert(response['msg'])
                window.location.href = '/';
            }
        }
    })
}