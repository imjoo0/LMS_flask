// xss 공격 체크 함수 
// function XSSCheck(str, level) {
//     if (level == undefined || level == 0) {
//         str = str.replace(/\<|\>|\"|\'|\%|\;|\(|\)|\&|\+|\-/g, "");
//     } else if (level != undefined && level == 1) {
//         str = str.replace(/\</g, "&lt;");
//         str = str.replace(/\>/g, "&gt;");
//     }
//     return str;
// }
$(window).on('load', async function () {
    if(!getIsFetching()){
        try{
            setIsFetching(true);
            await get_teacher_data()
            home()
        }catch (error) {
            alert('Error occurred while retrieving data2.');
        }finally {
            setIsFetching(false);
        }
    }
})

async function home(){
    $('#ban_chart_list').empty()
    if(Tban_data.length <= 0){
        alert('담당중인 반이 없습니다')
        return
    }
    // 상담 카테고리 선택 
    let temp_category = `<option value=0 selected>상담 카테고리를 선택해 주세요</option>`
    Tconsulting_category.forEach((elem) => {
        temp_category += `<option value=${elem.id}>${elem.name}</option>`
    });
    $('#consulting_cate').html(temp_category)
    // 인원 관리 
    let temp_ban_option = '<option value="none" selected>반을 선택해주세요</option>';
    let total_first_student_num = 0
    let total_out_student_num = 0
    let total_hold_student_num = 0
    let total_now_student_num = 0
    let temp_ban_list = ''
    Tban_data.forEach((elem) => {
        let semester = make_semester(elem.semester)
        temp_ban_option += `<option value=${elem.register_no}>${elem.name} (${semester}월 학기)</option>`;
        let first_student = Tall_students.filter(s=>s.ban_id == elem.register_no)
        let first_student_num = first_student.length
        let out_student_num = first_student_num != 0 ? first_student.filter(s=>s.category_id == 2 || s.category_id == 8).length : 0 
        let hold_student_num = first_student_num != 0 ? first_student.filter(s=>s.category_id == 3).length : 0 
        let now_student_num = first_student_num - out_student_num - hold_student_num

        total_first_student_num += first_student_num
        total_out_student_num += out_student_num
        total_hold_student_num += hold_student_num
        total_now_student_num += now_student_num

        temp_ban_list += `
        <tbody style="width:100%;">
            <tr class="row">
                <th class="col-12">${elem.name}반 ( ${semester}학기 )</th>
            </tr>
            <tr class="row">
                <th class="col-3">관리중</th>
                <th class="col-3">보류</th>
                <th class="col-3">퇴소</th>
                <th class="col-3">원생 목록</th>  
            </tr>
            <tr class="row">
                <td class="col-3">${now_student_num}</td>
                <td class="col-3">${hold_student_num}</td>
                <td class="col-3">${out_student_num}</td>
                <td class="col-3" data-bs-toggle="modal" data-bs-target="#ban_student_list" onclick="get_student(${elem.register_no})">✔️</td>
            </tr>
        </tbody>
        `
    });
    
    let temp_ban_chart = `
    <div class="d-flex justify-content-start align-items-start flex-column w-100 my-2">
        <h5 class="mb-3"> 📌 초기 배정 원생 수:  ${total_first_student_num}</h5>
        <div class="row w-100">
            <div class="chart-wrapper col-sm-5"style="margin-left:30%">
                <canvas id="total-chart-element" class="total-chart-element p-sm-3 p-2"></canvas>
                <div class ="chart-data-summary">
                    <span>관리중:${total_now_student_num}</span><br>
                    <span>* 보류:${total_hold_student_num}</span><br>
                    <span>* 퇴소:${total_out_student_num}</span>
                </div>
            </div>
        </div>
        <div class="col-sm-12 d-flex justify-content-center align-items-center">
            <table class="table text-center" id="class_list">
                ${temp_ban_list}
            </table>
        </div>
    </div>
    `;
    $('#ban_chart_list').html(temp_ban_chart);
    new Chart($((`#total-chart-element`)), {
        type: 'doughnut',
        data: {
            labels: ['관리중', '보류', '퇴소'],
            datasets: [
                {
                    data: [total_now_student_num, total_hold_student_num, total_out_student_num],
                    backgroundColor: ['#B39CD0', '#ffd400', '#F23966'],
                    hoverOffset: 4,
                },
            ],
        },
        options: {
            plugins: {
                legend: {
                    display: false,
                },
            },
        },
    });
    // 본원 문의 ban선택 옵션 같이 붙이기 
    $('#my_ban_list').html(temp_ban_option)

    // 업무 관리 
    let today_task_num = Tall_task.length
    // 상담 목록
    let taskConsultingsData = Tall_consulting.length > 0 ? Tall_consulting.filter(consulting => (consulting.category_id > 100) &&( (consulting.done == 1 && new Date(consulting.created_at).setHours(0, 0, 0, 0) === today)||(consulting.done == 0) )) : []; 
    let today_taskconsulting_num = taskConsultingsData.length;
    
    let total_task_num = today_task_num + today_taskconsulting_num
    let temp_report = ''
    if (total_task_num == 0){
        temp_report += `
        <td class="col-3">오늘의 업무가 없습니다</td>
        <td class="col-3">➖</td>
        `;

        $('#task_title').html('오늘의 업무 0건');
        $('#cate_menu').html('<p>오늘의 업무가 없습니다</p>');
        $('#taskconsulting_cate_menu').html('본원 요청 업무가 없습니다.');
        $('#task_button').hide();
    }else{
        let today_task_done = 0 
        let today_task_notdone = 0
        let today_consulting_done = 0
        let today_consulting_notdone_num = 0
        if(today_task_num == 0){
            $('#tasktitlebox').html('반 업무가 없습니다.');
            $('#task_button').hide();
        }else{
            $('#task_button').show();
            today_task_done = Tall_task.filter(task => task.done == 1 && new Date(task.created_at).setHours(0, 0, 0, 0) === today).length ;
            today_task_notdone =  Tall_task.filter(task => task.done == 0).length ;
        }
        if(today_taskconsulting_num == 0){
            $('#taskconsulting_cate_menu').html('본원 요청 업무가 없습니다.');
        }else{
            today_consulting_done = taskConsultingsData.filter(consulting => consulting.done == 1 && new Date(consulting.created_at).setHours(0, 0, 0, 0) === today).length ;
            let today_consulting_notdone = taskConsultingsData.filter(consulting => consulting.done == 0);
            today_consulting_notdone_num = today_consulting_notdone.length 
            let temp_taskconsulting = '본원 요청 업무를 전부 완수했습니다'
            if(today_consulting_notdone_num != 0){
                temp_taskconsulting = `
                <thead  style="background-color:#ffc107;">
                    <tr class="row">
                    <th class="col-5">요청 내용</th>
                    <th class="col-2">원번</th>
                    <th class="col-2">원생</th>
                    <th class="col-1">작성</th>
                    <th class="col-2">마감일 ></th>
                    </tr>
                </thead>
                <tbody style="width:100%;"> 
                `;
                $.each(today_consulting_notdone, function (index, taskconsulting) {
                    let student_info = Tall_students.filter(s=> s.student_id == taskconsulting.student_id)[0]
                    if(taskconsulting.contents && taskconsulting.contents.length > 30) {
                        contents = taskconsulting.contents.substring(0, 30) + ' ▪️▪️▪️ ';
                    }
                    let student_category = make_out(2)
                    if(student_info != undefined){
                        student_category = make_out(student_info.category_id);
                    }
                    let done_class = ''
                    if(taskconsulting.done == 1){
                        done_class = 'done';
                    }
                    temp_taskconsulting += `
                    <tr class="row">
                        <td class="col-5 ${done_class}">${contents}</td>
                        <td class="col-2 ${student_category} ${done_class}">${taskconsulting.origin}</br>${student_category}</td>
                        <td class="col-2 ${done_class}">${taskconsulting.student_name}</br>${taskconsulting.student_engname}</td>
                        <td class="col-1 ${done_class}" data-bs-toggle="modal" data-bs-target="#consultinghistory" onclick="get_consulting('${taskconsulting.student_id}')"><span class="cursor-pointer">📝</td>
                        <td class="col-2 ${done_class}">${make_date(taskconsulting.deadline)} ></td>
                    </tr>
                    `;
                    
                })
                temp_taskconsulting += `</tbody>`
            }
            
            $('#taskconsulting_cate_menu').html(temp_taskconsulting)
        }
        let task_done = today_task_done+today_consulting_done
        let task_notdone = today_task_notdone+today_consulting_notdone_num
        temp_report += `
        <td class="col-3"> ${task_done}/${total_task_num} </td>
        <td class="col-3"> ( ${answer_rate(task_done, total_task_num).toFixed(0)}% ) </td>
        `;
        if(task_notdone == 0){
            $('#task_title').html('오늘의 업무 끝 😆');
            $('#task_button').hide();
        }else{
            $('#task_title').html('오늘의 업무 ' + task_notdone + '건');
        }

        // 오늘의 업무 뿌려주기 
        let temp_cate_menu =''
        
        // 오늘의 업무 중복 카테고리로 묶기 
        const categoryGrouped = Tall_task.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
        }, []);
        let taskGroupedCategory = Object.keys(categoryGrouped)
        $.each(taskGroupedCategory, function (index, category) {
            temp_cate_menu += `
            <thead  style="background-color:#ffc107;">
                <tr class="row">
                <th class="col-8">${category}업무</th>
                <th class="col-2">< 업무순서</th>
                <th class="col-2">마감일 ></th>
                </tr>
            </thead>
            <tbody style="width:100%;"> 
            `;
            let target_tasks = categoryGrouped[category]
            target_tasks.sort((a, b) => b.priority - a.priority);
            const contentsGrouped = target_tasks.reduce((result, item) => {
                const doc = {
                    'id': item.id,
                    'ban_id': item.ban_id,
                    'done': item.done,
                    'created_at': new Date(item.created_at).setHours(0, 0, 0, 0)
                }
                const key = item.priority + '_' + item.contents + '_' + item.deadline;
                if (!result[key]) {
                    result[key] = [];
                }
                result[key].push(doc);
                return result;
            }, []);
            const contentsGroupedkey = Object.keys(contentsGrouped)
            $.each(contentsGroupedkey, function (index, key) {
                const contents = key.split('_')
                temp_cate_menu += `
                <tr class="row">
                    <td class="col-8">${contents[1]}</td>
                    <td class="col-2">${make_priority(contents[0])}</td>
                    <td class="col-2">${make_date(contents[2])}</td>
                </tr>
                <td class="col-12">`;
                $.each(contentsGrouped[key], function (index, ban) {
                    const ban_name = Tban_data.filter(a => a.register_no === ban.ban_id)[0]
                    if (ban_name !== undefined) {
                        if (ban.done == 0) {
                            temp_cate_menu += `
                                <label><input type="checkbox" name="taskid" value="${ban.id}"/>${ban_name.name}</label>`;
                        } else if (ban.done == 1 && ban.created_at === today) {
                            temp_cate_menu += `
                            <label class="done">✅ ${ban_name.name}</label>`;
                        }
                    }
                })
                temp_cate_menu += `</td></tbody>`;
            });
        });
        $('#cate_menu').html(temp_cate_menu);
    }

    // 미학습 관리 
    let ulearned_student_num = Tunlearned_student.length
    if(ulearned_student_num != 0){
        uconsulting_todo_student = Tunlearned_student.filter(u => u.consulting_done == 0)
        let uconsulting_todo_student_num = uconsulting_todo_student.length
        temp_report += `
        <td class="col-3"> ${ulearned_student_num - uconsulting_todo_student_num}/${ulearned_student_num} </td>
        <td class="col-3"> ( ${answer_rate(ulearned_student_num - uconsulting_todo_student_num, ulearned_student_num).toFixed(0)}% ) </td>
        `;
        get_unlearned_consulting_student(0)
    }else{
        temp_report += `
        <td class="col-3">미학습 발생이 없습니다</td>
        <td class="col-3">➖</td>
        `;
    }
    $('#classreport').html(temp_report)    
}
// 미학습 상담 목록
async function get_unlearned_consulting_student(done_code) {
    $('#consultingstudent_search_input').off('keyup');
    Consultingcontainer = $('#consultingstudent_pagination')
    consulting_targetdata = uconsulting_todo_student.filter((e) => {
        if (done_code == 0) {
            $('#today_consulting_title').html('미학습 상담 목록');
            return e.missed != "오늘";
        } else {
            $('#today_consulting_title').html('오늘의 부재중 상담');
            return e.missed == "오늘";
        }
    })

    ConsultingpaginationOptions = {
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        pageClassName: 'float-end',
        callback: function (data, pagination) {
            $('#consulting_student_list').show();
            $('#consultingstudent_pagination').show();
            var temp_consulting_contents_box = '';
            $.each(data, function (index, consulting) {
                // let value = `${consulting.ban_name}_${consulting.student_name}_${consulting.student_mobileno}_${consulting.student_id}`
                temp_consulting_contents_box += `
                <td class="col-2">${consulting.ban_name}</td>
                <td class="col-2">${consulting.student_name}</br>${consulting.student_origin}</td>
                <td class="col-2">${consulting.student_birthday}</td>
                <td class="col-2">${consulting.student_mobileno}</td>
                <td class="col-2">${consulting.deadline}</td>
                <td class="col-1">${consulting.todoconsulting_num}</td>
                <td class="col-1" data-bs-toggle="modal" data-bs-target="#consultinghistory" onclick="get_consulting('${consulting.student_id}')"><span class="cursor-pointer">📝</span></td> 
                `;
            });
            $('#today_consulting_box').html(temp_consulting_contents_box);
            $('#consulting_student_list').show();
        }
    };

    if (consulting_targetdata.length == 0) {
        $('#today_consulting_title').html($('#today_consulting_title').html() + '   0건');
        $('#consulting_student_list').hide();
        $('#consultingstudent_pagination').hide();
    }else{
        Consultingcontainer.pagination(Object.assign(ConsultingpaginationOptions, { 'dataSource': consulting_targetdata }))
    }

    $('#consultingstudent_search_input').on('keyup', function () {
        var searchInput = $(this).val().toLowerCase();
        var filteredData = consulting_targetdata.filter(function (d) {
            return (d.hasOwnProperty('ban_name') && d.ban_name.toLowerCase().indexOf(searchInput) !== -1) || (d.hasOwnProperty('student_name') && d.student_name.toLowerCase().indexOf(searchInput) !== -1) || (d.hasOwnProperty('student_origin') && d.student_origin.toLowerCase().indexOf(searchInput) !== -1);
        });
        Consultingcontainer.pagination('destroy');
        Consultingcontainer.pagination(Object.assign(ConsultingpaginationOptions, { 'dataSource': filteredData }));
    });
}
// 상담일지 모달 내용 작성 
async function get_consulting(student_id) {
    let data = Tstudent_consulting.filter(s => s.student_id == student_id)[0]
    let student_category = make_out(2)
    if(data != undefined){
        student_category = make_out(data.student_category);
    }else{
        data = {}
        data.todoconsulting = Tall_consulting.filter(c=>c.student_id == student_id && c.done == 0)
        data.todoconsulting_num = data.todoconsulting.length
        let ban_data = Tban_data.filter(b=>b.register_no == data.todoconsulting[0].ban_id)[0]
        data.ban_id = ban_data.id
        data.ban_name = ban_data.name
        data.student_name = data.todoconsulting[0].student_name + '(' + data.todoconsulting[0].student_engname + ')'
        data.student_origin = data.todoconsulting[0].origin
        data.student_birthday = ''
        data.student_mobileno = ''
        data.ulearned_num = 0
        if(ban_data == undefined){
            data.ban_name = ''
            data.student_name = ''
            data.student_origin = ''
            data.student_birthday = ''
            data.student_mobileno = ''
            data.ulearned_num = 0
        }
    }
    consulting_history(student_id)
    $('#consultinghistoryModalLabelt').html(`${data.student_name} ${make_out(student_category)} 원생 상담일지`)
        $('#studentconsulting_history_box_detail').hide()
        $('.mo_inloading').show()
        $('.monot_inloading').hide()

        $('#student_info_box').html(`
        <th class="col-12">${data.ban_name}</th>
        <th class="col-4">${data.student_name}</th>
        <th class="col-2">${data.student_origin}</th>
        <th class="col-1 ${student_category}">${student_category}</th>
        <th class="col-2">생년월일 : ${data.student_birthday}</th>
        <th class="col-3">📞${data.student_mobileno}</th>
        `);
        let total_ban_unlearned_consulting = Tall_consulting.filter(c=>c.ban_id == data.ban_id && c.category_id < 100).length

        // // 기한 지난 상담 수
        let deadline_consulting = data.todoconsulting_num != 0 ? data.todoconsulting.filter(c => new Date(c.deadline).setHours(0, 0, 0, 0) < today).length : 0


        $('#student_consulting_info_box').html(`
        <th class="col-1">상담</th>
        <th class="col-1">기한 지남</th>
        <th class="col-4">${data.student_name} 미학습</th>
        <th class="col-4">${data.ban_name}반 총 미학습</th>
        <th class="col-2">${data.student_name} 미학습 발생율</th>
        <td class="col-1">${make_nodata(data.todoconsulting_num)}</td>
        <td class="col-1">${make_nodata(deadline_consulting)}</td>
        <td class="col-4">${make_nodata(data.ulearned_num)}</td>
        <td class="col-4">${make_nodata(total_ban_unlearned_consulting)}</td>
        <td class="col-2"><strong>${answer_rate(data.ulearned_num, total_ban_unlearned_consulting).toFixed(0)}%</strong></td>
        `);
    const color_pallete = ['green', 'purple', 'yellow', 'red', 'blue', 'orange', 'cyan', 'white']
    let temp_consulting_contents_box = `<a class="btn-two white small" onclick="consulting_history(${student_id})">상담 기록</a>
    <a class="btn-two cyan small" onclick="student_report(${student_id})">원생리포트</a>
    `;
    let temp_consulting_write_box = ''
    if(data.todoconsulting_num != 0){
        data.todoconsulting.sort((a,b)=>b.category_id - a.category_id)
        consultingGrouped = data.todoconsulting.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
        }, []);
        consultingGroupedCategory = Object.keys(consultingGrouped)
        let idx = 0;
        $.each(consultingGroupedCategory, function (index, key) {
            let target_consultings = consultingGrouped[key]
            let cate_consultings_num = target_consultings.length
            temp_consulting_write_box += `<hr class='hr-dotted'/><h3 id="target_${key}" style="margin-bottom:1.2rem;">${key} ${cate_consultings_num}건</h3>`
            for (i = 0; i < cate_consultings_num; i++) {
                let target = target_consultings[i]
                let category = target['category']
                let consulting_id = target['id']
                let contents = target['contents'].replace(/\n/g, '</br>');
                let consulting_missed = missed_date(target['missed'])
                let deadline = make_date(target['deadline'])
                let history_created = target['created_at']
                if (target['category_id'] < 100) {
                    contents = ` <details>
                    <summary style="font-size:20px;"> 미학습 기록 상세 보기 </summary>
                    <ul>${contents}
                    </ul></details>`
                    temp_consulting_write_box += `
                    <p class="mt-lg-4 mt-5">✅${category} 검사 날짜: <strong> ${make_date(target['startdate'])}</strong></p>
                    `;
                }
                let history_reason = target['reason'] == null ? '입력해주세요' : target['reason']
                let history_solution = target['solution'] == null ? '입력해주세요' : target['solution']
                temp_consulting_write_box += `
                <input type="hidden" id="target_consulting_id${idx}" value="${consulting_id}" style="display: block;" />
                <p mt-lg-4 mt-5>✅<strong>${category}</strong></br><strong>➖상담 마감일:
                ~${deadline}까지 </strong>| 부재중 : ${consulting_missed}</br></br>${contents}</p>
                <div class="modal-body-select-container">
                    <span class="modal-body-select-label">상담 사유</span>
                    <input class="modal-body" style="border-block-width:0;border-left:0;border-right:0" type="text" size="50"id="consulting_reason${consulting_id}" placeholder="${history_reason}">
                </div>
                <div class="modal-body-select-container">
                    <span class="modal-body-select-label">제공한 가이드</span>
                    <textarea class="modal-body" type="text" rows="5" cols="25"
                        id="consulting_solution${consulting_id}" placeholder="${history_solution}"></textarea> 
                </div>
                `;
                temp_consulting_write_box += `<p>상담 일시 : ${make_date(history_created)}</p> `;
                idx += 1;
            }
            temp_consulting_contents_box += `<a class="btn-two ${color_pallete[index]} small" href="#target_${key}" onclick="get_consulting_history_by_cate(event)">${key} ${cate_consultings_num}건</a>`;
        });
        temp_consulting_write_box += `
        <p class="mt-lg-4 mt-5">✔️ 상담 결과 이반 / 취소*환불 / 퇴소 요청이 있었을시 본원 문의 버튼을 통해 승인 요청을 남겨주세요</p>
        <div class="d-flex justify-content-center mt-4 mb-2" id="consulting_button_box">
            <button class="btn btn-dark"
                onclick="post_bulk_consultings(${idx},${0})"
                style="margin-right:5px">저장</button>
        </div>
        `;
        temp_consulting_contents_box += `<a class="btn-two black small" onclick="missed_consulting(${idx})">부재중</a>`;
        $('#consulting_write_box').html(temp_consulting_write_box);
    }else{
        temp_consulting_write_box += '<p>진행 할 상담이 없습니다.* 원생 목록에서 추가 상담을 진행해주세요 </p>'
        $('#consulting_write_box').html(temp_consulting_write_box);
    }
    temp_consulting_contents_box += `<a class="btn-two white small" onclick="plusconsulting(${student_id},${data.ban_id},${data.teacher_id})">상담 추가</a>`;
    $('#consulting_contents_box_cate').html(temp_consulting_contents_box)
    consulting_history(student_id)
    $('.mo_inloading').hide()
    $('.monot_inloading').show()
}
//  특정 원생의 지난 상담 상담일지 
async function consulting_history(student_id) {
    $('#student_history_record_box').show()
    $('#studentconsulting_history_box_detail').hide()
    SConsultingcontainer = $('#consultinghistory_list_pagination')
    consultinghistory_list_paginationOptions = {
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        callback: function (data, pagination) {
            var dataHtml = '';
            $.each(data, function (index, consulting) {
                let title = consulting.contents
                if (consulting.category_id < 100) {
                    title = consulting.category
                }
                dataHtml += `
                <td class="col-2"> ${consulting.category}</td>
                <td class="col-2">${make_small_char(title)}</td>
                <td class="col-2">${make_date(consulting.created_at)}</td>
                <td class="col-5"> ${make_small_char(consulting.contents)}</td>
                <td class="col-1" onclick ="get_student_history_detail(${consulting.id})"> 🔍 </td>`;
            });
            $('#consultinghistory_list').html(dataHtml);
        }
    }
    consultingStudent_target_list = Tall_consulting.filter(c => c.done == 1 && c.student_id == student_id)
    console.log(consultingStudent_target_list)
    if (consultingStudent_target_list.length > 0) {
        consultingStudent_target_list.sort((a,b)=>a.created_at-b.created_at)
        let category_set = new Set(consultingStudent_target_list.map(c => c.category));
        let category_list = [...category_set];
        var idxHtml = `<option value="none">전체</option>`;
        $.each(category_list, function (idx, val) {
          idxHtml += `<option value="${val}">${val}</option>`;
        });
        $('#consulting_history_cate').html(idxHtml);
        consultingStudent_target_list.sort(function (a, b){
            return new Date(b.created_at) - new Date(a.created_at);
        });
        SConsultingcontainer.pagination(Object.assign(consultinghistory_list_paginationOptions, { 'dataSource': consultingStudent_target_list }));
    }
}
function sort_consulting_category(category){
    SConsultingcontainer = $('#consultinghistory_list_pagination')
    if(category != 'none'){
        let copy_data = consultingStudent_target_list.slice();
        copy_data.filter((e) => {
            return e.category == category;
        })
        SConsultingcontainer.pagination(Object.assign(consultinghistory_list_paginationOptions, { 'dataSource': copy_data }));
    }else{
        SConsultingcontainer.pagination('destroy');
        SConsultingcontainer.pagination(Object.assign(consultinghistory_list_paginationOptions, { 'dataSource': consultingStudent_target_list }));
    }
}
async function get_student_history_detail(c_id){
    // 메인화면 상담일지 
    $('#student_history_record_box').hide()
    $('#studentconsulting_history_box_detail').show()
    let temp_his = ''
    let consulting_history = Tall_consulting.filter(c => c.id == c_id)[0]
    let category = `${consulting_history.category}`
    if (consulting_history.category_id < 100) {
        category = `${consulting_history.category} 상담  검사 날짜: <strong>${make_date(consulting_history.startdate)}</strong>`
    }
    temp_his = `
    <input type="hidden" name="csrf_token" value="{{ csrf_token() }}" style="display: block;" />
    <button type="button" class="btn btn-back" onclick="consulting_history(${consulting_history.student_id})">상담 목록으로 돌아가기🔙 </button>
    <p class="mt-lg-4 mt-5">✅ ${category}</p>
    <p mt-lg-4 mt-5>✅ ${consulting_history.contents.replace(/\n/g, '</br>')}</p>
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">상담 사유 수정</span>
        <input class="modal-body" style="border-block-width:0;border-left:0;border-right:0" type="text" size="50"id="consulting_reason${c_id}" placeholder="${consulting_history.reason}">
    </div>
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">제공한 가이드 수정</span>
        <textarea class="modal-body" type="text" rows="5" cols="25"
        id="consulting_solution${c_id}" placeholder="${consulting_history.solution}"></textarea> 
    </div>
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">상담 일시</span>
        <p>${make_date(consulting_history.created_at)}</p>
    </div>
    <div class="d-flex justify-content-center mt-4 mb-2" id="consulting_button_box">
        <button class="btn btn-dark"
            onclick="post_one_consulting(${c_id},${1})"
        style="margin-right:5px">수정</button>
    </div>
    `;
    $('#studentconsulting_history_box_detail').html(temp_his);
}

