async function fetchDataFromServer(pageSize, b_id) {
    try {
      const response = await fetch(`/common/task_chunk_by_ban?&page_size=${pageSize}&b_id=${b_id}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  
  // Event listener to handle incoming messages from the client
  onmessage = async function (event) {
    const { pageSize, b_id } = event.data;
    const data = await fetchDataFromServer(pageSize, b_id);
    postMessage(data);
  };
  