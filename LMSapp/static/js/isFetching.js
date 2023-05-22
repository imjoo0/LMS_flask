// isFetching.js 파일
let ban_data = null;
let all_consulting = null;
let my_students = null;
let all_task = null; 

let isFetching = false;

export async function get_data() {
    if (!isFetching) { // IsFetching == false 일때 
        try{
            isFetching = true;
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
            alert('Error occurred while retrieving data.');
        } finally {
            isFetching = false;
        }
    }
}
// 모듈이 로드될 때 fetchData 함수 실행
await get_data();
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
