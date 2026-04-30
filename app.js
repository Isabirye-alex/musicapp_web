const STORAGE = {
    user: 'little_music_current_user',
    users: 'little_music_registered_users',
    uploads: 'little_music_uploaded_songs',
    recent: 'little_music_recent_tracks',
};

const API_BASE_URL = 'https://musicapp-api-6y2l.onrender.com/api/v1'; // Adjust if your backend is on a different port

let songs = []; // Will be loaded from backend

const DEFAULT_UPLOADS = [
    {
        id: 'u1',
        userId: 'demo',
        title: 'Sunset Theme',
        artist: 'Your Name',
        thumbnail: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
        favorite: false,
    },
    {
        id: 'u1',
        userId: 'demo',
        title: 'Sunset Theme',
        artist: 'Your Name',
        thumbnail: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
        favorite: false,
    },
];

const pageContent = document.getElementById('pageContent');
const navTabs = document.getElementById('navTabs');
const authPanel = document.getElementById('authPanel');
const playerSlab = document.getElementById('playerSlab');
const playerThumbnail = document.getElementById('playerThumbnail');
const playerTitle = document.getElementById('playerTitle');
const playerArtist = document.getElementById('playerArtist');
const favoriteButton = document.getElementById('favoriteButton');
const prevButton = document.getElementById('prevButton');
const playPauseButton = document.getElementById('playPauseButton');
const nextButton = document.getElementById('nextButton');
const playerProgress = document.getElementById('playerProgress');
const playerModal = document.getElementById('playerModal');
const toastContainer = document.getElementById('toastContainer');
const audioPlayer = document.getElementById('audioPlayer');

const appState = {
    currentPage: 'library',
    sortOrder: 'newest',
    currentUser: loadStorage(STORAGE.user) || null,
    users: loadStorage(STORAGE.users) || [],
    uploads: loadStorage(STORAGE.uploads) || [...DEFAULT_UPLOADS],
    recentlyPlayed: loadStorage(STORAGE.recent) || [],
    currentPlaylist: [],
    currentIndex: -1,
    isPlaying: false,
    editProfileMode: false,
    authRedirect: 'library',
    libraryPage: 1,
    isLoadingSongs: false,
};

function loadStorage(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function saveStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-message alert alert-${type} alert-dismissible fade show`;
    toast.role = 'alert';
    toast.innerHTML = `
    <div>${message}</div>
    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 3200);
}

