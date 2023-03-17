const today = new Date();
var selectedList = [];

// 처음 get 할때 뿌려질 정보 보내는 함수 
$(document).ready(function () {
    paginating(0)
    getBanlist()
})
// 전체 반 정보 가져오는 함수 
function getBanlist() {
    $.ajax({
        type: "GET",
        url: "/common/all_ban",
        data: {},
        success: function (response) {
            let temp_ban_option = '<option value=0 selected>반을 선택해주세요</option>';
            let target_ban = response['target_ban']
            for (i = 0; i < target_ban.length; i++) {
                let name = target_ban[i]['name']
                let semester = target_ban[i]['semester']
                let t_id = target_ban[i]['teacher_register_no']
                let b_id = target_ban[i]['register_no']
                let value = b_id + '@' + t_id
                temp_ban_option += `
                <option value="${value}">${name} (${semester}월 학기)</option>
                `;
            }
            $('#ban_list').html(temp_ban_option)
            $('#consulting_target_ban').html(temp_ban_option)
        },
        error: function (xhr, status, error) {
            alert('xhr.responseText');
        }
    })

}

// 상담 요청 모달이 클릭됐을때 실행 되는 / 모달에 필요한 정보 보내주는 함수 
async function request_consulting() {
    $('#consulting_target_ban').change(function(){
        $('#select_student').hide()
        var selectedValues = $(this).val()[0];
        if (selectedList.indexOf(selectedValues) === -1) {
            selectedList.push(selectedValues);
        }
        $('#target_bans').empty()
        for(i=0;i<selectedList.length;i++){
            option_text = $('#consulting_target_ban option[value="' + selectedList[i] + '"]').text(); 
            if(option_text !='반을 선택해주세요'){
                var selectedOptions = `
                <li>
                    ${option_text}
                    <button onclick="get_select_student(${i})">개별학생선택</button> 
                    <button onclick="delete_selected_ban(${i})">❌</button> 
                </li>
                `
                $('#target_bans').append(selectedOptions);
            }
            
        }
    });
    // 반 선택 되면 변화에 따라 함수 실행 
    setInterval(function () {
        if($(`input:checkbox[id="all_ban_target"]`).is(":checked")) {
            $('#consulting_target_ban').hide()
            $('#target_bans').hide()
        } else {
            $('#consulting_target_ban').show()
            $('#target_bans').show()
        }
    }, 10);
    await $.ajax({
        url: '/manage/request',
        type: 'GET',
        data: {},
        success: function (response) {
            let temp_consulting_category_list = '<option value=0 selected>상담카테고리를 선택해주세요</option>';
            for (i = 0; i < response['all_consulting_category'].length; i++) {
                let id = response['all_consulting_category'][i]['id']
                let name = response['all_consulting_category'][i]['name']
                temp_consulting_category_list += `

                <option value=${id}>${name}</option>
                `;
                $('#consulting_category_list').html(temp_consulting_category_list)
            }
        }
    })
}

// 다중 선택 반 선택 취소
function delete_selected_ban(idx){
    // // selected_list = selected_list.split(",")
    selectedList.splice(idx,1)
    $('#target_bans').empty()
    for(i=0;i<selectedList.length;i++){
        option_text = $('#consulting_target_ban option[value="' + selectedList[i] + '"]').text(); 
        if(option_text !='반을 선택해주세요'){
            var selectedOptions = `
            <li>
                ${option_text}
                <button onclick="get_select_student(${i})">개별학생선택</button> 
                <button onclick="delete_selected_ban(${i})">❌</button> 
            </li>
            `
            $('#target_bans').append(selectedOptions);
        }
    }
}

async function get_select_student(idx){
    target = selectedList[idx].split('@')
    $('#select_student').show()

    await $.ajax({
        type: "GET",
        url: "/manage/ban/"+target[0]+target[1],
        data: {},
        success: function (response) {
            let target_ban = response['target_ban']
            if (response['status'] == 400){
                let no_data_title = `<h1> ${response.text} </h1>`
                $('#s_data').html(no_data_title);
                $('#pagingul').hide();
                return
            }
            let students_num = target_ban['student_num'];
            let ban_name = target_ban['name'];
            let teacher_name = target_ban['teacher_name']
            let teacher_e_name = target_ban['teacher_engname']
            let teacher_mobileno = target_ban['teacher_mobileno']
            let teacher_email = target_ban['teacher_email']
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

            displayData(totalData, 1, dataPerPage,data_list, u_consulting_my,b_id);
            paging(totalData, dataPerPage, pageCount, 1,data_list, u_consulting_my,b_id);

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
                alert('xhr.responseText');
            }
    })
}

