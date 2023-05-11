// In combined_worker.js
onmessage = async function () {
    try {
      const consultingResponse = await fetch("/common/consulting");
      const consultingData = await consultingResponse.json();
  
      const studentsResponse = await fetch("/common/all_students");
      const studentsData = await studentsResponse.json();
  
      // Combine the data based on student_id
      const combinedData = combineDataByStudentID(consultingData, studentsData);
  
      postMessage(combinedData);
    } catch (error) {
      console.log(error);
    }
}
  
function combineDataByStudentID(consultingData, studentsData) {
const combinedData = [];

for (const consulting of consultingData) {
    const studentID = consulting.student_id;
    const student = studentsData.find((student) => student.student_id === studentID);

    if (student) {
    const combinedObject = { ...consulting, ...student };
    combinedData.push(combinedObject);
    }
}

return combinedData;
}
  