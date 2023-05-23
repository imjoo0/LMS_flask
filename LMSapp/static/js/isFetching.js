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
export function makeConsultingListData(done_code){
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

    let consulting_targetdata = result.filter((e) => {
        if (done_code == 0) {
            $('#today_consulting_title').html('상담 목록');
            return e.missed != "오늘" && e.consulting_num != 0;
        } else {
            $('#today_consulting_title').html('오늘의 부재중 상담');
            return e.missed == "오늘" && e.consulting_num != 0;
        }
    })
    return consulting_targetdata
}
