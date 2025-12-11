// --- CALCUL DU NIVEAU SONORE ---
function updateSoundLevel() {
    if (!isRunning) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    // Niveau sonore instantané (amplifié pour + sensibilité)
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
    }

    // Amplification + légère compression
    let raw = sum / dataArray.length;

    // 🔥 AUGMENTATION DE SENSIBILITÉ : gain x3
    raw = raw * 3;

    // Compression douce pour éviter saturation trop rapide
    raw = Math.sqrt(raw) * 4.5;

    // Normalisation finale vers 0 → 50 dB
    let instantLevel = Math.round(raw);
    instantLevel = Math.min(50, instantLevel);

    // Ajout à l'historique
    soundHistory.push(instantLevel);
    if (soundHistory.length > MAX_HISTORY) soundHistory.shift();

    // Moyenne 10 secondes
    const average = soundHistory.reduce((a, b) => a + b, 0) / soundHistory.length;
    const avgLevel = Math.round(average);

    // Affichage
    valueDisplay.textContent = avgLevel;
    soundBar.style.width = `${(avgLevel / 50) * 100}%`;

    // Couleur + emoji + alarme
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
