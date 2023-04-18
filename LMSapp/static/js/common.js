// 전역변수로 api에서 불러온 정보를 저장 
let switchstudentData,outstudentData,banData,studentsData, consultingData,consultingcateData, taskData,taskcateData,questionData,answerData,attachData; ; 

var totalData = 0; //총 데이터 수
var dataPerPage = 6;
var pageCount = 10; //페이징에 나타낼 페이지 수
var globalCurrentPage = 1; //현재 페이지
var data_list;
const today = new Date().setHours(0, 0, 0, 0);

let make_recobook = function(c){
    if( c == null){
        return '❌'
    } else if(c == 'NOT'){
        result = c + ' (추천도서없음)'
        return result
    }else{
        return c
    }
}
let make_reject_code = function(rc){
    if( rc == 0){
        return '❌';
    }else{
        return '⭕';
    }
}
let make_cycle = function(c){
    if( c == 1){
        return '월요일 마다';
    }else if( c == 2){
        return '화요일 마다';
    }else if( c == 3){
        return '수요일 마다';
    }else if( c == 4){
        return '목요일 마다';
    }else if( c == 5){
        return '금요일 마다';
    }else{
        return '주기 없음';
    }
}
let make_date = function(d){
    if(d==null){
        return '❌'
    }
    const date = new Date(d)
    return date.getFullYear()+'-'+(date.getMonth()+ 1).toString().padStart(2, '0')+'-'+date.getDate().toString().padStart(2, '0')
}
let missed_date = function(d){
    const date = new Date(d)
    const standard = new Date('1111-01-01')
    if(date.getTime() == standard.getTime()){
        return "없음"
    }else if(date.setHours(0, 0, 0, 0) == today){
        return "오늘"
    }else{
        return date.getFullYear()+'-'+(date.getMonth()+ 1).toString().padStart(2, '0')+'-'+date.getDate().toString().padStart(2, '0')
    }
}
let make_priority = function(priority) {
    if(priority==1) return '';
    else if(priority==2) return '오후업무';
    else if(priority==3) return '오전업무🌞';
    else return '긴급업무⚡';
}
let answer_rate =  function(answer, all) {
    if(Object.is(answer/all, NaN)) return 0;
    else return answer/all*100;
}
let make_semester=function(semester){
    if (semester == 1){
        return 1;
    }else if(semester == 2){
        return 5;
    }else if(semester == 0){
        return 9;
    }else{
        return semester
    }
}
function q_category(category) {
    if (category == 0 || category == '0' ) {
        c ='일반문의'
    }else if(category == 1 || category == '1' ) {
        c ='퇴소문의'
    }else{
        c ='이반문의'
    }
    return c
}
function make_nodata(d){
    if(d==0){
        return '❌'
    }else{
        return d+'건'
    }
}
function make_duedate(s,d){
    sdate=new Date(s).setHours(0, 0, 0, 0)
    ddate=new Date(d).setHours(0, 0, 0, 0)
    if(today < sdate){
        return '진행 예정'
    }else if(sdate <= today && today <= ddate){
        return '진행 중'
    }else if(ddate < today){
        return '마감'
    }else {
        return '오류'
    }
}


async function get_all_ban() {
    try{
        const response = await $.ajax({
            type: "GET",
            url: "/common/all_ban",
            dataType: 'json',
            data: {},
        });
        outstudentData = response['outstudent']
        switchstudentData = response['switchstudent']
        response['all_ban'].forEach((elem) => {
            elem.out_num = outstudentData.filter(a => a.ban_id == elem.ban_id).length
            elem.switch_minus_num = switchstudentData.filter(a => a.ban_id == elem.ban_id).length
            elem.switch_plus_num = switchstudentData.filter(a => a.switch_ban_id == elem.ban_id).length
            elem.out_num_per = answer_rate(elem.out_num, elem.student_num+elem.out_num+elem.switch_minus_num-elem.switch_plus_num).toFixed(2)
        });
        banData = response['all_ban'].sort((a, b) =>{
                if (b.out_num_per !== a.out_num_per) {
                return b.out_num_per - a.out_num_per; // out_num_per 큰 순으로 정렬
            }else{
                return b.student_num - a.student_num; // students.length가 큰 순으로 정렬
            }
        })
    } catch (error) {
        alert('Error occurred while retrieving data.');
    }
}
async function get_all_students() {
    try{
        const response = await $.ajax({
            url: '/common/all_students',
            type: 'GET',
            data: {},
        });
        studentsData = response['students']
    } catch (error) {
        alert('Error occurred while retrieving data.');
    }
}
async function get_all_consulting() {
    try {
        const response = await $.ajax({
            url: '/common/consulting',
            type: 'GET',
            data: {},
        });
        consultingData = response['consulting']
    } catch (error) {
        alert('Error occurred while retrieving data.');
    }
}
async function get_all_task() {
    try {
        const response = await $.ajax({
            url: '/common/task',
            type: 'GET',
            data: {},
        });
        taskData = response['task']
    } catch (error) {
        alert('Error occurred while retrieving data.');
    }
}

