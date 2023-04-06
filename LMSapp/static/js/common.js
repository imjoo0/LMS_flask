var totalData = 0; //총 데이터 수
var dataPerPage = 6;
var pageCount = 10; //페이징에 나타낼 페이지 수
var globalCurrentPage = 1; //현재 페이지
var data_list;
var consultingData = [];
var taskData = [];
const today = new Date().setHours(0, 0, 0, 0);
let make_recobook = function(c){
    if( c == null){
        return '❌'
    } else if(c == 'NOT'){
        result = c + ' (추천도서없음)'
        return result
    }else{
        return c
    }
}
let make_reject_code = function(rc){
    if( c == 0){
        return '❌(반려)';
    }else{
        return '⭕(승인)';
    }
}
let make_date = function(d){
    if(d==null){
        return '❌'
    }
    const date = new Date(d)
    return date.getFullYear()+'-'+(date.getMonth()+ 1).toString().padStart(2, '0')+'-'+date.getDate().toString().padStart(2, '0')
}
let missed_date = function(d){
    const date = new Date(d)
    const standard = new Date('1111-01-01')
    if(date.getTime() == standard.getTime()){
        return "없음"
    }else if(date.setHours(0, 0, 0, 0) == today){
        return "오늘"
    }else{
        return date.getFullYear()+'-'+(date.getMonth()+ 1).toString().padStart(2, '0')+'-'+date.getDate().toString().padStart(2, '0')
    }
}
let make_priority = function(priority) {
    if(priority==1) return '';
    else if(priority==2) return '오후업무';
    else if(priority==3) return '오전업무☀️';
    else return '긴급업무⚡';
}
let answer_rate =  function(answer, all) {
    if(Object.is(answer/all, NaN)) return 0;
    else return answer/all*100;
}
let make_semester=function(semester){
    if (semester == 1){
        return 1;
    }else if(semester == 2){
        return 5;
    }else if(semester == 0){
        return 9;
    }else{
        return semester
    }
}
function q_category(category) {
    if (category == 0) {
        category = '일반문의'
    } else if (category == 1) {
        category = '퇴소문의'
    } else{
        category = '이반문의'
    }
    return category
}
// function sodata(){
//     $.ajax({
//         url: '/common/sodata',
//         type: 'GET',
//         data: {},
//         success: function(response){
//             sn = response['switch_num']
//             $('#switch_num').css('width',`${sn}%`);
//             $('#switch_num').css('background-color','#95B3D7');
//             $('#sn').html(`이반 학생 수: ${sn}명`);

//             on = response['outstudent_num']
//             $('#outstudent_num').css('width',`${on}%`);
//             $('#outstudent_num').css('background-color','#D99694');
//             $('#on').html(`퇴소 학생 수: ${on}명`);
//             data_list = response['sodata']
//             if(data_list == '없음'){
//                 $("#so_data").html('퇴소 / 이반 발생이 없었습니다 😆');
//             }else{
//                 totalData = data_list.length
//                 displayData(totalData, 1, dataPerPage,data_list,1);
//                 paging(totalData, dataPerPage, pageCount, 1,data_list,1);
//             }
//         }
//     }) 
    
// }

// function uldata(){
//     $.ajax({
//         url: '/common/uldata',
//         type: 'GET',
//         data: {},
//         success: function(response){
//             un = response['unlearned_num']
//             $('#unlearned_num').css('width',`${un}%`);
//             $('#unlearned_num').css('background-color','#EBF1DE');
//             $('#un').html(`미학습발생 수: ${un}`);

//             ixln = response['ixl_num']
//             $('#ixl_num').css('width',`${ixln}%`);
//             $('#ixl_num').css('background-color','#D7E4BD');
//             $('#ixln').html(`IXL미학습: ${ixln}`);

//             sreadn = response['sread_num']
//             $('#sread_num').css('width',`${sreadn}%`);
//             $('#sread_num').css('background-color','#C3D69B');
//             $('#sreadn').html(`리특미진행: ${sreadn}`);

//             readn = response['read_num']
//             $('#read_num').css('width',`${readn}%`);
//             $('#read_num').css('background-color','#77933C');
//             $('#readn').html(`리딩부진: ${readn}`);

