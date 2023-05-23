onmessage = async function() {
    try {
        const response = await fetch("/teacher/get_mystudents");
        const data = await response.json();
        postMessage(data);
    }catch (error) {
        console.log(error);
    }
}

