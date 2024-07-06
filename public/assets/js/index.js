// JavaScript code goes here
const audioPlayer = document.getElementById('audioPlayer');
const fileInput = document.getElementById('fileInput');
const playlistsDiv = document.getElementById('playlists');
const uploadSongButton = document.getElementById('uploadSong');
const apiUrl = localStorage.getItem("apiUrl") || `/api/fetch`;

if (localStorage.getItem("isShuffleOn") === undefined) {
    localStorage.setItem("isShuffleOn", "false")
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('/offline-sw.js', { scope: '/' }).then(function (registration) {
            console.log('Service Worker registered with scope:', registration.scope);
        }).catch(function (error) {
            console.log('Service Worker registration failed:', error);
        });
    });
}

async function download() {
    const urlElement = document.getElementById("downloadUrl");
  
    const url = urlElement.value;
    if (!url) {
        console.error("URL is empty");
        return;
    }
  
    const req = {
        url,
        isAudioOnly: true
    };
  
    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            body: JSON.stringify(req),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
  
        const data = await response.json();
        const downloadUrl = data.url;
        const proxiedUrl = "/api/proxy/" + encodeURIComponent(downloadUrl);
        console.log(proxiedUrl);
        const fetchedUrl = await fetch(proxiedUrl);
        const blob = await fetchedUrl.blob();

        const arrayBuffer = await blob.arrayBuffer();

        jsmediatags.read(blob, {
            onSuccess: async (tag) => {
                const title = tag.tags.title || url;
                const picture = tag.tags.picture;
                const imageUrl = picture ? URL.createObjectURL(new Blob([new Uint8Array(picture.data)], { type: picture.format })) : '';

                const dataUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        resolve(reader.result.replace(/^data:application\/octet-stream/, 'data:audio/mp3'));
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(new Blob([blob], { type: 'audio/mp3' }));
                });

                // Load audio stores from LocalForage or initialize empty stores
                let audioStores = await localforage.getItem('audioStores');
                audioStores = audioStores || Array.from({ length: 45 }, () => []);

                // Find the first available store with less than 10 items
                let storeFound = false;
                for (let i = 0; i < audioStores.length; i++) {
                    if (audioStores[i].length < 10) {
                        audioStores[i].push({
                            name: title,
                            image: imageUrl,
                            data: dataUrl
                        });
                        storeFound = true;
                        break;
                    }
                }

                if (!storeFound) {
                    console.error('No available store found.');
                } else {
                    // Update audio stores in LocalForage
                    await localforage.setItem('audioStores', audioStores);
                }

                console.log("Downloaded and saved:", dataUrl);
            },
            onError: (error) => {
                console.error("Error reading tags:", error);
            }
        });
    } catch (error) {
        console.error("Error:", error);
    }
}


async function initializePlayer() {
    // Load audio stores from localForage or initialize empty stores
    let audioStoresPromise = localforage.getItem('audioStores');

    // Wait for the promise to resolve
    let audioStores = await audioStoresPromise;

    audioStores = audioStores || Array.from({ length: 45 }, () => []);

    // Update audio stores in localForage
    await localforage.setItem('audioStores', audioStores);

    // Set the last played MP3
    const lastPlayedMP3 = await localforage.getItem("lastPlayed");
    if (lastPlayedMP3) {
        audioPlayer.src = lastPlayedMP3;
    }

    renderMP3s();
}

function showPageFromHash() {
    let hash = window.location.hash.slice(1);
    console.log("Original hash:", hash); // Log the original hash
    // Remove leading '/' if present
    if (hash.startsWith('/')) {
        hash = hash.slice(1);
    }
    console.log("Processed hash:", hash); // Log the processed hash
    const pages = document.querySelectorAll('.page');
    let pageToShow = document.getElementById('mainPage');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    const targetPage = document.getElementById(hash);
    if (targetPage) {
        pageToShow = targetPage;
        console.log("Showing page:", targetPage); // Log the target page
    } else {
        console.log("No page found for hash:", hash); // Log if no page is found
    }
    pageToShow.classList.add('active');
}

