/* eslint-disable */
/**
 * 创建星空雨 (优化版)
 * @description 性能优化、高清屏适配、自动暂停机制
 */
function renderStarrySky() {
  if (document.getElementById('starry-sky-vixcity')) {
    return;
  }
  const CONFIG = {
    amount: 0.1, // 降低星星密度因子 (相对于屏幕宽度)，减少性能开销
    colors: {
      star: '226,225,142',   // 普通星星颜色
      giant: '180,184,240',  // 巨型星星颜色
      comet: '226,225,224'   // 流星颜色
    },
    speed: {
      min: 0.2,
      max: 0.8, // 降低最大速度以减少计算开销
      comet: 2.0 // 降低流星速度
    }
  };
  const div = document.createElement('div');
  div.className = 'relative'; 
  const canvas = document.createElement('canvas');
  canvas.id = 'starry-sky-vixcity';
  canvas.className = 'fixed top-0 left-0 pointer-events-none w-full h-full';
  canvas.style.zIndex = '1'; 
  canvas.style.willChange = 'contents'; 
  div.appendChild(canvas);
  document.body.appendChild(div);
  const ctx = canvas.getContext('2d');
  const htmlRoot = document.documentElement;
  let width, height, starCount;
  let stars = [];
  let animationFrameId = null;
  let isRunning = false;
  let lastTime = 0; 
  const targetFPS = 30; 
  const frameInterval = 1000 / targetFPS;
  class Star {
    constructor() {
      this.reset(true);
    }
    reset(initial = false) {
      this.isGiant = Math.random() < 0.03;
      this.isComet = !this.isGiant && !initial && Math.random() < 0.03; 
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.r = this.isGiant ? random(1.5, 2.5) : random(0.8, 1.5); 
      const baseSpeed = random(CONFIG.speed.min, CONFIG.speed.max);
      this.dx = baseSpeed;
      this.dy = -baseSpeed; 
      if (this.isComet) {
        this.dx *= random(CONFIG.speed.comet, CONFIG.speed.comet * 1.5); 
        this.dy *= random(CONFIG.speed.comet, CONFIG.speed.comet * 1.5);
        this.r = random(1.0, 1.8); 
        this.x -= 200; 
      }
      this.opacity = 0;
      this.opacityTresh = random(0.3, 0.7); 
      this.fadeSpeed = random(0.002, 0.008); 
      this.fadingIn = true;
      this.fadingOut = false;
    }
    update() {
      this.x += this.dx;
      this.y += this.dy;
      if (this.fadingIn) {
        this.opacity += this.fadeSpeed;
        if (this.opacity >= this.opacityTresh) {
          this.fadingIn = false;
        }
      } else if (this.fadingOut) {
        this.opacity -= this.fadeSpeed;
        if (this.opacity < 0) {
          this.opacity = 0;
          this.reset();
        }
      } else {
        if (this.x > width - width / 5 || this.y < height / 5) {
          this.fadingOut = true;
        }
      }
      if (this.x > width + 50 || this.y < -50) {
        this.reset();
      }
    }
    draw() {
      if (this.opacity <= 0) return;
      if (this.isComet) {
        const angle = Math.atan2(this.dy, this.dx);
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const r = this.r;
        const headX = this.x;
        const headY = this.y;
        const tailLen = 60; 
        const tailWid = r * 1.5; 
        ctx.fillStyle = `rgba(${CONFIG.colors.comet}, ${Math.min(1, this.opacity * 1.5)})`;
        ctx.beginPath();
        ctx.arc(headX, headY, r * 1.2, 0, Math.PI * 2);
        ctx.fill();
        const x1 = headX - 0.3 * tailLen * cosA - 0.5 * tailWid * sinA;
        const y1 = headY - 0.3 * tailLen * sinA + 0.5 * tailWid * cosA;
        const x2 = headX - 0.8 * tailLen * cosA;
        const y2 = headY - 0.8 * tailLen * sinA;
        const x3 = headX - 0.3 * tailLen * cosA + 0.5 * tailWid * sinA;
        const y3 = headY - 0.3 * tailLen * sinA - 0.5 * tailWid * cosA;
        ctx.fillStyle = `rgba(${CONFIG.colors.comet}, ${this.opacity * 0.5})`;
        ctx.beginPath();
        ctx.moveTo(headX, headY);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.closePath();
        ctx.fill();
        const trailX1 = x2 - 0.3 * tailLen * cosA - 0.3 * tailWid * sinA;
        const trailY1 = y2 - 0.3 * tailLen * sinA + 0.3 * tailWid * cosA;
        const trailX2 = x2 - 0.8 * tailLen * cosA;
        const trailY2 = y2 - 0.8 * tailLen * sinA;
        const trailX3 = x2 - 0.3 * tailLen * cosA + 0.3 * tailWid * sinA;
        const trailY3 = y2 - 0.3 * tailLen * sinA - 0.3 * tailWid * cosA;
        ctx.fillStyle = `rgba(${CONFIG.colors.comet}, ${this.opacity * 0.15})`; 
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(trailX1, trailY1);
        ctx.lineTo(trailX2, trailY2);
        ctx.lineTo(trailX3, trailY3);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = `rgba(${this.isGiant ? CONFIG.colors.giant : CONFIG.colors.star}, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  function random(min, max) {
    return Math.random() * (max - min) + min;
  }
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    starCount = Math.floor(width * CONFIG.amount);
    if (stars.length < starCount) {
      for (let i = stars.length; i < starCount; i++) {
        stars.push(new Star());
      }
    } else if (stars.length > starCount) {
      stars.splice(starCount); 
    }
  }
  function animate(timestamp) {
    if (!isRunning) return;
    const deltaTime = timestamp - lastTime;
    if (deltaTime > frameInterval) {
      if (!htmlRoot.classList.contains('dark')) {
        ctx.clearRect(0, 0, width, height);
      }
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        if (!star.isGiant && !star.isComet) {
          star.draw();
        }
      }
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        if (star.isGiant && !star.isComet) {
          star.draw();
        }
      }
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        if (star.isComet) {
          star.draw();
        }
      }
      lastTime = timestamp - (deltaTime % frameInterval);
    }
    animationFrameId = requestAnimationFrame(animate);
  }
  function start() {
    if (!isRunning) {
      isRunning = true;
      resize();
      lastTime = performance.now();
      animate();
    }
  }
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 200);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
    } else {
      start();
    }
  });
  if (htmlRoot.classList.contains('dark')) {
    start();
  }
  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(animationFrameId);
  });
}
window.renderStarrySky = renderStarrySky;