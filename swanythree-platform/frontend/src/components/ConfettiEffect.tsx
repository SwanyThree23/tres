/**
 * SwanyThree Confetti Effect — Canvas-free confetti using CSS animations.
 */

const COLORS = ['#D4AF37', '#800020', '#F5E6D3', '#FFD700', '#FF6B6B', '#4ECDC4', '#A855F7'];

interface Particle {
  x: number;
  y: number;
  color: string;
  size: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

function createParticles(count: number, spread: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: window.innerWidth / 2 + (Math.random() - 0.5) * spread,
    y: window.innerHeight * 0.3,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: Math.random() * 8 + 4,
    velocityX: (Math.random() - 0.5) * 15,
    velocityY: Math.random() * -18 - 5,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 10,
    opacity: 1,
  }));
}

function renderParticles(particles: Particle[]) {
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;overflow:hidden;';
  document.body.appendChild(container);

  const gravity = 0.5;
  const friction = 0.99;
  let frame = 0;
  const maxFrames = 120;

  const elements = particles.map((p) => {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${p.size}px;height:${p.size}px;background:${p.color};border-radius:${Math.random() > 0.5 ? '50%' : '2px'};left:${p.x}px;top:${p.y}px;pointer-events:none;`;
    container.appendChild(el);
    return el;
  });

  function animate() {
    frame++;
    if (frame > maxFrames) {
      container.remove();
      return;
    }

    particles.forEach((p, i) => {
      p.velocityY += gravity;
      p.velocityX *= friction;
      p.x += p.velocityX;
      p.y += p.velocityY;
      p.rotation += p.rotationSpeed;
      p.opacity = Math.max(0, 1 - frame / maxFrames);

      const el = elements[i];
      el.style.transform = `translate(${p.x - parseFloat(el.style.left)}px, ${p.y - parseFloat(el.style.top)}px) rotate(${p.rotation}deg)`;
      el.style.opacity = String(p.opacity);
    });

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

/** High-intensity confetti burst — level ups */
export function fireHigh() {
  renderParticles(createParticles(80, 400));
}

/** Medium-intensity confetti — badge earned */
export function fireMedium() {
  renderParticles(createParticles(40, 250));
}

/** Low-intensity sparkle — streak milestones */
export function fireLow() {
  renderParticles(createParticles(20, 150));
}
