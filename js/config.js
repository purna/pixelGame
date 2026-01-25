// Game Configuration
const gameConfig = {
    // Game state variables
    gameStarted: false,
    currentLevel: 1,
    score: 0,
    collectablesCollected: 0,
    
    // Player configuration
    player: {
        position: { x: 50, y: 350 },
        velocity: { x: 0, y: 0 },
        width: 45,
        height: 60,
        speed: 7,
        jumping: false,
        jumpHeight: 9, // Jump height power variable
        crouchHeight: 40
    },
    
    // Game mechanics
    backgroundSpeed: 0.5,
    gravity: 0.5,
    
    // Enemy configuration
    enemy: {
        speed: 2,
        patrolRange: 100
    },
    
    // Game elements
    elements: {
        platforms: [],
        collectables: [],
        checkpoints: [],
        enemies: [],
        scenes: [],
        boxes: []
    },
    
    // Texture configuration
    textures: {
        platform: 'diagonal-stripes',
        checkpoint: 'radiant-gradient',
        scene: 'repeating-chevrons',
        box: 'stacked-steps-haikei'
    },
    
    // Fallback colors for when textures fail to load
    fallbackColors: {
        'platform': '#000',
        'checkpoint': 'green',
        'scene': '#121ca0ff',
        'box': '#8B4513',
        'collectable': 'gold',
        'enemy': 'red',
        'player': 'blue'
    },
    
    // NPC messages configuration - reference ink JSON and playback options
    // Each entry is an array for the level. You may optionally place a first element with only a `repeat` field
    // to apply the repeat rule to all following options in that array. Example:
    // 1: [ { repeat: { type: 'times', count: 4 } }, { path: 'storyA.json' }, { path: 'storyB.json' } ]
    npcMessages: {
        1: [
            { repeat: { type: 'times', count: 4 } },
            { path: 'assets/dialogue/Story/Chapter_01/The Basket.json' },
            { path: 'assets/dialogue/Story/Chapter_01/The River\'s Gift.json' },
            { path: 'assets/dialogue/Story/Chapter_01/The Basket.json' }
        ],
        2: [
            { repeat: { type: 'times', count: 4 } },
            { path: 'assets/dialogue/Story/Chapter_01/The Basket.json' },
            { path: 'assets/dialogue/Story/Chapter_01/The River\'s Gift.json' },
            { path: 'assets/dialogue/Story/Chapter_01/The Basket.json' }
        ],
        3: [
            { repeat: { type: 'times', count: 4 } },
            { path: 'assets/dialogue/Story/Chapter_03/Flight into the Desert.json' },
            { path: 'assets/dialogue/Story/Chapter_02/The Hidden Name.json' },
            { path: 'assets/dialogue/Story/Chapter_01/The Basket.json' }
        ]
    }
};