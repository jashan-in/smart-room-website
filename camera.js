const CAMERA_BASE_URL = "https://isogonally-optical-katharine.ngrok-free.dev";

function startStream() {
  const password = document.getElementById("cameraPassword").value;
  const status = document.getElementById("cameraStatus");
  const stream = document.getElementById("cameraStream");

  if (!password) {
    status.textContent = "Please enter the camera password.";
    return;
  }

  status.textContent = "Starting live stream...";
  stream.src = `${CAMERA_BASE_URL}/api/camera/stream?password=${encodeURIComponent(password)}&t=${Date.now()}`;
  stream.style.display = "block";
}

function stopStream() {
  const status = document.getElementById("cameraStatus");
  const stream = document.getElementById("cameraStream");

  stream.src = "";
  stream.style.display = "none";
  status.textContent = "Stream stopped.";
}