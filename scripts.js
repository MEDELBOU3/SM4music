const clientId = '55e0f9f2d9844ebca5e70e16885306b4';
const clientSecret = '7496abd0cd17410abfe156fb56bc4e95';
let accessToken = '';
let currentTrackIndex = 0;
let playlistData = [];
let popularSongsData = [];
let genresData = [];
let currentGenre = '';
let searchResultsData = [];
let playlistOffset = 0;
const playlistLimit = 10;

async function getAccessToken() {
    const result = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
        },
        body: 'grant_type=client_credentials'
    });
    const data = await result.json();
    accessToken = data.access_token;
}

async function fetchData(endpoint) {
    const result = await fetch(`https://api.spotify.com/v1/${endpoint}`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    return result.json();
}

async function loadPlaylist() {
    const data = await fetchData(`playlists/37i9dQZF1DXcBWIGoYBM5M/tracks?offset=${playlistOffset}&limit=${playlistLimit}`);
    playlistData = playlistData.concat(data.items);
    const playlist = document.getElementById('playlist');
    playlist.innerHTML += data.items.map((item, index) => `
        <li onclick="playTrack(${playlistOffset + index}, 'playlist')">
            <img src="${item.track.album.images[0].url}" alt="${item.track.name}" style=" outline: 2px solid rgba(0, 0, 0, 0.1);">
            ${item.track.name} - ${item.track.artists[0].name}
            <button style=" background-color: transparent; paddig-left:10px; outline: ; border: none; "><i style="font-size: 25px; color: #fff;"class="fas fa-play"></i></button>
        </li>
    `).join('');
    playlistOffset += playlistLimit;
    if (data.items.length < playlistLimit) {
        document.getElementById('load-more-playlist').style.display = 'none';
    }
}

async function fetchLyrics(track) {
    const searchUrl = `https://api.lyrics.ovh/v1/${track.artists[0].name}/${track.name}`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (data.lyrics) {
        const lyrics = data.lyrics.split('\n');
        displayLyrics(lyrics);
    } else {
        document.getElementById('lyrics-content').innerText = 'Lyrics not found.';
    }
}

function displayLyrics(lyrics) {
    const lyricsContainer = document.getElementById('lyrics-content');
    lyricsContainer.innerHTML = '';
    lyrics.forEach(line => {
        const p = document.createElement('p');
        p.innerText = line;
        lyricsContainer.appendChild(p);
    });
}
//*mbdla*
function playTrack(index, type) {
    let track;
    if (type === 'playlist') {
        track = playlistData[index].track;
    } else if (type === 'popular') {
        track = popularSongsData[index].track;
    } else if (type === 'genre') {
        track = genresData[index].track;
    } else if (type === 'search') {
        track = searchResultsData[index];
    } else if (type === 'album') {
        track = albumsData[index].track;
    } else if (type == 'recommended') {
        track = recommendedTracks[index].track;
    } 
    currentTrackId = track.id;
    document.getElementById('current-track-title').innerText = track.name;
    document.getElementById('current-track-artist').innerText = track.artists[0].name;

    const audioPlayer = document.getElementById('audio-player');
    const audioSource = document.getElementById('audio-source');
    const header = document.getElementById('header');
    
    audioSource.src = track.preview_url || '';
    header.style.backgroundImage = `url(${track.album.images[0].url})`;

    if (audioSource.src) {
        audioPlayer.load();
        audioPlayer.play();
    }

    initializeTrackData(track.id);
    // Fetch and display lyrics
    fetchLyrics(track);


}

function playNextTrack() {
    do {
        currentTrackIndex = (currentTrackIndex + 1) % playlistData.length;
    } while (!playlistData[currentTrackIndex].track.preview_url);
    playTrack(currentTrackIndex, 'playlist');
}

function playPrevTrack() {
    do {
        currentTrackIndex = (currentTrackIndex - 1 + playlistData.length) % playlistData.length;
    } while (!playlistData[currentTrackIndex].track.preview_url);
    playTrack(currentTrackIndex, 'playlist');
}



async function loadPopularSongs() {
    const data = await fetchData('playlists/37i9dQZF1DXcBWIGoYBM5M/tracks');
    popularSongsData = data.items;
    const popularSongs = document.getElementById('popular-songs');
    popularSongs.innerHTML = popularSongsData.map((item, index) => `
        <div class="song-item">
            <img src="${item.track.album.images[0].url}" alt="${item.track.name}">
            <p>${item.track.name}</p>
            <button onclick="playTrack(${index}, 'popular');" style="background-color: transparent; outline: none; border: none; display: flex;">
                <i style="font-size: 25px; color: #fff;" class="fas fa-play"></i>
            </button>
            <button onclick="likeTrack(${index}, 'popular'); event.stopPropagation();" style="background-color: transparent; outline: none; border: none; align-items: flex-end;  justify-items: end;">
                <i style="font-size: 25px; color: #fff;" class="fas fa-heart"></i>
            </button>
        </div>
    `).join('');
}








async function loadPopularArtists() {
    const data = await fetchData('artists?ids=1vCWHaC5f2uS3yhpwWbIA6,7H55rcKCfwqkyDFH9wpKM6,3TVXtAsR1Inumwj472S9r4,66CXWjxzNUsdJxJ2JdwvnR');
    const popularArtists = document.getElementById('popular-artists');
    popularArtists.innerHTML = data.artists.map(artist => `
        <div class="artist-item">
            <img src="${artist.images[0].url}" alt="${artist.name}">
            <p>${artist.name}</p>
        </div>
    `).join('');
}

async function loadGenres() {
    const data = await fetchData('browse/categories');
    genresData = data.categories.items;
    const genres = document.getElementById('genres');
    genres.innerHTML = genresData.map((item, index) => `
        <div class="genre-item" onclick="loadGenreSongs('${item.id}')">
            <img src="${item.icons[0].url}" alt="${item.name}" style=" display= flex;">
            <p>${item.name}</p>
        </div>
    `).join('');
}



async function loadGenreSongs(genreId) {
    currentGenre = genreId;
    const data = await fetchData(`browse/categories/${genreId}/playlists`);
    const playlists = data.playlists.items;
    if (playlists.length > 0) {
        const genrePlaylistId = playlists[0].id;
        const genrePlaylistData = await fetchData(`playlists/${genrePlaylistId}/tracks`);
        genresData = genrePlaylistData.items;
        const popularSongs = document.getElementById('popular-songs');
        popularSongs.innerHTML = genresData.map((item, index) => `
            <div class="song-item">
                <img src="${item.track.album.images[0].url}" alt="${item.track.name}">
                <p>${item.track.name}</p>
                <button onclick="playTrack(${index}, 'genre');" style="background-color: transparent; outline: none; border: none;">
                    <i style="font-size: 25px; color: #fff;" class="fas fa-play"></i>
                </button>
                <button class="like-btn-genre-${index}" onclick="likeTrack(${index}, 'genre'); event.stopPropagation();" style="background-color: transparent; outline: none; border: none;">
                    <i style="font-size: 25px; color: ${likedTracks.has(item.track.id) ? 'green' : 'white'};" class="fas fa-heart"></i>
                </button>
            </div>
        `).join('');
    }
}




function updateLikeButton(index, type, trackId) {
    const likeButton = document.querySelector(`.like-btn-${type}-${index}`);
    if (likeButton) {
        if (likedTracks.has(trackId)) {
            likeButton.querySelector('i').style.color = 'green';
        } else {
            likeButton.querySelector('i').style.color = 'white';
        }
    }
}





async function searchTracks(query) {
    const data = await fetchData(`search?q=${query}&type=track`);
    searchResultsData = data.tracks.items;
    const searchResultsContainer = document.getElementById('popular-songs');
    searchResultsContainer.innerHTML = searchResultsData.map((item, index) => `
        <div class="song-item">
            <img src="${item.album.images[0].url}" alt="${item.name}">
            <p>${item.name}</p>
            <button onclick="playTrack(${index}, 'search');" style="background-color: transparent; outline: none; border: none;">
                <i style="font-size: 25px; color: #fff;" class="fas fa-play"></i>
            </button>
            <button class="like-btn-search-${index}" onclick="likeTrack(${index}, 'search'); event.stopPropagation();" style="background-color: transparent; outline: none; border: none;">
                <i style="font-size: 25px; color: ${likedTracks.has(item.id) ? 'green' : 'white'};" class="fas fa-heart"></i>
            </button>
        </div>
    `).join('');
}




document.getElementById('next-btn').addEventListener('click', playNextTrack);
document.getElementById('prev-btn').addEventListener('click', playPrevTrack);
document.getElementById('load-more-playlist').addEventListener('click', loadPlaylist);

document.getElementById('search-btn').addEventListener('click', () => {
    const query = document.getElementById('search-input').value;
    searchTracks(query);
});

document.getElementById('play-btn').addEventListener('click', () => {
    const audioPlayer = document.getElementById('audio-player');
    audioPlayer.play();
});

document.getElementById('pause-btn').addEventListener('click', () => {
    const audioPlayer = document.getElementById('audio-player');
    audioPlayer.pause();
});




//laode albums
async function loadAlbums() {
    const data = await fetchData('browse/new-releases');
    const albumsData = data.albums.items;
    const albums = document.getElementById('albums');
    albums.innerHTML = albumsData.map((item, index) => `
        <div class="album-item" onclick="loadAlbumTracks('${item.id}')">
            <img src="${item.images[0].url}" alt="${item.name}">
            <p>${item.name} - ${item.artists[0].name}</p>
            <button onclick="likeTrack(${index}, 'album'); event.stopPropagation();" style="background-color: transparent; outline: none; border: none;">
                <i style="font-size: 25px; color: #fff;" class="fas fa-heart"></i>
            </button>
        </div>
    `).join('');
}




async function loadAlbumTracks(albumId) {
    const data = await fetchData(`albums/${albumId}/tracks`);
    const albumTracksData = data.items;
    const popularSongs = document.getElementById('popular-songs');
    popularSongs.innerHTML = albumTracksData.map((item, index) => `
        <div class="song-item" onclick="playTrack(${index}, 'album', '${albumId}')">
            <img src="${item.album.images[0].url}" alt="${item.name}">
            <p>${item.name}</p>
        </div>
    `).join('');
}







window.onload = async () => {
    await getAccessToken();
    await loadPlaylist();
    await loadPopularSongs();
    await loadPopularArtists();
    await loadGenres();
    await loadAlbums();
}

//reaction

async function loadPlaylist() {
    const data = await fetchData(`playlists/37i9dQZF1DXcBWIGoYBM5M/tracks?offset=${playlistOffset}&limit=${playlistLimit}`);
    playlistData = playlistData.concat(data.items);
    const playlist = document.getElementById('playlist');
    playlist.innerHTML += data.items.map((item, index) => `
        <li onclick="playTrack(${playlistOffset + index}, 'playlist')">
            <img src="${item.track.album.images[0].url}" alt="${item.track.name}" style="outline: 2px solid rgba(0, 0, 0, 0.1);">
            ${item.track.name} - ${item.track.artists[0].name}
            <button style="background-color: transparent; padding-left:10px; outline: none; border: none;">
                <i style="font-size: 25px; color: #fff;" class="fas fa-play"></i>
            </button>
            <button class="like-btn-playlist-${playlistOffset + index}" onclick="likeTrack(${playlistOffset + index}, 'playlist'); event.stopPropagation();" style="background-color: transparent; padding-left:10px; outline: none; border: none;">
                <i style="font-size: 25px; color: ${likedTracks.has(item.track.id) ? 'green' : 'white'};" class="fas fa-heart"></i>
            </button>
        </li>
    `).join('');
    playlistOffset += playlistLimit;
    if (data.items.length < playlistLimit) {
        document.getElementById('load-more-playlist').style.display = 'none';
    }
}




let currentTrackId = '';
let likedTracks = new Set(JSON.parse(localStorage.getItem('likedTracks')) || {});
let ratings = JSON.parse(localStorage.getItem('ratings')) || {};
let comments = JSON.parse(localStorage.getItem('comments')) || {};

// Load and display comments for the current track
function loadComments() {
    const commentsList = document.getElementById('comments-list');
    const trackComments = comments[currentTrackId] || [];
    commentsList.innerHTML = trackComments.map(comment => `
        <div class="comment">
            <p>${comment.text}</p>
            <small>${comment.date}</small>
        </div>
    `).join('');
}

// Event listener for submitting a comment
document.getElementById('submit-comment').addEventListener('click', () => {
    const commentInput = document.getElementById('comment-input');
    const commentText = commentInput.value.trim();
    if (commentText) {
        const comment = {
            text: commentText,
            date: new Date().toLocaleString()
        };
        commentInput.value = '';
        saveComment(comment);
    }
});

// Save a new comment for the current track
function saveComment(comment) {
    if (!comments[currentTrackId]) {
        comments[currentTrackId] = [];
    }
    comments[currentTrackId].push(comment);
    localStorage.setItem('comments', JSON.stringify(comments));
    loadComments();
}

// Initialize comments and ratings sections for the current track
function initializeTrackData(trackId) {
    currentTrackId = trackId;
    loadComments();
    loadRating();
}

// Load and display average rating for the current track
function loadRating() {
    const trackRatings = ratings[currentTrackId] || [];
    const total = trackRatings.reduce((acc, rating) => acc + rating, 0);
    const average = trackRatings.length ? (total / trackRatings.length).toFixed(1) : 0;
    document.getElementById('average-rating').innerText = `Average Rating: ${average}`;
}

// Save a new rating for the current track
function saveRating(rating) {
    if (!ratings[currentTrackId]) {
        ratings[currentTrackId] = [];
    }
    ratings[currentTrackId].push(rating);
    localStorage.setItem('ratings', JSON.stringify(ratings));
    loadRating();
}

// Event listeners for rating stars
document.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', (event) => {
        const rating = parseInt(event.target.getAttribute('data-value'));
        saveRating(rating);
    });
});

