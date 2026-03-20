const API_URL = "http://omw/api/latest";

async function fetchSensorData() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    document.getElementById("temperature").textContent =
      data.temperature !== null ? `${data.temperature} °C` : "-- °C";

    document.getElementById("humidity").textContent =
      data.humidity !== null ? `${data.humidity} %` : "-- %";

    document.getElementById("device").textContent =
      data.device || "--";

    if (data.timestamp) {
      const date = new Date(data.timestamp);
      document.getElementById("timestamp").textContent = date.toLocaleString();
      document.getElementById("status").textContent = "Live data received successfully";
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
setInterval(fetchSensorData, 5000);