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

// Web Audio API Context
let audioContext;
let source;
let filters = [];

function initAudio() {
  if (audioContext) return;
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  source = audioContext.createMediaElementSource(audioPlayer);
  
  // Simplified Frequencies for Bass, Mid, Treble
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
    item.innerHTML = `
      <div class="queue-item-info">
        <div class="queue-item-title">${file.name.replace(/\.[^/.]+$/, "")}</div>
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
  const url = URL.createObjectURL(file);
  
  audioPlayer.src = url;
  const name = file.name.replace(/\.[^/.]+$/, "");
  trackTitle.innerText = name;
  miniTitle.innerText = name;
  
  updateQueue();
  
  jsmediatags.read(file, {
    onSuccess: function(tag) {
      const { artist, title, picture } = tag.tags;
      if (artist) {
        trackArtist.innerText = artist;
        miniArtist.innerText = artist;
      } else {
        trackArtist.innerText = "Unknown Artist";
        miniArtist.innerText = "Unknown Artist";
      }
      
      if (title) {
        trackTitle.innerText = title;
        miniTitle.innerText = title;
      }

      if (picture) {
        let base64String = "";
        for (let i = 0; i < picture.data.length; i++) {
          base64String += String.fromCharCode(picture.data[i]);
        }
        const base64 = "data:" + picture.format + ";base64," + window.btoa(base64String);
        albumArt.src = base64;
        miniAlbumArt.src = base64;
      } else {
        const defaultArt = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        albumArt.src = defaultArt;
        miniAlbumArt.src = defaultArt;
      }
    },
    onError: function() {
      albumArt.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
      miniAlbumArt.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
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

folderUpload.addEventListener('change', (e) => {
  const files = Array.from(e.target.files).filter(file => file.type.startsWith('audio/'));
  if (files.length > 0) {
    playlist = files;
    loadTrack(0);
  }
});

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
  audioPlayer.currentTime = (e.target.value / 100) * audioPlayer.duration;
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
