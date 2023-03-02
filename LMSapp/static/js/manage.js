var totalData = 0; //총 데이터 수
var dataPerPage = 6;
var pageCount = 10; //페이징에 나타낼 페이지 수
var globalCurrentPage = 1; //현재 페이지
var data_list;
var consultingData = [];
var taskData = [];
// 처음 get 할때 뿌려질 정보 보내는 함수 
$(document).ready(function () {
    paginating(0) 
})

function displayData(totalData, currentPage, dataPerPage,data_list, consulting) {
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
        let name = target['name'];
        let original = target['origin'];
        let mobileno = target['mobileno'];
        let parent_name_mobileno = target['pname'] +'('+target['pmobileno']+')';
        let reco_book_code = target['reco_book_code'];
        if( reco_book_code == null){
            reco_book_code = '✖️'
        }
         let answer_rate =  function(answer, all) {
                if(Object.is(answer/all, NaN)) return 0;
                else return answer/all*100;
            }
        let unlearned = consulting.filter( a => a.student_id == target.register_no).length;
        chartHtml +=`
        <td class="col-2">${name}(${original})</td>
        <td class="col-2">${mobileno} </td>
        <td class="col-3">${parent_name_mobileno}</td>
        <td class="col-2">${reco_book_code} </td>
        <td class="col-2">${unlearned}(${answer_rate(unlearned, consulting.length).toFixed(1)}%)</td><br>
        <td class="col-1" a href="#">✔️</td><br>
        `;
    } 
    $("#s_data").html(chartHtml);
}

function paging(totalData, dataPerPage, pageCount, currentPage, data_list, consulting) {
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
        paging(totalData, dataPerPage, pageCount, selectedPage, data_list, consulting);
        //글 목록 표시 재호출
        displayData(totalData, selectedPage, dataPerPage,data_list, consulting);
    });
}

