// consulting_worker.js

// Function to fetch data from the server
async function fetchDataFromServer(pageSize, t_id) {
  try {
    const response = await fetch(`/common/consulting_chunk_by_teacher?&page_size=${pageSize}&t_id=${t_id}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.log(error);
    return null;
  }
}

// Event listener to handle incoming messages from the client
onmessage = async function (event) {
  const { pageSize, t_id } = event.data;
  const data = await fetchDataFromServer(pageSize, t_id);
  postMessage(data);
};