// 반 원생 목록 
async function get_student(ban_id) {
    $('#student_list_search_input').off('keyup');
    $('#ban_student_list_box').show();
    $('#ban_student_list_bansel_box').show()
    $('#make_plus_consulting').hide();
    $('#student_consulting_datebox').hide();
    StudentpaginationOptions  = {
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        callback: function (data, pagination) {
            $('#consulting_history_category_box').show()
            $('#ban_student_list_box').show()
            let temp_consulting_history_student_list = '';
            $.each(data, function (index, student) {
                let student_category = make_out(student.student_category)
                temp_consulting_history_student_list += `
                <td class="col-2 ${student_category}">${student.student_name}</br>${student_category}</td>
                <td class="col-1">${student.student_origin}</td>
                <td class="col-1">${student.student_birthday}</td>
                <td class="col-2">${student.student_mobileno}</td>
                <td class="col-3"> 
                    <details>
                        <summary>총 ${student.ulearned_num}건</summary>
                        <ul>
                `;
                let unlearned_consultings = student.ulconsultings
                let unlearned_cate = []
                if(unlearned_consultings){
                    unlearned_cate = [...new Set(unlearned_consultings.map(item => item.category))]; 
                    unlearned_cate.forEach((category) => {
                        let num = unlearned_consultings.filter(u=>u.category == category).length
                        temp_consulting_history_student_list += `<li>${category} : ${num}건</li>`
                    })
                }
                temp_consulting_history_student_list += `
                </ul>
                </details>
                </td>
                <td class="col-1">${student.doneconsulting_num}건</td> 
                <td class="col-2" data-bs-toggle="modal" data-bs-target="#consultinghistory" onclick="get_consulting(${student.student_id})">📝</td> 
                `;
            });
            $('#ban_student_info').html(temp_consulting_history_student_list);
        }
    }
    Studentcontainer = $('#ban_student_list_pagination')
    Targetdata = Tstudent_consulting.filter(s =>s.ban_id == ban_id)
    Targetdata.sort((a,b)=>a.student_category - b.student_category)
    $('#ban_student_listModalLabelt').html(`${Targetdata[0].ban_name}반 원생 목록`);
    Studentcontainer.pagination(Object.assign(StudentpaginationOptions, { 'dataSource': Targetdata }))
    $('input[name="is_out"]').change(function() {
        let selectedValue = $('input[name="is_out"]:checked').val();
        if(selectedValue == 'none'){
            Studentcontainer.pagination(Object.assign(StudentpaginationOptions, { 'dataSource': Targetdata }))
        }else{
            let copy_data = Targetdata.slice();
            copy_data = copy_data.filter(s =>s.is_out_student == selectedValue)
            Studentcontainer.pagination(Object.assign(StudentpaginationOptions, { 'dataSource': copy_data }))
        }
    });
    $('#student_list_search_input').on('keyup', function () {
        var searchInput = $(this).val().toLowerCase();
        var filteredData = Targetdata.filter(function (d) {
            return ((d.hasOwnProperty('student_name') && d.student_name.toLowerCase().indexOf(searchInput) !== -1 )|| (d.hasOwnProperty('student_origin') && d.student_origin.toLowerCase().indexOf(searchInput) !== -1));
        });
        Studentcontainer.pagination('destroy');
        Studentcontainer.pagination(Object.assign(StudentpaginationOptions, { 'dataSource': filteredData }));
    });
}
function cancel_back() {
    $('#make_plus_consulting').hide();
}
function sort_option(sortBy) {
    switch (sortBy){
        case "name_desc":
            $('#ban_sort').html('<strong>원생 (이름순 정렬👇)</strong>')
            $('#uconsulting_sort').html('미학습 (미학습 건 정렬👉)')    
            $('#dconsulting_sort').html('진행상담 (상담 건 정렬👉)')   
        Targetdata.sort(function (a, b) {     
            var nameA = a.student_name.toUpperCase(); // 대소문자 구분 없이 비교하기 위해 대문자로 변환
            var nameB = b.student_name.toUpperCase(); // 대소문자 구분 없이 비교하기 위해 대문자로 변환
            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }
            return 0;
        });
        break;
    
        case "ul_desc":
            $('#ban_sort').html('원생 (이름순 정렬👉)')
            $('#uconsulting_sort').html('<strong>미학습 (미학습 건 정렬👇)</strong>')    
            $('#dconsulting_sort').html('진행상담 (상담 건 정렬👉)')   
        Targetdata.sort(function (a, b) {
            return b.ulearned_num - a.ulearned_num;
        });
        break;
    
        case "consulting_desc":
            $('#ban_sort').html('원생 (이름순 정렬👉)')
            $('#uconsulting_sort').html('미학습 (미학습 건 정렬👉)')    
            $('#dconsulting_sort').html('<strong>진행상담 (상담 건 정렬👇)</strong>')   
        Targetdata.sort(function (a, b) {
            return b.doneconsulting_num - a.doneconsulting_num;
        });
        break;
    }
  
    // 데이터 정렬 후 페이지네이션 다시 설정
    Studentcontainer.pagination("destroy");
    Studentcontainer.pagination(
      Object.assign(StudentpaginationOptions, { dataSource: Targetdata })
    );
}