function post_consulting_request(){
    console.log(
    $('#consulting_target_ban').val())
}

function go_back() {
    $('#for_taskban_list').hide();
    $('#for_task_list').show();
}

function paginating(done_code) {
    let container = $('#pagination')
    $.ajax({
        url: '/manage/api/get_all_questions/' + done_code,
        type: 'get',
        data: {},
        success: function (data) {
            container.pagination({
                dataSource: JSON.parse(data),
                prevText: '이전',
                nextText: '다음',
                pageClassName: 'float-end',
                pageSize: 5,
                callback: function (data, pagination) {
                    var dataHtml = '';
                    $.each(data, function (index, item) {
                        if (item.category == 0) { item.category = '일반문의' }
                        else if (item.category == 1) { item.category = '퇴소 요청' }
                        else if (item.category == 2) { item.category = '이반 요청' }
                        else { item.category = '취소/환불 요청' }
                        dataHtml += `
                    <td class="col-2">${item.category}</td>
                    <td class="col-4">${item.title}</td>
                    <td class="col-4">${item.contents}</td>
                    <td class="col-2"> <button class="custom-control custom-control-inline custom-checkbox" data-bs-toggle="modal"
                    data-bs-target="#answer" onclick="get_question(${item.id},${done_code})">✏️</button> 
                    <button onclick="delete_question(${item.id})">❌</button></td>`;
                    });
                    $('#alim-tr').html(dataHtml);
                }
            })
        }
    })
}

async function get_consulting() {
    let container = $('#consulting-pagination')
    var category_list = []
    await $.ajax({
        url: '/manage/api/get_consulting',
        type: 'get',
        data: {},
        success: function (data) {
            console.log(data)
            $.each([...JSON.parse(data)], function (idx, val) {
                category_list.push(val.name)
            });
            consultingData = data;
            container.pagination({
                dataSource: JSON.parse(data),
                prevText: '이전',
                nextText: '다음',
                pageSize: 10,
                callback: function (data, pagination) {
                    var dataHtml = '';
                    var idxHtml = `<option value="none">전체</option>`;
                    $.each(data, function (index, consulting) {
                        dataHtml += `
                    <td class="col-3">${consulting.startdate} ~ ${consulting.deadline}</td>
                    <td class="col-2">${consulting.name}</td>
                    <td class="col-1"> 미진행 </td>
                    <td class="col-4"> ${consulting.contents}</td>
                    <td class="col-2"> <button onclick="update_consulting(${consulting.id})">✏️</button> 
                    <button onclick="delete_consulting(${consulting.id})">❌</button></td>`;
                    });
                    category_set = new Set(category_list)
                    category_list = [...category_set]
                    $.each(category_list, function (idx, val) {
                        idxHtml += `<option value="${val}">${val}</option>`
                    })
                    $('#consulting-option').html(idxHtml);
                    $('#tr-row').html(dataHtml);
                }
            })
        },
        error: function (xhr, status, error) {
            alert(xhr.responseText);
        }
    })
}

async function update_consulting(idx) {
    await $.ajax({
        url: '/manage/api/update_consulting',
        type: 'get',
        data: { 'text': 'good' },
        success: function (data) {
            console.log(data)
        }
    })
}

