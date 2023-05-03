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
    try{
        response = await $.ajax({
            type: "GET",
            url: "/teacher/get_data",
            dataType: 'json',
            data: {}
        })
        get_data()
    }catch{
        console.log('err')
    }
})
async function get_data(){
    // try{
    //     let response = await $.ajax({
    //         type: "GET",
    //         url: "/teacher/get_data",
    //         dataType: 'json',
    //         data: {}
    //     })
        mybansData = response['ban_data']
        mytasksData = response['all_task']
        allStudentData = response['my_students']
        allConsultingData = response['all_consulting']
        switchstudentData = response['switchstudent']

        myStudentData = allStudentData.filter(s => s.category_id != 2)
        allconsultingsNum = allConsultingData.length
        UnlearnedConsultingsData = allconsultingsNum > 0 ? allConsultingData.filter(consulting => consulting.category_id < 100) : 0;
        UnlearnedConsultingsNum = UnlearnedConsultingsData.length
        
        $('#ban_chart_list').empty()
        let temp_ban_option = '<option value="none" selected>반을 선택해주세요</option>';
        mybansData.forEach((elem) => {
            let semester = make_semester(elem.semester)
            temp_ban_option += `<option value=${elem.register_no}>${elem.name} (${semester}월 학기)</option>`;
            let switch_minus_num = switchstudentData.length > 0 ? switchstudentData.filter(a => a.ban_id == elem.register_no).length : 0;
            let switch_plus_num = switchstudentData.length > 0 ? switchstudentData.filter(a => a.switch_ban_id == elem.register_no).length : 0;
            let now_student_num = elem.first_student_num - elem.out_student_num
            // let outstudent = response['outstudent'].length > 0 ? response['outstudent'].filter(a=> a.ban_id === register_no).length : 0;
            let ban_unlearned = UnlearnedConsultingsNum > 0 ? UnlearnedConsultingsData.filter(consulting => consulting.ban_id === elem.register_no) : 0;
            let ban_unlearned_num = ban_unlearned.length;

            let temp_ban_chart = `
            <div class="d-flex justify-content-start align-items-start flex-column w-100 my-2">
                <h5 class="mb-3">📌  ${elem.name} (${semester}월 학기)</h5>
                <div class="row w-100">
                    <div class="chart-wrapper col-sm-5">
                        <canvas id="total-chart-element${elem.register_no}" class="total-chart-element p-sm-3 p-2"></canvas>
                        <div class ="chart-data-summary">
                            <span>관리중:${now_student_num}</span><br>
                            <span>* 이반:${switch_minus_num} 보류:${elem.hold_student_num}</span><br>
                            <span>* 퇴소:${elem.out_student_num}</span>
                        </div>
                    </div>
                    <div class="col-sm-7 d-flex justify-content-center align-items-center">
                        <table class="table text-center" id="class_list">
                            <tbody style="width:100%;">
                                <tr class="row">
                                    <th class="col-12" data-bs-toggle="modal" data-bs-target="#ban_student_list" onclick="get_student(${elem.register_no})">${elem.name}반  원생 목록  ✔️</th>
                                </tr>
                                <tr class="row">
                                <th class="col-12"> 
                                <details>
                                    <summary>총 미학습 ${ban_unlearned_num}건  (${answer_rate(ban_unlearned_num, UnlearnedConsultingsNum).toFixed(0)}%)</summary>
                                    <ul>
                                    `
            let unlearned_cate = [...new Set(ban_unlearned.map(item => item.category))];
            unlearned_cate.forEach((category) => {
                let num = ban_unlearned.filter(u=>u.category == category).length
                temp_ban_chart += `
                <li>
                ${category} : ${num}건(${answer_rate(num, ban_unlearned_num).toFixed(0)}%)
                </li>
                `
            })
            temp_ban_chart += `
                        </ul>
                    </details>
                    </th>
                </tr>
                </tbody>
                </table>
                    </div>
                </div>
            </div>
            `;
            $('#ban_chart_list').append(temp_ban_chart);
            new Chart($((`#total-chart-element${elem.register_no}`)), {
                type: 'doughnut',
                data: {
                    labels: ['관리중', '이반', '퇴소'],
                    datasets: [
                        {
                            data: [now_student_num, switch_minus_num, elem.out_student_num, elem.hold_student_num],
                            backgroundColor: ['#B39CD0', '#ffd400', '#F23966','#C24F77'],
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
        });
        // 본원 문의 ban선택 옵션 같이 붙이기 
        $('#my_ban_list').html(temp_ban_option)
    
        let consulting_done = allconsultingsNum != 0 ? allConsultingData.filter(consulting => consulting.done === 1).length : 0
        let total_task = mytasksData.length
        let task_done = total_task > 0 ? mytasksData.filter(task => task.done != 0 && new Date(task.created_at).setHours(0, 0, 0, 0) == today).length : 0;
        let task_notdone = total_task - task_done;
        let temp_report = ''
        if (total_task == 0) {
            temp_report += `
            <td class="col-3">오늘의 업무가 없습니다</td>
            <td class="col-3">➖</td>
            `;
    
            $('#task_title').html('오늘의 업무 0건');
            $('#cate_menu').html('<p>오늘의 업무가 없습니다</p>');
            $('#task_button').hide();
        } else {
            temp_report += `
            <td class="col-3"> ${task_done}/${total_task} </td>
            <td class="col-3"> ( ${answer_rate(task_done, total_task).toFixed(0)}% ) </td>
            `;
    
            if (task_notdone == 0) {
                $('#task_title').html('오늘의 업무 끝 😆');
                $('#task_button').hide();
            } else {
                $('#task_title').html('오늘의 업무 ' + task_notdone + '건');
                $('#task_button').show();
            }
            // 오늘의 업무 뿌려주기 
            // 오늘의 업무 중복 카테고리로 묶기 
            const categoryGrouped = mytasksData.reduce((acc, item) => {
                if (!acc[item.category]) {
                    acc[item.category] = [];
                }
                acc[item.category].push(item);
                return acc;
            }, []);
            taskGroupedCategory = Object.keys(categoryGrouped)
    
            // 결과를 객체의 배열로 변환
            // const categoryGroupedresult = Object.entries(categoryGrouped).map(([category, items]) => {
            //     return { [category]: items };
            // });
    
            let temp_cate_menu = ''
            $.each(taskGroupedCategory, function (index, category) {
                temp_cate_menu += `
                <thead  style="background-color:#ffc107;">
                    <tr class="row">
                    <th class="col-2">< 업무순서</th>
                    <th class="col-8">${category}업무</th>
                    <th class="col-2">마감일 ></th>
                    </tr>
                </thead>
                <tbody style="width:100%;">  
                `;
                target_tasks = categoryGrouped[category]
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
                        <td class="col-2">${make_priority(contents[0])}</td>
                        <td class="col-8">${contents[1]}</td>
                        <td class="col-2">${make_date(contents[2])}</td>
                    </tr>
                    <td class="col-12">`;
                    $.each(contentsGrouped[key], function (index, ban) {
                        const ban_name = mybansData.filter(a => a.register_no === ban.ban_id)[0]
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
        temp_report += `
        <td class="col-3"> ${consulting_done}/${allconsultingsNum} </td>
        <td class="col-3"> ( ${answer_rate(consulting_done, allconsultingsNum).toFixed(0)}% ) </td>
        `;
        $('#classreport').html(temp_report)
        
        // 상담 목록 
        let result = myStudentData.reduce((acc, student) => {
            const consultingList = allConsultingData.filter(c => c.student_id === student.register_no);
            const unlearned_num = consultingList.filter(u=>u.category_id < 100).length;
            if (consultingList.length > 0) {
                const todoconsulting = consultingList.filter(c => c.done == 0)
                if (todoconsulting.length > 0) {
                    const deadline = todoconsulting.reduce((prev, current) => {
                        let prevDueDate = new Date(prev.deadline).setHours(0, 0, 0, 0);
                        let currentDueDate = new Date(current.deadline).setHours(0, 0, 0, 0);
                        return currentDueDate < prevDueDate ? current : prev;
                    }, todoconsulting[0]);
                    const missed = todoconsulting.reduce((prev, current) => {
                        let prevDueDate = new Date(prev.missed).setHours(0, 0, 0, 0);
                        let currentDueDate = new Date(current.missed).setHours(0, 0, 0, 0);
                        return currentDueDate < prevDueDate ? prev : current;
                    }, todoconsulting[0]);
    
                    acc.push({
                        'teacher_id': student.id,
                        'student_id': student.register_no,
                        'student_origin': student.origin,
                        'student_name': student.name + '(' + student.nick_name + ')',
                        'student_mobileno': student.mobileno,
                        'student_birthday': student.birthday,
                        'ban_id': student.ban_id,
                        'ban_name': student.classname,
                        'consulting_num': todoconsulting.length,
                        'done_consulting_num': consultingList.length - todoconsulting.length,
                        'deadline': make_date(deadline.deadline),
                        'missed': missed_date(missed.missed),
                        'consulting_list': consultingList,
                        'unlearned_num':unlearned_num
                    });
                } else {
                    acc.push({
                        'teacher_id': student.id,
                        'student_id': student.register_no,
                        'student_origin': student.origin,
                        'student_name': student.name + '(' + student.nick_name + ')',
                        'student_mobileno': student.mobileno,
                        'student_birthday': student.birthday,
                        'ban_id': student.ban_id,
                        'ban_name': student.classname,
                        'consulting_num': 0,
                        'done_consulting_num': consultingList.length,
                        'deadline': make_date('3000-01-01'),
                        'missed': missed_date('1111-01-01'),
                        'consulting_list': consultingList,
                        'unlearned_num':unlearned_num
                    });
                }
            } else {
                acc.push({
                    'teacher_id': student.id,
                    'student_id': student.register_no,
                    'student_origin': student.origin,
                    'student_name': student.name + '(' + student.nick_name + ')',
                    'student_mobileno': student.mobileno,
                    'student_birthday': student.birthday,
                    'ban_id': student.ban_id,
                    'ban_name': student.classname,
                    'consulting_num': 0,
                    'done_consulting_num': 0,
                    'deadline': make_date('3000-01-01'),
                    'missed': missed_date('1111-01-01'),
                    'consulting_list': [],
                    'unlearned_num':unlearned_num
                });
            }
            return acc;
        }, []);
        if (result.length > 0) {
            consultingStudentData = result
            get_consulting_student(0)
        } else {
            $('#today_consulting_title').html($('#today_consulting_title').html() + '   0건');
            $('#consulting_student_list').hide();
            $('#consultingstudent_pagination').hide();
        }
    // }catch{
    //     console.log('err')
    // }
}
function go_back() {
    // 문의 관련 
    $('#questiondetail').hide();
    $('#questionlist').show();
    $('#question_pagination').show()
    // 원생 리스트 관련 
    $('#ban_student_list_box').show();
    $('#ban_student_list_bansel_box').show()
    $('#make_plus_consulting').hide();
    $('#student_consulting_datebox').hide();
    $('#ban_student_listModalLabelt').html('원생 목록')
}
async function get_student(ban_id) {
    $('#student_list_search_input').off('keyup');
    $('#ban_student_list_box').show();
    $('#ban_student_list_bansel_box').show()
    $('#make_plus_consulting').hide();
    $('#student_consulting_datebox').hide();
    StudentpaginationOptions = {
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        callback: function (data, pagination) {
            $('#h_title_msg').hide();
            $('#consulting_history_bansel_box').show()
            $('#ban_student_list_box').show()
            let temp_consulting_history_student_list = '';
            $.each(data, function (index, consulting) {
                let value = `${consulting.student_id}_${consulting.student_name}_${consulting.student_mobileno}_${consulting.teacher_id}`
                ulconsultings = consulting.consulting_list.filter(c => c.category_id < 100)
                let unlearned_cate = [...new Set(ulconsultings.map(item => item.category))];
                temp_consulting_history_student_list += `
                <td class="col-2">${consulting.student_name}</td>
                <td class="col-1">${consulting.student_origin}</td>
                <td class="col-1">${consulting.student_birthday}</td>
                <td class="col-2">${consulting.student_mobileno}</td>
                <td class="col-3"> 
                    <details>
                        <summary>총 ${ulconsultings.length}건</summary>
                        <ul>
                `;
                unlearned_cate.forEach((category) => {
                    let num = ulconsultings.filter(u=>u.category == category).length
                    temp_consulting_history_student_list += `<li>${category} : ${num}건</li>`
                })
                temp_consulting_history_student_list += `
                </ul>
                </details>
                </td>
                <td class="col-1">${consulting.done_consulting_num}건</td> 
                <td class="col-1" onclick="student_consulting(${consulting.student_id})">📝</td> 
                <td class="col-1" onclick="plusconsulting('${value}',${consulting.ban_id})"><span class="cursor-pointer">➕</span></td> 
                `;
            });
            $('#ban_student_info').html(temp_consulting_history_student_list);
        }
    }

    Studentcontainer = $('#ban_student_list_pagination')
    Targetdata = consultingStudentData.filter((e) => {
        return e.ban_id === ban_id;
    })
    $('#ban_student_listModalLabelt').html(`${Targetdata[0].ban_name}반 원생 목록`);
    Studentcontainer.pagination(Object.assign(StudentpaginationOptions, { 'dataSource': Targetdata }))
    $('#student_list_search_input').on('keyup', function () {
        var searchInput = $(this).val().toLowerCase();
        var filteredData = Targetdata.filter(function (d) {
            return ((d.hasOwnProperty('student_name') && d.student_name.toLowerCase().indexOf(searchInput) !== -1 )|| (d.hasOwnProperty('student_origin') && d.student_origin.toLowerCase().indexOf(searchInput) !== -1));
        });
        Studentcontainer.pagination('destroy');
        Studentcontainer.pagination(Object.assign(StudentpaginationOptions, { 'dataSource': filteredData }));
    });
}
function sort_option(sortBy) {
    switch (sortBy) {
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
            return b.unlearned_num - a.unlearned_num;
        });
        break;
    
        case "consulting_desc":
            $('#ban_sort').html('원생 (이름순 정렬👉)')
            $('#uconsulting_sort').html('미학습 (미학습 건 정렬👉)')    
            $('#dconsulting_sort').html('<strong>진행상담 (상담 건 정렬👇)</strong>')   
        Targetdata.sort(function (a, b) {
            return b.done_consulting_num - a.done_consulting_num;
        });
        break;
    }
  
    // 데이터 정렬 후 페이지네이션 다시 설정
    Studentcontainer.pagination("destroy");
    Studentcontainer.pagination(
      Object.assign(StudentpaginationOptions, { dataSource: Targetdata })
    );
}

function plusconsulting(value, b_id) {
    let v = value.split('_')
    $('#h_title_msg').hide();
    $('#ban_student_list_box').hide()
    $('#ban_student_list_bansel_box').hide()
    $('#student_consulting_datebox').hide()
    $('#make_plus_consulting').show();
    $('#ban_student_listModalLabelt').html(`${v[1]} 원생 추가 상담  ( 📞 ${v[2]}  )`)
    let temp_button = `
    <button class="btn btn-dark" onclick=plusconsulting_history(${Number(v[0])},${b_id},${Number(v[3])})>저장</button>
    `;
    $('#plusconsulting_button_box').html(temp_button)
}
function plusconsulting_history(student_id, b_id, t_id) {
    consulting_contents = $('#plus_consulting_contents').val()
    consulting_reason = $('#plus_consulting_reason').val()
    consulting_solution = $('#plus_consulting_solution').val()
    $.ajax({
        type: "POST",
        url: '/teacher/plus_consulting/' + student_id + '/' + b_id + '/' + t_id,
        // data: JSON.stringify(jsonData), // String -> json 형태로 변환
        data: {
            consulting_contents: consulting_contents,
            consulting_reason: consulting_reason,
            consulting_solution: consulting_solution
        },
        success: function (response) {
            {
                alert(response["result"])
                window.location.reload()
            }
        }
    })
}
// 메인화면 상담
async function get_consulting_student(done_code) {
    $('#consultingstudent_search_input').off('keyup');
    Consultingcontainer = $('#consultingstudent_pagination')
    consulting_targetdata = consultingStudentData.filter((e) => {
        if (done_code == 0) {
            $('#today_consulting_title').html('상담 목록');
            return e.missed != "오늘" && e.consulting_num != 0;
        } else {
            $('#today_consulting_title').html('오늘의 부재중 상담');
            return e.missed == "오늘" && e.consulting_num != 0;
        }
    })

    ConsultingpaginationOptions = {
        prevText: '이전',
        nextText: '다음',
        pageSize: 5,
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
                <td class="col-1">${consulting.consulting_num}</td>
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
function sort_consultingoption(sortBy) {
    console.log(consulting_targetdata)
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
            return b.consulting_num - a.consulting_num;
        });
        break;
    }
  
    // 데이터 정렬 후 페이지네이션 다시 설정
    Consultingcontainer.pagination("destroy");
    Consultingcontainer.pagination(
      Object.assign(ConsultingpaginationOptions, { dataSource: consulting_targetdata })
    );
}

// 상담기록 날짜별
async function student_consulting(student_id) {    
    $('#h_title_msg').hide();
    $('#ban_student_list_box').hide()
    $('#ban_student_list_bansel_box').hide()
    $('#make_plus_consulting').hide()
    $('#student_consulting_datebox').show();
    $('.mo_inloading').show()
    $('.monot_inloading').hide()
    let container = $('#studentlist_pagination')
    data = Targetdata.filter(e =>e.student_id == student_id)[0]
    $('#ban_student_listModalLabelt').html(`${data['student_name']} 원생 상담일지`)
    $('#studentlist_info_box').html(`
    <th class="col-3">${data.student_name}</th>
    <th class="col-3">${data.student_origin}</th>
    <th class="col-3">생년월일 : ${data.student_birthday}</th>
    <th class="col-3">📞${data.student_mobileno}</th>
    `);
    try {
        const response = await $.ajax({
            type: "GET",
            url: "/teacher/get_student_history/"+student_id,
            dataType: 'json',
            data: {},
        });
        ConsultingHistory = response['all_consulting_history']
        ConsultingHistoryGrouped = ConsultingHistory.reduce((acc, item) => {
            item.created_at = make_date(item.created_at)
            if (!acc[item.created_at]) {
                acc[item.created_at] = [];
            }
            acc[item.created_at].push(item);
            return acc;
        }, []);
        ConsultingHistoryGroupedCategory = Object.keys(ConsultingHistoryGrouped)
    } catch (error){
        alert('Error occurred while retrieving data.');
    }
    if(data['consulting_list'].length!=0){
        let total_ban_unlearned_consulting = 0
        $.each(data['consulting_list'], function (index, consulting) {
            total_ban_unlearned_consulting += consulting.consulting_list.filter(u => u.category_id < 100 && u.ban_id == data.ban_id).length
        });
    
        let target_consulting = data['consulting_list'].length > 0 ? data['consulting_list'].filter(c => c.done == 1) : 0;
        let target_consulting_num = target_consulting.length;
        // 미학습 상담 
        let unlearned_consulting_num = data['consulting_list'].length > 0 ? data['consulting_list'].filter(c => c.category_id < 100) : 0
    
        if (target_consulting_num != 0){
            DateconsultingGrouped = target_consulting.reduce((acc, item) => {
                if (!acc[item.created_at]) {
                    acc[item.created_at] = [];
                }
                acc[item.created_at].push(item);
                return acc;
            }, []);
            DateconsultingGroupedCategory = Object.keys(DateconsultingGrouped)
            let idx = 0;
            let temp_consulting_write_box = `
                <th class="col-3">진행 한 상담</th>
                <th class="col-3">${data.ban_name}반 총 미학습</th>
                <th class="col-6">${data.student_name}원생의 미학습</th>
                <td class="col-3">총 ${make_nodata(target_consulting_num)}</td>
                <td class="col-3">${make_nodata(total_ban_unlearned_consulting)}</td>
                <td class="col-4">진행한 상담 : ${make_nodata(unlearned_consulting_num.filter(c => c.done == 1).length)}</td>
                <td class="col-2"><strong>미학습 율 : ${answer_rate(unlearned_consulting_num.length, total_ban_unlearned_consulting).toFixed(0)}%</strong></td>
                <th class="col-4 tagtagtitle">진행 날짜</th>
                <th class="col-4 tagtagtitle">진행 한 상담 건</th>
                <th class="col-4 tagtagtitle">상세 보기 및 수정</th>`;
            container.pagination({
                dataSource: DateconsultingGroupedCategory,
                prevText: '이전',
                nextText: '다음',
                pageClassName: 'float-end',
                pageSize: 5,
                callback: function (DateconsultingGroupedCategory, pagination) {
                    $.each(DateconsultingGroupedCategory, function (index, key) {
                        let target_consultings = DateconsultingGrouped[key]
                        let cate_consultings_num = target_consultings.length
                        temp_consulting_write_box += `
                            <td class="col-4">${make_date(key)}</td>
                            <td class="col-4">${cate_consultings_num}건</td>
                            <td class="col-4" data-bs-toggle="modal" data-bs-target="#consultinghistory" onclick="show_consulting_history_box('${key}')">📝</td>
                        `
                    });
                    $('#studentlist_consulting_info_box').html(temp_consulting_write_box)
                }
            })
        }
    }
    if(ConsultingHistory.length != 0){
        console.log(ConsultingHistory)
        console.log(ConsultingHistoryGrouped)
        // temp_consulting_write_box +=`<th class="col-4 tagtagtitle">과거 상담 진행 날짜</th>
        // <th class="col-4 tagtagtitle">진행 한 상담 건</th>
        // <th class="col-4 tagtagtitle">상세 보기</th>`
        // $.each(ConsultingHistoryGroupedCategory,function(index,key){
        //     let target_consultings = ConsultingHistoryGroupedCategory[key]
        //     let cate_consultings_num = target_consultings.length
        //     temp_consulting_write_box += `
        //         <td class="col-4">${key}</td>
        //         <td class="col-4">${cate_consultings_num}건</td>
        //         <td class="col-4" data-bs-toggle="modal" data-bs-target="#consultinghistory" onclick="show_consulting_history_box('${key}')">📝</td>
        //     `
        // });
    }
    else{
        $('#studentlist_consulting_info_box').html('<p>진행 상담 내역이 없습니다.* 원생 목록에서 자체 상담을 진행해주세요 </p>')
    }
    $('.mo_inloading').hide()
    $('.monot_inloading').show()
}
// 상담일지 수정 
async function show_consulting_history_box(date_key) {
    $('#consultinghistoryModalLabelt').html(`${make_date(date_key)}날짜 상담일지`)
    $('.mo_inloading').show()
    $('.monot_inloading').hide()

    $('#student_info_box').html('');
    $('#student_consulting_info_box').html('')
    let temp_consulting_write_box = ''
    let target_consulting = DateconsultingGrouped[date_key]
    let consultingGrouped = target_consulting.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, []);
    let consultingGroupedCategory = Object.keys(consultingGrouped)
    const color_pallete = ['green', 'purple', 'yellow', 'red', 'blue', 'orange', 'cyan', 'white']
    let temp_consulting_contents_box = `<a class="btn-two cyan small">원생리포트</a>`;
    let idx = 0;
    $.each(consultingGroupedCategory, function (index, key) {
        let target_consultings = consultingGrouped[key]
        let cate_consultings_num = target_consultings.length
        temp_consulting_write_box += `<hr class='hr-dotted'/><h3 id="target_${key}" style="margin-bottom:1.2rem;">${key} ${cate_consultings_num}건</h3>`
        for (i = 0; i < cate_consultings_num; i++) {
            let target = target_consultings[i]
            let category = target['category']
            let consulting_id = target['id']
            let contents = target['contents']
            let consulting_missed = missed_date(target['missed'])
            let deadline = make_date(target['deadline'])
            let history_created = target['created_at']
            if (target['category_id'] < 100) {
                category = target['week_code'] + '주간  ' + category
                temp_consulting_write_box += `
                <p class="mt-lg-4 mt-5">✅${category} 검사 날짜: <strong> ${make_date(target['startdate'])}</strong></p>
                `;
            }
            let history_reason = target['reason'] == null ? '입력해주세요' : target['reason']
            let history_solution = target['solution'] == null ? '입력해주세요' : target['solution']
            temp_consulting_write_box += `
            <input type="hidden" id="target_consulting_id${idx}" value="${consulting_id}" style="display: block;" />
            <p mt-lg-4 mt-5>✅<strong>${category}</strong></br><strong>➖상담 마감일:
                ~${deadline}까지 </strong>| 부재중 : ${consulting_missed}</br></br>${contents}</br></p>
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
    <div class="d-flex justify-content-center mt-4 mb-2" id="consulting_button_box">
        <button class="btn btn-dark"
            onclick="post_bulk_consultings(${idx},${1})"
            style="margin-right:5px">수정</button>
    </div>
    `;
    $('#consulting_write_box').html(temp_consulting_write_box);
    $('#consulting_contents_box_cate').html(temp_consulting_contents_box)
    $('.mo_inloading').hide()
    $('.monot_inloading').show()
}
async function student_consulting_history(student_id) {
    let container = $('#studentlist_pagination')
    data = consultingStudentData.filter((e) => {
        return e.student_id == student_id && e.consulting_list.length != 0;
    })[0]
    $('.mo_inloading').show()
    $('.monot_inloading').hide()
    if(data){
        $('#ban_student_listModalLabelt').html(`${data['student_name']} 원생 상담일지`)
        $('#studentlist_info_box').html(`
        <th class="col-3">${data.student_name}</th>
        <th class="col-3">${data.student_origin}</th>
        <th class="col-3">생년월일 : ${data.student_birthday}</th>
        <th class="col-3">📞${data.student_mobileno}</th>
        `);
        let total_ban_unlearned_consulting = 0
        $.each(consultingStudentData, function (index, consulting) {
            total_ban_unlearned_consulting += consulting.consulting_list.filter(u => u.category_id < 100 && u.ban_id == data.ban_id).length
        });
    
        let target_consulting = data['consulting_list'].length > 0 ? data['consulting_list'].filter(c => c.done == 1) : 0;
        let target_consulting_num = target_consulting.length;
        // 미학습 상담 
        let unlearned_consulting_num = data['consulting_list'].length > 0 ? data['consulting_list'].filter(c => c.category_id < 100) : 0
    
        if (target_consulting_num != 0){
            DateconsultingGrouped = target_consulting.reduce((acc, item) => {
                if (!acc[item.created_at]) {
                    acc[item.created_at] = [];
                }
                acc[item.created_at].push(item);
                return acc;
            }, []);
            DateconsultingGroupedCategory = Object.keys(DateconsultingGrouped)
            let idx = 0;
            let temp_consulting_write_box = `
                <th class="col-3">진행 한 상담</th>
                <th class="col-3">${data.ban_name}반 총 미학습</th>
                <th class="col-6">${data.student_name}원생의 미학습</th>
                <td class="col-3">총 ${make_nodata(target_consulting_num)}</td>
                <td class="col-3">${make_nodata(total_ban_unlearned_consulting)}</td>
                <td class="col-4">진행한 상담 : ${make_nodata(unlearned_consulting_num.filter(c => c.done == 1).length)}</td>
                <td class="col-2"><strong>미학습 율 : ${answer_rate(unlearned_consulting_num.length, total_ban_unlearned_consulting).toFixed(0)}%</strong></td>
                <th class="col-4 tagtagtitle">진행 날짜</th>
                <th class="col-4 tagtagtitle">진행 한 상담 건</th>
                <th class="col-4 tagtagtitle">상세 보기 및 수정</th>`;
            container.pagination({
                dataSource: DateconsultingGroupedCategory,
                prevText: '이전',
                nextText: '다음',
                pageClassName: 'float-end',
                pageSize: 5,
                callback: function (DateconsultingGroupedCategory, pagination) {
                    var dataHtml = '';
                    $.each(DateconsultingGroupedCategory, function (index, key) {
                        let target_consultings = DateconsultingGrouped[key]
                        let cate_consultings_num = target_consultings.length
                        temp_consulting_write_box += `
                            <td class="col-4">${make_date(key)}</td>
                            <td class="col-4">${cate_consultings_num}건</td>
                            <td class="col-4" data-bs-toggle="modal" data-bs-target="#consultinghistory" onclick="show_consulting_history_box('${key}')">📝</td>
                        `
                    });
                    $('#studentlist_consulting_info_box').html(temp_consulting_write_box)
                }
            })
        }
    }else{
        $('#studentlist_consulting_info_box').html('<p>진행 상담 내역이 없습니다.* 원생 목록에서 자체 상담을 진행해주세요 </p>')
    }
    $('.mo_inloading').hide()
    $('.monot_inloading').show()
}
// 상담일지 작성 
async function get_consulting(student_id) {
    data = consultingStudentData.filter((e) => {
        return e.student_id == student_id && e.consulting_list.length != 0;
    })[0]
    $('#consultinghistoryModalLabelt').html(`${data['student_name']} 원생 상담일지`)
    $('.mo_inloading').show()
    $('.monot_inloading').hide()

    $('#student_info_box').html(`
    <th class="col-3">${data.student_name}</th>
    <th class="col-3">${data.student_origin}</th>
    <th class="col-3">생년월일 : ${data.student_birthday}</th>
    <th class="col-3">📞${data.student_mobileno}</th>
    `);

    let total_ban_unlearned_consulting = 0
    $.each(consultingStudentData, function (index, consulting) {
        total_ban_unlearned_consulting += consulting.consulting_list.filter(u => u.category_id < 100 && u.ban_id == data.ban_id).length
    });

    let target_consulting = data['consulting_list'].length > 0 ? data['consulting_list'].filter(c => c.done == 0) : 0;
    let target_consulting_num = target_consulting.length;

    // 기한 지난 상담 수
    let deadline_consulting = target_consulting_num != 0 ? target_consulting.filter(c => new Date(c.deadline).setHours(0, 0, 0, 0) < today).length : 0

    // 미학습 상담 
    let unlearned_consulting_num = data['consulting_list'].length > 0 ? data['consulting_list'].filter(c => c.category_id < 100).length : 0

    $('#student_consulting_info_box').html(`
    <th class="col-1">상담</th>
    <th class="col-1">기한 지남</th>
    <th class="col-4">${data.student_name} 미학습</th>
    <th class="col-4">${data.ban_name}반 총 미학습</th>
    <th class="col-2">원생의 미학습 발생</th>
    <td class="col-1">${make_nodata(target_consulting_num)}</td>
    <td class="col-1">${make_nodata(deadline_consulting)}</td>
    <td class="col-4">${make_nodata(unlearned_consulting_num)}</td>
    <td class="col-4">${make_nodata(total_ban_unlearned_consulting)}</td>
    <td class="col-2"><strong>${answer_rate(unlearned_consulting_num, total_ban_unlearned_consulting).toFixed(0)}%</strong></td>
    `)
    let temp_consulting_write_box = ''
    if(target_consulting_num != 0){
        consultingGrouped = target_consulting.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
        }, []);
        consultingGroupedCategory = Object.keys(consultingGrouped)
        const color_pallete = ['green', 'purple', 'yellow', 'red', 'blue', 'orange', 'cyan', 'white']
        let temp_consulting_contents_box = `<a class="btn-two cyan small">원생리포트</a>`;
        let idx = 0;
        $.each(consultingGroupedCategory, function (index, key) {
            let target_consultings = consultingGrouped[key]
            let cate_consultings_num = target_consultings.length
            temp_consulting_write_box += `<hr class='hr-dotted'/><h3 id="target_${key}" style="margin-bottom:1.2rem;">${key} ${cate_consultings_num}건</h3>`
            for (i = 0; i < cate_consultings_num; i++) {
                let target = target_consultings[i]
                let category = target['category']
                let consulting_id = target['id']
                let contents = target['contents']
                let consulting_missed = missed_date(target['missed'])
                let deadline = make_date(target['deadline'])
                let history_created = target['created_at']
                if (target['category_id'] < 100) {
                    category = target['week_code'] + '주간  ' + category
                    temp_consulting_write_box += `
                    <p class="mt-lg-4 mt-5">✅${category} 검사 날짜: <strong> ${make_date(target['startdate'])}</strong></p>
                    `;
                }
                let history_reason = target['reason'] == null ? '입력해주세요' : target['reason']
                let history_solution = target['solution'] == null ? '입력해주세요' : target['solution']
                temp_consulting_write_box += `
                <input type="hidden" id="target_consulting_id${idx}" value="${consulting_id}" style="display: block;" />
                <p mt-lg-4 mt-5>✅<strong>${category}</strong></br><strong>➖상담 마감일:
                    ~${deadline}까지 </strong>| 부재중 : ${consulting_missed}</br></br>${contents}</br></p>
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
        $('#consulting_contents_box_cate').html(temp_consulting_contents_box)
    }else{
        temp_consulting_write_box += '<p>진행 할 상담이 없습니다.* 원생 목록에서 추가 상담을 진행해주세요 </p>'
        $('#consulting_write_box').html(temp_consulting_write_box);
    }
    $('.mo_inloading').hide()
    $('.monot_inloading').show()
}
// 상담일지 카테고리
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
function get_consulting_history() {
    $('#consulting_history_bansel_box').show()
    $('#consulting_history_box').show()
    $('#consulting_history_box_detail').hide()
    $('#consulting_list_search_input').off('keyup');
    let container = $('#consulting_history_student_list_pagination')
    // var category_list = []
    CpaginationOptions = {
        prevText: '이전',
        nextText: '다음',
        pageSize: 5,
        callback: function (data, pagination) {
            var dataHtml = '';
            $.each(data, function (index, consulting) {
                student_info = allStudentData.filter(s => s.register_no == consulting.student_id)[0]
                consulting.student_name = student_info.name + '( ' + student_info.nick_name + ' )'
                consulting.origin = student_info.origin
                consulting.ban_name = student_info.classname
                let title = consulting.contents
                if (consulting.category_id < 100) {
                    title = consulting.week_code + '주간 ' + consulting.category
                }
                dataHtml += `
                    <td class="col-2"> ${consulting.category}</td>
                    <td class="col-2">${title}</td>
                    <td class="col-2">${make_date(consulting.created_at)}</td>
                    <td class="col-2"> ${consulting.ban_name}</td>
                    <td class="col-2"> ${consulting.student_name}</td>
                    <td class="col-1"> ${consulting.origin}</td>
                    <td class="col-1" onclick ="get_consulting_history_detail(${consulting.id})"> 🔍 </td>`;
            });
            $('#consulting_history_student_list').html(dataHtml);
        }
    }
    target_list = allConsultingData.length > 0 ? allConsultingData.filter(c => c.done != 0) : 0;
    let target_consulting_num = target_list.length;
    if (target_consulting_num != 0) {
        // 중복 없는 카테고리 배열 생성
        let category_set = new Set(target_list.map(c => c.category));
        let category_list = [...category_set];
        var idxHtml = `<option value="none">전체</option>`;
        $.each(category_list, function (idx, val) {
            idxHtml += `<option value="${val}">${val}</option>`
        })
        $('#history_cate').html(idxHtml);
        // 검색 조건이 변경될 때마다 검색 결과 업데이트하는 함수
        const updateSearchResult = function () {
            // 현재 검색 조건에서 선택된 값을 가져옴
            const selectedCategory = $('#history_cate').val();
            const searchInput = $('#consulting_list_search_input').val().toLowerCase();

            // 검색 조건과 검색어를 모두 만족하는 데이터를 필터링함
            const filteredData = target_list.filter(function (d) {
                return ((d.hasOwnProperty('student_name') && d.student_name.toLowerCase().indexOf(searchInput) !== -1) || (d.hasOwnProperty('origin') && d.origin.toLowerCase().indexOf(searchInput) !== -1) || (d.hasOwnProperty('ban_name') && d.ban_name.toLowerCase().indexOf(searchInput) !== -1)) &&
                    (selectedCategory == 'none' || d.category == selectedCategory);
            });

            // 필터링된 데이터를 화면에 출력함
            container.pagination('destroy');
            container.pagination(Object.assign(CpaginationOptions, { 'dataSource': filteredData }));
        };

        container.pagination(Object.assign(CpaginationOptions, { 'dataSource': target_list }));
        // 검색 조건 변경 시 검색 결과를 업데이트함
        $('#history_cate, #consulting_list_search_input').on('change keyup', updateSearchResult);
    }
}
// 문의 내용 상세보기
async function get_consulting_history_detail(c_id) {
    $('#consulting_history_bansel_box').hide()
    $('#consulting_history_box').hide()
    $('#consulting_history_box_detail').show()
    consulting_history = allConsultingData.filter(c => c.id == c_id)[0]
    let category = `${consulting_history.category}`
    if (consulting_history.category_id < 100) {
        category = `${consulting_history.week_code}주간 ${consulting_history.category} 상담  검사 날짜: <strong>${make_date(consulting_history.startdate)}</strong>`
    }
    let temp_his = `
    <button type="button" class="btn btn-back" onclick="get_consulting_history()">원생 목록으로 돌아가기🔙 </button>
    <p class="mt-lg-4 mt-5">✅ ${category}</p>
    <p mt-lg-4 mt-5>✅ ${consulting_history.contents}</p>
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">상담 사유</span>
        <input class="modal-body" style="border-block-width:0;border-left:0;border-right:0" type="text" size="50"id="consulting_reason${c_id}" placeholder="${consulting_history.reason}">
    </div>
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">제공한 가이드</span>
        <input class="modal-body" style="border-block-width:0;border-left:0;border-right:0" type="text" size="50"
            id="consulting_solution${c_id}" placeholder="${consulting_history.solution}">
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

async function sort_consulting_history(category) {
    if (category == "none") {
        return get_consulting_history()
    }
    let container = $('#consulting_history_student_list_pagination')
    const data = target_list.filter((e) => {
        return e.category == category;
    })
    container.pagination(Object.assign(CpaginationOptions, { 'dataSource': data }));
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
function post_bulk_consultings(c_length, is_done) {
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
                    window.location.reload()
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
    if (str == "none") {
        $('#question_topurple').hide()
    } else if (str == "일반" || str == "기술" || str == "내근") {
        let question_html = `
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">대상 원생</span>
            <select id="student_list" class="modal-body-select" name="target_student">
            </select>
        </div>
        `;
        $('#question_box').html(question_html);
        $('#question_topurple').show()
    } else {
        let question_html = `
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">대상 원생</span>
            <select id="student_list" class="modal-body-select" name="target_student"
                onchange="attach_consulting_history(this.value)">
            </select>
        </div>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">상담 내용</span>
            <select class="modal-body-select" name="consulting_history" id="h_select_box">
            </select>
        </div>
        `;
        $('#question_box').html(question_html);
        $('#question_topurple').show()
    }
}
function get_ban_student(ban_id) {
    const data = consultingStudentData.filter((e) => {
        return e.ban_id == ban_id;
    })
    if (data.length == 0) {
        let temp_target_student = '<option value="none" selected>반 원생이 없습니다.</option>';
        $('#student_list').html(temp_target_student)
    } else {
        let temp_target_student = '<option value="none" selected>대상 원생을 선택해주세요</option>';
        // ㄱㄴㄷㄹ 순 정렬 
        data.sort(function (a, b) {
            var nameA = a.student_name.toUpperCase(); // 대소문자 구분 없이 비교하기 위해 대문자로 변환
            var nameB = b.student_name.toUpperCase(); // 대소문자 구분 없이 비교하기 위해 대문자로 변환
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
            <option value="${student.student_id}"> ${student.student_name} *${student.student_origin}</option>
            `;
            $('#student_list').html(temp_target_student)
        });

        // $('#student_list').html(temp_target_student).selectmenu({
        //     width: "70%", // select box의 너비 설정
        //     // 검색 기능 활성화
        //     create: function(event, ui) {
        //       var widget = $(this).selectmenu('widget');
        //       var input = $('<input>').appendTo(widget).on('input', function() {
        //         var options = $(this).closest('.ui-selectmenu-menu').find('.ui-menu-item');
        //         var searchString = $(this).val().toLowerCase();
        //         options.each(function() {
        //           var text = $(this).text().toLowerCase();
        //           if (text.indexOf(searchString) === -1) {
        //             $(this).hide();
        //           } else {
        //             $(this).show();
        //           }
        //         });
        //       });
        //     },
        //     // select box의 option 설정
        //     change: function(event, ui) {
        //       console.log(ui.item.value); // 선택된 항목의 값
        //     }
        //   }).selectmenu('refresh');
    }
}
// 상담일지 첨부 
function attach_consulting_history(student_id) {
    const data = consultingStudentData.filter((e) => {
        return e.student_id == student_id && e.done_consulting_num.length != 0;
    })[0]['consulting_list']
    const consultinglist = data.length > 0 ? data.filter(c => c.done == 1) : 0
    let temp_h_select = ''
    if (consultinglist.length <= 0) {
        alert('상담을 우선 진행해주세요  원생목록 👉 해당 원생 상담추가');
        temp_h_select = '<option value="none" selected>상담을 우선 진행해주세요  원생목록 👉 해당 원생 상담추가</option>'
    } else {
        temp_h_select = '<option value="none" selected>상담을 선택해주세요</option>'
        $.each(consultinglist, function (index, consulting) {
            let category = ''
            if (consulting.category_id < 100) {
                category = `${consulting.week_code}주간 ${consulting.category}상담`
            } else {
                category = `${consulting.category} ${consulting.contents}`
            }
            temp_h_select += `
            <option value="${consulting.id}"> ${category} - 제공한 가이드: ${consulting.solution}</option>
            `;
        });
    }
    $('#h_select_box').html(temp_h_select)
}
// 문의 리스트
async function get_teacher_question() {
    try {
        const response = await $.ajax({
            type: "GET",
            url: "/teacher/question",
            dataType: 'json',
            data: {},
        });
        questionAnswerdata = response
    } catch (error) {
        alert('Error occurred while retrieving data.');
    }
}
async function get_question_list() {
    $('#q_title_msg').hide();
    $('#questiondetail').hide();
    $('.Tinloading').show()
    $('.t_notinloading').hide()
    $('#question_pagination').show()
    if (!banData) {
        await get_teacher_question().then(() => {
            $('.Tinloading').hide()
            $('.t_notinloading').show()
        })
    }
    let container = $('#question_pagination')
    $('.Tinloading').hide()
    $('.t_notinloading').show()
    if (questionAnswerdata.length > 0) {
        $('#questionlist').show()
        $('#question_pagination').show()
        container.pagination({
            dataSource: questionAnswerdata,
            prevText: '이전',
            nextText: '다음',
            pageClassName: 'float-end',
            pageSize: 5,
            callback: function (questionAnswerdata, pagination) {
                var dataHtml = '';
                $.each(questionAnswerdata, function (index, item) {
                    if (item.answer == 0) { done_code = '미응답' }
                    else { done_code = item.answer_data.created_at + '에 응답' }
                    dataHtml += `
                    <td class="col-2">${q_category(item.category)}</td>
                    <td class="col-5">${item.title}</td>
                    <td class="col-3"> ${done_code} </td>
                    <td class="col-1" onclick="get_question_detail(${item.id})"> <span class="cursor-pointer">🔍</span> </td>
                    <td class="col-1" onclick="delete_question(${item.id})"> <span class="cursor-pointer">❌</span> </td>
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
    questiondata = questionAnswerdata.filter(q => q.id == q_id)[0]
    ban_student_data = allStudentData.filter(s => s.register_no == questiondata.student_id)[0]
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
    </div>
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">대상 반 | 학생</span>
        <p>${ban_student_data.classname} ➖ ${ban_student_data.name} (${ban_student_data.nick_name}:${ban_student_data.origin})</p>
    </div>
    <div class="modal-body-select-container">
    <span class="modal-body-select-label">첨부파일</span>
    <div class="make_col">
    `
    if(questiondata.attach != "없음"){
        questiondata.attach.forEach((a)=>{
            temp_question_list += `<a href="/common/downloadfile/question/${q_id}/attachment/${a.id}" download="${a.file_name}">${a.file_name}</a>`;
        })
    }
    temp_question_list += `</div></div>`;
    $('#teacher_question').html(temp_question_list);
    // 상담 일지 처리 
    if (questiondata.category == 0 || questiondata.category == 4 || questiondata.category == 5) {
        $('#consulting_history_attach').hide()
    } else {
        $('#consulting_history_attach').show()
        consulting_history = allConsultingData.filter(c => c.id == questiondata.consluting)[0]
        let category = ''
        if (consulting_history.category_id < 100) {
            category = `${consulting_history.week_code}주간 ${consulting_history.category}상담`
        } else {
            category = `${consulting_history.category} ${consulting_history.contents}`
        }
        let temp_his = `
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
        <span class="modal-body-select-label">응답제목</span>
        <p>${questiondata.answer_data.title}</p>
        </div>
        <div class="modal-body-select-container">
        <span class="modal-body-select-label">응답</span>
        <p>${questiondata.answer_data.content}</p>
        </div>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">응답일</span>
            <p>${questiondata.answer_data.created_at}</p>
        </div>`;
        if (questiondata.category != 0 && questiondata.category != 4) {
            temp_answer_list += `<div class="modal-body-select-container">
           <span class="modal-body-select-label">처리</span>
           <p>${make_answer_code(questiondata.answer_data.reject_code)}</p>
           </div>`
        }
    }
    $('#teacher_answer').html(temp_answer_list);
    // 댓글 처리
    // const temp_comment = `
    // <div class="comment-typing">
    //     <input class="comment-typing-input" type="text" id="comment_contents" placeholder="댓글을 남겨주세요">
    // </div>
    // <div class="comment-typing-save">
    //     <button class="comment-typing-save-btn" onclick="post_comment(${q_id},${0})">등록</button>
    // </div>
    // `;
    // $('#comment_post_box').html(temp_comment) 
    // $('#comments').empty()
    // const comments_len = questiondata.comment_data.length
    // if (comments_len != 0) {
    //     for (i = 0; i < comments_len; i++) {
    //         c_id = questiondata.comment_data[i]['id']
    //         c_contents = questiondata.comment_data[i]['contents']
    //         writer = questiondata.comment_data[i]['user_id']
    //         parent_id = questiondata.comment_data[i]['parent_id']

    //         if (parent_id == 0) {
    //             temp_comments = `
    //             <div id="for_comment${c_id}" style="margin-top:10px">
    //                 <p class="p_comment">${c_contents}  (작성자 : ${writer} | ${make_date(questiondata.comment_data[i]['created_at'])} )</p>
    //             </div>
    //             <details style="margin-top:0px;margin-right:5px;font-size:0.9rem;">
    //                 <summary><strong>대댓글 달기</strong></summary>
    //                     <input class="border rounded-0 form-control form-control-sm" type="text" id="comment_contents${c_id}"
    //                     placeholder=" 대댓글 ">
    //                     <button onclick="post_comment(${q_id},${c_id})">등록</button>
    //                 </details>
    //             `;
    //             $('#comments').append(temp_comments);
    //         } else {
    //             let temp_comments = `
    //             <p class="c_comment"> ➖ ${c_contents}  (작성자 : ${writer} | ${c_created_at} )</p>
    //             `;
    //             $(`#for_comment${parent_id}`).append(temp_comments);
    //         }

    //     }
    // }

}
