const today = new Date();
var selectedBanList = [];
var selectedStudentList = [];

// 처음 get 할때 뿌려질 정보 보내는 함수 
$(document).ready(function () {
    getBanlist();
    $('.nav-link').on('click', function(){
        $('.nav-link').removeClass('active');
        $(this).addClass('active');
    })
})

// 이반 * 퇴소 
// 조회
async function sodata(){
    $('#qubox').hide()
    $('#ulbox').hide()
    $('#detailban').hide()
    $('#sobox').show()
    await $.ajax({
        url: '/manage/sodata',
        type: 'GET',
        data: {},
        success: function(response){
            if (response['status'] == 400 || response['switch_out_bans'].length == 0){
                let no_data_title = `<h1> ${response.text} </h1>`
                $('#sotitle').html(no_data_title);
                $('#sotable').hide()
                return
            }
            $('#sotitle').empty();

            response['switch_out_bans'].sort((a,b)=>(answer_rate(b.out_count,b.outtotal_count).toFixed(0)) - (answer_rate(a.out_count,a.outtotal_count).toFixed(0)))
            // top 5만 보여주는 경우 
            // total_num = 0
            // if(response['switch_out_bans'].length > 5){
            //     total_num = 5
            // }else{
            //     total_num = response['switch_out_bans'].length
            // }

            let temp_html = ``
            console.log(response['switch_out_bans'])
            for(i=0;i< response['switch_out_bans'].length;i++){
                register_no = response['switch_out_bans'][i]['target_ban']['register_no']
                ban_name = response['switch_out_bans'][i]['target_ban']['ban_name']
                semester = response['switch_out_bans'][i]['target_ban']['semester']
                teacher_name = response['switch_out_bans'][i]['target_ban']['teacher_name'] +'( ' +response['switch_out_bans'][i]['target_ban']['teacher_engname'] +' )'
                switch_count = response['switch_out_bans'][i]['switch_out_count']['switchcount_per_ban']
                out_count = response['switch_out_bans'][i]['switch_out_count']['outcount_per_ban']
                sp = answer_rate(switch_count,response['switch_out_bans'][i]['switch_out_count']['switchtotal_count']).toFixed(0)
                op = answer_rate(out_count,response['switch_out_bans'][i]['switch_out_count']['outtotal_count']).toFixed(0)
                
                temp_html += `
                <td class="col-1">${i+1}위</td>
                <td class="col-3">${ban_name}</td>
                <td class="col-1">${semester}</td>
                <td class="col-3">${teacher_name}</td>
                <td class="col-2">${switch_count}(${sp}%)</td>
                <td class="col-2">${out_count}(${op}%)</td>
                `;
            }
            $('#static_data1').html(temp_html)
            
            
        }
    }) 
    
}
    // 이반 퇴소 문의 관리
