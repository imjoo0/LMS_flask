// 처음 get 할때 뿌려질 정보 보내는 함수 
$(document).ready(function () {
    get_total_data()
})

function displayData(totalData, currentPage, dataPerPage,data_list,data_num) {
    let chartHtml = "";

    //Number로 변환하지 않으면 아래에서 +를 할 경우 스트링 결합이 되어버림.. 
    currentPage = Number(currentPage);
    dataPerPage = Number(dataPerPage);
    let last_item = (currentPage - 1) * dataPerPage + dataPerPage;
    if( last_item > totalData){
        last_item = totalData
    }
    for (var i = (currentPage - 1) * dataPerPage; //11*5 = 55
        i < last_item; // 55+5
        i++){
        if(data_num == 1){
            // 퇴소 이반 현황 
            target = data_list[i]
            let register_no = target['register_no'];
            let ban_name = target['ban_name'];
            let semester = target['semester'];
            let teacher_name = target['teacher_name']
            let out_data = target['out_data'];
            let switch_data = target['switch_data'];
            chartHtml +=`
            <td class="col-2">${ban_name} </td>
            <td class="col-2">${semester}</td>
            <td class="col-3">${teacher_name} </td>
            <td class="col-2">${out_data}</td><br>
            <td class="col-2">${switch_data}</td><br>
            <td class="col-1"  data-bs-toggle="modal" data-bs-target="#baninfo" onclick="getBanInfo(${register_no})">✔️</td><br>
            `;
        }else if(data_num == 2){
            // 미학습 발생 현황
            target = data_list[i]
            let register_no = target['register_no'];
            let ban_name = target['ban_name'];
            let semester = target['semester'];
            let teacher_name = target['teacher_name']
            let ul_data = target['ul_data'];
            chartHtml +=`
            <td class="col-3">${ban_name} </td>
            <td class="col-2">${semester}</td>
            <td class="col-3">${teacher_name} </td>
            <td class="col-3">${ul_data}</td><br>
            <td class="col-1" data-bs-toggle="modal" data-bs-target="#baninfo" onclick="getBanInfo(${register_no})">✔️</td><br>
            `;
        }else{
            target = data_list[i]
            let register_no = target['register_no'];
            let mobileno = target['mobileno'];
            let email = target['email'];
            let total_student_num = target['total_student_num'];
            let name = target['name'] +'('+target['engname']+')'
            chartHtml +=`
            <th class="col-2">${name}</th>
            <th class="col-3">${email}</th>
            <th class="col-2">${mobileno}</th>
            <th class="col-2">${total_student_num}</th>
            <th class="col-2">알림장 응답율</th>
            <td class="col-1" data-bs-toggle="modal" data-bs-target="#teacherinfo" onclick="getTeacherInfo(${register_no})">✔️</td><br>
            `;
        } 
    }
    
    $("#static_data"+data_num).html(chartHtml);  
       
}

function paging(totalData, dataPerPage, pageCount, currentPage, data_list,data_num) {
    totalPage = Math.ceil(totalData / dataPerPage); //총 페이지 수

    if (totalPage < pageCount) {
        pageCount = totalPage;
    }

    let pageGroup = Math.ceil(currentPage / pageCount); // 페이지 그룹 1/10 1~10까지는 '1' , 11~20 까지는 2 , 21~30까지는 3 
    let last = pageGroup * pageCount; //화면에 보여질 마지막 페이지 번호

    if (last > totalPage) {
        last = totalPage;
    }
    let first = last - (pageCount - 1); //화면에 보여질 첫번째 페이지 번호
    let next = last + 1;
    let prev = first - 1;

    let pageHtml = "";

    if (prev > 0) {
        pageHtml += "<li><a class='cursor-pointer' id='prev'> 이전 </a></li>";
    }

    //페이징 번호 표시 
    for (var i = first; i <= last; i++) {
        if (currentPage == i) {
            pageHtml +=
                "<li class='on'><a class='cursor-pointer' id='" + i + "'>" + i + "</a></li>";
        } else {
            pageHtml += "<li><a class='cursor-pointer' id='" + i + "'>" + i + "</a></li>";
        }
    }

    if (last < totalPage) {
        pageHtml += "<li><a class='cursor-pointer' id='next' > 다음 </a></li>";
    }

    $("#pagingul"+data_num).html(pageHtml);
    let displayCount = "";
    if(data_num == 1){
        displayCount = " 퇴소 이반 현황 1 - " + totalPage + " 페이지 / " + totalData + "건";
    }else if(data_num == 2){
        displayCount = " 미학습 발생 현황 1 - " + totalPage + " 페이지 / " + totalData + "건";
    }else{
        displayCount = " 선생님 현황 1 - " + totalPage + " 페이지 / " + totalData + "건";
    }
    $("#displayCount"+data_num).text(displayCount);

    //페이징 번호 클릭 이벤트 
    $(`#pagingul${data_num} li a`).click(function () {
        let $id = $(this).attr("id");
        selectedPage = $(this).text();

        if ($id == "next") selectedPage = next;
        if ($id == "prev") selectedPage = prev;

        //전역변수에 선택한 페이지 번호를 담는다...
        globalCurrentPage = selectedPage;

        //페이징 표시 재호출
        paging(totalData, dataPerPage, pageCount, selectedPage, data_list,data_num);
        //글 목록 표시 재호출
        displayData(totalData, selectedPage, dataPerPage,data_list,data_num);
    });
}

function get_teacher_data(){
    $.ajax({
        url: '/admin/teacher_data',
        type: 'GET',
        data: {},
        success: function(response){
            tn = response['total']['total_student']
            $('#total_num').css('width',`${tn}%`);
            $('#total_num').css('background-color','#B9CDE5');
            $('#tn').html(`총 학생 수: ${tn}명`);

            data_list = response['all_teacher']
            if(data_list == '없음'){
                $("#t_data_box").html('정규반을 진행중인 선생님이 없습니다');
            }else{
                totalData = data_list.length
                displayData(totalData, 1, dataPerPage,data_list,3);
                paging(totalData, dataPerPage, pageCount, 1,data_list,3);
            }
        }
    }) 
    
}

