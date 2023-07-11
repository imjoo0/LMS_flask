// const today = new Date();
var selectedBanList = [];
var selectedStudentList = [];
// API 호출
function getParameter(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}
async function get_all_consultingcate() {
    try {
        const response = await $.ajax({
            url: '/manage/consulting_category',
            type: 'GET',
            data: {},
        });
        consultingcateData = response['consulting_category']
    } catch (error) {
        alert('Error occurred while retrieving data.');
    }
}
async function get_all_taskcate() {
    try {
        const response = await $.ajax({
            url: '/manage/task_category',
            type: 'GET',
            data: {},
        });
        taskcateData = response['task_category']
    } catch (error) {
        alert('Error occurred while retrieving data.');
    }
}
// 처음 get 할때 뿌려질 정보 보내는 함수 
$(document).ready(async function () {
    $('#maininloading').show()
    $('#main').hide()
    $('#inloading').show()
    $('#semester_pagination').hide()
    $('.nav-link').on('click', function () {
        $('.nav-link').removeClass('active');
        $(this).addClass('active');
    })
    var target = document.getElementById('request_consultingban_listbox');
    let modalObserver = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.target.style.cssText.includes('display: none;')){
                $('#my_consulting_request .modal-dialog').addClass('modal-handling');
                $('#my_consulting_request .modal-dialog').addClass('modal-xl');
                $('#my_consulting_request .modal-dialog').removeClass('modal-lg');
                $('#my_consulting_request .modal-dialog').attr('style','max-width:90%;');
            } else {
                $('#my_consulting_request .modal-dialog').removeClass('modal-handling');
                $('#my_consulting_request .modal-dialog').removeClass('modal-xl');
                $('#my_consulting_request .modal-dialog').addClass('modal-lg');
                $('#my_consulting_request .modal-dialog').attr('style',null);
            }
        })
    })
    let config = {
        attributes: true,
    };
    modalObserver.observe(target, config);
})
$(window).on('load', async function () {
    try {
        if(!getIsFetching()){
            try{     
                setIsFetching(true);
                await get_all_data()
                let q_type =  getParameter("q_type");
                let q_id = getParameter("q_id");
                if(q_id !== "" && q_type !== ""){
                    show_modal(q_id)
                }
                // get_question_list(q_type)
            }catch (error) {
                alert('Error occurred while retrieving data2.');
            }finally {
                setIsFetching(false);
            }
        }
    } catch (error) {
        console.log(error)
        alert(error)
    }
});
async function get_total_data() {
    $('#maininloading').hide()
    $('#main').show()
    $('#semester').hide();
    $('#detailban').show();
    $('#questionbox').hide()
    $('#ulbox').hide()
    $('#target_ban_info_body').hide()
    $('#inloading').hide();
    $('#semester_pagination').show();
    $('#target_ban_info_body').show();
    try {
        total_student_num = Number(banData[0].total_student_num)
        // switchstudent_num = switchstudentData.length
        // 학기 별 원생
        onesemester = total_student_num != 0 ? banData.filter(e => e.semester == 1) : 0
        fivesemester = total_student_num != 0 ? banData.filter(e => e.semester == 2) : 0
        ninesemester = total_student_num != 0 ? banData.filter(e => e.semester == 0) : 0

        // 학기별 원생수 및 퇴소 원생 수 
        onesemester_total = onesemester[0].semester_student_num
        oneoutnum = onesemester.reduce((acc, item) => acc + item.out_student_num, 0);
        fivesemester_total = fivesemester[0].semester_student_num
        fiveoutnum = fivesemester.reduce((acc, item) => acc + item.out_student_num, 0);

        ninesemester_total = ninesemester[0].semester_student_num
        nineoutnum = ninesemester.reduce((acc, item) => acc + item.out_student_num, 0);

        let semester_student_table = `
            <table>
                <tr>
                    <th class="need"></th>
                    <th>초기 등록 원생 수</th>
                    <th>현재 원생 수</th>
                    <th>중도하차 원생 수 (하차율)</th>
                    <th>학기 별 반 리스트</th>
                </tr>
                <tr>
                    <th class="need">전체</th>
                    <td>${total_student_num}명</td>
                    <td>${total_student_num - totalOutnum}명</td>
                    <td>${totalOutnum}명(${answer_rate(totalOutnum, total_student_num).toFixed(2)}%)</td>
                    <td><span class='cursor-pointer fs-4' onclick="semesterShow(${3})">📜 </span>
                    </td>
                </tr>
                <tr>
                    <th class="need">1월 학기</th>
                    <td>${onesemester_total}명</td>
                    <td>${onesemester_total - oneoutnum}명</td>
                    <td>${oneoutnum}명(${answer_rate(oneoutnum, onesemester_total).toFixed(2)}%)</td>
                    <td><span class='cursor-pointer fs-4' onclick="semesterShow(${1})">📜</span>
                    </td>
                </tr>
                <tr>
                    <th class="need">5월 학기</th>
                    <td>${fivesemester_total}명</td>
                    <td>${fivesemester_total - fiveoutnum}명</td>
                    <td>${fiveoutnum}명(${answer_rate(fiveoutnum, fivesemester_total).toFixed(2)}%)</td>
                    <td><span class='cursor-pointer fs-4' onclick="semesterShow(${2})">📜</span>
                    </td>
                </tr>
                <tr>
                    <th>9월 학기</th>
                    <td>${ninesemester_total}명</td>
                    <td>${ninesemester_total - nineoutnum}명</td>
                    <td>${nineoutnum}명(${answer_rate(nineoutnum, ninesemester_total).toFixed(2)}%)</td>
                    <td><span class='cursor-pointer fs-4' onclick="semesterShow(${0})">📜</span>
                    </td>
                </tr>
            </table>
        `;
        $('#semester-student-table').html(semester_student_table);

        var chart = Chart.getChart('semester-student-chart')
        if (chart) {
            chart.destroy()
        }
        // PURPLE 섹션 차트 그리기
        let ctx = document.getElementById('semester-student-chart').getContext('2d');
        let semesterStudentChart = new Chart(ctx, {
            type: 'scatter',
            data: {
                labels: ['퍼플 총 원생', '1월 학기', '5월 학기', '9월 학기'],
                datasets: [{
                    type: 'bar',
                    label: '원생 수',
                    data: [total_student_num - totalOutnum, onesemester_total - oneoutnum, fivesemester_total - fiveoutnum, ninesemester_total - nineoutnum],
                    backgroundColor: ['#F66F5B77', '#FFBCE277', '#FE85AB77', '#C24F7777'],
                    borderColor: ['#F66F5B', '#FFBCE2', '#FE85AB', '#C24F77'],
                    borderWidth: 2
                }, {
                    type: 'line',
                    label: '퇴소 원생 수',
                    data: [totalOutnum, oneoutnum, fiveoutnum, nineoutnum],
                    fill: false,
                    borderColor: '#F23966cc',
                    borderWidth: 2
                }]
            },
            options: {
                maxBarThickness: 60,
                interaction: {
                    mode: 'index',
                },
                plugins: {
                    tooltip: {
                        padding: 10,
                        bodySpacing: 5,
                        bodyFont: {
                            font: {
                                family: "pretendard",
                            }
                        },
                        usePointStyle: true,
                        filter: (item) => item.parsed.y !== null,
                        callbacks: {
                            label: (context) => {
                                return ' ' + context.parsed.y + '명';
                            },
                        },
                    },
                },
                scales: {
                    y: {
                        afterDataLimits: (scale) => {
                            scale.max = scale.max * 1.2;
                        },
                        axis: 'y',
                        display: true,
                        position: 'top',
                        title: {
                            display: true,
                            align: 'end',
                            color: '#2b2b2b',
                            font: {
                                size: 10,
                                family: "pretendard",
                                weight: 500,
                            },
                            text: '단위 : 명'
                        }
                    }
                }
            }
        });
        // console.log(studentsData)
        semesterShow(3);
        
    }catch (error) {
        alert('Error occurred while retrieving data.');
    }finally{
        connectSocket()
    }
}
function semesterShow(semester) {
    $('#ban_search_input').off('keyup');
    $('#semester').show();
    if (semester == 0) {
        $('.semester_s').html('9월 학기');
        resultData = ninesemester;
    } else if (semester == 1) {
        $('.semester_s').html('1월 학기');
        resultData = onesemester;
    } else if (semester == 2) {
        $('.semester_s').html('5월 학기');
        resultData = fivesemester;
    } else {
        $('.semester_s').html('전체 반')
        resultData = banData;
    }
    var temp_semester_banlist = '';
    $.each(resultData, function (index, item) {
        let teacher_name = item.teacher_engname + '( ' + item.teacher_name + ' )'
        item.total_out_num_per = answer_rate(item.out_student_num, totalOutnum).toFixed(2);
        temp_semester_banlist += `
        <td class="col-2">${item.name}</td>
        <td class="col-2">${teacher_name}</td>
        <td class="col-1">${item.student_num}</td>
        <td class="col-1">${item.first_student_num}</td>
        <td class="col-1">${item.out_student_num}(<strong>${item.out_num_per}%</strong>)</td>
        <td class="col-1">${item.hold_student_num}</td>
        <td class="col-2"> 총: ${item.total_out_num}명 ( 퇴소 : ${item.out_student_num} / 유보 : ${item.hold_student_num} )</td>
        <td class="col-2"><strong>${item.total_out_num_per}%</strong></td>`
    });
    $('#for_print_semester_list').html(temp_semester_banlist)
    ResultpaginationOptions = {
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        pageClassName: 'float-end',
        callback: function (data, pagination) {
            var temp_semester_banlist = '';
            $.each(data, function (index, item) {
                let teacher_name = item.teacher_engname + '( ' + item.teacher_name + ' )'
                temp_semester_banlist += `
                <td class="col-2">${item.name}</td>
                <td class="col-2">${teacher_name}</td>
                <td class="col-1">${item.student_num}</td>
                <td class="col-1">${item.first_student_num}</td>
                <td class="col-1">${item.out_student_num}(<strong>${item.out_num_per}%</strong>)</td>
                <td class="col-1">${item.hold_student_num}</td>
                <td class="col-2"> 총: ${item.total_out_num}명 ( 퇴소 : ${item.out_student_num} / 유보 : ${item.hold_student_num} )</td>
                <td class="col-1"><strong>${item.total_out_num_per}%</strong></td>
                <td class="col-1" data-bs-toggle="modal" data-bs-target="#teacherinfo" onclick="get_ban_info(${item.teacher_id},${item.ban_id})"><span class="cursor-pointer">👉</span></td>;`;
            });
            $('#semester_banlist').html(temp_semester_banlist)
        }
    };
    
    SemesterContainer = $('#semester_pagination')
    SemesterContainer.pagination(Object.assign(ResultpaginationOptions, { 'dataSource': resultData }))

    $('#ban_search_input').on('keyup', function () {
        var searchInput = $(this).val().toLowerCase();
        var filteredData = resultData.filter(function (data) {
            return (data.hasOwnProperty('name') && data.name.toLowerCase().indexOf(searchInput) !== -1) || (data.hasOwnProperty('teacher_name') && data.teacher_name.toLowerCase().indexOf(searchInput) !== -1) || (data.hasOwnProperty('teacher_engname') && data.teacher_engname.toLowerCase().indexOf(searchInput) !== -1);
        });
        SemesterContainer.pagination('destroy');
        SemesterContainer.pagination(Object.assign(ResultpaginationOptions, { 'dataSource': filteredData }));
    });
}
function sort_data(sort_op) {
    switch (sort_op) {
        case "ban_sort":
            $('#ban_sort').html('<strong>반 ( 이름순 정렬👇 )</strong>')
            $('#teacher_sort').html('선생님 ( 이름 순 정렬👉 )')
            $('#unlearned_sort').html('배정 원생 수 ( 많은 순 정렬👉 )')
            $('#tout_sort').html('반 퇴소율 ( 반 퇴소율 높은 순 정렬👉 )')
            $('#out_sort').html('퇴소율 ( 높은 순 정렬👉 )')
            resultData.sort(function (a, b) {
                var nameA = a.name.toUpperCase(); // 대소문자 구분 없이 비교하기 위해 대문자로 변환
                var nameB = b.name.toUpperCase(); // 대소문자 구분 없이 비교하기 위해 대문자로 변환
                if (nameA < nameB) {
                    return -1;
                }
                if (nameA > nameB) {
                    return 1;
                }
                return 0;
            });
            break;

        case "teacher_sort":
            $('#ban_sort').html('반 ( 이름순 정렬👉 )')
            $('#teacher_sort').html('<strong>선생님 ( 이름 순 정렬👇 )</strong>')
            $('#unlearned_sort').html('배정 원생 수 ( 많은 순 정렬👉 )')
            $('#tout_sort').html('반 퇴소율 ( 반 퇴소율 높은 순 정렬👉 )')
            $('#out_sort').html('퇴소율 ( 높은 순 정렬👉 )')
            resultData.sort(function (a, b) {
                var nameA = a.teacher_name.toUpperCase(); // 대소문자 구분 없이 비교하기 위해 대문자로 변환
                var nameB = b.teacher_name.toUpperCase(); // 대소문자 구분 없이 비교하기 위해 대문자로 변환
                if (nameA < nameB) {
                    return -1;
                }
                if (nameA > nameB) {
                    return 1;
                }
                return 0;
            });
            break;

        case "unlearned_sort":
            $('#ban_sort').html('반 ( 이름순 정렬👉 )')
            $('#teacher_sort').html('선생님 ( 이름 순 정렬👉 )')
            $('#unlearned_sort').html('<strong>관리 원생 수 ( 많은 순 정렬👇 )</strong>')
            $('#tout_sort').html('반 퇴소율 ( 반 퇴소율 높은 순 정렬👉 )')
            $('#out_sort').html('퇴소율 ( 높은 순 정렬👉 )')
            resultData.sort(function (a, b) {
                return b.student_num - a.student_num;
            });
            break;
        case "tout_sort":
            $('#ban_sort').html('반 ( 이름순 정렬👉 )')
            $('#teacher_sort').html('선생님 ( 이름 순 정렬👉 )')
            $('#unlearned_sort').html('배정 원생 수 ( 많은 순 정렬👉 )')
            $('#tout_sort').html('<strong>반 퇴소율 ( 반 퇴소율 높은 순 정렬👇 )</strong>')
            $('#out_sort').html('전체 퇴소율 ( 높은 순 정렬👉 )')
            resultData.sort(function (a, b) {
                return b.out_num_per - a.out_num_per;
            });
            break;
        case "out_sort":
            $('#ban_sort').html('반 ( 이름순 정렬👉 )')
            $('#teacher_sort').html('선생님 ( 이름 순 정렬👉 )')
            $('#unlearned_sort').html('배정 원생 수 ( 많은 순 정렬👉 )')
            $('#tout_sort').html('반 퇴소율 ( 반 퇴소율 높은 순 정렬👉 )')
            $('#out_sort').html('<strong>전체 퇴소율 ( 높은 순 정렬👇 )</strong>')
            resultData.sort(function (a, b) {
                return b.total_out_num_per - a.total_out_num_per;
            });
            break;
    }

    // 데이터 정렬 후 페이지네이션 다시 설정
    SemesterContainer.pagination("destroy");
    SemesterContainer.pagination(
        Object.assign(ResultpaginationOptions, { dataSource: resultData })
    );
}
function download_banlist() {
    var con_val = confirm('아래 리스트를 다운로드 하시겠습니까?');
    if (con_val) {
      // 테이블을 포함하는 HTML 요소 선택
      var element = document.getElementById('for_print_semester');
    //   element.style.display = 'block';
      // html2pdf 옵션 설정
      var options = {
        margin: 10,
        filename: 'semester_list.pdf',
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };
  
      // HTML 요소를 PDF로 변환하여 다운로드
      html2pdf().from(element).set(options).save();
    //   element.style.display = 'none';
    }
}
function download_excellist(type) {
    let downloadData;
    if (type == 0) {
        downloadData = banData.slice();
    } else if (semester == 1) {
        downloadData = onesemester.slice();
    } else if (semester == 5) {
        downloadData = fivesemester.slice();
    } else {
        downloadData = ninesemester.slice();
    }
    var keysToRemove = ['ban_id', 'name_numeric','semester','semester_student_num','teacher_id','total_student_num','teacher_email','teacher_mobileno'];
    downloadData = downloadData.map(function(item){
        var filtered = Object.keys(item)
        .filter(key => !keysToRemove.includes(key))
        .reduce((obj, key) => {
        obj[key] = item[key];
            return obj;
        }, {});
        return filtered;
    })
    downloadData = downloadData.map(function(item){
        return {
            반이름 : item.name,
            담임T : item.teacher_name +'( '+item.teacher_engname +' )' ,
            퇴소인원: item.out_student_num,
            최초배정원생수: item.student_num,
            관리중원생수: item.first_student_num,
            중도하차원생수: item.student_num,
            유보중원생수: item.student_num,
            총이탈원생수: item.total_out_num,
            반하차율: item.out_num_per,
            하차율: item.total_out_num_per
        };
    })
    var workbook = XLSX.utils.book_new();
    var worksheet = XLSX.utils.json_to_sheet(downloadData);

    // 워크북에 워크시트 추가
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // 엑셀 파일로 변환
    var excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    // Blob 생성
    var blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // 다운로드 링크 생성
    var url = window.URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = '반리스트.xlsx';
    link.click();
}   
async function get_ban_info(t_id,b_id) {
    $('.mo_inloading').show()
    $('.monot_inloading').hide()
    // 데이터 불러오기 
    if(!consultingData){
        consultingData = []
        tempConsultingData = []
        // 평균 api 호출 횟수 15번 
        let consultingTeacherChunkWorker = new Worker("../static/js/consultings_teacher_worker.js");  
        let teacher_id_history = t_id
        function fetchData(t_id){
            consultingTeacherChunkWorker.postMessage({t_id,teacher_id_history})
        }
        consultingTeacherChunkWorker.onmessage = function (event) {
            if (consultingCount != undefined) {
                consultingCount = event.data.total_count
                consultingData = consultingData.concat(event.data.consulting);
                return; // 조건을 만족하면 함수 종료
            }
            consultingCount = event.data.total_count
            consultingData = event.data.consulting;
            fetchData(0);
            if(taskData){
                if( (taskData.length < taskCount) && !(taskData.some(c=>c.teacher_id == t_id))){
                    if ((temptaskData) && (temptaskData.some(c=>c.teacher_id == t_id))){
                        return show_ban_report(t_id,b_id,consultingData,temptaskData)
                    }else{
                        let teacher_id_history = 0
                        let taskTeacherChunkWorker = new Worker("../static/js/tasks_teacher_worker.js");   
                        taskTeacherChunkWorker.postMessage({t_id,teacher_id_history})
                        taskTeacherChunkWorker.onmessage = function (event) {
                            taskCount = event.data.total_count
                            let data = event.data.task
                            data.forEach(item=>{
                                item.done_code = 0
                                let done_date = new Date(item.created_at);
                                done_date =  new Date(done_date.getFullYear(), done_date.getMonth(), done_date.getDate()).setHours(0, 0, 0, 0);
                                if( (item.created_at != null) && ( (item.cycle != todayyoil && sevenDays <= done_date)||(item.cycle == todayyoil && today == done_date) )){
                                    item.done_code = 1
                                }
                            })
                            temptaskData = temptaskData.concat(data);
                            return show_ban_report(t_id,b_id,consultingData,temptaskData)
                        };
                    }
                }else{
                    show_ban_report(t_id,b_id,consultingData,taskData)   
                }
            }else{
                taskData = []
                temptaskData = []
                let taskTeacherChunkWorker = new Worker("../static/js/tasks_teacher_worker.js");  
                let teacher_id_history = t_id
                function taskfetchData(t_id){
                    taskTeacherChunkWorker.postMessage({t_id,teacher_id_history})
                }
                taskfetchData(t_id);
                taskTeacherChunkWorker.onmessage = function (event){
                    let data = event.data.task
                    data.forEach(item=>{
                        item.done_code = 0
                        let done_date = new Date(item.created_at);
                        done_date =  new Date(done_date.getFullYear(), done_date.getMonth(), done_date.getDate()).setHours(0, 0, 0, 0);
                        if( (item.created_at != null) && ( (item.cycle != todayyoil && sevenDays <= done_date)||(item.cycle == todayyoil && today == done_date) )){
                            item.done_code = 1
                        }   
                    })
                    if (taskCount != undefined) {
                        taskCount = event.data.total_count
                        taskData = taskData.concat(data);
                        return; // 조건을 만족하면 함수 종료
                    }else{
                        taskCount = event.data.total_count
                        taskData = data;
                    }
                    taskfetchData(0);
                    show_ban_report(t_id,b_id,consultingData,taskData)
                }
            }
        };
        fetchData(t_id);
    }else{
        if( (consultingData.length < consultingCount) && !(consultingData.some(c=>c.teacher_id == t_id))){
            if ((tempConsultingData) && (tempConsultingData.some(c=>c.teacher_id == t_id))){
                if(taskData){
                    if( (taskData.length < taskCount) && !(taskData.some(c=>c.teacher_id == t_id))){
                        if ((temptaskData) && (temptaskData.some(c=>c.teacher_id == t_id))){
                            return show_ban_report(t_id,b_id,tempConsultingData,temptaskData)
                        }else{
                            let teacher_id_history = 0
                            let taskTeacherChunkWorker = new Worker("../static/js/tasks_teacher_worker.js");   
                            taskTeacherChunkWorker.postMessage({t_id,teacher_id_history})
                            taskTeacherChunkWorker.onmessage = function (event) {
                                let data = event.data.task
                                data.forEach(item=>{
                                    item.done_code = 0
                                    let done_date = new Date(item.created_at);
                                    done_date =  new Date(done_date.getFullYear(), done_date.getMonth(), done_date.getDate()).setHours(0, 0, 0, 0);
                                    if( (item.created_at != null) && ( (item.cycle != todayyoil && sevenDays <= done_date)||(item.cycle == todayyoil && today == done_date) )){
                                        item.done_code = 1
                                    }   
                                })
                                temptaskData = temptaskData.concat(data);
                                return show_ban_report(t_id,b_id,tempConsultingData,temptaskData)
                            };
                        }
                    }else{
                        show_ban_report(t_id,b_id,tempConsultingData,taskData)   
                    }
                }else{
                    taskData = []
                    temptaskData = []
                    let taskTeacherChunkWorker = new Worker("../static/js/tasks_teacher_worker.js");  
                    let teacher_id_history = t_id
                    function taskfetchData(t_id){
                        taskTeacherChunkWorker.postMessage({t_id,teacher_id_history})
                    }
                    taskfetchData(t_id);
                    taskTeacherChunkWorker.onmessage = function (event){
                        let data = event.data.task
                        data.forEach(item=>{
                            item.done_code = 0
                            let done_date = new Date(item.created_at);
                            done_date =  new Date(done_date.getFullYear(), done_date.getMonth(), done_date.getDate()).setHours(0, 0, 0, 0);
                            if( (item.created_at != null) && ( (item.cycle != todayyoil && sevenDays <= done_date)||(item.cycle == todayyoil && today == done_date) )){
                                item.done_code = 1
                            }   
                        })
                        if (taskCount != undefined) {
                            taskCount = event.data.total_count  
                            taskData = taskData.concat(data);
                            return; // 조건을 만족하면 함수 종료
                        }else{
                            taskCount = event.data.total_count  
                            taskData = data;
                        }
                        taskfetchData(0);
                        show_ban_report(t_id,b_id,tempConsultingData,taskData)
                    }
                }
            }else{
                let teacher_id_history = 0
                let consultingTeacherChunkWorker = new Worker("../static/js/consultings_teacher_worker.js");  
                consultingTeacherChunkWorker.postMessage({t_id,teacher_id_history})
                consultingTeacherChunkWorker.onmessage = function (event) {
                    tempConsultingData = tempConsultingData.concat(event.data.consulting);
                    // return show_ban_report(t_id,b_id,tempConsultingData)
                    if(taskData){
                        if( (taskData.length < taskCount) && !(taskData.some(c=>c.teacher_id == t_id))){
                            if ((temptaskData) && (temptaskData.some(c=>c.teacher_id == t_id))){
                                return show_ban_report(t_id,b_id,tempConsultingData,temptaskData)
                            }else{
                                let teacher_id_history = 0
                                let taskTeacherChunkWorker = new Worker("../static/js/tasks_teacher_worker.js");   
                                taskTeacherChunkWorker.postMessage({t_id,teacher_id_history})
                                taskTeacherChunkWorker.onmessage = function (event) {
                                    let data = event.data.task
                                    data.forEach(item=>{
                                        item.done_code = 0
                                        let done_date = new Date(item.created_at);
                                        done_date =  new Date(done_date.getFullYear(), done_date.getMonth(), done_date.getDate()).setHours(0, 0, 0, 0);
                                        if( (item.created_at != null) && ( (item.cycle != todayyoil && sevenDays <= done_date)||(item.cycle == todayyoil && today == done_date) )){
                                            item.done_code = 1
                                        }   
                                    })
                                    temptaskData = temptaskData.concat(data);
                                    return show_ban_report(t_id,b_id,tempConsultingData,temptaskData)
                                };
                            }
                        }else{
                            show_ban_report(t_id,b_id,tempConsultingData,taskData)   
                        }
                    }else{
                        taskData = []
                        temptaskData = []
                        let taskTeacherChunkWorker = new Worker("../static/js/tasks_teacher_worker.js");  
                        let teacher_id_history = t_id
                        function taskfetchData(t_id){
                            taskTeacherChunkWorker.postMessage({t_id,teacher_id_history})
                        }
                        taskfetchData(t_id);
                        taskTeacherChunkWorker.onmessage = function (event){
                            let data = event.data.task
                            data.forEach(item=>{
                                item.done_code = 0
                                let done_date = new Date(item.created_at);
                                done_date =  new Date(done_date.getFullYear(), done_date.getMonth(), done_date.getDate()).setHours(0, 0, 0, 0);
                                if( (item.created_at != null) && ( (item.cycle != todayyoil && sevenDays <= done_date)||(item.cycle == todayyoil && today == done_date) )){
                                    item.done_code = 1
                                }   
                            })
                            if (taskCount != undefined) {
                                taskCount = event.data.total_count
                                taskData = taskData.concat(event.data.task);
                                return; // 조건을 만족하면 함수 종료
                            }else{
                                taskCount = event.data.total_count
                                taskData = event.data.task;
                            }
                            taskfetchData(0);
                            show_ban_report(t_id,b_id,tempConsultingData,taskData)
                        }
                    }
                };
            }
        }else{
            if(taskData){
                if( (taskData.length < taskCount) && !(taskData.some(c=>c.teacher_id == t_id))){
                    if ((temptaskData) && (temptaskData.some(c=>c.teacher_id == t_id))){
                        return show_ban_report(t_id,b_id,consultingData,temptaskData)
                    }else{
                        let teacher_id_history = 0
                        let taskTeacherChunkWorker = new Worker("../static/js/tasks_teacher_worker.js");   
                        taskTeacherChunkWorker.postMessage({t_id,teacher_id_history})
                        taskTeacherChunkWorker.onmessage = function (event) {
                            let data = event.data.task
                            data.forEach(item=>{
                                item.done_code = 0
                                let done_date = new Date(item.created_at);
                                done_date =  new Date(done_date.getFullYear(), done_date.getMonth(), done_date.getDate()).setHours(0, 0, 0, 0);
                                if( (item.created_at != null) && ( (item.cycle != todayyoil && sevenDays <= done_date)||(item.cycle == todayyoil && today == done_date) )){
                                    item.done_code = 1
                                }   
                            })
                            temptaskData = temptaskData.concat(data);
                            return show_ban_report(t_id,b_id,consultingData,temptaskData)
                        };
                    }
                }else{
                    show_ban_report(t_id,b_id,consultingData,taskData)   
                }
            }else{
                taskData = []
                temptaskData = []
                let taskTeacherChunkWorker = new Worker("../static/js/tasks_teacher_worker.js");  
                let teacher_id_history = t_id
                function taskfetchData(t_id){
                    taskTeacherChunkWorker.postMessage({t_id,teacher_id_history})
                }
                taskfetchData(t_id);
                taskTeacherChunkWorker.onmessage = function (event){
                    let data = event.data.task
                    data.forEach(item=>{
                        item.done_code = 0
                        let done_date = new Date(item.created_at);
                        done_date =  new Date(done_date.getFullYear(), done_date.getMonth(), done_date.getDate()).setHours(0, 0, 0, 0);
                        if( (item.created_at != null) && ( (item.cycle != todayyoil && sevenDays <= done_date)||(item.cycle == todayyoil && today == done_date) )){
                            item.done_code = 1
                        }   
                    })
                    if (taskCount != undefined) {
                        taskCount = event.data.total_count
                        taskData = taskData.concat(data);
                        return; // 조건을 만족하면 함수 종료
                    }else{
                        taskCount = event.data.total_count
                        taskData = data;
                    }
                    taskfetchData(0);
                    show_ban_report(t_id,b_id,consultingData,taskData)
                }
            }
        }
    }
}
async function show_ban_report(t_id,b_id,target_consultingdata,target_taskdata){
    $('#report_type').val(0);  // 선택된 값이 0으로 변경됨
    $('#class_list').hide()
    let copy_data = target_consultingdata.slice();
    let copy_taskdata = target_taskdata.slice();
    if (Chart.getChart('total-chart-element-studentnum')) {
        Chart.getChart('total-chart-element-studentnum').destroy()
    }
    if (Chart.getChart('total-chart-element-unlearnednum')) {
        Chart.getChart('total-chart-element-unlearnednum').destroy()
    }
    let info = banData.filter(b => b.ban_id == b_id)[0]
    // 예외처리 
    if (!info){
        let no_data_title = `<h1> ${response.text} </h1>`
        $('#teacherModalLabel').html(no_data_title);
        alert('반 정보가 없습니다')
        return
    }
    // 리포트 타입에 따라 화면 변화 
    $('#report_type').change(function() {
        selectedValue = $(this).val();
        if(selectedValue == 0){
            return show_ban_report(t_id,b_id,target_consultingdata,target_taskdata)
        }else{
            return show_teacher_report(t_id,b_id,target_consultingdata,target_taskdata)
        }
    });
    $('.mo_inloading').hide()
    $('.monot_inloading').show()
    // 각 태그 이름 바꾸기 
    $('#teachertitle').html(`${info.name}  Class  Report`)
    $('#ban_nametag').html(`<span>${info.name} - ${info.teacher_engname}(${info.teacher_name}) 선생님</span>`)
    $('#teacher_infobox').html('Class Manage')

    let temp_info_student_num = `
        <span>  관리중:${info.first_student_num}</span><br>
        <span>* 유보:${info.hold_student_num}</span><br>
        <span>* 중도하차:${info.out_student_num}</span>
    `
    $('#teacher_info_student_num').html(temp_info_student_num)
    

    let ctx = document.getElementById('total-chart-element-studentnum').getContext('2d');
    if(info.first_student_num == 0){
        let BanChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['관리중인 원생이 없습니다'],
                datasets: [
                    {
                        data: [100],
                        backgroundColor: ['#F5EFE7'],
                        hoverOffset: 1,
                    },
                ],
            },
            options: {
                maintainAspectRatio: false,
                aspectRatio: 1,
                plugins: {
                    legend: {
                        display: false,
                    },
                },
                responsive: true,
                width: 500,
                height: 500,
            },
        })
    }else{
        let BanChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['관리중', '유보', '중도하차'],
                datasets: [
                    {
                        data: [info.first_student_num, info.hold_student_num, info.out_student_num],
                        backgroundColor: ['#3C486B', '#F9D949', '#F45050'],
                        hoverOffset: 3,
                    },
                ],
            },
            options: {
                maintainAspectRatio: false,
                aspectRatio: 1,
                plugins: {
                    legend: {
                        display: false,
                    },
                },
                responsive: true,
                width: 500,
                height: 500,
            },
        })
    }
    
    let banconsultingData = copy_data.filter(c => c.ban_id == b_id && new Date(c.startdate).setHours(0, 0, 0, 0) <= today)
    // let banconsultaskData = banconsultingData.filter(c =>  c.category_id > 100)
    let banunlearnedData = banconsultingData.filter(c => c.category_id < 100)
    let unlearned_ttc = null
    unlearned_ttc = banunlearnedData.length
    //
    let temp_info_ulearned_num = `<span>미학습:${unlearned_ttc}</span><br>`
    if(unlearned_ttc == 0){
        let ctx_u = document.getElementById('total-chart-element-unlearnednum').getContext('2d');
        let UnlearnedChart = new Chart(ctx_u, {
            type: 'doughnut',
            data: {
                labels: ['미학습 발생이 없습니다'],
                datasets: [
                    {
                        data: [100],
                        backgroundColor: ['#C2DEDC'],
                        hoverOffset: 1,
                    },
                ],
            },
            options: {
                maintainAspectRatio: false,
                aspectRatio: 1,
                plugins: {
                    legend: {
                        display: false,
                    },
                },
                responsive: true,
                width: 500,
                height: 500,
            },
        })
    }else{
        let data_array = []
        let unlearned_cate = [...new Set(banunlearnedData.map(item => item.category))];
        unlearned_cate.forEach((category) => {
            let num = banunlearnedData.filter(u => u.category == category).length
            temp_info_ulearned_num += `<span>* ${category} : ${num} 건</span><br>`
            data_array.push(num)
        })
    
        let ctx_u = document.getElementById('total-chart-element-unlearnednum').getContext('2d');
        let UnlearnedChart = new Chart(ctx_u, {
            type: 'doughnut',
            data: {
                labels: unlearned_cate,
                datasets: [
                    {
                        data: data_array,
                        backgroundColor: ['#89375F', '#BA90C6', '#BACDDB', '#E8A0BF', '#F3E8FF', '#CE5959'],
                        hoverOffset: unlearned_cate.length,
                    },
                ],
            },
            options: {
                maintainAspectRatio: false,
                aspectRatio: 1,
                plugins: {
                    legend: {
                        display: false,
                    },
                },
                responsive: true,
                width: 500,
                height: 500,
            },
        })
    } 
    
    $('#teacher_info_unlearned_num').html(temp_info_ulearned_num)
    
    let banconsulting_num = null 
    banconsulting_num = banconsultingData.length
    if(banconsulting_num == 0){
        $('#consulting_chart').html(`<td class="col-4">진행할 상담이 없었습니다</td><td class="col-4">➖</td><td class="col-4" style="color:red">➖</td>`)
    }else{
        let ttd = null
        ttd = banconsulting_num != 0 ? banconsultingData.filter(c => c.done == 1).length : 0
        $('#consulting_chart').html(`<td class="col-4">${ttd} / ${banconsulting_num}건</td><td class="col-4">${answer_rate(ttd, banconsulting_num).toFixed(0)}%</td><td class="col-4" style="color:red">${make_nodata(banconsultingData.filter(c => c.done == 0 && new Date(c.deadline).setHours(0, 0, 0, 0) < today).length)}</td>`)
    }
    // 업무 데이터
    const chunkedTaskData = copy_taskdata.filter(t=>t.ban_id == b_id)
    let TtasktodayData = null
    TtasktodayData = chunkedTaskData.filter(t => (new Date(t.startdate).setHours(0, 0, 0, 0) <= today && today < new Date(t.deadline).setHours(0, 0, 0, 0)))
    let total_tasks = TtasktodayData.length;
    let done_tasks = total_tasks != 0 ? TtasktodayData.filter(t=>t.done_code != 0).length : 0
    Ttaskhisory = chunkedTaskData.filter(t => new Date(t.deadline).setHours(0, 0, 0, 0) < today)
    let history_done = null
    history_done = Ttaskhisory.filter(t => t.done == 1).length
    $('#task_chart').html(`<td class="col-4">${done_tasks}/${total_tasks}건</td><td class="col-4">${answer_rate(done_tasks, total_tasks).toFixed(0)}%</td><td class="col-4">${answer_rate(history_done, Ttaskhisory.length).toFixed(0)}%</td>`);

    // student data 
    let target_students = studentsData.slice();
    let chunkedStudentData = target_students.filter(s=>s.ban_id == b_id)
    // const Tstudent = chunkedStudentData

    $('#displayCount').html(`원생 목록 : ${chunkedStudentData.length}명`)
    chunkedStudentData.forEach((elem) => {
        elem.unlearned = banunlearnedData.filter(a => a.student_id == elem.student_id).length
        elem.up = answer_rate(elem.unlearned, banunlearnedData.length).toFixed(0)
    });
    var paginationOptions = {
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        pageClassName: 'float-end',
        callback: function (data, pagination) {
            let chartHtml = "";
            $.each(data, function (index, item) {
                const student_category = make_out(item.category_id)
                chartHtml += `
                <td class="col-4 ${student_category}">${item.student_name}( ${item.student_engname} ) ${student_category}</td>
                <td class="col-1 ${student_category}">${item.origin}</td>
                <td class="col-3 ${student_category}">${item.smobileno}</td>
                <td class="col-3 ${student_category}">${item.unlearned}건 ( ${item.up}% ) </td>
                <td class="col-1" custom-control custom-control-inline custom-checkbox data-bs-toggle="modal" data-bs-target="#consultinghistory" onclick="get_consulting_history(${item.student_id})">📝</td>`;
            });
            $("#s_data").html(chartHtml);
        }
    };
    var StudentContainer = $('#pagingul')
    StudentContainer.pagination(Object.assign(paginationOptions, { 'dataSource': chunkedStudentData }))

}
async function show_teacher_report(t_id,b_id,target_data){
    let copy_data = target_data.slice();
    $('#report_type').val(1);  // 선택된 값이 0으로 변경됨

    if (Chart.getChart('total-chart-element-studentnum')) {
        Chart.getChart('total-chart-element-studentnum').destroy()
    }
    if (Chart.getChart('total-chart-element-unlearnednum')) {
        Chart.getChart('total-chart-element-unlearnednum').destroy()
    }
    let info = banData.filter(t => t.teacher_id == t_id)
    if (!info){
        let no_data_title = `<h1> ${response.text} </h1>`
        $('#teacherModalLabel').html(no_data_title);
        alert('반 정보가 없습니다')
        return
    }
    // 리포트 타입에 따라 화면 변화 
    $('#report_type').change(function() {
        selectedValue = $(this).val();
        if(selectedValue == 0){
            return show_ban_report(t_id,b_id,target_data)
        }else{
            return show_teacher_report(t_id,b_id,target_data)
        }
    });
    $('.mo_inloading').hide()
    $('.monot_inloading').show()
    $('#class_list').show()
    // 각 태그 이름 바꾸기 
    $('#teachertitle').html(`${info[0].teacher_engname}(${info[0].teacher_name})  Teacher  Report`)
    $('#ban_nametag').html(`<span>${info[0].teacher_engname}(${info[0].teacher_name}) 📞 ${info[0].teacher_mobileno} ✉️ ${info[0].teacher_email}) </span>`)
    $('#teacher_infobox').html('Teacher Manage')

    let TconsultingData = copy_data.filter(c => c.teacher_id == t_id && new Date(c.startdate).setHours(0, 0, 0, 0) <= today)
    // let TconsultaskData = TconsultingData.filter(c =>  c.category_id > 100)
    let TunlearnedData = TconsultingData.filter(c => c.category_id < 100)
    let unlearned_ttc = null
    unlearned_ttc = TunlearnedData.length

    let temp_baninfo = `<tr class="row">
    <th class="col-2">반이름</th>
    <th class="col-1">학기</th>
    <th class="col-1">원생 수</th>
    <th class="col-2">중도하차</th>
    <th class="col-2">하차율</th>
    <th class="col-1">유보</th>
    <th class="col-2">미학습</th>
    <th class="col-1">상세보기</th>
    </tr>`;
    let total_student_num = 0
    // let now_student_num = 0
    let os = 0
    let hs = 0
    info.forEach(ban_data => {
        total_student_num += ban_data.first_student_num
        os += ban_data.out_student_num
        hs += ban_data.hold_student_num
        unlearned = unlearned_ttc != 0 ? TunlearnedData.filter(c => c.ban_id == ban_data.ban_id).length : 0
        temp_baninfo += `
        <tr class="row">
            <td class="col-2">${ban_data.name}</td>
            <td class="col-1">${make_semester(ban_data.semester)}학기</td>
            <td class="col-1">${ban_data.first_student_num}명</td>
            <td class="col-2">${ban_data.out_student_num}건</td>
            <td class="col-2"><strong>${ban_data.out_num_per}%</strong></td>
            <td class="col-1">${ban_data.hold_student_num}</td>
            <td class="col-2">${unlearned}건</td>
            <td class="col-1" onclick="get_ban_info(${ban_data.teacher_id},${ban_data.ban_id})"><span class="cursor-pointer">👉</span></td>
        </tr>
        `;
    });
    $('#mybaninfo').html(temp_baninfo);

    let temp_teacher_info_student_num = `
        <span>  관리중:${total_student_num}</span><br>
        <span>* 유보:${hs}</span><br>
        <span>* 중도하차:${os}</span>
    `
    $('#teacher_info_student_num').html(temp_teacher_info_student_num)
    let ctx = document.getElementById('total-chart-element-studentnum').getContext('2d');
    if(total_student_num == 0){
        let BanChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['관리중인 원생이 없습니다'],
                datasets: [
                    {
                        data: [100],
                        backgroundColor: ['#F5EFE7'],
                        hoverOffset: 1,
                    },
                ],
            },
            options: {
                maintainAspectRatio: false,
                aspectRatio: 1,
                plugins: {
                    legend: {
                        display: false,
                    },
                },
                responsive: true,
                width: 500,
                height: 500,
            },
        })
    }else{
        let BanChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['관리중', '유보', '중도하차'],
                datasets: [
                    {
                        data: [total_student_num, hs, os],
                        backgroundColor: ['#3C486B', '#F9D949', '#F45050'],
                        hoverOffset: 3,
                    },
                ],
            },
            options: {
                maintainAspectRatio: false,
                aspectRatio: 1,
                plugins: {
                    legend: {
                        display: false,
                    },
                },
                responsive: true,
                width: 500,
                height: 500,
            },
        })
    }


    let temp_info_ulearned_num = `<span>미학습:${unlearned_ttc}</span><br>`
    if(unlearned_ttc == 0){
        let ctx_u = document.getElementById('total-chart-element-unlearnednum').getContext('2d');
        let UnlearnedChart = new Chart(ctx_u, {
            type: 'doughnut',
            data: {
                labels: ['미학습 발생이 없습니다'],
                datasets: [
                    {
                        data: [100],
                        backgroundColor: ['#C2DEDC'],
                        hoverOffset: 1,
                    },
                ],
            },
            options: {
                maintainAspectRatio: false,
                aspectRatio: 1,
                plugins: {
                    legend: {
                        display: false,
                    },
                },
                responsive: true,
                width: 500,
                height: 500,
            },
        })
    }else{
        let data_array = []
        let unlearned_cate = [...new Set(TunlearnedData.map(item => item.category))];
        unlearned_cate.forEach((category) => {
            let num = TunlearnedData.filter(u => u.category == category).length
            temp_info_ulearned_num += `<span>* ${category} : ${num} 건</span><br>`
            data_array.push(num)
        })
    
        let ctx_u = document.getElementById('total-chart-element-unlearnednum').getContext('2d');
        let UnlearnedChart = new Chart(ctx_u, {
            type: 'doughnut',
            data: {
                labels: unlearned_cate,
                datasets: [
                    {
                        data: data_array,
                        backgroundColor: ['#89375F', '#BA90C6', '#BACDDB', '#E8A0BF', '#F3E8FF', '#CE5959'],
                        hoverOffset: unlearned_cate.length,
                    },
                ],
            },
            options: {
                maintainAspectRatio: false,
                aspectRatio: 1,
                plugins: {
                    legend: {
                        display: false,
                    },
                },
                responsive: true,
                width: 500,
                height: 500,
            },
        })
    } 
    
    $('#teacher_info_unlearned_num').html(temp_info_ulearned_num)
    let tconsulting_num = null 
    tconsulting_num = TconsultingData.length
    if(tconsulting_num == 0){
        $('#consulting_chart').html(`<td class="col-4">진행할 상담이 없었습니다</td><td class="col-4">➖</td><td class="col-4" style="color:red">➖</td>`)
    }else{
        let ttd = null
        ttd = tconsulting_num != 0 ? TconsultingData.filter(c => c.done == 1).length : 0
        $('#consulting_chart').html(`<td class="col-4">${ttd} / ${tconsulting_num}건</td><td class="col-4">${answer_rate(ttd, tconsulting_num).toFixed(0)}%</td><td class="col-4" style="color:red">${make_nodata(TconsultingData.filter(c => c.done == 0 && new Date(c.deadline).setHours(0, 0, 0, 0) < today).length)}</td>`)
    }
    const chunkedTaskData = taskData.filter(t=>t.teacher_id == t_id)
    
    let TtasktodayData = null
    TtasktodayData = chunkedTaskData.filter(t => (new Date(t.startdate).setHours(0, 0, 0, 0) <= today && today < new Date(t.deadline).setHours(0, 0, 0, 0)))
    let total_tasks = TtasktodayData.length
    let today_done = null
    today_done = total_tasks != 0 ? TtasktodayData.filter(t => t.done_code != 0).length : 0
    let Ttaskhisory = null
    Ttaskhisory = chunkedTaskData.filter(t => new Date(t.deadline).setHours(0, 0, 0, 0) < today)
    let history_done = null
    history_done = Ttaskhisory.filter(t => t.done == 1).length
    $('#task_chart').html(`<td class="col-4">${today_done}/${total_tasks}건</td><td class="col-4">${answer_rate(today_done, total_tasks).toFixed(0)}%</td><td class="col-4">${answer_rate(history_done, Ttaskhisory.length).toFixed(0)}%</td>`);

    // student data 
    let chunkedStudentData = studentsData.filter(s=>s.teacher_id == t_id)
    
    // const Tstudent = chunkedStudentData

    $('#displayCount').html(`원생 목록 : ${chunkedStudentData.length}명`)
    chunkedStudentData.forEach((elem) => {
        elem.unlearned = TunlearnedData.filter(a => a.student_id == elem.student_id).length
        elem.up = answer_rate(elem.unlearned, TunlearnedData.length).toFixed(0)
    });
    var paginationOptions = {
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        pageClassName: 'float-end',
        callback: function (data, pagination) {
            let chartHtml = "";
            $.each(data, function (index, item) {
                const student_category = make_out(item.category_id)
                chartHtml += `
                <td class="col-3 ${student_category}">${item.student_name}( ${item.student_engname} ) ${student_category}</td>
                <td class="col-2 ${student_category}">${item.origin}</td>
                <td class="col-3 ${student_category}">${item.smobileno}</td>
                <td class="col-3 ${student_category}">${item.unlearned}건 ( ${item.up}% ) </td>
                <td class="col-1" custom-control custom-control-inline custom-checkbox" data-bs-toggle="modal" data-bs-target="#consultinghistory" onclick="get_consulting_history(${item.student_id})">📝</td>`;
            });
            $("#s_data").html(chartHtml);
        }
    };
    var StudentContainer = $('#pagingul')
    StudentContainer.pagination(Object.assign(paginationOptions, { 'dataSource': chunkedStudentData }))

}
// socket
function connectSocket(){
    var question_socket = io('/question');
    var consulting_socket = io('/consulting');
    
    question_socket.on('new_question', async function(data) {
        try {
            const response = await $.ajax({
                url: `new_question/${data.q_id}`,
                type: 'GET',
                dataType: 'json',
                data: {},
            });
            handle_new_question(response);
        } catch (error) {
            console.log('Error occurred while handling new question:', error);
        }
    });

    consulting_socket.on('new_consulting', async function(data) {
        try {
            const response = await $.ajax({
                url: `new_consulting/${data.c_id}`,
                type: 'GET',
                dataType: 'json',
                data: {},
            });
            await handle_new_consulting(response);
        } catch (error) {
            console.log('Error occurred while handling new consulting:', error);
        }
    });
    
}
async function handle_new_question(response){
    let target_question = response.target_question['question']
    console.log(target_question)
    let target_attach = response.target_question['attach']
    const ban = banMap.get(target_question[0].ban_id);
    const student = studentMap.get(target_question[0].student_id);
    target_question[0].origin = student ? student.origin : '원생 정보 없음';
    target_question[0].student_name = student ? student.student_name : '원생 정보 없음';
    target_question[0].ban_name = ban ? ban.ban_name : '';
    target_question[0].teacher_name = ban ? ban.teacher_name : '';
    if(!questionData){
        questionData = target_question
    }else{
        questionData = questionData.concat(target_question);
    }
    let attach_num  = target_attach.length 
    if(attach_num != 0 ){
        for (let i = 0; i < attach_num; i++) {
            const attach = target_attach[i];
            const questionId = attach.question_id;
            if(attachMap.has(questionId)) {
                const existingAttach = attachMap.get(questionId);
                existingAttach.push({
                attach_id: attach.id,
                file_name: attach.file_name,
                is_answer: attach.is_answer
                });
            }else {
                attachMap.set(questionId, [{
                attach_id: attach.id,
                file_name: attach.file_name,
                is_answer: attach.is_answer
                }]);
            }
        }
        if(!attachData){
            attachData = target_attach
        }else{
            attachData = attachData.concat(target_attach);
        }
    }
    let copy_data = questionData.slice()
    let target_questions = [];
    if(target_question[0].category == 1 || target_question[0].category == 2 ){
        target_questions = copy_data.filter(q => q.category == 1 || q.category == 2 )
    }else{
        target_questions = copy_data.filter(q => q.category == target_question[0].category )
    }
    let message = {}
    // 0이면 새로운 문의 1이면 상담 
    message.category = 0
    message.contents = `<td class="col-4"style="margin-top: 5px;">${q_category(target_question[0].category)}</td><td class="col-6"style="margin-top: 5px;">${make_small_char(target_question[0].title)}</td><td class="col-2"><a class="btn-two yellow small" style="margin-top: 0px;margin-bottom: 0px;margin-left: 0px;width: 100%;height: 90%; color:black;"onclick="show_question_detail(${target_question[0].id},0)">확인</a></td>`
    AlarmList.push(message)
    $('#alarm_num').html(AlarmList.length)
    // 반 데이터를 Map으로 매핑
    question_paginating(target_questions,0)
}
function show_alarmlist(){
    $('#new_question_list').hide()
    let new_question_list = AlarmList.filter(a=>a.category==0)
    let new_question_listnum  = new_question_list.length
    let new_consulting_list = AlarmList.filter(a=>a.category==1)
    $('#new_question_alarm').html(`📌새로운 문의 ${new_question_listnum}건 `)
    if(new_question_listnum != 0 ){
        let temp_newquestion_list = ''
        new_question_list.forEach((a)=>{
            temp_newquestion_list += a.contents 
        })
        $('#newQ_list').html(temp_newquestion_list)
        $('#new_question_list').show()
    }
    
}
async function handle_new_consulting(response){
    let target_consulting = response.target_consulting
    // let target_attach = response.target_question['attach']
    // const ban = banMap.get(target_question[0].ban_id);
    // const student = studentMap.get(target_question[0].student_id);
    // target_question[0].origin = student ? student.origin : '원생 정보 없음';
    // target_question[0].student_name = student ? student.student_name : '원생 정보 없음';
    // target_question[0].ban_name = ban ? ban.ban_name : '';
    // target_question[0].teacher_name = ban ? ban.teacher_name : '';
    // if(!questionData){
    //     questionData = target_question
    // }else{
    //     questionData = questionData.concat(target_question);
    // }
    // let attach_num  = target_attach.length 
    // if(attach_num != 0 ){
    //     for (let i = 0; i < attach_num; i++) {
    //         const attach = target_attach[i];
    //         const questionId = attach.question_id;
    //         if(attachMap.has(questionId)) {
    //             const existingAttach = attachMap.get(questionId);
    //             existingAttach.push({
    //             attach_id: attach.id,
    //             file_name: attach.file_name,
    //             is_answer: attach.is_answer
    //             });
    //         }else {
    //             attachMap.set(questionId, [{
    //             attach_id: attach.id,
    //             file_name: attach.file_name,
    //             is_answer: attach.is_answer
    //             }]);
    //         }
    //     }
    //     if(!attachData){
    //         attachData = target_attach
    //     }else{
    //         attachData = attachData.concat(target_attach);
    //     }
    // }
    // let copy_data = questionData.slice()
    // let target_questions = [];
    // if(target_question[0].category == 1 || target_question[0].category == 2 ){
    //     target_questions = copy_data.filter(q => q.category == 1 || q.category == 2 )
    // }else{
    //     target_questions = copy_data.filter(q => q.category == target_question[0].category )
    // }
    // let message = {}
    // message.category = 0
    // message.contents = `${q_category(target_question[0])}가 등록되었습니다`
    // AlarmList.push(0)
    // $('#alarm_num').html(AlarmList.length)
    // console.log(AlarmList)
    // $('#new_question_alarm').html(`📌 새로운 문의 ${AlarmList.filter(a=>a.category==0).length}건 `)
    // // 반 데이터를 Map으로 매핑
    // question_paginating(target_questions,0)
}
function main_view() {
    $('#questionbox').hide()
    $('#ulbox').hide()
    $('#detailban').show()
}
async function show_modal(q_id){
    $('#maininloading').hide()
    $('#main').show()
    const response = await $.ajax({
        url: `modal_question/${q_id}`,
        type: 'GET',
        dataType: 'json',
        data: {},
    })
    let target_question = response.target_question
    let target_bandata = response.target_bandata
    $('.cs_inloading').hide()
    $('.not_inloading').show()
    $('#consulting_history_attach').hide()
    $('#manage_answer').hide()
    let question_detail_data = target_question['question'][0]
    question_detail_data.contents = question_detail_data.contents.replace(/\n/g, '</br>')
    question_detail_data.ban_name = target_bandata[0] ? target_bandata[0].ban_name : '';
    question_detail_data.teacher_name = target_bandata[0] ? target_bandata[0].teacher_engname + '( ' + target_bandata[0].teacher_name + ' )': '';
    if(question_detail_data.student_id != 0){
        let student_data = target_bandata.filter(s => s.student_id == question_detail_data.student_id)[0]
        question_detail_data.student_name = `${student_data.first_name} ( ${student_data.nick_name} )`
        question_detail_data.origin = student_data.register_no
    }
    question_detail_data.attach = target_question['attach']
    if(question_detail_data.attach.length == 0){
        question_detail_data.attach = 0
    }else{
        question_detail_data.question_attach = question_detail_data.attach.filter(a=>a.is_answer == 0)
        question_detail_data.answer_attach = question_detail_data.attach.filter(a=>a.is_answer != 0)
    }
    show_question_detail(q_id,question_detail_data)
}
// 문의 관리
async function get_question_chunk(currentPage,pageSize,done_code, q_type) {
    const questionsWorker = new Worker("../static/js/questions_worker.js");
    
    questionsWorker.onmessage = function (event) {
        $('.cs_inloading').show()
        $('.not_inloading').hide()
        let history_q_num = currentPage
        let history_a_num = attachData.length
        questionCount = event.data.total_count
        questionData = questionData.concat(event.data.question);
        if(!studentsData){
            delay(1000); // 1초의 지연을 줌
        }
        for (let i = history_q_num; i < questionData.length; i++) {
            if(questionData[i]['id']>0){
                const ban = banMap.get(questionData[i].ban_id);
                const student = studentMap.get(questionData[i].student_id);
                questionData[i].origin = student ? student.origin : '원생 정보 없음';
                questionData[i].student_name = student ? student.student_name : '원생 정보 없음';
                questionData[i].ban_name = ban ? ban.ban_name : '';
                questionData[i].teacher_name = ban ? ban.teacher_name : '';
            }
        }
        attachData = attachData.concat(event.data.attach)
        for (let i = history_a_num; i < attachData.length; i++) {
            const attach = attachData[i];
            const questionId = attach.question_id;
            if(attachMap.has(questionId)) {
                const existingAttach = attachMap.get(questionId);
                existingAttach.push({
                attach_id: attach.id,
                file_name: attach.file_name,
                is_answer: attach.is_answer
                });
            }else {
                attachMap.set(questionId, [{
                attach_id: attach.id,
                file_name: attach.file_name,
                is_answer: attach.is_answer
                }]);
            }
        }
        let copy_data = questionData.slice()
        let target_questions = copy_data.filter(q => q.category == q_type);
        if(q_type == 1){
            target_questions = target_questions.concat(copy_data.filter(q => q.category == 2))
            if(questionData.some(q=>q.id < 0)){
                alert('이반 퇴소 관리 문의는 불러 올 과거 데이터가 없습니다.');
            }
        }
        // 반 데이터를 Map으로 매핑
        question_paginating(target_questions,done_code)
    };
    function question_fetchData(){
        questionsWorker.postMessage({ page: currentPage, pageSize });
    }
    question_fetchData();
}
function get_question_data(q_type){
    var con_val = confirm('과거 데이터를 불러오시겠습니까?')
    if (con_val == true) {
        let currentPage = questionData.length;  // 현재 페이지 번호
        let pageSize = 3000;  // 페이지당 데이터 개수
        let done_code = 1;
        if(questionData.length<questionCount){
            get_question_chunk(currentPage,pageSize,done_code, q_type)
        }else{
            let copy_data = questionData.slice()
            let target = copy_data.filter(q=>q.category == q_type)
            if(q_type == 1){
                target = target.concat(copy_data.filter(q=>q.category == 2))
            }
            alert('더이상 불러올 데이터가 없습니다.');
            $('#so_pagination').empty()
            question_paginating(target,done_code)
        }
    }
}
async function get_question_list(q_type,done_code){
    $('#questionbox').hide()
    $('#question_view').val(0); 
    $('#question_search_input').off('keyup');
    $('.cs_inloading').show()
    $('.not_inloading').hide()
    $('#detailban').hide()
    $('#ulbox').hide()
    if (!questionData || !questionCount) {
        questionData = []
        attachData = []
        questionCount = 0
        let currentPage = 0;  // 현재 페이지 번호
        let pageSize = 1000;  // 페이지당 데이터 개수
        get_question_chunk(currentPage,pageSize,0, q_type)
    }else{
        let copy_data = questionData.slice()
        let target_questions = copy_data.filter(q => q.category == q_type);
        if(q_type == 1){
            target_questions = target_questions.concat(copy_data.filter(q => q.category == 2))
        }
        question_paginating(target_questions,done_code)
    }
}
function question_paginating(qdata,done_code){
    $('#so_pagination').empty()
    $('#question_view').val(done_code); 
    $('.cs_inloading').hide()
    $('.not_inloading').show()
    $('#questionbox').show()
    $('#no_data_msg').hide()
    $('#so_question').show()
    $('#so_pagination').show()
    $('#question_view').change(function() {
        question_paginating(qdata,$(this).val())
    });
    let copy_data = qdata.slice()
    let target = copy_data.length > 0 ? copy_data.filter(q=>q.answer == done_code) : 0;
    console.log(target)
    if(target == 0){
        $('#so_question').hide();
        $('#so_pagination').hide();
        let temp_nodatamasg = $(`#question_view option[value="${done_code}"]`).text() + '이 없습니다';
        $('#no_data_msg').html(temp_nodatamasg);
        $('#no_data_msg').show();
        return;
    }
    var container = $('#so_pagination');
    var paginationOptions = {
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        pageClassName: 'float-end',
        callback: function (data, pagination) {
            var dataHtml = '';
            $.each(data, function (index, item) {
                dataHtml += `
                <td class="col-1">${make_date(item.create_date)}</td>
                <td class="col-1">${q_category(item.category)}</td>
                <td class="col-1">${item.ban_name}</td>
                <td class="col-1">${item.teacher_name}</td>
                <td class="col-1">${item.origin}</td>
                <td class="col-2">${item.title}</td>
                <td class="col-3">${make_small_char(item.contents)}</td>`
                if(item.category < 3){
                    dataHtml +=`<td class="col-1 custom-control custom-control-inline custom-checkbox" data-bs-toggle="modal" data-bs-target="#soanswer" onclick="get_question_detail(${item.id})"><span class="cursor">✏️</span> 처리결과 : ${make_answer_code(item.answer_reject_code)}</td>`
                }else{
                    dataHtml +=`<td class="col-1 custom-control custom-control-inline custom-checkbox" data-bs-toggle="modal" data-bs-target="#soanswer" onclick="get_question_detail(${item.id})"><span class="cursor">✏️</span></td>`
                }
                dataHtml += `<td class="col-1" onclick="delete_question(${item.id})"><span class="cursor">🗑️</span></td>`;
            });
            $('#so_tr').html(dataHtml);
        }
    };

    target.sort((a, b) => {
        const dateA = new Date(a.create_date);
        const dateB = new Date(b.create_date);
        return dateB - dateA;
    });
    container.pagination(Object.assign(paginationOptions, { 'dataSource': target }))

    $('#question_search_input').on('keyup', function () {
        var searchInput = $(this).val().toLowerCase();
        let copy_data = target.slice();
        if(searchInput == ""){
            container.pagination('destroy');
            container.pagination(Object.assign(paginationOptions, { 'dataSource': copy_data }));
        }else{
            var filteredData = copy_data.filter(function (data) {
                return ((data.hasOwnProperty('origin') && data.origin.toLowerCase().indexOf(searchInput) !== -1)||(data.hasOwnProperty('ban_name') && data.ban_name.toLowerCase().indexOf(searchInput) !== -1)||(data.hasOwnProperty('teacher_name') && data.teacher_name.toLowerCase().indexOf(searchInput) !== -1));
            });
            filteredData.sort(function (a, b) {
                return new Date(b.create_date) - new Date(a.create_date);
            });
            container.pagination('destroy');
            container.pagination(Object.assign(paginationOptions, { 'dataSource': filteredData }));
        }
    });
    if(done_code == 1 && questionData.length < questionCount){
        $('#so_pagination').append(`<button style="margin-right:10px;" onclick="get_question_data(${qdata[0].category})">과거 데이터 더 불러오기</button>`)
    }
}
async function get_question_detail(q_id){
    $('.cs_inloading').show()
    $('.not_inloading').hide()
    $('#consulting_history_attach').hide()
    $('#manage_answer').hide()
    let question_detail_data = questionData.filter(q => q.id == q_id)[0]
    question_detail_data.contents = question_detail_data.contents.replace(/\n/g, '</br>')
    if(question_detail_data.id > 0){
        let attach = attachMap.get(q_id);
        if(attach != undefined){
            question_detail_data.question_attach = attach.filter(a=>a.is_answer == 0)
            question_detail_data.answer_attach = attach.filter(a=>a.is_answer != 0)
        }
    }
    show_question_detail(q_id,question_detail_data)
}
// 문의 내용 상세보기
async function show_question_detail(q_id,question_detail_data){
    if(question_detail_data == 0 || question_detail_data == '0'){
        question_detail_data = questionData.filter(q=>q.id == q_id)[0]
    }
    $('#consulting_history_attach').hide()
    $('#manage_answer').hide()
    $("#soanswer").modal("show");
    $('#teacher_answer').empty();
    $('#answer_contents').empty();
    $('#answer_content_modi').empty();
    $('.cs_inloading').hide()
    $('.not_inloading').show()
    // 문의 상세 내용 
    $('#answerModalLabel').html(`http://purpleacademy.net:6725/manage/?q_id=${q_id}&q_type=${question_detail_data.category}`)
    let temp_question_list = `
    <div class="modal-body-select-container">
        <div class="modal-body-select-label"><span class="modal-body-select-container-span">제목</span></div>
        <div>${question_detail_data.title}</div>
    </div>
    <div class="modal-body-select-container">
        <div class="modal-body-select-label"><span class="modal-body-select-container-span">작성일</span></div>
        <div>${make_hours(question_detail_data.create_date)}</div>
    </div>
    <div class="modal-body-select-container" style="padding: 12px 0">
        <div class="modal-body-select-label"><span class="modal-body-select-container-span">문의 종류</span></div>
        <div class="w-25">${q_category(question_detail_data.category)}</div>
        <div class="modal-body-select-label"><span class="modal-body-select-container-span">문의 변경</span></div>
        <select id="question_kind" class="modal-body-select w-25">
            <option value="none" selected>변경X</option>
            <option value=3>일반 문의</option>
            <option value=5>내근티처 문의</option>
            <option value=4>기술지원 문의</option>
            <option value=2>이반 요청</option>
            <option value=1>퇴소 요청</option>
        </select>
    </div>
    <div class="modal-body-select-container">
        <div class="modal-body-select-label"><span class="modal-body-select-container-span">대상 반</span></div>
        <div>${question_detail_data.ban_name} ➖ 담임 T : ${question_detail_data.teacher_name} </div>
    </div>
    <div class="modal-body-select-container">
        <div class="modal-body-select-label"><span class="modal-body-select-container-span">학생</span></div>
        <div>${question_detail_data.student_name} (원번: ${question_detail_data.origin})</div>
    </div>
    <div class="d-flex flex-column justify-content-start py-3">
        <div class="modal-body-select-label"><span class="modal-body-select-container-span">첨부파일</span></div>
    `
    if(question_detail_data.question_attach != undefined && question_detail_data.question_attach.length != 0){
        question_detail_data.question_attach.forEach((a)=>{
            temp_question_list +=`<a class="pt-3 px-2" href="/common/downloadfile/question/${q_id}/attachment/${a.attach_id}" download="${a.file_name}">${a.file_name}</a>`
        })
    }else{
        temp_question_list +=`<div class="pt-3 px-2">첨부 파일 없음</div>`
    }
    temp_question_list += `
        </div>
        <div class="d-flex flex-column justify-content-start py-3">
            <div class="modal-body-select-label"><span class="modal-body-select-container-span">내용</span></div>
            <div class="mt-4 ps-2">${question_detail_data.contents}</div>
        </div>    
    `
    $('#teacher_question').html(temp_question_list);
    // 응답 처리 
    if(question_detail_data.answer == 0 || question_detail_data.answer == '0' ) {
        $('#teacher_answer').hide()
        $('#manage_answer').show()
        $('#manage_answer_1').html(
            `
            <div class="d-flex flex-column justify-content-start">
                <div class="modal-body-select-label mt-3"><span class="modal-body-select-container-span">내용</span></div>
                <textarea id="answer_contents" class="modal-body-select w-100 mt-3 ps-2" type="text" name="answer_contents1" style="min-height: 500px;"></textarea>
                <input class="modal-body-select w-100" type="file" id="file-upload" multiple="" style="margin-top:20px;">
                <p class="error_msg_alert" id="error_msg_filesel"> 🔻 파일 최대 업로드 갯수 3개 </p>
            </div>
            `
        )
        $('#manage_answer_1').show()
        $('#manage_answer_2').hide()
        $('#manage_answer_3').hide()
        if (question_detail_data.category == 2) {
            $('#manage_answer_2').show()
        }else if(question_detail_data.category == 1){
            $('#manage_answer_3').show()
        }
        $('#button_box').html(`<button class="btn btn-success" type="submit" onclick="post_answer(${q_id},${question_detail_data.category},${0})">저장</button>`);
    }else{
        $('#manage_answer').hide()
        let temp_answer_list = ''
        if (question_detail_data.category == 1 || question_detail_data.category == 2) {
            temp_answer_list = `
            <div class="modal-body-select-container">
               <div class="modal-body-select-label"><span class="modal-body-select-container-span">처리</span></div>
               <div>${make_answer_code(question_detail_data.answer_reject_code)}</div>
               <select class="modal-body-select w-50" id="o_ban_id_modi" style="margin-left:50px">
                    <option value=-1 selected>처리 결과를 변경하지 않기</option>
                    <option value=0>반려</option>
                    <option value=1>승인</option>
                </select>
            </div>`
        }
        temp_answer_list += `
        <div class="modal-body-select-container">
            <div class="modal-body-select-label"><span class="modal-body-select-container-span">답변자</span></div>
            <div class="w-25">${make_nullcate(question_detail_data.answerer)}</div>
            <div class="modal-body-select-label"><span class="modal-body-select-container-span">응답일</span></div>
            <div class="w-25">${(make_date(question_detail_data.answer_created_at))}</div>
        </div>
        <div class="d-flex flex-column justify-content-start py-3">
            <div class="modal-body-select-label"><span class="modal-body-select-container-span">내용</span></div>
            <textarea class="modal-body-select w-100 mt-3" type="text" rows="15" cols="25"
            id="answer_content_modi">${question_detail_data.answer_contents}</textarea>
        </div>
        <div class="d-flex flex-column justify-content-start py-3">
            <div class="modal-body-select-label"><span class="modal-body-select-container-span">첨부파일</span></div>
        `;
        if(question_detail_data.answer_attach != undefined  && question_detail_data.answer_attach.length != 0){
            question_detail_data.answer_attach.forEach((a)=>{
                temp_answer_list +=`<a class="pt-3 px-2" href="/common/downloadfile/question/${q_id}/attachment/${a.attach_id}" download="${a.file_name}">${a.file_name}</a>`
            })
        }else{
            temp_answer_list +=`<div class="pt-3 px-2">첨부 파일 없음</div>`
        }
        temp_answer_list += '</div>'
        $('#teacher_answer').html(temp_answer_list);
        $('#teacher_answer').show()
        $('#button_box').html(`<button class="btn btn-success" type="submit" onclick="post_answer(${q_id},${question_detail_data.category},${1})">수정</button>`);
    }
    // 상담 일지 처리 
    let temp_his = `<div> 상담내역이 없습니다 </div>`;
    let category = ''
    if(question_detail_data.consulting_history){
        let solution = question_detail_data.solution.replace(/\n/g, '</br>')
        let reason = question_detail_data.reason
        if(reason != null){
            reason = reason.replace(/\n/g, '</br>')
        }
        if (question_detail_data.consulting_categoryid < 100) {
            category = `${question_detail_data.week_code}주간 ${question_detail_data.consulting_category}상담`
        } else {
            category = `${question_detail_data.consulting_category} ${question_detail_data.consulting_category}`
        }
        temp_his = `
        <div class="modal-body-select-container">
            <div class="modal-body-select-label align-items-start"><span class="modal-body-select-container-span">상담 종류</span></div>
            <div style="width:24.999%; margin-right:20px;">${category}</div>
            <div class="modal-body-select-label align-items-start"><span class="modal-body-select-container-span">상담 일시</span></div>
            <div style="width:24.999%; margin-right:20px;">${(make_date(question_detail_data.consulting_created_at))}</div>
        </div>
        <div class="d-flex flex-column py-3">
            <div class="modal-body-select-label mt-3"><span class="modal-body-select-container-span">상담 사유</span></div>
            <div class="mt-3 px-2">${make_nullcate(reason)}</div>
        </div>
        <div class="d-flex flex-column py-3">
            <div class="modal-body-select-label mt-3"><span class="modal-body-select-container-span">제공 가이드</span></div>
            <div class="mt-3 px-2">${solution}</div>
        </div>
        `;
        $('#cha').html(temp_his);
        $('#consulting_history_attach').show()
    }
}

