let totalData; //총 데이터 수
let dataPerPage = 3;
let pageCount = 10; //페이징에 나타낼 페이지 수
let globalCurrentPage = 1; //현재 페이지
let data_list;

function displayData(totalData, currentPage, dataPerPage,data_list) {
    let chartHtml = "";

    //Number로 변환하지 않으면 아래에서 +를 할 경우 스트링 결합이 되어버림.. 
    currentPage = Number(currentPage);
    dataPerPage = Number(dataPerPage);
    let last_item = (currentPage - 1) * dataPerPage + dataPerPage;
    if( last_item > totalData){
        last_item = totalData
    }
    for (
        var i = (currentPage - 1) * dataPerPage; //11*5 = 55
        i < last_item; // 55+5
        i++
    ) {
        target = JSON.parse(data_list[i])
        let name = target.name;
        let original = target.original;
        let mobileno = target.mobileno;
        let parent_name_mobileno = target.parent_name_mobileno;
        let register_date = target.register_date;
        chartHtml +=`
        <td class="col-2">${name}(${original})</td>
        <td class="col-4">${mobileno} </td>
        <td class="col-3">${parent_name_mobileno}</td>
        <td class="col-2">${register_date}</td><br>
        <td class="col-1" a href="#">✔️</td><br>
        `;
    } 
    $("#s_data").html(chartHtml);
}

function paging(totalData, dataPerPage, pageCount, currentPage, data_list) {
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
        pageHtml += "<li><a href='#' id='prev'> 이전 </a></li>";
    }

    //페이징 번호 표시 
    for (var i = first; i <= last; i++) {
        if (currentPage == i) {
            pageHtml +=
                "<li class='on'><a href='#' id='" + i + "'>" + i + "</a></li>";
        } else {
            pageHtml += "<li><a href='#' id='" + i + "'>" + i + "</a></li>";
        }
    }

    if (last < totalPage) {
        pageHtml += "<li><a href='#' id='next'> 다음 </a></li>";
    }

    $("#pagingul").html(pageHtml);
    let displayCount = "";
    displayCount = " 원생 명단 1 - " + totalPage + " 페이지 / " + totalData + "건";
    $("#displayCount").text(displayCount);

    //페이징 번호 클릭 이벤트 
    $("#pagingul li a").click(function () {
        let $id = $(this).attr("id");
        selectedPage = $(this).text();

        if ($id == "next") selectedPage = next;
        if ($id == "prev") selectedPage = prev;

        //전역변수에 선택한 페이지 번호를 담는다...
        globalCurrentPage = selectedPage;
        console.log(last)

        //페이징 표시 재호출
        paging(totalData, dataPerPage, pageCount, selectedPage, data_list);
        //글 목록 표시 재호출
        displayData(totalData, selectedPage, dataPerPage,data_list);
    });
}

function getBanInfo(b_id){
    $('#label_title').empty();
    $('#profile_data').empty();
    $('#ban_data').empty();
    $('#s_data').empty();
    $('#ban_statistics').empty();
    if( b_id == 'none'){
        $('#default_title').show();
        $('#student_data').hide();
        $('#pagingul').hide();
    }else{
        $('#default_title').hide();
        $('#student_data').show();
        $('#pagingul').show();
    }
    $.ajax({
        type: "GET",
        url: "/manage/ban/"+b_id,
        data: {},
        success: function (response) {
            // let target_ban = response['target_ban']
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
                    <td> 📞 ${teacher_mobileno} </td>
                    <td> ✉️ ${teacher_email}</td>
                </tr>
            </table>
            `;
            $('#profile_data').append(temp_profile_data);

            let students_num = response['students_num']
            let temp_ban_data = `
            <table class="table text-center" style="width:100%;">
                <tbody  style="width:100%;">
                    <tr class="row">
                        <th class="col-2">총 원생 수</th>
                        <th class="col-2">이반</th>
                        <th class="col-2">퇴소</th>
                        <th class="col-3">취소/환불</th>
                        <th class="col-3">미학습</th>
                    </tr>
                    <tr class="row">
                        <td class="col-2">${students_num}</td>
                        <td class="col-2"> 임시3 (5%) </td>
                        <td class="col-2"> 임시3 (5%) </td>
                        <td class="col-3"> 임시3 (5%) </td>
                        <td class="col-3"> 임시3 (5%) </td>
                    </tr>
                </tbody>
            </table>
            `;
            $('#ban_data').append(temp_ban_data);

            data_list = response['student_info']
            totalData = students_num

            displayData(totalData, 1, 3,data_list);
            paging(totalData, 3, pageCount, 1,data_list);

            let temp_ban_statistics = `
            <table class="table text-center" id="unlearned" style="margin-left:1%; margin-right: 4%;width: 40%;">
                    <tbody  style="width:100%;">
                        <tr class="row" style="background: #DCE6F2;">
                            <th class="col-12">미학습 관리</th>
                        </tr>
                        <tr class="row">
                            <th class="col-3">IXL</th>
                            <th class="col-3">리딩</th>
                            <th class="col-3">리특</th>
                            <th class="col-3">라이팅</th>
                        </tr>
                        <tr class="row">
                            <td class="col-3"> 임시3 (5%) </td>
                            <td class="col-3"> 임시3 (5%) </td>
                            <td class="col-3"> 임시3 (5%) </td>
                            <td class="col-3"> 임시3 (5%) </td>
                        </tr>
                    </tbody>
                </table>
                <table class="table text-center" id="teaching" style="margin-right: 4%; width: 25%;">
                    <tbody  style="width:100%;">
                        <tr class="row" style="background: #DCE6F2;">
                            <th class="col-12">상담*업무 관리</th>
                        </tr>
                        <tr class="row">
                            <th class="col-6">업무</th>
                            <th class="col-6">상담</th>
                        </tr>
                        <tr class="row">
                            <td class="col-3"> 3/10 </td>
                            <td class="col-3"> 5% </td>
                            <td class="col-3"> 3/10 </td>
                            <td class="col-3"> 5% </td>
                        </tr>
                    </tbody>
                </table>  
                <table class="table text-center" id="task"style="width: 25%;" >
                    <tbody  style="width:100%;">
                        <tr class="row" style="background: #DCE6F2;">
                            <th class="col-12">공지*문의 관리</th>
                        </tr>
                        <tr class="row">
                            <th class="col-6">공지</th>
                            <th class="col-6">문의</th>
                        </tr>
                        <tr class="row">
                            <td class="col-3">3/10 </td>
                            <td class="col-3"> 5% </td>
                            <td class="col-3">3/10 </td>
                            <td class="col-3"> 5% </td>
                        </tr>
                    </tbody>
                </table>      
            `;
            $('#ban_statistics').append(temp_ban_statistics);

            // 상담요청시 뷰 바꿔주는 부분 
            let temp_target_ban = `
            <p> 선택 - ${ban_name} <a></p>
            `;
            $('#target_bans').html(temp_target_ban);

        }
    })
}

// 반 id가 입력되면 view를 바꿔주는 함수 
function consulting_ban(b_id){

}