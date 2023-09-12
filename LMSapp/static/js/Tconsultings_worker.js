async function fetchDataFromServer(done_count) {
    try {
        const response = await fetch(`/teacher/get_teacherconsultinghistory/${done_count}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.log(error);
        return null;
    }
  }

onmessage = async function(event) {
    const { done_count } = event.data;
    const data = await fetchDataFromServer(done_count);
    postMessage(data);
  };
  