function paginating(done_code){
    let container = $('#pagination')
    $.ajax({
        url: '/manage/api/get_all_questions/'+done_code,
        type: 'get',
        data: {},
        success: function(data){
            container.pagination({
            dataSource: JSON.parse(data),
            prevText: '이전',
            nextText: '다음',
            pageClassName: 'float-end',
            pageSize: 5,
            callback: function (data, pagination){
                var dataHtml = '';
                $.each(data, function (index, item){
                    if( item.category == 0){item.category = '일반문의' } 
                    else if (item.category == 1 ){item.category ='퇴소 요청' } 
                    else if( item.category == 2){item.category ='이반 요청' } 
                    else{item.category = '취소/환불 요청' } 
                    dataHtml +=  `
                    <td class="col-2">${item.category}</td>
                    <td class="col-4">${item.title}</td>
                    <td class="col-4">${item.contents}</td>
                    <td class="col-2"> <button class="custom-control custom-control-inline custom-checkbox" data-bs-toggle="modal"
                    data-bs-target="#answer" onclick="get_question(${item.id},${done_code})">✏️</button> <button>❌</button></td>`;
                });
                $('#alim-tr').html(dataHtml);
            }
        })
        }
    }) 
}
function get_question(q_id,done_code){ 
    $.ajax({
        type: "GET",
        url: "/teacher/question/"+q_id,
        data: {},
        success: function (response) {
            category = response["category"]
            title = response["title"]
            contents = response["contents"]
            teacher = response["teacher"]
            teacher_e = response["teacher_e"]
            create_date = response["create_date"]
            answer = response['answer']
            answer_at = response['answer_at']
            code = 0
            temp_question_list = ''
            $('#answerModalLabel').html(`${teacher}(${teacher_e})선생님 ${category}`)
            if(category == '일반문의'){
                code = 1
                temp_question_list = `
                <ul>
                    <li>종류 : ${category} </li>
                    <li>제목 : ${title}</li>
                    <li>문의 : ${contents}</li>
                    <li>작성자 : ${teacher} ( ${teacher_e} )</li>
                    <li>작성일 : ${create_date}</li>
                    <li>답변 : ${answer}</li>
                    <li>답변일 : ${answer_at}</li>
                </ul>
                `;
            }
            else{
                ban = response["ban"]
                student = response["student"]
                student_origin = response["student_origin"]
                reject = response["reject"]
                answer = response["answer"]
                answer_at = response["answer_at"]
                if( category == '이반 요청'){
                    new_ban = response["new_ban"]
                    code = 2
                    temp_question_list = `
                    <ul>
                        <li>종류 : ${category} </li>
                        <li>제목 : ${title}</li>
                        <li>문의 : ${contents}</li>
                        <li>작성자 : ${teacher} ( ${teacher_e} )</li>
                        <li>작성일 : ${create_date}</li>
                        <li>대상 반 | 학생: ${ban} ➖ ${student} ( ${student_origin} )</li>
                        <li>희망 이반 반: ${new_ban}</li>
                        <li>처리 : ${ reject } </li>
                        <li>응답 : ${answer} </li>
                        <li>응답일 : ${answer_at} </li>
                    </ul>
                    `;
                }else{
                    code = 3
                    temp_question_list = `
                    <ul>
                    <li>종류 : ${category} </li>
                    <li>제목 : ${title}</li>
                    <li>문의 : ${contents}</li>
                    <li>작성자 : ${teacher} ( ${teacher_e} )</li>
                    <li>작성일 : ${create_date}</li>
                    <li>대상 반 | 학생: ${ban} ➖ ${student} ( ${student_origin} )</li>
                    <li>처리 : ${ reject } </li>
                    <li>응답 : ${answer} </li>
                    <li>응답일 : ${answer_at} </li>
                    </ul>
                    `;
                }
            }
            $('#teacher_question').html(temp_question_list);
            if(done_code == 0){
                
                $('#comment_box').hide()
                $('#manage_answer_'+code).show()
                for(i=1;i<4;i++){
                    if(i != code){
                        $('#manage_answer_'+i).hide()
                    }
                }
                let temp_button_box = `
                <button class="btn btn-dark" type="submit" onclick="post_answer(${q_id},${code})">저장</button>
                <button type="button" class="btn btn-danger" data-bs-dismiss="modal">취소</button>
                `
                $('#button_box').html(temp_button_box);
            }else{
                $('#manage_answer_1').hide()
                $('#manage_answer_2').hide()
                $('#manage_answer_3').hide()
                $('#comment_box').show()
                comments = response['comment']
       let temp_comment = `     
        <input class="border rounded-0 form-control form-control-sm" type="text" id="comment_contents"
        placeholder="댓글을 남겨주세요">
        <button onclick="post_comment(${q_id},${0})">등록</button>
        `;
        $('#comment_post_box').html(temp_comment)
       
        $('#comments').empty()
        if( comments.length != 0 ){
            for(i=0;i<comments.length;i++){
                c_id = comments[i]['c_id']
                c_contents = comments[i]['c_contents']
                c_created_at = comments[i]['c_created_at']
                writer = comments[i]['writer']
                parent_id = comments[i]['parent_id']

                if(parent_id == 0){
                    let temp_comments = `
                    <div id="for_comment${c_id}" style="margin-top:10px">
                        <p class="p_comment">${c_contents}  (작성자 : ${writer} | ${c_created_at} )</p>
                    </div>
                    <details style="margin-top:0px;margin-right:5px;font-size:0.9rem;">
                        <summary><strong>대댓글 달기</strong></summary>
                            <input class="border rounded-0 form-control form-control-sm" type="text" id="comment_contents${c_id}"
                            placeholder=" 대댓글 ">
                            <button onclick="post_comment(${q_id},${c_id})">등록</button>
                        </details>
                    `;
                    $('#comments').append(temp_comments);
                }else{
                    let temp_comments = `
                    <p class="c_comment"> ➖ ${c_contents}  (작성자 : ${writer} | ${c_created_at} )</p>
                    `;
                    $(`#for_comment${parent_id}`).append(temp_comments);
                }
                
            }
       }

            }
        }
    });
}
function post_answer(q_id,code){
    answer_title = $('#answer_title'+code).val()
    answer_contents = $('#answer_contents'+code).val()
    o_ban_id = 0
    if(code != 1){
        o_ban_id = $('#o_ban_id'+code).val()
    }
    $.ajax({
        type: "POST",
        url: "/teacher/question/"+q_id,
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
async function get_consulting(){
    let container = $('#consulting-pagination')
    var category_list = []
await $.ajax({
        url: '/manage/api/get_consulting',
        type: 'get',
        data: {},
        success: function(data){
            $.each([...JSON.parse(data)], function (idx, val){
                category_list.push(val.name)
            });
            consultingData = data;
            container.pagination({
            dataSource: JSON.parse(data),
            prevText: '이전',
            nextText: '다음',
            pageSize: 10,
            callback: function (data, pagination){
                var dataHtml = '';
                var idxHtml = `<option value="none">전체</option>`;
                $.each(data, function (index, consulting){
                dataHtml +=  `
                    <td class="col-3">${consulting.startdate} ~ ${consulting.deadline}</td>
                    <td class="col-2">${consulting.name}</td>
                    <td class="col-1"> 미진행 </td>
                    <td class="col-4"> ${consulting.contents}</td>
                    <td class="col-2"> <button onclick="update_consulting(${consulting.id})">✏️</button> 
                    <button onclick="delete_consulting(${consulting.id})">❌</button></td>`;
                    });
                category_set = new Set(category_list)
                category_list = [...category_set]
                $.each(category_list, function(idx, val){
                    idxHtml += `<option value="${val}">${val}</option>`
                })
                    $('#consulting-option').html(idxHtml);
                    $('#tr-row').html(dataHtml);
        }
    })
    },
    error: function(xhr, status, error){
        alert(xhr.responseText);
    }
})
}

async function update_consulting(idx){
    await $.ajax({
        url: '/manage/api/update_consulting',
        type: 'get',
        data: {'text': 'good'},
        success: function(data){
            console.log(data)
        }
    })
}


async function sort_consulting(value){
    var dataHtml = '';
    let container = $('#consulting-pagination')
    const data = await JSON.parse(consultingData).filter((e)=>{
        if(value == 'none'){
            return e.name
        }else{
            return e.name == value;
        }
    })
    await container.pagination({
        dataSource: data,
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        callback: function (data, pagination){
            var dataHtml = '';
            $.each(data, function (index, consulting){
                dataHtml +=  `
                    <td class="col-3">${consulting.startdate} ~ ${consulting.deadline}</td>
                    <td class="col-2">${consulting.name}</td>
                    <td class="col-1"> 미진행 </td>
                    <td class="col-4"> ${consulting.contents}</td>
                    <td class="col-2"> <button onclick="update_consulting(${consulting.id})">✏️</button> 
                    <button onclick="delete_consulting(${consulting.id})">❌</button></td>`;
                });
                $('#tr-row').html(dataHtml);      
        }
    })
}


async function get_task(){
    let container = $('#task-pagination')
    var category_list = []
await $.ajax({
        url: '/manage/api/get_task',
        type: 'get',
        data: {},
        success: function(data){
            $.each([...JSON.parse(data)], function (idx, val){
                category_list.push(val.name)
            });
            taskData = JSON.parse(data);
            container.pagination({
            dataSource: JSON.parse(data),
            prevText: '이전',
            nextText: '다음',
            pageSize: 10,
            callback: function (data, pagination){
                var dataHtml = '';
                var idxHtml = `<option value="" selected>카테고리를 선택해주세요</option><option value="none">전체</option>`;
                $.each(data, function (index, task){
                dataHtml +=  `
                    <td class="col-3">${ task.startdate } ~ ${ task.deadline }</td>               
                    <td class="col-2">${task.name}</td>               
                    <td class="col-1"> 미진행 </td>
                    <td class="col-4"> ${task.contents}</td>
                    <td class="col-2"> <button>✏️</button>
                    <button onclick="delete_task(${task.id})">❌</button></td>`;
                    });
                category_set = new Set(category_list)
                category_list = [...category_set]
                $.each(category_list, function(idx, val){
                    idxHtml += `<option value="${val}">${val}</option>`
                })
                $('#task-category-select').html(idxHtml);
                $('#task-tr').html(dataHtml);
        }
    })

    },
    error: function(xhr, status, error){
        alert(xhr.responseText);
    }
})
}


async function sort_task(value){
    var dataHtml = '';
    let container = $('#task-pagination')
    const data = taskData.filter((e)=>{
        return e.name == value;
    })
    await container.pagination({
            dataSource: data,
            prevText: '이전',
            nextText: '다음',
            pageSize: 10,
            callback: function (data, pagination){
                var dataHtml = '';
                var idxHtml = `<option value="none" selected>카테고리를 선택해주세요</option>`;
                $.each(data, function (index, task){
                    dataHtml +=  `
                    <td class="col-3">${ task.startdate } ~ ${ task.deadline }</td>               
                    <td class="col-2">${task.name}</td>               
                    <td class="col-1"> 미진행 </td>
                    <td class="col-4"> ${task.contents}</td>
                    <td class="col-2"> <button>✏️</button>
                    <button onclick="delete_task(${task.id})">❌</button></td>`;
                    });

                $('#task-tr').html(dataHtml);      
        }
    })
}


async function delete_consulting(idx){
   const csrf = $('#csrf_token').val();
    var con_val = confirm('정말 삭제하시겠습니까?')
    if(con_val == true){
        await $.ajax({
            url: '/manage/api/delete_consulting/' + idx ,
            type: 'get',
            headers: {'content-type': 'application/json'},
            data: {},
            success: function(data){
                if (data.status == 200){
                    alert(`성공`)
                }else {
                    alert(`실패 ${data.status} ${data.text}`)
                }
            },
            error: function(xhr, status, error){
                alert(xhr.responseText);
            }
        })
        get_consulting()
    }
}

async function delete_task(idx){
    var con_val = confirm('정말 삭제하시겠습니까')
    if(con_val == true){
        await $.ajax({
            url: '/manage/api/delete_task/' + idx ,
            type: 'get',
            headers: {'content-type': 'application/json'},
            data: {},
            success: function(data){
                if (data.status == 200){
                    alert(`성공`)
                }else {
                    alert(`실패 ${data.status} ${data.text}`)
                }
            },
            error: function(xhr, status, error){
                alert(xhr.responseText);
            }
        })
        get_task()
    }
}


function getBanInfo(b_id){
    $('#label_title').empty();
    $('#profile_data').empty();
    $('#ban_data').empty();
    $('#s_data').empty();
    $('#ban_statistics').empty();
    $('#target_a_student').empty();
    if( b_id == 'none'){
        $('#default_title').show();
        $('#student_data').hide();
        $('#pagingul').hide();
    }else{
        $('#default_title').hide();
        $('#student_data').show();
        $('#pagingul').show();
    }
    if( b_id == '전체 반'){
        $('#default_title').show();
        $('#student_data').hide();
        $('#pagingul').hide();
        $('#select_student').hide();
        $('#target_bans').empty();
    }else{
        $('#select_student').show();
    }
    //$('#profile_data').html('Loading Data...');

    $.ajax({
        type: "GET",
        url: "/manage/ban/"+b_id,
        data: {},
        success: function (response) {
            // let target_ban = response['target_ban']
            if (response['status'] == 400){
                let no_data_title = `<h1> ${response.text} </h1>`
                $('#s_data').html(no_data_title);
                $('#pagingul').hide();
                return
            }
            let students_num = response['students_num'];
            let ban_name = response['name'];
            let teacher_name = response['teacher_name']
            let teacher_e_name = response['teacher_e_name']
            let teacher_mobileno = response['teacher_mobileno']
            let teacher_email = response['teacher_email']
            let answer = Number(response['answer_alim'])
            let all_alim = Number(response['all_alim'])
            let answer_rate =  function(answer, all) {
                if(Object.is(answer/all, NaN)) return 0;
                else return answer/all*100;
            }
            // 이반 학생 
            let switch_student = response['switch_student']['data'].filter(a => a.ban_id == b_id).length;
            let all_s_student = response['switch_student']['data'].length;
            let out_student = response['out_student']['data'].filter(a => a.ban_id == b_id).length;
            let all_o_student = response['out_student']['data'].length;
            let notice = response['notice']
            let consulting = response['consulting']['data'].filter(a => a.ban_id == b_id)

            let u_consulting = response['consulting']['data'].filter(a => a.category_id < 100);
            let all_uc_consulting = u_consulting.length;
            let u_consulting_my = u_consulting.filter(a => a.ban_id == b_id);

            let consulting_ixl = u_consulting_my.filter(a => a.category_id == 1).length
            let consulting_reading = u_consulting_my.filter(a => a.category_id == 4).length
            let consulting_speacial = u_consulting_my.filter(a => a.category_id == 3).length
            let consulting_writing = u_consulting_my.filter(a => a.category_id == 6).length
            let consulting_homepage = u_consulting_my.filter(a => a.category_id == 2).length
            let consulting_intoreading = u_consulting_my.filter(a => a.category_id == 5 || a.category_id == 7).length
            let task = response['task']['data']
            // let switchstudent_num = response['switchstudent_num']
            // let switchstudent_num_p = response['switchstudent_num_p']
            // let outstudent_num = response['outstudent_num']
            // let outstudent_num_p = response['outstudent_num_p']
            // let unlearned_ttd = response['unlearned_ttd']
            // let unlearned_ttc = response['unlearned_ttc']
            
            let temp_title = `<h1> ${ban_name} 현황</h1>`
            $('#label_title').append(temp_title);

            let temp_profile_data = `
            <table border="0">
                <th>담임 선생님 정보</th>
                <th></th>
                <th></th>
                <tr>
                    <td>${teacher_name}(${teacher_e_name})</td>
                    <td> 📞 ${teacher_mobileno} </td>
                    <td> ✉️ ${teacher_email}</td>
                </tr>
            </table>
            `;
            $('#profile_data').empty();
            $('#profile_data').append(temp_profile_data);


            let temp_ban_data = `
            <table class="table text-center" style="width:100%;">
                <tbody  style="width:100%;">
                    <tr class="row">
                        <th class="col-3">현 원생 수</th>
                        <th class="col-3">이반</th>
                        <th class="col-3">퇴소</th>
                        <th class="col-3">미학습</th>
                    </tr>
                    <tr class="row">
                        <td class="col-3">${students_num}</td>
                        <td class="col-3">${switch_student}(${answer_rate(switch_student, all_s_student).toFixed(2)}%)</td>
                        <td class="col-3">${out_student}(${answer_rate(out_student, all_o_student).toFixed(2)}%)</td>
                        <td class="col-3">${u_consulting_my}(${answer_rate(u_consulting_my.length, all_uc_consulting).toFixed(2)}%) </td>
                    </tr>
                </tbody>
            </table>
            `;
            $('#ban_data').append(temp_ban_data);

            data_list = response['student_info']
            totalData = students_num

            displayData(totalData, 1, dataPerPage,data_list, u_consulting_my);
            paging(totalData, dataPerPage, pageCount, 1,data_list, u_consulting_my);

            let temp_ban_statistics = `
            <table class="table text-center" id="unlearned" style="margin-left:1%; margin-right: 4%;width: 40%;">
                    <tbody  style="width:100%;">
                        <tr class="row" style="background: #DCE6F2;">
                            <th class="col-12">미학습 관리</th>
                        </tr>
                        <tr class="row">
                            <th class="col-2">IXL</th>
                            <th class="col-2">리딩</th>
                            <th class="col-2">리특</th>
                            <th class="col-2">라이팅</th>
                            <th class="col-2">미접속</th>
                            <th class="col-2">인투리딩</th>
                        </tr>
                        <tr class="row">
                            <td class="col-2">${consulting_ixl}(${answer_rate(consulting_ixl, u_consulting_my.length).toFixed(2)}%)</td>
                            <td class="col-2">${consulting_reading}(${answer_rate(consulting_reading, u_consulting_my.length).toFixed(1)}%)</td>
                            <td class="col-2">${consulting_speacial}(${answer_rate(consulting_speacial, u_consulting_my.length).toFixed(1)}%) </td>
                            <td class="col-2">${consulting_writing}(${answer_rate(consulting_writing, u_consulting_my.length).toFixed(1)}%) </td>
                            <td class="col-2">${consulting_homepage}(${answer_rate(consulting_homepage, u_consulting_my.length).toFixed(1)}%) </td>
                            <td class="col-2">${consulting_intoreading}(${answer_rate(consulting_intoreading, u_consulting_my.length).toFixed(1)}%) </td>
                        </tr>
                    </tbody>
                </table>
                <table class="table text-center" id="teaching" style="margin-right: 4%; width: 25%;">
                    <tbody  style="width:100%;">
                        <tr class="row" style="background: #DCE6F2;">
                            <th class="col-12">상담*업무 관리</th>
                        </tr>
                        <tr class="row">
                            <th class="col-6">업무</th>
                            <th class="col-6">상담</th>
                        </tr>
                        <tr class="row">
                            <td class="col-3">${task.filter(a => a.done == 1).length}/${task.length}</td>
                            <td class="col-3">${answer_rate(task.filter(a => a.done == 1).length, task.length).toFixed(1)}%</td>
                            <td class="col-3">${consulting.filter(a => a.done == 1).length}/${consulting.length}</td>
                            <td class="col-3">${answer_rate(consulting.filter(a => a.done == 1).length, consulting.length).toFixed(1)}%</td>
                        </tr>
                    </tbody>
                </table>  
                <table class="table text-center" id="task"style="width: 25%;" >
                    <tbody  style="width:100%;">
                        <tr class="row" style="background: #DCE6F2;">
                            <th class="col-12">공지*문의 관리</th>
                        </tr>
                        <tr class="row">
                            <th class="col-6">공지</th>
                            <th class="col-6">문의</th>
                        </tr>
                        <tr class="row">
                            <td class="col-6">${notice.length}</td>
                            <td class="col-3">${answer}/${all_alim} </td>
                            <td class="col-3">${answer_rate(answer, all_alim).toFixed(2)}%</td>
                        </tr>
                    </tbody>
                </table>      
            `;

            $('#ban_statistics').append(temp_ban_statistics);

            // 상담요청시 뷰 바꿔주는 부분 
            let temp_target_ban = `
            <p> 선택 - ${ban_name} <a></p>
            `;
            $('#target_bans').html(temp_target_ban);

            // 전체 학생 대상 진행 append 
            let target_all_student = `<option value="전체학생">✔️ ${ban_name}반 전체 학생 대상 진행</option>`;
            $('#target_a_student').append(target_all_student)
            
            $('#target_student').empty();
            for (var i = 0; i < totalData; i++) {
                target = data_list[i]
                let id = target['register_no']
                let name = target['name'];
                let original = target['origin'];
                let temp_target_student = `<option value="${id}"> ${name} ( ${original} )</option>`;
                $('#target_student').append(temp_target_student)
            } 
        },
        error:function(xhr, status, error){
                alert(xhr.responseText);
            }
    })
}