function so_paginating(done_code) {
    let container = $('#so_pagination')
    $.ajax({
        url: '/manage/get_so_questions/' + done_code,
        type: 'get',
        data: {},
        success: function (data) {
            container.pagination({
                dataSource: JSON.parse(data),
                prevText: '이전',
                nextText: '다음',
                pageClassName: 'float-end',
                pageSize: 5,
                callback: function (data, pagination) {
                    var dataHtml = '';
                    $.each(data, function (index, item) {
                        if (item.category == 1) { item.category = '퇴소 요청' }
                        else if (item.category == 2) { item.category = '이반 요청' }
                        else { item.category = '취소/환불 요청' }
                        dataHtml += `
                        <td class="col-2">${item.category}</td>
                        <td class="col-4">${item.title}</td>
                        <td class="col-4">${item.contents}</td>
                        <td class="col-2"> <button class="custom-control custom-control-inline custom-checkbox" data-bs-toggle="modal"
                        data-bs-target="#answer" onclick="get_question(${item.id},${done_code})">✏️</button> 
                        <button onclick="delete_question(${item.id})">❌</button></td>`;
                    });
                    $('#so_tr').html(dataHtml);
                }
            })
        }
    })
}
// 미학습 (학습관리)
async function uldata(){
    $('#qubox').hide()
    $('#sobox').hide()
    $('#detailban').hide()
    $('#ulbox').show()
    await $.ajax({
        url: '/manage/uldata',
        type: 'GET',
        data: {},
        success: function(response){
            if (response['status'] == 400){
                let no_data_title = `<h1> ${response.text} </h1>`
                $('#ultitle').html(no_data_title);
                return
            }
            $('#ultitle').empty();
            unlearned_count = response['unlearned_count']['data']

            let temp_html = ``
            for(i=0;i<response['unlearned_bans'].length;i++){
                register_no = response['unlearned_bans'][i]['register_no']
                ban_name = response['unlearned_bans'][i]['ban_name']
                semester = response['unlearned_bans'][i]['semester']
                teacher_name = response['unlearned_bans'][i]['teacher_name'] +'( ' +response['unlearned_bans'][i]['teacher_engname'] +' )'
                ul = unlearned_count.filter(a => a.ban_id == register_no)[0]
                unlearned = ul['unlearned'] +'건( '+ul['unlearned_p']+'% )' 
                
                temp_html += `
                <td class="col-1">${i+1}</td>
                <td class="col-3">${ban_name}</td>
                <td class="col-2">${semester}</td>
                <td class="col-3">${teacher_name}</td>
                <td class="col-3">${unlearned}</td>
                `;
            }
            $('#static_data2').html(temp_html)
        }
    }) 
    
}
// 전체 반 정보(차트) 가져오는 함수 
function getBanlist(){
    $('#detailban').show();
    $('#qubox').hide()
    $('#sobox').hide()
    $('#ulbox').hide()
    $.ajax({
        type: "GET",
        url: "/common/all_ban",
        dataType: 'json',
        data: {},
        success: function (response) {
            let temp_ban_option = '<option value=0 selected>반을 선택해주세요</option>';
            let all_ban = response['all_ban']
            for (i = 0; i < all_ban.length; i++) {
                let name = all_ban[i]['name']
                let semester = make_semester(all_ban[i]['semester'])
                let t_id = all_ban[i]['teacher_id']
                let btid = all_ban[i]['ban_id']
                let value = btid + '_' + t_id +'_' + name
                temp_ban_option += `
                <option value="${value}">${name} (${semester}월 학기)</option>
                `;
            }
            $('#ban_list').html(temp_ban_option)
            $('#consulting_target_ban').html(temp_ban_option)
            $('#task_target_ban').html(temp_ban_option)

            const semesterGrouped = all_ban.reduce((result, item) => {
                const semester = item.semester;
                if (!result[semester]) {
                  result[semester] = [];
                }
                result[semester].push(item);
                return result;
            }, {});

            // 결과를 객체의 배열로 변환
            const semesterGroupedresult = Object.entries(semesterGrouped).map(([semester, items]) => {
                return { [semester]: items };
            });
            onesemester = Number(semesterGroupedresult[1]['1'][0]['total_student_num'])
            $('#onesemester').css('width',`${onesemester}%`);
            $('#onesemester').css('background-color','#95B3D7');
            $('#onesemester_msg').html(`1학기 원생 수: ${onesemester}명`);

            fivesemester = Number(semesterGroupedresult[2]['2'][0]['total_student_num'])
            $('#fivesemester').css('width',`${fivesemester}%`);
            $('#fivesemester').css('background-color','#D99694');
            $('#fivesemester_msg').html(`5학기 원생 수: ${fivesemester}명`);

            ninesemester = Number(semesterGroupedresult[0]['0'][0]['total_student_num'])
            $('#ninesemester').css('width',`${ninesemester}%`);
            $('#ninesemester').css('background-color','#EBF1DE');
            $('#ninesemester_msg').html(`9학기 학기 원생 수: ${ninesemester}명`);

            total_student_num = onesemester + fivesemester + ninesemester
            $('#total_student_num').css('width',`${total_student_num}%`);
            $('#total_student_num').css('background-color','#D7E4BD');
            $('#total_student_num_msg').html(`퍼플 총 원생: ${total_student_num}명`);

            for(j=0;j<3;j++){
                let key = j.toString()
                let temp_semester_banlist = ''
                let semester_out_student = 0
                const result = semesterGroupedresult[j][key].reduce((acc, ban_data) => {
                    let onList = [];
                    onList = response['outstudent']['data'].filter(a => a.ban_id == ban_data.ban_id );
                    let count_per_ban = 0
                    if (onList.length > 0) {
                        onList = onList[0];
                        count_per_ban = onList.count_per_ban
                        semester_out_student += count_per_ban
                    }
                    acc.push({
                        'b_id':ban_data.ban_id ,
                        'name':ban_data.name ,
                        'student_num':ban_data.student_num ,
                        'teacher_id':ban_data.teacher_id ,
                        'count_per_ban': count_per_ban,
                        'semester_out_student':semester_out_student,
                        'op':answer_rate(count_per_ban, semester_out_student).toFixed(0)
                    });
                    return acc;
                }, []);
    
                if (result.length > 0) {
                    result.sort((a, b) => {
                        return b.op- a.op
                });}
                
                result.forEach(ban_data => {
                    let b_id = ban_data['b_id']
                    let name = ban_data['name']
                    let student_num = ban_data['student_num']
                    let value = b_id + '_' + ban_data['teacher_id'] +'_' + name
                    let count_per_ban = ban_data['count_per_ban']
                    let op = ban_data['op']
                    // let on = response['outstudent']['data'].filter(a => a.ban_id == b_id);
                    
                    // if(on.length != 0){
                    //     count_per_ban = on[0]['count_per_ban']
                    //     total_out_ban = on[0]['total_count']
                    // }
                    temp_semester_banlist += `
                    <td class="col-3">${name}</td>
                    <td class="col-3">${student_num}</td>
                    <td class="col-3">${count_per_ban}(${op}%)</td>
                    <td class="col-3" data-bs-toggle="modal" data-bs-target="#target_ban_info" onclick="getBanChart('${value}')">👉</td>`;
                });

                $('#semester_banlist'+j).html(temp_semester_banlist)
                $('#out_msg'+j).html(`${make_semester(j)}학기 총 퇴소학생 수:${semester_out_student}`)

            }

        },
        error: function (xhr, status, error) {
            alert('xhr.responseText');
        }
    })

}

