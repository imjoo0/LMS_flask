// consulting_worker.js

// Function to fetch data from the server
async function fetchDataFromServer(page, pageSize) {
    try {
      const response = await fetch(`/common/consulting_created?page=${page}&page_size=${pageSize}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  
  // Event listener to handle incoming messages from the client
  onmessage = async function(event) {
    const { page, pageSize } = event.data;
    const data = await fetchDataFromServer(page, pageSize);
    postMessage(data);
  };
  