async function fetchSongs() {
    appState.isLoadingSongs = true;
    render(); // Show loading state
    try {
        const response = await fetch(`${API_BASE_URL}/songs/platform/all?limit=100&offset=0&sort=newest`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        songs = data.map(song => ({
            id: song.song_id,
            title: song.song_name,
            artist: song.artist_name,
            thumbnail: song.thumbnail_url,
            audioUrl: song.song_url,
            favorite: song.is_favorite,
        }));
        console.log('Songs loaded from backend:', songs.length);
    } catch (error) {
        console.error('Failed to fetch songs from backend:', error);
        showToast('Failed to load songs from backend. Using placeholders.', 'warning');
        // Fallback to placeholder data if backend is down
        songs = [
            {
                id: '1',
                title: 'Night Drive',
                artist: 'Atlas Beats',
                thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
                audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                favorite: false,
            },
            {
                id: '2',
                title: 'Summer Pulse',
                artist: 'Luna Wave',
                thumbnail: 'https://images.unsplash.com/photo-1519985176271-adb1088fa94c?auto=format&fit=crop&w=400&q=80',
                audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
                favorite: true,
            },
            {
                id: '3',
                title: 'City Lights',
                artist: 'Nova Groove',
                thumbnail: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=400&q=80',
                audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
                favorite: false,
            },
            {
                id: '4',
                title: 'Golden Hour',
                artist: 'Echo Harbor',
                thumbnail: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=400&q=80',
                audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
                favorite: false,
            },
            {
                id: '5',
                title: 'Moonlight Fall',
                artist: 'Skyline Pulse',
                thumbnail: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80',
                audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
                favorite: false,
            },
        ];
    } finally {
        appState.isLoadingSongs = false;
        render();
    }
}

function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

function getDisplayName() {
    if (!appState.currentUser) return 'Guest';
    return `${appState.currentUser.firstName}`;
}

function updateAuthPanel() {
    const loggedIn = Boolean(appState.currentUser);
    authPanel.innerHTML = loggedIn
        ? `
      <div class="auth-panel">
        <span>Hi, <strong>${getDisplayName()}</strong></span>
        <button class="btn btn-sm btn-outline-light" id="authActionButton">Log Out</button>
      </div>
    `
        : `
      <div class="auth-panel">
        <button class="btn btn-sm btn-outline-light" id="authActionButton">Log In</button>
      </div>
    `;
    const authActionButton = document.getElementById('authActionButton');
    authActionButton?.addEventListener('click', () => {
        if (appState.currentUser) {
            logout();
        } else {
            navigateTo('login');
        }
    });
}

function navigateTo(page) {
    appState.currentPage = page;
    appState.editProfileMode = false;
    if ((page === 'login' || page === 'signup') && !appState.authRedirect) {
        appState.authRedirect = 'library';
    }
    render();
}

function render() {
    navTabs.querySelectorAll('.nav-link').forEach((button) => {
        button.classList.toggle('active', button.dataset.tab === appState.currentPage);
    });
    updateAuthPanel();
    switch (appState.currentPage) {
        case 'library':
            renderLibrary();
            break;
        case 'uploads':
            renderUploads();
            break;
        case 'recent':
            renderRecent();
            break;
        case 'profile':
            renderProfile();
            break;
        case 'login':
            renderLogin();
            break;
        case 'signup':
            renderSignup();
            break;
        default:
            renderLibrary();
    }
}

function sortedSongs() {
    const list = [...songs];
    if (appState.sortOrder === 'oldest') {
        return list.reverse();
    }
    if (appState.sortOrder === 'name') {
        return list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
}

function displayedSongs() {
    const limit = appState.libraryPage * 8;
    return sortedSongs().slice(0, limit);
}

function renderLibrary() {
    if (appState.isLoadingSongs) {
        pageContent.innerHTML = `
        <div class="d-flex justify-content-center align-items-center" style="min-height: 200px;">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <span class="ms-3">Loading songs from backend...</span>
        </div>
      `;
        return;
    }

    const displayed = displayedSongs();
    const hasMore = displayed.length < songs.length;
    pageContent.innerHTML = `
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
      <div>
        <h2 class="mb-1">Community Songs</h2>
        <p class="text-muted mb-0">Discover new music from the community.</p>
      </div>
      <div class="btn-group" role="group" aria-label="Sort options">
        <button type="button" class="btn btn-outline-light ${appState.sortOrder === 'newest' ? 'active' : ''}" data-sort="newest">Newest</button>
        <button type="button" class="btn btn-outline-light ${appState.sortOrder === 'oldest' ? 'active' : ''}" data-sort="oldest">Oldest</button>
        <button type="button" class="btn btn-outline-light ${appState.sortOrder === 'name' ? 'active' : ''}" data-sort="name">Name</button>
      </div>
    </div>
    <div class="row g-4" id="songGrid"></div>
    ${hasMore ? '<div class="text-center mt-4"><button class="btn btn-outline-primary" id="loadMoreButton">Load More</button></div>' : ''}
  `;

    const grid = document.getElementById('songGrid');
    if (displayed.length === 0) {
        grid.innerHTML = '<div class="col-12 text-center text-muted">No songs available.</div>';
    } else {
        displayed.forEach((song, index) => {
            const card = document.createElement('div');
            card.className = 'col-12 col-md-6 col-xl-3';
            card.innerHTML = `
      <div class="card h-100 overflow-hidden">
        <img src="${song.thumbnail}" class="card-img-top" alt="${song.title}" />
        <div class="card-body d-flex flex-column">
          <h5 class="card-title mb-1">${song.title}</h5>
          <p class="card-text text-muted mb-3">${song.artist}</p>
          <div class="mt-auto d-flex justify-content-between align-items-center gap-2">
            <span class="badge bg-secondary">Community</span>
            <button class="btn btn-sm btn-outline-primary play-now" data-id="${song.id}" data-index="${index}">Play</button>
          </div>
        </div>
      </div>
    `;
            grid.appendChild(card);
        });
    }

    pageContent.querySelectorAll('[data-sort]').forEach((button) => {
        button.addEventListener('click', () => {
            appState.sortOrder = button.dataset.sort;
            appState.libraryPage = 1;
            renderLibrary();
        });
    });

    pageContent.querySelectorAll('.play-now').forEach((button) => {
        button.addEventListener('click', () => {
            const songId = button.dataset.id;
            const song = songs.find((item) => item.id === songId);
            if (song) setCurrentSong(song, displayed);
        });
    });

    const loadMoreButton = document.getElementById('loadMoreButton');
    if (loadMoreButton) {
        loadMoreButton.addEventListener('click', () => {
            appState.libraryPage += 1;
            renderLibrary();
        });
    }
}

function renderUploads() {
    if (!appState.currentUser) {
        return renderLoginPrompt('Upload songs and manage your contributions.', 'uploads');
    }

    const userUploads = appState.uploads.filter((item) => item.userId === appState.currentUser.id);
    pageContent.innerHTML = `
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
      <div>
        <h2 class="mb-1">Your Uploads</h2>
        <p class="text-muted mb-0">Manage and preview the songs you uploaded.</p>
      </div>
      <button class="btn btn-primary" id="uploadButton">Upload</button>
    </div>
    ${userUploads.length === 0 ? '<div class="alert alert-secondary">No uploads yet — add your first song below.</div>' : ''}
    <div class="row g-4" id="uploadGrid"></div>
    <div class="mt-4 card auth-form-card p-4">
      <h5 class="mb-3">Upload a song</h5>
      <form id="uploadForm">
        <div class="row g-3">
          <div class="col-md-4"><input class="form-control" id="uploadTitle" placeholder="Song title" required /></div>
          <div class="col-md-4"><input class="form-control" id="uploadArtist" placeholder="Artist name" required /></div>
          <div class="col-md-4"><input class="form-control" id="uploadThumbnail" placeholder="Thumbnail URL" required /></div>
          <div class="col-12"><input class="form-control" id="uploadAudioUrl" placeholder="Audio URL" required /></div>
          <div class="col-12 text-end"><button class="btn btn-success" type="submit">Add Upload</button></div>
        </div>
      </form>
    </div>
  `;

    const grid = document.getElementById('uploadGrid');
    userUploads.forEach((song) => {
        const card = document.createElement('div');
        card.className = 'col-12 col-md-6 col-xl-4';
        card.innerHTML = `
      <div class="card h-100 overflow-hidden">
        <img src="${song.thumbnail}" class="card-img-top" alt="${song.title}" />
        <div class="card-body d-flex flex-column">
          <h5 class="card-title mb-1">${song.title}</h5>
          <p class="card-text text-muted mb-3">${song.artist}</p>
          <div class="mt-auto d-flex justify-content-between align-items-center gap-2">
            <span class="badge bg-secondary">Uploaded</span>
            <button class="btn btn-sm btn-outline-primary play-upload" data-id="${song.id}">Play</button>
          </div>
        </div>
      </div>
    `;
        grid.appendChild(card);
    });

    document.getElementById('uploadForm').addEventListener('submit', (event) => {
        event.preventDefault();
        const title = document.getElementById('uploadTitle').value.trim();
        const artist = document.getElementById('uploadArtist').value.trim();
        const thumbnail = document.getElementById('uploadThumbnail').value.trim();
        const audioUrl = document.getElementById('uploadAudioUrl').value.trim();

        if (!title || !artist || !thumbnail || !audioUrl) {
            showToast('Please fill all upload fields.', 'warning');
            return;
        }

        const newSong = {
            id: generateId('u'),
            userId: appState.currentUser.id,
            title,
            artist,
            thumbnail,
            audioUrl,
            favorite: false,
        };

        appState.uploads.unshift(newSong);
        saveStorage(STORAGE.uploads, appState.uploads);
        showToast('Upload added successfully.');
        renderUploads();
    });

    pageContent.querySelectorAll('.play-upload').forEach((button) => {
        button.addEventListener('click', () => {
            const songId = button.dataset.id;
            const song = appState.uploads.find((item) => item.id === songId);
            if (song) setCurrentSong(song, userUploads);
        });
    });
}

function renderRecent() {
    const tracks = appState.recentlyPlayed;
    if (tracks.length === 0) {
        pageContent.innerHTML = `
      <div class="card prompt-card p-4 text-center">
        <h3>No recently played tracks</h3>
        <p class="text-muted">Play a song from the library or your uploads to populate this list.</p>
      </div>
    `;
        return;
    }

    pageContent.innerHTML = `
    <div class="mb-3">
      <h2 class="mb-1">Recently Played</h2>
      <p class="text-muted mb-0">Your latest tracks are ready to resume.</p>
    </div>
    <div class="list-group" id="recentList"></div>
  `;
    const recentList = document.getElementById('recentList');
    tracks.forEach((song) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'list-group-item list-group-item-action bg-dark border-0 mb-2';
        item.innerHTML = `
      <div class="d-flex align-items-center">
        <img src="${song.thumbnail}" class="rounded me-3" width="56" height="56" alt="${song.title}" />
        <div class="text-start flex-grow-1">
          <div class="fw-bold">${song.title}</div>
          <div class="text-muted small">${song.artist}</div>
        </div>
        <span class="badge bg-primary">Resume</span>
      </div>
    `;
        item.addEventListener('click', () => setCurrentSong(song, tracks));
        recentList.appendChild(item);
    });
}

function renderProfile() {
    if (!appState.currentUser) {
        return renderLoginPrompt('Edit your profile, manage account details, and log out.', 'profile');
    }

    if (appState.editProfileMode) {
        pageContent.innerHTML = `
      <div class="card auth-form-card p-4 mx-auto" style="max-width: 720px;">
        <h3>Edit Profile</h3>
        <form id="profileEditForm">
          <div class="row g-3 mt-3">
            <div class="col-md-6">
              <label class="form-label">First name</label>
              <input class="form-control" id="firstNameField" value="${appState.currentUser.firstName}" required />
            </div>
            <div class="col-md-6">
              <label class="form-label">Last name</label>
              <input class="form-control" id="lastNameField" value="${appState.currentUser.lastName}" required />
            </div>
            <div class="col-12">
              <label class="form-label">Email</label>
              <input class="form-control" id="emailField" type="email" value="${appState.currentUser.email}" required />
            </div>
          </div>
          <div class="d-flex justify-content-between align-items-center mt-4">
            <button type="submit" class="btn btn-primary">Save Changes</button>
            <button type="button" class="btn btn-outline-light" id="cancelEditButton">Cancel</button>
          </div>
        </form>
      </div>
    `;

        document.getElementById('profileEditForm').addEventListener('submit', (event) => {
            event.preventDefault();
            const firstName = document.getElementById('firstNameField').value.trim();
            const lastName = document.getElementById('lastNameField').value.trim();
            const email = document.getElementById('emailField').value.trim();

            if (!firstName || !lastName || !email) {
                showToast('Please complete all profile fields.', 'warning');
                return;
            }

            appState.currentUser.firstName = firstName;
            appState.currentUser.lastName = lastName;
            appState.currentUser.email = email;
            updateUserInStorage();
            appState.editProfileMode = false;
            showToast('Profile updated successfully.');
            renderProfile();
        });

        document.getElementById('cancelEditButton').addEventListener('click', () => {
            appState.editProfileMode = false;
            renderProfile();
        });
        return;
    }

    const joinedAt = new Date(appState.currentUser.joinedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    pageContent.innerHTML = `
    <div class="row g-4 align-items-start">
      <div class="col-lg-4">
        <div class="card p-4 text-center">
          <div class="avatar rounded-circle mb-4" style="width:120px;height:120px;background:#4f9eff;display:inline-flex;align-items:center;justify-content:center;font-size:2rem;">${appState.currentUser.firstName[0] || 'A'}</div>
          <h3 class="mb-1">${appState.currentUser.firstName} ${appState.currentUser.lastName}</h3>
          <p class="text-muted mb-3">Music creator & listener</p>
          <div class="d-flex justify-content-center gap-2 flex-wrap">
            <span class="badge bg-secondary">Active</span>
            <span class="badge bg-secondary">${appState.uploads.filter((song) => song.userId === appState.currentUser.id).length} uploads</span>
          </div>
        </div>
      </div>
      <div class="col-lg-8">
        <div class="card p-4">
          <div class="d-flex justify-content-between align-items-start mb-4">
            <div>
              <h4>Profile</h4>
              <p class="text-muted mb-0">Manage account settings and log out.</p>
            </div>
            <button class="btn btn-outline-light" id="editProfileButton">Edit</button>
          </div>
          <dl class="row text-muted">
            <dt class="col-sm-4">First name</dt><dd class="col-sm-8">${appState.currentUser.firstName}</dd>
            <dt class="col-sm-4">Last name</dt><dd class="col-sm-8">${appState.currentUser.lastName}</dd>
            <dt class="col-sm-4">Email</dt><dd class="col-sm-8">${appState.currentUser.email}</dd>
            <dt class="col-sm-4">User ID</dt><dd class="col-sm-8">${appState.currentUser.id}</dd>
            <dt class="col-sm-4">Joined</dt><dd class="col-sm-8">${joinedAt}</dd>
          </dl>
          <button class="btn btn-outline-danger mt-4" id="logoutButton">Log Out</button>
        </div>
      </div>
    </div>
  `;

    document.getElementById('editProfileButton').addEventListener('click', () => {
        appState.editProfileMode = true;
        renderProfile();
    });

    document.getElementById('logoutButton').addEventListener('click', logout);
}

function renderLoginPrompt(message, sourcePage) {
    pageContent.innerHTML = `
    <div class="card prompt-card mx-auto p-4 text-center" style="max-width: 720px;">
      <h3>${message}</h3>
      <p class="text-muted">You need to be logged in to continue.</p>
      <div class="d-flex justify-content-center gap-3 flex-wrap mt-3">
        <button class="btn btn-primary" id="loginNowButton">Log In</button>
        <button class="btn btn-outline-light" id="signupNowButton">Sign Up</button>
      </div>
    </div>
  `;

    document.getElementById('loginNowButton').addEventListener('click', () => {
        appState.authRedirect = sourcePage;
        navigateTo('login');
    });
    document.getElementById('signupNowButton').addEventListener('click', () => {
        appState.authRedirect = sourcePage;
        navigateTo('signup');
    });
}

function renderLogin() {
    pageContent.innerHTML = `
    <div class="card auth-form-card mx-auto p-4" style="max-width: 500px;">
      <h3>Welcome Back</h3>
      <p class="text-muted">Log in to access your uploads, profile, and favorites.</p>
      <form id="loginForm" class="mt-3">
        <div class="mb-3">
          <label class="form-label">Email</label>
          <input type="email" class="form-control" id="loginEmail" required />
        </div>
        <div class="mb-3">
          <label class="form-label">Password</label>
          <input type="password" class="form-control" id="loginPassword" required />
        </div>
        <button class="btn btn-primary w-100" type="submit">Log In</button>
      </form>
      <p class="text-center text-muted mt-3">Don't have an account? <button class="btn btn-link p-0" id="goToSignup">Sign up here</button></p>
    </div>
  `;

    document.getElementById('loginForm').addEventListener('submit', (event) => {
        event.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        login(email, password);
    });
    document.getElementById('goToSignup').addEventListener('click', () => navigateTo('signup'));
}

function renderSignup() {
    pageContent.innerHTML = `
    <div class="card auth-form-card mx-auto p-4" style="max-width: 500px;">
      <h3>Create Account</h3>
      <p class="text-muted">Sign up to upload songs and personalize your profile.</p>
      <form id="signupForm" class="mt-3">
        <div class="row g-3">
          <div class="col-6">
            <label class="form-label">First name</label>
            <input class="form-control" id="signupFirstName" required />
          </div>
          <div class="col-6">
            <label class="form-label">Last name</label>
            <input class="form-control" id="signupLastName" required />
          </div>
        </div>
        <div class="mb-3 mt-3">
          <label class="form-label">Email</label>
          <input type="email" class="form-control" id="signupEmail" required />
        </div>
        <div class="mb-3">
          <label class="form-label">Password</label>
          <input type="password" class="form-control" id="signupPassword" required />
        </div>
        <button class="btn btn-primary w-100" type="submit">Sign Up</button>
      </form>
      <p class="text-center text-muted mt-3">Already have an account? <button class="btn btn-link p-0" id="goToLogin">Log in here</button></p>
    </div>
  `;

    document.getElementById('signupForm').addEventListener('submit', (event) => {
        event.preventDefault();
        const firstName = document.getElementById('signupFirstName').value.trim();
        const lastName = document.getElementById('signupLastName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value.trim();
        signup(firstName, lastName, email, password);
    });
    document.getElementById('goToLogin').addEventListener('click', () => navigateTo('login'));
}

function login(email, password) {
    if (!email || !password) {
        showToast('Please fill in both fields.', 'warning');
        return;
    }

    const existing = appState.users.find((user) => user.email.toLowerCase() === email.toLowerCase() && user.password === password);
    if (!existing) {
        showToast('Invalid credentials. Please try again.', 'danger');
        return;
    }

    appState.currentUser = { ...existing };
    delete appState.currentUser.password;
    saveStorage(STORAGE.user, appState.currentUser);
    showToast(`Welcome back, ${existing.firstName}!`);
    appState.currentPage = appState.authRedirect || 'library';
    render();
}

function signup(firstName, lastName, email, password) {
    if (!firstName || !lastName || !email || !password) {
        showToast('Please complete all fields.', 'warning');
        return;
    }

    if (!validateEmail(email)) {
        showToast('Please enter a valid email.', 'warning');
        return;
    }

    if (appState.users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
        showToast('Email already registered. Please log in.', 'danger');
        return;
    }

    const newUser = {
        id: generateId('user'),
        firstName,
        lastName,
        email,
        password,
        joinedAt: new Date().toISOString(),
    };
    appState.users.push(newUser);
    saveStorage(STORAGE.users, appState.users);
    showToast('Account created. Please log in.');
    appState.currentPage = 'login';
    render();
}

function updateUserInStorage() {
    if (!appState.currentUser) return;
    saveStorage(STORAGE.user, appState.currentUser);
    const index = appState.users.findIndex((user) => user.id === appState.currentUser.id);
    if (index >= 0) {
        const currentPassword = appState.users[index].password;
        appState.users[index] = {
            ...appState.users[index],
            ...appState.currentUser,
            password: currentPassword,
        };
        saveStorage(STORAGE.users, appState.users);
    }
}

function logout() {
    appState.currentUser = null;
    saveStorage(STORAGE.user, null);
    showToast('Logged out successfully.', 'success');
    appState.currentPage = 'library';
    render();
}

function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function setCurrentSong(song, playlist = [
    ...appState.uploads,
    ...songs,
]) {
    appState.currentPlaylist = playlist;
    appState.currentIndex = playlist.findIndex((item) => item.id === song.id);
    appState.currentSong = playlist[appState.currentIndex];
    if (!appState.currentSong) return;

    audioPlayer.src = appState.currentSong.audioUrl;
    audioPlayer.play().catch(() => { });
    appState.isPlaying = true;
    updateRecentlyPlayed(appState.currentSong);
    updatePlayerUI();
}

function updateRecentlyPlayed(song) {
    appState.recentlyPlayed = appState.recentlyPlayed.filter((item) => item.id !== song.id);
    appState.recentlyPlayed.unshift(song);
    if (appState.recentlyPlayed.length > 6) {
        appState.recentlyPlayed.pop();
    }
    saveStorage(STORAGE.recent, appState.recentlyPlayed);
}

function updatePlayerUI() {
    if (!appState.currentSong) {
        playerSlab.classList.add('d-none');
        return;
    }
    playerSlab.classList.remove('d-none');
    playerThumbnail.src = appState.currentSong.thumbnail;
    playerTitle.textContent = appState.currentSong.title;
    playerArtist.textContent = appState.currentSong.artist;
    favoriteButton.classList.toggle('btn-danger', appState.currentSong.favorite);
    favoriteButton.textContent = appState.currentSong.favorite ? '♥' : '♡';
    playPauseButton.textContent = appState.isPlaying ? '⏸' : '▶';
    const progress = audioPlayer.duration ? (audioPlayer.currentTime / audioPlayer.duration) * 100 : 0;
    playerProgress.style.width = `${progress}%`;
}

function togglePlayerModal() {
    if (!appState.currentSong) return;
    appState.playerModalOpen = !appState.playerModalOpen;
    if (appState.playerModalOpen) {
        renderPlayerModal();
        playerModal.classList.remove('d-none');
    } else {
        playerModal.classList.add('d-none');
    }
}

function renderPlayerModal() {
    if (!appState.currentSong) return;

    playerModal.innerHTML = `
    <div class="modal-card position-relative">
      <button class="close-modal" id="closePlayerModal">✕</button>
      <img src="${appState.currentSong.thumbnail}" alt="${appState.currentSong.title}" />
      <div class="mt-4">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <h3>${appState.currentSong.title}</h3>
            <p class="text-muted mb-0">${appState.currentSong.artist}</p>
          </div>
          <button class="btn btn-outline-primary" id="playerFavoriteButton">${appState.currentSong.favorite ? '♥ Favorited' : '♡ Favorite'}</button>
        </div>
        <div class="mt-4">
          <input type="range" id="playerSeek" class="form-range" min="0" max="100" value="0" />
          <div class="d-flex justify-content-between text-muted small">
            <span id="currentTime">0:00</span>
            <span id="durationTime">0:00</span>
          </div>
        </div>
        <div class="d-flex justify-content-center align-items-center gap-3 mt-4">
          <button class="btn btn-outline-light" id="playerPrev">⏮</button>
          <button class="btn btn-primary" id="playerPauseToggle">${appState.isPlaying ? '⏸' : '▶'}</button>
          <button class="btn btn-outline-light" id="playerNext">⏭</button>
        </div>
        <div class="d-flex justify-content-between text-muted mt-4">
          <span>Shuffle</span>
          <span>Loop</span>
        </div>
      </div>
    </div>
  `;

    document.getElementById('closePlayerModal').addEventListener('click', () => {
        appState.playerModalOpen = false;
        playerModal.classList.add('d-none');
    });
    document.getElementById('playerPauseToggle').addEventListener('click', () => {
        if (audioPlayer.paused) {
            audioPlayer.play();
            appState.isPlaying = true;
        } else {
            audioPlayer.pause();
            appState.isPlaying = false;
        }
        updatePlayerUI();
        renderPlayerModal();
    });
    document.getElementById('playerPrev').addEventListener('click', previousSong);
    document.getElementById('playerNext').addEventListener('click', nextSong);
    document.getElementById('playerFavoriteButton').addEventListener('click', () => {
        toggleFavorite();
        renderPlayerModal();
    });

    const seek = document.getElementById('playerSeek');
    seek.value = audioPlayer.duration ? ((audioPlayer.currentTime / audioPlayer.duration) * 100).toFixed(2) : 0;
    seek.addEventListener('input', () => {
        const value = Number(seek.value);
        if (audioPlayer.duration) {
            audioPlayer.currentTime = (value / 100) * audioPlayer.duration;
            updatePlayerUI();
        }
    });

    document.getElementById('currentTime').textContent = formatSeconds(audioPlayer.currentTime);
    document.getElementById('durationTime').textContent = formatSeconds(audioPlayer.duration || 0);
}

function formatSeconds(value) {
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
}

function previousSong() {
    if (appState.currentIndex > 0) {
        const prev = appState.currentPlaylist[appState.currentIndex - 1];
        if (prev) setCurrentSong(prev, appState.currentPlaylist);
    }
}

function nextSong() {
    if (appState.currentIndex < appState.currentPlaylist.length - 1) {
        const next = appState.currentPlaylist[appState.currentIndex + 1];
        if (next) setCurrentSong(next, appState.currentPlaylist);
    }
}

function toggleFavorite() {
    if (!appState.currentSong) return;
    appState.currentSong.favorite = !appState.currentSong.favorite;
    updatePlayerUI();
    const stored = appState.uploads.find((item) => item.id === appState.currentSong.id);
    if (stored) {
        stored.favorite = appState.currentSong.favorite;
        saveStorage(STORAGE.uploads, appState.uploads);
    }
}

function playPauseLocal() {
    if (!appState.currentSong) return;
    if (audioPlayer.paused) {
        audioPlayer.play();
        appState.isPlaying = true;
    } else {
        audioPlayer.pause();
        appState.isPlaying = false;
    }
    updatePlayerUI();
}

function bindGlobalListeners() {
    navTabs.addEventListener('click', (event) => {
        const button = event.target.closest('[data-tab]');
        if (!button) return;
        appState.currentPage = button.dataset.tab;
        appState.editProfileMode = false;
        render();
    });

    favoriteButton.addEventListener('click', () => {
        toggleFavorite();
    });

    playPauseButton.addEventListener('click', () => {
        playPauseLocal();
    });

    prevButton.addEventListener('click', previousSong);
    nextButton.addEventListener('click', nextSong);

    playerSlab.addEventListener('click', (event) => {
        if (event.target.closest('button')) return;
        togglePlayerModal();
    });

    audioPlayer.addEventListener('timeupdate', () => {
        updatePlayerUI();
        if (appState.playerModalOpen) {
            renderPlayerModal();
        }
    });

    audioPlayer.addEventListener('ended', () => {
        nextSong();
    });
}

function initApp() {
    bindGlobalListeners();
    updateAuthPanel();
    fetchSongs();
}

initApp();
