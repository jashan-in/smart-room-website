const CAMERA_BASE_URL = "https://isogonally-optical-katharine.ngrok-free.dev";

async function captureImage() {
  const password = document.getElementById("cameraPassword").value;
  const status = document.getElementById("cameraStatus");
  const image = document.getElementById("cameraImage");

  if (!password) {
    status.textContent = "Please enter the camera password.";
    return;
  }

  status.textContent = "Capturing image...";

  try {
    const response = await fetch(
      `${CAMERA_BASE_URL}/api/camera/capture?password=${encodeURIComponent(password)}`,
      {
        headers: {
          "ngrok-skip-browser-warning": "true"
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      status.textContent = data.error || "Failed to capture image.";
      return;
    }

    status.textContent = "Snapshot captured successfully.";
    image.src = `${CAMERA_BASE_URL}/api/camera/latest?password=${encodeURIComponent(password)}&t=${Date.now()}`;
    image.style.display = "block";
  } catch (error) {
    console.error(error);
    status.textContent = "Error connecting to camera backend.";
  }
}

function loadLatestImage() {
  const password = document.getElementById("cameraPassword").value;
  const status = document.getElementById("cameraStatus");
  const image = document.getElementById("cameraImage");

  if (!password) {
    status.textContent = "Please enter the camera password.";
    return;
  }

  image.src = `${CAMERA_BASE_URL}/api/camera/latest?password=${encodeURIComponent(password)}&t=${Date.now()}`;
  image.style.display = "block";
  status.textContent = "Loaded latest image.";
}