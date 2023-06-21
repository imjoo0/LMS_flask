onmessage = async function() {
    try {
        const response = await fetch("/common/all_students");
        const data = await response.json();
        console.log(data)
        postMessage(data);
    }catch (error) {
        console.log(error);
    }
}

