onmessage = async function() {
    try {
        const response = await fetch("/teacher/get_banstudents_data");
        const data = await response.json();
        postMessage(data);
    }catch (error) {
        console.log(error);
    }
}