window.addEventListener('load', showPageFromHash);
window.addEventListener('hashchange', showPageFromHash);

async function renderMP3s() {
    try {
        const audioStores = await localforage.getItem('audioStores');
        const mp3Container = document.getElementById('mp3-container');
        mp3Container.innerHTML = ''; // Clear previous content

        if (!audioStores || !Array.isArray(audioStores)) {
            console.error('Invalid or missing audio stores.');
            return;
        }

        audioStores.forEach((store, storeIndex) => {
            if (Array.isArray(store)) {
                store.forEach((mp3, mp3Index) => {
                    if (mp3 && typeof mp3 === 'object' && mp3.data && mp3.name) {
                        const mp3Element = document.createElement('div');
                        mp3Element.classList.add('mp3-item');

                        const mp3Image = document.createElement("img");
                        mp3Image.src =  mp3.image || "/assets/imgs/music.png";;
                        mp3Image.style.height = "80px";
                        mp3Image.style.width = "80px";


                        const titleElement = document.createElement('h5');
                        const truncatedName = mp3.name.length > 20 ? mp3.name.substring(0, 20) + '...' : mp3.name;
                        titleElement.textContent = truncatedName;
                        titleElement.style.width = "80px";
                        titleElement.title = mp3.name;

                        mp3Element.appendChild(mp3Image);
                        mp3Element.appendChild(titleElement);

                        mp3Element.onclick = function () {
                            audioPlayer.src = mp3.data;
                            localforage.setItem("lastPlayed", mp3.data);
                            playSong(mp3)
                        }

                        // Append MP3 element to the container
                        mp3Container.appendChild(mp3Element);

                        // Add right-click context menu
                        mp3Element.addEventListener('contextmenu', (event) => {
                            event.preventDefault();
                            const menu = document.createElement('div');
                            menu.classList.add('context-menu');
                            const playOption = document.createElement('div');
                            playOption.textContent = 'Play';
                            playOption.addEventListener('click', () => playSong(mp3));
                            const downloadOption = document.createElement('div');
                            downloadOption.textContent = 'Download';
                            downloadOption.addEventListener('click', () => downloadSong(mp3));
                            const deleteOption = document.createElement('div');
                            deleteOption.textContent = 'Delete';
                            deleteOption.addEventListener('click', () => deleteSong(storeIndex, mp3Index));
                            menu.appendChild(playOption);
                            menu.appendChild(downloadOption);
                            menu.appendChild(deleteOption);
                            menu.style.top = `${event.clientY}px`;
                            menu.style.left = `${event.clientX}px`;
                            document.body.appendChild(menu);
                            // Close menu on click outside
                            document.addEventListener('click', closeContextMenu);
                        });
                    }
                });
            }
        });
    } catch (error) {
        console.error('Error while rendering MP3s:', error);
    }
}

// Function to close the context menu
function closeContextMenu() {
    const menu = document.querySelector('.context-menu');
    if (menu) {
        menu.remove();
        document.removeEventListener('click', closeContextMenu);
    }
}

// Function to play a song
function playSong(mp3) {
    if (!mp3) {
        audioPlayer.src = audioPlayer.src;
    } else {
        audioPlayer.src = mp3.data;
        localforage.setItem("lastPlayed", mp3.data);
    }
    audioPlayer.play();
}