// 본원 답변 기능 
async function post_answer(q_id, category,done_code) {
    let q_kind = $('#question_kind').val()
    let o_ban_id = 0
    if(q_kind == 'none'){
        if(done_code == 0){
            const response = await $.ajax({
                type: "GET",
                url: "/manage/is_it_done/"+q_id,
                dataType: 'json',
                data: {},
            });
            let target_answer = response['target_answer']
            if(target_answer.length > 0){
                target_answer = target_answer[0]
                let answerer = make_nullcate(target_answer.answerer)
                alert(answerer+'(이)가 이미 응답한 문의 입니다')
                
                $('#manage_answer').hide()
                let temp_answer_list = `
                <div class="modal-body-select-container">
                    <div class="modal-body-select-label"><span class="modal-body-select-container-span">답변자</span></div>
                    <div class="w-25">${answerer}</div>
                    <div class="modal-body-select-label"><span class="modal-body-select-container-span">응답일</span></div>
                    <div class="w-25">${make_date(target_answer.created_at)}</div>
                </div>
                <div class="d-flex flex-column justify-content-start py-3">
                    <div class="modal-body-select-label"><span class="modal-body-select-container-span">내용</span></div>
                    <textarea class="modal-body-select w-100 mt-3" type="text" rows="15" cols="25"
                    id="answer_content_modi">${target_answer.answer_contents}</textarea>
                </div>
                `;
                $('#teacher_answer').html(temp_answer_list);
                $('#button_box').html(`<button class="btn btn-success" type="submit" onclick="post_answer(${q_id},${target_answer.category},${1})">수정</button>`);
                $('#teacher_answer').show()
                return
            }else{
                // 정상 저장의 경우 
                answer_contents = $('#answer_contents').val()
                o_ban_id = 0
                if(category == 2) {
                    o_ban_id = Number($('#o_ban_id2').val().split('_')[0])
                }else if(category == 3 || category == 1){
                    o_ban_id = $('#o_ban_id').val()
                }
            }
        }else{
            // 수정의 경우
            answer_contents = $('#answer_content_modi').val()
            o_ban_id = $('#o_ban_id_modi').val()
        }
        const formData = new FormData();
        const fileInput = document.getElementById('file-upload');
        if(fileInput != null){
            const files = fileInput.files;
            const files_length = files.length;
            if(files_length > 3){
                $('#error_msg_filesel').show()
                return;
            }
            for (let i = 0; i < files_length; i++) {
                formData.append('file_upload', files[i]);
            }
        }else{
            files = []
            formData.append('file_upload', files);
        }
        formData.append('answer_contents', answer_contents);
        formData.append('o_ban_id', o_ban_id);
        $.ajax({
            type: "POST",
            url: "/manage/answer/" + q_id +'/'+ done_code,
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                {
                    if(response['result'] == '문의 답변 저장 완료'){
                        alert("문의 답변 완료")
                        $("#soanswer").modal("hide");
                        questionData = questionData.map((question) => {
                            if (question.id === q_id) {
                                question.answer = 1
                                question.answer_contents = answer_contents
                                question.answer_created_at = today
                                question.answer_id = response['target_data'].answer_id
                                question.answer_reject_code = o_ban_id
                                question.answerer = response['target_data'].answerer
                                return question; // 업데이트된 데이터로 대체
                            }
                            return question; // 기존 데이터 유지
                        });
                        if( files_length != 0){
                            let answer_attachments = response['target_data'].attach
                            for (let i = 0; i < files_length; i++) {
                                const attach = answer_attachments[i];
                                const questionId = attach.question_id;
                                if(attachMap.has(questionId)) {
                                    const existingAttach = attachMap.get(questionId);
                                    existingAttach.push({
                                    attach_id: attach.id,
                                    file_name: attach.file_name,
                                    is_answer: attach.is_answer
                                    });
                                }else {
                                    attachMap.set(questionId, [{
                                    attach_id: attach.id,
                                    file_name: attach.file_name,
                                    is_answer: attach.is_answer
                                    }]);
                                }
                            }
                            if(!attachData){
                                attachData = answer_attachments
                            }else{
                                attachData = attachData.concat(answer_attachments);
                            }
                        }
                        if(category == 2){
                            get_question_list(1,0)
                        }else{
                            get_question_list(category,0)
                        }
                    }else{
                        alert('문의 답변 저장 실패')
                    }
                }
            }
        });
    }else{
        $.ajax({
            type: "POST",
            url: "/manage/q_kind/" + q_id,
            data: {
                question_kind: q_kind
            },
            success: function (response) {
                {
                    if(response['result'] == '문의 종류 수정 완료'){
                        alert(response["result"])
                        $("#soanswer").modal("hide");
                        questionData = questionData.map((question) => {
                            if (question.id === q_id) {
                                question.category = q_kind
                                return question; // 업데이트된 데이터로 대체
                            }
                            return question; // 기존 데이터 유지
                        });
                    }else{
                        alert('문의 종류 수정 실패')
                    }
                }
            }
        });
    }
    
}
// 미학습 (학습관리)
async function uldata() {
    $('#questionbox').hide()
    $('#detailban').hide()
    $('#ulbox').show()
    let container = $('#ul_pagination')
    $('.cs_inloading').show()
    $('.not_inloading').hide()
    $('.cs_inloading').hide()
    $('.not_inloading').show()
    all_uc_consulting = consultingData.filter(c=>c.category_id > 100)
    studentsData.forEach((elem) => {
        elem.unlearned = consultingData.filter(a => a.student_id == elem.student_id && a.category_id < 100).length
        elem.up = answer_rate(elem.unlearned, all_uc_consulting.length).toFixed(2)
    });
    studentsData.sort((a, b) => {
        if (b.up !== a.up) {
            return b.up - a.up;
        } else {
            return b.unlearned - a.unlearned; // students.length가 큰 순으로 정렬
        }
    });

    if (studentsData.length == 0) {
        let no_data_title = `<h1> ${response.text} </h1>`
        $('#ultitle').html(no_data_title);
        $('#ul_data_box').hide()
        $('#ul_pagination').hide()
        return
    }
    $('#ultitle').empty();
    $('#ul_data_box').show()
    $('#ul_pagination').show()
    container.pagination({
        dataSource: consultingData,
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        callback: function (consultingData, pagination) {
            var dataHtml = '';
            $.each(consultingData, function (index, student) {
                consultings = consultingData.filter(c => c.category_id < 100 && c.student_id == student.student_id)
                unlearned_ixl = make_nodata(consultings.filter(a => a.category_id == 1).length)
                unlearned_reading = make_nodata(consultings.filter(a => a.category_id == 4).length)
                unlearned_speacial = make_nodata(consultings.filter(a => a.category_id == 3).length)
                unlearned_writing = make_nodata(consultings.filter(a => a.category_id == 6).length)
                unlearned_homepage = make_nodata(consultings.filter(a => a.category_id == 2).length)
                unlearned_intoreading = make_nodata(consultings.filter(a => a.category_id == 5 || a.category_id == 7).length)

                dataHtml += `
                <td class="col-1">${student.ban_name}</td>
                <td class="col-1">${student.origin}</td>
                <td class="col-1">${student.student_name}</br>( ${student.student_engname} )</td>
                <td class="col-1">${student.smobileno} </td>
                <td class="col-1">${unlearned_ixl}</td>
                <td class="col-1">${unlearned_reading}</td>
                <td class="col-1">${unlearned_speacial}</td>
                <td class="col-1">${unlearned_intoreading}</td>
                <td class="col-1">${unlearned_writing}</td>
                <td class="col-1">${unlearned_homepage}</td>
                <td class="col-1">${student.unlearned}건 (${student.up}%) </td>
                <td class="col-1 custom-control custom-control-inline custom-checkbox" data-bs-toggle="modal" data-bs-target="#consultinghistory" onclick="get_consulting_history(${student.student_id})">📝</td>`;
            });
            $('#static_data2').html(dataHtml);
        }
    })
    $('#search-input').on('keyup', function () {
        var searchInput = $(this).val().toLowerCase();
        var filteredData = studentsData.filter(function (student) {
            return student.student_name.toLowerCase().indexOf(searchInput) !== -1 || student.origin.toLowerCase().indexOf(searchInput) !== -1 || student.ban_name.toLowerCase().indexOf(searchInput) !== -1;
        });
        container.pagination('destroy');
        container.pagination({
            dataSource: filteredData,
            prevText: '이전',
            nextText: '다음',
            pageSize: 10,
            callback: function (filteredData, pagination) {
                var dataHtml = '';
                $.each(filteredData, function (index, student) {
                    consultings = consultingData.filter(c => c.category_id < 100 && c.student_id == student.student_id)
                    unlearned_ixl = make_nodata(consultings.filter(a => a.category_id == 1).length)
                    unlearned_reading = make_nodata(consultings.filter(a => a.category_id == 4).length)
                    unlearned_speacial = make_nodata(consultings.filter(a => a.category_id == 3).length)
                    unlearned_writing = make_nodata(consultings.filter(a => a.category_id == 6).length)
                    unlearned_homepage = make_nodata(consultings.filter(a => a.category_id == 2).length)
                    unlearned_intoreading = make_nodata(consultings.filter(a => a.category_id == 5 || a.category_id == 7).length)

                    dataHtml += `
                    <td class="col-1">${student.ban_name}</td>
                    <td class="col-1">${student.origin}</td>
                    <td class="col-1">${student.student_name}</br>( ${student.student_engname} )</td>
                    <td class="col-1"> ${student.smobileno} </td>
                    <td class="col-1">${unlearned_ixl}</td>
                    <td class="col-1">${unlearned_reading}</td>
                    <td class="col-1">${unlearned_speacial}</td>
                    <td class="col-1">${unlearned_intoreading}</td>
                    <td class="col-1">${unlearned_writing}</td>
                    <td class="col-1">${unlearned_homepage}</td>
                    <td class="col-1">${student.unlearned}건 (${student.up}%) </td>
                    <td class="col-1 custom-control custom-control-inline custom-checkbox" data-bs-toggle="modal" data-bs-target="#consultinghistory" onclick="get_consulting_history(${student.student_id})">📝</td>`;
                });
                $('#static_data2').html(dataHtml);
            }
        })
    });
}