// 전체 반 정보(차트) 가져오는 함수 
async function get_total_data() {
    $('#semester').hide();
    $('#detailban').show();
    $('#qubox').hide()
    $('#sobox').hide()
    $('#ulbox').hide()
    $('#target_ban_info_body').hide()
    try{
        $('#inloading').show()
        $('#semester_pagination').hide()
        if(!banData){
            await get_all_ban().then(()=>{
                total_student_num = banData[0].total_student_num
                outstudent_num = outstudentData.length;
                switchstudent_num = switchstudentData.length
                first_total = total_student_num + outstudent_num
                // 학기 별 원생
                onesemester = total_student_num != 0 ? banData.filter(e => e.semester == 1) : 0
                fivesemester = total_student_num != 0 ? banData.filter(e => e.semester == 2) : 0
                ninesemester = total_student_num != 0 ? banData.filter(e => e.semester == 0) : 0
        
                // 학기별 원생수 및 퇴소 원생 수 
                onesemester_total = onesemester[0].semester_student_num
                oneoutnum = onesemester.reduce((acc, item) => acc + item.out_num, 0);
                first_onesemester = onesemester_total + oneoutnum
        
                fivesemester_total = fivesemester[0].semester_student_num
                fiveoutnum = fivesemester.reduce((acc, item) => acc + item.out_num, 0);
                first_fivesemester = fivesemester_total + fiveoutnum
        
                ninesemester_total = ninesemester[0].semester_student_num
                nineoutnum = ninesemester.reduce((acc, item) => acc + item.out_num, 0);
                first_ninesemester = ninesemester_total + nineoutnum
        
                let semester_student_table = `
                    <table>
                        <tr>
                            <th class="need"></th>
                            <th>초기 등록 원생 수</th>
                            <th>현재 원생 수</th>
                            <th>퇴소 원생 수 (퇴소율)</th>
                            <th>학기 별 반 리스트</th>
                        </tr>
                        <tr>
                            <th class="need">전체</th>
                            <td>${first_total}명</td>
                            <td>${total_student_num}명</td>
                            <td>${outstudent_num}명(${answer_rate(outstudent_num, first_total).toFixed(2)}%)</td>
                            <td><span class='cursor-pointer fs-4' onclick="semesterShow(${3}">📜</span></td>
                        </tr>
                        <tr>
                            <th class="need">1월 학기</th>
                            <td>${first_onesemester}명</td>
                            <td>${onesemester_total}명</td>
                            <td>${oneoutnum}명(${answer_rate(oneoutnum, outstudent_num).toFixed(1)}%)</td>
                            <td><span class='cursor-pointer fs-4' onclick="semesterShow(${1})">📜</span></td>
                        </tr>
                        <tr>
                            <th class="need">5월 학기</th>
                            <td>${first_fivesemester}명</td>
                            <td>${fivesemester_total}명</td>
                            <td>${fiveoutnum}명(${answer_rate(fiveoutnum, outstudent_num).toFixed(1)}%)</td>
                            <td><span class='cursor-pointer fs-4' onclick="semesterShow(${2})">📜</span></td>
                        </tr>
                        <tr>
                            <th>9월 학기</th>
                            <td>${first_ninesemester}명</td>
                            <td>${ninesemester_total}명</td>
                            <td>${nineoutnum}명(${answer_rate(nineoutnum, outstudent_num).toFixed(1)}%)</td>
                            <td><span class='cursor-pointer fs-4' onclick="semesterShow(${0})">📜</span></td>
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
                            data: [total_student_num, onesemester_total, fivesemester_total, ninesemester_total],
                            backgroundColor: ['#F66F5B77', '#FFBCE277', '#FE85AB77', '#C24F7777'],
                            borderColor: ['#F66F5B', '#FFBCE2', '#FE85AB', '#C24F77'],
                            borderWidth: 2
                        }, {
                            type: 'line',
                            label: '퇴소 원생 수',
                            data: [outstudent_num, oneoutnum, fiveoutnum, nineoutnum],
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
                semesterShow(3);
                $('#inloading').hide();
                $('#semester_pagination').show();
                $('#target_ban_info_body').show();
            })
        }else{
            total_student_num = banData[0].total_student_num
            outstudent_num = outstudentData.length;
            switchstudent_num = switchstudentData.length
            first_total = total_student_num + outstudent_num
            // 학기 별 원생
            onesemester = total_student_num != 0 ? banData.filter(e => e.semester == 1) : 0
            fivesemester = total_student_num != 0 ? banData.filter(e => e.semester == 2) : 0
            ninesemester = total_student_num != 0 ? banData.filter(e => e.semester == 0) : 0
    
            // 학기별 원생수 및 퇴소 원생 수 
            onesemester_total = onesemester[0].semester_student_num
            oneoutnum = onesemester.reduce((acc, item) => acc + item.out_num, 0);
            first_onesemester = onesemester_total + oneoutnum
    
            fivesemester_total = fivesemester[0].semester_student_num
            fiveoutnum = fivesemester.reduce((acc, item) => acc + item.out_num, 0);
            first_fivesemester = fivesemester_total + fiveoutnum
    
            ninesemester_total = ninesemester[0].semester_student_num
            nineoutnum = ninesemester.reduce((acc, item) => acc + item.out_num, 0);
            first_ninesemester = ninesemester_total + nineoutnum
    
            let semester_student_table = `
                <table>
                    <tr>
                        <th class="need"></th>
                        <th>초기 등록 원생 수</th>
                        <th>현재 원생 수</th>
                        <th>퇴소 원생 수 (퇴소율)</th>
                        <th>학기 별 반 리스트</th>
                    </tr>
                    <tr>
                        <th class="need">전체</th>
                        <td>${first_total}명</td>
                        <td>${total_student_num}명</td>
                        <td>${outstudent_num}명(${answer_rate(outstudent_num, first_total).toFixed(2)}%)</td>
                        <td><span class='cursor-pointer fs-4' onclick="semesterShow(${3}">📜</span></td>
                    </tr>
                    <tr>
                        <th class="need">1월 학기</th>
                        <td>${first_onesemester}명</td>
                        <td>${onesemester_total}명</td>
                        <td>${oneoutnum}명(${answer_rate(oneoutnum, outstudent_num).toFixed(1)}%)</td>
                        <td><span class='cursor-pointer fs-4' onclick="semesterShow(${1})">📜</span></td>
                    </tr>
                    <tr>
                        <th class="need">5월 학기</th>
                        <td>${first_fivesemester}명</td>
                        <td>${fivesemester_total}명</td>
                        <td>${fiveoutnum}명(${answer_rate(fiveoutnum, outstudent_num).toFixed(1)}%)</td>
                        <td><span class='cursor-pointer fs-4' onclick="semesterShow(${2})">📜</span></td>
                    </tr>
                    <tr>
                        <th>9월 학기</th>
                        <td>${first_ninesemester}명</td>
                        <td>${ninesemester_total}명</td>
                        <td>${nineoutnum}명(${answer_rate(nineoutnum, outstudent_num).toFixed(1)}%)</td>
                        <td><span class='cursor-pointer fs-4' onclick="semesterShow(${0})">📜</span></td>
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
                        data: [total_student_num, onesemester_total, fivesemester_total, ninesemester_total],
                        backgroundColor: ['#F66F5B77', '#FFBCE277', '#FE85AB77', '#C24F7777'],
                        borderColor: ['#F66F5B', '#FFBCE2', '#FE85AB', '#C24F77'],
                        borderWidth: 2
                    }, {
                        type: 'line',
                        label: '퇴소 원생 수',
                        data: [outstudent_num, oneoutnum, fiveoutnum, nineoutnum],
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
            semesterShow(3);
            $('#inloading').hide();
            $('#semester_pagination').show();
            $('#target_ban_info_body').show();
        }
    }catch(error){
        alert('Error occurred while retrieving data.');
    }
}
function semesterShow(semester) {
    $('#ban_search_input').off('keyup');
    $('#semester').show();
    if(semester == 0){
        $('#semester_s').html('9월 학기');
        resultData = ninesemester;
    }else if(semester == 1){
        $('#semester_s').html('1월 학기');
        resultData = onesemester;
    }else if(semester == 2){
        $('#semester_s').html('5월 학기');
        resultData = fivesemester;
    }else{
        $('#semester_s').html('전체 반')
        resultData = banData;
    }
    var paginationOptions = {
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        pageClassName: 'float-end',
        callback: function (data, pagination) {
            var temp_semester_banlist = '';
            $.each(data, function (index, item) {
                let teacher_name = item.teacher_engname + '( ' + item.teacher_name +' )'
                let total_out_count = item.out_num + item.switch_minus_num
                temp_semester_banlist += `
                <td class="col-2">${item.name}</td>
                <td class="col-2">${teacher_name}</td>
                <td class="col-1">${item.student_num}</td>
                <td class="col-1">${item.student_num + total_out_count - item.switch_plus_num}</td>
                <td class="col-2">${item.switch_plus_num}</td>
                <td class="col-2"> 총: ${total_out_count}명 ( 퇴소 : ${item.out_num} / 이반 : ${item.switch_minus_num} )</td>
                <td class="col-1"><strong> ${item.out_num_per} %</strong></td>
                <td class="col-1" data-bs-toggle="modal" data-bs-target="#teacherinfo" onclick="getTeacherInfo(${item.teacher_id})"><span class="cursor-pointer">👉</span></td>;`;
            });
            $('#semester_banlist').html(temp_semester_banlist)
        }
    };
    
    var SemesterContainer = $('#semester_pagination')
    SemesterContainer.pagination(Object.assign(paginationOptions, { 'dataSource': resultData }))

    $('#ban_search_input').on('keyup', function () {
        var searchInput = $(this).val().toLowerCase();
        var filteredData = resultData.filter(function (data) {
            return (data.hasOwnProperty('name') && data.name.toLowerCase().indexOf(searchInput) !== -1) || (data.hasOwnProperty('teacher_name') && data.teacher_name.toLowerCase().indexOf(searchInput) !== -1) || (data.hasOwnProperty('teacher_engname') && data.teacher_engname.toLowerCase().indexOf(searchInput) !== -1);
        });
        SemesterContainer.pagination('destroy');
        SemesterContainer.pagination(Object.assign(paginationOptions, { 'dataSource': filteredData }));
    });

}

async function getTeacherInfo(t_id){
    $('#teacher_infobox').show()
    $('#student_data').hide()
    let info = banData.filter(t=>t.teacher_id == t_id)
    if (info.length == 0){
        let no_data_title = `<h1> ${response.text} </h1>`
        $('#teacherModalLabel').html(no_data_title);
        return
    }else{
        // $('#consultingban_search_input').off('keyup');
        $('#teachertitle').html(`${info[0].teacher_engname}선생님 현황`)
        $('.mo_inloading').show()
        $('.monot_inloading').hide()
        if (!consultingData && taskData) {
            // await get_all_students()
            await get_all_consulting().then(() => {
                $('.mo_inloading').hide()
                $('.monot_inloading').show()
            });
        }else if (consultingData && !taskData) {
            await get_all_task().then(() => {
                $('.mo_inloading').hide()
                $('.monot_inloading').show()
            });
        }else if (!consultingData && !taskData) {
            await get_all_task()
            await get_all_consulting().then(() => {
                $('.mo_inloading').hide()
                $('.monot_inloading').show()
            });
        }
        $('.mo_inloading').hide()
        $('.monot_inloading').show()
        let temp_profile_data = `
            <tbody  style="width:100%;">
                <tr class="row tagtagtitle">
                    <th class="col-12">담임 선생님 정보</th>
                </tr>
                <tr class="row tagtagtitle">
                    <td class="col-4">${info[0].teacher_name}(${info[0].teacher_engname})</th>
                    <td class="col-4"> 📞 ${info[0].teacher_mobileno} </th>
                    <td class="col-4"> ✉️ ${info[0].teacher_email}</th>
                </tr>
            </tbody>
        `;
        $('#profile_data').html(temp_profile_data);
        // 선생님의 미학습 데이터 
        TconsultingData =  consultingData.filter(c=>c.teacher_id == t_id && new Date(c.startdate).setHours(0, 0, 0, 0) <= today)
        TunlearnedData = TconsultingData.filter(c=>c.category_id < 100)
        unlearned_ttc = TunlearnedData.length

        TTaskData =  taskData.filter(t=>t.teacher_id ==t_id)
        let IsG3 = false
        // let my_consulting = consultingData.filter(a => a.teacher_id == t_id && a.startdate <= today)
        // let u_consulting_my = my_consulting.filter(a => a.category_id < 100);
        // let TstudentsData =studentsData.filter(t=>t.teacher_id == t_id)
        let temp_baninfo = ''
        let total_student_num = 0
        let os = 0
        let ss = 0
        info.forEach(ban_data => {
            if(ban_data.name.toLowerCase().includes('meteor') || ban_data.name.toLowerCase().includes('nebula')){
                IsG3 = true
            }else{
                IsG3 = false
            }
            total_student_num += ban_data.student_num
            os += ban_data.out_num
            ss += ban_data.switch_minus_num
            unlearned = TunlearnedData.filter(c=>c.ban_id == ban_data.ban_id).length
            temp_baninfo += `
            <td class="col-3">${ban_data.name}</td>
            <td class="col-1">${make_semester(ban_data.semester)}학기</td>
            <td class="col-1">${ban_data.student_num}명</td>
            <td class="col-2"> ${ban_data.out_num}건 ( ${ban_data.out_num_per}% )</td>
            <td class="col-1"> 유입+ : ${ban_data.switch_plus_num}건</td>
            <td class="col-1"> 이반- : ${ban_data.switch_minus_num}건</td>
            <td class="col-2"> ${unlearned}건</td>
            <td class="col-1" data-bs-toggle="modal" data-bs-target="#target_ban_info" onclick="getBanChart(${ban_data.ban_id})"> ✅ </td>
            `;
        });
        $('#mybaninfo').html(temp_baninfo);
        
        let temp_teacher_info_student_num = `
            <span>관리중:${ total_student_num }</span><br>
            <span>* 이반:${ ss }</span><br>
            <span>* 퇴소:${ os }</span>
        `
        $('#teacher_info_student_num').html(temp_teacher_info_student_num)
        
        var chart = Chart.getChart('total-chart-element')
        if (chart) {
            chart.destroy()
        }

        new Chart($(('#total-chart-element')), {
            type: 'doughnut',
            data: {
                labels: ['관리중', '이반', '퇴소'],
                datasets: [
                    {
                        data: [total_student_num, ss, os],
                        backgroundColor: ['#B39CD0', '#ffd400', '#F23966'],
                        hoverOffset: 4,
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
        });

        // 미학습 상담
        let unlearned_ttd = TunlearnedData.filter(u=>u.done == 1).length
        $('#ucomcom').html(`<td class="col-4"> 완수: ${unlearned_ttd} / ${unlearned_ttc}건 </td> <td class="col-4"> ${answer_rate(unlearned_ttd,unlearned_ttc).toFixed(0)}% </td><td class="col-4"><strong> ${answer_rate(unlearned_ttc,TunlearnedData[0].total_unlearned_consulting).toFixed(2)}% </strong></td>`);
        let temp_html = ''
        if(IsG3){
            temp_html = `
            <th class="col-2">IXL</th>
            <th class="col-2">리딩</th>
            <th class="col-3">인투리딩 미응시</th>
            <th class="col-3">라이팅 과제</th>
            <th class="col-2">미접속</th>
            <td class="col-2">${make_nodata(TunlearnedData.filter(u=>u.category_id == 1).length)}</td>
            <td class="col-2">${make_nodata(TunlearnedData.filter(u=>u.category_id == 4).length)}</td>
            <td class="col-3">${make_nodata(TunlearnedData.filter(u=>u.category_id == 5).length)}</td>
            <td class="col-3">${make_nodata(TunlearnedData.filter(u=>u.category_id == 6).length)}</td>
            <td class="col-2">${make_nodata(TunlearnedData.filter(u=>u.category_id == 2).length)}</td>
            `;
        }else{
            temp_html = `
            <th class="col-2">IXL</th>
            <th class="col-2">리딩</th>
            <th class="col-2">리특</th>
            <th class="col-2">인투리딩 미응시</th>
            <th class="col-2">라이팅 과제</th>
            <th class="col-2">미접속</th>
            <td class="col-2">${make_nodata(TunlearnedData.filter(u=>u.category_id == 1).length)}</td>
            <td class="col-2">${make_nodata(TunlearnedData.filter(u=>u.category_id == 4).length)}</td>
            <td class="col-2">${make_nodata(TunlearnedData.filter(u=>u.category_id == 3).length)}</td>
            <td class="col-2">${make_nodata(TunlearnedData.filter(u=>u.category_id == 5).length)}</td>
            <td class="col-2">${make_nodata(TunlearnedData.filter(u=>u.category_id == 6).length)}</td>
            <td class="col-2">${make_nodata(TunlearnedData.filter(u=>u.category_id == 2).length)}</td>
            `;
        }
        $('#totalreport-row').html(temp_html)


        let TtasktodayData = TTaskData.filter(t => new Date(t.startdate).setHours(0, 0, 0, 0) <= today)
        let Ttaskhisory = TTaskData.filter(t=> today < new Date(t.deadline).setHours(0, 0, 0, 0))
        let history_done = Ttaskhisory.filter(t=>t.done == 1).length
        let total_done = TtasktodayData.filter(t=>t.done == 1).length
        $('#task_chart').html(`<td class="col-4">${total_done}/${TtasktodayData.length}건</td><td class="col-4">${answer_rate(total_done,TtasktodayData.length).toFixed(0)}%</td><td class="col-4">${answer_rate(history_done,Ttaskhisory.length).toFixed(0)}%</td>`);

        // 상담
        let TconsultaskData = TconsultingData.filter(c=>c.category_id > 100)
        let ttd = TconsultaskData.filter(c=>c.done == 1).length
        $('#consulting_chart').html(`<td class="col-4">${ttd} / ${TconsultaskData.length}건</td><td class="col-4">${answer_rate(ttd,TconsultaskData.length).toFixed(0)}%</td><td class="col-4" style="color:red">${make_nodata(TconsultaskData.filter(c=>c.done == 0 && new Date(c.deadline).setHours(0, 0, 0, 0) < today).length)}</td>`)
    }

}
// 반 상세 정보 보내주는 함수 
async function getBanChart(ban_id) {
    $('#student_data').show()
    $('.mo_inloading').show()
    $('.monot_inloading').hide()
    if(!studentsData){
        await get_all_students().then(() => {
            $('.mo_inloading').hide()
            $('.monot_inloading').show()
        });
    }
    $('.mo_inloading').hide()
    $('.monot_inloading').show()
    let banStudentData = studentsData.filter(s=>s.ban_id == ban_id)
    $('#students_tabletitle').html(`${banStudentData[0].ban_name}반 원생 정보`)
    console.log(info)
    console.log(banStudentData)
    // let ban_unlearned = TunlearnedData.filter(u=>u.ban_id == ban_id).length
    // let temp_ban_data = `
    // <tbody  style="width:100%;">
    //     <tr class="row">
    //         <th class="col-3">현 원생 수</th>
    //         <th class="col-3">이반</th>
    //         <th class="col-3">퇴소</th>
    //         <th class="col-3">미학습</th>
    //     </tr>
    //     <tr class="row">
    //         <td class="col-3">${info.students_num}</td>
    //         <td class="col-3">${info.switch_minus_numtudent}</td>
    //         <td class="col-3">${info.outstudent_num}(${answer_rate(info.outstudent_num, outstudent_num).toFixed(2)}%)</td>
    //         <td class="col-3">${ban_unlearned}(${answer_rate(ban_unlearned, unlearned_ttc).toFixed(2)}%) </td>
    //     </tr>
    // </tbody>
    // `;
    // $('#ban_data').html(temp_ban_data);
    
    data_list = banStudentData
    totalData = banStudentData.length
    displayData(totalData, 1, dataPerPage, data_list, ban_id);
    paging(totalData, dataPerPage, pageCount, 1, data_list, ban_id);
    $('#student_data').show()
    $('#pagingul').show();
     
    // key값 `${item.ban_id}_${item.student_num}_${item.semester}_${item.teacher_id}`;
    // banData = allData.filter(e => e.ban_id == ban_id)[0]
    // $('#target_ban_info_requestModalLabel').html(result['students'][0].name + '반 상세 현황')
    // if (result.length <= 0) {
    //     let no_data_title = `<h1> ${response.text} </h1>`
    //     $('#s_data').html(no_data_title);
    //     $('#pagingul').hide();
    //     return
    // } else {
    //     // 이반 학생 
    //     let switch_student = result['students'].filter(s => s.switch_ban_id != null).length;
    //     // 퇴소 학생 
    //     let out_student = result['students'].filter(s => s.out_created != null).length;
    //     let students_num = result['students'][0]['student_num'];
    //     let teacher_name = result['students'][0]['teacher_name']
    //     let teacher_e_name = result['students'][0]['teacher_engname']
    //     let teacher_mobileno = result['students'][0]['teacher_mobileno']
    //     let teacher_email = result['students'][0]['teacher_email']

    //     // 상담
    //     let all_uc_consulting = consultingData.filter(a => a.category_id < 100).length;
    //     let my_consulting = consultingData.filter(a => a.ban_id == ban_id && a.startdate <= today)
    //     let u_consulting_my = my_consulting.filter(a => a.category_id < 100);

    //     let consulting_ixl = u_consulting_my.filter(a => a.category_id == 1).length
    //     let consulting_reading = u_consulting_my.filter(a => a.category_id == 4).length
    //     let consulting_speacial = u_consulting_my.filter(a => a.category_id == 3).length
    //     let consulting_writing = u_consulting_my.filter(a => a.category_id == 6).length
    //     let consulting_homepage = u_consulting_my.filter(a => a.category_id == 2).length
    //     let consulting_intoreading = u_consulting_my.filter(a => a.category_id == 5 || a.category_id == 7).length

    //     // let switchstudent_num = response['switchstudent_num']
    //     // let switchstudent_num_p = response['switchstudent_num_p']
    //     // let outstudent_num = response['outstudent_num']
    //     // let outstudent_num_p = response['outstudent_num_p']
    //     // let unlearned_ttd = response['unlearned_ttd']
    //     // let unlearned_ttc = response['unlearned_ttc']

    //     let temp_profile_data = `
    //     <tbody  style="width:100%;">
    //         <tr class="row" style="background: #DCE6F2;">
    //             <th class="col-12">담임 선생님 정보</th>
    //         </tr>
    //         <tr class="row" style="background:#DCE6F2;">
    //             <td class="col-4">${teacher_name}(${teacher_e_name})</th>
    //             <td class="col-4"> 📞 ${teacher_mobileno} </th>
    //             <td class="col-4"> ✉️ ${teacher_email}</th>
    //         </tr>
    //     </tbody>
    //     `;
    //     $('#profile_data').html(temp_profile_data);

    //     let temp_ban_data = `
    //     <tbody  style="width:100%;">
    //         <tr class="row">
    //             <th class="col-3">현 원생 수</th>
    //             <th class="col-3">이반</th>
    //             <th class="col-3">퇴소</th>
    //             <th class="col-3">미학습</th>
    //         </tr>
    //         <tr class="row">
    //             <td class="col-3">${students_num}</td>
    //             <td class="col-3">${switch_student}</td>
    //             <td class="col-3">${out_student}(${answer_rate(out_student, outstudent_num).toFixed(2)}%)</td>
    //             <td class="col-3">${u_consulting_my.length}(${answer_rate(u_consulting_my.length, all_uc_consulting).toFixed(2)}%) </td>
    //         </tr>
    //     </tbody>
    //     `;

    //     $('#ban_data').html(temp_ban_data);

    //     result['students'].forEach((elem) => {
    //         elem.unlearned = u_consulting_my.filter(a => a.student_id == elem.student_id).length
    //         elem.up = answer_rate(elem.unlearned, u_consulting_my.length).toFixed(0)
    //     });
    //     result['students'].sort((a, b) => b.up - a.up)
    //     data_list = result['students']
    //     totalData = data_list.length

    //     displayData(totalData, 1, dataPerPage, data_list, ban_id);
    //     paging(totalData, dataPerPage, pageCount, 1, data_list, ban_id);
    //     $('#student_data').show()
    //     $('#pagingul').show();
    //     my_task_data = taskData.filter(t => t.ban_id == ban_id && t.startdate <= today)
    //     done_task = my_task_data.filter(a => a.done == 1).length
    //     done_consulting = my_consulting.filter(a => a.done == 1).length
    //     let temp_ban_statistics = `
    //     <table class="table text-center" id="unlearned" style="margin-left:1%; margin-right: 4%;width: 50%;">
    //             <tbody  style="width:100%;">
    //                 <tr class="row" style="background: #DCE6F2;">
    //                     <th class="col-12">미학습 관리</th>
    //                 </tr>
    //                 <tr class="row">
    //                     <th class="col-2">IXL</th>
    //                     <th class="col-2">리딩</th>
    //                     <th class="col-2">리특</th>
    //                     <th class="col-2">라이팅</th>
    //                     <th class="col-2">미접속</th>
    //                     <th class="col-2">인투리딩</th>
    //                 </tr>
    //                 <tr class="row">
    //                     <td class="col-2">${consulting_ixl}(${answer_rate(consulting_ixl, u_consulting_my.length).toFixed(2)}%)</td>
    //                     <td class="col-2">${consulting_reading}(${answer_rate(consulting_reading, u_consulting_my.length).toFixed(1)}%)</td>
    //                     <td class="col-2">${consulting_speacial}(${answer_rate(consulting_speacial, u_consulting_my.length).toFixed(1)}%) </td>
    //                     <td class="col-2">${consulting_writing}(${answer_rate(consulting_writing, u_consulting_my.length).toFixed(1)}%) </td>
    //                     <td class="col-2">${consulting_homepage}(${answer_rate(consulting_homepage, u_consulting_my.length).toFixed(1)}%) </td>
    //                     <td class="col-2">${consulting_intoreading}(${answer_rate(consulting_intoreading, u_consulting_my.length).toFixed(1)}%) </td>
    //                 </tr>
    //             </tbody>
    //         </table>
    //         <table class="table text-center" id="teaching" style="margin-right: 4%; width: 50%;">
    //             <tbody  style="width:100%;">
    //                 <tr class="row" style="background: #DCE6F2;">
    //                     <th class="col-12">상담*업무 관리</th>
    //                 </tr>
    //                 <tr class="row">
    //                     <th class="col-6">업무</th>
    //                     <th class="col-6">상담</th>
    //                 </tr>
    //                 <tr class="row">
    //                     <td class="col-3">${done_task}/${my_task_data.length}</td>
    //                     <td class="col-3">${answer_rate(done_task, my_task_data.length).toFixed(0)}%</td>
    //                     <td class="col-3">${done_consulting}/${my_consulting.length}</td>
    //                     <td class="col-3">${answer_rate(done_consulting, my_consulting.length).toFixed(0)}%</td>
    //                 </tr>
    //             </tbody>
    //         </table>  
    //     `;
    //     $('#ban_statistics').html(temp_ban_statistics);
    // }
}

function displayData(totalData, currentPage, dataPerPage,data_list,b_id) {
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
        let register_no = target['student_id']
        let name = target['student_name'];
        let mobileno = target['mobileno'];
        let parent_name_mobileno = target['pname'] +'('+target['pmobileno']+')';
        let unlearned = target['unlearned'];
        let up = target['up'];
        chartHtml +=`
        <td class="col-2">${name}</td>
        <td class="col-2">${mobileno} </td>
        <td class="col-3">${parent_name_mobileno}</td>
        <td class="col-2">${make_recobook(target['reco_book_code'])} </td>
        <td class="col-2">${unlearned}(${up}%)</td><br>
        <td class="col-1"> <button class="modal-tbody-btn" data-bs-toggle="modal" data-bs-target="#consultinghistory" onclick="get_consulting_history(${register_no})">📝</button><br>
        `;
    } 
    $("#s_data").html(chartHtml);
}

function paging(totalData, dataPerPage, pageCount, currentPage, data_list, b_id) {
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

        //페이징 표시 재호출
        paging(totalData, dataPerPage, pageCount, selectedPage, data_list,b_id);
        //글 목록 표시 재호출
        displayData(totalData, selectedPage, dataPerPage,data_list,b_id);
    });
}


function post_comment(q_id,is_coco){
    let comment_contents = ''
    if(is_coco == 0 ){
        comment_contents = $('#comment_contents').val()
    }else{
        comment_contents = $(`#comment_contents${is_coco}`).val()
    }
    if((comment_contents.length == 0)){
        alert('댓글 내용을 입력해주세요')
    }
    $.ajax({
            type: "POST",
			url:'/common/comment/'+q_id+'/'+is_coco,
			// data: JSON.stringify(jsonData), // String -> json 형태로 변환
            data: {
                comment_contents:comment_contents,
            },
            success: function (response) {{
				alert(response["result"])
                get_question_detail(q_id)    
			}}
		})
}

// 문의 삭제 함수 
async function delete_question(q_id){
    var con_val = confirm('정말 삭제하시겠습니까?')
    if(con_val == true){
    await $.ajax({
        type: 'POST',
        url: '/common/delete_question/' + q_id ,
        data: {},
        success: function(data){
            alert(data)
            history.go(0)
        },
        error: function(xhr, status, error){
            alert(xhr.responseText);
        }
    })
    get_consulting()
    }
}

