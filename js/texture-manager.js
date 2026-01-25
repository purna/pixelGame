// Texture Manager - Centralized texture loading and management
class TextureManager {
    constructor(ctx) {
        this.ctx = ctx;
        this.textures = {};
        this.patterns = {};
        this.loadedCount = 0;
        this.totalTextures = 0;
        this.onAllTexturesLoaded = null;
    }

    // Add a texture to be loaded
    addTexture(name, path) {
        this.textures[name] = {
            path: path,
            image: new Image(),
            loaded: false
        };
        this.totalTextures++;
    }

    // Load all textures
    loadAll() {
        Object.keys(this.textures).forEach(name => {
            const texture = this.textures[name];
            texture.image.src = texture.path;
            
            texture.image.onload = () => {
                texture.loaded = true;
                this.loadedCount++;
                
                // Create pattern for this texture
                this.patterns[name] = this.ctx.createPattern(texture.image, 'repeat');
                
                // Call callback if all textures are loaded
                if (this.loadedCount === this.totalTextures && this.onAllTexturesLoaded) {
                    this.onAllTexturesLoaded();
                }
            };
            
            texture.image.onerror = () => {
                console.error(`Failed to load texture: ${name} from ${texture.path}`);
                this.loadedCount++;
                
                // Call callback even if some textures failed
                if (this.loadedCount === this.totalTextures && this.onAllTexturesLoaded) {
                    this.onAllTexturesLoaded();
                }
            };
        });
    }

    // Get a texture pattern
    getPattern(name) {
        return this.patterns[name] || null;
    }

    // Check if a texture is loaded
    isLoaded(name) {
        return this.textures[name] && this.textures[name].loaded;
    }

    // Set callback for when all textures are loaded
    onAllLoaded(callback) {
        this.onAllTexturesLoaded = callback;
    }

    // Get fallback color for a texture type
    getFallbackColor(name) {
        // Use fallback colors from gameConfig if available, otherwise use defaults
        const fallbackColors = gameConfig.fallbackColors || {
            'platform': '#000',
            'checkpoint': 'green',
            'background': '#f0f0f0',
            'collectable': 'gold',
            'enemy': 'red',
            'player': 'blue'
        };
        
        // Try to match based on texture name
        for (const [type, color] of Object.entries(fallbackColors)) {
            if (name.includes(type)) {
                return color;
            }
        }
        
        return '#ccc'; // Default fallback color
    }

    // Default texture configurations using variables from config
    static getDefaultTextureConfig() {
        // Use texture variables from gameConfig if available, otherwise use defaults
        const textureVars = gameConfig.textures || {
            platform: 'diagonal-stripes',
            checkpoint: 'radiant-gradient',
            scene: 'repeating-chevrons',
            box: 'stacked-steps-haikei'
        };
        
        return {
            'platform': 'assets/textures/' + textureVars.platform + '.svg',
            'checkpoint': 'assets/textures/' + textureVars.checkpoint + '.svg',
            'scene': 'assets/textures/' + textureVars.scene + '.png',
            'box': 'assets/textures/' + textureVars.box + '.svg'
        };
    }

    // Method to update texture variables in config
    static setTextureVariable(name, value) {
        if (gameConfig.textures) {
            gameConfig.textures[name] = value;
        }
    }

    // Method to get current texture variables from config
    static getTextureVariables() {
        return gameConfig.textures ? {...gameConfig.textures} : {
            platform: 'diagonal-stripes',
            checkpoint: 'radiant-gradient',
            scene: 'repeating-chevrons'
        };
    }

    // Load textures from configuration
    loadTexturesFromConfig(config) {
        for (const [name, path] of Object.entries(config)) {
            this.addTexture(name, path);
        }
        this.loadAll();
    }
}