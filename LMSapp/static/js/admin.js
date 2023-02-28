var totalData = 0; //총 데이터 수
var dataPerPage = 6;
var pageCount = 10; //페이징에 나타낼 페이지 수
var globalCurrentPage = 1; //현재 페이지
var data_list;
var totalData2 = 0; //총 데이터 수
var data_list2;

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

function sodata(){
    $.ajax({
        url: '/admin/sodata',
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
            data_list = response['sodata']
            if(data_list == '없음'){
                $("#so_data").html('퇴소 / 이반 발생이 없었습니다 😆');
            }else{
                totalData = data_list.length
                displayData(totalData, 1, dataPerPage,data_list,1);
                paging(totalData, dataPerPage, pageCount, 1,data_list,1);
            }
        }
    }) 
    
}

function uldata(){
    $.ajax({
        url: '/admin/uldata',
        type: 'GET',
        data: {},
        success: function(response){
            un = response['unlearned_num']
            $('#unlearned_num').css('width',`${un}%`);
            $('#unlearned_num').css('background-color','#EBF1DE');
            $('#un').html(`미학습발생 수: ${un}`);

            ixln = response['ixl_num']
            $('#ixl_num').css('width',`${ixln}%`);
            $('#ixl_num').css('background-color','#D7E4BD');
            $('#ixln').html(`IXL미학습: ${ixln}`);

            sreadn = response['sread_num']
            $('#sread_num').css('width',`${sreadn}%`);
            $('#sread_num').css('background-color','#C3D69B');
            $('#sreadn').html(`리특미진행: ${sreadn}`);

            readn = response['read_num']
            $('#read_num').css('width',`${readn}%`);
            $('#read_num').css('background-color','#77933C');
            $('#readn').html(`리딩부진: ${readn}`);

            intor = response['intoread_num']
            $('#intoread_num').css('width',`${intor}%`);
            $('#intoread_num').css('background-color','#4F6228');
            $('#in').html(`인투리딩: ${intor}`);

            wn = response['writing_num']
            $('#writing_num').css('width',`${wn}%`);
            $('#writing_num').css('background-color','#262F13');
            $('#writingn').html(`라이팅: ${wn}`);

            data_list = response['uldata']
            if(data_list == '없음'){
                $("#ul_data_box").html('미학습 발생 원생이 없었습니다 😆');
            }else{
                totalData = data_list.length
                displayData(totalData, 1, dataPerPage,data_list,2);
                paging(totalData, dataPerPage, pageCount, 1,data_list,2);
            }
        }
    }) 
    
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


function displayData2(totalData2, currentPage, dataPerPage,data_list2, consulting) {
    let chartHtml = "";

    //Number로 변환하지 않으면 아래에서 +를 할 경우 스트링 결합이 되어버림.. 
    currentPage = Number(currentPage);
    dataPerPage = Number(dataPerPage);
    let last_item = (currentPage - 1) * dataPerPage + dataPerPage;
    if( last_item > totalData2){
        last_item = totalData2
    }
    for (
        var i = (currentPage - 1) * dataPerPage; //11*5 = 55
        i < last_item; // 55+5
        i++
    ) {
        target = data_list2[i]
        let name = target['name'];
        let original = target['origin'];
        let mobileno = target['mobileno'];
        let parent_name_mobileno = target['pname'] +'('+target['pmobileno']+')';
        let reco_book_code = target['reco_book_code'];
        if( reco_book_code == null){
            reco_book_code = '✖️'
        }
         let answer_rate =  function(answer, all) {
                if(Object.is(answer/all, NaN)) return 0;
                else return answer/all*100;
            }
        let unlearned = consulting.filter( a => a.student_id == target.register_no).length;
        chartHtml +=`
        <td class="col-2">${name}(${original})</td>
        <td class="col-2">${mobileno} </td>
        <td class="col-3">${parent_name_mobileno}</td>
        <td class="col-2">${reco_book_code} </td>
        <td class="col-2">${unlearned}(${answer_rate(unlearned, consulting.length).toFixed(1)}%)</td><br>
        <td class="col-1" a href="#">✔️</td><br>
        `;
    } 
    $("#s_data").html(chartHtml);
}

function paging2(totalData2, dataPerPage, pageCount, currentPage, data_list2, consulting) {
    totalPage = Math.ceil(totalData2 / dataPerPage); //총 페이지 수

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
    displayCount = " 원생 명단 1 - " + totalPage + " 페이지 / " + totalData2 + "건";
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
        paging2(totalData2, dataPerPage, pageCount, selectedPage, data_list2, consulting);
        //글 목록 표시 재호출
        displayData2(totalData2, selectedPage, dataPerPage,data_list2, consulting);
    });
}
function getBanInfo(b_id){
    $('#student_data').show();
    $('#pagingul').show();
    $.ajax({
        type: "GET",
        url: "/manage/ban/"+b_id,
        data: {},
        success: function (response) {
            // let target_ban = response['target_ban']
            if (response['status'] == 400){
                let no_data_title = `<h1> ${response.text} </h1>`
                $('#s_data').html(no_data_title);
                $('#pagingul').hide();
                return
            }
            let students_num = response['students_num'];
            let ban_name = response['name'];
            let teacher_name = response['teacher_name']
            let teacher_e_name = response['teacher_e_name']
            let teacher_mobileno = response['teacher_mobileno']
            let teacher_email = response['teacher_email']
            let answer = Number(response['answer_alim'])
            let all_alim = Number(response['all_alim'])
            let answer_rate =  function(answer, all) {
                if(Object.is(answer/all, NaN)) return 0;
                else return answer/all*100;
            }
            // 이반 학생 
            let switch_student = response['switch_student']['data'].filter(a => a.ban_id == b_id).length;
            let all_s_student = response['switch_student']['data'].length;
            let out_student = response['out_student']['data'].filter(a => a.ban_id == b_id).length;
            let all_o_student = response['out_student']['data'].length;
            let notice = response['notice']
            let consulting = response['consulting']['data'].filter(a => a.ban_id == b_id)

            let u_consulting = response['consulting']['data'].filter(a => a.category_id < 100);
            let all_uc_consulting = u_consulting.length;
            let u_consulting_my = u_consulting.filter(a => a.ban_id == b_id);

            let consulting_ixl = u_consulting_my.filter(a => a.category_id == 1).length
            let consulting_reading = u_consulting_my.filter(a => a.category_id == 4).length
            let consulting_speacial = u_consulting_my.filter(a => a.category_id == 3).length
            let consulting_writing = u_consulting_my.filter(a => a.category_id == 6).length
            let consulting_homepage = u_consulting_my.filter(a => a.category_id == 2).length
            let consulting_intoreading = u_consulting_my.filter(a => a.category_id == 5 || a.category_id == 7).length
            let task = response['task']['data']
            // let switchstudent_num = response['switchstudent_num']
            // let switchstudent_num_p = response['switchstudent_num_p']
            // let outstudent_num = response['outstudent_num']
            // let outstudent_num_p = response['outstudent_num_p']
            // let unlearned_ttd = response['unlearned_ttd']
            // let unlearned_ttc = response['unlearned_ttc']
            
            let temp_title = `<h1> ${ban_name} 현황</h1>`
            $('#banModalLabel').html(temp_title);

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
            $('#profile_data').html(temp_profile_data);


            let temp_ban_data = `
            <table class="table text-center" style="width:100%;">
                <tbody  style="width:100%;">
                    <tr class="row">
                        <th class="col-3">현 원생 수</th>
                        <th class="col-3">이반</th>
                        <th class="col-3">퇴소</th>
                        <th class="col-3">미학습</th>
                    </tr>
                    <tr class="row">
                        <td class="col-3">${students_num}</td>
                        <td class="col-3">${switch_student}(${answer_rate(switch_student, all_s_student).toFixed(2)}%)</td>
                        <td class="col-3">${out_student}(${answer_rate(out_student, all_o_student).toFixed(2)}%)</td>
                        <td class="col-3">${u_consulting_my}(${answer_rate(u_consulting_my.length, all_uc_consulting).toFixed(2)}%) </td>
                    </tr>
                </tbody>
            </table>
            `;
            $('#ban_data').html(temp_ban_data);

            data_list2 = response['student_info']
            totalData2 = students_num

            displayData2(totalData2, 1, dataPerPage,data_list2, u_consulting_my);
            paging2(totalData2, dataPerPage, pageCount, 1,data_list2, u_consulting_my);

            let temp_ban_statistics = `
            <table class="table text-center" id="unlearned" style="margin-left:1%; margin-right: 4%;width: 40%;">
                    <tbody  style="width:100%;">
                        <tr class="row" style="background: #DCE6F2;">
                            <th class="col-12">미학습 관리</th>
                        </tr>
                        <tr class="row">
                            <th class="col-2">IXL</th>
                            <th class="col-2">리딩</th>
                            <th class="col-2">리특</th>
                            <th class="col-2">라이팅</th>
                            <th class="col-2">미접속</th>
                            <th class="col-2">인투리딩</th>
                        </tr>
                        <tr class="row">
                            <td class="col-2">${consulting_ixl}(${answer_rate(consulting_ixl, u_consulting_my.length).toFixed(2)}%)</td>
                            <td class="col-2">${consulting_reading}(${answer_rate(consulting_reading, u_consulting_my.length).toFixed(1)}%)</td>
                            <td class="col-2">${consulting_speacial}(${answer_rate(consulting_speacial, u_consulting_my.length).toFixed(1)}%) </td>
                            <td class="col-2">${consulting_writing}(${answer_rate(consulting_writing, u_consulting_my.length).toFixed(1)}%) </td>
                            <td class="col-2">${consulting_homepage}(${answer_rate(consulting_homepage, u_consulting_my.length).toFixed(1)}%) </td>
                            <td class="col-2">${consulting_intoreading}(${answer_rate(consulting_intoreading, u_consulting_my.length).toFixed(1)}%) </td>
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
                            <td class="col-3">${task.filter(a => a.done == 1).length}/${task.length}</td>
                            <td class="col-3">${answer_rate(task.filter(a => a.done == 1).length, task.length).toFixed(1)}%</td>
                            <td class="col-3">${consulting.filter(a => a.done == 1).length}/${consulting.length}</td>
                            <td class="col-3">${answer_rate(consulting.filter(a => a.done == 1).length, consulting.length).toFixed(1)}%</td>
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
                            <td class="col-6">${notice.length}</td>
                            <td class="col-3">${answer}/${all_alim} </td>
                            <td class="col-3">${answer_rate(answer, all_alim).toFixed(2)}%</td>
                        </tr>
                    </tbody>
                </table>      
            `;

            $('#ban_statistics').html(temp_ban_statistics);
        },
        error:function(xhr, status, error){
                alert(xhr.responseText);
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
            $('#total_s_num').html(`관리중 :${tt}`)
            let os = chart['outstudent_num']
            let ss = chart['switchstudent_num']
            let ttp = tt+os+ss
            let osp = tt/ttp*100
            let ssp = ss/ttp*100
            let tp = tt/ttp*100
            
            $('.chart-total-text1').html(`퇴소 학생 수:${os}`)
            $('.chart-total-text2').html(`이반 학생 수:${ss}`)
            $('.pie-chart1').css("width","100%")
            $('.pie-chart1').css("background",`conic-gradient(#B9CDE5, #B9CDE5 ${tp}%, #D99694 ${ssp}%, #D99694 ${ssp}%, #2B2B2B ${osp}%, #2B2B2B);`)

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