const audioPlayer = document.getElementById('audio-player');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progress = document.getElementById('progress');
const trackTitle = document.getElementById('track-title');
const audioUpload = document.getElementById('audio-upload');
const fileName = document.getElementById('file-name');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const volumeSlider = document.getElementById('volume');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const albumArt = document.querySelector('.default-art');

let isPlaying = false;

function togglePlay() {
  if (!audioPlayer.src) return;
  
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
  albumArt.classList.add('playing');
}

function pauseTrack() {
  isPlaying = false;
  audioPlayer.pause();
  playIcon.style.display = 'block';
  pauseIcon.style.display = 'none';
  albumArt.classList.remove('playing');
}

audioUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    audioPlayer.src = url;
    trackTitle.innerText = file.name;
    fileName.innerText = file.name;
    playTrack();
  }
});

playBtn.addEventListener('click', togglePlay);

audioPlayer.addEventListener('timeupdate', () => {
  const { duration, currentTime } = audioPlayer;
  const progressPercent = (currentTime / duration) * 100;
  progress.value = progressPercent || 0;
  
  currentTimeEl.innerText = formatTime(currentTime);
  durationEl.innerText = duration ? formatTime(duration) : '0:00';
});

function formatTime(time) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

progress.addEventListener('input', (e) => {
  const seekTime = (e.target.value / 100) * audioPlayer.duration;
  audioPlayer.currentTime = seekTime;
});

volumeSlider.addEventListener('input', (e) => {
  audioPlayer.volume = e.target.value / 100;
});

audioPlayer.addEventListener('ended', pauseTrack);
