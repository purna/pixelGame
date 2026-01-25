// Collectable module

// Check for collectable collisions
// Returns the updated collectablesCollected count so callers can persist it
function checkCollectableCollisions(player, collectables, collectablesCollected, uiManager, audioManager, camera, canvasEl) {
    collectables.forEach((collectable, index) => {
        if (
            player.position.x + player.width > collectable.position.x &&
            player.position.x < collectable.position.x + collectable.width &&
            player.position.y + player.height > collectable.position.y &&
            player.position.y < collectable.position.y + collectable.height
        ) {
            // Trigger particle effect at center of collectable (convert from world to page coordinates)
            const cxWorld = collectable.position.x + collectable.width / 2;
            const cyWorld = collectable.position.y + collectable.height / 2;
            try {
                let pageX = cxWorld;
                let pageY = cyWorld;
                // Convert using provided camera and canvasEl to page coordinates
                if (camera && typeof camera.x === 'number' && typeof camera.y === 'number' && canvasEl && canvasEl.getBoundingClientRect) {
                    const rect = canvasEl.getBoundingClientRect();
                    const screenX = cxWorld - camera.x;
                    const screenY = cyWorld - camera.y;
                    pageX = rect.left + screenX;
                    pageY = rect.top + screenY;
                }

                console.log('collectable picked at page coords:', pageX, pageY, 'world coords:', cxWorld, cyWorld);

                if (window && typeof window.onCollectItem === 'function') {
                    window.onCollectItem(pageX, pageY);
                } else {
                    document.dispatchEvent(new CustomEvent('game:collect', { detail: { x: pageX, y: pageY, type: collectable.type || 'coin' } }));
                }
            } catch (err) {
                console.warn('checkCollectableCollisions: particle trigger failed', err);
            }

            // Remove the collectable from the world and update counters/UI
            collectables.splice(index, 1);
            collectablesCollected++;
            if (uiManager && typeof uiManager.setCollectablesCollected === 'function') {
                uiManager.setCollectablesCollected(collectablesCollected);
            }
            if (uiManager && typeof uiManager.showCollectablePopup === 'function') {
                uiManager.showCollectablePopup();
            }

            // Play collectable sound
            if (audioManager) {
                audioManager.playCollectable();
            }
        }
    });

    // Return the potentially-updated count so callers (game loop) can persist it in their scope
    return collectablesCollected;
}

export { checkCollectableCollisions };