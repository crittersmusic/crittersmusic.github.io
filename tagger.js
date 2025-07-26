// tagger.js

const songFolder = 'songs/';
const songList = [
  // Manually list your songs for now, or auto-generate this in future
  'song1.mp3',
  'song2.mp3',
  'song3.wav',
  // Add all 300+ here or generate this list from your file system using Node or a build script
];

const tags = {};
let currentTrack = '';

const audioPicker = document.getElementById('audioPicker');
const audioPlayer = document.getElementById('audioPlayer');
const bpmInput = document.getElementById('bpm');
const keyInput = document.getElementById('key');
const moodInput = document.getElementById('mood');
const notesInput = document.getElementById('notes');
const saveBtn = document.getElementById('saveBtn');
const exportBtn = document.getElementById('exportBtn');
const jsonPreview = document.getElementById('jsonPreview');

// Populate dropdown
songList.forEach(file => {
  const option = document.createElement('option');
  option.value = file;
  option.textContent = file;
  audioPicker.appendChild(option);
});

// Load selected song
audioPicker.addEventListener('change', () => {
  const file = audioPicker.value;
  currentTrack = file;
  audioPlayer.src = `${songFolder}${file}`;
  loadTags(file);
});

// Load existing tags into form if they exist
function loadTags(file) {
  if (tags[file]) {
    bpmInput.value = tags[file].bpm || '';
    keyInput.value = tags[file].key || '';
    moodInput.value = tags[file].mood || '';
    notesInput.value = tags[file].notes || '';
  } else {
    bpmInput.value = '';
    keyInput.value = '';
    moodInput.value = '';
    notesInput.value = '';
  }
}

// Save tags for current song
saveBtn.addEventListener('click', () => {
  if (!currentTrack) return alert('Select a song first!');
  tags[currentTrack] = {
    bpm: bpmInput.value.trim(),
    key: keyInput.value.trim(),
    mood: moodInput.value.trim(),
    notes: notesInput.value.trim()
  };
  updateJSONPreview();
  alert(`Saved tags for ${currentTrack}`);
});

// Export tags as a JSON file
exportBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(tags, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'song-tags.json';
  a.click();
  URL.revokeObjectURL(url);
});

// Show live preview
function updateJSONPreview() {
  jsonPreview.textContent = JSON.stringify(tags, null, 2);
}

// Auto-load the first song on page load
window.addEventListener('load', () => {
  if (songList.length > 0) {
    audioPicker.value = songList[0];
    currentTrack = songList[0];
    audioPlayer.src = `${songFolder}${songList[0]}`;
    loadTags(songList[0]);
  }
});