function plusconsulting(s_id, b_id, t_id) {
    $('#make_plus_consulting').show();
    let temp_button = `
    <button class="btn btn-dark" onclick=plusconsulting_history(${s_id},${b_id},${t_id})>저장</button>
    <button class="btn btn-dark" onclick=cancel_back()>추가 취소</button>
    `;
    $('#plusconsulting_button_box').html(temp_button)
}
function plusconsulting_history(student_id, b_id, t_id) {
    const student_info = Tall_students.filter(a=>a.student_id == student_id)[0]
    const consulting_category = $('#consulting_cate').val()
    const consulting_contents = $('#plus_consulting_contents').val()
    const consulting_reason = $('#plus_consulting_reason').val()
    const consulting_solution = $('#plus_consulting_solution').val()
    if(consulting_category == 0){
        alert('상담 종류를 선택해주세요')
        return
    }
    $.ajax({
        type: "POST",
        url: '/teacher/plus_consulting/' + student_id + '/' + b_id + '/' + t_id + '/' ,
        // data: JSON.stringify(jsonData), // String -> json 형태로 변환
        data: {
            student_name : student_info['name'],
            student_engname : student_info['nick_name'],
            origin : student_info['origin'],
            consulting_category: consulting_category,
            consulting_contents: consulting_contents,
            consulting_reason: consulting_reason,
            consulting_solution: consulting_solution
        },
        success: function (response) {
            {
                alert(response["result"])
            }
        }
    })
}
function sort_consultingoption(sortBy) {
    switch (sortBy) {
        case "ban_desc":
        $('#ban_name_sort').html('<strong>반 이름순 정렬👇</strong>')
        $('#student_name_sort').html('원생 이름순 정렬👉')    
        $('#deadline_sort').html('마감일 정렬👉')    
        $('#consulting_sort').html('상담 건 정렬👉')        
        consulting_targetdata.sort(function (a, b) {
            var nameA = a.ban_name.toUpperCase(); // 대소문자 구분 없이 비교하기 위해 대문자로 변환
            var nameB = b.ban_name.toUpperCase(); // 대소문자 구분 없이 비교하기 위해 대문자로 변환
            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }
            return 0;
        });
        break;
        case "name_desc":
            $('#ban_name_sort').html('반 이름순 정렬👉')
            $('#student_name_sort').html('<strong>원생 이름순 정렬👇</strong>')    
            $('#deadline_sort').html('마감일 정렬👉')    
            $('#consulting_sort').html('상담 건 정렬👉')        
        consulting_targetdata.sort(function (a, b) {
            var nameA = a.student_name.toUpperCase(); // 대소문자 구분 없이 비교하기 위해 대문자로 변환
            var nameB = b.student_name.toUpperCase(); // 대소문자 구분 없이 비교하기 위해 대문자로 변환
            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }
            return 0;
        });
        break;
    
        case "deadline_desc":
            $('#ban_name_sort').html('반 이름순 정렬👉')
            $('#student_name_sort').html('원생 이름순 정렬👉')    
            $('#deadline_sort').html('<strong>마감일 정렬👇</strong>')    
            $('#consulting_sort').html('상담 건 정렬👉')        
        consulting_targetdata.sort(function (a, b) {
            return new Date(a.deadline) - new Date(b.deadline);
        });
        break;
    
        case "consulting_desc":
            $('#ban_name_sort').html('반 이름순 정렬👉')
            $('#student_name_sort').html('원생 이름순 정렬👉')    
            $('#deadline_sort').html('마감일 정렬👉')    
            $('#consulting_sort').html('<strong>상담 건 정렬👇</strong>') 
        consulting_targetdata.sort(function (a, b) {
            return b.todoconsulting_num - a.todoconsulting_num;
        });
        break;
    }
  
    // 데이터 정렬 후 페이지네이션 다시 설정
    Consultingcontainer.pagination("destroy");
    Consultingcontainer.pagination(
      Object.assign(ConsultingpaginationOptions, { dataSource: consulting_targetdata })
    );
}

