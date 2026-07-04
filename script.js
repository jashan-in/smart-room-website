const API_BASE = 'https://web-production-b5ec9.up.railway.app';
const POLL_INTERVAL = 3000;
const MAX_HISTORY = 20;
const ESP32_OFFLINE_AFTER_SECONDS = 15;

let ledState = false;
let ledTogglePending = false;

let servoState = false;
let servoTogglePending = false;

let history = { labels: [], temp: [], humid: [], light: [] };
let chart = null;

function initChart() {
  const ctx = document.getElementById('historyChart').getContext('2d');

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Temp (°C)',
          data: [],
          borderColor: '#e07a3a',
          backgroundColor: 'rgba(224,122,58,0.06)',
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Humidity (%)',
          data: [],
          borderColor: '#4ea8d2',
          backgroundColor: 'rgba(78,168,210,0.06)',
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: {
            color: '#555',
            font: { family: 'Space Mono', size: 9 },
            boxWidth: 12,
            padding: 16,
          },
        },
      },
      scales: {
        x: {
          grid: { color: '#1c1c1c' },
          ticks: {
            color: '#555',
            font: { family: 'Space Mono', size: 8 },
            maxTicksLimit: 6,
            maxRotation: 0,
          },
        },
        y: {
          grid: { color: '#1c1c1c' },
          ticks: {
            color: '#555',
            font: { family: 'Space Mono', size: 8 },
          },
        },
      },
    },
  });
}

function pushHistory(label, temp, humid, light) {
  history.labels.push(label);
  history.temp.push(temp);
  history.humid.push(humid);
  history.light.push(light);

  if (history.labels.length > MAX_HISTORY) {
    history.labels.shift();
    history.temp.shift();
    history.humid.shift();
    history.light.shift();
  }

  chart.data.labels = history.labels;
  chart.data.datasets[0].data = history.temp;
  chart.data.datasets[1].data = history.humid;
  chart.update('none');
}

function setBar(id, pct) {
  document.getElementById(id).style.width =
    Math.min(100, Math.max(0, pct)) + '%';
}

function setLEDUI(isOn) {
  ledState = isOn;

  const orb = document.getElementById('ledOrb');
  const statusText = document.getElementById('ledStatusText');
  const btnLabel = document.getElementById('ledBtnLabel');
  const btn = document.getElementById('ledToggleBtn');

  orb.classList.toggle('on', isOn);
  statusText.textContent = isOn ? 'ON' : 'OFF';
  statusText.classList.toggle('on', isOn);
  btnLabel.textContent = isOn ? 'TURN OFF' : 'TURN ON';
  btn.classList.toggle('led-on-state', isOn);
}

function setServoUI(isOpen) {
  servoState = isOpen;

  const statusText = document.getElementById('servoStatusText');
  const btnLabel = document.getElementById('servoBtnLabel');
  const btn = document.getElementById('servoToggleBtn');

  statusText.textContent = isOpen ? 'OPEN' : 'CLOSED';
  statusText.classList.toggle('on', isOpen);
  btnLabel.textContent = isOpen ? 'CLOSE' : 'OPEN';
  btn.classList.toggle('led-on-state', isOpen);
}

function setFeedback(msg, type = '') {
  const el = document.getElementById('ledFeedback');
  el.textContent = msg;
  el.className = 'led-feedback ' + type;
}

function setServoFeedback(msg, type = '') {
  const el = document.getElementById('servoFeedback');
  el.textContent = msg;
  el.className = 'led-feedback ' + type;
}

function formatTime(isoStr) {
  if (!isoStr) return '—';

  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoStr;
  }
}

function getAgeSeconds(isoStr) {
  if (!isoStr) return Infinity;

  const lastSeen = new Date(isoStr).getTime();

  if (Number.isNaN(lastSeen)) return Infinity;

  return (Date.now() - lastSeen) / 1000;
}

function setOnline(online) {
  const dot = document.getElementById('statusDot');
  const chip = document.getElementById('deviceStatus');

  dot.classList.toggle('online', online);
  chip.classList.toggle('online', online);
  chip.textContent = online ? 'ONLINE' : 'OFFLINE';
}

