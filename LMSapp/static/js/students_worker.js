onmessage = async function() {
    try {
        const response = await fetch("/teacher/get_teacher_data");
        const data = await response.json();
        postMessage(data);
    }catch (error) {
        console.log(error);
    }
}