// 상담일지 카테고리 이동 함수 
function get_consulting_history_by_cate(category) {
    // 전체 상담 
    var target = $(category.target.getAttribute('href'));
    if (target.length) {
        category.preventDefault();
        $('html, body').animate({
            scrollTop: target.offset().top
        }, 1000);
    }
}

//  지난 상담 상담일지 
async function get_consulting_history() {
    console.log(Tmy_students)
    $('#consulting_history_bansel_box').show()
    $('#consulting_history_box').show()
    $('#consulting_history_box_detail').hide()
    $('#consulting_list_search_input').off('keyup');
    let container = $('#consulting_history_student_list_pagination')
    CpaginationOptions = {
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        callback: function (data, pagination) {
            var dataHtml = '';
            $.each(data, function (index, consulting) {
                student_info = Tall_students.filter(s => s.student_id == consulting.student_id)[0]
                student_category = make_out(student_info.category_id)
                consulting.student_name = student_info.name + '( ' + student_info.nick_name + ' )'
                consulting.origin = student_info.origin
                consulting.ban_name = student_info.classname
                let title =make_small_char(consulting.contents)
                if (consulting.category_id < 100) {
                    title = consulting.category
                }
                dataHtml += `
                <td class="col-2"> ${consulting.category}</td>
                <td class="col-2">${title}</td>
                <td class="col-2">${make_date(consulting.created_at)}</td>
                <td class="col-2"> ${consulting.ban_name}</td>
                <td class="col-2 ${student_category}"> ${consulting.student_name}</br>${student_category}</td>
                `
                dataHtml +=`
                <td class="col-1"> ${consulting.origin}</td>
                <td class="col-1" onclick ="get_consulting_history_detail(${consulting.id})"> 🔍 </td>`;
            });
            $('#consulting_history_student_list').html(dataHtml);
        }
    }
    const target_list = Tall_consulting.filter(c => c.done == 1)
    const updateSearchResult = function () {
        let copy_data = target_list.slice();
        const selectedCategory = $('#history_cate').val();
        const searchInput = $('#consulting_list_search_input').val().toLowerCase();
        if(selectedCategory != 'none' && searchInput ==""){
            copy_data = target_list.filter((e) => {
                return e.category == selectedCategory;
            })
            container.pagination('destroy');
            container.pagination(Object.assign(CpaginationOptions, { 'dataSource': copy_data }));
        }else if(selectedCategory != 'none' && searchInput !=""){
            copy_data = target_list.filter(function (d) {
                return (
                  (d.category == selectedCategory) &&
                  (d.hasOwnProperty('student_name') && d.student_name.toLowerCase().indexOf(searchInput) !== -1) ||
                  (d.hasOwnProperty('origin') && d.origin.toLowerCase().indexOf(searchInput) !== -1) ||
                  (d.hasOwnProperty('ban_name') && d.ban_name.toLowerCase().indexOf(searchInput) !== -1)
                );
            })
            container.pagination('destroy');
            container.pagination(Object.assign(CpaginationOptions, { 'dataSource': copy_data }));
        }else if(selectedCategory == 'none' && searchInput !=""){
            copy_data = target_list.filter(function (d) {
                return (
                  (d.hasOwnProperty('student_name') && d.student_name.toLowerCase().indexOf(searchInput) !== -1) ||
                  (d.hasOwnProperty('origin') && d.origin.toLowerCase().indexOf(searchInput) !== -1) ||
                  (d.hasOwnProperty('ban_name') && d.ban_name.toLowerCase().indexOf(searchInput) !== -1)
                );
            })
            container.pagination('destroy');
            container.pagination(Object.assign(CpaginationOptions, { 'dataSource': copy_data }));
        }else{
            container.pagination('destroy');
            container.pagination(Object.assign(CpaginationOptions, { 'dataSource': target_list }));
        }
    };
    if (target_list.length > 0) {
        let category_set = new Set(target_list.map(c => c.category));
        let category_list = [...category_set];
        var idxHtml = `<option value="none">전체</option>`;
        $.each(category_list, function (idx, val) {
          idxHtml += `<option value="${val}">${val}</option>`;
        });
        $('#history_cate').html(idxHtml);
        $('#history_cate, #consulting_list_search_input').on('change keyup', updateSearchResult);
        target_list.sort(function (a, b) {
            return new Date(b.created_at) - new Date(a.created_at);
        });
        container.pagination(Object.assign(CpaginationOptions, { 'dataSource': target_list }));
    }
}
async function get_consulting_history_detail(c_id) {
    $('#consulting_history_bansel_box').hide()
    $('#consulting_history_box').hide()
    $('#consulting_history_box_detail').show()
    let temp_his = ''
    let consulting_history = Tall_consulting.filter(c => c.id == c_id)[0]
    let category = `${consulting_history.category}`
    if (consulting_history.category_id < 100) {
        category = `${consulting_history.category} 상담  검사 날짜: <strong>${make_date(consulting_history.startdate)}</strong>`
    }
    temp_his = `
    <button type="button" class="btn btn-back" onclick="get_consulting_history()">상담 목록으로 돌아가기🔙 </button>
    <p class="mt-lg-4 mt-5">✅ ${category}</p>
    <p mt-lg-4 mt-5>✅ ${consulting_history.contents.replace(/\n/g, '</br>')}</p>
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">상담 사유 수정</span>
        <input class="modal-body" style="border-block-width:0;border-left:0;border-right:0" type="text" size="50"id="consulting_reason${c_id}" placeholder="${consulting_history.reason}">
    </div>
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">제공한 가이드 수정</span>
        <textarea class="modal-body" type="text" rows="5" cols="25"
        id="consulting_solution${c_id}" placeholder="${consulting_history.solution}"></textarea> 
    </div>
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">상담 일시</span>
        <p>${make_date(consulting_history.created_at)}</p>
    </div>
    <div class="d-flex justify-content-center mt-4 mb-2" id="consulting_button_box">
        <button class="btn btn-dark"
            onclick="post_one_consulting(${c_id},${1})"
        style="margin-right:5px">수정</button>
    </div>
    `;
    $('#consulting_history_box_detail').html(temp_his);
}
// 부재중 처리
async function missed_consulting(c_length) {
    const csrf = $('#csrf_token').val();
    var con_val = confirm('부재중 처리 하시겠습니까?')
    if (con_val == true) {
        for (i = 0; i < c_length; i++) {
            target = $('#target_consulting_id' + i).val()
            post_missed_consulting(target)
        }
        alert('부재중 처리 되었습니다')
        window.location.reload()
    }
}
function post_missed_consulting(consulting) {
    $.ajax({
        type: "POST",
        url: '/teacher/consulting_missed/' + consulting,
        // data: JSON.stringify(jsonData), // String -> json 형태로 변환
        data: {
        }, success: function (response) {
            if (response['result'] == '완료') {
            } else {
                alert("상담일지 저장 실패")
            }
        }
    })
}
function post_bulk_consultings(c_length,is_done) {
    for (i = 0; i < c_length; i++) {
        target = $('#target_consulting_id' + i).val()
        post_target_consulting(target, is_done)
    }
    alert("상담 저장 완료")
    window.location.reload()
}
async function post_one_consulting(consulting, is_done) {
    consulting_reason = $('#consulting_reason' + consulting).val()
    consulting_solution = $('#consulting_solution' + consulting).val()
    if (!consulting_reason || consulting_reason.length == 0) {
        consulting_reason = "작성 내역이 없습니다"
    }
    if (!consulting_solution || consulting_solution.length == 0) {
        consulting_solution = "작성 내역이 없습니다"
    }

    const csrf = $('#csrf_token').val();
    var con_val = confirm('정말 수정하시겠습니까?')
    if (con_val == true) {
        await $.ajax({
            type: "POST",
            url: '/teacher/consulting_history/' + consulting + '/' + is_done,
            // data: JSON.stringify(jsonData), // String -> json 형태로 변환
            data: {
                consulting_reason: consulting_reason,
                consulting_solution: consulting_solution
            }, success: function (response) {
                if (response['result'] == '완료') {
                    alert("상담일지 수정 완료")
                    get_consulting_history()
                } else {
                    alert("상담일지 수정 실패")
                }
            }
        })
    }
}
function post_target_consulting(consulting, is_done) {
    consulting_reason = $('#consulting_reason' + consulting).val()
    consulting_solution = $('#consulting_solution' + consulting).val()
    console.log(consulting_reason)
    console.log(consulting_solution)
    if (!consulting_reason || consulting_reason.length == 0) {
        consulting_reason = "작성 내역이 없습니다"
    }
    if (!consulting_solution || consulting_solution.length == 0) {
        consulting_solution = "작성 내역이 없습니다"
    }
    $.ajax({
        type: "POST",
        url: '/teacher/consulting_history/' + consulting + '/' + is_done,
        // data: JSON.stringify(jsonData), // String -> json 형태로 변환
        data: {
            consulting_reason: consulting_reason,
            consulting_solution: consulting_solution
        }, success: function (response) {
            if (response['result'] == '완료') {
            } else {
                alert("상담일지 저장 실패")
            }
        }
    })
}

