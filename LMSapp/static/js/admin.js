var totalData = 0; //총 데이터 수
var dataPerPage = 6;
var pageCount = 10; //페이징에 나타낼 페이지 수
var globalCurrentPage = 1; //현재 페이지
var data_list;

// 처음 get 할때 뿌려질 정보 보내는 함수 
$(document).ready(function () {
    draw_chart()
    sodata()
})
function draw_chart(){
    $.ajax({
        url: '/admin/chart',
        type: 'GET',
        data: {},
        success: function(response){
            sn = response['switch_num']
            $('#switch_num').css('width',`${sn}%`);
            $('#switch_num').css('background-color','#95B3D7');
            $('#sn').html(`이반 학생 수: ${sn}명`);

            on = response['outstudent_num']
            $('#outstudent_num').css('width',`${on}%`);
            $('#outstudent_num').css('background-color','#D99694');
            $('#on').html(`퇴소 학생 수: ${on}명`);

            // tn = response['total_num']
            $('#total_num').css('width',`${100}%`);
            $('#total_num').css('background-color','#B9CDE5');
            $('#tn').html(`총 학생 수: ${100}명`);

            un = response['unlearned_num']
            $('#unlearned_num').css('width',`${un}%`);
            $('#unlearned_num').css('background-color','#EBF1DE');
            $('#un').html(`미학습발생 수: ${un}`);

            ixln = response['ixl_num']
            $('#ixl_num').css('width',`${ixln}%`);
            $('#ixl_num').css('background-color','#D7E4BD');
            $('#ixln').html(`IXL미학습: ${ixln}`);

            sn = response['sread_num']
            $('#sread_num').css('width',`${sn}%`);
            $('#sread_num').css('background-color','#C3D69B');
            $('#sn').html(`리특미진행: ${sn}`);

            rn = response['read_num']
            $('#read_num').css('width',`${rn}%`);
            $('#read_num').css('background-color','#77933C');
            $('#rn').html(`리딩부진: ${rn}`);

            intor = response['intoread_num']
            $('#intoread_num').css('width',`${intor}%`);
            $('#intoread_num').css('background-color','#4F6228');
            $('#in').html(`인투리딩: ${intor}`);

            wn = response['writing_num']
            $('#writing_num').css('width',`${wn}%`);
            $('#writing_num').css('background-color','#262F13');
            $('#in').html(`인투리딩: ${wn}`);
        }
    }) 
}
function so_displayData(totalData, currentPage, dataPerPage,data_list) {
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
        <td class="col-1" a href="#">✔️</td><br>
        `;
    } 
    $("#sd_data").html(chartHtml);
}

function so_paging(totalData, dataPerPage, pageCount, currentPage, data_list) {
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

    $("#pagingul").html(pageHtml);
    let displayCount = "";
    displayCount = " 퇴소 이반 현황 1 - " + totalPage + " 페이지 / " + totalData + "건";
    $("#displayCount").text(displayCount);

    //페이징 번호 클릭 이벤트 
    $("#pagingul li a").click(function () {
        let $id = $(this).attr("id");
        selectedPage = $(this).text();

        if ($id == "next") selectedPage = next;
        if ($id == "prev") selectedPage = prev;

        //전역변수에 선택한 페이지 번호를 담는다...
        globalCurrentPage = selectedPage;

        //페이징 표시 재호출
        paging(totalData, dataPerPage, pageCount, selectedPage, data_list);
        //글 목록 표시 재호출
        displayData(totalData, selectedPage, dataPerPage,data_list);
    });
}

function sodata(){
    $.ajax({
        url: '/admin/sodata',
        type: 'GET',
        data: {},
        success: function(response){
            data_list = response['sodata']
            totalData = data_list.length
            console.log(totalData)
            console.log(data_list)
            so_displayData(totalData, 1, dataPerPage,data_list);
            so_paging(totalData, dataPerPage, pageCount, 1,data_list);
        }
    }) 
    
}