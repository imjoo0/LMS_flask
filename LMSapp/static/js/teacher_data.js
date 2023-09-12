// teacher 전역 변수

    //  상담, 업무 관련 
    // Tall_consulting, Tall_task,
    // Ttask_consulting, taskConsultingsData, TunlearnedConsultingsData, unlearnedConsultingsCount,

    // 원생 상담 관련 
    //  Tstudent_consulting, Tunlearned_student,  

    // 반 , 원생 관련 
    //  Tban_data ( 담당 중인 전체 반 ), Tmy_students, Tall_students, 


    // 문의 답변 관련 
    // TquestionAnswerdata, TquestionAttachdata;
    // const TattachMap = new Map();

    // 맵핑 함수
    // const TstudentMap = new Map(); -> student_id(str) 로 해당 반의 정보를 찾음 
    // const TbanMap = new Map(); -> ban_id로 해당 반의 정보를 찾음 . 
    // const consultingStudentMap = new Map(); -> 

function getBanAndStudentsData() {
    return new Promise((resolve, reject) => {
        const TbanstudentsWorker = new Worker("../static/js/Tbans_worker.js");
        TbanstudentsWorker.postMessage('get ban and students data');
        
        TbanstudentsWorker.onmessage = function (event) {
            resolve(event.data.all_data);
        };
        
        TbanstudentsWorker.onerror = function (error) {
            reject(error);
        };
    });
}