// 업무 완료 
function get_update_done() {
    $('input:checkbox[name=taskid]').each(function (index) {
        if ($(this).is(":checked") == true) {
            return update_done($(this).val())
        }
    });
    window.location.replace('/teacher')
}
function update_done(target) {
    $.ajax({
        type: "POST",
        url: '/teacher/task/' + target,
        // data: JSON.stringify(jsonData), // String -> json 형태로 변환
        data: {},
        success: function (response) {
            if (response['result'] == '완료') {
            } else {
                alert(response["result"])
            }
        }
    })
}

// 본원 문의 기능 
function change_question_kind(str) {
    $('#student_list').empty()
    $('#student_list_so').empty()
    if (str == "none") {
        $('#question_topurple').hide()
    } else if (str == 0 || str == 4 || str == 5) {
        let question_html = `
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">대상 원생</span>
            <select id="student_list" class="modal-body-select" name="target_student">
                <option value=0 selected>특정 원생 선택하지 않기</option>
                <optgroup class="selstulist" label="원생 선택" multiple>
                </optgroup>
            </select>
        </div>
        `;
        $('#question_box').html(question_html);
        $('#question_topurple').show()
    } else {
        let question_html = `
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">대상 원생</span>
            <select id="student_list_so" class="modal-body-select" onchange="attach_consulting_history(this.value)">
                <option value="none" selected>대상 원생을 선택 해 주세요</option>
                <optgroup class="selstulist" label="원생 선택" multiple>
                </optgroup>
            </select>
        </div>
        <p class="error_msg_alert" id="error_msg_stusel"> 🔻 대상 원생 선택은 필수 입니다 </p>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">상담 내용</span>
            <select class="modal-body-select" name="consulting_history" id="h_select_box">
            </select>
        </div>
        <p class="error_msg_alert" id="error_msg_consel"> 🔻 상담일지 첨부는 필수 입니다 </p>
        `;
        $('#question_box').html(question_html);
        $('#question_topurple').show()
    }
}
function get_ban_student(ban_id) {
    const data = Tmy_students.filter((e) => {
        return e.ban_id == ban_id;
    })
    if (data.length == 0) {
        let temp_target_student = '<option value="none" selected>반 원생이 없습니다.</option>';
        $('#student_list').html(temp_target_student)
    } else {
        let temp_target_student = '';
        // ㄱㄴㄷㄹ 순 정렬 
        data.sort(function (a, b) {
            var nameA = a.name.toUpperCase(); // 대소문자 구분 없이 비교하기 위해 대문자로 변환
            var nameB = b.name.toUpperCase(); // 대소문자 구분 없이 비교하기 위해 대문자로 변환
            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }
            return 0;
        })

        $.each(data, function (index, student) {
            temp_target_student += `
            <option value="${student.student_id}"> ${student.name} (${student.nick_name}) *${student.origin}</option>
            `;
        });
        $('.selstulist').html(temp_target_student)

        if(ban_id == "none"){
            $('#error_msg_bansel').show()
        }else{
            $('#error_msg_bansel').hide()
        }
    }
}
// 상담일지 첨부 
function attach_consulting_history(student_id) {
    const consultinglist = Tstudent_consulting.filter((e) => {
        return e.student_id == student_id && e.doneconsulting_num != 0;
    })[0]['doneconsulting']
    let temp_h_select = ''
    if (consultinglist.length <= 0) {
        alert('상담을 우선 진행해주세요  원생목록 👉 해당 원생 상담추가');
        temp_h_select = '<option value="none" selected>상담을 우선 진행해주세요  원생목록 👉 해당 원생 상담추가</option>'
    }else{
        temp_h_select = '<option value="none" selected>상담을 선택해주세요</option>'
        $.each(consultinglist, function (index, consulting) {
            let category = ''
            if (consulting.category_id < 100) {
                category = `${consulting.category}상담`
            } else {
                category = `${consulting.category} ${consulting.contents}`
            }
            temp_h_select += `
            <option value="${consulting.id}"> ${category} - 제공한 가이드: ${consulting.solution}</option>
            `;
        });
    }
    $('#h_select_box').html(temp_h_select)

    if( student_id == "none"){
        $('#error_msg_stusel').show()
    }else{
        $('#error_msg_bansel').hide()
        $('#error_msg_stusel').hide()
    }

}