async function fetchSensorData() {
  try {
    const res = await fetch(`${API_BASE}/api/latest`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    const temp = parseFloat(data.temperature);
    const humid = parseFloat(data.humidity);
    const light = parseInt(data.light_level, 10);
    const motion =
      data.motion === true || data.motion === 'true' || data.motion === 1;

    const ts = data.timestamp || '';
    const timeLabel = formatTime(ts);
    const ageSeconds = getAgeSeconds(ts);
    const espOnline = ageSeconds <= ESP32_OFFLINE_AFTER_SECONDS;

    document.getElementById('tempValue').textContent = isNaN(temp)
      ? '—'
      : temp.toFixed(1);

    document.getElementById('humidValue').textContent = isNaN(humid)
      ? '—'
      : humid.toFixed(1);

    document.getElementById('lightValue').textContent = isNaN(light)
      ? '—'
      : light;

    setBar('tempBar', isNaN(temp) ? 0 : (temp / 50) * 100);
    setBar('humidBar', isNaN(humid) ? 0 : humid);
    setBar('lightBar', isNaN(light) ? 0 : (light / 4095) * 100);

    ['cardTemp', 'cardHumid', 'cardLight'].forEach((id) => {
      document.getElementById(id).classList.add('active');
    });

    const motionEl = document.getElementById('motionIndicator');
    const motionText = document.getElementById('motionText');

    motionEl.classList.toggle('detected', motion && espOnline);
    motionText.textContent = motion && espOnline ? 'DETECTED' : 'CLEAR';

    document.getElementById('lastUpdate').textContent = timeLabel;
    document.getElementById('lastUpdate').title = ts;

    if (espOnline && !isNaN(temp) && !isNaN(humid) && !isNaN(light)) {
      pushHistory(timeLabel, temp, humid, light);
    }

    if (data.led_state !== undefined) {
      const backendLED =
        data.led_state === true ||
        data.led_state === 'on' ||
        data.led_state === 1;

      if (!ledTogglePending) setLEDUI(backendLED);
    }

    if (data.servo_state !== undefined) {
      const backendServoOpen = data.servo_state === 'open';

      if (!servoTogglePending) setServoUI(backendServoOpen);
    }

    setOnline(espOnline);

    document.getElementById('fetchStatus').textContent = espOnline
      ? `ESP32 online · Last sync: ${timeLabel}`
      : `ESP32 offline · Last seen: ${timeLabel}`;
  } catch (err) {
    setOnline(false);
    document.getElementById('fetchStatus').textContent = `Backend error: ${err.message}`;
    console.warn('Fetch error:', err);
  }
}

async function toggleLED() {
  if (ledTogglePending) return;

  ledTogglePending = true;

  const btn = document.getElementById('ledToggleBtn');
  btn.classList.add('loading');
  setFeedback('Sending command…');

  const newState = !ledState;

  try {
    const res = await fetch(`${API_BASE}/api/led`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: newState ? 'on' : 'off' }),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) throw new Error(`Server returned ${res.status}`);

    const data = await res.json();

    const confirmed =
      data.led_state === 'on' ||
      data.led_state === true ||
      data.led_state === 1;

    setLEDUI(confirmed);
    setFeedback('Command sent · ESP32 will sync shortly', 'success');

    setTimeout(() => setFeedback(''), 4000);
  } catch (err) {
    setFeedback(`Failed: ${err.message}`, 'error');
    setTimeout(() => setFeedback(''), 5000);
  } finally {
    ledTogglePending = false;
    btn.classList.remove('loading');
  }
}

async function toggleServo() {
  if (servoTogglePending) return;

  servoTogglePending = true;

  const btn = document.getElementById('servoToggleBtn');
  btn.classList.add('loading');
  setServoFeedback('Sending command…');

  const newState = !servoState;

  try {
    const res = await fetch(`${API_BASE}/api/servo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: newState ? 'open' : 'closed' }),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) throw new Error(`Server returned ${res.status}`);

    const data = await res.json();

    const confirmed = data.servo_state === 'open';

    setServoUI(confirmed);
    setServoFeedback('Command sent · ESP32 will sync shortly', 'success');

    setTimeout(() => setServoFeedback(''), 4000);
  } catch (err) {
    setServoFeedback(`Failed: ${err.message}`, 'error');
    setTimeout(() => setServoFeedback(''), 5000);
  } finally {
    servoTogglePending = false;
    btn.classList.remove('loading');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initChart();
  fetchSensorData();
  setInterval(fetchSensorData, POLL_INTERVAL);
});