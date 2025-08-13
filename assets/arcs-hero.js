// arcs-hero.js: Interactive electrical arc grabber in the hero section
(function() {
  const canvasId = 'arcs-hero-canvas';
  let canvas = document.getElementById(canvasId);
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = canvasId;
    canvas.style.position = 'absolute';
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'auto';
    canvas.style.zIndex = 2;
    document.querySelector('.contact-hero').appendChild(canvas);
  }
  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Arc endpoints (start and end)
  let arc = {
    x1: canvas.width * 0.3,
    y1: canvas.height * 0.5,
    x2: canvas.width * 0.7,
    y2: canvas.height * 0.5
  };
  let dragging = null;

  function randomBetween(a, b) {
    return a + Math.random() * (b - a);
  }

  function drawArc(ctx, x1, y1, x2, y2, color) {
    const steps = 16;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const nx = x1 + (x2 - x1) * t + randomBetween(-10, 10);
      const ny = y1 + (y2 - y1) * t + randomBetween(-10, 10);
      ctx.lineTo(nx, ny);
    }
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.8;
    ctx.stroke();
    ctx.restore();
    // Draw grab handles
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(x1, y1, 14, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0,255,200,0.18)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x2, y2, 14, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0,255,200,0.18)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x1, y1, 7, 0, 2 * Math.PI);
    ctx.fillStyle = '#00ffc8';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x2, y2, 7, 0, 2 * Math.PI);
    ctx.fillStyle = '#00ffc8';
    ctx.fill();
    ctx.restore();
  }

  function animate() {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawArc(ctx, arc.x1, arc.y1, arc.x2, arc.y2, 'rgba(0,255,200,0.85)');
    requestAnimationFrame(animate);
  }
  animate();

  function isNear(x, y, px, py) {
    return Math.hypot(x - px, y - py) < 18;
  }

  canvas.addEventListener('mousedown', function(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (isNear(x, y, arc.x1, arc.y1)) dragging = 'start';
    else if (isNear(x, y, arc.x2, arc.y2)) dragging = 'end';
  });
  window.addEventListener('mousemove', function(e) {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (dragging === 'start') { arc.x1 = x; arc.y1 = y; }
    else if (dragging === 'end') { arc.x2 = x; arc.y2 = y; }
  });
  window.addEventListener('mouseup', function() { dragging = null; });
})();