// 문의 저장 
function question_save(){
    // 파일 저장 처리 
    const formData = new FormData();
    const fileInput = document.getElementById('file-upload');
    const files = fileInput.files;
    const files_length = files.length;
    if(files_length > 3){
        $('#error_msg_filesel').show()
        return;
    }
    console.log(files)
    for (let i = 0; i < files_length; i++) {
        formData.append('file_upload', files[i]);
    }
    const q_kind = $('#question_kind').val()
    const question_title = $('#question_title').val()
    const question_contents = $('#question_contents').val()
    const teacher_mobileno = $('#teacher_mobileno').val()
    const teacher_name = $('#teacher_name').val()
    const teacher_engname = $('#teacher_engname').val()
    const my_ban_list = $('#my_ban_list').val()
    
    
    formData.append('question_category', q_kind);
    formData.append('question_title', question_title);
    formData.append('question_contents', question_contents);
    formData.append('teacher_mobileno', teacher_mobileno);
    formData.append('teacher_name', teacher_name);
    formData.append('teacher_engname', teacher_engname);
    formData.append('my_ban_list', my_ban_list);
    
    if(q_kind == 1 || q_kind == 2 ){
        const student_list = $('#student_list_so').val()
        const h_select_box = $('#h_select_box').val()
        if(my_ban_list == "none" || student_list == "none" || h_select_box == "none" ){
            $('#error_msg_bansel').show()
            $('#error_msg_stusel').show()
            $('#error_msg_consel').show()
        }else{
            formData.append('student_list', student_list);
            formData.append('h_select_box', h_select_box);
            $('#error_msg_bansel').hide()
            $('#error_msg_stusel').hide()
            $('#error_msg_consel').hide()
            $.ajax({
                type: "POST",
                url: '/teacher/question',
                // data: JSON.stringify(jsonData), // String -> json 형태로 변환
                data:formData,
                processData: false,
                contentType: false,
                success: function (response) {
                    {
                        if(response["result"]=="완료"){
                            alert("문의 저장 완료")
                            window.location.reload()
                        }else{
                            alert("문의 저장에 실패했습니다")
                        }
                    }
                }
            })

        } 
    }else{
        if(my_ban_list == "none"){
            $('#error_msg_bansel').show()
        }else{
            const student_list = $('#student_list').val()
            formData.append('student_list', student_list);
            $.ajax({
                type: "POST",
                url: '/teacher/question',
                // data: JSON.stringify(jsonData), // String -> json 형태로 변환
                data:formData,
                processData: false,
                contentType: false,
                success: function (response) {
                    {
                        if(response["result"]=="완료"){
                            alert("문의 저장 완료")
                            window.location.reload()
                        }else{
                            alert("문의 저장에 실패했습니다")
                        }
                    }
                }
            })

        } 

    }
}