// 반 별 차트 정보 보내주는 함수 
async function getBanChart(btid){
    console.log(btid)
    if(btid == 0){
        $('#target_ban_info_requestModalLabel').html('반 상세 현황')
        $('#profile_data').empty()
        $('#ban_data').empty();
        $('#student_data').hide();
        $('#ban_statistics').empty();
        $('#pagingul').hide();
        $('#inloading').hide()
    }else{
        v = btid.split('_')
        b_id = Number(v[0])
        $('#target_ban_info_requestModalLabel').html(v[2]+'반 상세 현황')
        $('#inloading').show()
        $('#target_ban_info_body').hide()
        await $.ajax({
            type: "GET",
            url: "/manage/ban/"+b_id,
            data: {},
            success: function (response) {
                let target_ban = response['target_ban']
                if (response['status'] == 400){
                    let no_data_title = `<h1> ${response.text} </h1>`
                    $('#s_data').html(no_data_title);
                    $('#pagingul').hide();
                    return
                }
                let students_num = target_ban['student_num'];
                let teacher_name = target_ban['teacher_name']
                let teacher_e_name = target_ban['teacher_engname']
                let teacher_mobileno = target_ban['teacher_mobileno']
                let teacher_email = target_ban['teacher_email']
                let answer = Number(response['answer_alim'])
                let all_alim = Number(response['all_alim'])
                
                
                // 이반 학생 
                let switch_student = response['switch_student']['data'].filter(a => a.ban_id == b_id).length;
                let all_s_student = response['switch_student']['data'].length;
                // 퇴소 학생 
                let out_student = response['out_student']['data'].filter(a => a.ban_id == b_id).length;
                let all_o_student = response['out_student']['data'].length;
                // 공지 
                let notice = response['notice']
                
                // 상담
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
                let switchstudent_num = response['switchstudent_num']
                let switchstudent_num_p = response['switchstudent_num_p']
                let outstudent_num = response['outstudent_num']
                let outstudent_num_p = response['outstudent_num_p']
                let unlearned_ttd = response['unlearned_ttd']
                let unlearned_ttc = response['unlearned_ttc']
    
                let temp_profile_data = `
                <tbody  style="width:100%;">
                    <tr class="row" style="background: #DCE6F2;">
                        <th class="col-12">담임 선생님 정보</th>
                    </tr>
                    <tr class="row" style="background:#DCE6F2;">
                        <td class="col-4">${teacher_name}(${teacher_e_name})</th>
                        <td class="col-4"> 📞 ${teacher_mobileno} </th>
                        <td class="col-4"> ✉️ ${teacher_email}</th>
                    </tr>
                </tbody>
                `;
                $('#profile_data').html(temp_profile_data);
    
    
                let temp_ban_data = `
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
                        <td class="col-3">${u_consulting_my.length}(${answer_rate(u_consulting_my.length, all_uc_consulting).toFixed(2)}%) </td>
                    </tr>
                </tbody>
                `;
    
                $('#ban_data').html(temp_ban_data);
                
                response['student_info'].forEach((elem) =>{
                    elem.unlearned = u_consulting_my.filter( a => a.student_id == elem.register_no).length
                    elem.up = answer_rate(elem.unlearned, u_consulting_my.length).toFixed(1)
                })
                response['student_info'].sort((a,b)=>b.up - a.up)
                data_list = response['student_info']
                totalData = students_num
                
                displayData(totalData, 1, dataPerPage,data_list, b_id);
                paging(totalData, dataPerPage, pageCount, 1,data_list, b_id);
                $('#student_data').show()
                $('#pagingul').show();
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
                    alert('xhr.responseText');
            }
        })
    }
    $('#inloading').hide()
    $('#target_ban_info_body').show()
}

