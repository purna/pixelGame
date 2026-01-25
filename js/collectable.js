// Collectable module

// Check for collectable collisions
function checkCollectableCollisions(player, collectables, collectablesCollected, uiManager, audioManager) {
    collectables.forEach((collectable, index) => {
        if (
            player.position.x + player.width > collectable.position.x &&
            player.position.x < collectable.position.x + collectable.width &&
            player.position.y + player.height > collectable.position.y &&
            player.position.y < collectable.position.y + collectable.height
        ) {
            collectables.splice(index, 1);
            collectablesCollected++;
            uiManager.setCollectablesCollected(collectablesCollected);
            uiManager.showCollectablePopup();

            // Play collectable sound
            if (audioManager) {
                audioManager.playCollectable();
            }
        }
    });
}

export { checkCollectableCollisions };