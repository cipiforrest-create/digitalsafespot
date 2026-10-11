// Digital X Brain Galaxy: one damped camera from hero to knowledge sectors.
(function () {
  const journey = document.getElementById("brain-journey");
  if (!journey) return;

  const viewport = journey.querySelector(".brain-viewport");
  const map = journey.querySelector(".brain-map");
  const hero = journey.querySelector("[data-brain-hero]");
  const warp = journey.querySelector(".warp-field");
  const progressBar = journey.querySelector(".brain-progress span");
  const sectors = [...journey.querySelectorAll("[data-brain-sector]")];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = matchMedia("(max-width: 600px)");

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const mix = (from, to, amount) => from + (to - from) * amount;
  const smootherstep = (value) => {
    const t = clamp(value);
    return t * t * t * (t * (t * 6 - 15) + 10);
  };

  const sectorPoints = sectors.map((sector) => ({
    x: Number(sector.dataset.x),
    y: Number(sector.dataset.y),
    scale: Number(sector.dataset.scale),
    rotation: Number(sector.dataset.rotate || 0),
  }));

  const initialCamera = () => ({
    x: 0,
    y: mobile.matches ? -1.5 : 0,
    scale: mobile.matches ? 0.82 : 0.88,
    rotation: -2,
    brightness: 0.86,
    saturation: 0.9,
    blur: 0,
    warp: 0,
    heroOpacity: 1,
    progress: 0,
  });

  const cameraTarget = initialCamera();
  const cameraCurrent = initialCamera();
  let activeSector = -1;
  let animationFrame = 0;
  let previousTime = performance.now();
  let lastInputTime = previousTime;

  function cameraPath() {
    return [initialCamera(), ...sectorPoints];
  }

  function setActiveSector(index) {
    if (index === activeSector) return;
    activeSector = index;
    sectors.forEach((sector, sectorIndex) => {
      sector.classList.toggle("is-active", sectorIndex === activeSector);
    });
  }

  function updateTargets() {
    const rect = journey.getBoundingClientRect();
    const total = Math.max(1, rect.height - innerHeight);
    const progress = clamp(-rect.top / total);
    const path = cameraPath();
    const pathValue = progress * (path.length - 1);
    const fromIndex = Math.min(path.length - 2, Math.floor(pathValue));
    const toIndex = Math.min(path.length - 1, fromIndex + 1);
    const local = pathValue - fromIndex;
    const eased = smootherstep(local);
    const from = path[fromIndex];
    const to = path[toIndex];
    const warpEnergy = reduced.matches ? 0 : Math.pow(Math.sin(Math.PI * local), 6);

    cameraTarget.x = mix(from.x, to.x, eased) * (mobile.matches ? 0.72 : 1);
    cameraTarget.y = mix(from.y, to.y, eased) * (mobile.matches ? 0.72 : 1);
    cameraTarget.scale = mix(from.scale, to.scale, eased) * (mobile.matches ? 0.94 : 1);
    cameraTarget.rotation = mix(from.rotation, to.rotation, eased) + Math.sin(progress * Math.PI * 2) * 0.35;
    cameraTarget.brightness = 0.88 + warpEnergy * 0.28;
    cameraTarget.saturation = 0.94 + warpEnergy * 0.34;
    cameraTarget.blur = warpEnergy * (mobile.matches ? 0.55 : 1.05);
    cameraTarget.warp = warpEnergy;
    cameraTarget.heroOpacity = 1 - smootherstep(progress / 0.16);
    cameraTarget.progress = progress;

    const sectorIndex = progress < 0.13
      ? -1
      : clamp(Math.round(pathValue - 1), 0, sectors.length - 1);
    setActiveSector(sectorIndex);
    lastInputTime = performance.now();
  }

  function render() {
    map.style.transform = `translate3d(calc(-50% + ${cameraCurrent.x.toFixed(3)}vw),calc(-50% + ${cameraCurrent.y.toFixed(3)}vh),0) scale(${cameraCurrent.scale.toFixed(4)}) rotate(${cameraCurrent.rotation.toFixed(3)}deg)`;
    map.style.filter = `brightness(${cameraCurrent.brightness.toFixed(3)}) saturate(${cameraCurrent.saturation.toFixed(3)}) blur(${cameraCurrent.blur.toFixed(2)}px)`;
    viewport.style.setProperty("--warp", cameraCurrent.warp.toFixed(3));
    warp.style.opacity = (cameraCurrent.warp * 0.72).toFixed(3);
    progressBar.style.transform = `scaleX(${cameraCurrent.progress.toFixed(4)})`;
    hero.style.opacity = cameraCurrent.heroOpacity.toFixed(3);
    hero.style.transform = `translate3d(0,${((1 - cameraCurrent.heroOpacity) * -24).toFixed(2)}px,0) scale(${(0.985 + cameraCurrent.heroOpacity * 0.015).toFixed(4)})`;
    hero.style.pointerEvents = cameraCurrent.heroOpacity > 0.12 ? "auto" : "none";
  }

  function tick(now) {
    animationFrame = 0;
    const deltaSeconds = Math.min(0.05, Math.max(0.001, (now - previousTime) / 1000));
    previousTime = now;
    const amount = 1 - Math.exp(-deltaSeconds * (mobile.matches ? 9 : 7));
    let largestDifference = 0;

    for (const key of Object.keys(cameraCurrent)) {
      const difference = cameraTarget[key] - cameraCurrent[key];
      cameraCurrent[key] += difference * amount;
      largestDifference = Math.max(largestDifference, Math.abs(difference));
    }

    render();
    if (largestDifference > 0.0008 || now - lastInputTime < 140) requestTick();
  }

  function requestTick() {
    if (!animationFrame && !reduced.matches) animationFrame = requestAnimationFrame(tick);
  }

  function handleInput() {
    if (reduced.matches) return;
    updateTargets();
    requestTick();
  }

  addEventListener("scroll", handleInput, { passive: true });
  addEventListener("resize", handleInput);
  mobile.addEventListener?.("change", handleInput);
  reduced.addEventListener?.("change", () => {
    if (reduced.matches) {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      map.removeAttribute("style");
      hero.removeAttribute("style");
      warp.removeAttribute("style");
    } else {
      Object.assign(cameraCurrent, initialCamera());
      handleInput();
    }
  });

  if (!reduced.matches) {
    updateTargets();
    Object.assign(cameraCurrent, cameraTarget);
    render();
    requestTick();
  }
})();
