const soundBar = document.getElementById("soundBar");
const valueDisplay = document.getElementById("value");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const alarmSound = document.getElementById("alarmSound");
const emojiDisplay = document.getElementById("emoji");

let audioContext;
let analyser;
let microphone;
let isRunning = false;

// Historique des valeurs sonores (dernières 30s)
let soundHistory = [];
const HISTORY_DURATION = 30;
const FPS_APPROX = 60;
const MAX_HISTORY = HISTORY_DURATION * FPS_APPROX;

// --- DEMARRER ---
startButton.addEventListener("click", async () => {
    if (isRunning) return;

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    try {
        microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = audioContext.createMediaStreamSource(microphone);
        source.connect(analyser);
        isRunning = true;
        updateSoundLevel();
    } catch (err) {
        console.error("Erreur microphone :", err);
        alert("Impossible d'accéder au microphone.");
    }
});

// --- ARRETER ---
stopButton.addEventListener("click", () => {
    if (!isRunning) return;

    microphone.getTracks().forEach(track => track.stop());
    audioContext.close();
    isRunning = false;

    soundHistory = [];
    soundBar.style.width = "0%";
    valueDisplay.textContent = "0";
    emojiDisplay.textContent = "😊";
});

// --- CALCUL DU NIVEAU SONORE ---
function updateSoundLevel() {
    if (!isRunning) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];

    // Normalisation 0–50 dB
    let instantLevel = Math.round((sum / dataArray.length) / 5);
    instantLevel = Math.min(50, instantLevel);

    soundHistory.push(instantLevel);
    if (soundHistory.length > MAX_HISTORY) soundHistory.shift();

    const historyAverage =
        soundHistory.reduce((a, b) => a + b, 0) / soundHistory.length;

    const avgLevel = Math.round(historyAverage);

    // Mise à jour de l'affichage
    valueDisplay.textContent = avgLevel;
    soundBar.style.width = `${(avgLevel / 50) * 100}%`;

    // Couleur + emoji
    if (avgLevel < 15) {
        soundBar.style.background = "green";
        emojiDisplay.textContent = "😊";
    } else if (avgLevel < 30) {
        soundBar.style.background = "orange";
        emojiDisplay.textContent = "🤔";
    } else {
        soundBar.style.background = "red";
        emojiDisplay.textContent = "🤯";
        alarmSound.play();
    }

    requestAnimationFrame(updateSoundLevel);
}