//             intor = response['intoread_num']
//             $('#intoread_num').css('width',`${intor}%`);
//             $('#intoread_num').css('background-color','#4F6228');
//             $('#in').html(`인투리딩: ${intor}`);

//             wn = response['writing_num']
//             $('#writing_num').css('width',`${wn}%`);
//             $('#writing_num').css('background-color','#262F13');
//             $('#writingn').html(`라이팅: ${wn}`);

//             data_list = response['uldata']
//             if(data_list == '없음'){
//                 $("#ul_data_box").html('미학습 발생 원생이 없었습니다 😆');
//             }else{
//                 totalData = data_list.length
//                 displayData(totalData, 1, dataPerPage,data_list,2);
//                 paging(totalData, dataPerPage, pageCount, 1,data_list,2);
//             }
//         }
//     }) 
    
// }
function displayData(totalData, currentPage, dataPerPage,data_list,b_id) {
    let chartHtml = "";

    //Number로 변환하지 않으면 아래에서 +를 할 경우 스트링 결합이 되어버림.. 
    currentPage = Number(currentPage);
    dataPerPage = Number(dataPerPage);
    let last_item = (currentPage - 1) * dataPerPage + dataPerPage;
    if( last_item > totalData){
        last_item = totalData
    }
    for (
        var i = (currentPage - 1) * dataPerPage; //11*5 = 55
        i < last_item; // 55+5
        i++
    ) {
        target = data_list[i]
        let register_no = target['register_no']
        let name = target['name'];
        let original = target['origin'];
        let mobileno = target['mobileno'];
        let parent_name_mobileno = target['pname'] +'('+target['pmobileno']+')';
        let reco_book_code = target['reco_book_code'];
        let unlearned = target['unlearned'];
        let up = target['up'];
        if( reco_book_code == null){
            reco_book_code = '❌'
        } else if(reco_book_code == 'NOT'){
            reco_book_code += ' (추천도서없음)'
        }
        chartHtml +=`
        <td class="col-2">${name}(${original})</td>
        <td class="col-2">${mobileno} </td>
        <td class="col-3">${parent_name_mobileno}</td>
        <td class="col-2">${reco_book_code} </td>
        <td class="col-2">${unlearned}(${up}%)</td><br>
        <td class="col-1" onclick="plusconsulting(${register_no},${b_id})">📝</td><br>
        `;
    } 
    $("#s_data").html(chartHtml);
}

function paging(totalData, dataPerPage, pageCount, currentPage, data_list, b_id) {
    totalPage = Math.ceil(totalData / dataPerPage); //총 페이지 수

    if (totalPage < pageCount) {
        pageCount = totalPage;
    }

    let pageGroup = Math.ceil(currentPage / pageCount); // 페이지 그룹 1/10 1~10까지는 '1' , 11~20 까지는 2 , 21~30까지는 3 
    let last = pageGroup * pageCount; //화면에 보여질 마지막 페이지 번호

    if (last > totalPage) {
        last = totalPage;
    }
    let first = last - (pageCount - 1); //화면에 보여질 첫번째 페이지 번호
    let next = last + 1;
    let prev = first - 1;

    let pageHtml = "";

    if (prev > 0) {
        pageHtml += "<li><a class='cursor-pointer' id='prev'> 이전 </a></li>";
    }

    //페이징 번호 표시 
    for (var i = first; i <= last; i++) {
        if (currentPage == i) {
            pageHtml +=
                "<li class='on'><a class='cursor-pointer' id='" + i + "'>" + i + "</a></li>";
        } else {
            pageHtml += "<li><a class='cursor-pointer' id='" + i + "'>" + i + "</a></li>";
        }
    }

    if (last < totalPage) {
        pageHtml += "<li><a class='cursor-pointer' id='next' > 다음 </a></li>";
    }

    $("#pagingul").html(pageHtml);
    let displayCount = "";
    displayCount = " 원생 명단 1 - " + totalPage + " 페이지 / " + totalData + "건";
    $("#displayCount").text(displayCount);

    //페이징 번호 클릭 이벤트 
    $("#pagingul li a").click(function () {
        let $id = $(this).attr("id");
        selectedPage = $(this).text();

        if ($id == "next") selectedPage = next;
        if ($id == "prev") selectedPage = prev;

        //전역변수에 선택한 페이지 번호를 담는다...
        globalCurrentPage = selectedPage;

        //페이징 표시 재호출
        paging(totalData, dataPerPage, pageCount, selectedPage, data_list,b_id);
        //글 목록 표시 재호출
        displayData(totalData, selectedPage, dataPerPage,data_list,b_id);
    });
}

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
			url:'/common/comment/'+q_id+'/'+is_coco,
			// data: JSON.stringify(jsonData), // String -> json 형태로 변환
            data: {
                comment_contents:comment_contents,
            },
            success: function (response) {{
				alert(response["result"])
                get_question_detail(q_id)    
			}}
		})
}