// 업무 요청 관련 함수 
async function request_task() {
    $('#taskban_search_input').off('keyup');
    $('.mo_inloading').show()
    $('.monot_inloading').hide()
    if (!taskcateData) {
        await get_all_taskcate().then(() => {
            $('.mo_inloading').hide()
            $('.monot_inloading').show()
        });
    }
    $('.mo_inloading').hide()
    $('.monot_inloading').show()

    $("#task_date").datepicker({ dateFormat: 'yy-mm-dd' });
    $("#task_deadline").datepicker({ dateFormat: 'yy-mm-dd' });

    let temp_ban_option = '<option value=0 selected>반을 선택해주세요</option>';
    banData.forEach(ban_data => {
        let value = `${ban_data.ban_id}_${ban_data.teacher_id}_${ban_data.name}`;
        temp_ban_option += `<option value="${value}">${ban_data.name} (${make_semester(ban_data.semester)}월 학기)</option>`;
    });
    $('#task_ban').html(temp_ban_option)

    let temp_task_category_list = '<option value=0 selected>업무 카테고리를 선택해주세요</option>';
    taskcateData.forEach(task_data => {
        temp_task_category_list += `<option value="${task_data.id}">${task_data.name}</option>`;
    });
    $('#task_category_list').html(temp_task_category_list)

    $('#taskban_search_input').on('keyup', function () {
        let temp_ban_option = '<option value=0 selected>반을 선택해주세요</option>';
        var searchInput = $(this).val().toLowerCase();
        var filteredData = banData.filter(function (data) {
            return (data.hasOwnProperty('name') && data.name.toLowerCase().indexOf(searchInput) !== -1) || (data.hasOwnProperty('teacher_name') && data.teacher_name.toLowerCase().indexOf(searchInput) !== -1) || (data.hasOwnProperty('teacher_engname') && data.teacher_engname.toLowerCase().indexOf(searchInput) !== -1);
        });
        filteredData.forEach(ban_data => {
            let value = `${ban_data.ban_id}_${ban_data.teacher_id}_${ban_data.name}`;
            temp_ban_option += `<option value="${value}">${ban_data.name} (${make_semester(ban_data.semester)}월 학기)</option>`;
        });
        $('#task_ban').html(temp_ban_option)
    });
}
function show_ban_selection() {
    var selectedOptions = ''
    for (i = 0; i < selectedBanList.length; i++) {
        // bid+tid+bname+sid+sname
        var value = selectedBanList[i].split('_')
        selectedOptions += `
        <td class="col-11">${value[2]}</td>
        <td class="col-1" onclick="delete_selected_ban(${i})"><span class="cursor">❌</span></td>`;
        $('#target_task_bans').html(selectedOptions);
    }
}
function task_ban_change(btid) {
    if (btid.includes('_')) {
        // 개별 반 처리
        $('#target_task_bans').show()
        $('#task_msg').html('👇 개별 반 대상 진행합니다 (대상 반을 확인해 주세요)')
        if (selectedBanList.indexOf(btid) === -1) {
            selectedBanList.push(btid);
        }
        $('select[name="task_target_ban[]"]').val(selectedBanList);
        return show_ban_selection()
    } else {
        selectedBanList.length = 0
        $('#target_task_bans').empty()
        if (btid == 0) {
            // 전체 반 대상 진행 일 경우 처리 
            $('#task_msg').html('👉 전체 반 대상 진행합니다 (소요되는 시간이 있으니 저장 클릭후 화면이 이동하기 전 까지 대기 해 주세요)')
        } else if (btid == 1) {
            // plus alpha 처리
            $('#task_msg').html('👉 PLUS/ALPHA반 대상 진행합니다 (소요되는 시간이 있으니 저장 클릭후 화면이 이동하기 전 까지 대기 해 주세요)')
        } else if (btid == 2) {
            // nf 노블 처리 
            $('#task_msg').html('👉 NF/Inter반 대상 진행합니다 (소요되는 시간이 있으니 저장 클릭후 화면이 이동하기 전 까지 대기 해 주세요)')
        }else if (btid == 3) {
            $('#task_msg').html('👉 16기 반 대상 진행합니다 (소요되는 시간이 있으니 저장 클릭후 알람메시지가 나올 때 까지 대기 해 주세요)')
        }else if (btid == 4) {
            $('#task_msg').html('👉 17기 반 대상 진행합니다 (소요되는 시간이 있으니 저장 클릭후 알람메시지가 나올 때 까지 대기 해 주세요)')
        }else if (btid == 5) {
            $('#task_msg').html('👉 18기 반 대상 진행합니다 (소요되는 시간이 있으니 저장 클릭후 알람메시지가 나올 때 까지 대기 해 주세요)')
        }
    }
}
function delete_selected_ban(idx) {
    selectedBanList.splice(idx, 1)
    $('select[name="task_target_ban[]"]').val(selectedBanList);
    return show_ban_selection()
}
function post_task_request() {
    let task_cateogry = $('#task_category_list').val()
    let task_date = $('#task_date').val()
    let task_deadline = $('#task_deadline').val()
    let task_contents = $('#task_contents').val()

    if(task_cateogry == 0){
        alert('카테고리를 선택해 주세요')
        reutrn
    }
    if(!task_date || !task_deadline){
        alert('업무 시작/종료일을 선택해 주세요')
        reutrn
    }
    if(!task_contents){
        alert('업무 내용을 적어주세요')
        reutrn
    }
    let task_cycle = $('#task_cycle').val()
    let task_priority = $('#task_priority').val()
    // 다중 선택 대상 선택일 경우  )
    if (selectedBanList.length == 0) {
        let selected = Number($('select[name="task_target_ban[]"]').val()[0])
        $.ajax({
            url: '/manage/task/'+selected,
            type: 'POST',
            data: JSON.stringify({
                task_category_list: task_cateogry,
                task_date: task_date,
                task_deadline: task_deadline,
                task_contents: task_contents,
                task_cycle:task_cycle,
                task_priority:task_priority
            }),
            contentType: 'application/json',
            success: function(response) {
              // 요청이 성공했을 때의 처리
              if(response['result'] == 'success'){
                alert('업무 요청이 완료되었습니다')
                window.location.reload()
              }
            },
            error: function(error) {
              // 요청이 실패했을 때의 처리
              console.log(error);
            }
        });
    }else{
        $.ajax({
            url: `/manage/task/`+Number(101),
            type: 'POST',
            data: JSON.stringify({ 
                selectedBanList: selectedBanList,
                task_category_list: task_cateogry,
                task_date: task_date,
                task_deadline: task_deadline,
                task_contents: task_contents,
                task_cycle:task_cycle,
                task_priority:task_priority
            }),
            contentType: 'application/json',
            success: function(response) {
                if(response['result'] == 'success'){
                    alert('업무 요청이 완료되었습니다')
                    window.location.reload()
                }
            },
            error: function(error) {
              // 요청이 실패했을 때의 처리
              console.log(error);
            }
        });
    }
    //     console.log(selectedBanList)
    //     let total_ban_selections = selectedStudentList.filter(value=>!(value.includes('_')))
    //     let total_student_selections = selectedStudentList.filter(value => value.includes('-1'));
    //     const totalPromises = [];

    //     // 전체 반 대상 
    //     if (total_ban_selections.length != 0) {
    //         total_ban_selections.forEach(value => {
    //             v = Number(value)
    //             const promise = $.ajax({
    //                 type: "POST",
    //                 url: '/manage/consulting/all_ban/' + v,
    //                 // data: JSON.stringify(jsonData), // String -> json 형태로 변환
    //                 data: {
    //                     consulting_category: consulting_category,
    //                     consulting_contents: consulting_contents,
    //                     consulting_date: consulting_date,
    //                     consulting_deadline: consulting_deadline
    //                 }
    //             })
    //             totalPromises.push(promise);
    //         })
    //     }
    //     // 전체 학생 대상
    //     if (total_student_selections.length != 0) {
    //         total_student_selections.forEach(value => {
    //             v = value.split('_')
    //             totalstudent_ban_id = Number(v[0])
    //             totalstudent_teacher_id = Number(v[1])
    //             const promise = $.ajax({
    //                 type: "POST",
    //                 url:`/manage/consulting/ban/${totalstudent_ban_id}/${totalstudent_teacher_id}/${v[2]}/`,
    //                 // data: JSON.stringify(jsonData), // String -> json 형태로 변환
    //                 data: {
    //                     consulting_category: consulting_category,
    //                     consulting_contents: consulting_contents,
    //                     consulting_date: consulting_date,
    //                     consulting_deadline: consulting_deadline
    //                 }
    //             })
    //             totalPromises.push(promise);
    //         })
    //     }
    //     // 개별 학생 대상 인 경우  
    //     let indivi_student_selections = selectedStudentList.filter(value => (value.includes('_')) && !(value.includes('-1')));
    //     if (indivi_student_selections.length != 0) {
    //         indivi_student_selections.forEach(value => {
    //             v = String(value).split('_')
    //             s_info = studentsData.filter(a => a.student_id ==  Number(v[3]))[0]
    //             const promise = $.ajax({
    //                 type: "POST",
    //                 url: '/manage/consulting/' + v[0] + '/' + v[1] + '/' + v[3]+ '/',
    //                 // data: JSON.stringify(jsonData), // String -> json 형태로 변환
    //                 data: {
    //                     student_name : s_info['student_name'],
    //                     student_engname : s_info['student_engname'],
    //                     origin : s_info['origin'],
    //                     consulting_category: consulting_category,
    //                     consulting_contents: consulting_contents,
    //                     consulting_date: consulting_date,
    //                     consulting_deadline: consulting_deadline
    //                 }
    //             })
    //             totalPromises.push(promise);
    //         })
    //     }
    //     Promise.all(totalPromises).then((responses) => {
    //         let isSuccess = true;
    //         responses.forEach(response => {
    //             if (response['result'] !== 'success') {
    //                 isSuccess = false;
    //             }
    //         })
    //         if (isSuccess) {
    //             alert('상담 요청 완료');
    //             window.location.reload();
    //         } else {
    //             alert('상담 요청 실패');
    //         }
    //     })
    // }
}