// Function to download a song
function downloadSong(mp3) {
    const a = document.createElement('a');
    a.href = mp3.data;
    a.download = mp3.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Function to delete a song
async function deleteSong(storeIndex, mp3Index) {
    try {
        // Retrieve audio stores data
        let audioStores = await localforage.getItem('audioStores');

        // Ensure audioStores is an array
        if (!Array.isArray(audioStores)) {
            console.error('Invalid or missing audio stores.');
            return;
        }

        // Remove the specified song from the audio stores
        audioStores[storeIndex].splice(mp3Index, 1);

        // Update audio stores in local storage
        await localforage.setItem('audioStores', audioStores);

        // Re-render MP3s after deletion
        renderMP3s();
    } catch (error) {
        console.error('Error while deleting song:', error);
    }
}

// Function to handle file selection
fileInput.addEventListener('change', handleFileSelect);
uploadSongButton.addEventListener('click', () => fileInput.click());

function handleFileSelect(event) {
    const files = event.target.files;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('audio/')) { // Check if file is an audio file
            const reader = new FileReader();
            reader.onload = async (event) => {
                const arrayBuffer = event.target.result;

                // Read tags from the audio file
                jsmediatags.read(new Blob([arrayBuffer]), {
                    onSuccess: async (tag) => {
                        const title = tag.tags.title || file.name;
                        const picture = tag.tags.picture;
                        let imageUrl = '/assets/imgs/music.png'; // Default image if no picture tag found

                        if (picture) {
                            const dataUrl = await convertBlobToDataURL(new Blob([picture.data], { type: picture.format }));
                            imageUrl = dataUrl;
                        }

                        const dataUrl = await convertBlobToDataURL(new Blob([arrayBuffer], { type: 'audio/mp3' }));

                        // Load audio stores from localForage or initialize empty stores
                        let audioStores = await localforage.getItem('audioStores');
                        audioStores = audioStores || Array.from({ length: 45 }, () => []);

                        // Find the first available store with less than 10 items
                        let storeFound = false;
                        for (let j = 0; j < audioStores.length; j++) {
                            if (audioStores[j].length < 10) {
                                audioStores[j].push({
                                    name: title,
                                    image: imageUrl,
                                    data: dataUrl
                                });
                                storeFound = true;
                                break;
                            }
                        }

                        if (!storeFound) {
                            console.error('No available store found.');
                        } else {
                            // Update audio stores in localForage
                            await localforage.setItem('audioStores', audioStores);
                        }

                        console.log("Uploaded and saved:", dataUrl);
                        renderMP3s();
                    },
                    onError: (error) => {
                        console.error("Error reading tags:", error);
                    }
                });
            };
            reader.readAsArrayBuffer(file);
        }
    }
}

// Function to convert Blob to Data URL
function convertBlobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Function to change the store number
function changeStoreNumber(newStoreNumber) {
    if (newStoreNumber > 45) {
        console.error('New store number exceeds maximum limit');
        return;
    }
    let audioStores = JSON.parse(localforage.getItem('audioStores'));
    audioStores.length = newStoreNumber;
    // Update audio stores in localforage
    localforage.setItem('audioStores', JSON.stringify(audioStores));
}

// Function to close the context menu
function closeContextMenu() {
    const menu = document.querySelector('.context-menu');
    if (menu) {
        menu.remove();
        document.removeEventListener('click', closeContextMenu);
    }
}

const playPauseButton = document.getElementById('play');

function updatePlayPauseState() {
    if (audioPlayer.paused) {
        if (audioPlayer.currentTime > 0 && !audioPlayer.ended) {
            playPauseButton.innerHTML = '<span class="material-symbols-outlined">play_arrow</span>';
        } else {
            playPauseButton.innerHTML = '<span class="material-symbols-outlined">play_arrow</span>';
        }
    } else {
        playPauseButton.innerHTML = '<span class="material-symbols-outlined">pause</span>';
    }
}

playPauseButton.addEventListener('click', () => {
    if (audioPlayer.paused) {
        audioPlayer.play();
    } else {
        audioPlayer.pause();
    }
    updatePlayPauseState();
});

audioPlayer.addEventListener('play', updatePlayPauseState);
audioPlayer.addEventListener('pause', updatePlayPauseState);
audioPlayer.addEventListener('ended', updatePlayPauseState);

// Initialize the button text on page load
updatePlayPauseState();

document.getElementById('rewind').addEventListener('click', () => audioPlayer.currentTime -= 5);
document.getElementById('forward').addEventListener('click', () => audioPlayer.currentTime += 5);
const repeatButton = document.getElementById('repeat');
// Repeat states
const repeatStates = ['noRepeat', 'repeatOne', 'repeatAll'];
let currentRepeatStateIndex = 0; // Default to No Repeat

