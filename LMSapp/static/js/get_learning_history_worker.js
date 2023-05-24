onmessage = async function() {
    try {
        const response = await fetch("/teacher/get_learning_history");
        const data = await response.json();
        postMessage(data);
    }catch (error) {
        console.log(error);
    }
}

