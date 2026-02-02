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
const eqBands = document.querySelectorAll('.eq-band');

let playlist = [];
let currentIndex = 0;
let isPlaying = false;
let trackMetadata = new Map(); // Store metadata for icons

// Web Audio API Context
let audioContext;
let source;
let filters = [];

function initAudio() {
  if (audioContext) return;
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  source = audioContext.createMediaElementSource(audioPlayer);
  
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
  
  lastFilter.connect(audioContext.destination);
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
  
  // Set initial text
  const name = file.name.replace(/\.[^/.]+$/, "");
  trackTitle.innerText = name;
  miniTitle.innerText = name;
  trackArtist.innerText = "Loading...";
  miniArtist.innerText = "Loading...";
  
  updateQueue();
  
  jsmediatags.read(file, {
    onSuccess: function(tag) {
      const { artist, title, picture } = tag.tags;
      let artUrl = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
      
      if (picture) {
        let base64String = "";
        for (let i = 0; i < picture.data.length; i++) {
          base64String += String.fromCharCode(picture.data[i]);
        }
        artUrl = "data:" + picture.format + ";base64," + window.btoa(base64String);
      }

      const finalArtist = artist || "Unknown Artist";
      const finalTitle = title || name;

      trackArtist.innerText = finalArtist;
      miniArtist.innerText = finalArtist;
      trackTitle.innerText = finalTitle;
      miniTitle.innerText = finalTitle;
      albumArt.src = artUrl;
      miniAlbumArt.src = artUrl;

      // Update metadata map for queue thumbnails
      trackMetadata.set(file.name, {
        title: finalTitle,
        artist: finalArtist,
        thumb: artUrl
      });
      
      // Update queue to show the new thumbnail/info
      const items = queueList.querySelectorAll('.queue-item');
      if (items[index]) {
        items[index].querySelector('.queue-thumb').src = artUrl;
        items[index].querySelector('.queue-item-title').innerText = finalTitle;
      }
    },
    onError: function() {
      trackArtist.innerText = "Unknown Artist";
      miniArtist.innerText = "Unknown Artist";
    }
  });
  
  playTrack();
}

function togglePlay() {
  if (!audioPlayer.src) return;
  initAudio();
  if (audioContext.state === 'suspended') audioContext.resume();
  
  if (isPlaying) {
    pauseTrack();
  } else {
    playTrack();
  }
}

function playTrack() {
  isPlaying = true;
  audioPlayer.play();
  playIcon.style.display = 'none';
  pauseIcon.style.display = 'block';
  albumWrapper.classList.add('playing');
}

function pauseTrack() {
  isPlaying = false;
  audioPlayer.pause();
  playIcon.style.display = 'block';
  pauseIcon.style.display = 'none';
  albumWrapper.classList.remove('playing');
}

function handleFiles(files) {
  const audioFiles = Array.from(files).filter(file => file.type.startsWith('audio/'));
  if (audioFiles.length > 0) {
    // Sort files to keep folder structure somewhat logical
    audioFiles.sort((a, b) => a.webkitRelativePath.localeCompare(b.webkitRelativePath));
    playlist = [...playlist, ...audioFiles];
    if (playlist.length === audioFiles.length) {
      loadTrack(0);
    } else {
      updateQueue();
    }
  }
}

folderUpload.addEventListener('change', (e) => handleFiles(e.target.files));
fileUpload.addEventListener('change', (e) => handleFiles(e.target.files));

playBtn.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', () => loadTrack((currentIndex + 1) % playlist.length));
prevBtn.addEventListener('click', () => loadTrack((currentIndex - 1 + playlist.length) % playlist.length));

audioPlayer.addEventListener('timeupdate', () => {
  const { duration, currentTime } = audioPlayer;
  progress.value = (currentTime / duration) * 100 || 0;
  currentTimeEl.innerText = formatTime(currentTime);
  durationEl.innerText = duration ? formatTime(duration) : '0:00';
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
