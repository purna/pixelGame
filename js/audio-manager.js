// Audio Manager for Pixel Game
// Handles all sound effects using Howler.js

class AudioManager {
    constructor() {
        this.sounds = {};
        this.initialized = false;
        this.backgroundMusic = null;
    }

    init() {
        if (this.initialized) return;
        
        console.log('Initializing AudioManager...');
        
        // Initialize all sound effects (use local assets/audio/ - no CDN needed)
        const localCollectableCandidates = ['assets/audio/collectable.mp3'];
        const localCheckpointCandidates = ['assets/audio/checkpoint.mp3'];
        const localNpcCandidates = ['assets/audio/npc.mp3'];
        
        const collectableSrcFallback = 'assets/audio/collectable.mp3';
        const checkpointSrcFallback = 'assets/audio/checkpoint.mp3';
        const npcSrcFallback = 'assets/audio/npc.mp3';
        
        // Try each local candidate in order; on error try next, finally fall back to CDN.
        function tryCreateHowlWithCandidates(key, candidates, fallback, volume) {
            const tryNext = (idx) => {
                if (idx >= candidates.length) {
                    this.sounds[key] = new Howl({ src:[fallback], volume, preload:true, onload: () => console.log(`${key} sound loaded (fallback)`), onloaderror: () => console.error('Failed to load ' + key + ' sound') });
                    return;
                }
                const url = candidates[idx];
                this.sounds[key] = new Howl({
                    src: [url],
                    volume,
                    preload: true,
                    onload: () => console.log(`${key} sound loaded (local: ${url})`),
                    onloaderror: () => { console.warn(`${key} local sound failed (${url}), trying next`); tryNext(idx+1); }
                });
            };
            tryNext(0);
        }

        tryCreateHowlWithCandidates.call(this, 'collectable', localCollectableCandidates, collectableSrcFallback, 0.5);
        tryCreateHowlWithCandidates.call(this, 'checkpoint', localCheckpointCandidates, checkpointSrcFallback, 0.7);
        tryCreateHowlWithCandidates.call(this, 'npc', localNpcCandidates, npcSrcFallback, 0.6);

        // Initialize background music
        this.backgroundMusic = new Howl({
            src: ['assets/audio/background.mp3'],
            volume: 0.3,
            loop: true,
            preload: true,
            onload: () => console.log('Background music loaded'),
            onloaderror: () => console.error('Failed to load background music')
        });

        this.initialized = true;
        console.log('AudioManager initialized successfully');
    }

    playCollectable() {
        if (!this.initialized) {
            console.warn('AudioManager not initialized');
            return;
        }
        this.sounds.collectable.play();
    }

    playCheckpoint() {
        if (!this.initialized) {
            console.warn('AudioManager not initialized');
            return;
        }
        this.sounds.checkpoint.play();
    }

    playNPC() {
        if (!this.initialized) {
            console.warn('AudioManager not initialized');
            return;
        }
        this.sounds.npc.play();
    }

    // Background music controls
    playBackgroundMusic() {
        if (!this.initialized) {
            console.warn('AudioManager not initialized');
            return;
        }
        this.backgroundMusic.play();
    }

    stopBackgroundMusic() {
        if (!this.initialized) {
            console.warn('AudioManager not initialized');
            return;
        }
        this.backgroundMusic.stop();
    }

    // Global access to audio manager
    static getInstance() {
        if (!window.audioManager) {
            window.audioManager = new AudioManager();
        }
        return window.audioManager;
    }

    // Mute/unmute all sounds
    setMuted(muted) {
        Howler.mute(muted);
    }

    // Set global volume
    setVolume(volume) {
        Howler.volume(volume);
    }
}

// Initialize audio manager when script loads
window.audioManager = new AudioManager();
audioManager.init();