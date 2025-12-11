// ... ton code identique au-dessus

// Mise à jour du niveau sonore
function updateSoundLevel() {
    if (!isRunning) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    // --- CALCUL dB (0 → ~60 dB) ---
    let sumSquares = 0;
    for (let i = 0; i < dataArray.length; i++) {
        const val = dataArray[i] / 255;   // normalisation entre 0 et 1
        sumSquares += val * val;
    }

    // Niveau RMS
    const rms = Math.sqrt(sumSquares / dataArray.length);

    // Conversion en décibels (approx.)
    let instantDb = Math.round(20 * Math.log10(rms));

    // Normalisation sur une plage 0 → 60 dB
    if (isNaN(instantDb)) instantDb = 0;
    instantDb = Math.max(0, Math.min(60, instantDb + 60));  
    // +60 pour que le bruit faible ne soit pas négatif

    // Ajout à l'historique
    soundHistory.push(instantDb);

    if (soundHistory.length > MAX_HISTORY) soundHistory.shift();

    // Moyenne 30s
    const avgDb = Math.round(
        soundHistory.reduce((a, b) => a + b, 0) / soundHistory.length
    );

    // Mise à jour visuelle
    valueDisplay.textContent = avgDb;
    soundBar.style.width = `${(avgDb / 60) * 100}%`;

    // Emoji + couleur
    if (avgDb < 30) {
        soundBar.style.background = "green";
        emojiDisplay.textContent = "😊";
    } else if (avgDb < 45) {
        soundBar.style.background = "orange";
        emojiDisplay.textContent = "🤔";
    } else {
        soundBar.style.background = "red";
        emojiDisplay.textContent = "🤯";
        alarmSound.play();
    }

    requestAnimationFrame(updateSoundLevel);
}
