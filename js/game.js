// Import modules
import { player, initPlayer, updatePlayer, canPlayerJump, checkPlatformCollisions } from './player.js';
import { updateEnemies } from './enemy.js';
import { checkCollectableCollisions } from './collectable.js';

document.addEventListener('DOMContentLoaded', () => {
    const startGameButton = document.getElementById('start-game');
    const gameContainer = document.querySelector('.game-container');
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const popup = document.getElementById('portfolio-popup');
    const closeBtn = document.querySelector('.close-btn');

    // Initialize Rough.js canvas variable
    let roughCanvas;

    // Set canvas size to full screen and scale with window
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // Initialize Rough.js canvas when size changes
        roughCanvas = rough.canvas(canvas);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Game state from config
    let gameStarted = gameConfig.gameStarted;
    let currentLevel = gameConfig.currentLevel;
    let score = gameConfig.score;
    let collectablesCollected = gameConfig.collectablesCollected;
    let gameOver = false;
    let animationId;
    let parallaxManager;
    let uiManager;
    
    // Camera variables for level scrolling
    let camera = {
        x: 0,
        y: 0
    };
    // Respawn position (last checkpoint or start). Initialized from config default start position.
    let respawnPosition = { x: gameConfig.player.position.x, y: gameConfig.player.position.y };

    // Simple physics variables
    let playerVelocity = { x: 0, y: 0 };
    let gravity = 0.5;
    let isJumping = false;
    let groundLevel;
    // Track previous jump state to emit landing effects
    let previousIsJumping = false;
    // Counter used to emit periodic running dust while moving
    let runDustCounter = 0;

    // Squash and stretch effect state
    let playerScaleX = 1;
    let playerScaleY = 1;
    let targetScaleX = 1;
    let targetScaleY = 1;

    // Initialize player
    initPlayer(gameConfig.player);
    // Ensure player input / movement is enabled by default
    player.disabled = false;

    // Initialize ground level after player is defined
    groundLevel = canvas.height - player.height;
    console.log('Initial ground level set to:', groundLevel, 'Canvas height:', canvas.height, 'Player height:', player.height);

    // Keys state
    const keys = {
        rightKey: { pressed: false },
        leftKey: { pressed: false }
    };

    // Game elements from config
    let platforms = [...gameConfig.elements.platforms];
    let checkpoints = [...gameConfig.elements.checkpoints];
    let backgrounds = [...gameConfig.elements.backgrounds || []];
    let scenes = [...gameConfig.elements.scenes || []];
    let boxes = [...gameConfig.elements.boxes || []];
    let npcs = [...gameConfig.elements.npcs || []];
    // Per-NPC repeat counters keyed by `${level}:${npcIndex}`
    let npcRepeatCounters = new Map();
    let collectables = [...gameConfig.elements.collectables];
    let enemies = [...gameConfig.elements.enemies];

    // Box physics - add velocity to each box
    let boxVelocities = [];

    // Texture manager
    let textureManager;

    // Player SVG image
    let playerSvg = new Image();
    let playerSvgLoaded = false;
    playerSvg.onload = function() {
        playerSvgLoaded = true;
        console.log('Player SVG loaded successfully');
    };

    playerSvg.onerror = function() {
        console.error('Failed to load player SVG');
    };

    // Set crossOrigin to prevent any container issues
    playerSvg.crossOrigin = 'anonymous';
    playerSvg.src = 'assets/player.svg';

    // Rough.js drawing cache to prevent animation
    let roughCache = {
        platforms: new Map(),
        collectables: new Map(),
        checkpoints: new Map(),
        enemies: new Map(),
        npcs: new Map(),
        scenes: new Map(),
        backgrounds: new Map(),
        player: null
    };

    // Load SVG level
    function loadSVGLevel(level) {
        fetch(`levels/level${level}.svg`)
            .then(response => response.text())
            .then(svgText => {
                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');

                // Get SVG viewBox dimensions
                const viewBox = svgDoc.documentElement.getAttribute('viewBox');
                const [, , svgWidth, svgHeight] = viewBox.split(' ').map(Number);

                // Calculate scale factor to fit vertically
                const scale = canvas.height / svgHeight;
                const scaledWidth = svgWidth * scale;

                // Parse border layer (defines level bounds)
                const borderElement = svgDoc.querySelector('#border rect');
                if (borderElement) {
                    // Some SVGs omit an explicit x/y on the border rect — default to 0 when missing
                    const borderXAttr = borderElement.getAttribute('x');
                    const borderYAttr = borderElement.getAttribute('y');
                    const borderX = borderXAttr !== null ? parseFloat(borderXAttr) * scale : 0;
                    const borderY = borderYAttr !== null ? parseFloat(borderYAttr) * scale : 0;
                    const borderWidth = parseFloat(borderElement.getAttribute('width')) * scale;
                    const borderHeight = parseFloat(borderElement.getAttribute('height')) * scale;

                    // camera is in outer scope - set total level width/height in world pixels
                    camera.levelWidth = borderX + borderWidth;
                    camera.levelHeight = borderY + borderHeight;
                } else {
                    // fallback to SVG viewBox width/height if no border layer is present
                    camera.levelWidth = scaledWidth;
                    camera.levelHeight = canvas.height;
                }

                // Parse startpoint (if provided in the level SVG) and place player there
                const startElement = svgDoc.querySelector('#startpoint rect');
                if (startElement) {
                    const startXAttr = startElement.getAttribute('x');
                    const startYAttr = startElement.getAttribute('y');
                    const startX = startXAttr !== null ? parseFloat(startXAttr) * scale : 0;
                    const startY = startYAttr !== null ? parseFloat(startYAttr) * scale : 0;

                    // Place player in world coordinates at the startpoint
                    player.position.x = startX;
                    player.position.y = startY;

                    // Update respawn position to the level start
                    respawnPosition = { x: startX, y: startY };

                    // Initialize camera so player is visible (clamped to level bounds)
                    camera.x = Math.max(0, Math.min(player.position.x - canvas.width / 2, Math.max(0, camera.levelWidth - canvas.width)));
                    camera.y = Math.max(0, Math.min(player.position.y - canvas.height / 2, Math.max(0, camera.levelHeight - canvas.height)));
                }

                // Parse platforms
                platforms = [];
                const platformElements = svgDoc.querySelectorAll('#platforms rect');
                platformElements.forEach(element => {
                    platforms.push({
                        position: {
                            x: parseFloat(element.getAttribute('x')) * scale,
                            y: parseFloat(element.getAttribute('y')) * scale
                        },
                        width: parseFloat(element.getAttribute('width')) * scale,
                        height: parseFloat(element.getAttribute('height')) * scale
                    });
                });

                // Parse collectables
                collectables = [];
                const collectableElements = svgDoc.querySelectorAll('#collectables rect');
                collectableElements.forEach(element => {
                    collectables.push({
                        position: {
                            x: parseFloat(element.getAttribute('x')) * scale,
                            y: parseFloat(element.getAttribute('y')) * scale
                        },
                        width: parseFloat(element.getAttribute('width')) * scale,
                        height: parseFloat(element.getAttribute('height')) * scale
                    });
                });

                // Parse scenes
                scenes = [];
                const sceneElements = svgDoc.querySelectorAll('#scenes rect');
                sceneElements.forEach(element => {
                    scenes.push({
                        position: {
                            x: parseFloat(element.getAttribute('x')) * scale,
                            y: parseFloat(element.getAttribute('y')) * scale
                        },
                        width: parseFloat(element.getAttribute('width')) * scale,
                        height: parseFloat(element.getAttribute('height')) * scale
                    });
                });

                // Parse boxes
                boxes = [];
                const boxElements = svgDoc.querySelectorAll('#boxes rect');
                boxElements.forEach((element, index) => {
                    boxes.push({
                        position: {
                            x: parseFloat(element.getAttribute('x')) * scale,
                            y: parseFloat(element.getAttribute('y')) * scale
                        },
                        width: parseFloat(element.getAttribute('width')) * scale,
                        height: parseFloat(element.getAttribute('height')) * scale,
                        velocity: { x: 0, y: 0 } // Add velocity for physics
                    });

                    // Initialize box velocity
                    boxVelocities[index] = { x: 0, y: 0 };
                });

                // Parse backgrounds
                backgrounds = [];
                const backgroundElements = svgDoc.querySelectorAll('#backgrounds rect');
                backgroundElements.forEach(element => {
                    backgrounds.push({
                        position: {
                            x: parseFloat(element.getAttribute('x')) * scale,
                            y: parseFloat(element.getAttribute('y')) * scale
                        },
                        width: parseFloat(element.getAttribute('width')) * scale,
                        height: parseFloat(element.getAttribute('height')) * scale
                    });
                });

                // Parse checkpoints
                checkpoints = [];
                const checkpointElements = svgDoc.querySelectorAll('#checkpoints rect');
                checkpointElements.forEach(element => {
                    checkpoints.push({
                        position: {
                            x: parseFloat(element.getAttribute('x')) * scale,
                            y: parseFloat(element.getAttribute('y')) * scale
                        },
                        width: parseFloat(element.getAttribute('width')) * scale,
                        height: parseFloat(element.getAttribute('height')) * scale,
                        claimed: false
                    });
                });

                // Parse enemies
                enemies = [];
                const enemyElements = svgDoc.querySelectorAll('#enemies rect');
                enemyElements.forEach(element => {
                    enemies.push({
                        position: {
                            x: parseFloat(element.getAttribute('x')) * scale,
                            y: parseFloat(element.getAttribute('y')) * scale
                        },
                        width: parseFloat(element.getAttribute('width')) * scale,
                        height: parseFloat(element.getAttribute('height')) * scale,
                        speed: gameConfig.enemy.speed,
                        direction: 1,
                        velocityY: 0
                    });
                });

                // Parse NPCs - handle both old and new formats
                npcs = [];
                const npcGroups = svgDoc.querySelectorAll('#npcs > g[id="npc"]');

                if (npcGroups.length > 0) {
                    // New format with show/hide layers
                    npcGroups.forEach((npcGroup, index) => {
                        const showRect = npcGroup.querySelector('#show rect');
                        const hideRect = npcGroup.querySelector('#hide rect');
                        const hideText = npcGroup.querySelector('#hide path');

                        if (showRect) {
                            npcs.push({
                                showLayer: {
                                    x: parseFloat(showRect.getAttribute('x')) * scale,
                                    y: parseFloat(showRect.getAttribute('y')) * scale,
                                    width: parseFloat(showRect.getAttribute('width')) * scale,
                                    height: parseFloat(showRect.getAttribute('height')) * scale
                                },
                                hideLayer: hideRect ? {
                                    x: parseFloat(hideRect.getAttribute('x')) * scale,
                                    y: parseFloat(hideRect.getAttribute('y')) * scale,
                                    width: parseFloat(hideRect.getAttribute('width')) * scale,
                                    height: parseFloat(hideRect.getAttribute('height')) * scale,
                                    text: hideText ? 'I' : ''
                                } : null,
                                message: getNPCMessage(currentLevel, index),
                                showHideLayer: false,
                                interacted: false
                            });
                        }
                    });
                } else {
                    // Old format - single rectangles
                    const npcElements = svgDoc.querySelectorAll('#npcs rect');
                    npcElements.forEach((element, index) => {
                        npcs.push({
                            showLayer: {
                                x: parseFloat(element.getAttribute('x')) * scale,
                                y: parseFloat(element.getAttribute('y')) * scale,
                                width: parseFloat(element.getAttribute('width')) * scale,
                                height: parseFloat(element.getAttribute('height')) * scale
                            },
                            hideLayer: null,
                            message: getNPCMessage(currentLevel, index),
                            showHideLayer: false,
                            interacted: false
                        });
                    });
                }
            })
            .catch(error => {
                console.error('Error loading SVG level:', error);
                // Fallback to default level
                initGame();
            });
    }

    // Update collectables counter display
    function updateCollectablesCounter() {
        const counterElement = document.getElementById('collectables-count');
        if (counterElement) {
            counterElement.textContent = collectablesCollected;
        }
    }

    // Initialize simple physics system
    function initPhysicsEngine() {
        // Initialize simple physics variables
        playerVelocity = { x: 0, y: 0 };
        gravity = gameConfig.gravity;
        isJumping = false;
        // Use level ground if available so falling off tall levels triggers correct ground collision
        groundLevel = (typeof camera.levelHeight === 'number') ? (camera.levelHeight - player.height) : (canvas.height - player.height);

        console.log('Simple physics system initialized. Ground level:', groundLevel);
    }

    // Initialize texture manager
    function initTextureManager() {
        textureManager = new TextureManager(ctx);

        // Load textures from default configuration
        const textureConfig = TextureManager.getDefaultTextureConfig();
        textureManager.loadTexturesFromConfig(textureConfig);
    }

    // Initialize parallax manager
    function initParallaxManager() {
        parallaxManager = new ParallaxManager(ctx, canvas, gameConfig);
    }

    // Initialize UI manager
    function initUIManager() {
        uiManager = new UIManager();
        uiManager.init();
    }

    // Set up event listeners
    function setupEventListeners() {
        console.log('Setting up keyboard event listeners');

    }

    // Update lives display
    function updateLivesDisplay() {
        const livesCounter = document.querySelector('.lives-counter');
        if (livesCounter) {
            // Clear existing hearts
            livesCounter.innerHTML = '';

            // Add all hearts (3 total) in reverse order, applying 'lost' class to those beyond current lives
            for (let i = 2; i >= 0; i--) {
                const heart = document.createElement('span');
                heart.className = 'life';

                const heartIcon = document.createElement('img');
                heartIcon.src = 'assets/ui/heart.svg';
                heartIcon.alt = 'Heart';
                heartIcon.className = 'heart-icon';

                // Apply 'lost' class if this heart represents a lost life
                if (i >= lives) {
                    heartIcon.classList.add('lost');
                }

                heart.appendChild(heartIcon);
                livesCounter.appendChild(heart);
            }
        }
    }


    // Get NPC message configuration object (keeps backward compatibility with previous string format)
    // Returns either an object { path, repeat } or string fallback
    function getNPCMessage(level, npcIndex) {
        const entry = gameConfig.npcMessages[level]?.[npcIndex];
        if (!entry) return "Hello! Keep going to find more collectables!";
        // Backwards compatible: if entry is a string, return as-is
        if (typeof entry === 'string') return entry;
        return entry;
    }

    // Initialize game
    function initGame() {
        loadSVGLevel(currentLevel);
        uiManager.setCollectablesCollected(collectablesCollected);
    }

    // Start game
    startGameButton.addEventListener('click', () => {
        document.querySelector('.portfolio-container').style.display = 'none';
        gameContainer.style.display = 'block';
        gameStarted = true;
        console.log('Game started! Setting up event listeners.');

        // Set up event listeners after game starts
        setupEventListeners();

        initGame();
        animate();
    });

    // Game loop
    function animate() {
        animationId = requestAnimationFrame(animate);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Disable image smoothing to avoid subpixel anti-aliasing around sprites (helps remove visual padding)
        ctx.imageSmoothingEnabled = false;

        // Compute world bounds early so physics uses the correct ground for tall levels
        const worldRightEarly = (typeof camera.levelWidth === 'number') ? camera.levelWidth : canvas.width;
        const worldBottomEarly = (typeof camera.levelHeight === 'number') ? camera.levelHeight : canvas.height;
        const worldGroundEarly = Math.max(0, worldBottomEarly - player.height);
        // Update groundLevel so updatePlayer uses world ground
        groundLevel = worldGroundEarly;

        // Update and draw parallax background (use camera to decouple from NPCs)
        parallaxManager.update(player, keys, camera);
        parallaxManager.draw(camera);

        // Draw background elements with textures and Rough.js outlines
        backgrounds.forEach(background => {
            // Apply camera offset
            const drawX = Math.round(background.position.x - camera.x);
            const drawY = Math.round(background.position.y - camera.y); // vertical camera offset

            // Fill with texture first
            if (textureManager && textureManager.getPattern('background')) {
                const pattern = textureManager.getPattern('background');
                if (pattern && typeof pattern.setTransform === 'function' && typeof camera !== 'undefined') {
                    // Align pattern to world coordinates so it doesn't "slide" when camera moves
                    pattern.setTransform(new DOMMatrix().translate(-camera.x, -camera.y));
                }
                ctx.fillStyle = pattern;
            } else {
                ctx.fillStyle = textureManager ? textureManager.getFallbackColor('background') : '#f0f0f0';
            }
            ctx.fillRect(drawX, drawY, Math.round(background.width), Math.round(background.height));

            // Add Rough.js sketch outline
            roughCanvas.rectangle(drawX, drawY, background.width, background.height, {
                fill: 'transparent',
                stroke: 'rgba(0, 0, 0, 0.2)',
                strokeWidth: 2,
                roughness: 0.5,
                fillStyle: 'solid',
                seed: 100
            });
        });

        // Draw scenes with textures and Rough.js outlines
        scenes.forEach(scene => {
            const drawX = Math.round(scene.position.x - camera.x);
            // Fill with texture first
            if (textureManager && textureManager.getPattern('scene')) {
                const pattern = textureManager.getPattern('scene');
                if (pattern && typeof pattern.setTransform === 'function' && typeof camera !== 'undefined') {
                    pattern.setTransform(new DOMMatrix().translate(-camera.x, -camera.y));
                }
                ctx.fillStyle = pattern;
            } else {
                ctx.fillStyle = 'rgba(100, 200, 100, 0.7)';
            }
            const drawY = Math.round(scene.position.y - camera.y);
            ctx.fillRect(drawX, drawY, Math.round(scene.width), Math.round(scene.height));

            // Add Rough.js sketch outline
            roughCanvas.rectangle(drawX, drawY, scene.width, scene.height, {
                fill: 'transparent',
                stroke: 'rgba(0, 0, 0, 0.2)',
                strokeWidth: 2,
                roughness: 1.2,
                fillStyle: 'solid',
                seed: 101
            });
        });

        // Draw boxes with textures and Rough.js outlines
        boxes.forEach(box => {
            const drawX = Math.round(box.position.x - camera.x);
            // Fill with texture first
            if (textureManager && textureManager.getPattern('box')) {
                const pattern = textureManager.getPattern('box');
                if (pattern && typeof pattern.setTransform === 'function' && typeof camera !== 'undefined') {
                    pattern.setTransform(new DOMMatrix().translate(-camera.x, -camera.y));
                }
                ctx.fillStyle = pattern;
            } else {
                ctx.fillStyle = textureManager ? textureManager.getFallbackColor('box') : '#8B4513';
            }
            const drawY = Math.round(box.position.y - camera.y);
            ctx.fillRect(drawX, drawY, Math.round(box.width), Math.round(box.height));

            // Add Rough.js sketch outline
            roughCanvas.rectangle(drawX, drawY, box.width, box.height, {
                fill: 'transparent',
                stroke: 'rgba(0, 0, 0, 0.3)',
                strokeWidth: 2,
                roughness: 1.5,
                fillStyle: 'solid',
                seed: 109
            });
        });

        // Draw platforms with textures and Rough.js outlines
        platforms.forEach(platform => {
            const drawX = Math.round(platform.position.x - camera.x);
            // Fill with texture first
            if (textureManager && textureManager.getPattern('platform')) {
                const pattern = textureManager.getPattern('platform');
                // If the pattern supports setTransform, align it to world coordinates so it remains static
                if (pattern && typeof pattern.setTransform === 'function' && typeof camera !== 'undefined') {
                    pattern.setTransform(new DOMMatrix().translate(-camera.x, -camera.y));
                }
                ctx.fillStyle = pattern;
            } else {
                ctx.fillStyle = textureManager ? textureManager.getFallbackColor('platform') : '#000';
            }
            const drawY = Math.round(platform.position.y - camera.y);
            ctx.fillRect(drawX, drawY, Math.round(platform.width), Math.round(platform.height));

            // Add Rough.js sketch outline
            roughCanvas.rectangle(drawX, drawY, platform.width, platform.height, {
                fill: 'transparent',
                stroke: 'rgba(0, 0, 0, 0.3)',
                strokeWidth: 3,
                roughness: 2.0,
                fillStyle: 'solid',
                seed: 102
            });
        });

        // Draw collectables with Rough.js but without an external stroke to avoid a hard border
        collectables.forEach(collectable => {
            const drawX = Math.round(collectable.position.x - camera.x);
            // Fill with gold first (no extra stroke/border)
            ctx.fillStyle = 'gold';
            const drawY = Math.round(collectable.position.y - camera.y);
            ctx.fillRect(drawX, drawY, Math.round(collectable.width), Math.round(collectable.height));

            // Use Rough.js to give a subtle textured fill but remove the stroke to avoid a hard border
            roughCanvas.circle(drawX + collectable.width/2, drawY + collectable.height/2, collectable.width, {
                fill: 'gold',
                stroke: 'transparent',
                strokeWidth: 0,
                roughness: 1.2,
                fillStyle: 'hachure',
                seed: 103
            });
        });

        // Draw checkpoints with textures and Rough.js outlines
        checkpoints.forEach(checkpoint => {
            if (!checkpoint.claimed) {
                const drawX = Math.round(checkpoint.position.x - camera.x);
                // Fill with texture first
                if (textureManager && textureManager.getPattern('checkpoint')) {
                    ctx.fillStyle = textureManager.getPattern('checkpoint');
                } else {
                    ctx.fillStyle = textureManager ? textureManager.getFallbackColor('checkpoint') : 'green';
                }
                const drawY = Math.round(checkpoint.position.y - camera.y);
                ctx.fillRect(drawX, drawY, Math.round(checkpoint.width), Math.round(checkpoint.height));

                // Add Rough.js sketch outline
                roughCanvas.rectangle(drawX, drawY, checkpoint.width, checkpoint.height, {
                    fill: 'transparent',
                    stroke: '#228B22',
                    strokeWidth: 3,
                    roughness: 1.8,
                    fillStyle: 'solid',
                    seed: 104
                });
            }
        });

        // Draw enemies with Rough.js outlines only
        enemies.forEach(enemy => {
            const drawX = Math.round(enemy.position.x - camera.x);
            // Fill with red first
            ctx.fillStyle = 'red';
            const drawY = Math.round(enemy.position.y - camera.y);
            ctx.fillRect(drawX, drawY, Math.round(enemy.width), Math.round(enemy.height));

            // Add Rough.js sketch outline
            roughCanvas.rectangle(drawX, drawY, enemy.width, enemy.height, {
                fill: 'transparent',
                stroke: '#8B0000',
                strokeWidth: 2,
                roughness: 2.5,
                fillStyle: 'solid',
                seed: 105
            });
        });

        // Draw NPCs with color fills and Rough.js outlines
        npcs.forEach(npc => {
            const drawX = Math.round(npc.showLayer.x - camera.x);
            // Draw show layer (always visible) - fill with color first
            ctx.fillStyle = 'rgba(200, 100, 200, 0.8)';
            const drawY = Math.round(npc.showLayer.y - camera.y);
            ctx.fillRect(drawX, drawY, Math.round(npc.showLayer.width), Math.round(npc.showLayer.height));

            // Add Rough.js sketch outline
            roughCanvas.rectangle(drawX, drawY, npc.showLayer.width, npc.showLayer.height, {
                fill: 'transparent',
                stroke: 'white',
                strokeWidth: 2,
                roughness: 1.0,
                fillStyle: 'solid',
                seed: 106
            });

            // Draw hide layer if it should be shown
            if (npc.showHideLayer && npc.hideLayer) {
                const hideDrawX = Math.round(npc.hideLayer.x - camera.x);
                const hideDrawY = Math.round(npc.hideLayer.y - camera.y);
                ctx.fillStyle = 'rgba(100, 200, 100, 0.8)';
                ctx.fillRect(hideDrawX, hideDrawY, Math.round(npc.hideLayer.width), Math.round(npc.hideLayer.height));

                // Add Rough.js sketch outline
                roughCanvas.rectangle(hideDrawX, hideDrawY, npc.hideLayer.width, npc.hideLayer.height, {
                    fill: 'transparent',
                    stroke: '#228B22',
                    strokeWidth: 1,
                    roughness: 1.5,
                    fillStyle: 'solid',
                    seed: 107
                });

                // Draw the "I" text
                if (npc.hideLayer.text) {
                    ctx.fillStyle = 'black';
                    ctx.font = 'bold 16px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(npc.hideLayer.text,
                                hideDrawX + npc.hideLayer.width / 2,
                                npc.hideLayer.y + npc.hideLayer.height / 2);
                }
            }
        });

        // Draw player using SVG with no container borders
        const playerDrawX = Math.round(player.position.x - camera.x);
        // Adjust drawY so the player's feet sit exactly on the surface (remove any inner border/gap)
        // Apply a slightly larger visual offset to counter any transparent padding inside the SVG asset
        const playerVisualOffsetY = -14; // increased to remove remaining gap
        const playerSpriteCropTop = 2; // crop a small number of pixels from the top of the source SVG
        const playerDrawY = Math.round(player.position.y - camera.y) - playerVisualOffsetY;
        // Determine facing: prefer input keys, fall back to horizontal velocity, default to facing right (1)
        const facing = (keys.rightKey && keys.rightKey.pressed) ? 1 : ((keys.leftKey && keys.leftKey.pressed) ? -1 : (playerVelocity.x < 0 ? -1 : (playerVelocity.x > 0 ? 1 : 1)));

        // Calculate squash and stretch targets based on player state
        const absVelX = Math.abs(playerVelocity.x);
        const absVelY = Math.abs(playerVelocity.y);

        const moving = (keys.rightKey && keys.rightKey.pressed) || (keys.leftKey && keys.leftKey.pressed);

        // Vertical squash/stretch: stretch when falling fast, squash when landing or moving fast horizontally
        if (absVelY > 3 && playerVelocity.y > 0) {
            // Falling fast - stretch vertically
            targetScaleY = 1.5;
            targetScaleX = 0.8;
        } else if (!isJumping && previousIsJumping && absVelY > 1) {
            // Just landed - squash vertically
            targetScaleY = 0.6;
            targetScaleX = 1.3;
        } else if (!isJumping && moving && absVelX > 2) {
            // Running fast on ground - slight squash
            targetScaleY = 0.85;
            targetScaleX = 1.15;
        } else {
            // Normal/idle state
            targetScaleY = 1;
            targetScaleX = 1;
        }

        // Smoothly interpolate scale values
        playerScaleX += (targetScaleX - playerScaleX) * 0.2;
        playerScaleY += (targetScaleY - playerScaleY) * 0.2;

        if (playerSvgLoaded) {
            ctx.save();
            // Apply squash/stretch transform around player center
            const centerX = playerDrawX + player.width / 2;
            const centerY = playerDrawY + player.height / 2;
            ctx.translate(centerX, centerY);
            ctx.scale(playerScaleX, playerScaleY);
            if (facing === -1) {
                // Flip horizontally (already at center, so flip around center)
                ctx.scale(-1, 1);
            }
            ctx.drawImage(playerSvg, -player.width / 2, -player.height / 2, player.width, player.height);
            ctx.restore();
            // Removed Rough.js outline for player per request — keeps sprite clean without extra border
        } else {
            // Fallback to blue rectangle if SVG not loaded yet
            ctx.save();
            ctx.fillStyle = 'blue';
            const centerX = playerDrawX + player.width / 2;
            const centerY = playerDrawY + player.height / 2;
            ctx.translate(centerX, centerY);
            ctx.scale(playerScaleX, playerScaleY);
            if (facing === -1) {
                ctx.scale(-1, 1);
            }
            ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
            ctx.restore();
            // No Rough.js outline for the fallback player either
        }

        // Update player position and emit landing/run dust effects
        previousIsJumping = isJumping;
        // Ensure updatePlayer uses the world ground (groundLevel was updated at function start)
        isJumping = updatePlayer(keys, playerVelocity, gravity, isJumping, groundLevel, canvas, gameConfig, platforms, camera);

        // Snap player to ground when very close to avoid a 1px border/gap so player sits flush on surface
        const worldGround = (typeof camera.levelHeight === 'number') ? (camera.levelHeight - player.height) : (canvas.height - player.height);
        if (!isJumping && Math.abs(player.position.y - worldGround) <= 2) {
            player.position.y = worldGround;
            playerVelocity.y = 0;
        }

        // If we just landed (was jumping and now not), emit a landing dust at player's feet
        if (previousIsJumping && !isJumping) {
            try {
                const rect = canvas.getBoundingClientRect();
                const footX = player.position.x + player.width / 2;
                const footY = player.position.y + player.height;
                const pageX = rect.left + (footX - camera.x) + window.scrollX;
                const pageY = rect.top + (footY - camera.y) + window.scrollY;
                // Determine last movement direction: right -> 1, left -> -1, default 1
                const movementDir = (keys.rightKey && keys.rightKey.pressed) ? 1 : ((keys.leftKey && keys.leftKey.pressed) ? -1 : 1);
                if (window.onPlayerLand) window.onPlayerLand(pageX, pageY, movementDir);
            } catch (e) {
                // ignore
            }
        }

        // Emit small periodic dust while running on the ground
        runDustCounter++;
        if (!isJumping && moving && runDustCounter % 12 === 0) {
            try {
                const rect = canvas.getBoundingClientRect();
                const footX = player.position.x + player.width / 2;
                const footY = player.position.y + player.height;
                const pageX = rect.left + (footX - camera.x) + window.scrollX;
                const pageY = rect.top + (footY - camera.y) + window.scrollY;
                const movementDir = (keys.rightKey && keys.rightKey.pressed) ? 1 : ((keys.leftKey && keys.leftKey.pressed) ? -1 : 1);
                if (window.onPlayerRunDust) window.onPlayerRunDust(pageX, pageY, movementDir);
            } catch (e) {
                // ignore
            }
        }

        // Camera/world scrolling using a deadzone around the player's position
        // Ensure camera.levelWidth/height are initialized
        if (typeof camera.levelWidth === 'undefined') camera.levelWidth = canvas.width;
        if (typeof camera.levelHeight === 'undefined') camera.levelHeight = canvas.height;

        const border = 200; // deadzone half-width/height in pixels

        // Compute deadzone edges in world coordinates
        const leftEdgeWorld = camera.x + (canvas.width / 2 - border);
        const rightEdgeWorld = camera.x + (canvas.width / 2 + border);
        const topEdgeWorld = camera.y + (canvas.height / 2 - border);
        const bottomEdgeWorld = camera.y + (canvas.height / 2 + border);

        // Horizontal camera follow (only move camera, do NOT mutate world objects or player position)
        if (player.position.x > rightEdgeWorld) {
            const desiredShift = player.position.x - rightEdgeWorld;
            const maxShift = Math.max(0, camera.levelWidth - canvas.width - camera.x);
            const shift = Math.min(desiredShift, maxShift);
            if (shift > 0) {
                camera.x += shift;
            }
        } else if (player.position.x < leftEdgeWorld) {
            const desiredShift = leftEdgeWorld - player.position.x;
            const shift = Math.min(desiredShift, camera.x);
            if (shift > 0) {
                camera.x -= shift;
            }
        }

        // Vertical camera follow
        if (player.position.y > bottomEdgeWorld) {
            const desiredShiftY = player.position.y - bottomEdgeWorld;
            const maxShiftY = Math.max(0, camera.levelHeight - canvas.height - camera.y);
            const shiftY = Math.min(desiredShiftY, maxShiftY);
            if (shiftY > 0) camera.y += shiftY;
        } else if (player.position.y < topEdgeWorld) {
            const desiredShiftY = topEdgeWorld - player.position.y;
            const shiftY = Math.min(desiredShiftY, camera.y);
            if (shiftY > 0) camera.y -= shiftY;
        }

        // Clamp camera to level bounds
        camera.x = Math.max(0, Math.min(camera.x, Math.max(0, camera.levelWidth - canvas.width)));
        camera.y = Math.max(0, Math.min(camera.y, Math.max(0, camera.levelHeight - canvas.height)));

        // Check for hitting level borders — if player touches world edge, lose a life and respawn
        const worldRight = (typeof camera.levelWidth === 'number') ? camera.levelWidth : canvas.width;
        const worldBottom = (typeof camera.levelHeight === 'number') ? camera.levelHeight : canvas.height;
        const tolerance = 1; // small tolerance to avoid off-by-one misses
        const hitLeft = player.position.x <= 0 + tolerance;
        const hitRight = player.position.x + player.width >= worldRight - tolerance;
        const hitTop = player.position.y <= 0 + tolerance;
        const hitBottom = player.position.y + player.height >= worldBottom - tolerance || player.position.y > worldBottom;

        // Also treat hitting the viewport edges as death — covers cases where world bounds differ from viewport
        const playerScreenX = player.position.x - camera.x;
        const playerScreenY = player.position.y - camera.y;
        const screenHitLeft = playerScreenX <= 0;
        const screenHitRight = playerScreenX + player.width >= canvas.width;
        const screenHitTop = playerScreenY <= 0;
        const screenHitBottom = playerScreenY + player.height >= canvas.height;

        // Lose life only when player is near bottom of the viewport (not when touching borders)
        const bottomLoseThreshold = 20; // pixels from bottom of the viewport
        const playerScreenBottom = playerScreenY + player.height;
        const screenNearBottom = playerScreenBottom >= (canvas.height - bottomLoseThreshold);

        if (screenNearBottom) {
            console.log('Player near bottom of screen, respawning');
            // Disable player input during respawn
            player.disabled = true;
            const died = uiManager.loseLife();
            // Reset velocities
            playerVelocity.x = 0;
            playerVelocity.y = 0;
            // Ensure we have a respawn position
            if (!respawnPosition) {
                respawnPosition = { x: gameConfig.player.position.x, y: gameConfig.player.position.y };
            }
            // Move player to respawn position (clamped inside world bounds)
            player.position.x = Math.max(0, Math.min(respawnPosition.x, worldRight - player.width));
            player.position.y = Math.max(0, Math.min(respawnPosition.y, worldBottom - player.height));
            // If UI indicates game over, set gameOver flag and show dialog
            if (died) {
                gameOver = true;
                if (animationId) cancelAnimationFrame(animationId);
                showGameOverDialog();
            } else {
                // Re-enable player after a short delay to avoid immediate input during respawn
                setTimeout(() => { if (!gameOver) player.disabled = false; }, 600);
            }
        }

        // Helper: show game over dialog with restart button
        function showGameOverDialog() {
            if (document.getElementById('game-over-dialog')) return;
            const overlay = document.createElement('div');
            overlay.id = 'game-over-dialog';
            overlay.className = 'game-over';
            const box = document.createElement('div');
            const title = document.createElement('h2'); title.textContent = 'Game Over';
            const msg = document.createElement('p'); msg.textContent = 'You have lost all your lives.';
            const btn = document.createElement('button'); btn.textContent = 'Restart';
            btn.addEventListener('click', () => {
                overlay.remove();
                // Attempt to reset lives display if UI manager exposes helpers
                if (uiManager && typeof uiManager.resetLives === 'function') {
                    uiManager.resetLives();
                } else if (uiManager && typeof uiManager.setLives === 'function') {
                    uiManager.setLives(gameConfig.player.lives || 3);
                } else {
                    // Fallback: update lives display UI directly if possible
                    try { updateLivesDisplay(); } catch (e) {}
                }

                // Reset game flags and player state
                gameOver = false;
                gameStarted = true;
                if (!respawnPosition) respawnPosition = { x: gameConfig.player.position.x, y: gameConfig.player.position.y };
                player.position.x = Math.max(0, Math.min(respawnPosition.x, (camera.levelWidth || canvas.width) - player.width));
                player.position.y = Math.max(0, Math.min(respawnPosition.y, (camera.levelHeight || canvas.height) - player.height));
                playerVelocity.x = 0; playerVelocity.y = 0;
                // Re-enable player input on restart
                player.disabled = false;
                // Reset key states
                keys.rightKey.pressed = false; keys.leftKey.pressed = false;

                // Re-initialize physics and start the loop
                initPhysicsEngine();
                // Ensure event listeners are attached
                try { setupEventListeners(); } catch (e) {}
                // Restart animation loop
                animate();
            });
            box.appendChild(title); box.appendChild(msg); box.appendChild(btn);
            overlay.appendChild(box);
            document.body.appendChild(overlay);
        }

        // Update enemies (they operate in world coordinates)
        updateEnemies(enemies, gameConfig.enemy, platforms, camera);

        // Update box physics
        updateBoxes();

        // Check for box-player collisions
        checkBoxCollisions();

        // Check for collisions
        checkCollisions();
    }


    // Raycast-based function to check if player can jump
    function canPlayerJump() {
        // Check if player is near ground level
        if (player.position.y >= groundLevel - 5) {
            console.log('Player is on ground level - can jump');
            return true;
        }

        // Raycast downward to detect platforms
        const raycastDistance = 10; // How far to check below player
        const playerBottom = player.position.y + player.height;
        const playerCenterX = player.position.x + player.width / 2;

        console.log('Raycasting for jump detection. Player bottom:', playerBottom, 'Checking', raycastDistance, 'pixels below');

        // Check if there's a platform directly below the player
        for (const platform of platforms) {
            // Check if player is above this platform
            if (playerBottom <= platform.position.y &&
                playerBottom + raycastDistance >= platform.position.y) {

                // Check if player is horizontally overlapping with platform
                if (player.position.x + player.width > platform.position.x &&
                    player.position.x < platform.position.x + platform.width) {

                    console.log('Raycast hit platform! Can jump.');
                    return true;
                }
            }
        }

        console.log('No ground or platform detected - cannot jump');
        return false;
    }

    // Update box physics
    function updateBoxes() {
        boxes.forEach((box, index) => {
            // Apply gravity to boxes
            boxVelocities[index].y += gravity;
            box.position.y += boxVelocities[index].y;

            // Check for platform collisions
            for (const platform of platforms) {
                // Check if box is falling onto platform
                if (boxVelocities[index].y >= 0 &&
                    box.position.x + box.width > platform.position.x &&
                    box.position.x < platform.position.x + platform.width &&
                    box.position.y + box.height > platform.position.y &&
                    box.position.y + box.height < platform.position.y + box.height + boxVelocities[index].y) {

                    // Land on platform
                    box.position.y = platform.position.y - box.height;
                    boxVelocities[index].y = 0;
                    break;
                }
            }

            // Check for ground collision
            if (box.position.y > groundLevel) {
                box.position.y = groundLevel;
                boxVelocities[index].y = 0;
            }
        });
    }

    // Check for box-player collisions and handle pushing
    function checkBoxCollisions() {
        boxes.forEach((box, index) => {
            // Check if player is colliding with box
            if (player.position.x + player.width > box.position.x &&
                player.position.x < box.position.x + box.width &&
                player.position.y + player.height > box.position.y &&
                player.position.y < box.position.y + box.height) {

                console.log('Player-box collision detected');

                // Determine collision direction and handle pushing
                const playerCenterX = player.position.x + player.width / 2;
                const boxCenterX = box.position.x + box.width / 2;

                // Horizontal pushing
                if (Math.abs(playerCenterX - boxCenterX) > Math.abs((player.position.y + player.height/2) - (box.position.y + box.height/2))) {
                    // Player is to the left of box - push right
                    if (playerCenterX < boxCenterX && keys.rightKey.pressed) {
                        box.position.x += 2; // Push box right
                        console.log('Pushing box right');
                    }
                    // Player is to the right of box - push left
                    else if (playerCenterX > boxCenterX && keys.leftKey.pressed) {
                        box.position.x -= 2; // Push box left
                        console.log('Pushing box left');
                    }
                }

                // Vertical collision (player on top of box)
                if (player.position.y + player.height <= box.position.y + 10 &&
                    playerVelocity.y >= 0 &&
                    Math.abs(playerCenterX - boxCenterX) < (player.width + box.width) / 2) {

                    // Player can stand on top of box
                    player.position.y = box.position.y - player.height;
                    playerVelocity.y = 0;
                    isJumping = false;
                    console.log('Player standing on box');
                }
            }
        });
    }

    // Check for collisions
    function checkCollisions() {
        // Check for collectables (capture updated count returned by helper)
        collectablesCollected = checkCollectableCollisions(player, collectables, collectablesCollected, uiManager, window.audioManager, camera, canvas);

        // Check for checkpoints
        checkpoints.forEach((checkpoint, index) => {
            if (
                player.position.x + player.width > checkpoint.position.x &&
                player.position.x < checkpoint.position.x + checkpoint.width &&
                player.position.y + player.height > checkpoint.position.y &&
                player.position.y < checkpoint.position.y + checkpoint.height
            ) {
                if (!checkpoint.claimed) {
                    checkpoint.claimed = true;
                    uiManager.showLevelComplete();

                    // Play checkpoint sound
                    if (window.audioManager) {
                        window.audioManager.playCheckpoint();
                    }

                    setTimeout(() => {
                        currentLevel++;
                        if (currentLevel > 3) {
                            currentLevel = 1;
                        }
                        initGame();
                        player.position.x = 50;
                        player.position.y = 350;
                        uiManager.hideLevelComplete();
                    }, 2000);
                }
            }
        });

        // Check for enemies
        enemies.forEach((enemy, index) => {
            if (
                player.position.x + player.width > enemy.position.x &&
                player.position.x < enemy.position.x + enemy.width &&
                player.position.y + player.height > enemy.position.y &&
                player.position.y < enemy.position.y + enemy.height
            ) {
                if (uiManager.loseLife()) {
                   // Game over - reset player position and set game over state
                   player.position.x = 50;
                   player.position.y = 350;
                   gameOver = true;
               } else {
                   // Just lost a life - reset player position
                   player.position.x = 50;
                   player.position.y = 350;
               }
            }
        });

        // Check for NPCs
        npcs.forEach((npc, index) => {
            const showLayer = npc.showLayer;

            if (
                player.position.x + player.width > showLayer.x &&
                player.position.x < showLayer.x + showLayer.width &&
                player.position.y + player.height > showLayer.y &&
                player.position.y < showLayer.y + showLayer.height
            ) {
                // Determine if this NPC should show its interaction hint based on level-level repeat config
                const counterKey = `${currentLevel}:${index}`;
                const levelEntries = gameConfig.npcMessages[currentLevel] || [];
                let levelRepeat = null;
                if (levelEntries.length > 0 && levelEntries[0] && typeof levelEntries[0] === 'object' && levelEntries[0].repeat && !levelEntries[0].path) {
                    levelRepeat = levelEntries[0].repeat;
                }

                let allowedProximity = true;
                if (levelRepeat) {
                    const seen = npcRepeatCounters.get(counterKey) || 0;
                    const type = levelRepeat.type || 'times';
                    const count = typeof levelRepeat.count === 'number' ? levelRepeat.count : 1;
                    if (type === 'once') allowedProximity = seen < 1;
                    else if (type === 'times') allowedProximity = seen < count;
                    else if (type === 'forever') allowedProximity = true;
                }

                // Only show the interaction hint when allowed by repeat rules
                if (allowedProximity) {
                    npc.showHideLayer = true;
                } else {
                    npc.showHideLayer = false;
                }
            } else {
                // When player moves away hide the hint
                // Do not mutate repeat counters here
                npc.showHideLayer = false;
            }
        });
    }

    document.addEventListener('keyup', (e) => {
        if (!gameStarted || gameOver || player.disabled) return;

        // Handle movement key releases
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            keys.rightKey.pressed = false;
        } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            keys.leftKey.pressed = false;
        }

        // Handle crouch key release - return to full height and adjust position
        if (e.key === 's' || e.key === 'S') {
            const heightDifference = player.originalHeight - player.height;
            player.position.y += heightDifference; // Move player down to keep base in same place
            player.height = player.originalHeight;
            console.log('Crouch released. Height restored to:', player.height, 'Position adjusted to:', player.position.y);
        }
    });

    document.addEventListener('keydown', (e) => {
        console.log('Key down event:', e.key, 'Game started:', gameStarted, 'Game over:', gameOver);

        if (!gameStarted || gameOver || player.disabled) return;

        // Handle movement keys
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            keys.rightKey.pressed = true;
            console.log('Right key pressed');
        } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            keys.leftKey.pressed = true;
            console.log('Left key pressed');
        }

        // Handle jumping with simple physics
        if ((e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w' || e.key === 'W')) {
            console.log('Jump key detected! Player Y:', player.position.y, 'Is jumping:', isJumping);
            // Check if player can jump using raycast-based detection
            const canJump = canPlayerJump();

            if (canJump && !isJumping) {
                playerVelocity.y = -player.jumpHeight;
                isJumping = true;
                console.log('Jump triggered! Velocity:', playerVelocity.y, 'Player Y:', player.position.y);
            } else {
                console.log('Jump not triggered. Can jump:', canJump, 'Is jumping:', isJumping);
            }
        }

        // Handle crouch - reduce height from top, keep base in same place
        if (e.key === 's' || e.key === 'S') {
            const heightDifference = player.height - player.crouchHeight;
            player.position.y -= heightDifference; // Move player up to keep base in same place
            player.height = player.crouchHeight;
            console.log('Crouching. Height set to:', player.height, 'Position adjusted to:', player.position.y);
        }

        // Check for 'I' key press to show NPC dialog
        if (e.key === 'i' || e.key === 'I') {
            // Find the first NPC with showHideLayer true
            const activeNPC = npcs.find(npc => npc.showHideLayer);
            if (activeNPC) {
                // Determine npc index for repeat tracking
                const npcIndex = npcs.findIndex(npc => npc === activeNPC);
                const counterKey = `${currentLevel}:${npcIndex}`;

                // Choose a random message entry from gameConfig.npcMessages[currentLevel]
                const levelEntries = gameConfig.npcMessages[currentLevel] || [];
                // Support array-level repeat config: first element may be { repeat: { ... } } applying to all options
                let levelRepeat = null;
                let options = levelEntries;
                if (options.length > 0 && options[0] && typeof options[0] === 'object' && options[0].repeat && !options[0].path) {
                    levelRepeat = options[0].repeat;
                    options = options.slice(1);
                }

                let chosenEntry = null;
                if (options.length === 0) {
                    chosenEntry = { path: 'assets/dialogue/Story/Chapter_01/The Basket.json' };
                } else {
                    const rand = Math.floor(Math.random() * options.length);
                    const raw = options[rand];
                    chosenEntry = (typeof raw === 'string') ? { path: raw } : raw;
                }

                // Determine which repeat configuration to use: array-level repeat takes priority, otherwise per-entry repeat
                const repeatCfg = levelRepeat || (chosenEntry ? chosenEntry.repeat : null);

                // Apply repeat rules using repeatCfg
                let allowed = true;
                if (repeatCfg) {
                    const type = repeatCfg.type || 'times';
                    const count = typeof repeatCfg.count === 'number' ? repeatCfg.count : 1;
                    const seen = npcRepeatCounters.get(counterKey) || 0;
                    if (type === 'once') {
                        allowed = seen < 1;
                    } else if (type === 'times') {
                        allowed = seen < count;
                    } else if (type === 'forever') {
                        allowed = true;
                    }
                    if (!allowed) {
                        activeNPC.showHideLayer = false;
                        return;
                    }
                    if (allowed && (type === 'times' || type === 'once')) {
                        npcRepeatCounters.set(counterKey, seen + 1);
                    }
                }

                const path = chosenEntry.path || 'assets/dialogue/Story/Chapter_01/The Basket.json';
                if (window.inkDialogue && typeof window.inkDialogue.startStoryFromPath === 'function') {
                    const allowRepeatOpt = (repeatCfg && (repeatCfg.type === 'forever' || (repeatCfg.type === 'times' && repeatCfg.count > 1))) || (chosenEntry && chosenEntry.repeat && (chosenEntry.repeat.type === 'forever' || (chosenEntry.repeat.type === 'times' && chosenEntry.repeat.count > 1)));
                    window.inkDialogue.startStoryFromPath(path, { allowRepeat: !!allowRepeatOpt });
                } else {
                    uiManager.showNPCDialog(path);
                }
                activeNPC.showHideLayer = false; // Hide the layer after showing dialog
                if (window.audioManager) {
                    window.audioManager.playNPC();
                }
            }
        }
    });

    // Initialize texture manager
    initTextureManager();

    // Initialize physics engine
    initPhysicsEngine();

    // Initialize parallax manager
    initParallaxManager();

    // Initialize UI manager
    initUIManager();

});
