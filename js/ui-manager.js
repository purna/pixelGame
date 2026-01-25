class UIManager {
    constructor() {
        this.lives = 3;
        this.collectablesCollected = 0;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Restart game button
        const restartGameButton = document.getElementById('restart-game');
        if (restartGameButton) {
            restartGameButton.addEventListener('click', () => {
                this.hideGameOver();
                this.lives = 3;
                this.collectablesCollected = 0;
                this.updateLivesDisplay();
                
                // Reset game state
                if (typeof initGame === 'function') {
                    initGame();
                }
                if (typeof parallaxManager !== 'undefined' && parallaxManager.reset) {
                    parallaxManager.reset();
                }
                
                // Reset player position
                if (typeof player !== 'undefined') {
                    player.position.x = 50;
                    player.position.y = 350;
                }
                
                // Reset game over state
                if (typeof gameOver !== 'undefined') {
                    gameOver = false;
                }
            });
        }
    }
    
    // Update collectables counter display
    updateCollectablesCounter() {
        const counterElement = document.getElementById('collectables-count');
        if (counterElement) {
            counterElement.textContent = this.collectablesCollected;
        }
    }
    
    // Update lives display
    updateLivesDisplay() {
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
                if (i >= this.lives) {
                    heartIcon.classList.add('lost');
                }
                
                heart.appendChild(heartIcon);
                livesCounter.appendChild(heart);
            }
        }
    }
    
    // Lose life function
    loseLife() {
        this.lives--;
        this.updateLivesDisplay();
        
        if (this.lives <= 0) {
            this.showGameOver();
        }
        
        return this.lives <= 0; // Return true if game over
    }
    
    // Show popup
    showPopup() {
        const popup = document.getElementById('portfolio-popup');
        if (popup) {
            popup.style.display = 'block';
        }
    }
    
    // Close popup
    closePopup() {
        const popup = document.getElementById('portfolio-popup');
        if (popup) {
            popup.style.display = 'none';
        }
    }
    
    // Level complete notification
    showLevelComplete() {
        const levelComplete = document.getElementById('level-complete');
        if (levelComplete) {
            levelComplete.style.display = 'block';
        }
    }
    
    hideLevelComplete() {
        const levelComplete = document.getElementById('level-complete');
        if (levelComplete) {
            levelComplete.style.display = 'none';
        }
    }
    
    // Game over notification
    showGameOver() {
        const gameOver = document.getElementById('game-over');
        if (gameOver) {
            gameOver.style.display = 'block';
        }
    }
    
    hideGameOver() {
        const gameOver = document.getElementById('game-over');
        if (gameOver) {
            gameOver.style.display = 'none';
        }
    }
    
    // Show collectable popup
    showCollectablePopup() {
        const popup = document.getElementById('portfolio-popup');
        if (popup) {
            const popupContent = document.querySelector('.popup-content');
            if (popupContent) {
                popupContent.innerHTML = `
                    <span class="close-btn">&times;</span>
                    <h2>Collectable Found!</h2>
                    <p>You found a collectable! Great job!</p>
                `;
                popup.style.display = 'block';
                
                // Reattach close button event listener
                const closeBtn = document.querySelector('.close-btn');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        popup.style.display = 'none';
                    });
                }
            }
        }
    }
    
    // Show NPC dialog - similar to level complete popup
    showNPCDialog(message) {
        console.log('showNPCDialog called with message:', message);
        
        // Create NPC dialog element if it doesn't exist
        let npcDialog = document.getElementById('npc-dialog');
        if (!npcDialog) {
            npcDialog = document.createElement('div');
            npcDialog.id = 'npc-dialog';
            npcDialog.className = 'npc-dialog';
            npcDialog.innerHTML = `
                <h2>NPC Message</h2>
                <p>${message}</p>
                <button id="npc-close-btn">OK</button>
            `;
            document.body.appendChild(npcDialog);
            
            // Add CSS for the dialog
            const style = document.createElement('style');
            style.textContent = `
                .npc-dialog {
                    display: none;
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background-color: #fff;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
                    z-index: 100;
                    text-align: center;
                    width: 300px;
                }
                
                #npc-close-btn {
                    margin-top: 15px;
                    padding: 8px 16px;
                    background-color: #007bff;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                }
                
                #npc-close-btn:hover {
                    background-color: #0056b3;
                }
            `;
            document.head.appendChild(style);
        } else {
            // Update existing dialog
            npcDialog.querySelector('p').textContent = message;
        }
        
        // Show the dialog
        npcDialog.style.display = 'block';
        
        // Add event listener to close button
        const closeBtn = document.getElementById('npc-close-btn');
        if (closeBtn) {
            closeBtn.onclick = () => {
                npcDialog.style.display = 'none';
            };
        }
    }
    
    // Initialize the UI
    init() {
        this.updateLivesDisplay();
        this.updateCollectablesCounter();
        
        // Remove the about me popup initially
        const portfolioPopup = document.getElementById('portfolio-popup');
        if (portfolioPopup) {
            portfolioPopup.style.display = 'none';
        }
    }
    
    // Update collectables count
    setCollectablesCollected(count) {
        this.collectablesCollected = count;
        this.updateCollectablesCounter();
    }
    
    // Get current lives
    getLives() {
        return this.lives;
    }
    
    // Set lives
    setLives(count) {
        this.lives = count;
        this.updateLivesDisplay();
    }
}