async function get_teacher_data(){
    try{
        $('#maininloading').show()
        $('#main').hide()
        // 설정할 데이터 초기화
        // TstudentMap = new Map(); // 원생정보를 찾을 수 있는 Map 
        Tmy_students = []
        Tban_data = []
        Tall_writing = []
        Ttask_consulting = []
        Tall_task = []
        Tall_consulting = []
        TunlearnedConsultingsData = []
        Tunlearned_student =[]


        // 담당중인 반과 학생들의 데이터를 백그라운드로 요청 보냅니다 
        let [banAndStudentsData] = await Promise.all([getBanAndStudentsData()])
        
        Tall_students = banAndStudentsData
        let total_first_student_num = Tall_students.length
        let total_out_student_num = Tall_students.filter(s=>s.category_id == 2).length
        let total_hold_student_num = Tall_students.filter(s=>s.category_id == 3).length
        let total_now_student_num = total_first_student_num - total_out_student_num - total_hold_student_num

        if(total_now_student_num <= 0){
            alert('담당중인 반이 없습니다')
            return
        }
        let temp_ban_chart = `
        <div class="d-flex justify-content-start align-items-start flex-column w-100 my-2">
            <h5 class="mb-3"> 📌 초기 배정 원생 수:  ${total_first_student_num}</h5>
            <div class="row w-100">
                <div class="chart-wrapper col-sm-5"style="margin-left:30%">
                    <canvas id="total-celement" class="total-chart-element p-sm-3 p-2"></canvas>
                    <div class ="chart-data-summary">
                        <span>관리중:${total_now_student_num}</span><br>
                        <span>* 보류:${total_hold_student_num}</span><br>
                        <span>* 퇴소:${total_out_student_num}</span>
                    </div>
                </div>
        </div>`
        $('#ban_chart_list').html(temp_ban_chart)
        new Chart($((`#total-celement`)), {
            type: 'doughnut',
            data: {
                labels: ['관리중', '보류', '퇴소'],
                datasets: [
                    {
                        data: [total_now_student_num, total_hold_student_num, total_out_student_num],
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

        // const purplewritingWorker = new Worker("../static/js/Twriting_worker.js");
        // const TtaskdataWorker = new Worker("../static/js/Ttask_worker.js");
        // const TunlearnedWorker = new Worker("../static/js/Tunlearned_worker.js");
        // let temp_ban_list = ''
        // let temp_ban_option = '<option value="none" selected>반을 선택해주세요</option>';
        // // Tall_students 는 전체 원생-반으로 묶여 있기 때문에 전체 데이터에서 반데이터로 나누는 작업을 합니다.
        // // TbanstudentsWorker 작업이 완료되면 이 부분이 실행됩니다.
        // Tall_students.forEach((student) => {
        //     student.semester = make_semester(student.semester)
        //     if (!TbanMap.has(student.ban_id)) {
        //         TtaskdataWorker.postMessage({'ban_id':student.ban_id}) 
        //         TtaskdataWorker.onmessage = function (event) {
        //             // 본원 요청 상담=업무
        //             Ttask_consulting = Ttask_consulting.concat(event.data.task_consulting)
        //             Tall_task = Tall_task.concat(event.data.task)
        //             Tgrouped_task = Tall_task.reduce((acc, item) => {
        //                 if (!acc[item.category]) {
        //                     acc[item.category] = [];
        //                 }
        //                 acc[item.category].push(item);
        //                 return acc;
        //             }, []);
        //             return home_task()
        //         };
        //         TunlearnedWorker.postMessage({'ban_id':student.ban_id,'startdate':student.startdate})
        //         TunlearnedWorker.onmessage = function (event) {
        //             // 미제출 명단을 가져옵니다.
        //             TunlearnedConsultingsData = TunlearnedConsultingsData.concat(event.data.unlearned) 
        //             unlearnedConsultingsCount = TunlearnedConsultingsData.length
        //             if(unlearnedConsultingsCount != 0 ){
        //                 const unlearnedDataByStudent = {};
        //                 TunlearnedConsultingsData.forEach((unlearned)=>{
        //                     const studentId = unlearned.student_id;

        //                     // unlearnedDataByStudent에 학생 별로 그룹화
        //                     if (!unlearnedDataByStudent[studentId]) {
        //                         unlearnedDataByStudent[studentId] = [];
        //                     }

        //                     unlearnedDataByStudent[studentId].push(unlearned);

        //                     for (const studentId in unlearnedDataByStudent) {
        //                         const unlearnedArray = unlearnedDataByStudent[studentId];

        //                         // 미학습 기록을 deadline 기준으로 정렬
        //                         unlearnedArray.sort((a, b) => {
        //                             if (a.deadline < b.deadline) return -1;
        //                             if (a.deadline > b.deadline) return 1;
        //                             return 0;
        //                         });

        //                         // 가장 오래된 deadline과 최신 missed 설정
        //                         const oldestDeadline = unlearnedArray[0].deadline;
        //                         const latestMissed = unlearnedArray.reduce((latest, current) => {
        //                             if (!latest || current.missed > latest) {
        //                                 return current.missed;
        //                             }
        //                             return latest;
        //                         }, null);

        //                         // Tunlearned_student에 업데이트
        //                         const studentObj = Tunlearned_student.find(item => item.student_id === studentId);
        //                         if (studentObj) {
        //                             studentObj.deadline = oldestDeadline;
        //                             studentObj.missed = latestMissed;
        //                             studentObj.unlearned_list = unlearnedArray;
        //                         } else {
        //                             // Tunlearned_student에 해당 학생이 없으면 새로 추가
        //                             Tunlearned_student.push({
        //                                 student_id: studentId,
        //                                 deadline: oldestDeadline,
        //                                 missed: latestMissed,
        //                                 unlearned_list: unlearnedArray
        //                             });
        //                         }
        //                     }
        //                 })

        //                 // Tunlearned_student를 deadline이 오래된 순으로 정렬
        //                 Tunlearned_student.sort((a, b) => {
        //                     if (a.deadline < b.deadline) return -1;
        //                     if (a.deadline > b.deadline) return 1;
        //                     return 0;
        //                 });

        //             }
        //             return home_unlearned(0)
        //         };
        //         // 담당중인 학생들의 퍼플 라이팅 미제출 내역 데이터를 백그라운드로 요청 보냅니다
        //         purplewritingWorker.postMessage({ ban_id: student.ban_id })
        //         purplewritingWorker.onmessage = function (event) {
        //             // 미제출 명단을 가져옵니다.
        //             Tall_writing=Tall_writing.concat(event.data.result) 
        //             $('#total_unsubmited_num').html(`누적 퍼플 라이팅 미제출 : ${Tall_writing.length} 건`)
        //             $('#unsubmited_loader').show()
        //             // *ban_id 추가 경우 
        //             const groupedData = {};
        //             Tall_writing.forEach(item => {
        //                 const { ban_id, week } = item;
                        
        //                 // ban_id를 키로, week을 서브 키로 가지는 객체를 생성
        //                 if (!groupedData[ban_id]) {
        //                     groupedData[ban_id] = {};
        //                 }
                    
        //                 // week 값을 키로 가지는 배열에 데이터 추가
        //                 if (!groupedData[ban_id][week]) {
        //                     groupedData[ban_id][week] = [];
        //                 }
                        
        //                 groupedData[ban_id][week].push(item);
        //             });
        //             // week 값을 내림차순으로 정렬하기
        //             for (const ban_id in groupedData) {
        //                 const weeks = Object.keys(groupedData[ban_id]).sort((a, b) => b - a);
        //                 TunSubList[ban_id] = weeks.map(week => ({
        //                     week,
        //                     unsubmiteds: groupedData[ban_id][week]
        //                 }));
        //             }
        //             // 결과 출력
        //             return home_unsubmited()
        //         };
        //         temp_ban_option += `<option value=${student.ban_id}>${student.ban_name} (${student.semester}월 학기)</option>`; // 문의 남길때 필요한 반 select 박스도 전체 반 for문 도는 김에 같이 붙입니다. 

        //         // 반별 차트를 그리기 위한 변수 선언 
        //         let first_student = Tall_students.filter(s=>s.ban_id == student.ban_id)
        //         let first_student_num = first_student.length
        //         let out_student_num = first_student_num != 0 ? first_student.filter(s=>s.category_id == 2).length : 0 
        //         let hold_student_num = first_student_num != 0 ? first_student.filter(s=>s.category_id == 3).length : 0 
        //         let now_student_num = first_student_num - out_student_num - hold_student_num


        //         temp_ban_list += `
        //             <th class="col-3">${student.ban_name}반</th>
        //             <th class="col-1">${student.semester}학기</th>
        //             <td class="col-2">${now_student_num}</td>
        //             <td class="col-2">${hold_student_num}</td>
        //             <td class="col-2">${out_student_num}</td>
        //             <td class="col-2" data-bs-toggle="modal" data-bs-target="#ban_student_list" onclick="get_student(${student.ban_id})">✔️</td>
        //         `

        //         TbanMap.set(student.ban_id, {
        //             ban_name: student.ban_name,
        //             ban_startdate:student.startdate
        //         });
        
        //         Tban_data.push({
        //             ban_id: student.ban_id,
        //             name: student.ban_name,
        //             semester:student.semester,
        //             startdate:student.startdate,
        //             teacher_id: student.teacher_id
        //         });
        //     }
        //     if(student.category_id != 2 && student.category_id != 3){
        //         Tmy_students.push(student)
        //     }
        // });
        $('#maininloading').hide()
        $('#main').show()   
    }catch(error){
        alert('반 원생 데이터 수집중 오류 발생');
        console.log(error)
    }
}

// 문의 관련 데이터를 가져오는 함수 입니다 
async function get_teacher_question() {
    try {
        const response = await $.ajax({
            type: "GET",
            url: "/teacher/get_questiondata",
            dataType: 'json',
            data: {},
        });
        TquestionAnswerdata = response.question
        TquestionAttachdata = response.attach
        TquestionAttachdata.forEach((attach) => {
            const question_id = attach.question_id
            if(TattachMap.has(question_id)) {
                const existingAttach = TattachMap.get(question_id);
                existingAttach.push({
                attach_id: attach.id,
                file_name: attach.file_name,
                is_answer: attach.is_answer
                });
            }else {
                TattachMap.set(question_id, [{
                attach_id: attach.id,
                file_name: attach.file_name,
                is_answer: attach.is_answer
                }]);
            }
        })
    } catch (error) {
        alert('Error occurred while retrieving data.');
    }
}