// 업무 요청 관련 함수 
async function request_task() {
    await $.ajax({
        url: '/manage/request_task',
        type: 'GET',
        data: {},
        success: function (response) {
            let temp_task_category_list = '<option value=0 selected>업무 카테고리를 선택해주세요</option>';
            for (i = 0; i < response['all_task_category'].length; i++) {
                let id = response['all_task_category'][i]['id']
                let name = response['all_task_category'][i]['name']
                temp_task_category_list += `
                <option value=${id}>${name}</option>
                `;
                $('#task_category_list').html(temp_task_category_list)
            }
        }
    })
}
function show_ban_selection(){
    var selectedOptions = ''
    for(i=0;i<selectedBanList.length;i++){
        // bid+tid+bname+sid+sname
        var value = selectedBanList[i].split('_')
        selectedOptions += `
        <td class="col-11">${value[2]}</td>
        <td class="col-1" onclick="delete_selected_ban(${i})">❌</td>`;
        $('#target_task_bans').html(selectedOptions);
    }
}
function task_ban_change(btid){
    if(btid.includes('_')){
        // 다중 반 처리
        $('#target_task_bans').show() 
        $('#task_msg').html('👇 개별 반 대상 진행합니다 (대상 반을 확인해 주세요)')
        if(selectedBanList.indexOf(btid) === -1) {
            selectedBanList.push(btid);
        }
        $('select[name="task_target_ban[]"]').val(selectedBanList);
        return show_ban_selection()
    }else{
        selectedBanList.length=0
        $('#target_task_bans').empty()
        if(btid == 0){
            // 전체 반 대상 진행 일 경우 처리 
            $('#task_msg').html('👉 전체 반 대상 진행합니다 (소요되는 시간이 있으니 저장 클릭후 화면이 이동하기 전 까지 대기 해 주세요)')
        }else if(btid == 1){
            // plus alpha 처리
            $('#task_msg').html('👉 PLUS/ALPHA반 대상 진행합니다 (소요되는 시간이 있으니 저장 클릭후 화면이 이동하기 전 까지 대기 해 주세요)')
        }else if(btid == 2){
            // nf 노블 처리 
            $('#task_msg').html('👉 NF/NOVEL반 대상 진행합니다 (소요되는 시간이 있으니 저장 클릭후 화면이 이동하기 전 까지 대기 해 주세요)')
        }
    }
}
function delete_selected_ban(idx){
    selectedBanList.splice(idx,1)
    $('select[name="task_target_ban[]"]').val(selectedBanList);
    return show_ban_selection()
}

