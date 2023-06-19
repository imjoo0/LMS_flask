async function fetchDataFromServer(t_id, teacher_id_history) {
    try {
      const response = await fetch(`/common/task_chunk_by_teacher?&t_id=${t_id}&teacher_id_history=${teacher_id_history}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  
  // Event listener to handle incoming messages from the client
  onmessage = async function (event) {
    const { t_id, teacher_id_history } = event.data;
    const data = await fetchDataFromServer(t_id, teacher_id_history);
    postMessage(data);
  };
  