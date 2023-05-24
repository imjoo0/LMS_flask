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
                'unlearned_num':unlearned_num,
                'new_cs_num':new_cs_num
            });
        }
        return acc;
    }, []);
    result.sort(function (a, b) {
        return b.new_cs_num - a.new_cs_num;
    });
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

    switch(sortBy){
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
                <td class="col-1" id="show_consulting" data-bs-toggle="modal" data-bs-target="#consultinghistory" consulting-student-id="${consulting.student_id}"><span class="cursor-pointer">📝</span></td> 
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