// 상담 요청 관련 함수 
async function request_consulting() {
    $('#result_tbox').empty()
    $('#select_student').hide()
    
    await $.ajax({
        url: '/manage/request_consulting',
        type: 'GET',
        data: {},
        success: function (response) {
            let temp_consulting_category_list = '<option value=0 selected>상담카테고리를 선택해주세요</option>';
            for (i = 0; i < response['all_consulting_category'].length; i++) {
                let id = response['all_consulting_category'][i]['id']
                let name = response['all_consulting_category'][i]['name']
                temp_consulting_category_list += `
                <option value=${id}>${name}</option>
                `;
                $('#consulting_category_list').html(temp_consulting_category_list)
            }
        }
    })
}
async function ban_change(btid){
    if(btid.includes('_')){
        // 다중 반 처리
        $('#select_student').show() 
        $('#consulting_msg').html('👇 개별 반 대상 진행합니다 (대상 학생을 확인해 주세요)')
        value = btid.split('_')
        await $.ajax({
            type: "GET",
            url: "/manage/ban_student/"+value[0],
            data: {},
            success: function (response) {
                // 전체 학생 대상 진행 append 
                let temp_target_student = `<option value="${btid}_-1_전체 학생 대상 진행">✔️${value[2]}반 전체 학생 대상 진행</option>`;
                for (var i = 0; i <  response['students'].length; i++) {
                    let sname = response['students'][i]['name'];
                    temp_target_student += `<option value="${btid}_${response['students'][i]['register_no']}_${sname}"> ${sname}</option>`;
                } 
                $('#consulting_target_students').html(temp_target_student)
            },
            error:function(xhr, status, error){
                    alert('xhr.responseText');
            }

        })
    }else{
        $('#select_student').hide()
        $('#result_tbox').empty()
        if(btid == 0){
            // 전체 반 대상 진행 일 경우 처리 
            $('#consulting_msg').html('👉 전체 반 대상 진행합니다 (소요되는 시간이 있으니 저장 클릭후 알람메시지가 나올 때 까지 대기 해 주세요)')
        }else if(btid == 1){
            // plus alpha 처리
            $('#consulting_msg').html('👉 PLUS/ALPHA반 대상 진행합니다 (소요되는 시간이 있으니 저장 클릭후 알람메시지가 나올 때 까지 대기 해 주세요)')
        }else if(btid == 2){
            // nf 노블 처리 
            $('#consulting_msg').html('👉 NF/NOVEL반 대상 진행합니다 (소요되는 시간이 있으니 저장 클릭후 알람메시지가 나올 때 까지 대기 해 주세요)')
        }
    }
}
$('#consulting_target_students').change(function(){
    var selectedValues = $(this).val()[0];
    if(selectedStudentList.indexOf(selectedValues) === -1) {
        selectedStudentList.push(selectedValues);
    }
    return show_selections();
});
function show_selections(){
    $('#result_tbox').empty()
    for(i=selectedStudentList.length-1;i>=0;i--){
        // 전체 반이 선택된 경우 
        if(String(selectedStudentList[i]).includes('-1')){
            // 같은 반 친구들 교집합을 저장 
            let total_student_selections = selectedStudentList.filter(value => ( (String(value).split('_')[0] == selectedStudentList[i].split('_')[0]) && (!(value.includes('-1'))) ) );
            if(total_student_selections.length != 0){
                total_student_selections.forEach(value =>{
                    selectedStudentList.splice(selectedStudentList.indexOf(value),1);
                })
            }
        } 
    }
    var selectedOptions = ''
    for(i=0;i<selectedStudentList.length;i++){
        // bid+tid+bname+sid+sname
        var value = selectedStudentList[i].split('_')
        selectedOptions += `
        <td class="col-4">${value[2]}</td>
        <td class="col-6">${value[4]}</td>
        <td class="col-2" onclick="delete_selected_student(${i})">❌</td>`;
        $('#result_tbox').html(selectedOptions);
    }
}
function delete_selected_student(idx){
    selectedStudentList.splice(idx,1)
    
    // 선택 된거 보여주기 
    return show_selections();
} 
function post_consulting_request(){
    consulting_category = $('#consulting_category_list').val()
    consulting_contents = $('#consulting_contents').val()
    consulting_date = $('#consulting_date').val()
    consulting_deadline = $('#consulting_deadline').val()
    // 다중 선택 대상 선택일 경우  
    if(selectedStudentList.length != 0){
        let total_student_selections = selectedStudentList.filter(value => value.includes('-1') );
        // 전체 학생 대상 인 경우
        if(total_student_selections.length != 0){
            total_student_selections.forEach(value =>{
                v = String(value).split('_')
                $.ajax({
                    type: "POST",
                    url:'/manage/consulting/request_all_student/'+v[0]+'/'+v[1],
                    // data: JSON.stringify(jsonData), // String -> json 형태로 변환
                    data: {
                        consulting_category:consulting_category,
                        consulting_contents:consulting_contents,
                        consulting_date:consulting_date,
                        consulting_deadline:consulting_deadline
                    },
                    success: function (response) {
                        if(response != 'success'){
                            alert('상담 요청 실패')
                        }
                    }
                })
                alert(v[2] +'반에 상담요청 완료');
            })
        }
        // 개별 학생 대상 인 경우  
        let indivi_student_selections = selectedStudentList.filter(value => !(value.includes('-1')) );
        if(indivi_student_selections.length != 0){
            indivi_student_selections.forEach(value =>{
                v = String(value).split('_')
                $.ajax({
                    type: "POST",
                    url:'/manage/consulting/request_indivi_student/'+v[0]+'/'+v[1]+'/'+v[3],
                    // data: JSON.stringify(jsonData), // String -> json 형태로 변환
                    data: {
                        consulting_category:consulting_category,
                        consulting_contents:consulting_contents,
                        consulting_date:consulting_date,
                        consulting_deadline:consulting_deadline
                    },
                    success: function (response) {
                        if(response != 'success'){
                            alert('상담 요청 실패')
                        }
                    }
                })
                alert(v[2]+'반 '+v[4]+'원생 상담요청 완료');
            })
        }
        window.location.reload()    
    // 전체 반 대상 선택 일 경우 
    }else{
        b_type = $('#consulting_target_aban').val()[0]
        $.ajax({
            type: "POST",
            url:'/manage/consulting/all_ban/'+b_type,
            // data: JSON.stringify(jsonData), // String -> json 형태로 변환
            data: {
                consulting_category:consulting_category,
                consulting_contents:consulting_contents,
                consulting_date:consulting_date,
                consulting_deadline:consulting_deadline
            },
            success: function (response) {
                if(response['result'] != 'success'){
                    alert('상담 요청 실패')
                }else{
                    alert('해당 반 전체에 상담요청 완료')
                    window.location.reload()
                }
            }
        })
    }
}

