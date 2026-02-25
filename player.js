
const songs = [
    {
        title: "Let Down",
        artist: "Radiohead",
        duration: "4:59",
        url: "songs/let_down.mp3"
    },
    {
        title: "Creep",
        artist: "Radiohead",
        duration: "4:00",
        url: "songs/creep.mp3"
    },
    {
        title: "Fake Plastic Trees",
        artist: "Radiohead",
        duration: "4:51",
        url: "songs/fake_plastic_trees.mp3"
    },
    {
        title: "No Surprises",
        artist: "Radiohead",
        duration: "3:49",
        url: "songs/no_surprises.mp3"
    },
    {
        title: "Iktara",
        artist: "Amit Trivedi, Kavita Seth",
        duration: "4:13",
        url: "songs/iktara.mp3"
    }
];

let currentSong = 0;
let isPlaying = false;

const audioPlayer = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progressFill = document.querySelector('.progress-fill');
const progressBar = document.querySelector('.progress-bar');
const currentTimeEl = document.querySelector('.current-time');
const totalTimeEl = document.querySelector('.total-time');
const volumeSlider = document.querySelector('.volume-slider');
const songItems = document.querySelectorAll('.song-item');


audioPlayer.volume = 0.7;

function loadSong(index) {
    currentSong = index;
    audioPlayer.src = songs[index].url;
    
   
    songItems.forEach((item, i) => {
        if (i === index) {
            item.classList.add('active');
            item.querySelector('.fa-play').classList.replace('fa-play', 'fa-pause');
        } else {
            item.classList.remove('active');
            const icon = item.querySelector('.fa-pause') || item.querySelector('.fa-play');
            if (icon.classList.contains('fa-pause')) {
                icon.classList.replace('fa-pause', 'fa-play');
            }
        }
    });
}


function playSong() {
    isPlaying = true;
    audioPlayer.play();
    playPauseBtn.querySelector('i').classList.replace('fa-play', 'fa-pause');
    songItems[currentSong].querySelector('i').classList.replace('fa-play', 'fa-pause');
}


function pauseSong() {
    isPlaying = false;
    audioPlayer.pause();
    playPauseBtn.querySelector('i').classList.replace('fa-pause', 'fa-play');
    songItems[currentSong].querySelector('i').classList.replace('fa-pause', 'fa-play');
}


playPauseBtn.addEventListener('click', () => {
    if (isPlaying) {
        pauseSong();
    } else {
        if (!audioPlayer.src) {
            loadSong(0);
        }
        playSong();
    }
});

prevBtn.addEventListener('click', () => {
    currentSong = (currentSong - 1 + songs.length) % songs.length;
    loadSong(currentSong);
    if (isPlaying) playSong();
});


nextBtn.addEventListener('click', () => {
    currentSong = (currentSong + 1) % songs.length;
    loadSong(currentSong);
    if (isPlaying) playSong();
});

songItems.forEach((item, index) => {
    item.addEventListener('click', () => {
        if (currentSong === index && isPlaying) {
            pauseSong();
        } else {
            loadSong(index);
            playSong();
        }
    });
});

audioPlayer.addEventListener('timeupdate', () => {
    const { currentTime, duration } = audioPlayer;
    const progressPercent = (currentTime / duration) * 100;
    progressFill.style.width = `${progressPercent}%`;
    
    
    currentTimeEl.textContent = formatTime(currentTime);
    if (duration) {
        totalTimeEl.textContent = formatTime(duration);
    }
});


progressBar.addEventListener('click', (e) => {
    const width = progressBar.clientWidth;
    const clickX = e.offsetX;
    const duration = audioPlayer.duration;
    audioPlayer.currentTime = (clickX / width) * duration;
});


volumeSlider.addEventListener('input', (e) => {
    audioPlayer.volume = e.target.value / 100;
});


audioPlayer.addEventListener('ended', () => {
    nextBtn.click();
});

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

loadSong(0);
