const audioPlayer = document.getElementById('audio-player');
const playBtn = document.getElementById('play-btn');
const shuffleBtn = document.getElementById('shuffle-btn');
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
const loadingScreen = document.getElementById('loading-screen');
const loadingStatus = document.getElementById('loading-status');
const loadBar = document.getElementById('load-bar');

let originalPlaylist = [];
let playlist = [];
let currentIndex = 0;
let isPlaying = false;
let isShuffled = false;
let trackMetadata = new Map();
let folders = new Map();
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

async function scanMetadataRecursive(files) {
  loadingScreen.style.display = 'flex';
  const total = files.length;
  let processed = 0;

  for (const file of files) {
    loadingStatus.innerText = `Scanning: ${file.name}`;
    loadBar.style.width = `${(processed / total) * 100}%`;

    await new Promise(resolve => {
      jsmediatags.read(file, {
        onSuccess: (tag) => {
          const { artist, title, picture } = tag.tags;
          let artUrl = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
          if (picture) {
            let base64String = "";
            for (let i = 0; i < picture.data.length; i++) base64String += String.fromCharCode(picture.data[i]);
            artUrl = `data:${picture.format};base64,${window.btoa(base64String)}`;
          }
          trackMetadata.set(file.name, {
            file,
            title: title || file.name.replace(/\.[^/.]+$/, ""),
            artist: artist || "Unknown Artist",
            thumb: artUrl
          });
          resolve();
        },
        onError: () => {
          trackMetadata.set(file.name, {
            file,
            title: file.name.replace(/\.[^/.]+$/, ""),
            artist: "Unknown Artist",
            thumb: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
          });
          resolve();
        }
      });
    });
    processed++;
  }
  
  loadingScreen.style.display = 'none';
  updateLibrary();
  loadTrack(0);
}

function updateLibrary() {
  playlistList.innerHTML = '';
  const allItem = document.createElement('div');
  allItem.className = 'playlist-item active';
  allItem.innerText = 'All Songs';
  allItem.onclick = () => {
    document.querySelectorAll('.playlist-item').forEach(i => i.classList.remove('active'));
    allItem.classList.add('active');
    originalPlaylist = Array.from(trackMetadata.values()).map(m => m.file);
    applyShuffleAndLoad(0);
  };
  playlistList.appendChild(allItem);

  folders.forEach((tracks, path) => {
    const item = document.createElement('div');
    item.className = 'playlist-item';
    item.innerText = path.split('/').pop() || 'Root';
    item.onclick = () => {
      document.querySelectorAll('.playlist-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      originalPlaylist = tracks;
      applyShuffleAndLoad(0);
    };
    playlistList.appendChild(item);
  });
}

function applyShuffleAndLoad(index) {
  if (isShuffled) {
    const currentFile = originalPlaylist[index];
    playlist = [...originalPlaylist].sort(() => Math.random() - 0.5);
    currentIndex = playlist.indexOf(currentFile);
  } else {
    playlist = [...originalPlaylist];
    currentIndex = index;
  }
  updateQueue();
  loadTrack(currentIndex);
}

function updateQueue() {
  queueList.innerHTML = '';
  playlist.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = `queue-item ${index === currentIndex ? 'active' : ''}`;
    const meta = trackMetadata.get(file.name) || {};
    item.innerHTML = `
      <img src="${meta.thumb || ''}" class="queue-thumb">
      <div class="queue-item-info">
        <div class="queue-item-title">${meta.title || file.name}</div>
      </div>
    `;
    item.onclick = () => loadTrack(index);
    queueList.appendChild(item);
  });
}

function loadTrack(index) {
  if (index < 0 || index >= playlist.length) return;
  currentIndex = index;
  const file = playlist[currentIndex];
  audioPlayer.src = URL.createObjectURL(file);
  const meta = trackMetadata.get(file.name) || {};
  trackTitle.innerText = meta.title;
  miniTitle.innerText = meta.title;
  trackArtist.innerText = meta.artist;
  miniArtist.innerText = meta.artist;
  albumArt.src = meta.thumb;
  miniAlbumArt.src = meta.thumb;
  updateQueue();
  playTrack();
}

function playTrack() {
  isPlaying = true;
  initAudio();
  if (audioContext.state === 'suspended') audioContext.resume();
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.2);
  audioPlayer.play();
  playIcon.style.display = 'none';
  pauseIcon.style.display = 'block';
  albumWrapper.classList.add('playing');
}

function pauseTrack() {
  isPlaying = false;
  gainNode.gain.setValueAtTime(gainNode.gain.value, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
  setTimeout(() => { if (!isPlaying) audioPlayer.pause(); }, 200);
  playIcon.style.display = 'block';
  pauseIcon.style.display = 'none';
  albumWrapper.classList.remove('playing');
}

function handleFiles(files) {
  const audioFiles = Array.from(files).filter(f => f.type.startsWith('audio/'));
  if (audioFiles.length > 0) {
    audioFiles.forEach(f => {
      const path = f.webkitRelativePath.split('/').slice(0, -1).join('/');
      if (path) {
        if (!folders.has(path)) folders.set(path, []);
        folders.get(path).push(f);
      }
    });
    originalPlaylist = audioFiles;
    scanMetadataRecursive(audioFiles);
  }
}

folderUpload.addEventListener('change', e => handleFiles(e.target.files));
fileUpload.addEventListener('change', e => handleFiles(e.target.files));
shuffleBtn.addEventListener('click', () => {
  isShuffled = !isShuffled;
  shuffleBtn.classList.toggle('active', isShuffled);
  applyShuffleAndLoad(currentIndex);
});

playBtn.addEventListener('click', () => isPlaying ? pauseTrack() : playTrack());
nextBtn.addEventListener('click', () => loadTrack((currentIndex + 1) % playlist.length));
prevBtn.addEventListener('click', () => loadTrack((currentIndex - 1 + playlist.length) % playlist.length));

audioPlayer.addEventListener('timeupdate', () => {
  const { duration, currentTime } = audioPlayer;
  progress.value = (currentTime / duration) * 100 || 0;
  currentTimeEl.innerText = formatTime(currentTime);
  durationEl.innerText = duration ? formatTime(duration) : '0:00';
});

function formatTime(t) {
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

progress.addEventListener('input', e => {
  if (audioPlayer.duration) audioPlayer.currentTime = (e.target.value / 100) * audioPlayer.duration;
});

volumeSlider.addEventListener('input', e => audioPlayer.volume = e.target.value / 100);
eqBands.forEach((b, i) => b.addEventListener('input', e => { if (filters[i]) filters[i].gain.value = parseFloat(e.target.value); }));
audioPlayer.addEventListener('ended', () => loadTrack((currentIndex + 1) % playlist.length));