// Update the like button color based on track id
function updateLikeButton(index, type, trackId) {
    const likeButton = document.querySelector(`.like-btn-${type}-${index}`);
    if (likeButton) {
        if (likedTracks.has(trackId)) {
            likeButton.querySelector('i').style.color = 'green';
        } else {
            likeButton.querySelector('i').style.color = 'white';
        }
    }
}

// Handle like button color change and save
function likeTrack(index, type) {
    let track;
    if (type === 'playlist') {
        track = playlistData[index].track;
    } else if (type === 'popular') {
        track = popularSongsData[index].track;
    } else if (type === 'genre') {
        track = genresData[index].track;
    } else if (type === 'search') {
        track = searchResultsData[index];
    } else if (type === 'recommended') {
        track = recommendedTracks[index];
    }

    if (likedTracks.has(track.id)) {
        likedTracks.delete(track.id);
        alert(`Unliked: ${track.name} by ${track.artists[0].name}`);
    } else {
        likedTracks.add(track.id);
        alert(`Liked: ${track.name} by ${track.artists[0].name}`);
    }

    localStorage.setItem('likedTracks', JSON.stringify([...likedTracks]));
    updateLikeButton(index, type, track.id);
}

// Event listener to initialize track data on page load
document.addEventListener('DOMContentLoaded', async () => {
    await getAccessToken();
    loadPlaylist();
    loadPopularSongs();
    loadPopularArtists();
    loadRecommendedMusic(); // Load recommended music
});


























