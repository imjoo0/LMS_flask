// $(document).ready(function () {
//     $('#label_title').empty();
// })

function getBanInfo(b_id){
    $('#default_title').hide();
    $('#label_title').empty();
    $('#profile_data').empty();
    $('#ban_data').empty();
    $('#student_data').empty();
    $.ajax({
        type: "GET",
        url: "/manage/ban/"+b_id,
        data: {},
        success: function (response) {
            console.log(response)
            let ban_name = response['name'];
            let teacher_name = response['teacher_name']
            let teacher_e_name = response['teacher_e_name']
            let teacher_mobileno = response['teacher_mobileno']
            let teacher_email = response['teacher_email']

            let temp_title = `<h1> ${ban_name} 현황</h1>`
            $('#label_title').append(temp_title);

            let temp_profile_data = `
            <table border="0">
                <th>담임 선생님 정보</th>
                <th></th>
                <th></th>
                <tr>
                    <td>${teacher_name}(${teacher_e_name})</td>
                    <td>➖${teacher_mobileno} </td>
                    <td>➖${teacher_email}</td>
                </tr>
            </table>
            `;
            $('#profile_data').append(temp_profile_data);

            let students_num = response['students_num']
            let temp_ban_data = `
            <table border="0">
                <th>총 원생 수</th>
                <th>이반</th>
                <th>퇴소</th>
                <th>취소/환불</th>
                <th>미학습</th>
                <tr>
                    <td>${students_num}</td>
                    <td> 임시3 (5%) </td>
                    <td> 임시3 (5%) </td>
                    <td> 임시3 (5%) </td>
                    <td> 임시3 (5%) </td>
                </tr>
            </table>
            `;
            $('#ban_data').append(temp_ban_data);

            let student_info = response['student_info']
            let temp_student_data = `
                <th>원생 정보</th>
                <th>연락처</th>
                <th>부모님 정보</th>
                <th>퍼플 등록일</th>
                <tr id="s_data">
                    
                </tr>
            `;
            $('#student_data').append(temp_student_data);

            // $('#s_data').empty();
            for (let k = 0; k < student_info.length; k++) {
                let name = student_info[k].name;
                let original = student_info[k].original;
                let mobileno = student_info[k].mobileno;
                let parent_name_mobileno = student_info[k].parent_name_mobileno;
                let register_date = student_info[k].register_date;
                console.log(name)
                let temp_s_data = `
                <td>${name}(${original})</td>
                <td>➖${mobileno} </td>
                <td>➖${parent_name_mobileno}</td>
                <td>➖${register_date}</td><br>
                `;
                $('#s_data').append(temp_s_data);

            }
            

        }

    })

}