// CS 관리 
function paginating(done_code) {
    $('#detailban').hide()
    $('#sobox').hide()
    $('#ulbox').hide()
    $('#qubox').show()
    let container = $('#pagination')
    $.ajax({
        url: '/manage/api/get_all_questions/' + done_code,
        type: 'get',
        data: {},
        success: function (data) {
            container.pagination({
                dataSource: JSON.parse(data),
                prevText: '이전',
                nextText: '다음',
                pageClassName: 'float-end',
                pageSize: 5,
                callback: function (data, pagination) {
                    var dataHtml = '';
                    $.each(data, function (index, item) {
                        if (item.category == 0) { item.category = '일반문의' }
                        else if (item.category == 1) { item.category = '퇴소 요청' }
                        else if (item.category == 2) { item.category = '이반 요청' }
                        else { item.category = '취소/환불 요청' }
                        dataHtml += `
                    <td class="col-2">${item.category}</td>
                    <td class="col-4">${item.title}</td>
                    <td class="col-4">${item.contents}</td>
                    <td class="col-2"> <button class="custom-control custom-control-inline custom-checkbox" data-bs-toggle="modal"
                    data-bs-target="#answer" onclick="get_question(${item.id},${done_code})">✏️</button> 
                    <button onclick="delete_question(${item.id})">❌</button></td>`;
                    });
                    $('#alim-tr').html(dataHtml);
                }
            })
        }
    })
}

// 과거 코드
function go_back() {
    $('#for_taskban_list').hide();
    $('#for_task_list').show();
}
async function get_consulting() {
    let container = $('#consulting-pagination')
    var category_list = []
    await $.ajax({
        url: '/manage/api/get_consulting',
        type: 'get',
        data: {},
        success: function (data) {
            console.log(data)
            $.each([...JSON.parse(data)], function (idx, val) {
                category_list.push(val.name)
            });
            consultingData = data;
            container.pagination({
                dataSource: JSON.parse(data),
                prevText: '이전',
                nextText: '다음',
                pageSize: 10,
                callback: function (data, pagination) {
                    var dataHtml = '';
                    var idxHtml = `<option value="none">전체</option>`;
                    $.each(data, function (index, consulting) {
                        dataHtml += `
                    <td class="col-3">${consulting.startdate} ~ ${consulting.deadline}</td>
                    <td class="col-2">${consulting.name}</td>
                    <td class="col-1"> 미진행 </td>
                    <td class="col-4"> ${consulting.contents}</td>
                    <td class="col-2"> <button class="modal-tbody-btn" onclick="update_consulting(${consulting.id})">✏️</button> 
                    <button class="modal-tbody-btn" onclick="delete_consulting(${consulting.id})">❌</button></td>`;
                    });
                    category_set = new Set(category_list)
                    category_list = [...category_set]
                    $.each(category_list, function (idx, val) {
                        idxHtml += `<option value="${val}">${val}</option>`
                    })
                    $('#consulting-option').html(idxHtml);
                    $('#tr-row').html(dataHtml);
                }
            })
        },
        error: function (xhr, status, error) {
            alert(xhr.responseText);
        }
    })
}

async function update_consulting(idx) {
    await $.ajax({
        url: '/manage/api/update_consulting',
        type: 'get',
        data: { 'text': 'good' },
        success: function (data) {
            console.log(data)
        }
    })
}

async function sort_consulting(value) {
    var dataHtml = '';
    let container = $('#consulting-pagination')
    const data = await JSON.parse(consultingData).filter((e) => {
        if (value == 'none') {
            return e.name
        } else {
            return e.name == value;
        }
    })
    await container.pagination({
        dataSource: data,
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        callback: function (data, pagination) {
            console.log(data)
            var dataHtml = '';
            $.each(data, function (index, consulting) {
                dataHtml += `
                    <td class="col-3">${consulting.startdate} ~ ${consulting.deadline}</td>
                    <td class="col-2">${consulting.name}</td>
                    <td class="col-1"> 미진행 </td>
                    <td class="col-4"> ${consulting.contents}</td>
                    <td class="col-2"> <button onclick="update_consulting(${consulting.id})">✏️</button> 
                    <button onclick="delete_consulting(${consulting.id})">❌</button></td>`;
            });
            $('#tr-row').html(dataHtml);
        }
    })
}

