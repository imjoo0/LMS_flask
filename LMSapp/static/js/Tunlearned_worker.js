async function fetchDataFromServer(ban_id, startdate) {
    try {
        const response = await fetch(`/teacher/get_unlearned_data?ban_id=${ban_id}&startdate=${startdate}`);
        const data = await response.json();
      return data;
    } catch (error) {
      console.log(error);
      return null;
    }
}

onmessage = async function(event) {
    const { ban_id, startdate } = event.data;
    const data = await fetchDataFromServer(ban_id, startdate);
    postMessage(data);
};
  
// onmessage = async function() {
//   try {
//       const response = await fetch("/teacher/get_unlearned_data");
//       const data = await response.json();
//       postMessage(data);
//   }catch (error) {
//       console.log(error);
//   }
// }

