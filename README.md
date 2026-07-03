# Spotify Harmony - PP3 Dashboard Project

A premium, interactive Spotify web application and statistics dashboard. This application integrates with the Spotify Web API to authenticate users, fetch personal listening trends, search catalog items, analyze track audio features, and showcase interactive visualizations.

## Project Overview

**Spotify Harmony** bridges the gap between raw music metadata and user experience. It provides users with deep insights into their music preferences by calculating average tempo, key profiles, energy, valence, and danceability from their top tracks.

### Key Features
- **User Authentication**: Secure OAuth2 Authorization Code Flow to log users in via their Spotify account.
- **Listening Statistics**: Display top artists, tracks, and genres over short, medium, and long-term ranges.
- **Audio Analytics**: Interactive visualizers representing valence, acousticness, tempo, and energy profiles of user playlists.
- **Recommendation Engine**: Custom playlist creation based on chosen seeds (acousticness, danceability, energy).
- **Global Search**: Deep catalog lookup for tracks, artists, and albums.

---

## Prerequisites

To install and run this application locally, you will need the following installed:
- **Node.js**: `v18.0.0` or higher (LTS recommended)
- **npm**: `v9.0.0` or higher
- **Modern Web Browser**: Google Chrome, Mozilla Firefox, Microsoft Edge, or Apple Safari (supporting ES6 modules, CSS Custom Properties, and Fetch API)
- **Spotify Developer Account**: To register your client app and fetch your custom Client ID and Client Secret from the [Spotify Developer Dashboard](https://developer.spotify.com/).

---

## Getting Started

Follow these step-by-step instructions to get a working development environment up and running on your local machine.

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd pp3-spotify-app
```

### 2. Install Project Dependencies
Run the following command to download and install node packages specified in the `package.json`:
```bash
npm install
```

### 3. Setup Your Environment Variables
Duplicate the template file `.env.example` and name the new copy `.env`:
```bash
cp .env.example .env
```
Open `.env` in your text editor and populate the variables:
- `PORT`: Set your preferred local development port (defaults to `5005`).
- `SPOTIFY_CLIENT_ID`: Your Spotify Application Client ID.
- `SPOTIFY_CLIENT_SECRET`: Your Spotify Application Client Secret.
- `SPOTIFY_REDIRECT_URI`: Set to `http://localhost:5005/api/callback` (must match your Spotify Developer App redirect URIs).

### 4. Run the Development Server
Launch the application with nodemon monitoring for automated file updates:
```bash
npm run dev
```
You should see a console confirmation indicating that the server is successfully active.

---

## Links

- **Local Backend API Health check**: [http://localhost:5005/api/health](http://localhost:5005/api/health)
- **Local Application Root**: [http://localhost:5005/](http://localhost:5005/)
- **Staging / Deployment Build**: *To be updated upon deployment in Week 4*
- **GitHub Repository**: [https://github.com/wah804/pp3-spotify-app](https://github.com/wah804/pp3-spotify-app)

---

## Project Roadmap & Milestones

The following sections define our milestones and tickets across the 4-week course.

### Milestone 1: Week 1 – Project Scaffolding & Initial Backend
*Goal: Initialize repository, write documentation, define backlog, and build backend scaffold with environment variable configuration.*
- [x] **Ticket PP3-1.1**: Initialize project folder and local/remote git repository.
- [x] **Ticket PP3-1.2**: Write comprehensive `README.md` with project specifications.
- [x] **Ticket PP3-1.3**: Set up Express backend and load configurations via `.env`.
- [x] **Ticket PP3-1.4**: Define project milestones and issues within GitHub.

### Milestone 2: Week 2 – Spotify Authentication & API Routing
*Goal: Establish secure OAuth2 connection with Spotify and create backend wrapper routes.*
- [ ] **Ticket PP3-2.1**: Set up Spotify Developer Dashboard configuration and credentials.
- [ ] **Ticket PP3-2.2**: Implement OAuth2 Authorization Code Flow endpoint handlers (`/api/login`, `/api/callback`).
- [ ] **Ticket PP3-2.3**: Build backend endpoints for Spotify search (`/api/search`) and profile details (`/api/me`).
- [ ] **Ticket PP3-2.4**: Implement access token refresh flow to maintain user sessions seamlessly.

### Milestone 3: Week 3 – Frontend Integration & Dashboard UI
*Goal: Build an elegant user interface to communicate with backend APIs.*
- [ ] **Ticket PP3-3.1**: Build landing screen and Spotify login authorization button.
- [ ] **Ticket PP3-3.2**: Develop Dashboard UI showing user top artists and listening statistics.
- [ ] **Ticket PP3-3.3**: Create interactive search component to preview and select tracks.
- [ ] **Ticket PP3-3.4**: Integrate visualizations representing track audio feature analysis.

### Milestone 4: Week 4 – Staging Deployment, Testing & Polish
*Goal: Deploy working application, test functionality, and polish UX/UI.*
- [ ] **Ticket PP3-4.1**: Set up unit/integration tests for server endpoints.
- [ ] **Ticket PP3-4.2**: Configure production deployment (e.g. Render / Railway).
- [ ] **Ticket PP3-4.3**: Perform performance and accessibility (a11y) audits.
- [ ] **Ticket PP3-4.4**: Conduct code cleanup, final repository polish, and submission checks.
