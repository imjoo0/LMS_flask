// isFetching.js 파일
let ban_data = null;
let all_consulting = null;
let my_students = null;
let all_task = null; 

let isFetching = false;

export function getIsFetching() {
  return isFetching;
}

export function setIsFetching(value) {
  isFetching = value;
}

export async function getData() {
    try{
        const response = await $.ajax({
            url: '/teacher/get_mybans',
            type: 'GET',
            dataType: 'json',
            data: {},
        });
        ban_data = response.ban_data
        all_consulting = response.all_consulting
        my_students = response.my_students
        all_task = response.all_task
    } catch (error) {
        alert('Error occurred while retrieving data1.');
    }
}

export function getBansData() {
    return ban_data;  // 다른 파일에서 해당 값을 불러올 수 있도록 반환하는 함수
}
export function getConsultingsData() {
    return all_consulting;  // 다른 파일에서 해당 값을 불러올 수 있도록 반환하는 함수
}
export function getStudentsData() {
    return my_students;  // 다른 파일에서 해당 값을 불러올 수 있도록 반환하는 함수
}
export function getTasksData() {
    return all_task;  // 다른 파일에서 해당 값을 불러올 수 있도록 반환하는 함수
}
export function makeConsultingListData(){
    let result = my_students.reduce((acc, student) => {
        const consultingList = all_consulting.filter(c => c.student_id === student.student_id);
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
                    'student_id': student.student_id,
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
                    'student_id': student.student_id,
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
                'student_id': student.student_id,
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
    return result;
}
export function draw_consulting(sortBy,done_code){
    let result = makeConsultingListData()

    let consulting_targetdata = result.filter((e) => {
        if (done_code == 0) {
            $('#today_consulting_title').html('상담 목록');
            return e.missed != "오늘" && e.consulting_num != 0;
        } else {
            $('#today_consulting_title').html('오늘의 부재중 상담');
            return e.missed == "오늘" && e.consulting_num != 0;
        }
    })

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
    if(consulting_targetdata.length == 0){
        $('#consulting_student_list').hide()
        $('#consultingstudent_pagination').hide()
        $('#today_consulting_title').html('상담 : 0건')
        return;
    }
    $('#today_consulting_title').html('상담 목록')
    
    function get_consulting(student_id) {
        data = consulting_targetdata.filter((e) => {
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
        $.each(consulting_targetdata, function (index, consulting) {
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
            let temp_consulting_contents_box = `<a class="btn-two cyan small" data-bs-toggle="modal" data-bs-target="#student_report" onclick="student_report(${student_id})">원생리포트</a>`;
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
            $('#consulting_contents_box_cate').html(temp_consulting_contents_box)
        }else{
            temp_consulting_write_box += '<p>진행 할 상담이 없습니다.* 원생 목록에서 추가 상담을 진행해주세요 </p>'
            $('#consulting_write_box').html(temp_consulting_write_box);
        }
        $('.mo_inloading').hide()
        $('.monot_inloading').show()
    }
    $('#consultingstudent_search_input').off('keyup');
    let Consultingcontainer = $('#consultingstudent_pagination')
    let ConsultingpaginationOptions = {
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
                <td class="col-1">${consulting.consulting_num}</td>
                <td class="col-1" data-bs-toggle="modal" data-bs-target="#consultinghistory" onclick="get_consulting('${consulting.student_id}')"><span class="cursor-pointer">📝</span></td> 
                `;
            });
            $('#today_consulting_box').html(temp_consulting_contents_box);
            $('#consulting_student_list').show();
        }
    };
    // 데이터 정렬 후 페이지네이션 다시 설정
    // Consultingcontainer.pagination('destroy');
    Consultingcontainer.pagination(
      Object.assign(ConsultingpaginationOptions, { dataSource: consulting_targetdata })
    );
    $('#consultingstudent_search_input').on('keyup', function () {
        var searchInput = $(this).val().toLowerCase();
        var filteredData = consulting_targetdata.filter(function (d) {
            return (d.hasOwnProperty('ban_name') && d.ban_name.toLowerCase().indexOf(searchInput) !== -1) || (d.hasOwnProperty('student_name') && d.student_name.toLowerCase().indexOf(searchInput) !== -1) || (d.hasOwnProperty('student_origin') && d.student_origin.toLowerCase().indexOf(searchInput) !== -1);
        });
        Consultingcontainer.pagination('destroy');
        Consultingcontainer.pagination(Object.assign(ConsultingpaginationOptions, { 'dataSource': filteredData }));
    });
}