async function sort_consulting(value) {
    var dataHtml = '';
    let container = $('#consulting-pagination')
    const data = await JSON.parse(consultingData).filter((e) => {
        if (value == 'none') {
            return e.name
        } else {
            return e.name == value;
        }
    })
    await container.pagination({
        dataSource: data,
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        callback: function (data, pagination) {
            console.log(data)
            var dataHtml = '';
            $.each(data, function (index, consulting) {
                dataHtml += `
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

async function get_task() {
    let container = $('#task-pagination')
    var category_list = []
    await $.ajax({
        url: '/manage/api/get_task',
        type: 'get',
        data: {},
        success: function (data) {
            $.each([...JSON.parse(data)], function (idx, val) {
                category_list.push(val.name)
                // 카테고리의 이름만 저장 
            });
            taskData = JSON.parse(data);
            container.pagination({
                dataSource: JSON.parse(data),
                prevText: '이전',
                nextText: '다음',
                pageSize: 10,
                callback: function (data, pagination) {
                    var dataHtml = '';
                    var idxHtml = `<option value="" selected>카테고리를 선택해주세요</option><option value="none">전체</option>`;
                    $.each(data, function (index, task) {
                        let progress = '';
                        let startdate = new Date(task.startdate)
                        let deadline = new Date(task.deadline)
                        if (today < startdate) {
                            progress = '예정'
                        } else if ((startdate <= today) && (today <= deadline)) {
                            progress = '진행 중'
                        } else {
                            progress = '마감'
                        }
                        dataHtml += `
                    <td class="col-3">${task.startdate} ~ ${task.deadline} (${progress})</td>               
                    <td class="col-3">${task.name}업무</td>          
                    <td class="col-4"> ${task.contents}</td>
                    <td class="col-2"> <button onclick="get_taskban(${task.id})">✏️</button>
                    <button onclick="delete_task(${task.id})">❌</button></td>`;
                    });
                    category_set = new Set(category_list)
                    category_list = [...category_set]
                    $.each(category_list, function (idx, val) {
                        idxHtml += `<option value="${val}">${val}</option>`
                    })
                    $('#task-category-select').html(idxHtml);
                    $('#task-tr').html(dataHtml);
                }
            })

        },
        error: function (xhr, status, error) {
            alert(xhr.responseText);
        }
    })
}

async function sort_task(value) {
    var dataHtml = '';
    let container = $('#task-pagination')
    const data = taskData.filter((e) => {
        if (value == 'none') {
            return e.name
        } else {
            return e.name == value;
        }
    })
    await container.pagination({
        dataSource: data,
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        callback: function (data, pagination) {
            var dataHtml = '';
            var idxHtml = `<option value="none" selected>카테고리를 선택해주세요</option>`;
            $.each(data, function (index, task) {
                let progress = '';
                let startdate = new Date(task.startdate)
                let deadline = new Date(task.deadline)
                if (today < startdate) {
                    progress = '예정'
                } else if ((startdate <= today) && (today <= deadline)) {
                    progress = '진행 중'
                } else {
                    progress = '마감'
                }
                dataHtml += `
                    <td class="col-3">${task.startdate} ~ ${task.deadline} (${progress})</td>              
                    <td class="col-3">${task.name}업무</td>    
                    <td class="col-4"> ${task.contents}</td>
                    <td class="col-2"> <button onclick="get_taskban(${task.id})">✏️</button>
                    <button onclick="delete_task(${task.id})">❌</button></td>`;
            });

            $('#task-tr').html(dataHtml);
        }
    })
}

function get_taskban(task_id) {
    $('#taskModalLabel').html('반 별 진행 내역');
    $('#for_task_list').hide();
    $('#for_taskban_list').show();
    $.ajax({
        type: "GET",
        url: "/manage/taskban/" + task_id,
        data: {},
        success: function (response) {
            let temp_task_ban_box = '';
            for (i = 0; i < response['target_taskban'].length; i++) {
                let target = response['target_taskban'][i]
                let id = target["id"]
                let ban = target["ban"]
                let done = target["done"]
                if (done == 0) {
                    done = '미진행'
                } else {
                    done = '진행완료'
                }
                temp_task_ban_box += `
                <td class="col-4">${ban}</td>
                <td class="col-4">${done}</td>
                <td class="col-4">✖️</td>
                `;
                $('#taskban_list').html(temp_task_ban_box);
            }
        }
    });
}

async function delete_consulting(idx) {
    const csrf = $('#csrf_token').val();
    var con_val = confirm('정말 삭제하시겠습니까?')
    if (con_val == true) {
        await $.ajax({
            url: '/manage/api/delete_consulting/' + idx,
            type: 'get',
            headers: { 'content-type': 'application/json' },
            data: {},
            success: function (data) {
                if (data.status == 200) {
                    alert(`삭제되었습니다.`)
                } else {
                    alert(`실패 ${data.status} ${data.text}`)
                }
            },
            error: function (xhr, status, error) {
                alert(xhr.responseText);
            }
        })
        get_consulting()
    }
}

async function delete_task(idx) {
    var con_val = confirm('정말 삭제하시겠습니까')
    if (con_val == true) {
        await $.ajax({
            url: '/manage/api/delete_task/' + idx,
            type: 'get',
            headers: { 'content-type': 'application/json' },
            data: {},
            success: function (data) {
                if (data.status == 200) {
                    alert(`삭제되었습니다.`)
                } else {
                    alert(`실패 ${data.status} ${data.text}`)
                }
            },
            error: function (xhr, status, error) {
                alert(xhr.responseText);
            }
        })
        get_task()
    }
}

function plusconsulting(student_id, is_done) {
    $.ajax({
        type: "GET",
        url: "/manage/get_consulting_history/" + student_id,
        data: {},
        success: function (response) {
            if (response["consulting_list"] == '없음') {
                $('#consultinghistoryModalLabelt').html('진행 한 상담이 없습니다.')
                //     $('#consulting_list').hide();
                //     let temp_consulting_contents_box = `
                //     <p> 오늘의 상담 업무를 완료했습니다 🎉</p>
                //     `;
                //     $('#consulting_msg').html(temp_consulting_contents_box);
            } else {
                $('#consultinghistoryModalLabelt').html('상담일지 작성')
                $('#consulting_write_box').empty();
                let r_target = response["consulting_list"]
                for (i = 0; i < r_target.length; i++) {
                    let target = r_target[i]
                    let category = target['category']
                    let consulting_id = target['c_id']
                    let contents = target['contents']
                    let consulting_missed = target['consulting_missed']
                    let deadline = target['deadline']
                    if (is_done == 1) {
                        let history_reason = target['history_reason']
                        let history_solution = target['history_solution']
                        let history_result = target['history_result']
                        let history_created = target['history_created']
                        let temp_consulting_contents_box = `
                    <input type="hidden" id="target_consulting_id${i}" value="${consulting_id}" style="display: block;" />
                    <p >✅<strong>${category}</strong></br>${contents}</br>*마감:
                        ~${deadline}까지 | 부재중 : ${consulting_missed}</br></p>
                    <div class="modal-body-select-container">
                        <span class="modal-body-select-label">상담 사유</span>
                        <input class="modal-body-select" type="text" size="50"
                            id="consulting_reason${consulting_id}" style="width: 75%;" placeholder="${history_reason}">
                    </div>
                    <div class="modal-body-select-container">
                        <span class="modal-body-select-label">제공한 가이드</span>
                        <input class="modal-body-select" type="text" size="50"
                            id="consulting_solution${consulting_id}" style="width: 75%;" placeholder="${history_solution}">
                    </div>
                    <div class="modal-body-select-container">
                        <span class="modal-body-select-label">상담 결과</span>
                        <textarea class="modal-body-select" type="text" rows="5" cols="25"
                            id="consulting_result${consulting_id}" style="width: 75%;" placeholder="${history_result}"></textarea>
                    </div>
                    <p>상담 일시 : ${history_created}</p>
                    `;
                        $('#consulting_write_box').append(temp_consulting_contents_box);
                    } else {
                        let temp_consulting_contents_box = `
                    <input type="hidden" id="target_consulting_id${i}" value="${consulting_id}" style="display: block;" />
                    <p >✅<strong>${category}</strong></br>${contents}</br>*마감:
                        ~${deadline}까지 | 부재중 : ${consulting_missed}</br></p>
                    <div class="modal-body-select-container">
                        <span class="modal-body-select-label">상담 사유</span>
                        <input class="modal-body-select" type="text" size="50"
                            id="consulting_reason${consulting_id}" style="width: 75%;">
                    </div>
                    <div class="modal-body-select-container">
                        <span class="modal-body-select-label">제공한 가이드</span>
                        <input class="modal-body-select" type="text" size="50"
                            id="consulting_solution${consulting_id}" style="width: 75%;">
                    </div>
                    <div class="modal-body-select-container">
                        <span class="modal-body-select-label">상담 결과</span>
                        <textarea class="modal-body-select" type="text" rows="5" cols="25"
                            id="consulting_result${consulting_id}" style="width: 75%;"></textarea>
                    </div>
                    `;
                        $('#consulting_write_box').append(temp_consulting_contents_box);
                    }

                }
                let temp_post_box = `
                <p>✔️ 상담 결과 이반 / 취소*환불 / 퇴소 요청이 있었을시 본원 문의 버튼을 통해 승인 요청을 남겨주세요</p>
                    <div class="modal-body-select-container">
                    <span class="modal-body-select-label">부재중</span>
                    <label><input type="checkbox" id="missed">부재중</label>
                    </div>
                    <div class="d-flex justify-content-center mt-4 mb-2" id="consulting_button_box">
                        <button class="btn btn-dark"
                            onclick="post_bulk_consultings(${r_target.length},${is_done})"
                            style="margin-right:5px">저장</button>
                    </div>
                `;
                $('#consulting_write_box').append(temp_post_box);
            }
        }
    });
    // $('#today_consulting_box').show();
}
