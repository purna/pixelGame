// Simple explosion-style particle effect adapted from Nick Sheffield's "Anchor Click Canvas Animation"
// Replaces previous ParticleBurst system. Creates a short-lived canvas per explosion so there is no
// persistent overlay that could occlude UI elements like the portfolio panel.

(function(){
  const colors = [ '#ffc000', '#ff3b3b', '#ff8400' ];
  const bubbles = 25;

  // Random helper
  const r = (a, b, c) => parseFloat((Math.random() * ((a ? a : 1) - (b ? b : 0)) + (b ? b : 0)).toFixed(c ? c : 0));

  function render(particles, ctx, width, height) {
    // Use a single RAF loop per canvas, ended when all particles are dead
    const loop = () => {
      ctx.clearRect(0, 0, width, height);
      let alive = false;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!p) continue;

        p.x += p.speed * Math.cos(p.rotation * Math.PI / 180);
        p.y += p.speed * Math.sin(p.rotation * Math.PI / 180);

        p.opacity -= 0.01;
        p.speed *= p.friction;
        p.radius *= p.friction;
        p.yVel += p.gravity;
        p.y += p.yVel;

        if (p.opacity <= 0 || p.radius <= 0) continue;

        alive = true;
        ctx.beginPath();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity));
        ctx.fillStyle = p.color;
        ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI, false);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      if (alive) requestAnimationFrame(loop);
      // If not alive, the caller will remove the canvas after a timeout
    };

    requestAnimationFrame(loop);
  }

  function explode(pageX, pageY, opts) {
    const options = Object.assign({ bubbles: bubbles, colors: colors }, opts || {});
    const particleCount = options.bubbles;
    const ratio = window.devicePixelRatio || 1;

    // Create a small canvas centered around the explosion point
    const size = 200; // pixels (CSS)
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');

    c.style.position = 'absolute';
    c.style.left = (pageX - size/2) + 'px';
    c.style.top = (pageY - size/2) + 'px';
    c.style.pointerEvents = 'none';
    c.style.width = size + 'px';
    c.style.height = size + 'px';
    // Keep z-index high but temporary — panel remains since we only add canvas for short time
    c.style.zIndex = 1000;
    // Ensure the canvas background is transparent so it doesn't block UI visually
    c.style.background = 'transparent';
    // Remove default canvas border/outline (global css canvas selector may add it)
    c.style.border = 'none';
    c.style.boxShadow = 'none';
    c.className = 'explosion-canvas';

    c.width = size * ratio;
    c.height = size * ratio;
    ctx.scale(ratio, ratio);

    document.body.appendChild(c);

    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: size / 2,
        y: size / 2,
        radius: r(6, 12),
        color: options.colors[Math.floor(Math.random() * options.colors.length)],
        rotation: r(0, 360, true),
        speed: r(6, 12),
        friction: 0.92,
        opacity: r(0.4, 1, true),
        yVel: 0,
        gravity: 0.12
      });
    }

    // Start render loop for this canvas
    render(particles, ctx, size, size);

    // Remove canvas after particles should be dead
    setTimeout(() => {
      if (c && c.parentNode) c.parentNode.removeChild(c);
    }, 1200);
  }

  // Expose a simple global API used by the game code
  window.onCollectItem = function(x, y) {
    explode(x, y, { colors: ['#ffc000', '#ff3b3b', '#ff8400'], bubbles: 25 });
  };

  window.onCollectGem = function(x, y) {
    explode(x, y, { colors: ['#00FFFF', '#0080FF', '#ADD8E6'], bubbles: 30 });
  };

  window.onCollectPowerup = function(x, y) {
    explode(x, y, { colors: ['#FF00FF', '#FF1493', '#FF69B4'], bubbles: 36 });
  };

  window.onCollectStar = function(x, y) {
    explode(x, y, { colors: ['#FFFF00', '#FFFFFF', '#FFD700'], bubbles: 20 });
  };

  // Helper: directional dust that biases particles opposite the player's movement (dir: 1 = moving right, -1 = moving left)
  function createDirectionalDust(pageX, pageY, dir, opts) {
    opts = opts || {};
    const particleCount = opts.bubbles || 10;
    const size = opts.size || 100;
    const ratio = window.devicePixelRatio || 1;
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    c.style.position = 'absolute';
    c.style.left = (pageX - size/2) + 'px';
    c.style.top = (pageY - size/2) + 'px';
    c.style.pointerEvents = 'none';
    c.style.width = size + 'px';
    c.style.height = size + 'px';
    c.style.zIndex = 1000;
    c.style.background = 'transparent';
    c.style.border = 'none';
    c.style.boxShadow = 'none';
    c.className = 'explosion-canvas';
    c.width = size * ratio;
    c.height = size * ratio;
    ctx.scale(ratio, ratio);
    document.body.appendChild(c);

    const particles = [];
    for (let i=0;i<particleCount;i++){
      // rotation oriented opposite movement: moving right -> rotation ~180deg (left), moving left -> ~0deg (right)
      const baseRotation = dir === 1 ? r(160,200,true) : r(-20,20,true);
      particles.push({
        x: size/2 + (Math.random()-0.5)*6,
        y: size/2 + (Math.random()-0.5)*6,
        radius: r(3,7),
        color: (opts.colors && opts.colors[Math.floor(Math.random()*opts.colors.length)]) || '#D9C79D',
        rotation: baseRotation,
        speed: r(1,3),
        friction: 0.9,
        opacity: r(0.5,1,true),
        yVel: r(-1,-0.2,true),
        gravity: 0.06
      });
    }

    render(particles, ctx, size, size);
    setTimeout(()=>{ try{ c.parentNode.removeChild(c);}catch(e){} }, 700);
  }

  // Player landing and running dust effects (small, short-lived), accept optional movement direction
  window.onPlayerLand = function(x, y, dir) {
    dir = typeof dir === 'number' ? dir : 1;
    createDirectionalDust(x, y, dir, { colors: ['#D9C79D', '#CBB78A'], bubbles: 12, size: 120 });
  };

  window.onPlayerRunDust = function(x, y, dir) {
    dir = typeof dir === 'number' ? dir : 1;
    createDirectionalDust(x, y, dir, { colors: ['#D9C79D'], bubbles: 6, size: 80 });
  };

  // Support existing custom event approach
  document.addEventListener('game:collect', (e) => {
    const d = e.detail || {};
    const x = d.x || (d.el && (d.el.getBoundingClientRect().left + d.el.getBoundingClientRect().width/2)) || window.innerWidth / 2;
    const y = d.y || (d.el && (d.el.getBoundingClientRect().top + d.el.getBoundingClientRect().height/2)) || window.innerHeight / 2;
    const type = d.type || 'coin';
    if (type === 'gem') window.onCollectGem(x, y);
    else if (type === 'powerup') window.onCollectPowerup(x, y);
    else if (type === 'star') window.onCollectStar(x, y);
    else window.onCollectItem(x, y);
  });

})();
