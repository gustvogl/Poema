(() => {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const opening = $("#opening");
  const world = $("#world");
  const openSky = $("#openSky");

  const enterSky = () => {
    opening.classList.add("is-open");
    world.classList.add("is-visible");
    world.removeAttribute("aria-hidden");
    setTimeout(() => $("#hero-title").focus?.(), 900);
  };
  openSky.addEventListener("click", enterSky);

  // Fundo com profundidade suave
  const sky = $("#skyPicture");
  const glow = $("#cursorGlow");
  if (matchMedia("(pointer:fine)").matches && !reducedMotion) {
    document.body.classList.add("has-pointer");
    window.addEventListener("pointermove", (event) => {
      const x = event.clientX / innerWidth - .5;
      const y = event.clientY / innerHeight - .5;
      sky.style.transform = `scale(1.08) translate3d(${x * -14}px, ${y * -10}px, 0)`;
      glow.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
    }, { passive: true });
  }

  // Campo de estrelas animado em canvas
  const canvas = $("#starCanvas");
  const ctx = canvas.getContext("2d");
  let stars = [];
  const resizeCanvas = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(110, Math.floor(innerWidth / 9));
    stars = Array.from({ length: count }, (_, index) => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      r: Math.random() * 1.15 + .2,
      phase: Math.random() * Math.PI * 2,
      speed: .001 + Math.random() * .002,
      gold: index % 5 === 0
    }));
  };
  const drawStars = (time = 0) => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    stars.forEach((star) => {
      const alpha = .28 + Math.sin(time * star.speed + star.phase) * .23;
      ctx.beginPath();
      ctx.fillStyle = star.gold ? `rgba(255,213,112,${alpha + .16})` : `rgba(255,255,245,${alpha})`;
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    });
    if (!reducedMotion) requestAnimationFrame(drawStars);
  };
  resizeCanvas();
  addEventListener("resize", resizeCanvas);
  drawStars();

  // Revelação do poema
  const poemObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    });
  }, { threshold: .35 });
  $$(".poem__line").forEach((line) => poemObserver.observe(line));

  // Mensagens escondidas nas estrelas do início
  const starMessage = $("#starMessage");
  let messageTimer;
  $$(".message-star").forEach((star) => {
    star.addEventListener("click", () => {
      const rect = star.getBoundingClientRect();
      starMessage.textContent = star.dataset.message;
      starMessage.style.left = `${Math.max(165, Math.min(innerWidth - 165, rect.left + rect.width / 2))}px`;
      starMessage.style.top = `${rect.bottom + 8 + scrollY}px`;
      starMessage.classList.add("is-shown");
      clearTimeout(messageTimer);
      messageTimer = setTimeout(() => starMessage.classList.remove("is-shown"), 3800);
    });
  });

  // Constelação clicável
  const constellation = $("#constellation");
  const lineLayer = $("#constellationLines");
  const constellationStars = $$(".constellation__star", constellation);
  const selected = [];
  constellationStars.forEach((star) => {
    star.addEventListener("click", () => {
      if (star.classList.contains("is-active")) return;
      star.classList.add("is-active");
      selected.push(star);
      const count = selected.length;
      $("#progressText").textContent = `${count} de 5 estrelas`;
      $("#progressBar").style.width = `${count * 20}%`;
      if (count > 1) {
        const previous = selected[count - 2];
        addLine(previous, star);
      }
      if (count === constellationStars.length) {
        addLine(selected[count - 1], selected[0]);
        $("#constellationSecret").classList.add("is-visible");
        createSparkBurst(innerWidth * .72, innerHeight * .55, 24);
      }
    });
  });
  function addLine(from, to) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", from.dataset.x);
    line.setAttribute("y1", from.dataset.y);
    line.setAttribute("x2", to.dataset.x);
    line.setAttribute("y2", to.dataset.y);
    lineLayer.appendChild(line);
  }

  // Contador do relacionamento (horário de São Paulo em 12/09/2026)
  const loveStart = new Date("2026-09-12T16:43:00-03:00").getTime();
  const updateCounter = () => {
    const distance = Math.max(0, Date.now() - loveStart);
    const totalSeconds = Math.floor(distance / 1000);
    $("#days").textContent = String(Math.floor(totalSeconds / 86400));
    $("#hours").textContent = String(Math.floor(totalSeconds % 86400 / 3600)).padStart(2, "0");
    $("#minutes").textContent = String(Math.floor(totalSeconds % 3600 / 60)).padStart(2, "0");
    $("#seconds").textContent = String(totalSeconds % 60).padStart(2, "0");
  };
  updateCounter();
  setInterval(updateCounter, 1000);

  // Estrelas guardadas neste navegador
  const wishButton = $("#makeWish");
  const wishLabel = $("#wishCount");
  let wishes = Number(localStorage.getItem("gustavoAnaWishes") || 0);
  const updateWishes = () => {
    wishLabel.textContent = wishes === 0
      ? "Nenhuma estrela acesa neste aparelho ainda."
      : `${wishes} ${wishes === 1 ? "estrela acesa" : "estrelas acesas"} por vocês neste aparelho.`;
  };
  updateWishes();
  wishButton.addEventListener("click", () => {
    wishes += 1;
    localStorage.setItem("gustavoAnaWishes", String(wishes));
    updateWishes();
    const rect = wishButton.getBoundingClientRect();
    createSparkBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 30);
    triggerShootingStar();
  });

  function createSparkBurst(x, y, amount = 18) {
    for (let i = 0; i < amount; i += 1) {
      const spark = document.createElement("span");
      spark.className = "wish-spark";
      spark.textContent = i % 4 === 0 ? "♥" : "✦";
      spark.style.left = `${x}px`;
      spark.style.top = `${y}px`;
      spark.style.setProperty("--dx", `${(Math.random() - .5) * 260}px`);
      spark.style.setProperty("--dy", `${(Math.random() - .5) * 220}px`);
      spark.style.animationDelay = `${Math.random() * .15}s`;
      document.body.appendChild(spark);
      setTimeout(() => spark.remove(), 1700);
    }
  }

  const shootingStarEl = $("#shootingStarEl");
  const triggerShootingStar = () => {
    shootingStarEl.classList.remove("fly");
    void shootingStarEl.offsetWidth;
    shootingStarEl.style.top = `${8 + Math.random() * 30}%`;
    shootingStarEl.classList.add("fly");
  };
  $("#shootingStar").addEventListener("click", triggerShootingStar);

  // Paisagem sonora criada no navegador, sem arquivos externos
  const soundToggle = $("#soundToggle");
  const soundLabel = $("#soundLabel");
  let audioContext;
  let audioTimer;
  let soundOn = false;
  const notes = [220, 277.18, 329.63, 415.3, 329.63, 277.18];
  let noteIndex = 0;
  function playChime() {
    if (!audioContext || !soundOn) return;
    const now = audioContext.currentTime;
    [1, 1.5, 2].forEach((ratio, index) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = index === 0 ? "sine" : "triangle";
      osc.frequency.value = notes[noteIndex % notes.length] * ratio;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(index === 0 ? .032 : .012, now + .08);
      gain.gain.exponentialRampToValueAtTime(.0001, now + 2.8);
      osc.connect(gain).connect(audioContext.destination);
      osc.start(now);
      osc.stop(now + 3);
    });
    noteIndex += 1;
  }
  soundToggle.addEventListener("click", async () => {
    soundOn = !soundOn;
    soundToggle.setAttribute("aria-pressed", String(soundOn));
    soundLabel.textContent = soundOn ? "Silenciar céu" : "Ouvir o céu";
    if (soundOn) {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      await audioContext.resume();
      playChime();
      audioTimer = setInterval(playChime, 2350);
    } else {
      clearInterval(audioTimer);
    }
  });

  // Carta final
  const letter = $("#letterDialog");
  $("#openLetter").addEventListener("click", () => {
    letter.showModal();
    createSparkBurst(innerWidth / 2, innerHeight / 2, 34);
  });
  $("#closeLetter").addEventListener("click", () => letter.close());
  letter.addEventListener("click", (event) => {
    if (event.target === letter) letter.close();
  });
})();
