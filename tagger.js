const songFolder = 'songs/';
let songList = [];
const tags = {};
let currentTrack = '';

const moodOptionsList = ['Happy', 'Sad', 'Chill', 'Aggressive', 'Weird AF', 'Trippy'];
const keyOptionsList = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const bpmOptionsList = [60, 70, 80, 90, 100, 110, 120, 140];

const audioPicker = document.getElementById('audioPicker');
const audioPlayer = document.getElementById('audioPlayer');
const saveBtn = document.getElementById('saveBtn');
const exportBtn = document.getElementById('exportBtn');
const jsonPreview = document.getElementById('jsonPreview');
const notesInput = document.getElementById('notes');

// These hold the user's current selections
let selectedBPM = '';
let selectedKey = '';
let selectedMood = '';

function createTagButtons(containerId, options, type) {
  const container = document.getElementById(containerId);
  options.forEach(option => {
    const btn = document.createElement('button');
    btn.textContent = option;
    btn.className = 'px-3 py-1 rounded bg-gray-700 hover:bg-gray-600';
    btn.addEventListener('click', () => {
      // Unselect others
      Array.from(container.children).forEach(child => {
        child.classList.remove('bg-blue-500');
        child.classList.add('bg-gray-700');
      });
      btn.classList.add('bg-blue-500');
      btn.classList.remove('bg-gray-700');
      if (type === 'bpm') selectedBPM = option;
      if (type === 'key') selectedKey = option;
      if (type === 'mood') selectedMood = option;
    });
    container.appendChild(btn);
  });
}

function setTagButton(containerId, value) {
  const container = document.getElementById(containerId);
  Array.from(container.children).forEach(btn => {
    if (btn.textContent === value) {
      btn.click();
    }
  });
}

fetch('songs.json')
  .then(res => res.json())
  .then(data => {
    songList = data;
    populateDropdown();
    loadInitialTrack();
    // Create tag buttons
    createTagButtons('bpmOptions', bpmOptionsList, 'bpm');
    createTagButtons('keyOptions', keyOptionsList, 'key');
    createTagButtons('moodOptions', moodOptionsList, 'mood');
  })
  .catch(err => {
    console.error('Could not load songs.json:', err);
    alert('Could not load songs.json!');
  });

function populateDropdown() {
  audioPicker.innerHTML = '';
  songList.forEach(file => {
    const option = document.createElement('option');
    option.value = file;
    option.textContent = file;
    audioPicker.appendChild(option);
  });
}

function loadInitialTrack() {
  if (songList.length > 0) {
    currentTrack = songList[0];
    audioPicker.value = currentTrack;
    audioPlayer.src = `${songFolder}${currentTrack}`;
    loadTags(currentTrack);
  }
}

audioPicker.addEventListener('change', () => {
  currentTrack = audioPicker.value;
  audioPlayer.src = `${songFolder}${currentTrack}`;
  loadTags(currentTrack);
});

function loadTags(file) {
  const data = tags[file] || {};
  selectedBPM = data.bpm || '';
  selectedKey = data.key || '';
  selectedMood = data.mood || '';
  notesInput.value = data.notes || '';

  setTagButton('bpmOptions', selectedBPM);
  setTagButton('keyOptions', selectedKey);
  setTagButton('moodOptions', selectedMood);
}

saveBtn.addEventListener('click', () => {
  if (!currentTrack) return alert('No track selected!');
  tags[currentTrack] = {
    bpm: selectedBPM,
    key: selectedKey,
    mood: selectedMood,
    notes: notesInput.value.trim(),
  };
  updateJSONPreview();
  alert(`Saved tags for ${currentTrack}`);
});

exportBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(tags, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'song-tags.json';
  a.click();
  URL.revokeObjectURL(url);
});

function updateJSONPreview() {
  jsonPreview.textContent = JSON.stringify(tags, null, 2);
}
const detectBtn = document.getElementById('detectBPM');

detectBtn.addEventListener('click', () => {
  if (!currentTrack) return alert('No track selected!');

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  fetch(`${songFolder}${currentTrack}`)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
    .then(audioBuffer => {
      const rawData = audioBuffer.getChannelData(0); // left channel
      const sampleRate = audioBuffer.sampleRate;
      const peaks = [];

      // Basic peak detection
     for (let i = 0; i < rawData.length; i += 500) {
  const sample = Math.abs(rawData[i]);
  if (sample > 0.4) {
    // Don't add duplicate or close-by peaks
    if (peaks.length === 0 || (i - peaks[peaks.length - 1]) > 10000) {
      peaks.push(i);
    }
  }
}

      if (peaks.length < 2) {
        alert('Not enough peaks found for BPM detection.');
        return;
      }

      const intervals = [];
      for (let i = 1; i < peaks.length; i++) {
        intervals.push((peaks[i] - peaks[i - 1]) / sampleRate);
      }

      const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      let bpmEstimate = Math.round(60 / averageInterval);

      // Normalize to common range
      while (bpmEstimate > 180) bpmEstimate /= 2;
      while (bpmEstimate < 60) bpmEstimate *= 2;
      bpmEstimate = Math.round(bpmEstimate);

      // Snap to closest bpm option
      const closest = bpmOptionsList.reduce((prev, curr) =>
        Math.abs(curr - bpmEstimate) < Math.abs(prev - bpmEstimate) ? curr : prev
      );

      alert(`Detected BPM: ~${bpmEstimate} (Snapped to ${closest})`);
      setTagButton('bpmOptions', closest);
    })
    .catch(err => {
      console.error('BPM detection failed:', err);
      alert('Failed to detect BPM.');
    });
});
const detectKeyBtn = document.getElementById('detectKey');

detectKeyBtn.addEventListener('click', async () => {
  if (!currentTrack) return alert('No track selected!');

  try {
    console.log('Loading Essentia...');
    const essentia = await EssentiaWASM();
    console.log('Essentia loaded');

    const url = `${songFolder}${currentTrack}`;
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const pcm = audioBuffer.getChannelData(0);

    console.log('Running KeyDetector...');
    const result = essentia.KeyDetector(pcm, audioCtx.sampleRate);
    console.log('Result:', result);

    const key = result.key;
    const scale = result.scale;
    alert(`Detected key: ${key} ${scale}`);
    setTagButton('keyOptions', key);
  } catch (err) {
    console.error('Key detection failed:', err);
    alert('Key detection failed.');
  }
});