// 문의 리스트
async function get_question_list() {
    $('#q_title_msg').hide();
    $('#questiondetail').hide();
    $('.Tinloading').show()
    $('.t_notinloading').hide()
    $('#question_pagination').show()
    if (!TquestionAnswerdata) {
        await get_teacher_question().then(() => {
            $('.Tinloading').hide()
            $('.t_notinloading').show()
        })
    }
    let container = $('#question_pagination')
    $('.Tinloading').hide()
    $('.t_notinloading').show()
    if (TquestionAnswerdata.length > 0) {
        $('#questionlist').show()
        $('#question_pagination').show()
        TquestionAnswerdata.sort(function (a, b) {
            return new Date(b.create_date) - new Date(a.create_date);
        });
        container.pagination({
            dataSource: TquestionAnswerdata,
            prevText: '이전',
            nextText: '다음',
            pageClassName: 'float-end',
            pageSize: 10,
            callback: function (TquestionAnswerdata, pagination) {
                var dataHtml = '';
                $.each(TquestionAnswerdata, function (index, item) {
                    let done_code = ''
                    if (item.answer == 0) { 
                        done_code = '미응답' 
                    }else{
                         done_code = item.answer_data.created_at + '에 응답' 
                    }
                    dataHtml += `
                    <td class="col-2">${q_category(item.category)}</td>
                    <td class="col-4">${item.title}</td>
                    <td class="col-3"> ${done_code} </td>
                    <td class="col-2"> ${make_date(item.create_date)} </td>
                    <td class="col-1" onclick="get_question_detail(${item.id})"> <span class="cursor-pointer">🔍</span> </td>
                    `;
                });
                $('#teacher_question_list').html(dataHtml);
            }
        })
    } else {
        $('#questionlist').hide()
        $('#question_pagination').hide()
        $('#q_title_msg').show();
    }
}
// 문의 내용 상세보기
async function get_question_detail(q_id) {
    $('#questionlist').hide()
    $('#question_pagination').hide()
    $('#questiondetail').show()
    questiondata = TquestionAnswerdata.filter(q => q.id == q_id)[0]
    let temp_question_list = `
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">문의 종류</span>
        <p>${q_category(questiondata.category)}</p>
    </div>
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">제목</span>
        <p>${questiondata.title}</p>
    </div>
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">내용</span>
        <p>${questiondata.contents}</p>
    </div>
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">작성일</span>
        <p>${questiondata.create_date}</p>
    </div>`
    if(questiondata.student_id != 0){
        ban_student_data = Tall_students.filter(s => s.student_id == questiondata.student_id)[0]
        temp_question_list+=`
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">대상 반 | 학생</span>
            <p>${ban_student_data.classname} ➖ ${ban_student_data.name} (${ban_student_data.nick_name}:${ban_student_data.origin})</p>
        </div>`
    }else{
        ban_student_data = Tban_data.filter(b=>b.register_no == questiondata.ban_id)[0]
        temp_question_list+=`
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">대상 반 | 학생</span>
            <p>${ban_student_data.name} ➖ "특정 원생 선택하지 않음"</p>
        </div>`
    }
    temp_question_list+=`
    <div class="modal-body-select-container">
    <span class="modal-body-select-label">첨부파일</span>
    <div class="make_col">
    `
    if(questiondata.attach != "없음"){
        questiondata.attach.forEach((a)=>{
            temp_question_list += `<a href="/common/downloadfile/question/${q_id}/attachment/${a.id}" download="${a.file_name}">${a.file_name}</a>`;
        })
    }else{
        temp_question_list +='➖'
    }
    temp_question_list += `</div></div>`;
    $('#teacher_question').html(temp_question_list);
    // 상담 일지 처리 
    if (questiondata.category == 0 || questiondata.category == 4 || questiondata.category == 5) {
        $('#consulting_history_attach').hide()
    } else {
        $('#consulting_history_attach').show()
        consulting_history = Tall_consulting.filter(c => c.id == questiondata.consluting)[0]
        let temp_his = `상담 기록이 없습니다`
        if(consulting_history != undefined){
            let category = ''
            if (consulting_history.category_id < 100) {
                category = `${consulting_history.category}상담`
            } else {
                category = `${consulting_history.category} ${consulting_history.contents}`
            }
            temp_his = `
            <div class="modal-body-select-container">
                <span class="modal-body-select-label">상담 종류</span>
                <p>${category}</p>
            </div>
            <div class="modal-body-select-container">
                <span class="modal-body-select-label">상담 사유</span>
                <p>${consulting_history.reason}</p>
            </div>
            <div class="modal-body-select-container">
                <span class="modal-body-select-label">제공한 가이드</span>
                <p>${consulting_history.solution}</p>
            </div>
            <div class="modal-body-select-container">
                <span class="modal-body-select-label">상담 일시</span>
                <p>${make_date(consulting_history.created_at)}</p>
            </div>
            `;
        }
        $('#cha').html(temp_his);
    }
    let temp_answer_list = ''
    // 응답 처리 
    if (questiondata.answer == 0) {
        temp_answer_list = `
        <div class="modal-body-select-container">
        <span class="modal-body-select-label">응답</span>
        <p>미응답</p>
        </div>`;
    } else {
        temp_answer_list = `
        <div class="modal-body-select-container">
        <span class="modal-body-select-label">응답</span>
        <p>${questiondata.answer_data.content}</p>
        </div>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">응답일</span>
            <p>${questiondata.answer_data.created_at}</p>
        </div>`;
        if (questiondata.category == 1 || questiondata.category == 2) {
            temp_answer_list += `<div class="modal-body-select-container">
           <span class="modal-body-select-label">처리</span>
           <p>${make_answer_code(questiondata.answer_data.reject_code)}</p>
           </div>`
        }
    }
    $('#teacher_answer').html(temp_answer_list);

}
