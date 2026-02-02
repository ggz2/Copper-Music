# Music Player

## Overview

A web-based music player application inspired by Spotify's desktop interface. The application allows users to upload local music folders and play audio files through a browser-based interface with equalizer controls. Built collaboratively with ChatGPT assistance.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Single Page Application**: Static HTML/CSS/JavaScript served from the `public` directory
- **UI Framework**: Vanilla JavaScript with no frontend framework dependencies
- **Styling**: Custom CSS with CSS variables for theming (Spotify-inspired dark theme)
- **Icons**: Font Awesome 6.0 for UI icons

### Audio Processing
- **Web Audio API**: Used for audio playback and equalizer functionality
- **Equalizer**: 3-band equalizer (Bass at 60Hz, Mid at 600Hz, Treble at 12kHz) using BiquadFilter nodes
- **Local File Handling**: Uses the browser's File System API with `webkitdirectory` attribute for folder uploads

### Backend Architecture
- **Server**: Express.js 5.x minimal server
- **Static File Serving**: Express static middleware serves the `public` directory
- **Port**: Runs on port 5000, bound to 0.0.0.0 for external access
- **Entry Point**: `server.js` (note: package.json lists `app.js` as main, but actual server is `server.js`)

### Design Patterns
- **Client-Side Only Audio**: All audio processing happens in the browser; server only serves static files
- **No Database**: Playlist and track data stored in browser memory only
- **No Authentication**: Open access, no user accounts

## External Dependencies

### NPM Packages
- **express** (^5.2.1): Web server framework for serving static files

### CDN Resources
- **Font Awesome 6.0**: Icon library loaded from cdnjs.cloudflare.com

### Browser APIs
- **Web Audio API**: For audio playback and equalizer effects
- **File System Access**: For local folder uploads via file input

### No External Services
- No external APIs or databases are used
- All functionality is client-side after initial page load