// 상담 요청 관련 함수 
async function request_consulting() {
    $('#consultingban_search_input').off('keyup');
    $('.mo_inloading').show()
    $('.monot_inloading').hide()
    if (!consultingcateData) {
        await get_all_consultingcate()
    }
    if(!studentsData){
        await delay(1000); // 1초의 지연을 줌
    }
    $('.mo_inloading').hide()
    $('.monot_inloading').show()

    $('#result_tbox').empty()
    $('#select_student').hide()
    $("#consulting_date").datepicker({ dateFormat: 'yy-mm-dd' });
    $("#consulting_deadline").datepicker({ dateFormat: 'yy-mm-dd' });

    let copy_data = studentsData.slice();
    let target_studentData = copy_data
    let temp_consulting_category_list = '<option value=0 selected>상담카테고리를 선택해주세요</option>';
    consultingcateData.forEach(cate_data => {
        temp_consulting_category_list += `<option value="${cate_data.id}">${cate_data.name}</option>`;
    });
    $('#consulting_category_list').html(temp_consulting_category_list)

    let temp_ban_option = '<option value=0 selected>반을 선택해주세요</option>';
    banData.forEach(ban_data => {
        let value = `${ban_data.ban_id}_${ban_data.teacher_id}_${ban_data.name}_-1_전체 학생 대상 진행`;
        temp_ban_option += `<option value="${value}">${ban_data.name} (${make_semester(ban_data.semester)}월 학기)</option>`;
    });
    $('#consulting_target_ban').html(temp_ban_option)

    let temp_student_option = '<option value=0 selected>원생을 선택해주세요</option>';
    target_studentData.forEach(student_data => {
        let value = `${student_data.ban_id}_${student_data.teacher_id}_${student_data.ban_name}_${student_data.student_id}_${student_data.student_name}`; // btid
        if(student_data.category_id > 1){
            temp_student_option += `<option value="${value}">${student_data.student_name} ( ${student_data.student_engname} / ${student_data.origin}) - ${student_data.ban_name} (보류/퇴소 원생)</option>`
        }else{
            temp_student_option += `<option value="${value}">${student_data.student_name} ( ${student_data.student_engname} / ${student_data.origin}) - ${student_data.ban_name}</option>`;
        }
    });
    $('#consulting_target_student').html(temp_student_option)

    $('#consultingban_search_input').on('keyup', function () {
        $('#consulting_target_ban').show()
        $('#consulting_target_student').hide()
        let temp_ban_option = '<option value=0 selected>반을 선택해주세요</option>';
        var searchInput = $(this).val().toLowerCase();
        var filteredData = banData.filter(function (data) {
            return (data.hasOwnProperty('name') && data.name.toLowerCase().indexOf(searchInput) !== -1) || (data.hasOwnProperty('teacher_name') && data.teacher_name.toLowerCase().indexOf(searchInput) !== -1) || (data.hasOwnProperty('teacher_engname') && data.teacher_engname.toLowerCase().indexOf(searchInput) !== -1);
        });
        filteredData.forEach(ban_data => {
            let value = `${ban_data.ban_id}_${ban_data.teacher_id}_${ban_data.name}_-1_전체 학생 대상 진행`;
            temp_ban_option += `<option value="${value}">${ban_data.name} (${make_semester(ban_data.semester)}월 학기)</option>`;
        });
        $('#consulting_target_ban').html(temp_ban_option)
    });

    $('#consultingstudent_search_input').on('keyup', function () {
        $('#consulting_target_ban').hide()
        $('#consulting_target_student').show()
        let temp_student_option = '<option value=0 selected>원생을 선택해주세요</option>';
        var searchInput = $(this).val().toLowerCase();
        var filteredData = target_studentData.filter(function (data) {
            return (data.hasOwnProperty('student_name') && data.student_name.toLowerCase().indexOf(searchInput) !== -1) || (data.hasOwnProperty('student_engname') && data.student_engname.toLowerCase().indexOf(searchInput) !== -1) || (data.hasOwnProperty('origin') && data.origin.toLowerCase().indexOf(searchInput) !== -1);
        });
        filteredData.forEach(student_data => {
            let value = `${student_data.ban_id}_${student_data.teacher_id}_${student_data.ban_name}_${student_data.student_id}_${student_data.student_name}`; // btid
            if(student_data.category_id > 1){
                temp_student_option += `<option value="${value}">${student_data.student_name} ( ${student_data.student_engname} / ${student_data.origin}) - ${student_data.ban_name} (보류/퇴소 원생)</option>`
            }else{
                temp_student_option += `<option value="${value}">${student_data.student_name} ( ${student_data.student_engname} / ${student_data.origin}) - ${student_data.ban_name}</option>`;
            }
            });
        $('#consulting_target_student').html(temp_student_option)
    });

}
$('#consulting_target_aban').change(function () {
    var selectedValues = $(this).val()[0];
    if (selectedStudentList.indexOf(selectedValues) === -1) {
        selectedStudentList.push(selectedValues);
    }
    return show_selections();
});
function show_selections() {
    $('#result_tbox').empty()
    for (i = selectedStudentList.length - 1; i >= 0; i--) {
        // 전체 반이 선택된 경우 
        if (String(selectedStudentList[i]).includes('-1')) {
            // 같은 반 친구들 교집합을 저장 
            let total_student_selections = selectedStudentList.filter(value => ((String(value).split('_')[0] == selectedStudentList[i].split('_')[0]) && (!(value.includes('-1')))));
            if (total_student_selections.length != 0) {
                total_student_selections.forEach(value => {
                    selectedStudentList.splice(selectedStudentList.indexOf(value), 1);
                })
            }
        }
    }
    var selectedOptions = ''
    for (i = 0; i < selectedStudentList.length; i++) {
        // bid+tid+bname+sid+sname
        if(selectedStudentList[i].includes('_')){
            var value = selectedStudentList[i].split('_')
            if(value.length > 3){
                selectedOptions += `
                <td class="col-4">${value[2]}</td>
                <td class="col-6">${value[4]}</td>
                <td class="col-2" onclick="delete_selected_student(${i})"><span class="cursor">❌</span></td>`;
            }else{
                selectedOptions += `
                <td class="col-4">${value[2]}</td>
                <td class="col-6">전체 원생 대상 진행</td>
                <td class="col-2" onclick="delete_selected_student(${i})"><span class="cursor">❌</span></td>`;
            }
        }else{
            var value = selectedStudentList[i]
            if(value==0 || value =='0'){
                selectedOptions += `<td class="col-10">전체 반 대상 진행</td><td class="col-2" onclick="delete_selected_student(${i})"><span class="cursor">❌</span></td>`
            }else if(value==1 || value =='1'){
                selectedOptions += `<td class="col-10">PLUS/ALPHA반 대상 진행</td><td class="col-2" onclick="delete_selected_student(${i})"><span class="cursor">❌</span></td>`
            }else if(value==2 || value =='2'){
                selectedOptions += `<td class="col-10">NF/Inter반 대상 진행</td><td class="col-2" onclick="delete_selected_student(${i})"><span class="cursor">❌</span></td>`
            }else if(value==3 || value =='3'){
                selectedOptions += `<td class="col-10">16기 대상 진행</td><td class="col-2" onclick="delete_selected_student(${i})"><span class="cursor">❌</span></td>`
            }else if(value==4 || value =='4'){
                selectedOptions += `<td class="col-10">17기 대상 진행</td><td class="col-2" onclick="delete_selected_student(${i})"><span class="cursor">❌</span></td>`
            }else{
                selectedOptions += `<td class="col-10">18기 대상 진행</td><td class="col-2" onclick="delete_selected_student(${i})"><span class="cursor">❌</span></td>`
            }
        }
        $('#result_tbox').html(selectedOptions);
    }
}
function delete_selected_student(idx) {
    selectedStudentList.splice(idx, 1)
    // 선택 된거 보여주기 
    return show_selections();
}
function post_consulting_request() {
    consulting_category = $('#consulting_category_list').val()
    if(consulting_category == 0){
        alert('카테고리를 선택해 주세요')
        reutrn
    }
    consulting_contents = $('#consulting_contents').val()
    consulting_date = $('#consulting_date').val()
    consulting_deadline = $('#consulting_deadline').val()
    // 다중 선택 대상 선택일 경우  )
    if (selectedStudentList.length != 0) {
        let total_ban_selections = selectedStudentList.filter(value=>!(value.includes('_')))
        let total_student_selections = selectedStudentList.filter(value => value.includes('-1'));
        const totalPromises = [];

        // 전체 반 대상 
        if (total_ban_selections.length != 0) {
            total_ban_selections.forEach(value => {
                v = Number(value)
                const promise = $.ajax({
                    type: "POST",
                    url: '/manage/consulting/all_ban/' + v,
                    // data: JSON.stringify(jsonData), // String -> json 형태로 변환
                    data: {
                        consulting_category: consulting_category,
                        consulting_contents: consulting_contents,
                        consulting_date: consulting_date,
                        consulting_deadline: consulting_deadline
                    }
                })
                totalPromises.push(promise);
            })
        }
        // 전체 학생 대상
        if (total_student_selections.length != 0) {
            total_student_selections.forEach(value => {
                v = value.split('_')
                totalstudent_ban_id = Number(v[0])
                totalstudent_teacher_id = Number(v[1])
                const promise = $.ajax({
                    type: "POST",
                    url:`/manage/consulting/ban/${totalstudent_ban_id}/${totalstudent_teacher_id}/${v[2]}/`,
                    // data: JSON.stringify(jsonData), // String -> json 형태로 변환
                    data: {
                        consulting_category: consulting_category,
                        consulting_contents: consulting_contents,
                        consulting_date: consulting_date,
                        consulting_deadline: consulting_deadline
                    }
                })
                totalPromises.push(promise);
            })
        }
        // 개별 학생 대상 인 경우  
        let indivi_student_selections = selectedStudentList.filter(value => (value.includes('_')) && !(value.includes('-1')));
        if (indivi_student_selections.length != 0) {
            indivi_student_selections.forEach(value => {
                v = String(value).split('_')
                s_info = studentsData.filter(a => a.student_id ==  Number(v[3]))[0]
                const promise = $.ajax({
                    type: "POST",
                    url: '/manage/consulting/' + v[0] + '/' + v[1] + '/' + v[3]+ '/',
                    // data: JSON.stringify(jsonData), // String -> json 형태로 변환
                    data: {
                        ban_name: v[2],
                        student_name : s_info['student_name'],
                        student_engname : s_info['student_engname'],
                        origin : s_info['origin'],
                        consulting_category: consulting_category,
                        consulting_contents: consulting_contents,
                        consulting_date: consulting_date,
                        consulting_deadline: consulting_deadline
                    }
                })
                totalPromises.push(promise);
            })
        }
        Promise.all(totalPromises).then((responses) => {
            let isSuccess = true;
            responses.forEach(response => {
                if (response['result'] !== 'success') {
                    isSuccess = false;
                }
            })
            if (isSuccess) {
                alert('상담 요청 완료');
                window.location.reload();
            } else {
                alert('상담 요청 실패');
            }
        })
    }
}

