(function () {

const canvas = document.createElement("canvas");
document.body.prepend(canvas);

const ctx = canvas.getContext("2d");

canvas.style.position = "fixed";
canvas.style.top = "0";
canvas.style.left = "0";
canvas.style.width = "100%";
canvas.style.height = "100%";
canvas.style.zIndex = "-1";
canvas.style.pointerEvents = "none";

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const DOT_COUNT = 50;
const MAX_DIST = 100;

const DAMPING = 0.9;
const IMPULSE_RADIUS = 50;
const IMPULSE_STRENGTH = 1;

let mouse = { x: null, y: null, vx: 0, vy: 0 };
let lastMouse = null;

class Dot {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;

    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 1 + 0.5;

    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.baseSpeed = speed;
    this.links = [];
  }

  update() {
    this.vx *= DAMPING;
    this.vy *= DAMPING;

    this.x += this.vx;
    this.y += this.vy;

    const currentSpeed = Math.hypot(this.vx, this.vy);

    if (currentSpeed > 0.001) {
      const newSpeed = currentSpeed + (this.baseSpeed - currentSpeed) * 0.02;

      this.vx = (this.vx / currentSpeed) * newSpeed;
      this.vy = (this.vy / currentSpeed) * newSpeed;
    }

    if (this.x < 0) this.x = canvas.width;
    if (this.x > canvas.width) this.x = 0;
    if (this.y < 0) this.y = canvas.height;
    if (this.y > canvas.height) this.y = 0;
  }

  impulse(mx, my, mvx, mvy) {
    const dx = this.x - mx;
    const dy = this.y - my;
    const dist = Math.hypot(dx, dy);

    if (dist < IMPULSE_RADIUS && dist > 0.1) {
      const strength = (1 - dist / IMPULSE_RADIUS) * IMPULSE_STRENGTH;

      const nx = dx / dist;
      const ny = dy / dist;

      const hitSpeed = this.baseSpeed + strength * 2;

      const dirX = nx + mvx * 0.1;
      const dirY = ny + mvy * 0.1;

      const len = Math.hypot(dirX, dirY) || 1;

      this.vx = (dirX / len) * hitSpeed;
      this.vy = (dirY / len) * hitSpeed;
    }
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  }
}

const dots = Array.from({ length: DOT_COUNT }, () => new Dot());

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function updateLinks() {
  for (const dot of dots) {
    dot.links = dots
      .filter(d => d !== dot)
      .map(d => ({ d, dist: dist(dot, d) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 2)
      .map(n => n.d);
  }
}

function drawLines() {
  for (const dot of dots) {
    for (const other of dot.links) {
      const d = dist(dot, other);
      if (d > MAX_DIST) continue;

      const strength = 1 - d / MAX_DIST;

      ctx.beginPath();
      ctx.moveTo(dot.x, dot.y);
      ctx.lineTo(other.x, other.y);

      ctx.strokeStyle = `rgba(255,255,255,${strength})`;
      ctx.lineWidth = strength * 2;
      ctx.stroke();
    }
  }
}

function drawTriangles() {
  for (const a of dots) {
    if (a.links.length < 2) continue;

    const b = a.links[0];
    const c = a.links[1];

    const avg = (dist(a,b)+dist(b,c)+dist(c,a)) / 3;
    const strength = 1 - avg / MAX_DIST;

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.closePath();

    ctx.strokeStyle = `rgba(255,255,255,${strength})`;
    ctx.lineWidth = strength * 2;
    ctx.stroke();
  }
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.globalCompositeOperation = "lighter";

  dots.forEach(d => {
    if (mouse.x !== null) {
      d.impulse(mouse.x, mouse.y, mouse.vx, mouse.vy);
    }
    d.update();
    d.draw();
  });

  updateLinks();
  drawLines();
  drawTriangles();

  ctx.globalCompositeOperation = "source-over";

  requestAnimationFrame(animate);
}

animate();

window.addEventListener("mousemove", e => {
  if (lastMouse) {
    mouse.vx = e.clientX - lastMouse.x;
    mouse.vy = e.clientY - lastMouse.y;
  }

  mouse.x = e.clientX;
  mouse.y = e.clientY;

  lastMouse = { x: e.clientX, y: e.clientY };
});

window.addEventListener("mouseleave", () => {
  mouse.x = null;
  mouse.y = null;
  mouse.vx = 0;
  mouse.vy = 0;
  lastMouse = null;
});

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

})();
