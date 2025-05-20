
let currentPreset = [];
let currentSignalIndex = 0;
let studyStartTime = null;
let results = [];

// Hardcoded presets
const PRESETS = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15]
];

// DOM Elements
const setupScreen = document.getElementById('setup-screen');
const studyScreen = document.getElementById('study-screen');
const completionScreen = document.getElementById('completion-screen');
const presetSelect = document.getElementById('preset-select');
const presetPreview = document.getElementById('preset-preview');
const previewText = document.getElementById('preview-text');
const startButton = document.getElementById('start-button');
const progressFill = document.getElementById('progress-fill');
const currentSignalElement = document.getElementById('current-signal');
const nextButton = document.getElementById('next-button');

// Load presets
function loadPresets() {
    PRESETS.forEach((preset, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `Preset ${index + 1}`;
        presetSelect.appendChild(option);
    });
}

// Load descriptions for a signal
async function loadDescriptions(signalId) {
    try {
        const response = await fetch(`/descriptions/${signalId}.json`);
        if (!response.ok) {
            throw new Error(`Description file not found for signal ${signalId}`);
        }
        const descriptions = await response.json();
        return descriptions;
    } catch (error) {
        console.error(`Error loading descriptions for signal ${signalId}:`, error);
        return null;
    }
}

// Create rating slider
function createRatingSlider(description, type) {
    const container = document.createElement('div');
    container.className = 'description-item';
    
    const text = document.createElement('p');
    text.textContent = description;
    container.appendChild(text);
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '10';
    slider.value = '5';
    slider.className = 'rating-slider';
    
    const value = document.createElement('div');
    value.className = 'rating-value';
    value.textContent = '5';
    
    slider.addEventListener('input', (e) => {
        value.textContent = e.target.value;
    });
    
    container.appendChild(slider);
    container.appendChild(value);
    
    return container;
}

// Display current signal
async function displayCurrentSignal() {
    const signalId = currentPreset[currentSignalIndex];
    currentSignalElement.textContent = signalId;
    const signalStatus = document.getElementById('signal-status');
    // Fetch and send WAV file
    (async () => {
        const { load_and_send_pcm } =  await import('./Websocket/load_and_send_pcm.js');
        console.log("Loading PCM");
        const url = `signals/${signalId}.wav`;
        const response = await fetch(url);
        signalStatus.innerHTML = "Loading signal ..."
        if (!response.ok) {
            signalStatus.innerHTML = "Could not load signal"
            console.error(`Failed to fetch ${url}: ${response.statusText}`);
            return;
        }
    
        const blob = await response.blob();
        const file = new File([blob], `${signalId}.wav`, { type: blob.type });
    
        try {
            await load_and_send_pcm(file);
            signalStatus.innerHTML = "Signal loaded"
        } catch (err) {
            console.error(`Failed to load PCM from ${file.name}:`, err);
            signalStatus.innerHTML = "Could not load signal"
        }
    })();
    
    const descriptions = await loadDescriptions(signalId);
    
    // Clear previous descriptions
    document.getElementById('sensory-descriptions').innerHTML = '';
    document.getElementById('emotional-descriptions').innerHTML = '';
    document.getElementById('associative-descriptions').innerHTML = '';
    
    if (!descriptions) {
        const noDescMessage = document.createElement('p');
        noDescMessage.textContent = 'No descriptions found';
        noDescMessage.style.textAlign = 'center';
        noDescMessage.style.color = '#666';
        document.getElementById('sensory-descriptions').appendChild(noDescMessage);
        return;
    }
    
    // Add new descriptions
    descriptions.sensoryDescriptions.forEach(desc => {
        document.getElementById('sensory-descriptions').appendChild(
            createRatingSlider(desc, 'sensory')
        );
    });
    
    descriptions.emotionalDescriptions.forEach(desc => {
        document.getElementById('emotional-descriptions').appendChild(
            createRatingSlider(desc, 'emotional')
        );
    });
    
    descriptions.associativeDescriptions.forEach(desc => {
        document.getElementById('associative-descriptions').appendChild(
            createRatingSlider(desc, 'associative')
        );
    });
    
    // Update progress
    const progress = ((currentSignalIndex + 1) / currentPreset.length) * 100;
    progressFill.style.width = `${progress}%`;
}

// Collect ratings for current signal
function collectRatings() {
    const signalId = currentPreset[currentSignalIndex];
    const ratings = {
        signalId,
        timestamp: new Date().toISOString(),
        sensory: [],
        emotional: [],
        associative: []
    };
    
    // Collect sensory ratings
    document.querySelectorAll('#sensory-descriptions .description-item').forEach(item => {
        ratings.sensory.push({
            description: item.querySelector('p').textContent,
            rating: parseInt(item.querySelector('.rating-slider').value)
        });
    });
    
    // Collect emotional ratings
    document.querySelectorAll('#emotional-descriptions .description-item').forEach(item => {
        ratings.emotional.push({
            description: item.querySelector('p').textContent,
            rating: parseInt(item.querySelector('.rating-slider').value)
        });
    });
    
    // Collect associative ratings
    document.querySelectorAll('#associative-descriptions .description-item').forEach(item => {
        ratings.associative.push({
            description: item.querySelector('p').textContent,
            rating: parseInt(item.querySelector('.rating-slider').value)
        });
    });
    
    return ratings;
}

// Save results to file
function saveResults() {
    const resultsData = {
        startTime: studyStartTime,
        endTime: new Date().toISOString(),
        preset: currentPreset,
        results: results
    };
    
    const blob = new Blob([JSON.stringify(resultsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study_results_${studyStartTime.replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Event Listeners
presetSelect.addEventListener('change', (e) => {
    const presetIndex = parseInt(e.target.value);
    if (presetIndex >= 0) {
        currentPreset = PRESETS[presetIndex];
        previewText.textContent = `Signals: ${currentPreset.join(', ')}`;
        presetPreview.classList.remove('hidden');
        startButton.disabled = false;
    } else {
        presetPreview.classList.add('hidden');
        startButton.disabled = true;
    }
});

startButton.addEventListener('click', () => {
    studyStartTime = new Date().toISOString();
    setupScreen.classList.add('hidden');
    studyScreen.classList.remove('hidden');
    currentSignalIndex = 0;
    results = [];
    displayCurrentSignal();
});

nextButton.addEventListener('click', () => {
    results.push(collectRatings());
    currentSignalIndex++;
    
    if (currentSignalIndex < currentPreset.length) {
        displayCurrentSignal();
    } else {
        studyScreen.classList.add('hidden');
        completionScreen.classList.remove('hidden');
        saveResults();
    }
});

// Initialize
loadPresets(); 