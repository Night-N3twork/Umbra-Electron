let currentIndex = 0;
let repeatMode = 'noRepeat';
let store = {};
let playlists = JSON.parse(localStorage.getItem('playlists')) || [];

for (let i = 1; i <= 45; i++) {
  const storeDiv = document.createElement('div');
  storeDiv.id = `store-${i}`;
  storeDiv.classList.add('grid');
  document.body.appendChild(storeDiv);
}

function loadData() {
  for (let i = 1; i <= 45; i++) {
    const storedData = localStorage.getItem(`store-${i}`);
    if (storedData) {
      store[`store-${i}`] = JSON.parse(storedData);
    }
  }
  const storedPlaylists = localStorage.getItem("playlists");
  if (storedPlaylists) {
    playlists = JSON.parse(storedPlaylists);
  }
}
function saveData() {
  for (const key in store) {
    if (store.hasOwnProperty(key)) {
      localStorage.setItem(key, JSON.stringify(store[key]));
    }
  }
  localStorage.setItem("playlists", JSON.stringify(playlists));
}
function handleFileUpload(event) {
  const files = event.target.files;
  for (let i = 1; i <= 45; i++) {
    const storeKey = `store-${i}`;
    if (!store[storeKey]) {
      store[storeKey] = [];
    }
  }
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const reader = new FileReader();
    reader.onload = function (event) {
      const dataURL = event.target.result;
      const metadata = {
        name: file.name,
        image: "default_image.jpg",
        data: dataURL,
        playlists: [],
      };
      let added = false;
      for (let j = 1; j <= 45; j++) {
        const storeKey = `store-${j}`;
        if (store[storeKey].length < 10) {
          store[storeKey].push(metadata);
          added = true;
          break;
        }
      }
      if (!added) {
        alert("All storage slots are full.");
      } else {
        saveData();
        displayStores();
      }
    };
    reader.readAsDataURL(file);
  }
}
function displayStores() {
  for (let i = 1; i <= 45; i++) {
    const storeKey = `store-${i}`;
    const storeContainer = document.getElementById(`store-${i}`);
    storeContainer.innerHTML = "";
    store[storeKey].forEach((item, index) => {
      const listItem = document.createElement("div");
      listItem.classList.add("item");
      const img = document.createElement("img");
      img.src = item.image;
      img.alt = item.name;
      const name = document.createElement("span");
      name.textContent = item.name;
      listItem.appendChild(img);
      listItem.appendChild(name);
      listItem.addEventListener("click", () => playSong(item));
      listItem.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        showContextMenu(event, item);
      });
      storeContainer.appendChild(listItem);
    });
  }
}
function showContextMenu(event, item) {
  event.preventDefault();

  const contextMenu = document.createElement('div');
  contextMenu.classList.add('context-menu');
  contextMenu.style.top = `${event.clientY}px`;
  contextMenu.style.left = `${event.clientX}px`;

  const playOption = document.createElement('div');
  playOption.textContent = 'Play';
  playOption.addEventListener('click', () => playSong(playlist.indexOf(item)));

  const deleteOption = document.createElement('div');
  deleteOption.textContent = 'Delete Song';
  deleteOption.addEventListener('click', () => deleteSong(item));

  contextMenu.appendChild(playOption);
  contextMenu.appendChild(deleteOption);

  document.body.appendChild(contextMenu);

  document.addEventListener('click', () => {
      document.body.removeChild(contextMenu);
  }, { once: true });
}

function deleteSong(item) {
  const index = playlist.indexOf(item);
  if (index !== -1) {
      playlist.splice(index, 1);
      displayPlaylist('home', playlist);
      // Save the updated playlist to localStorage
      savePlaylistToLocalStorage(playlist);
  }
}
function addToPlaylist(item) {
  const playlistSelect = document.createElement("select");
  playlistSelect.innerHTML = '<option value="">Select Playlist</option>';
  playlists.forEach((playlist) => {
    const option = document.createElement("option");
    option.value = playlist.id;
    option.textContent = playlist.name;
    playlistSelect.appendChild(option);
  });
  const modal = document.createElement("div");
  modal.classList.add("modal");
  modal.innerHTML = ` <h2>Select Playlist</h2> ${playlistSelect.outerHTML} <button id="addToPlaylist">Add</button> `;
  document.body.appendChild(modal);
  document.getElementById("addToPlaylist").addEventListener("click", () => {
    const selectedPlaylistId = playlistSelect.value;
    if (selectedPlaylistId) {
      const selectedPlaylist = playlists.find(
        (playlist) => playlist.id === parseInt(selectedPlaylistId)
      );
      if (selectedPlaylist) {
        item.playlists.push(selectedPlaylist.id);
        saveData();
      }
    }
    document.body.removeChild(modal);
  });
}
function playSong(playlist, index) {
  if (playlist && index >= 0 && index < playlist.length) {
      const audioPlayer = document.getElementById('audioPlayer');
      audioPlayer.src = playlist[index].data;
      audioPlayer.play();

      currentIndex = index;

      audioPlayer.addEventListener('ended', function() {
          if (repeatMode === 'repeatOne') {
              playSong(playlist, currentIndex);
          } else if (repeatMode === 'repeatAll') {
              playNextSong(playlist);
          } else {
              if (currentIndex < playlist.length - 1) {
                  playNextSong(playlist);
              }
          }
      });
  } else {
      console.error('Invalid playlist or index.');
  }
}

