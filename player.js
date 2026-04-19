// =============================================
//  NOIR MUSIC PLAYER — PLAYER ENGINE
// =============================================

const Player = (() => {
  let audio = new Audio();
  let currentIndex = -1;
  let queue = [...SONGS];
  let isShuffling = false;
  let isRepeating = false;
  let isMuted = false;
  let volumeBeforeMute = 70;

  // Referencias DOM
  const titleEl    = document.getElementById("playerTitle");
  const artistEl   = document.getElementById("playerArtist");
  const coverEl    = document.getElementById("playerCover");
  const playBtn    = document.getElementById("playPauseBtn");
  const prevBtn    = document.getElementById("prevBtn");
  const nextBtn    = document.getElementById("nextBtn");
  const shuffleBtn = document.getElementById("shuffleBtn");
  const repeatBtn  = document.getElementById("repeatBtn");
  const muteBtn    = document.getElementById("muteBtn");
  const favBtn     = document.getElementById("favBtn");
  const progressFill  = document.getElementById("progressFill");
  const progressRange = document.getElementById("progressRange");
  const currentTimeEl = document.getElementById("currentTime");
  const totalTimeEl   = document.getElementById("totalTime");
  const volumeRange   = document.getElementById("volumeRange");
  const volLabel      = document.getElementById("volLabel");

  // ---- Formatear tiempo ----
  function fmt(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  // ---- Cargar canción ----
  function load(index, autoPlay = true) {
    const song = queue[index];
    if (!song) return;
    currentIndex = index;

    titleEl.textContent  = song.title;
    artistEl.textContent = song.artist;
    totalTimeEl.textContent = song.duration;

    // Cover
    coverEl.innerHTML = "";
    if (song.cover) {
      const img = document.createElement("img");
      img.src = song.cover;
      img.alt = song.title;
      coverEl.appendChild(img);
    } else {
      coverEl.innerHTML = `<div class="cover-placeholder">${song.emoji || "♪"}</div>`;
    }

    // Like
    favBtn.classList.toggle("active", !!song.liked);

    // Audio real
    if (song.src) {
      audio.src = song.src;
      if (autoPlay) audio.play().catch(() => {});
    } else {
      // Modo demo: simular reproducción con timer
      audio.src = "";
      if (autoPlay) simulatePlay(song.durationSec);
    }

    if (autoPlay) setPlayingState(true);
    UI.highlightTrack(song.id);
  }

  // ---- Simulación cuando no hay archivo de audio ----
  let simInterval = null;
  let simCurrent  = 0;
  let simDuration = 0;
  let simPlaying  = false;

  function simulatePlay(duration) {
    clearInterval(simInterval);
    simDuration = duration;
    simCurrent  = 0;
    simPlaying  = true;
    simInterval = setInterval(() => {
      if (!simPlaying) return;
      simCurrent++;
      if (simCurrent >= simDuration) {
        clearInterval(simInterval);
        handleEnd();
        return;
      }
      const pct = (simCurrent / simDuration) * 100;
      progressFill.style.width = pct + "%";
      progressRange.value = pct;
      currentTimeEl.textContent = fmt(simCurrent);
    }, 1000);
  }

  function simulatePause()  { simPlaying = false; }
  function simulateResume() { simPlaying = true; }
  function simulateSeek(pct) {
    simCurrent = Math.floor((pct / 100) * simDuration);
    currentTimeEl.textContent = fmt(simCurrent);
    progressFill.style.width = pct + "%";
  }

  // ---- Audio events ----
  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = pct + "%";
    progressRange.value = pct;
    currentTimeEl.textContent = fmt(audio.currentTime);
    totalTimeEl.textContent   = fmt(audio.duration);
  });

  audio.addEventListener("ended", handleEnd);

  function handleEnd() {
    if (isRepeating) {
      if (queue[currentIndex].src) {
        audio.currentTime = 0;
        audio.play();
      } else {
        simulatePlay(queue[currentIndex].durationSec);
      }
    } else {
      next();
    }
  }

  // ---- Play / Pause ----
  function isRealAudio() { return !!queue[currentIndex]?.src; }

  function play() {
    if (currentIndex === -1) { load(0); return; }
    if (isRealAudio()) audio.play().catch(() => {});
    else simulateResume();
    setPlayingState(true);
  }

  function pause() {
    if (isRealAudio()) audio.pause();
    else simulatePause();
    setPlayingState(false);
  }

  function toggle() {
    if (isPlaying()) pause();
    else play();
  }

  function isPlaying() {
    if (isRealAudio()) return !audio.paused;
    return simPlaying;
  }

  function setPlayingState(state) {
    playBtn.innerHTML = state ? "&#9646;&#9646;" : "&#9654;";
    playBtn.title     = state ? "Pausa" : "Play";
  }

  // ---- Prev / Next ----
  function prev() {
    if (currentIndex <= 0) load(queue.length - 1);
    else load(currentIndex - 1);
  }

  function next() {
    if (isShuffling) {
      let idx;
      do { idx = Math.floor(Math.random() * queue.length); }
      while (idx === currentIndex && queue.length > 1);
      load(idx);
    } else {
      load((currentIndex + 1) % queue.length);
    }
  }

  // ---- Shuffle / Repeat ----
  function toggleShuffle() {
    isShuffling = !isShuffling;
    shuffleBtn.classList.toggle("active", isShuffling);
  }

  function toggleRepeat() {
    isRepeating = !isRepeating;
    repeatBtn.classList.toggle("active", isRepeating);
  }

  // ---- Volume ----
  function setVolume(val) {
    const v = parseInt(val);
    audio.volume = v / 100;
    volLabel.textContent = v;
    volumeRange.value = v;
    if (v === 0) muteBtn.innerHTML = "&#128263;";
    else if (v < 50) muteBtn.innerHTML = "&#128264;";
    else muteBtn.innerHTML = "&#128266;";
  }

  function toggleMute() {
    isMuted = !isMuted;
    if (isMuted) {
      volumeBeforeMute = parseInt(volumeRange.value);
      setVolume(0);
    } else {
      setVolume(volumeBeforeMute);
    }
  }

  // ---- Seek ----
  function seek(pct) {
    if (isRealAudio() && audio.duration) {
      audio.currentTime = (pct / 100) * audio.duration;
    } else {
      simulateSeek(pct);
    }
  }

  // ---- Like ----
  function toggleLike() {
    const song = queue[currentIndex];
    if (!song) return;
    song.liked = !song.liked;
    const orig = SONGS.find(s => s.id === song.id);
    if (orig) orig.liked = song.liked;
    favBtn.classList.toggle("active", song.liked);
    UI.refreshLikeButtons(song.id, song.liked);
  }

  // ---- Set queue ----
  function setQueue(songs, startIndex = 0) {
    queue = [...songs];
    load(startIndex);
  }

  function getCurrentSong() { return queue[currentIndex] || null; }
  function getCurrentIndex() { return currentIndex; }

  // ---- Bind events ----
  playBtn.addEventListener("click", toggle);
  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);
  shuffleBtn.addEventListener("click", toggleShuffle);
  repeatBtn.addEventListener("click", toggleRepeat);
  muteBtn.addEventListener("click", toggleMute);
  favBtn.addEventListener("click", toggleLike);

  progressRange.addEventListener("input", e => seek(parseFloat(e.target.value)));
  volumeRange.addEventListener("input", e => setVolume(e.target.value));

  setVolume(70);

  return { load, play, pause, toggle, prev, next, setQueue, getCurrentSong, getCurrentIndex, seek, setVolume, toggleLike, isPlaying };
})();
