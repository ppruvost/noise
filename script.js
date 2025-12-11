const soundBar = document.getElementById("soundBar");
const valueDisplay = document.getElementById("value");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const alarmSound = document.getElementById("alarmSound");

let audioContext;
let analyser;
let microphone;
let isRunning = false;
let calibrationFactor = 0.6;

// Historique pour la moyenne 30s
const soundLevels = [];
const AVERAGE_WINDOW_SECONDS = 30;
const MAX_HISTORY_MS = AVERAGE_WINDOW_SECONDS * 1000;

// Fonction pour récupérer les périphériques audio
async function getAudioDeviceId() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter(d => d.kind === "audioinput");

    if (audioInputs.length === 0) {
        alert("Aucun microphone détecté.");
        return null;
    }

    // Priorité : microphone USB
    const usbMic = audioInputs.find(d =>
        /usb|uac|external|mic/i.test(d.label)
    );

    return usbMic ? usbMic.deviceId : audioInputs[0].deviceId;
}

// Fonction pour démarrer
startButton.addEventListener("click", async () => {
    if (isRunning) return;

    try {
        const deviceId = await getAudioDeviceId();
        if (!deviceId) return;

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: { exact: deviceId },
                noiseSuppression: false,
                echoCancellation: false,
                autoGainControl: false
            }
        });

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;

        microphone = stream;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        isRunning = true;
        updateSoundLevel();
    } catch (err) {
        console.error("Erreur microphone :", err);
        alert("Impossible d'accéder au microphone USB.");
    }
});

// Fonction pour arrêter
stopButton.addEventListener("click", () => {
    if (!isRunning) return;

    microphone.getTracks().forEach(track => track.stop());
    audioContext.close();
    isRunning = false;

    soundBar.style.width = "0%";
    valueDisplay.textContent = "0 dB";
    soundLevels.length = 0;
});

// Fonction de mise à jour en continu
function updateSoundLevel() {
    if (!isRunning) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    const sum = dataArray.reduce((a, b) => a + b, 0);
    const averageInstant = sum / dataArray.length;
    const soundLevelInstant = Math.min(60, Math.round(averageInstant * calibrationFactor));

    const now = Date.now();
    soundLevels.push({ level: soundLevelInstant, timestamp: now });

    // Nettoyage ancien historique
    const oldestAllowed = now - MAX_HISTORY_MS;
    const filteredLevels = soundLevels.filter(entry => entry.timestamp >= oldestAllowed);

    let average30s = 0;
    if (filteredLevels.length > 0) {
        const sum30s = filteredLevels.reduce((acc, entry) => acc + entry.level, 0);
        average30s = Math.round(sum30s / filteredLevels.length);
    }

    // Affichage
    valueDisplay.textContent = `${average30s} dB (moyenne 30s)`;
    soundBar.style.width = `${(average30s / 60) * 100}%`;

    if (average30s < 40) {
        soundBar.style.background = "green";
    } else if (average30s < 55) {
        soundBar.style.background = "orange";
    } else {
        soundBar.style.background = "red";
        alarmSound.play();
    }

    requestAnimationFrame(updateSoundLevel);
}
