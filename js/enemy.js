// Enemy module

// Check if enemy is standing on a platform
function isOnPlatform(enemy, platforms) {
    const enemyBottom = enemy.position.y + enemy.height;
    
    for (const platform of platforms) {
        // Check if enemy is just above this platform (within falling distance)
        if (enemyBottom <= platform.position.y + 5 &&
            enemyBottom >= platform.position.y - 10 &&
            enemy.position.x + enemy.width > platform.position.x &&
            enemy.position.x < platform.position.x + platform.width) {
            return { onPlatform: true, platform };
        }
    }
    return { onPlatform: false, platform: null };
}

// Check if enemy has reached the edge of its current platform
function isAtPlatformEdge(enemy, platform, direction) {
    if (!platform) return true;
    
    const enemyBottom = enemy.position.y + enemy.height;
    const tolerance = 2; // Small tolerance for edge detection
    
    // Must be standing on the platform
    if (Math.abs(enemyBottom - platform.position.y) > 10) {
        return true;
    }
    
    // Moving right - check if at right edge
    if (direction > 0) {
        return enemy.position.x + enemy.width >= platform.position.x + platform.width - tolerance;
    }
    
    // Moving left - check if at left edge
    if (direction < 0) {
        return enemy.position.x <= platform.position.x + tolerance;
    }
    
    return false;
}

// Update enemies with platform-based movement
function updateEnemies(enemies, config, platforms, camera) {
    const gravity = 0.5;
    
    enemies.forEach(enemy => {
        // Apply gravity - enemies fall if not on a platform
        const { onPlatform, platform } = isOnPlatform(enemy, platforms);
        
        if (!onPlatform) {
            enemy.position.y += enemy.velocityY || 0;
            enemy.velocityY = (enemy.velocityY || 0) + gravity;
            
            // If falling too far, reset to top of screen to avoid infinite fall
            if (enemy.position.y > (camera?.levelHeight || 1000)) {
                enemy.position.y = -100;
                enemy.velocityY = 0;
            }
        } else {
            // On platform - zero vertical velocity
            enemy.velocityY = 0;
            
            // Check if at platform edge - turn around if so
            if (isAtPlatformEdge(enemy, platform, enemy.direction)) {
                enemy.direction *= -1;
            }
            
            // Snap to platform surface to avoid floating
            const enemyBottom = enemy.position.y + enemy.height;
            if (enemyBottom < platform.position.y) {
                enemy.position.y = platform.position.y - enemy.height;
            } else if (enemyBottom > platform.position.y + 5) {
                enemy.position.y = platform.position.y - enemy.height;
            }
        }
        
        // Horizontal movement
        enemy.position.x += config.speed * enemy.direction;
        
        // World boundary check - use level bounds if available
        const worldLeft = 0;
        const worldRight = camera?.levelWidth || (typeof document !== 'undefined' ? document.getElementById('game-canvas')?.width || 800 : 800);
        
        // Turn around at world edges (with some tolerance)
        if (enemy.position.x <= worldLeft + 10) {
            enemy.position.x = worldLeft + 10;
            enemy.direction = 1;
        } else if (enemy.position.x + enemy.width >= worldRight - 10) {
            enemy.position.x = worldRight - enemy.width - 10;
            enemy.direction = -1;
        }
    });
}

export { updateEnemies, isOnPlatform };