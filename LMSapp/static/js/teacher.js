// xss 공격 체크 함수 
// function XSSCheck(str, level) {
//     if (level == undefined || level == 0) {
//         str = str.replace(/\<|\>|\"|\'|\%|\;|\(|\)|\&|\+|\-/g, "");
//     } else if (level != undefined && level == 1) {
//         str = str.replace(/\</g, "&lt;");
//         str = str.replace(/\>/g, "&gt;");
//     }
//     return str;
// }

$(document).ready(function () {
    get_data()
})

function go_back() {
    // 문의 관련 
    $('#questiondetail').hide();
    $('#questionlist').show();
    // 원생 리스트 관련 
    $('#teachers_student_list').show();
    $('#make_plus_consulting').hide();
    $('#banstudentlistModalLabel').html('원생목록')
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
                            'student_origin':student.origin,
                            'student_name': student.name +'('+student.nick_name+')',
                            'student_mobileno': student.mobileno,
                            'student_birthday': student.birthday,
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
                            'student_origin':student.origin,
                            'student_name': student.name +'('+student.nick_name+')',
                            'student_mobileno': student.mobileno,
                            'student_birthday': student.birthday,
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
                        'student_origin':student.origin,
                        'student_name': student.name +'('+student.nick_name+')',
                        'student_mobileno': student.mobileno,
                        'student_birthday': student.birthday,
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
// 메인화면 오늘의 상담
async function get_consulting_student(done_code) {
    $('#consultingstudent_search_input').off('keyup');
    var container = $('#consultingstudent_pagination')
    let data = consultingStudentData.filter((e) => {
        if(done_code == 0) {
            $('#today_consulting_title').html('오늘의 상담');
            return e.missed != "오늘" && e.consulting_num != 0;
        }else{
            $('#today_consulting_title').html('오늘의 부재중 상담');
            return e.missed == "오늘" && e.consulting_num != 0;
        }
    })
    
    var paginationOptions = {
        prevText: '이전',
        nextText: '다음',
        pageSize: 5,
        pageClassName: 'float-end',
        callback: function (data, pagination){
            $('#consulting_student_list').show();
            $('#consultingstudent_pagination').show();
            var temp_consulting_contents_box = '';
            $.each(data, function (index, consulting) {
                // let value = `${consulting.ban_name}_${consulting.student_name}_${consulting.student_mobileno}_${consulting.student_id}`
                temp_consulting_contents_box += `
                <td class="col-2">${consulting.ban_name}</td>
                <td class="col-2">${consulting.student_name}</br>${consulting.student_origin}</td>
                <td class="col-2">${consulting.student_birthday}</td>
                <td class="col-2">${consulting.student_mobileno}</td>
                <td class="col-2">${consulting.deadline}</td>
                <td class="col-1">${consulting.consulting_num}</td>
                <td class="col-1" data-bs-toggle="modal" data-bs-target="#consultinghistory" onclick="get_consulting('${consulting.student_id}',${0})"><span class="cursor-pointer">📝</span></td> 
                `;
            });
            $('#today_consulting_box').html(temp_consulting_contents_box);
            $('#consulting_student_list').show();
        }
    };

    if(data.length == 0){
        $('#today_consulting_title').html($('#today_consulting_title').html()+'   0건');
        $('#consulting_student_list').hide();
        $('#consultingstudent_pagination').hide();
    }else{
        container.pagination(Object.assign(paginationOptions, { 'dataSource': data }))
    }

    $('#consultingstudent_search_input').on('keyup', function () {
        var searchInput = $(this).val().toLowerCase();
        var filteredData = data.filter(function (d) {
            return (d.hasOwnProperty('ban_name') && d.ban_name.toLowerCase().indexOf(searchInput) !== -1 )|| (d.hasOwnProperty('student_name') && d.student_name.toLowerCase().indexOf(searchInput) !== -1) || (d.hasOwnProperty('student_origin') && d.student_origin.toLowerCase().indexOf(searchInput) !== -1);
        });
        container.pagination('destroy');
        container.pagination(Object.assign(paginationOptions, { 'dataSource': filteredData }));
    });
    
}

// 상담일지 작성 
async function get_consulting(student_id, is_done) {
    if(!reportsData){
        await get_student_reports().then(()=>{
            console.log(reportsData)
        })
    }
    student_report = reportsData.filter(r=>r.student_id == student_id)
    if(student_report.length != 0 ){
        student_report_name = student_report[0].file_name
        $('#pdf-open-btn').addEventListener('click', function(){
            // PDF 파일 URL
            var pdfUrl = 'https://www.purpleacademy.co.kr/student/documents_download?file='+student_report[0].enc_name;
            
            // PDF.js로 PDF 파일 로드
            pdfjsLib.getDocument(pdfUrl).promise.then(function(pdfDoc_) {
                var pdfDoc = pdfDoc_;
                var currentPage = 1;
                var pageCount = pdfDoc.numPages;
            
                // 첫 페이지 로드
                pdfDoc.getPage(currentPage).then(function(page) {
                var canvas = document.createElement('canvas');
                var canvasContext = canvas.getContext('2d');
            
                var viewport = page.getViewport({ scale: 1.0 });
                canvas.width = viewport.width;
                canvas.height = viewport.height;
            
                var renderContext = {
                    canvasContext: canvasContext,
                    viewport: viewport
                };
            
                page.render(renderContext).promise.then(function() {
                    document.getElementById('pdf-container').appendChild(canvas);
                });
                });
            });
        });
    }
    

    const data = consultingStudentData.filter((e) => {
        return e.student_id == student_id && e.consulting_list.length != 0;
    })[0]
    $('#consultinghistoryModalLabelt').html(`${data['ban_name']}반 ${data['student_name']} 원생 ${data['done_consulting_num']}건 상담  ( 📞 ${data['student_mobileno']}  )`)
    let cant_consulting_list = data['consulting_list'].length  > 0 ? data['consulting_list'].filter( c=>c.done == 0 && c.created_at != null) : 0;
    let consulting_list = data['consulting_list'].length  > 0 ? data['consulting_list'].filter( c=> c.done == is_done) : 0;
    if(is_done == 0){
        $('#consultinghistoryModalLabelt').html(`${data['ban_name']}반 ${data['student_name']} 원생 ${data['consulting_num']}건 상담   ( 📞 ${data['student_mobileno']}  )`)
        consulting_list = consulting_list.length  > 0 ? consulting_list.filter(c=>c.created_at == null) : 0
    }
    let consultinglist_len = consulting_list != 0 ? consulting_list.length : 0;
    
    if (cant_consulting_list.length > 0){
        $('#consulting_cant_write_box').empty();
        for (i = 0; i < cant_consulting_list.length; i++) {
            let target = cant_consulting_list[i]
            let category = target['week_code']+'주간  '+ target['category']
            let contents = target['contents']
            let consulting_missed = missed_date(target['missed'])
            let deadline = make_date(target['deadline'])
            let history_created = target['created_at']
            let temp_consulting_contents_box = `
            <p class="mt-lg-4 mt-5">✅<strong>${category}</strong></br><strong>➖상담 마감일:
                ~${deadline}까지 </strong>| 부재중 : ${consulting_missed}</br>
                <strong style="color:red;">➖ 이미 원생이 ${make_date(history_created)}일 날 학습을 완료했습니다. (  ✏️ 추천: 원생목록에서 추가 상담 진행)</strong></br>
                ${contents}</br> 
            </p>
            `;
            $('#consulting_cant_write_box').append(temp_consulting_contents_box);
        }
        temp_post_box = `
        <p class="mt-lg-4 mt-5">✔️ 상담 결과 이반 / 취소*환불 / 퇴소 요청이 있었을시 본원 문의 버튼을 통해 승인 요청을 남겨주세요</p>
            <div class="modal-body-select-container">
            <span class="modal-body-select-label">부재중</span>
            <label><input type="checkbox" id="missed">부재중</label>
            </div>
            <div class="d-flex justify-content-center mt-4 mb-2" id="consulting_button_box">
                <button class="btn btn-dark"
                    onclick="post_bulk_consultings(${consultinglist_len},${is_done})"
                    style="margin-right:5px">저장</button>
            </div>
        `;
        $('#consulting_write_box').append(temp_post_box);
    }
    if (consultinglist_len == 0) {
        $('#consultinghistoryModalLabelt').html('진행 할 수 있는 상담이 없습니다.* 원생 목록에서 추가 상담을 진행해주세요 *')
    }else{
        consulting_list.sort((a, b) => {return make_date(a.deadline) - make_date(b.deadline)});
        $('#consulting_write_box').empty();
        for (i = 0; i < consultinglist_len; i++){
            let target = consulting_list[i]
            let category = target['category']
            let consulting_id = target['id']
            let contents = target['contents']
            let consulting_missed = missed_date(target['missed'])
            let deadline = make_date(target['deadline'])
            let history_created = target['created_at']
            if(target['category_id'] < 100){
                category = target['week_code']+'주간  ' + category
            }
            let history_reason = target['reason'] == null ? '입력해주세요' : target['reason']
            let history_solution = target['solution'] == null ? '입력해주세요' : target['solution']
            let history_result = target['result'] == null ? '입력해주세요' : target['result']
            let temp_consulting_contents_box = `
            <input type="hidden" id="target_consulting_id${i}" value="${consulting_id}" style="display: block;" />
            <p mt-lg-4 mt-5>✅<strong>${category}</strong></br><strong>➖상담 마감일:
                ~${deadline}까지 </strong>| 부재중 : ${consulting_missed}</br></br>${contents}</br></p>
            <div class="modal-body-select-container">
                <span class="modal-body-select-label">상담 사유</span>
                <input class="modal-body-select" type="text" size="50"
                    id="consulting_reason${consulting_id}" placeholder="${history_reason}">
            </div>
            <div class="modal-body-select-container">
                <span class="modal-body-select-label">제공한 가이드</span>
                <input class="modal-body-select" type="text" size="50"
                    id="consulting_solution${consulting_id}" placeholder="${history_solution}">
            </div>
            <div class="modal-body-select-container">
                <span class="modal-body-select-label">상담 결과</span>
                <textarea class="modal-body-select" type="text" rows="5" cols="25"
                    id="consulting_result${consulting_id}" placeholder="${history_result}"></textarea>
            </div>
            <p>상담 일시 : ${make_date(history_created)}</p>
            `;
            $('#consulting_write_box').append(temp_consulting_contents_box);
        }
        let temp_post_box = `<p class="mt-lg-4 mt-5">✔️ 상담 결과 이반 / 취소*환불 / 퇴소 요청이 있었을시 본원 문의 버튼을 통해 승인 요청을 남겨주세요</p>`;
        if(is_done == 0){
            temp_post_box = `
            <div class="modal-body-select-container">
            <span class="modal-body-select-label">부재중</span>
            <label><input type="checkbox" id="missed">부재중</label>
            </div>
            <div class="d-flex justify-content-center mt-4 mb-2" id="consulting_button_box">
                <button class="btn btn-dark"
                    onclick="post_bulk_consultings(${consultinglist_len},${is_done})"
                    style="margin-right:5px">저장</button>
            </div>`
        }else if(is_done == 1){
            temp_post_box = `
            <div class="d-flex justify-content-center mt-4 mb-2" id="consulting_button_box">
                <button class="btn btn-dark"
                    onclick="post_bulk_consultings(${consultinglist_len},${is_done})"
                    style="margin-right:5px">수정</button>
            </div>`
        }
        $('#consulting_write_box').append(temp_post_box);
    }
}
function post_bulk_consultings(c_length, is_done) {
    for (i = 0; i < c_length; i++) {
        target = $('#target_consulting_id' + i).val()
        post_target_consulting(target, is_done)
    }
    alert("상담 저장 완료")
    window.location.reload()
}
function post_target_consulting(consulting, is_done) {
    consulting_missed = $(`input:checkbox[id="missed"]`).is(":checked")
    consulting_reason = $('#consulting_reason' + consulting).val()
    consulting_solution = $('#consulting_solution' + consulting).val()
    consulting_result = $('#consulting_result' + consulting).val()
    if ((consulting_reason.length == 0)) {
        consulting_reason = "작성 내역이 없습니다"
    } if ((consulting_solution.length == 0)) {
        consulting_solution = "작성 내역이 없습니다"
    } if ((consulting_result.length == 0)) {
        consulting_result = "작성 내역이 없습니다"
    }
    $.ajax({
        type: "POST",
        url: '/teacher/consulting_history/' + consulting + '/' + is_done,
        // data: JSON.stringify(jsonData), // String -> json 형태로 변환
        data: {
            consulting_reason: consulting_reason,
            consulting_solution: consulting_solution,
            consulting_result: consulting_result,
            consulting_missed: consulting_missed,
        },success: function (response) {
            if (response['result'] == '완료') {
            } else {
                alert("상담일지 저장 실패")
            }
        }
    })
}

// 상담기록 조회 
async function get_consulting_history() {
    let container = $('#consulting_history_student_list_pagination')
    const data = consultingStudentData.filter((e) => {
        return e.done_consulting_num != 0;
    })
    await container.pagination({
        dataSource: data,
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        callback: function (data, pagination) {
            if (data.length <= 0) {
                $('#consulting_history_bansel_box').hide()
                $('#consulting_history_box').hide()
                $('#h_title_msg').show();
            } else {
                // data.sort((a,n))
                $('#h_title_msg').hide();
                $('#consulting_history_bansel_box').show()
                $('#consulting_history_box').show()
                let temp_consulting_history_student_list = '';
                $.each(data, function (index, consulting) {
                    temp_consulting_history_student_list += `
                    <td class="col-2">${consulting.ban_name}</td>
                    <td class="col-2">${consulting.student_name}</td>
                    <td class="col-2">${consulting.student_mobileno}</td>
                    <td class="col-2">${consulting.student_birthday}</td>
                    <td class="col-2">${consulting.done_consulting_num}</td>
                    <td class="col-2" data-bs-toggle="modal" data-bs-target="#consultinghistory" onclick="get_consulting(${consulting.student_id},${1})">상담일지 수정</td> 
                    `;
                });
                $('#consulting_history_student_list').html(temp_consulting_history_student_list);
            }
        }})
}
async function sort_consulting_history(ban_id) {
    if(ban_id =="none"){
        return get_consulting_history()
    }
    let container = $('#consulting_history_student_list_pagination')
    const data = consultingStudentData.filter((e) => {
        return e.done_consulting_num != 0 && e.ban_id == ban_id;
    })
    await container.pagination({
        dataSource: data,
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        callback: function (data, pagination) {
            if (data.length <= 0) {
                $('#consulting_history_box').hide()
                $('#h_title_msg').show();
            } else {
                $('#h_title_msg').hide();
                $('#consulting_history_box').show()
                let temp_consulting_history_student_list = '';
                $.each(data, function (index, consulting) {
                    temp_consulting_history_student_list += `
                    <td class="col-2">${consulting.ban_name}</td>
                    <td class="col-2">${consulting.student_name}</td>
                    <td class="col-2">${consulting.student_mobileno}</td>
                    <td class="col-2">${consulting.student_birthday}</td>
                    <td class="col-2">${consulting.done_consulting_num}</td>
                    <td class="col-2" data-bs-toggle="modal" data-bs-target="#consultinghistory" onclick="get_consulting(${consulting.student_id},${1})">상담일지 수정</td> 
                    `;
                });
                $('#consulting_history_student_list').html(temp_consulting_history_student_list);
            }
        }})
}

// 메인화면 원생 리스트 조회 및 추가 상담 기능 
async function get_student(ban_id) {
    let container = $('#banstudent_pagination')
    $('#teachers_student_list').show();
    $('#make_plus_consulting').hide();
    const data = consultingStudentData.filter((e) => {
            return e.ban_id === ban_id;
    })
    $('#teachers_student_list').show()
    await container.pagination({
        dataSource: data,
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        callback: function (data, pagination) {
            if(data.length == 0){
                $('#banstudentlistModalLabel').html('반 원생이 없습니다.');
                $('#student_data').hide();
            }else{
                $('#banstudentlistModalLabel').html(data[0]['ban_name']+'반 원생 목록');
                var temp_consulting_contents_box = '';
                $.each(data, function (index, consulting) {
                    let unlearned_arr = consulting.consulting_list.length > 0 ? consulting.consulting_list.filter(consulting => consulting.category_id < 100): 0;
                    let unlearned = unlearned_arr != 0 ? unlearned_arr.length : 0;
                    let unlearned_ixl = 0
                    let unlearned_reading = 0
                    let unlearned_speacial = 0
                    let unlearned_writing = 0
                    let unlearned_homepage = 0
                    let unlearned_intoreading = 0
                    if(unlearned != 0){
                        unlearned_ixl = unlearned_arr.filter(a => a.category_id == 1).length
                        unlearned_reading = unlearned_arr.filter(a => a.category_id == 4).length
                        unlearned_speacial = unlearned_arr.filter(a => a.category_id == 3).length
                        unlearned_writing = unlearned_arr.filter(a => a.category_id == 6).length
                        unlearned_homepage = unlearned_arr.filter(a => a.category_id == 2).length
                        unlearned_intoreading = unlearned_arr.filter(a => a.category_id == 5 || a.category_id == 7).length
                    }
                    let value = `${consulting.student_id}_${consulting.student_name}_${consulting.student_mobileno}_${consulting.teacher_id}`
                    if(make_IsG3(consulting.ban_name)){
                        $('#s_datahead').html(`
                        <th class="col-2">이름</th>
                        <th class="col-1">원번</th>
                        <th class="col-1">생년월일</th>
                        <th class="col-2">연락처</th>
                        <th class="col-1">미접속</th>
                        <th class="col-1">IXL 미응시</th>
                        <th class="col-1">리딩</th>
                        <th class="col-1">라이팅 과제 미제출</th>
                        <th class="col-1">인투리딩</th>
                        <th class="col-1">추가</th>
                        `)
                        temp_consulting_contents_box += `
                        <td class="col-2">${consulting.student_name}</td>
                        <td class="col-1">${consulting.student_origin}</td>
                        <td class="col-1">${consulting.student_birthday}</td>
                        <td class="col-2">${consulting.student_mobileno}</td>
                        <td class="col-1">${unlearned_homepage}건</td>
                        <td class="col-1">${unlearned_ixl}건</td>
                        <td class="col-1">${unlearned_reading}건</td>
                        <td class="col-1">${unlearned_writing}건</td>
                        <td class="col-1">${unlearned_intoreading}건</td>
                        <td class="col-1" onclick="plusconsulting('${value}',${consulting.ban_id})"><span class="cursor-pointer">➕</span></td> 
                        `;
                    }else{
                        $('#s_datahead').html(`
                        <th class="col-1">이름</th>
                        <th class="col-1">원번</th>
                        <th class="col-1">생년월일</th>
                        <th class="col-2">연락처</th>
                        <th class="col-1">미접속</th>
                        <th class="col-1">IXL 미응시</th>
                        <th class="col-1">리특</th>
                        <th class="col-1">리딩</th>
                        <th class="col-1">라이팅 과제 미제출</th>
                        <th class="col-1">인투리딩</th>
                        <th class="col-1">추가</th>
                        `)
                        temp_consulting_contents_box += `
                        <td class="col-1">${consulting.student_name}</td>
                        <td class="col-1">${consulting.student_origin}</td>
                        <td class="col-1">${consulting.student_birthday}</td>
                        <td class="col-2">${consulting.student_mobileno}</td>
                        <td class="col-1">${unlearned_homepage}건</td>
                        <td class="col-1">${unlearned_ixl}건</td>
                        <td class="col-1">${unlearned_speacial}건</td>
                        <td class="col-1">${unlearned_reading}건</td>
                        <td class="col-1">${unlearned_writing}건</td>
                        <td class="col-1">${unlearned_intoreading}건</td>
                        <td class="col-1" onclick="plusconsulting('${value}',${consulting.ban_id})"><span class="cursor-pointer">➕</span></td> 
                        `;
                    }
                    
                });
                $('#s_data').html(temp_consulting_contents_box);
                $('#student_data').show();
            }
        }
    })
}
function plusconsulting(value, b_id) {
    let v = value.split('_')
    $('#teachers_student_list').hide();
    $('#make_plus_consulting').show();
    $('#banstudentlistModalLabel').html(`${v[1]} 원생 추가 상담  ( 📞 ${v[2]}  )`)
    let temp_button = `
    <button class="btn btn-dark" onclick=plusconsulting_history(${Number(v[0])},${b_id},${Number(v[3])})>저장</button>
    `;
    $('#plusconsulting_button_box').html(temp_button)
}
function plusconsulting_history(student_id, b_id,t_id) {
    consulting_contents = $('#plus_consulting_contents').val()
    consulting_reason = $('#plus_consulting_reason').val()
    consulting_solution = $('#plus_consulting_solution').val()
    consulting_result = $('#plus_consulting_result').val()
    $.ajax({
        type: "POST",
        url: '/teacher/plus_consulting/' + student_id + '/' + b_id+ '/' + t_id,
        // data: JSON.stringify(jsonData), // String -> json 형태로 변환
        data: {
            consulting_contents: consulting_contents,
            consulting_reason: consulting_reason,
            consulting_solution: consulting_solution,
            consulting_result: consulting_result
        },
        success: function (response) {
            {
                alert(response["result"])
                window.location.reload()
            }
        }
    })
}

// 업무 완료 
function get_update_done() {
    $('input:checkbox[name=taskid]').each(function (index) {
        if ($(this).is(":checked") == true) {
            return update_done($(this).val())
        }
    });
    window.location.replace('/teacher')
}
function update_done(target) {
    $.ajax({
        type: "POST",
        url: '/teacher/task/' + target,
        // data: JSON.stringify(jsonData), // String -> json 형태로 변환
        data: {},
        success: function (response) {
            if (response['result'] == '완료') {
            } else {
                alert(response["result"])
            }
        }
    })
}

// 본원 문의 기능 
function change_question_kind(str) {
    if(str == "none"){
        $('#question_topurple').hide()
    }else if(str == "일반"){
        let question_html = `
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">대상 원생</span>
            <select id="student_list" class="modal-body-select" name="target_student">
            </select>
        </div>
        `;
        $('#question_box').html(question_html);
        $('#question_topurple').show()
    }else{
        let question_html = `
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">대상 원생</span>
            <select id="student_list" class="modal-body-select" name="target_student"
                onchange="attach_consulting_history(this.value)">
            </select>
        </div>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">상담 내용</span>
            <select class="modal-body-select" name="consulting_history" id="h_select_box">
            </select>
        </div>
        `;
        $('#question_box').html(question_html);
        $('#question_topurple').show()
    }
}
function get_ban_student(ban_id){
    const data = consultingStudentData.filter((e) => {
        return e.ban_id == ban_id;
    })
    let temp_target_student = ''
    if(data.length == 0){
        temp_target_student ='<option value="none" selected>반 원생이 없습니다.</option>';
        $('#student_list').html(temp_target_student)
    }else{
        temp_target_student ='<option value="none" selected>대상 원생을 선택해주세요</option>';
        $.each(data, function (index, student) {
            temp_target_student += `
            <option value="${student.student_id}"> ${student.student_name}</option>
            `;
            $('#student_list').html(temp_target_student)
        });
    }
}
    // 상담일지 첨부 
function attach_consulting_history(student_id) {
    const data = consultingStudentData.filter((e) => {
        return e.student_id == student_id && e.done_consulting_num.length != 0;
    })[0]['consulting_list']
    const consultinglist = data.length>0?data.filter( c => c.done == 1 ):0
    let temp_h_select = ''
    if(consultinglist.length <= 0){
        alert('상담을 우선 진행해주세요  원생목록 👉 해당 원생 상담추가');
        temp_h_select = '<option value="none" selected>상담을 우선 진행해주세요  원생목록 👉 해당 원생 상담추가</option>'
    }else{
        temp_h_select = '<option value="none" selected>상담을 선택해주세요</option>'
        $.each(consultinglist, function (index, consulting) {
            let category = ''
            if(consulting.category_id < 100 ){
                category = `${consulting.week_code}주간 ${consulting.category}상담`
            }else{
                category = `${consulting.category} ${consulting.contents}`
            }
            temp_h_select += `
            <option value="${consulting.id}"> ${category} - 상담결과: ${consulting.result}</option>
            `;
        });
    }
    $('#h_select_box').html(temp_h_select)
}
    // 문의 리스트
async function get_teacher_question() {
    try{
        const response = await $.ajax({
            type: "GET",
            url: "/teacher/question",
            dataType: 'json',
            data: {},
        });
        questionAnswerdata = response
    } catch (error) {
        alert('Error occurred while retrieving data.');
    }
}
async function get_question_list() {
    $('#q_title_msg').hide();
    $('#questiondetail').hide();
    $('.Tinloading').show()
    $('.t_notinloading').hide()
    if(!banData){
        await get_teacher_question().then(()=>{
            $('.Tinloading').hide()
            $('.t_notinloading').show()
        })
    }
    let container = $('#question_pagination')
    $('.Tinloading').hide()
    $('.t_notinloading').show()
    if(questionAnswerdata.length > 0){
        $('#questionlist').show()
        $('#question_pagination').show()
        container.pagination({
            dataSource: questionAnswerdata,
            prevText: '이전',
            nextText: '다음',
            pageClassName: 'float-end',
            pageSize: 5,
            callback: function (questionAnswerdata, pagination) {
                var dataHtml = '';
                $.each(questionAnswerdata, function (index, item) {
                    if (item.answer == 0) { done_code = '미응답' }
                    else { done_code = item.answer_data.created_at + '에 응답' }
                    dataHtml += `
                    <td class="col-2">${q_category(item.category)}</td>
                    <td class="col-5">${item.title}</td>
                    <td class="col-3"> ${done_code} </td>
                    <td class="col-1" onclick="get_question_detail(${item.id})"> <span class="cursor-pointer">🔍</span> </td>
                    <td class="col-1" onclick="delete_question(${item.id})"> <span class="cursor-pointer">❌</span> </td>
                    `;
                });
                $('#teacher_question_list').html(dataHtml);
            }
        })
    }else{
        $('#questionlist').hide()
        $('#question_pagination').hide()
        $('#q_title_msg').show();
    }
            
}
    // 문의 내용 상세보기
async function get_question_detail(q_id) {
    $('#questionlist').hide()
    $('#question_pagination').hide()
    $('#questiondetail').show()
    questiondata = questionAnswerdata.filter( q=> q.id == q_id)[0]
    ban_student_data = consultingStudentData.filter(s=>s.student_id == questiondata.student_id)[0]
    let temp_question_list = `
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">문의 종류</span>
        <p>${q_category(questiondata.category)}</p>
    </div>
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">제목</span>
        <p>${questiondata.title}</p>
    </div>
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">내용</span>
        <p>${questiondata.contents}</p>
    </div>
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">작성일</span>
        <p>${questiondata.create_date}</p>
    </div>
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">대상 반 | 학생</span>
        <p>${ban_student_data.ban_name} ➖ ${ban_student_data.student_name}</p>
    </div>
    <div class="modal-body-select-container">
        <span class="modal-body-select-label">첨부파일</span>
        <a href="/common/downloadfile/question/${q_id}" download="${questiondata.attach}">${questiondata.attach}</a>
    </div>`;
    $('#teacher_question').html(temp_question_list);
    // 상담 일지 처리 
    if(questiondata.category == 0){
        $('#consulting_history_attach').hide()
    }else{
        $('#consulting_history_attach').show()
        consulting_history = ban_student_data.consulting_list.filter(c=>c.id ==questiondata.consluting)[0]
        let category = ''
        if(consulting_history.category_id < 100 ){
            category = `${consulting_history.week_code}주간 ${consulting_history.category}상담`
        }else{
            category = `${consulting_history.category} ${consulting_history.contents}`
        }
        let temp_his = `
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">상담 종류</span>
            <p>${category}</p>
        </div>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">상담 사유</span>
            <p>${consulting_history.reason}</p>
        </div>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">제공한 가이드</span>
            <p>${consulting_history.solution}</p>
        </div>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">상담 결과</span>
            <p>${consulting_history.result}</p>
        </div>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">상담 일시</span>
            <p>${make_date(consulting_history.created_at)}</p>
        </div>
        `;
        $('#cha').html(temp_his);
    }
    let temp_answer_list = ''
    // 응답 처리 
    if(questiondata.answer == 0){
        temp_answer_list = `
        <div class="modal-body-select-container">
        <span class="modal-body-select-label">응답</span>
        <p>미응답</p>
        </div>`;
    }else{
        temp_answer_list = `
        <div class="modal-body-select-container">
        <span class="modal-body-select-label">응답제목</span>
        <p>${questiondata.answer_data.title}</p>
        </div>
        <div class="modal-body-select-container">
        <span class="modal-body-select-label">응답</span>
        <p>${questiondata.answer_data.content}</p>
        </div>
        <div class="modal-body-select-container">
            <span class="modal-body-select-label">응답일</span>
            <p>${questiondata.answer_data.created_at}</p>
        </div>`;
        if(questiondata.category != 0){
           temp_answer_list += `<div class="modal-body-select-container">
           <span class="modal-body-select-label">처리</span>
           <p>${make_reject_code(questiondata.answer_data.reject_code)}</p>
           </div>`
        }
    }
    $('#teacher_answer').html(temp_answer_list);
    // 댓글 처리
    // const temp_comment = `
    // <div class="comment-typing">
    //     <input class="comment-typing-input" type="text" id="comment_contents" placeholder="댓글을 남겨주세요">
    // </div>
    // <div class="comment-typing-save">
    //     <button class="comment-typing-save-btn" onclick="post_comment(${q_id},${0})">등록</button>
    // </div>
    // `;
    // $('#comment_post_box').html(temp_comment) 
    // $('#comments').empty()
    // const comments_len = questiondata.comment_data.length
    // if (comments_len != 0) {
    //     for (i = 0; i < comments_len; i++) {
    //         c_id = questiondata.comment_data[i]['id']
    //         c_contents = questiondata.comment_data[i]['contents']
    //         writer = questiondata.comment_data[i]['user_id']
    //         parent_id = questiondata.comment_data[i]['parent_id']

    //         if (parent_id == 0) {
    //             temp_comments = `
    //             <div id="for_comment${c_id}" style="margin-top:10px">
    //                 <p class="p_comment">${c_contents}  (작성자 : ${writer} | ${make_date(questiondata.comment_data[i]['created_at'])} )</p>
    //             </div>
    //             <details style="margin-top:0px;margin-right:5px;font-size:0.9rem;">
    //                 <summary><strong>대댓글 달기</strong></summary>
    //                     <input class="border rounded-0 form-control form-control-sm" type="text" id="comment_contents${c_id}"
    //                     placeholder=" 대댓글 ">
    //                     <button onclick="post_comment(${q_id},${c_id})">등록</button>
    //                 </details>
    //             `;
    //             $('#comments').append(temp_comments);
    //         } else {
    //             let temp_comments = `
    //             <p class="c_comment"> ➖ ${c_contents}  (작성자 : ${writer} | ${c_created_at} )</p>
    //             `;
    //             $(`#for_comment${parent_id}`).append(temp_comments);
    //         }

    //     }
    // }

}
