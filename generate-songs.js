// tagger.js

const songFolder = 'songs/';
let songList = [];
const tags = {};
let currentTrack = '';

// DOM elements
const audioPicker = document.getElementById('audioPicker');
const audioPlayer = document.getElementById('audioPlayer');
const bpmInput = document.getElementById('bpm');
const keyInput = document.getElementById('key');
const moodInput = document.getElementById('mood');
const notesInput = document.getElementById('notes');
const saveBtn = document.getElementById('saveBtn');
const exportBtn = document.getElementById('exportBtn');
const jsonPreview = document.getElementById('jsonPreview');

// Fetch the real song list from songs.json
fetch('songs.json')
  .then(res => res.json())
  .then(data => {
    songList = data;
    populateDropdown();
    loadInitialTrack();
  })
  .catch(err => {
    console.error('Could not load songs.json:', err);
    alert('Could not load songs.json!');
  });

// Fill the dropdown with songs
function populateDropdown() {
  audioPicker.innerHTML = ''; // clear old junk
  songList.forEach(file => {
    const option = document.createElement('option');
    option.value = file;
    option.textContent = file;
    audioPicker.appendChild(option);
  });
}

// Load initial track
function loadInitialTrack() {
  if (songList.length > 0) {
    currentTrack = songList[0];
    audioPicker.value = currentTrack;
    audioPlayer.src = `${songFolder}${currentTrack}`;
    loadTags(currentTrack);
  }
}

// Handle song selection change
audioPicker.addEventListener('change', () => {
  currentTrack = audioPicker.value;
  audioPlayer.src = `${songFolder}${currentTrack}`;
  loadTags(currentTrack);
});

// Load tags if they exist
function loadTags(file) {
  const data = tags[file] || {};
  bpmInput.value = data.bpm || '';
  keyInput.value = data.key || '';
  moodInput.value = data.mood || '';
  notesInput.value = data.notes || '';
}

// Save tags
saveBtn.addEventListener('click', () => {
  if (!currentTrack) return alert('No track selected!');
  tags[currentTrack] = {
    bpm: bpmInput.value.trim(),
    key: keyInput.value.trim(),
    mood: moodInput.value.trim(),
    notes: notesInput.value.trim(),
  };
  updateJSONPreview();
  alert(`Saved tags for ${currentTrack}`);
});

// Export tags as JSON
exportBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(tags, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'song-tags.json';
  a.click();
  URL.revokeObjectURL(url);
});

// Show preview of saved tags
function updateJSONPreview() {
  jsonPreview.textContent = JSON.stringify(tags, null, 2);
}