async function get_task() {
    let container = $('#task-pagination')
    var category_list = []
    await $.ajax({
        url: '/manage/api/get_task',
        type: 'get',
        data: {},
        success: function (data) {
            $.each([...JSON.parse(data)], function (idx, val) {
                category_list.push(val.name)
                // 카테고리의 이름만 저장 
            });
            taskData = JSON.parse(data);
            container.pagination({
                dataSource: JSON.parse(data),
                prevText: '이전',
                nextText: '다음',
                pageSize: 10,
                callback: function (data, pagination) {
                    var dataHtml = '';
                    var idxHtml = `<option value="" selected>카테고리를 선택해주세요</option><option value="none">전체</option>`;
                    $.each(data, function (index, task) {
                        let progress = '';
                        let startdate = new Date(task.startdate)
                        let deadline = new Date(task.deadline)
                        if (today < startdate) {
                            progress = '예정'
                        } else if ((startdate <= today) && (today <= deadline)) {
                            progress = '진행 중'
                        } else {
                            progress = '마감'
                        }
                        dataHtml += `
                    <td class="col-3">${task.startdate} ~ ${task.deadline} (${progress})</td>               
                    <td class="col-3">${task.name}업무</td>          
                    <td class="col-4"> ${task.contents}</td>
                    <td class="col-2"> <button onclick="get_taskban(${task.id})">✏️</button>
                    <button onclick="delete_task(${task.id})">❌</button></td>`;
                    });
                    category_set = new Set(category_list)
                    category_list = [...category_set]
                    $.each(category_list, function (idx, val) {
                        idxHtml += `<option value="${val}">${val}</option>`
                    })
                    $('#task-category-select').html(idxHtml);
                    $('#task-tr').html(dataHtml);
                }
            })

        },
        error: function (xhr, status, error) {
            alert(xhr.responseText);
        }
    })
}

async function sort_task(value) {
    var dataHtml = '';
    let container = $('#task-pagination')
    const data = taskData.filter((e) => {
        if (value == 'none') {
            return e.name
        } else {
            return e.name == value;
        }
    })
    await container.pagination({
        dataSource: data,
        prevText: '이전',
        nextText: '다음',
        pageSize: 10,
        callback: function (data, pagination) {
            var dataHtml = '';
            var idxHtml = `<option value="none" selected>카테고리를 선택해주세요</option>`;
            $.each(data, function (index, task) {
                let progress = '';
                let startdate = new Date(task.startdate)
                let deadline = new Date(task.deadline)
                if (today < startdate) {
                    progress = '예정'
                } else if ((startdate <= today) && (today <= deadline)) {
                    progress = '진행 중'
                } else {
                    progress = '마감'
                }
                dataHtml += `
                    <td class="col-3">${task.startdate} ~ ${task.deadline} (${progress})</td>              
                    <td class="col-3">${task.name}업무</td>    
                    <td class="col-4"> ${task.contents}</td>
                    <td class="col-2"> <button onclick="get_taskban(${task.id})">✏️</button>
                    <button onclick="delete_task(${task.id})">❌</button></td>`;
            });

            $('#task-tr').html(dataHtml);
        }
    })
}

function get_taskban(task_id) {
    $('#taskModalLabel').html('반 별 진행 내역');
    $('#for_task_list').hide();
    $('#for_taskban_list').show();
    $.ajax({
        type: "GET",
        url: "/manage/taskban/" + task_id,
        data: {},
        success: function (response) {
            let temp_task_ban_box = '';
            for (i = 0; i < response['target_taskban'].length; i++) {
                let target = response['target_taskban'][i]
                let id = target["id"]
                let ban = target["ban"]
                let done = target["done"]
                if (done == 0) {
                    done = '미진행'
                } else {
                    done = '진행완료'
                }
                temp_task_ban_box += `
                <td class="col-4">${ban}</td>
                <td class="col-4">${done}</td>
                <td class="col-4">✖️</td>
                `;
                $('#taskban_list').html(temp_task_ban_box);
            }
        }
    });
}

async function delete_consulting(idx) {
    const csrf = $('#csrf_token').val();
    var con_val = confirm('정말 삭제하시겠습니까?')
    if (con_val == true) {
        await $.ajax({
            url: '/manage/api/delete_consulting/' + idx,
            type: 'get',
            headers: { 'content-type': 'application/json' },
            data: {},
            success: function (data) {
                if (data.status == 200) {
                    alert(`삭제되었습니다.`)
                } else {
                    alert(`실패 ${data.status} ${data.text}`)
                }
            },
            error: function (xhr, status, error) {
                alert(xhr.responseText);
            }
        })
        get_consulting()
    }
}

async function delete_task(idx) {
    var con_val = confirm('정말 삭제하시겠습니까')
    if (con_val == true) {
        await $.ajax({
            url: '/manage/api/delete_task/' + idx,
            type: 'get',
            headers: { 'content-type': 'application/json' },
            data: {},
            success: function (data) {
                if (data.status == 200) {
                    alert(`삭제되었습니다.`)
                } else {
                    alert(`실패 ${data.status} ${data.text}`)
                }
            },
            error: function (xhr, status, error) {
                alert(xhr.responseText);
            }
        })
        get_task()
    }
}

