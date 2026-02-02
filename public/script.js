const audioPlayer = document.getElementById('audio-player');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progress = document.getElementById('progress');
const trackTitle = document.getElementById('track-title');
const folderUpload = document.getElementById('folder-upload');
const fileNameDisplay = document.getElementById('file-name');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const volumeSlider = document.getElementById('volume');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const vinylWrapper = document.querySelector('.vinyl-wrapper');
const albumArt = document.getElementById('album-art');
const eqBands = document.querySelectorAll('.eq-band');

let playlist = [];
let currentIndex = 0;
let isPlaying = false;

// Web Audio API Context for EQ
let audioContext;
let source;
let filters = [];

function initAudio() {
  if (audioContext) return;
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  source = audioContext.createMediaElementSource(audioPlayer);
  
  const frequencies = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
  
  let lastFilter = source;
  frequencies.forEach(freq => {
    const filter = audioContext.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.value = freq;
    filter.Q.value = 1;
    filter.gain.value = 0;
    
    lastFilter.connect(filter);
    lastFilter = filter;
    filters.push(filter);
  });
  
  lastFilter.connect(audioContext.destination);
}

function loadTrack(index) {
  if (index < 0 || index >= playlist.length) return;
  
  currentIndex = index;
  const file = playlist[currentIndex];
  const url = URL.createObjectURL(file);
  
  audioPlayer.src = url;
  trackTitle.innerText = file.name.replace(/\.[^/.]+$/, "");
  
  // Extract Metadata/Art
  jsmediatags.read(file, {
    onSuccess: function(tag) {
      const image = tag.tags.picture;
      if (image) {
        let base64String = "";
        for (let i = 0; i < image.data.length; i++) {
          base64String += String.fromCharCode(image.data[i]);
        }
        const base64 = "data:" + image.format + ";base64," + window.btoa(base64String);
        albumArt.src = base64;
      } else {
        albumArt.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
      }
    },
    onError: function(error) {
      console.log('Error reading tags: ', error.type, error.info);
      albumArt.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
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
  vinylWrapper.classList.add('playing');
}

function pauseTrack() {
  isPlaying = false;
  audioPlayer.pause();
  playIcon.style.display = 'block';
  pauseIcon.style.display = 'none';
  vinylWrapper.classList.remove('playing');
}

folderUpload.addEventListener('change', (e) => {
  const files = Array.from(e.target.files).filter(file => file.type.startsWith('audio/'));
  if (files.length > 0) {
    playlist = files;
    fileNameDisplay.innerText = `${files.length} tracks loaded`;
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
