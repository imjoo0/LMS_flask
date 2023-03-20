const today = new Date();
var selectedBanList = [];
var selectedStudentList = [];

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
                let value = b_id + '_' + t_id
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
    $('#select_result').hide()
    $('#select_student').hide()
    
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

async function ban_change(btid){
    $('#select_result').show()
    if(btid == 0){
        // 전체 반 대상 진행 일 경우 처리 
        $('#select_student').hide()
        $('#consulting_msg').html('<p>전체 반 대상 진행합니다 (소요되는 시간이 있으니 저장 후 대기 해 주세요)</p>')
    }else{
        // 반 다중 선택에 push 
        $('#consulting_msg').empty();
        if(selectedBanList.indexOf(btid) === -1) {
            selectedBanList.push(btid);
        }

        $('#select_student').show() 
        // b_id + '_' + t_id
        value = btid.split('_')  
        
        await $.ajax({
            type: "GET",
            url: "/manage/ban_student/"+value[0],
            data: {},
            success: function (response) {
                // 전체 학생 대상 진행 append 
                let temp_target_student = `<option value="전체학생_${btid}">✔️전체 학생 대상 진행</option>`;
                for (var i = 0; i <  response['students'].length; i++) {
                    target = response['students'][i]
                    let name = target['name'];
                    temp_target_student += `<option value="${btid}_${target['register_no']}"> ${name}</option>`;
                } 
                $('#consulting_target_students').html(temp_target_student)
            },
            error:function(xhr, status, error){
                    alert('xhr.responseText');
            }
        })
        // 선택 된거 보여주기 
        // $('#target_result').empty()
        // for(i=0;i<selectedBanList.length;i++){
        //     option_text = $('#consulting_target_ban option[value="' + selectedBanList[i] + '"]').text();
        //     var selectedOptions = `
        //     <li>
        //         ${option_text}
        //         <button onclick="get_select_student(${i})">학생선택</button> 
        //         <button onclick="delete_selected_ban(${i})">❌</button> 
        //     </li>
        //     <div class="notice_message" id="select_student${selectedBanList[i]}" style="display:none">
        //         <p>👇 상담을 진행할 학생을 선택해주세요</p>
        //         <select class="border rounded-0 form-control form-control-sm" multiple id="consulting_target_student${selectedBanList[i]}">
        //         </select>
        //         <ul class="make_col" id="target_students">
        //         </ul>
        //     </div>
        //     `
        //     $('#target_bans').append(selectedOptions);
        }
}
// 학생 다중 선택 처리 
$('#consulting_target_students').change(function(){
    var selectedValues = $(this).val()[0];
    if(selectedValues.includes("전체학생")){
        selectedOptions = '<li>✔️전체 학생 대상 진행<button onclick="delete_selected_student(-1)">❌</button> </li>'
        $('#target_students').html(selectedOptions);
    }else{
        if (selectedStudentList.indexOf(selectedValues) === -1) {
            selectedStudentList.push(selectedValues);
        }
        // 선택 된거 보여주기 
        var selectedOptions = ''
        for(i=0;i<selectedStudentList.length;i++){
            option_text = $(`#consulting_target_students option[value="${selectedStudentList[i]}"]`).text(); 
            selectedOptions += `
            <li>${option_text}<button onclick="delete_selected_student(${i})">❌</button> </li>
            `
            $('#target_students').html(selectedOptions);
        }
    }
    $('#consulting_target_students').val(selectedStudentList)
});

function delete_selected_student(idx){
    // // selected_list = selected_list.split(",")
    if(idx != -1){
        selectedStudentList.splice(idx,1)
        $('#consulting_target_students').val(selectedStudentList)

        // 선택 된거 보여주기 
        var selectedOptions = ''
        for(i=0;i<selectedStudentList.length;i++){
            option_text = $(`#consulting_target_students option[value="${selectedStudentList[i]}"]`).text(); 
            selectedOptions += `
            <li>${option_text}<button onclick="delete_selected_student(${i})">❌</button></li>
            `
            $('#target_students').html(selectedOptions);
        }
    }else{
        $('#target_students').empty()
    }
}

// 여기 아래부턴 과거 코드 
// 다중 선택 반 선택 취소
function delete_selected_ban(idx){
    // // selected_list = selected_list.split(",")
    selectedBanList.splice(idx,1)
    $('#consulting_target_ban').val(selectedBanList)

     // 선택 된거 보여주기 
    $('#target_bans').empty()
    for(i=0;i<selectedBanList.length;i++){
        option_text = $('#consulting_target_ban option[value="' + selectedBanList[i] + '"]').text(); 
        var selectedOptions = `
        <li>
            ${option_text}
            <button onclick="get_select_student(${i})">학생선택</button> 
            <button onclick="delete_selected_ban(${i})">❌</button> 
        </li>
        <div class="notice_message" id="select_student${selectedBanList[i]}" style="display:none">
            <p>👇 상담을 진행할 학생을 선택해주세요</p>
            <select class="border rounded-0 form-control form-control-sm" multiple id="consulting_target_student${selectedBanList[i]}">
            
            </select>
            <ul class="make_col" id="target_students">
            </ul>
        </div>
        `
        $('#target_bans').append(selectedOptions);
    }
}

function get_selected_student(idx){
    $('#select_student'+selectedBanList[idx]).show() 
    // b_id + '_' + t_id
    value = selectedBanList[idx].split('_')  
    $.ajax({
        type: "GET",
        url: "/manage/ban_student/"+value[0],
        data: {},
        success: function (response) {
            // 전체 학생 대상 진행 append 
            let temp_target_student = `<option value="전체학생_${selectedBanList[idx]}">✔️전체 학생 대상 진행</option>`;
            for (var i = 0; i <  response['students'].length; i++) {
                target = response['students'][i]
                let name = target['name'];
                temp_target_student += `<option value="${selectedBanList[idx]}_${target['register_no']}"> ${name}</option>`;
            } 
            $('#consulting_target_student'+selectedBanList[idx]).html(temp_target_student)
        },
        error:function(xhr, status, error){
                alert('xhr.responseText');
        }
    })
    $('#consulting_target_student'+selectedBanList[idx]).change(function(){
        var selectedValues = $(this).val()[0];
        if (selectedStudentList.indexOf(selectedValues) === -1) {
            selectedStudentList.push(selectedValues);
        }
        $('#consulting_target_student'+selectedBanList[idx]).val(selectedStudentList)

        // 선택 된거 보여주기 
        $('#target_students').empty()
        for(i=0;i<selectedStudentList.length;i++){
            option_text = $(`#consulting_target_student${selectedBanList[idx]} option[value="${selectedStudentList[i]}"]`).text(); 
            var selectedOptions = `
            <li>
                ${option_text}
                <button onclick="delete_selected_student(${i})">❌</button> 
            </li>
            `
            $('#target_students').append(selectedOptions);
        }
    });

}


function post_consulting_request(){
    console.log(
    $('#consulting_target_ban').val())
    console.log(
        $('#consulting_target_student').val())
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