// 문의 삭제 함수 
async function delete_question(q_id){
    var con_val = confirm('정말 삭제하시겠습니까?')
    if(con_val == true){
    await $.ajax({
        type: 'POST',
        url: '/common/delete_question/' + q_id ,
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
// async function get_question(q_id,done_code){
//     await $.ajax({
//        type: "GET",
//        url: "/common/question/"+q_id,
//        data: {},
//        success: function (response) {
//         category = response["category"]
//         title = response["title"]
//         contents = response["contents"]
//         teacher = response["teacher"]
//         teacher_e = response["teacher_e"]
//         create_date = response["create_date"]
//         answer = response['answer']
//         answer_at = response['answer_at']
//         comments = response['comment']
//         attach = response['attach']
//         let code = 0;
//         let temp_comment = `     
//         <input class="border rounded-0 form-control form-control-sm" type="text" id="comment_contents"
//         placeholder="댓글을 남겨주세요">
//         <button onclick="post_comment(${q_id},${0})">등록</button>
//         `;
//         $('#comment_post_box').html(temp_comment)
    
//         $('#comments').empty()
//         if( comments.length != 0 ){
//             for(i=0;i<comments.length;i++){
//                 c_id = comments[i]['c_id']
//                 c_contents = comments[i]['c_contents']
//                 c_created_at = comments[i]['c_created_at']
//                 writer = comments[i]['writer']
//                 parent_id = comments[i]['parent_id']

//                 if(parent_id == 0){
//                     let temp_comments = `
//                     <div id="for_comment${c_id}" style="margin-top:10px">
//                         <p class="p_comment">${c_contents}  (작성자 : ${writer} | ${c_created_at} )</p>
//                     </div>
//                     <details style="margin-top:0px;margin-right:5px;font-size:0.9rem;">
//                         <summary><strong>대댓글 달기</strong></summary>
//                             <input class="border rounded-0 form-control form-control-sm" type="text" id="comment_contents${c_id}"
//                             placeholder=" 대댓글 ">
//                             <button onclick="post_comment(${q_id},${c_id})">등록</button>
//                         </details>
//                     `;
//                     $('#comments').append(temp_comments);
//                 }else{
//                     let temp_comments = `
//                     <p class="c_comment"> ➖ ${c_contents}  (작성자 : ${writer} | ${c_created_at} )</p>
//                     `;
//                     $(`#for_comment${parent_id}`).append(temp_comments);
//                 }
                
//             }
//         }
//         if(category == '일반문의'){
//             code = 1
//             $('#consulting_history_attach').hide()
//             temp_question_list = `
//                 <div class="modal-body-select-container">
//                     <span class="modal-body-select-label">문의 종류</span>
//                     <p>${category}</p>
//                 </div>
//                 <div class="modal-body-select-container">
//                     <span class="modal-body-select-label">제목</span>
//                     <p>${title}</p>
//                 </div>
//                 <div class="modal-body-select-container">
//                     <span class="modal-body-select-label">내용</span>
//                     <p>${contents}</p>
//                 </div>
//                 <div class="modal-body-select-container">
//                     <span class="modal-body-select-label">작성자</span>
//                     <p>${teacher} ( ${teacher_e} )</p>
//                 </div>
//                 <div class="modal-body-select-container">
//                     <span class="modal-body-select-label">작성일</span>
//                     <p>${create_date}</p>
//                 </div>
//                 <div class="modal-body-select-container">
//                     <span class="modal-body-select-label">첨부파일</span>
//                     <a href="/common/downloadfile/question/${q_id}" download="${attach}">${attach}</a>
//                 </div>
//             `;
//         }else{
//             if(category == '이반 요청'){code = 2}else{code=3}
//             $('#consulting_history_attach').show()
//             ban = response["ban"]
//             student = response["student"]
//             student_origin = response["student_origin"]
//             reject = response["reject"]
//             temp_question_list = `
//                 <div class="modal-body-select-container">
//                     <span class="modal-body-select-label">문의 종류</span>
//                     <p>${category}</p>
//                 </div>
//                 <div class="modal-body-select-container">
//                     <span class="modal-body-select-label">제목</span>
//                     <p>${title}</p>
//                 </div>
//                 <div class="modal-body-select-container">
//                     <span class="modal-body-select-label">내용</span>
//                     <p>${contents}</p>
//                 </div>
//                 <div class="modal-body-select-container">
//                     <span class="modal-body-select-label">작성자</span>
//                     <p>${teacher} ( ${teacher_e} )</p>
//                 </div>
//                 <div class="modal-body-select-container">
//                     <span class="modal-body-select-label">작성일</span>
//                     <p>${create_date}</p>
//                 </div>
//                 <div class="modal-body-select-container">
//                     <span class="modal-body-select-label">대상 반 | 학생</span>
//                     <p>${ban} ➖ ${student} ( ${student_origin} )</p>
//                 </div>
//                 <div class="modal-body-select-container">
//                     <span class="modal-body-select-label">처리</span>
//                     <p>${reject}</p>
//                 </div>
//                 <div class="modal-body-select-container">
//                     <span class="modal-body-select-label">첨부파일</span>
//                     <a href="/common/downloadfile/question/${q_id}" download="${attach}">${attach}</a>
//                 </div>
//             `;
//             let history = response['history']
//             let reason = history['reason']
//             let solution = history['solution']
//             let result = history['result']
//             let created_at = history['created_at']
//             let temp_his = `
//             <div class="modal-body-select-container">
//                 <span class="modal-body-select-label">상담 사유</span>
//                 <p>${reason}</p>
//             </div>
//             <div class="modal-body-select-container">
//                 <span class="modal-body-select-label">제공한 가이드</span>
//                 <p>${solution}</p>
//             </div>
//             <div class="modal-body-select-container">
//                 <span class="modal-body-select-label">상담 결과</span>
//                 <p>${result}</p>
//             </div>
//             <div class="modal-body-select-container">
//                 <span class="modal-body-select-label">상담 일시</span>
//                 <p>${created_at}</p>
//             </div>
//             `;
//             $('#cha').html(temp_his);
//         }
//         let temp_answer_list = `
//         <div class="modal-body-select-container">
//         <span class="modal-body-select-label">응답</span>
//         <p>${answer}</p>
//         </div>
//         <div class="modal-body-select-container">
//             <span class="modal-body-select-label">응답일</span>
//             <p>${answer_at}</p>
//         </div>`
//         $('#teacher_answer').html(temp_answer_list);
//         $('#teacher_question').html(temp_question_list);

//         if(done_code == 0){
//             $('#manage_answer_1').show()
//             $('#comment_box').hide()
//             if(code == 1){
//                 $('#manage_answer_2').hide()
//                 $('#manage_answer_3').hide()
//             }else if(code == 2){
//                 $('#manage_answer_2').show()
//                 $('#manage_answer_3').hide()
//             }else{
//                 $('#manage_answer_3').show()
//                 $('#manage_answer_2').hide()
//             }
//             let temp_button_box = `
//             <button class="btn btn-dark" type="submit" onclick="post_answer(${q_id},${code})">저장</button>
//             <button type="button" class="btn btn-danger" data-bs-dismiss="modal">취소</button>
//             `
//             $('#button_box').html(temp_button_box);
//         }else if(done_code == 1){
//             $('#manage_answer_1').hide()
//             $('#manage_answer_2').hide()
//             $('#manage_answer_3').hide()
//             $('#comment_box').show()
//         }else{
//             $('#questionlist').hide()
//             $('#questiondetail').show()
//         }
//     }

//    });
//    $('#questionlist').hide()
//    $('#questiondetail').show()
// }

// 본원 답변 기능 
function post_answer(q_id,code){
    answer_title = $('#answer_title').val()
    answer_contents = $('#answer_contents').val()
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
