var totalData = 0; //총 데이터 수
var dataPerPage = 6;
var pageCount = 10; //페이징에 나타낼 페이지 수
var globalCurrentPage = 1; //현재 페이지
var data_list;
var consultingData = [];
var taskData = [];
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
        return '❌(반려)';
    }else{
        return '⭕(승인)';
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
    if (category == 0) {
        category = '일반문의'
    } else if (category == 1) {
        category = '퇴소문의'
    } else{
        category = '이반문의'
    }
    return category
}
// 메인화면 데이터 
function get_data() {
    $.ajax({
        type: "GET",
        url: "/teacher/get_data",
        dataType: 'json',
        data: {},
        success: function (response) {
            if(response['ban_data']=='없음'){
                // 예외 처리 
            }
            // 반 차트 데이터 
            // 본원 문의 ban선택 옵션 같이 붙이기 
            // let switchstudent_t =  response['switchstudent'].length ( 선생님 기준 이반 율에 사용 )
            // let outstudent_t = response['outstudent'].length ( 선생님 기준 퇴소 율에 사용 )
            $('#ban_chart_list').empty()
            $('#history_ban').empty()
            let unlearned_t =response['all_consulting'].length > 0 ? response['all_consulting'].filter(consulting => consulting.category_id < 100).length : 0;
            let temp_ban_option = '<option value="none" selected>반을 선택해주세요</option>';
            for (i=0;i< response['ban_data'].length;i++) {
                let register_no =  response['ban_data'][i]['register_no']
                let name =  response['ban_data'][i]['name']
                let semester = make_semester(response['ban_data'][i]['semester'])
                let total_student_num =  response['ban_data'][i]['total_student_num']
                let unlearned_arr = response['all_consulting'].length > 0 ? response['all_consulting'].filter(consulting => consulting.category_id < 100 && consulting.ban_id === register_no): 0;
                let unlearned = 0
                let unlearned_ixl = 0
                let unlearned_reading = 0
                let unlearned_speacial = 0
                let unlearned_writing = 0
                let unlearned_homepage = 0
                let unlearned_intoreading = 0
                if(unlearned_arr != 0){
                    unlearned = unlearned_arr.length;
                    unlearned_ixl = unlearned_arr.filter(a => a.category_id == 1).length
                    unlearned_reading = unlearned_arr.filter(a => a.category_id == 4).length
                    unlearned_speacial = unlearned_arr.filter(a => a.category_id == 3).length
                    unlearned_writing = unlearned_arr.filter(a => a.category_id == 6).length
                    unlearned_homepage = unlearned_arr.filter(a => a.category_id == 2).length
                    unlearned_intoreading = unlearned_arr.filter(a => a.category_id == 5 || a.category_id == 7).length
                }
                let switchstudent =response['switchstudent'].length > 0 ? response['switchstudent'].filter(a=> a.ban_id === register_no).length : 0;
                let outstudent = response['outstudent'].length > 0 ? response['outstudent'].filter(a=> a.ban_id === register_no).length : 0;
                temp_ban_option += `
                <option value=${register_no}>${name} (${semester}월 학기)</option>
                `;
                let temp_ban_chart = `
                <div class="d-flex justify-content-start align-items-start flex-column w-100 my-2">
                    <h5 class="mb-3">📌  ${name} (${semester}월 학기)</h5>
                    <div class="row w-100">
                        <div class="chart-wrapper col-sm-5">
                            <canvas id="total-chart-element${i}" class="total-chart-element p-sm-3 p-2"></canvas>
                            <div class ="chart-data-summary">
                                <span>관리중:${ total_student_num }</span><br>
                                <span>* 이반:${ switchstudent }</span><br>
                                <span>* 퇴소:${ outstudent }</span>
                            </div>
                        </div>
                        <div class="col-sm-7 d-flex justify-content-center align-items-center">
                            <table class="table text-center" id="class_list">
                                <tbody style="width:100%;">
                                    <tr class="row">
                                        <th class="col-12" data-bs-toggle="modal" data-bs-target="#ban_student_list" onclick="get_student(${register_no})">${name}반  원생 목록  ✔️</th>
                                    </tr>
                                    <tr class="row">
                                        <th class="col-12">총 미학습 ${unlearned}건  (${answer_rate(unlearned, unlearned_t).toFixed(2)}%)</th>
                                    </tr>
                                    <tr class="row">
                                    <th class="col-2">IXL</th>
                                    <th class="col-2">리딩</th>
                                    <th class="col-2">리특</th>
                                    <th class="col-2">인투리딩</th>
                                    <th class="col-2">라이팅</th>
                                    <th class="col-2">미접속</th>
                                    </tr>
                                    <tr class="row">
                                    <td class="col-2">${unlearned_ixl}건(${answer_rate(unlearned_ixl, unlearned).toFixed(0)}%)</td>
                                    <td class="col-2">${unlearned_reading}건(${answer_rate(unlearned_reading, unlearned).toFixed(0)}%)</td>
                                    <td class="col-2">${unlearned_speacial}건(${answer_rate(unlearned_speacial, unlearned).toFixed(0)}%)</td>
                                    <td class="col-2">${unlearned_intoreading}건(${answer_rate(unlearned_intoreading, unlearned).toFixed(0)}%)</td>
                                    <td class="col-2">${unlearned_writing}건(${answer_rate(unlearned_writing, unlearned).toFixed(0)}%)</td>
                                    <td class="col-2">${unlearned_homepage}건(${answer_rate(unlearned_homepage, unlearned).toFixed(0)}%)</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                `;
                $('#ban_chart_list').append(temp_ban_chart);

                new Chart($((`#total-chart-element${i}`)), {
                    type: 'doughnut',
                    data: {
                        labels: ['관리중', '이반', '퇴소'],
                        datasets: [
                            {
                                data: [total_student_num, switchstudent, outstudent],
                                backgroundColor: ['#B39CD0', '#ffd400', '#F23966'],
                                hoverOffset: 4,
                            },
                        ],
                    },
                    options: {
                        plugins: {
                            legend: {
                                display: false,
                            },
                        },
                    },
                });
            }
            // 본원 문의 ban선택 옵션 같이 붙이기 
            $('#my_ban_list').html(temp_ban_option)
            // 상담일지 조회 ban 선택 옵션 같이 붙이기 
            $('#history_ban').append(temp_ban_option)
            
            // let consulting_deadlinemissed = consulting_notdone.length > 0 ? consulting_notdone.filter(c => new Date(c.deadline).setHours(0, 0, 0, 0) < today).length : 0;
            let consulting_t = response['all_consulting'].length;
            let consulting_done = consulting_t != 0 ? response['all_consulting'].filter(consulting => consulting.done === 1).length : 0  
            // let consulting_notdone = consulting_t - consulting_done
            let task_done = response['all_task'].length > 0 ? response['all_task'].filter(task => task.done != 0  && new Date(task.created_at).setHours(0, 0, 0, 0) == today).length : 0;
            let total_task = response['all_task'].length
            let task_notdone = total_task-task_done;
            let temp_report = `
            <td class="col-3"> ${task_done}/${total_task} </td>
            <td class="col-3"> ( ${answer_rate(task_done,total_task).toFixed(0)}% ) </td>
            <td class="col-3"> ${consulting_done}/${consulting_t} </td>
            <td class="col-3"> ( ${answer_rate(consulting_done, consulting_t).toFixed(0)}% ) </td>
            `;
            $('#classreport').html(temp_report)

            // 오늘의 업무 뿌려주기 
            if(task_notdone == 0){
                $('#task_title').html('오늘의 업무 끝 😆');
                $('#task_button').hide();
            }else{
                $('#task_title').html('오늘의 업무 '+task_notdone+'건');
                $('#task_button').show();
            }
                // 오늘의 업무 중복 카테고리로 묶기 
            const categoryGrouped = response['all_task'].reduce((result, item) => {
                const category = item.category;
                if (!result[category]) {
                    result[category] = [];
                }
                result[category].push(item);
                return result;
            }, {});

                // 결과를 객체의 배열로 변환
            const categoryGroupedresult = Object.entries(categoryGrouped).map(([category, items]) => {
                return { [category]: items };
            });

            let temp_cate_menu = ''
            for(i=0; i < categoryGroupedresult.length; i++){
                const category = Object.keys(categoryGroupedresult[i])[0];
                // const items = categoryGroupedresult[i][category].filter( e => e.done === 0 );
                const items = categoryGroupedresult[i][category];
                
                items.sort((a, b) => b.priority - a.priority);
                const contentsGrouped = items.reduce((result, item) => {
                    const contents = item.contents;
                    const priority = item.priority;
                    const deadline = item.deadline;
                    const doc = {
                        'id':item.id,
                        'ban_id':item.ban_id,
                        'done':item.done,
                        'created_at':new Date(item.created_at).setHours(0, 0, 0, 0)
                    }
                    const key =  priority + '_' + contents + '_' + deadline;
                    if (!result[key]) {
                        result[key] = [];
                    }
                    result[key].push(doc);
                    return result;
                }, {});

                // 결과를 객체의 배열로 변환
                const contentsGroupedresult = Object.entries(contentsGrouped).map(([key, items]) => {
                    return { [key]: items };
                });
                temp_cate_menu += `
                <thead  style="background-color:#ffc107;">
                    <tr class="row">
                    <th class="col-2">< 업무순서</th>
                    <th class="col-8">${category}업무</th>
                    <th class="col-2">마감일 ></th>
                    </tr>
                </thead>
                <tbody style="width:100%;">  
                `;

                if (contentsGroupedresult && contentsGroupedresult.length > 0) {
                    for(j=0; j < contentsGroupedresult.length; j++){
                        const contents = Object.keys(contentsGroupedresult[j])[0];
                        task_items = contentsGroupedresult[j][contents];
                        const v = contents.split('_')
                        temp_cate_menu += `
                            <tr class="row">
                                <td class="col-2">${make_priority(v[0])}</td>
                                <td class="col-8">${v[1]}</td>
                                <td class="col-2">${make_date(v[2])}</td>
                            </tr>
                            <td class="col-12">`;
                            for(k=0; k < task_items.length; k++){
                                const ban_name = response['ban_data'].filter(a => a.register_no === task_items[k].ban_id)[0]['name']
                                if(task_items[k].done == 0){
                                    temp_cate_menu += `
                                    <label><input type="checkbox" name="taskid" value="${task_items[k].id}"/>${ban_name}</label>`;
                                }else if(task_items[k].done == 1 && task_items[k].created_at == today){
                                    temp_cate_menu += `
                                    <label class="done">✅ ${ban_name}</label>`;
                                }
                            }
                            temp_cate_menu += `</td></tbody>`;
                    }
                } else {
                    temp_cate_menu += `
                        <tr class="row">
                            <td class="col-12">해당 카테고리의 업무가 없습니다.</td>
                        </tr>
                    `;
                }

                temp_cate_menu += `</tbody>`;
            }
            $('#cate_menu').html(temp_cate_menu);
            
            // 상담 목록 
            let result = response['my_students'].reduce((acc, student) => {
                const consultingList = response['all_consulting'].filter(c => c.student_id === student.register_no);
                if (consultingList.length > 0) {
                    const todoconsulting = consultingList.filter(c => c.done === 0)
                    if(todoconsulting.length > 0 ){
                        const deadline = todoconsulting.reduce((prev, current) => {
                            let prevDueDate = make_date(prev.deadline);
                            let currentDueDate = make_date(current.deadline);
                            return currentDueDate < prevDueDate ? current : prev;
                        }, todoconsulting[0]);
                        const missed = todoconsulting.reduce((prev, current) => {
                            let prevDueDate = make_date(prev.missed);
                            let currentDueDate = make_date(current.missed);
                            return currentDueDate < prevDueDate ? prev : current;
                        }, todoconsulting[0]);
    
                        acc.push({
                            'teacher_id':student.id,
                            'student_id': student.register_no,
                            'student_name': student.name +'('+student.nick_name+')',
                            'student_mobileno': student.mobileno,
                            'student_reco_book_code': make_recobook(student.reco_book_code),
                            'ban_id': student.ban_id,
                            'ban_name': student.classname,
                            'consulting_num': todoconsulting.length,
                            'done_consulting_num': consultingList.length - todoconsulting.length,
                            'deadline': make_date(deadline.deadline),
                            'missed' : missed_date(missed.missed),
                            'consulting_list': consultingList
                        });
                    }else{
                        acc.push({
                            'teacher_id':student.id,
                            'student_id': student.register_no,
                            'student_name': student.name +'('+student.nick_name+')',
                            'student_mobileno': student.mobileno,
                            'student_reco_book_code': make_recobook(student.reco_book_code),
                            'ban_id': student.ban_id,
                            'ban_name': student.classname,
                            'consulting_num': 0,
                            'done_consulting_num': consultingList.length,
                            'deadline': make_date('3000-01-01'),
                            'missed' : missed_date('1111-01-01'),
                            'consulting_list': consultingList
                        });
                    }
                }else{
                    acc.push({
                        'teacher_id':student.id,
                        'student_id': student.register_no,
                        'student_name': student.name +'('+student.nick_name+')',
                        'student_mobileno': student.mobileno,
                        'student_reco_book_code': make_recobook(student.reco_book_code),
                        'ban_id': student.ban_id,
                        'ban_name': student.classname,
                        'consulting_num': 0,
                        'done_consulting_num': 0,
                        'deadline': make_date('3000-01-01'),
                        'missed' : missed_date('1111-01-01'),
                        'consulting_list': []
                    });
                }
                return acc;
            }, []);
            if (result.length > 0) {
                result = result.sort((a, b) => {
                    return b.consulting_num - a.consulting_num;
                });
                result = result.sort((a, b) => {
                    return a.deadline - b.deadline
                });
                consultingStudentData = result
                get_consulting_student(0)
            } else {
                $('#today_consulting_title').html($('#today_consulting_title').html()+'   0건');
                $('#consulting_student_list').hide();
                $('#consultingstudent_pagination').hide();
            }
        },
        error:function(xhr, status, error){
                alert('xhr.responseText');
        }
    });
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

