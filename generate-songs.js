// generate-songs.js

const fs = require('fs');
const path = require('path');

const songsDir = path.join(__dirname, 'songs');

fs.readdir(songsDir, (err, files) => {
  if (err) return console.error(err);
  const songFiles = files.filter(file =>
    file.endsWith('.mp3') || file.endsWith('.wav')
  );
  fs.writeFileSync('songs.json', JSON.stringify(songFiles, null, 2));
  console.log('✅ songs.json generated with', songFiles.length, 'tracks');
});
