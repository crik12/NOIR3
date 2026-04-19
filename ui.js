// =============================================
//  NOIR MUSIC PLAYER — UI
// =============================================

const UI = (() => {

  // ---- Crear miniatura de cover ----
  function coverThumb(song, size = "small") {
    if (song.cover) {
      return `<img src="${song.cover}" alt="${song.title}" />`;
    }
    return `<div class="track-thumb-placeholder">${song.emoji || "♪"}</div>`;
  }

  function cardCover(song) {
    if (song.cover) {
      return `<img src="${song.cover}" alt="${song.title}" />`;
    }
    return `<div class="card-cover-placeholder">${song.emoji || "♪"}</div>`;
  }

  // ---- Render card (home grid) ----
  function renderCard(song) {
    const card = document.createElement("div");
    card.className = "song-card";
    card.dataset.songId = song.id;
    card.innerHTML = `
      <div class="card-cover">
        ${cardCover(song)}
        <button class="card-play-btn">&#9654;</button>
      </div>
      <div class="card-title">${song.title}</div>
      <div class="card-artist">${song.artist}</div>
    `;
    card.addEventListener("click", () => {
      const idx = SONGS.findIndex(s => s.id === song.id);
      Player.setQueue(SONGS, idx);
    });
    return card;
  }

  // ---- Render track row ----
  function renderTrackRow(song, index, songList, opts = {}) {
    const row = document.createElement("div");
    row.className = "track-row";
    row.dataset.songId = song.id;
    row.innerHTML = `
      <div class="track-num">${index + 1}</div>
      <div class="track-thumb">${coverThumb(song)}</div>
      <div class="track-info">
        <div class="track-title">${song.title}</div>
        <div class="track-artist">${song.artist}</div>
      </div>
      <div class="track-duration">${song.duration}</div>
      <button class="track-fav-btn ${song.liked ? "active" : ""}" title="Me gusta">&#9825;</button>
      ${opts.showAdd !== false ? `<button class="track-add-btn" title="Agregar a playlist">&#43;</button>` : ""}
    `;

    // Play on click row
    row.addEventListener("click", (e) => {
      if (e.target.classList.contains("track-fav-btn")) return;
      if (e.target.classList.contains("track-add-btn")) return;
      const idx = songList.findIndex(s => s.id === song.id);
      Player.setQueue(songList, idx);
    });

    // Like
    const favBtn = row.querySelector(".track-fav-btn");
    if (favBtn) {
      favBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        song.liked = !song.liked;
        const orig = SONGS.find(s => s.id === song.id);
        if (orig) orig.liked = song.liked;
        favBtn.classList.toggle("active", song.liked);
        const curr = Player.getCurrentSong();
        if (curr && curr.id === song.id) {
          document.getElementById("favBtn").classList.toggle("active", song.liked);
        }
      });
    }

    // Add to playlist
    const addBtn = row.querySelector(".track-add-btn");
    if (addBtn) {
      addBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openAddToPlaylistModal(song);
      });
    }

    return row;
  }

  // ---- Highlight playing track ----
  function highlightTrack(songId) {
    document.querySelectorAll(".track-row").forEach(el => {
      const id = parseInt(el.dataset.songId);
      el.classList.toggle("playing", id === songId);
      const numEl = el.querySelector(".track-num");
      if (numEl) {
        if (id === songId) {
          numEl.innerHTML = `<div class="playing-bars"><span></span><span></span><span></span></div>`;
        } else {
          const orig = SONGS.find(s => s.id === id);
          const idx  = [...el.parentElement.children].indexOf(el) + 1;
          numEl.textContent = idx;
        }
      }
    });
    document.querySelectorAll(".song-card").forEach(el => {
      el.classList.toggle("active", parseInt(el.dataset.songId) === songId);
    });
  }

  // ---- Refresh like buttons ----
  function refreshLikeButtons(songId, liked) {
    document.querySelectorAll(`.track-row[data-song-id="${songId}"] .track-fav-btn`).forEach(btn => {
      btn.classList.toggle("active", liked);
    });
  }

  // ---- Render playlist list item in sidebar ----
  function renderPlaylistSidebarItem(pl) {
    const li = document.createElement("li");
    li.className = "playlist-item";
    li.dataset.plId = pl.id;
    li.innerHTML = `
      <div class="playlist-dot">&#127925;</div>
      <span class="playlist-item-name">${pl.name}</span>
    `;
    li.addEventListener("click", () => App.openPlaylist(pl.id));
    return li;
  }

  // ---- Re-render sidebar playlists ----
  function renderSidebarPlaylists() {
    const list = document.getElementById("playlistList");
    list.innerHTML = "";
    PLAYLISTS.forEach(pl => list.appendChild(renderPlaylistSidebarItem(pl)));
  }

  // ---- Add to playlist modal ----
  let addTargetSong = null;

  function openAddToPlaylistModal(song) {
    addTargetSong = song;
    document.getElementById("addModalSongName").textContent = `"${song.title}" — ${song.artist}`;
    const list = document.getElementById("modalPlaylistList");
    list.innerHTML = "";
    if (PLAYLISTS.length === 0) {
      list.innerHTML = `<li style="color:var(--text-3);font-size:13px;padding:10px 0;">No tienes playlists. Crea una primero.</li>`;
    } else {
      PLAYLISTS.forEach(pl => {
        const li = document.createElement("li");
        li.className = "modal-playlist-item";
        const alreadyIn = pl.songIds.includes(song.id);
        li.innerHTML = `
          <div class="modal-pl-dot">&#127925;</div>
          <span>${pl.name}</span>
          ${alreadyIn ? `<span style="margin-left:auto;font-size:11px;color:var(--purple-lt);">&#10003; Ya está</span>` : ""}
        `;
        if (!alreadyIn) {
          li.addEventListener("click", () => {
            pl.songIds.push(song.id);
            savePlaylists(PLAYLISTS);
            closeModal("addToPlaylistModal");
            showToast(`Agregada a "${pl.name}"`);
          });
        }
        list.appendChild(li);
      });
    }
    openModal("addToPlaylistModal");
  }

  // ---- Modal helpers ----
  function openModal(id) {
    document.getElementById(id).classList.add("open");
  }
  function closeModal(id) {
    document.getElementById(id).classList.remove("open");
  }

  // ---- Toast ----
  let toastTimer;
  function showToast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2500);
  }

  // ---- Greet ----
  function updateGreeting() {
    const h = new Date().getHours();
    const greet = h < 12 ? "Buenos días" : h < 18 ? "Buenas tardes" : "Buenas noches";
    const el = document.querySelector(".hero-title");
    if (el) el.innerHTML = `${greet}<span class="dot">.</span>`;
  }

  return { renderCard, renderTrackRow, highlightTrack, refreshLikeButtons, renderSidebarPlaylists, openAddToPlaylistModal, openModal, closeModal, showToast, updateGreeting };
})();
