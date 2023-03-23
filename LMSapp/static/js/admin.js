// 처음 get 할때 뿌려질 정보 보내는 함수 
$(document).ready(function () {
    get_teacher_data()
    sodata()
    uldata()
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

function getTeacherInfo(t_id){
    $.ajax({
        type: "GET",
        url: "/admin/"+t_id,
        data: {},
        success: function (response) {
            if (response['status'] == 400){
                let no_data_title = `<h1> ${response.text} </h1>`
                $('#teacherModalLabel').html(no_data_title);
                return
            }
            let chart = response['chart_data']
            let name = response['teacher_info']['name'] + '(' + response['teacher_info']['engname'] + ')';
            let mobileno = response['teacher_info']['mobileno'];
            let email = response['teacher_info']['email']
            let tt = response['teacher_info']['total_student_num']
            $('#teachertitle').html(name + '선생님 현황 ( '+ mobileno +' | '+ email + ' )');
            let os = chart['outstudent_num']
            let ss = chart['switchstudent_num']
            let ttp = tt+os+ss
            
            $('#total_s_num').html(`관리중: ${tt}</br>이반 학생 수: ${ss}</br>퇴소 학생 수: ${os}`)
            
            $('.pie-chart1').css("background",`conic-gradient(#B9CDE5, #B9CDE5 ${tt/ttp*100}%, #D99694 ${tt/ttp*100}%, #D99694 ${tt/ttp*100+ss/ttp*100}%, #2B2B2B ${tt/ttp*100+ss/ttp*100}%, #2B2B2B)`)

            // 업무
            let total_todo = chart['total_todo']
            let total_done = chart['total_done']
            let task_p = chart['ttp']
            $('#task_chart').html(`${total_done}/${total_todo}`)
            $('#task_p').html(`${task_p}%`)

            // 상담
            let ttc = chart['ttc']
            let ttd = chart['ttd']
            let cp = chart['cp']
            $('#consulting_chart').html(`${ttd}/${ttc}`)
            $('#cp').html(`${cp}%`)

            // 미학습 상담
            let unlearned_ttc = chart['unlearned_ttc']
            let unlearned_ttd = chart['unlearned_ttd']
            let unlearned_cp = chart['unlearned_cp']
            $('#unlearned_chart').html(`${unlearned_ttc}/${unlearned_ttd}`)
            $('#unlearned_cp').html(`${unlearned_cp}%`)

            // 내 반
            let my_bans = response['my_bans'] 
            $('#mybaninfo').empty();
            for(i=0;i<my_bans.length;i++){
                let name = my_bans[i]['name'];
                let semester = my_bans[i]['semester'];
                let total_student_num = my_bans[i]['total_student_num'];
                let out_s = my_bans[i]['out_s'];
                let switch_s = my_bans[i]['switch_s'];
                let unlearned = my_bans[i]['unlearned'];

                let temp_baninfo = `
                    <td class="col-2">${name}</td>
                    <td class="col-1">${semester}학기</td>
                    <td class="col-1">${total_student_num}명</td>
                    <td class="col-2"> ${out_s}건</td>
                    <td class="col-2"> ${switch_s}건</td>
                    <td class="col-2"> ${unlearned}건</td>
                    <td class="col-2"> 임시3 (5%) </td>
                `;
                $('#mybaninfo').append(temp_baninfo);

            }
                                

        },
        error:function(xhr, status, error){
                alert(xhr.responseText);
            }
    })
}