// 요청한 상담 관리
async function get_request_consulting() {
    $('.mo_inloading').show();
    $('.not_inloading').hide();
    $('#request_consultingban_listbox').hide();
    $('#request_consulting_listbox').show();
    $('#my_consulting_requestModalLabel').html('요청한 상담 목록');
    Consultingcontainer = $('#consulting-pagination');
    ConsultingpaginationOptions = {
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        callback: function (data, pagination) {
            var dataHtml = '';
            $.each(data, function (index, consulting) {
            data = banData.filter(b => b.ban_id == consulting.ban_id)[0];
            consulting.ban_name = '-';
            if (data) {
                consulting.ban_name = data.name;
            }
            dataHtml += `
            <td class="col-2">"${make_date(consulting.startdate)}" ~ <strong>"${make_date(consulting.deadline)}"</strong></td>
            <td class="col-1">${consulting.category}</td>
            <td class="col-2">${make_small_char(consulting.contents)}</td>
            <td class="col-1">${consulting.ban_name}</td>
            <td class="col-1">${make_nullcate(consulting.teacher_name)} (${make_nullcate(consulting.teacher_engname)})</td>
            <td class="col-1">${make_nullcate(consulting.student_name)} (${make_nullcate(consulting.student_engname)})</td>
            <td class="col-1">${consulting.origin}</td>
            <td class="col-1">${make_reject_code(consulting.done)}</td>
            <td class="col-1" onclick="get_consultingdetail(${consulting.id})"> <span class="cursor">🔍</span> </td>
            <td class="col-1" onclick="delete_consulting(${consulting.id},${consulting.category_id})"> <span class="cursor">🗑️</span> </td>`;
            });
            // $('#consulting-option').html(idxHtml);
            $('#tr-row').html(dataHtml);
        }
    };
    if(!consultingData){
        $('.mo_inloading').show();
        $('.not_inloading').hide();
        $('#consulting_list_search_input').hide();
        $('#history_cate').html('<option value="none">데이터 로딩중 . . . (카테고리 선택은 조금 대기해주세요)</option>');
        $('.waitplz').hide()
        consultingData = []
        consultingCount = consultingData.length
        let currentPage = 1;  // 현재 페이지 번호
        let pageSize = 5000;  // 페이지당 데이터 개수

        const consultingsWorker = new Worker("../static/js/consultings_worker.js");
        function fetchData() {
            consultingsWorker.postMessage({ page: currentPage, pageSize });
        }
        // Function to handle messages from the Web Worker
        consultingsWorker.onmessage = function (event) {
            $('.mo_inloading').show();
            $('.not_inloading').hide();
            consultingCount = event.data.total_count
            consultingData = event.data.consulting;
            show_request_consulting()
            if(consultingData.length == consultingCount){
                return;
            }
            pageSize=consultingCount
            fetchData();
        };
        fetchData();
    }
    show_request_consulting();
}
async function show_request_consulting() {
    $('.waitplz').show()
    $('.mo_inloading').hide();
    $('.not_inloading').show();
    $('#consulting_list_search_input').show();
    $('#consulting_list_search_input').off('keyup');
    let copy_data = consultingData.slice();
    req_consultings = copy_data.filter(c => c.category_id > 100);
    Consultingcontainer.pagination(Object.assign(ConsultingpaginationOptions, { 'dataSource': req_consultings }));
    let category_set = new Set(req_consultings.map(c => c.category));
    let category_list = [...category_set];
    var idxHtml = `<option value="none">전체</option>`;
    $.each(category_list, function (idx, val) {
        idxHtml += `<option value="${val}">${val}</option>`;
    });
    $('#history_cate').html(idxHtml);
    const updateSearchResult = function () {
        let copy_data = consultingData.slice();
        const selectedCategory = $('#history_cate').val();
        const searchInput = $('#consulting_list_search_input').val().toLowerCase();
        if (selectedCategory != 'none' && searchInput == "") {
            copy_data = copy_data.filter((e) => {
            return e.category == selectedCategory;
            });
            Consultingcontainer.pagination('destroy');
            Consultingcontainer.pagination(Object.assign(ConsultingpaginationOptions, { 'dataSource': copy_data }));
        } else if (selectedCategory != 'none' && searchInput != "") {
            copy_data = copy_data.filter(function (d) {
            return (
                (d.category == selectedCategory) &&
                (d.hasOwnProperty('student_name') && d.student_name.toLowerCase().indexOf(searchInput) !== -1) ||
                (d.hasOwnProperty('origin') && d.origin.toLowerCase().indexOf(searchInput) !== -1)
            );
            });
            Consultingcontainer.pagination('destroy');
            Consultingcontainer.pagination(Object.assign(ConsultingpaginationOptions, { 'dataSource': copy_data }));
        } else if (selectedCategory == 'none' && searchInput != "") {
            copy_data = copy_data.filter(function (d) {
            return (
                (d.hasOwnProperty('student_name') && d.student_name.toLowerCase().indexOf(searchInput) !== -1) ||
                (d.hasOwnProperty('origin') && d.origin.toLowerCase().indexOf(searchInput) !== -1)
            );
            });
            Consultingcontainer.pagination('destroy');
            Consultingcontainer.pagination(Object.assign(ConsultingpaginationOptions, { 'dataSource': copy_data }));
        } else {
            Consultingcontainer.pagination('destroy');
            Consultingcontainer.pagination(Object.assign(ConsultingpaginationOptions, { 'dataSource': copy_data }));
        }
    };
    $('#history_cate, #consulting_list_search_input').on('change keyup', updateSearchResult);
    $('input[name="is_requ"]').change(function() {
        let selectedValue = $('input[name="is_requ"]:checked').val();
        let copy_data = consultingData.slice();
        if(selectedValue == 'none'){
            req_consultings = copy_data
        }else if(selectedValue == 0){
            req_consultings = copy_data.filter(c => c.category_id > 100);
        }else if(selectedValue == 1){
            req_consultings = copy_data.filter(c => c.category_id < 100);
        }else{
            req_consultings = copy_data.filter(c => c.category_id == 100);
        }
        Consultingcontainer.pagination(Object.assign(ConsultingpaginationOptions, { 'dataSource': req_consultings }))
        let category_set = new Set(req_consultings.map(c => c.category));
        let category_list = [...category_set];
        var idxHtml = `<option value="none">전체</option>`;
        $.each(category_list, function (idx, val) {
            idxHtml += `<option value="${val}">${val}</option>`;
        });
        $('#history_cate').html(idxHtml);
    });
}    
function sort_consultingoption(sortBy) {
    switch (sortBy) {
        case "name_desc":
            $('#student_name_sort').html('<strong>원생 이름순 정렬👇</strong>')    
            $('#deadline_sort').html('마감일 정렬👉')
            $('#startdate_sort').html('최근순 정렬👉')         
            $('#consulting_sort').html('미진행 정렬👉')        
            req_consultings.sort(function (a, b) {
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
            $('#student_name_sort').html('원생 이름순 정렬👉')    
            $('#deadline_sort').html('<strong>마감일 정렬👇</strong>')
            $('#startdate_sort').html('최근순 정렬👉')     
            $('#consulting_sort').html('미진행 정렬👉')        
            req_consultings.sort(function (a, b) {
                return new Date(a.deadline) - new Date(b.deadline);
            });
            break;
        
        case "startdate_desc":
            $('#student_name_sort').html('원생 이름순 정렬👉')    
            $('#deadline_sort').html('마감일 정렬👉') 
            $('#startdate_sort').html('<strong>최근순 정렬👇</strong>')        
            $('#consulting_sort').html('미진행 정렬👉')        
            req_consultings.sort(function (a, b) {
                return new Date(b.startdate) - new Date(a.startdate);
            });
            break;
    
        case "consulting_desc":
            $('#student_name_sort').html('원생 이름순 정렬👉')    
            $('#deadline_sort').html('마감일 정렬👉')    
            $('#startdate_sort').html('최근순 정렬👉')
            $('#consulting_sort').html('<strong>미진행 정렬👇</strong>') 
            req_consultings.sort(function (a, b) {
                if (a.done === 0 && b.done === 1) {
                    return -1;
                }
                if (a.done === 1 && b.done === 0) {
                    return 1;
                }
                return 0;
            });
            break;
    }
  
    // 데이터 정렬 후 페이지네이션 다시 설정
    Consultingcontainer.pagination("destroy");
    Consultingcontainer.pagination(
      Object.assign(ConsultingpaginationOptions, { dataSource: req_consultings })
    );
}
function get_consultingdetail(consulting_id) {
    const consulting_history = req_consultings.filter(c=>c.id == consulting_id)[0]
    const teacher_ban_info = banData.filter(b=>b.ban_id == consulting_history.ban_id)[0]
    $('#my_consulting_requestModalLabel').html(`${teacher_ban_info.name}반 ${teacher_ban_info.teacher_name}( ${teacher_ban_info.teacher_engname} )T의 ${consulting_history.category}`);
    
    let temp_his = ``;
    if(consulting_history.done == 0){
        temp_his += `
        <div class="modal-body-select-container">
            <div class="modal-body-select-label">✔️</div>
            <div>미진행</div>
        </div>
        `
    }else{
        temp_his += `
        <div class="modal-body-select-container">
            <div class="modal-body-select-label"><span class="modal-body-select-container-span">상담</span></div>
            <div class="w-25">상담 완료</div>
            <div class="modal-body-select-label"><span class="modal-body-select-container-span">상담 일시</span></div>
            <div class="w-25">${make_date(consulting_history.created_at)}</div>
        </div>
        `
    }
    temp_his += `
        <div class="modal-body-select-container">
            <div class="modal-body-select-label"><span class="modal-body-select-container-span">원생</span></div>
            <div class="w-25">${consulting_history.student_engname} (${consulting_history.student_name})</div>
            <div class="modal-body-select-label"><span class="modal-body-select-container-span">원번</span></div>
            <div class="w-25">${consulting_history.origin}</div>
        </div>
        <div class="d-flex flex-column justify-content-start py-3">
            <div class="modal-body-select-label"><span class="modal-body-select-container-span">내용</span></div>
            <div class="mt-3 px-2">${consulting_history.category}</div>
            <div class="mt-2 px-2">${consulting_history.contents.replace(/\n/g, '</br>')}</div>
        </div>
    `;

    if(consulting_history.done == 1){
        let solution = consulting_history.solution.replace(/\n/g, '</br>')
        temp_his += `
        <div class="d-flex flex-column justify-content-start py-3">
            <div class="modal-body-select-label"><span class="modal-body-select-container-span">상담 사유</span></div>
            <div class="mt-3 px-2">${consulting_history.reason}</div>
        </div>
        <div class="d-flex flex-column justify-content-start py-3">
            <div class="modal-body-select-label"><span class="modal-body-select-container-span">제공한 가이드</span></div>
            <div class="mt-3 px-2">${solution}</div>
        </div>
        `
    }

    temp_his += `
        <div class="w-100 pt-3 d-flex justify-content-center">
            <button class="btn btn-danger" onclick="get_request_consulting()">목록</button>
        </div>
    `
    $('#consulting_history_contents_box').html(temp_his);
    $('#request_consulting_listbox').hide();
    $('#request_consultingban_listbox').show();
}

// 요청 업무관리 기능 
function get_task_chunk(currentPage,pageSize,task_type){
    if(!banData){
        delay(1000); // 1초의 지연을 줌
    } 
    const tasksWorker = new Worker("../static/js/tasks_worker.js");
    function task_fetchData(){
        tasksWorker.postMessage({ page: currentPage, pageSize });
    }
    task_fetchData();
    tasksWorker.onmessage = function (event) {
        $('.mo_inloading').show()
        $('.not_inloading').hide()
        let before_task_num = taskData.length
        taskCount = event.data.total_count
        taskData = taskData.concat(event.data.task);
        let category_list = []
        let sevenDays = new Date()
        sevenDays = new Date(sevenDays.getFullYear(), sevenDays.getMonth(), sevenDays.getDate()-7).setHours(0, 0, 0, 0);
        
        var idxHtml = `<option value="none" selected>전체</option>`;
        for (let i = before_task_num; i < taskData.length; i++) {
            category_list.push(taskData[i].category)
            const ban = banMap.get(taskData[i].ban_id);
            taskData[i].ban_name = ban ? ban.ban_name : '';
            taskData[i].teacher_name = ban ? ban.teacher_name : '';
            taskData[i].teacher_email = ban ? ban.teacher_email : '';
            taskData[i].done_code = 0
            let done_date = new Date(taskData[i].created_at);
            done_date =  new Date(done_date.getFullYear(), done_date.getMonth(), done_date.getDate()).setHours(0, 0, 0, 0);
            if( (taskData[i].created_at != null) && ( (taskData[i].cycle != todayyoil && sevenDays <= done_date)||(taskData[i].cycle == todayyoil && today == done_date) )){
                taskData[i].done_code = 1
            }
        }
        var category_set = new Set(category_list)
        category_list = [...category_set]
        $.each(category_list, function (idx, val) {
            idxHtml += `<option value="${val}">${val}</option>`
        })
        $('#task-category-select').html(idxHtml);
        
        taskData.sort(function(a,b){
            return a.done_code - b.done_code
        })
        if(task_type == 0){
            return get_request_task()
        }else{
            return get_requestall_task()
        }
    }
}
function get_task_data(task_type){
    var con_val = confirm('과거 데이터를 불러오시겠습니까?')
    if (con_val == true) {
        let currentPage = taskData.length;  // 현재 페이지 번호
        let pageSize = 2000;  // 페이지당 데이터 개수
        if(currentPage < taskCount){
            get_task_chunk(currentPage,pageSize,task_type)
        }else{
            alert('더이상 불러올 데이터가 없습니다.');
            return;
        }
    }
}
async function get_request_task(){
    $('.mo_inloading').show()
    $('.not_inloading').hide()
    $('.task_search').hide()
    $('#task_list_button').hide()
    $('#for_taskban_list').hide()
    $('#for_all_task').hide()
    $('#task-pagination').empty()
    if (!taskData) {
        taskData = []
        let currentPage = 0;  // 현재 페이지 번호
        let pageSize = 2000;  // 페이지당 데이터 개수
        get_task_chunk(currentPage,pageSize,0)
    }else{
        if(taskCount == 0){
            $('#requ_task_list').hide();
            $('#taskModalLabel').html('요청중인 업무가 없습니다')
        }
        taskGrouped = taskData.reduce((acc, item) => {
            if (!acc[item.id]) {
                acc[item.id] = [];
            }
            acc[item.id].push(item);
            return acc;
        }, {});
        // 결과를 객체의 배열로 변환 -> 상담 별 배열 
        taskGroupedresult = Object.entries(taskGrouped).map(([v, items]) => {
            return { [v]: items };
        });
        let container = $('#task-pagination')
        var paginationOptions = {
            prevText: '이전',
            nextText: '다음',
            pageSize: 10,
            callback: function (taskGroupedresult, pagination) {
                var dataHtml = '';
                $.each(taskGroupedresult, function (index, task) {
                    let key = Object.keys(task)[0]
                    let tasks = task[key]
                    let total_tasks = tasks.length
                    let done_tasks = total_tasks != 0 ? tasks.filter(t=>t.done_code != 0).length : 0
                    let task_info = task[key][0]
                    dataHtml += `
                        <td class="col-2">"${(make_date(task_info.startdate))}" ~ "${(make_date(task_info.deadline))}"</td>
                        <td class="col-1"> ${make_cycle(task_info.cycle)}</td>
                        <td class="col-1">${make_priority(task_info.priority)}</td>
                        <td class="col-4">${task_info.category} 업무 :  ${task_info.contents}</td>
                        <td class="col-2">총 ${total_tasks}개 반 진행 중   (${answer_rate(done_tasks,total_tasks).toFixed(0)} % 완수 )</td>
                        <td class="col-1" onclick ="get_taskban(${key})"> <span class="cursor">🔍</span> </td>
                        <td class="col-1" onclick="delete_tasks(${key})"> <span class="cursor">🗑️</span> </td>`;
                });
                $('#task-tr').html(dataHtml);
            }
        }
        container.pagination(Object.assign(paginationOptions, {'dataSource': taskGroupedresult}))
        if(taskData.length < taskCount){
            $('#task-pagination').append(`<button class="btn btn-success" onclick="get_task_data(${0})">과거 데이터 더 불러오기</button>`)
        }
        $('#task-category-select').change(function() {
            let copy_data = taskData.slice()
            let target = copy_data
            if($(this).val() != "none"){
                target = copy_data.filter(t=>t.category == $(this).val())
            }
            targetGrouped = target.reduce((acc, item) => {
                if (!acc[item.id]) {
                    acc[item.id] = [];
                }
                acc[item.id].push(item);
                return acc;
            }, {});
            // 결과를 객체의 배열로 변환 -> 상담 별 배열 
            targetGroupedresult = Object.entries(targetGrouped).map(([v, items]) => {
                return { [v]: items };
            });
            container.pagination(Object.assign(paginationOptions, {'dataSource': targetGroupedresult}))
        });

        $('input[name="is_task"]').change(function() {
            let selectedValue = $('input[name="is_task"]:checked').val();
            if(selectedValue == 'none'){
                return get_request_task()
            }else{
                get_requestall_task()
            }
        });
    }
    $('.mo_inloading').hide()
    $('.not_inloading').show()
    $('.task_kind').show()
    $('#requ_task_list').show()
    $('#for_task_list').show()
    $('#taskModalLabel').html('요청한 업무 목록');
}
async function get_requestall_task(){
    $('#taskreqban_search_input').off('keyup');
    $('.mo_inloading').show()
    $('.not_inloading').hide()
    $('#task_list_button').hide()
    $('#for_task_list').hide()
    $('#for_taskban_list').hide()
    $('#task-pagination').empty()
    if (!taskData) {
        taskData = []
        let currentPage = 0;  // 현재 페이지 번호
        let pageSize = 2000;  // 페이지당 데이터 개수
        get_task_chunk(currentPage,pageSize,1)
    }else{
        if(taskCount == 0){
            $('#requ_task_list').hide();
            $('#taskModalLabel').html('요청중인 업무가 없습니다')
            return;
        }
        let target = taskData.slice()
        let container = $('#task-pagination')
        var paginationOptions = {
            prevText: '이전',
            nextText: '다음',
            pageSize: 10,
            callback: function (target, pagination) {
                var dataHtml = '';
                $.each(target, function (index, task) {
                    dataHtml += `
                        <td class="col-2">"${make_date(task.startdate)}" ~ "${make_date(task.deadline)}"</td>
                        <td class="col-1">${make_cycle(task.cycle)}</td>
                        <td class="col-1">${make_priority(task.priority)}</td>
                        <td class="col-2">${task.category} </br>  ${task.contents}</td>
                        <td class="col-1">${task.ban_name}</td>
                        <td class="col-1">${task.teacher_name}</td>
                        <td class="col-1">${task.teacher_email}</td>
                        <td class="col-1">${make_reject_code(task.done_code)}</td>
                        <td class="col-1">${make_date_with_yoil(task.created_at)}</td>
                        <td class="col-1" onclick="delete_task(${task.taskban_id})"> <span class="cursor">🗑️</span> </td>`;
                });
                $('#task-tr').html(dataHtml);
            }
        }
        container.pagination(Object.assign(paginationOptions, {'dataSource': target}))
        if(taskData.length < taskCount){
            $('#task-pagination').append(`<button class="btn btn-success" onclick="get_task_data(${1})">과거 데이터 더 불러오기</button>`)
        }
        const updateSearchResult = function () {
            let copy_data = taskData.slice();
            const selectedCategory = $('#task-category-select').val();
            const searchInput = $('#taskreqban_search_input').val().toLowerCase();
            let target = copy_data
            if (selectedCategory != 'none' && searchInput == "") {
                target = target.filter((e) => {
                    return e.category == selectedCategory;
                });
            } else if (selectedCategory != 'none' && searchInput != "") {
                target = target.filter(function (d) {
                    return (
                        (d.category == selectedCategory) &&
                        (d.hasOwnProperty('ban_name') && d.ban_name.toLowerCase().indexOf(searchInput) !== -1) ||
                        (d.hasOwnProperty('teacher_name') && d.teacher_name.toLowerCase().indexOf(searchInput) !== -1)||
                        (d.hasOwnProperty('category') && d.category.toLowerCase().indexOf(searchInput) !== -1)||
                        (d.hasOwnProperty('contents') && d.contents.toLowerCase().indexOf(searchInput) !== -1)
                    );
                });
            } else if (selectedCategory == 'none' && searchInput != "") {
                target = target.filter(function (d) {
                    return (
                        (d.hasOwnProperty('ban_name') && d.ban_name.toLowerCase().indexOf(searchInput) !== -1) ||
                        (d.hasOwnProperty('teacher_name') && d.teacher_name.toLowerCase().indexOf(searchInput) !== -1)||
                        (d.hasOwnProperty('category') && d.category.toLowerCase().indexOf(searchInput) !== -1)||
                        (d.hasOwnProperty('contents') && d.contents.toLowerCase().indexOf(searchInput) !== -1)
                    );
                });
            } 
            container.pagination('destroy');
            container.pagination(Object.assign(paginationOptions, { 'dataSource': target }));
        };
        $('#task-category-select, #taskreqban_search_input').on('change keyup', updateSearchResult);
        $('input[name="is_task"]').change(function() {
            let selectedValue = $('input[name="is_task"]:checked').val();
            if(selectedValue == 'none'){
                return get_request_task()
            }else{
                return get_requestall_task
            }
        });
        
    }
    $('.mo_inloading').hide()
    $('.not_inloading').show()
    $('.task_kind').show()
    $('.task_search').show()
    $('#requ_task_list').show()
    $('#for_all_task').show()
    $('#taskModalLabel').html('요청업무 진행 반 목록');
}
function get_taskban(key){
    $('#taskreqban_search_input').off('keyup');
    $('.task_kind').hide()
    $('#for_all_task').hide()
    $('#task-pagination').empty()
    $('.task_search').show()
    $('#task_list_button').show()
    tinfo =  taskData.filter(t=>t.id== key)
    $('#taskModalLabel').html(tinfo[0].category+' | "'+tinfo[0].contents+'" 업무를 진행중인 반 목록');
    $('#for_task_list').hide()
    $('#for_taskban_list').show()
    let container = $('#task-pagination')
    var paginationOptions = {
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        pageClassName: 'float-end',
        callback: function (data, pagination) {
            var dataHtml = '';
            $.each(data, function (index, item) {
                dataHtml += `
                <td class="col-1"> ${make_cycle(item.cycle)}</td>
                <td class="col-1">${make_priority(item.priority)}</td>
                <td class="col-3">${item.category} 업무 :  ${item.contents}</td>
                <td class="col-1">${item.ban_name}</td>
                <td class="col-1">${item.teacher_name}</td>
                <td class="col-2">${item.teacher_email}</td>
                <td class="col-1">${make_reject_code(item.done_code)}</td>
                <td class="col-1">${make_date_with_yoil(item.created_at)}</td>
                <td class="col-1"><button class="modal-tbody-btn" onclick="delete_task(${item.taskban_id})">🗑️</button></td>`;
            });
            $('#task-tr').html(dataHtml);
        }
    };
    container.pagination(Object.assign(paginationOptions, {'dataSource': tinfo}))

    $('#taskreqban_search_input').on('keyup', function () {
        var searchInput = $(this).val().toLowerCase();
        let copy_data = tinfo.slice()
        if(searchInput == ""){
            container.pagination('destroy');
            container.pagination(Object.assign(paginationOptions, { 'dataSource': copy_data }));
        }else{
            var filteredData = copy_data.filter(function (data) {
                return data.hasOwnProperty('ban_name') && data.ban_name.toLowerCase().indexOf(searchInput) !== -1 || data.hasOwnProperty('teacher_name') && data.teacher_name.toLowerCase().indexOf(searchInput) !== -1  || data.hasOwnProperty('category') && data.category.toLowerCase().indexOf(searchInput) !== -1  || data.hasOwnProperty('contents') && data.contents.toLowerCase().indexOf(searchInput) !== -1;
            });
            container.pagination('destroy');
            container.pagination(Object.assign(paginationOptions, { 'dataSource': filteredData }));
        }
        
    });

}  
async function delete_task(idx) {
    const csrf = $('#csrf_token').val();
    var con_val = confirm('정말 삭제하시겠습니까?')
    if (con_val == true) {
        await $.ajax({
            url: '/manage/api/delete_task/' + idx,
            type: 'POST',
            headers: { 'content-type': 'application/json' },
            data: {},
            success: function (data) {
                if (data.status == 200) {
                    alert(`삭제되었습니다.`)
                    window.location.reload()
                } else {
                    alert(`실패 ${data.status} ${data.text}`)
                }
            },
            error: function (xhr, status, error) {
                alert(xhr.responseText);
            }
        })
    }
}
async function delete_tasks(idx) {
    idx = Number(idx)
    const csrf = $('#csrf_token').val();
    var con_val = confirm('요청된 업무를 전부 삭제하시겠습니까?')
    if (con_val == true) {
        await $.ajax({
            url: '/manage/api/every_delete_tasks/' + idx,
            type: 'POST',
            headers: { 'content-type': 'application/json' },
            data: {},
            success: function (data) {
                if (data.status == 200) {
                    alert(`삭제되었습니다.`)
                    window.location.reload()
                } else {
                    alert(`실패 ${data.status} ${data.text}`)
                }
            },
            error: function (xhr, status, error) {
                alert(xhr.responseText);
            }
        })
    }
}

