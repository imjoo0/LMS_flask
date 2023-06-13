// consulting_worker.js

// Function to fetch data from the server
async function fetchDataFromServer(b_id, ban_id_history) {
  try {
    const response = await fetch(`/common/consulting_chunk_by_ban?b_id=${b_id}&ban_id_history=${ban_id_history}`);
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.log(error);
    return null;
  }
}

// Event listener to handle incoming messages from the client
onmessage = async function(event) {
  const { b_id, ban_id_history } = event.data;
  const data = await fetchDataFromServer(b_id, ban_id_history);
  postMessage(data);
};

