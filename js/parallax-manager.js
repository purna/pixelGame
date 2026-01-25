class ParallaxManager {
    constructor(ctx, canvas, gameConfig) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.gameConfig = gameConfig;
        this.backgroundX = 0;
        this.backgroundImg = null;
        this.lastPlayerX = 0;
        
        // Load background image
        this.loadBackgroundImage();
    }
    
    loadBackgroundImage() {
        this.backgroundImg = new Image();
        this.backgroundImg.src = 'assets/backgrounds/background.svg';
    }
    
    // Accept camera so parallax can be positioned relative to camera.x
    update(player, keys, camera) {
        // Calculate scale factor to fit vertically
        const scale = this.canvas.height / 400;
        const scaledWidth = 2000 * scale;
        
        // If camera is provided, compute player movement relative to camera
        const playerMovement = camera ? (player.position.x - camera.x) - this.lastPlayerX : player.position.x - this.lastPlayerX;
        this.lastPlayerX = camera ? (player.position.x - camera.x) : player.position.x;
        
        // Update background position based on player movement; ignore NPCs entirely
        if (playerMovement > 0) {
            this.backgroundX -= this.gameConfig.backgroundSpeed;
        } else if (playerMovement < 0) {
            this.backgroundX += this.gameConfig.backgroundSpeed;
        }
        
        // Reset background position for seamless looping
        if (this.backgroundX <= -scaledWidth) {
            this.backgroundX = 0;
        } else if (this.backgroundX > 0) {
            this.backgroundX = -scaledWidth + (this.backgroundX % scaledWidth);
        }
    }

    // Accept camera so the draw position accounts for vertical/horizontal camera offsets
    draw(camera) {
        if (!this.backgroundImg || !this.backgroundImg.complete) {
            return;
        }
        
        // Calculate scale factor to fit vertically
        const scale = this.canvas.height / 400;
        const scaledWidth = 2000 * scale;
        
        // Draw two instances of the background for seamless looping
        // Apply camera offsets so textures stay aligned with world objects
        const drawX = this.backgroundX - (camera ? camera.x * 0.5 : 0); // parallax factor
        const drawY = camera ? -camera.y * 0.1 : 0;
        this.ctx.drawImage(this.backgroundImg, drawX, drawY, scaledWidth, this.canvas.height);
        this.ctx.drawImage(this.backgroundImg, drawX + scaledWidth, drawY, scaledWidth, this.canvas.height);
    }
    
    reset() {
        this.backgroundX = 0;
        this.lastPlayerX = 0;
    }
}