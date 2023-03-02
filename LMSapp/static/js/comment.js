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
                get_comment(q_id,is_coco)
			}}
		})
}