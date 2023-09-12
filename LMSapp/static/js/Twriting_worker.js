
async function fetchDataFromServer(ban_id) {
    try {
        const response = await fetch(`/teacher/get_purplewriting_data?ban_id=${ban_id}`);
        const data = await response.json();
      return data;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

onmessage = async function(event) {
    const { ban_id } = event.data;
    const data = await fetchDataFromServer(ban_id);
    postMessage(data);
  };
  
