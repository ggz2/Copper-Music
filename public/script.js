const audioPlayer = document.getElementById('audio-player');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progress = document.getElementById('progress');
const trackTitle = document.getElementById('track-title');
const trackArtist = document.getElementById('track-artist');
const miniTitle = document.getElementById('mini-title');
const miniArtist = document.getElementById('mini-artist');
const folderUpload = document.getElementById('folder-upload');
const fileUpload = document.getElementById('file-upload');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const volumeSlider = document.getElementById('volume');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const albumWrapper = document.querySelector('.album-wrapper');
const albumArt = document.getElementById('album-art');
const miniAlbumArt = document.getElementById('mini-album-art');
const queueList = document.getElementById('queue-list');
const playlistList = document.getElementById('playlist-list');
const crossfadeInput = document.getElementById('crossfade');
const fadeValDisplay = document.getElementById('fade-val');
const eqBands = document.querySelectorAll('.eq-band');

let playlist = [];
let currentIndex = 0;
let isPlaying = false;
let trackMetadata = new Map();
let folders = new Map(); // Store tracks by folder path
let crossfadeTime = 5;

// Web Audio API Context
let audioContext;
let source;
let filters = [];
let gainNode;

function initAudio() {
  if (audioContext) return;
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  source = audioContext.createMediaElementSource(audioPlayer);
  gainNode = audioContext.createGain();
  
  const frequencies = [60, 600, 12000];
  let lastFilter = source;
  
  frequencies.forEach(freq => {
    const filter = audioContext.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.value = freq;
    filter.gain.value = 0;
    lastFilter.connect(filter);
    lastFilter = filter;
    filters.push(filter);
  });
  
  lastFilter.connect(gainNode);
  gainNode.connect(audioContext.destination);
}

function updateLibrary() {
  playlistList.innerHTML = '';
  // Add "All Songs" first
  const allSongsItem = document.createElement('div');
  allSongsItem.className = 'playlist-item active';
  allSongsItem.innerText = 'All Songs';
  allSongsItem.onclick = () => {
    document.querySelectorAll('.playlist-item').forEach(i => i.classList.remove('active'));
    allSongsItem.classList.add('active');
    playlist = Array.from(trackMetadata.values()).map(m => m.file);
    loadTrack(0);
  };
  playlistList.appendChild(allSongsItem);

  // Add folder-based playlists
  folders.forEach((tracks, path) => {
    const item = document.createElement('div');
    item.className = 'playlist-item';
    const folderName = path.split('/').pop() || 'Root Folder';
    item.innerText = folderName;
    item.title = path;
    item.onclick = () => {
      document.querySelectorAll('.playlist-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      playlist = tracks;
      loadTrack(0);
    };
    playlistList.appendChild(item);
  });
}

function updateQueue() {
  queueList.innerHTML = '';
  playlist.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = `queue-item ${index === currentIndex ? 'active' : ''}`;
    
    const meta = trackMetadata.get(file.name) || {};
    const thumbSrc = meta.thumb || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    
    item.innerHTML = `
      <img src="${thumbSrc}" class="queue-thumb">
      <div class="queue-item-info">
        <div class="queue-item-title">${meta.title || file.name.replace(/\.[^/.]+$/, "")}</div>
      </div>
    `;
    item.onclick = () => loadTrack(index);
    queueList.appendChild(item);
  });
}

