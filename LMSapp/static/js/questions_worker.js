// questions_worker.js

// Function to fetch data from the server
async function fetchDataFromServer(page, pageSize, q_type) {
    try {
      const response = await fetch(`/manage/get_questiondata?page=${page}&page_size=${pageSize}&q_type=${q_type}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  
  // Event listener to handle incoming messages from the client
  onmessage = async function(event) {
    const { page, pageSize, q_type } = event.data;
    const data = await fetchDataFromServer(page, pageSize, q_type);
    postMessage(data);
  };
  
