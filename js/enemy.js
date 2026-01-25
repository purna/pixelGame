// Enemy module

// Update enemies
function updateEnemies(enemies, config, canvas) {
    enemies.forEach(enemy => {
        enemy.position.x += config.speed * enemy.direction;

        // Simple boundary check for patrol behavior
        if (enemy.position.x <= 0 || enemy.position.x + enemy.width >= canvas.width) {
            enemy.direction *= -1;
        }
    });
}

export { updateEnemies };