// Function to update the repeat state
function updateRepeatState() {
    const currentState = repeatStates[currentRepeatStateIndex];

    switch (currentState) {
        case 'noRepeat':
            audioPlayer.loop = false;
            audioPlayer.removeEventListener('ended', playNextSong);
            repeatButton.innerHTML = '<span class="material-symbols-outlined">repeat</span>';
            break;
        case 'repeatOne':
            audioPlayer.loop = true;
            audioPlayer.addEventListener('ended', () => {
                audioPlayer.currentTime = 0;
                audioPlayer.play();
            });
            repeatButton.innerHTML = '<span class="material-symbols-outlined">repeat_one_on</span>';
            break;
        case 'repeatAll':
            audioPlayer.loop = false;
            audioPlayer.addEventListener('ended', playNextSong);
            repeatButton.innerHTML = '<span class="material-symbols-outlined">repeat_on</span>';
            break;
    }

    // Save the current state to localforage
    localforage.setItem('repeatState', currentRepeatStateIndex);
}

// Event listener for the repeat button
repeatButton.addEventListener('click', () => {
    currentRepeatStateIndex = (currentRepeatStateIndex + 1) % repeatStates.length;
    updateRepeatState();
});

// Initialize the repeat state on page load
async function initializeRepeatState() {
    const savedStateIndex = await localforage.getItem('repeatState');
    if (savedStateIndex !== null) {
        currentRepeatStateIndex = savedStateIndex;
    }
    updateRepeatState();
}

// Call the initialize function on page load
initializeRepeatState();

const shuffleButton = document.getElementById('shuffle');

// Function to update the shuffle state
function updateShuffleState() {
    const isShuffleOn = localStorage.getItem("isShuffleOn") === "true";
    if (isShuffleOn) {
        shuffleButton.innerHTML = '<span class="material-symbols-outlined">shuffle_on</span>';
    } else {
        shuffleButton.innerHTML = '<span class="material-symbols-outlined">shuffle</span>';
    }
}

// Event listener for the shuffle button
shuffleButton.addEventListener('click', () => {
    const isShuffleOn = localStorage.getItem("isShuffleOn") === "true";
    localStorage.setItem("isShuffleOn", !isShuffleOn);
    updateShuffleState();
});

function playNextSong() {
    // Get current playlist and song index
    let currentPlaylistIndex = 0;
    let currentSongIndex = 0;
    const playlists = JSON.parse(localforage.getItem('playlists'));
    const currentPlaylist = playlists[currentPlaylistIndex];
    if (!currentPlaylist) return;

    // Find the current song index within the playlist
    for (let i = 0; i < playlists.length; i++) {
        if (playlists[i].songs.includes(audioPlayer.src)) {
            currentPlaylistIndex = i;
            currentSongIndex = playlists[i].songs.findIndex(song => song.data === audioPlayer.src);
            break;
        }
    }

    // Check if shuffle is enabled
    const isShuffleOn = localStorage.getItem("isShuffleOn") === "true";

    if (isShuffleOn) {
        // Implement shuffle logic to play a random song
        const randomPlaylistIndex = Math.floor(Math.random() * playlists.length);
        const randomSongIndex = Math.floor(Math.random() * playlists[randomPlaylistIndex].songs.length);
        const randomSong = playlists[randomPlaylistIndex].songs[randomSongIndex];
        audioPlayer.src = randomSong.data;
        audioPlayer.play();
    } else {
        const nextSongIndex = currentSongIndex + 1;
        if (nextSongIndex < currentPlaylist.songs.length) {
            const nextSong = currentPlaylist.songs[nextSongIndex];
            audioPlayer.src = nextSong.data;
            audioPlayer.play();
        } else {
            // End of playlist, stop playback
            audioPlayer.pause();
        }
    }
}

// Initialize the shuffle state on page load
function initializeShuffleState() {
    if (localStorage.getItem("isShuffleOn") === null) {
        localStorage.setItem("isShuffleOn", "false");
    }
    updateShuffleState();
}

initializeShuffleState();


initializePlayer();
