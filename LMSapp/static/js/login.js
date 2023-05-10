
// function sign_in() {
//     user_id = $('#user_id').val();
//     password = $('#user_pw').val();
//     $.ajax({
//         type: 'POST',
//         url: '/login',
//         data: {
//             user_id: user_id,
//             user_pw: password
//         },
//         success: function (response) {
//             if (response['result'] == 'success') {
//                 $.cookie('mytoken', response['token'], {path: '/'});
//                 window.location.replace('/main')
//             } else {
//                 var child = document.querySelector(".append_st");
//                 if (child.hasChildNodes()) {
//                     child.removeChild(child.childNodes[0]);
//                 }
//                 var creat_sentence = document.createElement('p');
//                 var creat_text = document.createTextNode(response['msg']);
//                 creat_sentence.appendChild(creat_text);
//                 creat_sentence.classList.add('creatst');
//                 child.appendChild(creat_sentence);
//             }
//         }
//     });
// }

$('.form-container').keyup('keyup', function(event) {
    if(event.keyCode === 13) {
        $('#btn_login').click();
        }

});