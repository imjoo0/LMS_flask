const today = new Date();
// 처음 get 할때 뿌려질 정보 보내는 함수 
$(document).ready(function () {
    paginating(0) 
})
function go_back(){
    $('#for_taskban_list').hide();
    $('#for_task_list').show();
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
                    data-bs-target="#answer" onclick="get_question(${item.id},${done_code})">✏️</button> 
                    <button onclick="delete_question(${item.id})">❌</button></td>`;
                });
                $('#alim-tr').html(dataHtml);
            }
        })
        }
    }) 
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
                // 카테고리의 이름만 저장 
            });
            taskData = JSON.parse(data);
            container.pagination({
            dataSource: JSON.parse(data),
            prevText: '이전',
            nextText: '다음',
            pageSize: 10,
            callback: function (data, pagination){
                var dataHtml = '';
                var idxHtml = `<option value="" selected>카테고리를 선택해주세요</option><option value="전체">전체</option>`;
                $.each(data, function (index, task){
                let progress = '';
                let startdate = new Date(task.startdate)
                let deadline = new Date(task.deadline)
                if(today < startdate ){
                    progress = '예정'
                }else if( startdate <= today <= deadline){
                    progress = '진행 중'
                }else{
                    progress = '마감'
                }
                dataHtml +=  `
                    <td class="col-3">${ task.startdate } ~ ${ task.deadline } (${progress})</td>               
                    <td class="col-3">${task.name}업무</td>          
                    <td class="col-4"> ${task.contents}</td>
                    <td class="col-2" onclick="get_taskban(${task.id})"> <button>✏️</button>
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
        if(value == "전체"){
            return get_task()
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
                var idxHtml = `<option value="none" selected>카테고리를 선택해주세요</option>`;
                $.each(data, function (index, task){
                let progress = '';
                let startdate = new Date(task.startdate)
                let deadline = new Date(task.deadline)
                if(today < startdate ){
                    progress = '예정'
                }else if( startdate <= today <= deadline){
                    progress = '진행 중'
                }else{
                    progress = '마감'
                }
                    dataHtml +=  `
                    <td class="col-3">${ task.startdate } ~ ${ task.deadline } (${progress})</td>              
                    <td class="col-3">${task.name}업무</td>    
                    <td class="col-4"> ${task.contents}</td>
                    <td class="col-2" onclick="get_taskban(${task.id})"> <button>✏️</button>
                    <button onclick="delete_task(${task.id})">❌</button></td>`;
                    });

                $('#task-tr').html(dataHtml);      
        }
    })
}

function get_taskban(task_id){
    $('#taskModalLabel').html('반 별 진행 내역');
    $('#for_task_list').hide();
    $('#for_taskban_list').show();
    $.ajax({
        type: "GET",
        url: "/manage/taskban/"+task_id,
        data: {},
        success: function (response) {
            $('#taskban_list').empty();
            for(i=0;i<response['target_taskban'].length;i++){
                let target = response['target_taskban'][i]
                let id = target["id"]
                let ban = target["ban"]
                let done = target["done"]
                if(done == 0){
                    done = '미진행' 
                }else{
                    done = '진행완료'
                }
                let temp_task_ban_box = `
                <td class="col-4">${ban}</td>
                <td class="col-4">${done}</td>
                <td class="col-4">✖️</td>
                `;
                $('#taskban_list').append(temp_task_ban_box);
            }
        } 
    });
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
                alert(`삭제되었습니다.`)
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
                    alert(`삭제되었습니다.`)
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