document
  .getElementById("fileInput")
  .addEventListener("change", handleFileUpload);
function createPlaylist() {
  const name = prompt("Enter the name of the playlist:");
  if (name) {
    playlists.push({
      id: playlists.length + 1,
      name: name,
      image: "default_playlist_image.jpg",
      description: "",
      songs: [],
    });
    saveData();
    displayStores();
  }
}
function displayPlaylists() {
  const playlistsContainer = document.getElementById("playlists");
  playlistsContainer.innerHTML = "";
  playlists.forEach((playlist, index) => {
    const playlistItem = document.createElement("div");
    playlistItem.classList.add("playlist-item");
    const img = document.createElement("img");
    img.src = playlist.image;
    img.alt = playlist.name;
    const name = document.createElement("span");
    name.textContent = playlist.name;
    playlistItem.appendChild(img);
    playlistItem.appendChild(name);
    playlistItem.addEventListener("click", () => shufflePlaylist(playlist.id));
    playlistItem.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      showPlaylistContextMenu(event, playlist);
    });
    playlistsContainer.appendChild(playlistItem);
  });
}
function showPlaylistContextMenu(event, playlist) {
  const contextMenu = document.createElement("div");
  contextMenu.classList.add("context-menu");
  contextMenu.style.top = `${event.clientY}px`;
  contextMenu.style.left = `${event.clientX}px`;
  const renameOption = document.createElement("div");
  renameOption.textContent = "Rename Playlist";
  renameOption.addEventListener("click", () => renamePlaylist(playlist));
  const addSongsOption = document.createElement("div");
  addSongsOption.textContent = "Add Songs";
  addSongsOption.addEventListener("click", () => addSongsToPlaylist(playlist));
  const deleteOption = document.createElement("div");
  deleteOption.textContent = "Delete Playlist";
  deleteOption.addEventListener("click", () => deletePlaylist(playlist));
  contextMenu.appendChild(renameOption);
  contextMenu.appendChild(addSongsOption);
  contextMenu.appendChild(deleteOption);
  document.body.appendChild(contextMenu);
  document.addEventListener(
    "click",
    () => {
      document.body.removeChild(contextMenu);
    },
    { once: true }
  );
}
function renamePlaylist(playlist) {
  const newName = prompt("Enter the new name for the playlist:");
  if (newName !== null && newName !== "") {
    playlist.name = newName;
    saveData();
    displayPlaylists();
  }
}
function addSongsToPlaylist(playlist) {
  const songsToAdd = prompt(
    "Enter the names of the songs to add (comma-separated):"
  );
  if (songsToAdd !== null && songsToAdd !== "") {
    const songNames = songsToAdd.split(",");
    songNames.forEach((songName) => {
      const matchingSongs = playlist.filter(
        (song) => song.name === songName.trim()
      );
      if (matchingSongs.length > 0) {
        matchingSongs.forEach((matchingSong) => {
          if (!matchingSong.playlists.includes(playlist.id)) {
            matchingSong.playlists.push(playlist.id);
          }
        });
      }
    });
    saveData();
    displayPlaylists();
  }
}
function deletePlaylist(playlist) {
  const confirmDelete = confirm(
    `Are you sure you want to delete the playlist "${playlist.name}"?`
  );
  if (confirmDelete) {
    const index = playlists.indexOf(playlist);
    playlists.splice(index, 1);
    saveData();
    displayPlaylists();
  }
}
function playNextSong(playlist) {
  if (currentIndex < playlist.length - 1) {
    currentIndex++;
    playSong(playlist, currentIndex);
  }
}
function playPreviousSong() {
  if (currentIndex > 0) {
    currentIndex--;
    playSong(currentIndex);
  }
}

function toggleShuffle() {
  const shuffleButton = document.getElementById("shuffle");
  if (shuffleButton.textContent === "Shuffle Off") {
    shuffleButton.textContent = "Shuffle On";
    shuffleButton.classList.add("active");
  } else {
    shuffleButton.textContent = "Shuffle Off";
    shuffleButton.classList.remove("active");
  }
}
function shufflePlaylist(playlistId) {
  const playlist = playlists.find((playlist) => playlist.id === playlistId);
  if (playlist) {
    const shuffledSongs = shuffleArray(playlist.songs);
    playlist.songs = shuffledSongs;
    saveData();
    displayPlaylists();
  }
}
function shuffleArray(array) {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
}
document
  .getElementById("fileInput")
  .addEventListener("change", handleFileUpload);
document
  .getElementById("createPlaylist")
  .addEventListener("click", createPlaylist);
document.getElementById("uploadSong").addEventListener("click", function () {
  document.getElementById("fileInput").click();
});
loadData();
displayStores();
if (playlists.length > 0) {
  displayPlaylists();
}
