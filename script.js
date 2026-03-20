const API_URL = "https://web-production-b5ec9.up.railway.app/api/latest";

async function fetchSensorData() {
  try {
    const response = await fetch(API_URL, {
      headers: {
        "ngrok-skip-browser-warning": "true"
      }
    });

    const data = await response.json();

    document.getElementById("temperature").textContent =
      data.temperature !== null ? `${data.temperature} °C` : "-- °C";

    document.getElementById("humidity").textContent =
      data.humidity !== null ? `${data.humidity} %` : "-- %";

    document.getElementById("motion").textContent =
      data.motion || "No motion data";

    document.getElementById("lightStatus").textContent =
      data.light_status || "No light data";

    document.getElementById("lightLevel").textContent =
      data.light_level !== null ? `Raw light value: ${data.light_level}` : "--";

    document.getElementById("device").textContent =
      data.device || "--";

    if (data.timestamp) {
      const date = new Date(data.timestamp);
      document.getElementById("timestamp").textContent = date.toLocaleString();
      document.getElementById("status").textContent = "Live room data received successfully";
    } else {
      document.getElementById("timestamp").textContent = "--";
      document.getElementById("status").textContent = "No sensor data yet";
    }
  } catch (error) {
    console.error("Error fetching sensor data:", error);
    document.getElementById("status").textContent = "Failed to connect to backend";
  }
}

fetchSensorData();
setInterval(fetchSensorData, 1000);