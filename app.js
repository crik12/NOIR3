// =============================================
//  NOIR MUSIC PLAYER — APP CONTROLLER
// =============================================

const App = (() => {

  let currentView = "home";
  let activePlaylistId = null;

  // ---- Init ----
  function init() {
    UI.updateGreeting();
    renderHome();
    UI.renderSidebarPlaylists();
    bindNavButtons();
    bindPlayerButtons();
    bindModals();
    bindSearch();
  }

  // ---- Views ----
  function showView(name) {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    const target = document.getElementById(`view-${name}`);
    if (target) target.classList.add("active");
    currentView = name;

    document.querySelectorAll(".nav-btn").forEach(b => {
      b.classList.toggle("active", b.dataset.view === name);
    });

    // Show/hide search bar
    document.getElementById("searchBar").style.display = name === "search" ? "flex" : "none";
    if (name === "search") document.getElementById("searchInput").focus();
  }

  // ---- Render Home ----
  function renderHome() {
    // Recent grid (first 6)
    const grid = document.getElementById("recentGrid");
    grid.innerHTML = "";
    SONGS.slice(0, 6).forEach(song => grid.appendChild(UI.renderCard(song)));

    // Full track list
    const list = document.getElementById("homeTrackList");
    list.innerHTML = "";
    SONGS.forEach((song, i) => list.appendChild(UI.renderTrackRow(song, i, SONGS)));
  }

  // ---- Render Library (liked songs) ----
  function renderLibrary() {
    const list = document.getElementById("libraryList");
    list.innerHTML = "";
    const liked = SONGS.filter(s => s.liked);
    if (liked.length === 0) {
      list.innerHTML = `<p class="empty-msg">Aún no tienes canciones favoritas. Dale ❤ a una canción.</p>`;
    } else {
      liked.forEach((song, i) => list.appendChild(UI.renderTrackRow(song, i, liked)));
    }
  }

  // ---- Open Playlist ----
  function openPlaylist(id) {
    const pl = PLAYLISTS.find(p => p.id === id);
    if (!pl) return;
    activePlaylistId = id;

    document.getElementById("playlistViewName").textContent = pl.name;
    document.getElementById("playlistViewMeta").textContent = `${pl.songIds.length} canción${pl.songIds.length !== 1 ? "es" : ""}`;
    document.getElementById("playlistCoverBig").innerHTML = "&#127925;";

    const songs = pl.songIds.map(sid => SONGS.find(s => s.id === sid)).filter(Boolean);
    const list = document.getElementById("playlistTrackList");
    list.innerHTML = "";

    if (songs.length === 0) {
      list.innerHTML = `<p class="empty-msg" style="padding:20px 28px;">Esta playlist está vacía. Agrega canciones con el botón +.</p>`;
    } else {
      songs.forEach((song, i) => {
        const row = UI.renderTrackRow(song, i, songs, { showAdd: false });
        // Remove button
        const removeBtn = document.createElement("button");
        removeBtn.className = "track-add-btn";
        removeBtn.style.opacity = "0";
        removeBtn.title = "Quitar de playlist";
        removeBtn.innerHTML = "&#215;";
        removeBtn.style.color = "var(--text-3)";
        removeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          pl.songIds = pl.songIds.filter(sid => sid !== song.id);
          savePlaylists(PLAYLISTS);
          openPlaylist(id); // re-render
          UI.showToast(`"${song.title}" eliminada de la playlist`);
        });
        row.appendChild(removeBtn);
        row.addEventListener("mouseenter", () => removeBtn.style.opacity = "1");
        row.addEventListener("mouseleave", () => removeBtn.style.opacity = "0");
        list.appendChild(row);
      });
    }

    // Highlight sidebar
    document.querySelectorAll(".playlist-item").forEach(el => {
      el.classList.toggle("active", parseInt(el.dataset.plId) === id);
    });

    showView("playlist");
  }

  // ---- Nav buttons ----
  function bindNavButtons() {
    document.querySelectorAll(".nav-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const view = btn.dataset.view;
        if (view === "library") renderLibrary();
        showView(view);
        if (view !== "playlist") {
          activePlaylistId = null;
          document.querySelectorAll(".playlist-item").forEach(el => el.classList.remove("active"));
        }
      });
    });

    document.getElementById("goBack").addEventListener("click", () => history.back());
    document.getElementById("goForward").addEventListener("click", () => history.forward());
  }

  // ---- Player buttons ----
  function bindPlayerButtons() {
    // Add current song to playlist
    document.getElementById("addToPlaylistBtn").addEventListener("click", () => {
      const song = Player.getCurrentSong();
      if (!song) { UI.showToast("Primero reproduce una canción"); return; }
      UI.openAddToPlaylistModal(song);
    });

    // Play playlist button
    document.getElementById("playPlaylistBtn").addEventListener("click", () => {
      if (!activePlaylistId) return;
      const pl = PLAYLISTS.find(p => p.id === activePlaylistId);
      if (!pl || pl.songIds.length === 0) { UI.showToast("La playlist está vacía"); return; }
      const songs = pl.songIds.map(sid => SONGS.find(s => s.id === sid)).filter(Boolean);
      Player.setQueue(songs, 0);
    });

    // Shuffle playlist
    document.getElementById("shufflePlaylistBtn").addEventListener("click", () => {
      if (!activePlaylistId) return;
      const pl = PLAYLISTS.find(p => p.id === activePlaylistId);
      if (!pl || pl.songIds.length === 0) { UI.showToast("La playlist está vacía"); return; }
      const songs = pl.songIds.map(sid => SONGS.find(s => s.id === sid)).filter(Boolean);
      const shuffled = [...songs].sort(() => Math.random() - 0.5);
      Player.setQueue(shuffled, 0);
      UI.showToast("Reproduciendo en aleatorio");
    });

    // Delete playlist
    document.getElementById("deletePlaylistBtn").addEventListener("click", () => {
      if (!activePlaylistId) return;
      const pl = PLAYLISTS.find(p => p.id === activePlaylistId);
      if (!pl) return;
      if (!confirm(`¿Eliminar la playlist "${pl.name}"?`)) return;
      PLAYLISTS = PLAYLISTS.filter(p => p.id !== activePlaylistId);
      savePlaylists(PLAYLISTS);
      UI.renderSidebarPlaylists();
      UI.showToast(`"${pl.name}" eliminada`);
      activePlaylistId = null;
      showView("home");
    });
  }

  // ---- Modals ----
  function bindModals() {
    // New Playlist
    document.getElementById("newPlaylistBtn").addEventListener("click", () => {
      document.getElementById("playlistNameInput").value = "";
      UI.openModal("newPlaylistModal");
    });

    document.getElementById("closeNewPlaylist").addEventListener("click", () => UI.closeModal("newPlaylistModal"));
    document.getElementById("cancelNewPlaylist").addEventListener("click", () => UI.closeModal("newPlaylistModal"));

    document.getElementById("confirmNewPlaylist").addEventListener("click", () => {
      const name = document.getElementById("playlistNameInput").value.trim();
      if (!name) { UI.showToast("Escribe un nombre para la playlist"); return; }
      const pl = { id: Date.now(), name, songIds: [] };
      PLAYLISTS.push(pl);
      savePlaylists(PLAYLISTS);
      UI.renderSidebarPlaylists();
      UI.closeModal("newPlaylistModal");
      UI.showToast(`Playlist "${name}" creada`);
      openPlaylist(pl.id);
    });

    // Enter key en input
    document.getElementById("playlistNameInput").addEventListener("keydown", e => {
      if (e.key === "Enter") document.getElementById("confirmNewPlaylist").click();
    });

    // Add to playlist modal close
    document.getElementById("closeAddModal").addEventListener("click", () => UI.closeModal("addToPlaylistModal"));
    document.getElementById("cancelAddModal").addEventListener("click", () => UI.closeModal("addToPlaylistModal"));

    // Click outside modal
    document.querySelectorAll(".modal-overlay").forEach(overlay => {
      overlay.addEventListener("click", e => {
        if (e.target === overlay) overlay.classList.remove("open");
      });
    });
  }

  // ---- Search ----
  function bindSearch() {
    const input = document.getElementById("searchInput");
    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      const container = document.getElementById("searchResults");
      container.innerHTML = "";

      if (!q) {
        container.innerHTML = `<p class="empty-msg">Escribe algo para buscar...</p>`;
        return;
      }

      const results = SONGS.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q)
      );

      if (results.length === 0) {
        container.innerHTML = `<p class="empty-msg">Sin resultados para "<strong>${q}</strong>"</p>`;
      } else {
        results.forEach((song, i) => container.appendChild(UI.renderTrackRow(song, i, results)));
      }
    });
  }

  return { init, showView, openPlaylist };
})();

// ---- Bootstrap ----
document.addEventListener("DOMContentLoaded", () => App.init());
