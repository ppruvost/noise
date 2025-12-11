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

// Historique des valeurs sonores (moyenne sur 10 secondes)
let soundHistory = [];
const HISTORY_DURATION = 10; // 10s
const FPS_APPROX = 40;       // ~40 mesures par seconde
const MAX_HISTORY = HISTORY_DURATION * FPS_APPROX;

// --- DÉMARRER ---
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

// --- ARRÊTER ---
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

    // Niveau sonore instantané (approximation)
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
    }

    // Normalisation pour une échelle 0 → 40 dB
    // (calibration simple basée sur amplitude moyenne)
    let instantLevel = Math.round((sum / dataArray.length) / 6);
    instantLevel = Math.min(40, instantLevel);

    // Ajout à l'historique
    soundHistory.push(instantLevel);
    if (soundHistory.length > MAX_HISTORY) soundHistory.shift();

    // Calcul de la moyenne sur 10 secondes
    const average =
        soundHistory.reduce((a, b) => a + b, 0) / soundHistory.length;

    const avgLevel = Math.round(average);

    // Mise à jour de l'affichage
    valueDisplay.textContent = avgLevel;
    soundBar.style.width = `${(avgLevel / 40) * 100}%`;

    // Couleur + emoji
    if (avgLevel < 12) {
        soundBar.style.background = "green";
        emojiDisplay.textContent = "😊";
    } else if (avgLevel < 25) {
        soundBar.style.background = "orange";
        emojiDisplay.textContent = "🤔";
    } else {
        soundBar.style.background = "red";
        emojiDisplay.textContent = "🤯";
        alarmSound.play();
    }

    requestAnimationFrame(updateSoundLevel);
}
