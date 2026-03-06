async function testBackend() {
    console.log("Testing MediBot API...");
    try {
        const response = await fetch("http://localhost:5000/api/medibot/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: "Hello"
            })
        });

        if (!response.ok) {
            console.error("❌ FAILED:", response.status, response.statusText);
            const text = await response.text();
            console.error("Response Body:", text);
        } else {
            const data = await response.json();
            console.log("✅ SUCCESS:", data);
        }

    } catch (error) {
        console.error("❌ Network Error:", error);
    }
}

testBackend();
