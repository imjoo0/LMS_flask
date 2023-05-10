onmessage = async function() {
    try {
        const response = await fetch("/common/consulting");
        const data = await response.json();
        postMessage(data);
    }catch (error) {
        console.log(error);
    }
}
