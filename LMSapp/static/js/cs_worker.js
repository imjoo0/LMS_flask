onmessage = async function() {
    try {
        const response = await fetch("/manage/cs");
        const data = await response.json();
        postMessage(data);
    }catch (error) {
        console.log(error);
    }
}