async function loadTrack(index) {
  if (index < 0 || index >= playlist.length) return;
  
  currentIndex = index;
  const file = playlist[currentIndex];
  const url = URL.createObjectURL(file);
  
  audioPlayer.src = url;
  
  const name = file.name.replace(/\.[^/.]+$/, "");
  const meta = trackMetadata.get(file.name) || {};
  
  trackTitle.innerText = meta.title || name;
  miniTitle.innerText = meta.title || name;
  trackArtist.innerText = meta.artist || "Loading...";
  miniArtist.innerText = meta.artist || "Loading...";
  
  const artUrl = meta.thumb || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  albumArt.src = artUrl;
  miniAlbumArt.src = artUrl;

  updateQueue();
  
  jsmediatags.read(file, {
    onSuccess: function(tag) {
      const { artist, title, picture } = tag.tags;
      let newArtUrl = artUrl;
      
      if (picture) {
        let base64String = "";
        for (let i = 0; i < picture.data.length; i++) {
          base64String += String.fromCharCode(picture.data[i]);
        }
        newArtUrl = "data:" + picture.format + ";base64," + window.btoa(base64String);
      }

      const finalArtist = artist || "Unknown Artist";
      const finalTitle = title || name;

      trackArtist.innerText = finalArtist;
      miniArtist.innerText = finalArtist;
      trackTitle.innerText = finalTitle;
      miniTitle.innerText = finalTitle;
      albumArt.src = newArtUrl;
      miniAlbumArt.src = newArtUrl;

      trackMetadata.set(file.name, {
        file: file,
        title: finalTitle,
        artist: finalArtist,
        thumb: newArtUrl
      });
      
      // Update queue thumb instantly
      const items = queueList.querySelectorAll('.queue-item');
      if (items[index]) {
        items[index].querySelector('.queue-thumb').src = newArtUrl;
        items[index].querySelector('.queue-item-title').innerText = finalTitle;
      }
    }
  });
  
  playTrack();
}

function playTrack() {
  isPlaying = true;
  initAudio();
  if (audioContext.state === 'suspended') audioContext.resume();
  
  // Fade in
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.5);
  
  audioPlayer.play();
  playIcon.style.display = 'none';
  pauseIcon.style.display = 'block';
  albumWrapper.classList.add('playing');
}

function pauseTrack() {
  isPlaying = false;
  
  // Fade out
  gainNode.gain.setValueAtTime(gainNode.gain.value, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
  
  setTimeout(() => {
    if (!isPlaying) audioPlayer.pause();
  }, 500);

  playIcon.style.display = 'block';
  pauseIcon.style.display = 'none';
  albumWrapper.classList.remove('playing');
}

function handleFiles(files) {
  const audioFiles = Array.from(files).filter(file => file.type.startsWith('audio/'));
  if (audioFiles.length > 0) {
    audioFiles.forEach(file => {
      trackMetadata.set(file.name, { file: file });
      const path = file.webkitRelativePath.split('/').slice(0, -1).join('/');
      if (path) {
        if (!folders.has(path)) folders.set(path, []);
        folders.get(path).push(file);
      }
    });

    playlist = audioFiles;
    updateLibrary();
    loadTrack(0);
  }
}

folderUpload.addEventListener('change', (e) => handleFiles(e.target.files));
fileUpload.addEventListener('change', (e) => handleFiles(e.target.files));
crossfadeInput.addEventListener('input', (e) => {
  crossfadeTime = parseInt(e.target.value);
  fadeValDisplay.innerText = crossfadeTime;
});

playBtn.addEventListener('click', () => isPlaying ? pauseTrack() : playTrack());
nextBtn.addEventListener('click', () => loadTrack((currentIndex + 1) % playlist.length));
prevBtn.addEventListener('click', () => loadTrack((currentIndex - 1 + playlist.length) % playlist.length));

audioPlayer.addEventListener('timeupdate', () => {
  const { duration, currentTime } = audioPlayer;
  progress.value = (currentTime / duration) * 100 || 0;
  currentTimeEl.innerText = formatTime(currentTime);
  durationEl.innerText = duration ? formatTime(duration) : '0:00';

  // Crossfade trigger
  if (duration && duration - currentTime <= crossfadeTime && isPlaying && crossfadeTime > 0) {
    // Basic auto-next trigger for crossfade
    // In a real crossfade we'd need two audio elements, 
    // but for simplicity we'll trigger the next track with a fade out
    if (duration - currentTime <= 0.5) {
      loadTrack((currentIndex + 1) % playlist.length);
    }
  }
});

function formatTime(time) {
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

progress.addEventListener('input', (e) => {
  if (audioPlayer.duration) {
    audioPlayer.currentTime = (e.target.value / 100) * audioPlayer.duration;
  }
});

volumeSlider.addEventListener('input', (e) => {
  audioPlayer.volume = e.target.value / 100;
});

eqBands.forEach((band, index) => {
  band.addEventListener('input', (e) => {
    if (filters[index]) {
      filters[index].gain.value = parseFloat(e.target.value);
    }
  });
});

audioPlayer.addEventListener('ended', () => loadTrack((currentIndex + 1) % playlist.length));