function plusconsulting(student_id, is_done) {
    $.ajax({
        type: "GET",
        url: "/manage/get_consulting_history/" + student_id,
        data: {},
        success: function (response) {
            if (response["consulting_list"] == '없음') {
                $('#consultinghistoryModalLabelt').html('진행 한 상담이 없습니다.')
                //     $('#consulting_list').hide();
                //     let temp_consulting_contents_box = `
                //     <p> 오늘의 상담 업무를 완료했습니다 🎉</p>
                //     `;
                //     $('#consulting_msg').html(temp_consulting_contents_box);
            } else {
                $('#consultinghistoryModalLabelt').html('상담일지 작성')
                $('#consulting_write_box').empty();
                let r_target = response["consulting_list"]
                for (i = 0; i < r_target.length; i++) {
                    let target = r_target[i]
                    let category = target['category']
                    let consulting_id = target['c_id']
                    let contents = target['contents']
                    let consulting_missed = target['consulting_missed']
                    let deadline = target['deadline']
                    if (is_done == 1) {
                        let history_reason = target['history_reason']
                        let history_solution = target['history_solution']
                        let history_result = target['history_result']
                        let history_created = target['history_created']
                        let temp_consulting_contents_box = `
                    <input type="hidden" id="target_consulting_id${i}" value="${consulting_id}" style="display: block;" />
                    <p >✅<strong>${category}</strong></br>${contents}</br>*마감:
                        ~${deadline}까지 | 부재중 : ${consulting_missed}</br></p>
                    <div class="modal-body-select-container">
                        <span class="modal-body-select-label">상담 사유</span>
                        <input class="modal-body-select" type="text" size="50"
                            id="consulting_reason${consulting_id}" style="width: 75%;" placeholder="${history_reason}">
                    </div>
                    <div class="modal-body-select-container">
                        <span class="modal-body-select-label">제공한 가이드</span>
                        <input class="modal-body-select" type="text" size="50"
                            id="consulting_solution${consulting_id}" style="width: 75%;" placeholder="${history_solution}">
                    </div>
                    <div class="modal-body-select-container">
                        <span class="modal-body-select-label">상담 결과</span>
                        <textarea class="modal-body-select" type="text" rows="5" cols="25"
                            id="consulting_result${consulting_id}" style="width: 75%;" placeholder="${history_result}"></textarea>
                    </div>
                    <p>상담 일시 : ${history_created}</p>
                    `;
                        $('#consulting_write_box').append(temp_consulting_contents_box);
                    } else {
                        let temp_consulting_contents_box = `
                    <input type="hidden" id="target_consulting_id${i}" value="${consulting_id}" style="display: block;" />
                    <p >✅<strong>${category}</strong></br>${contents}</br>*마감:
                        ~${deadline}까지 | 부재중 : ${consulting_missed}</br></p>
                    <div class="modal-body-select-container">
                        <span class="modal-body-select-label">상담 사유</span>
                        <input class="modal-body-select" type="text" size="50"
                            id="consulting_reason${consulting_id}" style="width: 75%;">
                    </div>
                    <div class="modal-body-select-container">
                        <span class="modal-body-select-label">제공한 가이드</span>
                        <input class="modal-body-select" type="text" size="50"
                            id="consulting_solution${consulting_id}" style="width: 75%;">
                    </div>
                    <div class="modal-body-select-container">
                        <span class="modal-body-select-label">상담 결과</span>
                        <textarea class="modal-body-select" type="text" rows="5" cols="25"
                            id="consulting_result${consulting_id}" style="width: 75%;"></textarea>
                    </div>
                    `;
                        $('#consulting_write_box').append(temp_consulting_contents_box);
                    }

                }
                let temp_post_box = `
                <p>✔️ 상담 결과 이반 / 취소*환불 / 퇴소 요청이 있었을시 본원 문의 버튼을 통해 승인 요청을 남겨주세요</p>
                    <div class="modal-body-select-container">
                    <span class="modal-body-select-label">부재중</span>
                    <label><input type="checkbox" id="missed">부재중</label>
                    </div>
                    <div class="d-flex justify-content-center mt-4 mb-2" id="consulting_button_box">
                        <button class="btn btn-dark"
                            onclick="post_bulk_consultings(${r_target.length},${is_done})"
                            style="margin-right:5px">저장</button>
                    </div>
                `;
                $('#consulting_write_box').append(temp_post_box);
            }
        }
    });
    // $('#today_consulting_box').show();
}
