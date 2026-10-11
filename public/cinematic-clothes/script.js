/* ===== ONYX SUPPLY — MIDNIGHT DROP / interactions ===== */

/* ---------- PRODUCT DATA ---------- */
const PRODUCTS = [
  {
    id: "hoodie",
    name: "HEAVYWEIGHT HOODIE",
    price: 180,
    desc: "480GSM matte-black loopback fleece. Chrome-tipped drawcords.",
    video: "assets/videos/cloth-2.mp4",
    tag: "480GSM",
    sizes: [
      { label: "S", stock: true },
      { label: "M", stock: true },
      { label: "L", stock: false },
      { label: "XL", stock: true },
    ],
  },
  {
    id: "cargo",
    name: "TACTICAL CARGO",
    price: 210,
    desc: "Ripstop cargo, articulated knee, chrome zip pockets.",
    video: "assets/videos/cloth-3.mp4",
    tag: "RIPSTOP",
    sizes: [
      { label: "30", stock: true },
      { label: "32", stock: false },
      { label: "34", stock: true },
      { label: "36", stock: false },
    ],
  },
  {
    id: "puffer",
    name: "CHROME PUFFER",
    price: 340,
    desc: "Matte shell, chrome-accent baffles, 700-fill warmth.",
    video: "assets/videos/cloth-4.mp4",
    tag: "700-FILL",
    sizes: [
      { label: "S", stock: true },
      { label: "M", stock: true },
      { label: "L", stock: true },
      { label: "XL", stock: false },
    ],
  },
];

/* ---------- RENDER PRODUCT CARDS ---------- */
const grid = document.getElementById("productGrid");

PRODUCTS.forEach((p) => {
  const card = document.createElement("article");
  card.className = "card";
  card.dataset.id = p.id;

  const sizesHtml = p.sizes
    .map(
      (s) =>
        `<button class="size ${s.stock ? "" : "is-soldout"}" data-size="${s.label}" ${
          s.stock ? "" : "disabled"
        }>${s.label}</button>`
    )
    .join("");

  card.innerHTML = `
    <div class="card__media" data-media>
      <span class="card__tag">${p.tag}</span>
      <div class="card__poster">${p.name}</div>
      <video class="card__video" muted loop playsinline preload="auto" src="${p.video}"></video>

      <span class="card__hoverhint">▶ HOVER TO SPIN</span>
    </div>
    <div class="card__body">
      <div class="card__row">
        <h3 class="card__name">${p.name}</h3>
        <span class="card__price">$${p.price}</span>
      </div>
      <p class="card__desc">${p.desc}</p>
      <div class="card__sizes" data-sizes>${sizesHtml}</div>
      <button class="card__add" data-add>ADD TO CART</button>
      <p class="card__soldnote">Selected size sold out — <a href="#notify" style="color:var(--acid)">notify me</a>.</p>
    </div>
  `;
  grid.appendChild(card);

  /* ---- HOVER-TO-PLAY ---- */
  const media = card.querySelector("[data-media]");
  const video = card.querySelector(".card__video");

  let hovering = false;
  const attemptPlay = () => {
    const pr = video.play();
    if (pr && pr.catch) {
      pr.catch(() => {
        // retry shortly if the browser blocked/interrupted playback
        if (hovering) setTimeout(() => { if (hovering) video.play().catch(() => {}); }, 120);
      });
    }
  };
  const play = () => {
    hovering = true;
    video.classList.add("is-playing");
    // Do NOT reset currentTime here — seeking can interrupt play().
    attemptPlay();
  };
  const stop = () => {
    hovering = false;
    video.pause();
    video.currentTime = 0; // reset for next hover so the spin starts clean
    video.classList.remove("is-playing");
  };
  // Keep playing if a seek or stall briefly pauses it while hovered
  video.addEventListener("pause", () => {
    if (hovering) attemptPlay();
  });
  media.addEventListener("mouseenter", play);
  media.addEventListener("mouseleave", stop);
  // touch: tap toggles
  media.addEventListener("click", () => {
    if (video.classList.contains("is-playing")) stop();
    else play();
  });

  /* ---- SIZE SELECT ---- */
  let selectedSize = null;
  card.querySelectorAll(".size").forEach((btn) => {
    if (btn.disabled) return;
    btn.addEventListener("click", () => {
      card.querySelectorAll(".size").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      selectedSize = btn.dataset.size;
      card.classList.remove("size-soldout");
    });
  });

  /* ---- ADD TO CART ---- */
  card.querySelector("[data-add]").addEventListener("click", () => {
    if (!selectedSize) {
      // try to check whether any size is available
      const anyStock = p.sizes.some((s) => s.stock);
      if (!anyStock) {
        card.classList.add("size-soldout");
        toast("ALL SIZES SOLD OUT");
        return;
      }
      toast("PICK A SIZE FIRST");
      card.querySelector(".card__sizes").animate(
        [{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }],
        { duration: 250 }
      );
      return;
    }
    addToCart(p, selectedSize);
  });
});

/* ---------- CART ---------- */
let cart = [];
const cartCount = document.getElementById("cartCount");
const drawer = document.getElementById("drawer");
const drawerOverlay = document.getElementById("drawerOverlay");
const drawerItems = document.getElementById("drawerItems");
const drawerTotal = document.getElementById("drawerTotal");

function addToCart(product, size) {
  const key = product.id + "-" + size;
  const existing = cart.find((i) => i.key === key);
  if (existing) existing.qty += 1;
  else cart.push({ key, id: product.id, name: product.name, price: product.price, size, video: product.video, qty: 1 });
  renderCart();
  toast(`${product.name} · ${size} ADDED`);
  openDrawer();
}

function removeFromCart(key) {
  cart = cart.filter((i) => i.key !== key);
  renderCart();
}

function renderCart() {
  const totalQty = cart.reduce((n, i) => n + i.qty, 0);
  cartCount.textContent = totalQty;

  if (cart.length === 0) {
    drawerItems.innerHTML = `<p class="drawer__empty">Your cart is empty. Go grab the fit.</p>`;
    drawerTotal.textContent = "$0";
    return;
  }

  drawerItems.innerHTML = cart
    .map(
      (i) => `
    <div class="drawer-item">
      <video class="drawer-item__thumb" src="${i.video}" muted></video>
      <div class="drawer-item__info">
        <div class="drawer-item__name">${i.name}</div>
        <div class="drawer-item__meta">Size ${i.size} · Qty ${i.qty}</div>
        <div class="drawer-item__price">$${i.price * i.qty}</div>
        <button class="drawer-item__remove" data-remove="${i.key}">REMOVE</button>
      </div>
    </div>`
    )
    .join("");

  drawerItems.querySelectorAll("[data-remove]").forEach((btn) =>
    btn.addEventListener("click", () => removeFromCart(btn.dataset.remove))
  );

  const total = cart.reduce((n, i) => n + i.price * i.qty, 0);
  drawerTotal.textContent = "$" + total;
}

/* ---------- DRAWER OPEN/CLOSE ---------- */
function openDrawer() {
  drawer.classList.add("is-open");
  drawerOverlay.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
}
function closeDrawer() {
  drawer.classList.remove("is-open");
  drawerOverlay.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
}
document.getElementById("cartBtn").addEventListener("click", openDrawer);
document.getElementById("drawerClose").addEventListener("click", closeDrawer);
drawerOverlay.addEventListener("click", closeDrawer);
document.getElementById("checkoutBtn").addEventListener("click", () => {
  if (cart.length === 0) { toast("CART IS EMPTY"); return; }
  toast("DEMO ONLY — NO PAYMENT TAKEN");
});

/* ---------- TOAST ---------- */
let toastTimer;
const toastEl = document.getElementById("toast");
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 2200);
}

/* ---------- NOTIFY FORM ---------- */
document.getElementById("notifyForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("notifyEmail").value.trim();
  const msg = document.getElementById("notifyMsg");
  if (!email) return;
  msg.textContent = "✓ LOCKED IN — WE'LL PING " + email.toUpperCase();
  document.getElementById("notifyEmail").value = "";
});

/* ---------- COUNTDOWN ---------- */
const DROP_DATE = new Date();
DROP_DATE.setDate(DROP_DATE.getDate() + 3);
DROP_DATE.setHours(20, 0, 0, 0); // 8pm drop

const cd = {
  d: document.getElementById("cd-days"),
  h: document.getElementById("cd-hours"),
  m: document.getElementById("cd-mins"),
  s: document.getElementById("cd-secs"),
};
function pad(n) { return String(n).padStart(2, "0"); }
function tickCountdown() {
  let diff = Math.max(0, DROP_DATE - Date.now());
  const d = Math.floor(diff / 86400000); diff -= d * 86400000;
  const h = Math.floor(diff / 3600000); diff -= h * 3600000;
  const m = Math.floor(diff / 60000); diff -= m * 60000;
  const s = Math.floor(diff / 1000);
  cd.d.textContent = pad(d);
  cd.h.textContent = pad(h);
  cd.m.textContent = pad(m);
  cd.s.textContent = pad(s);
}
tickCountdown();
setInterval(tickCountdown, 1000);

/* ---------- HERO SCROLL-SCRUB ---------- */
const heroSection = document.getElementById("hero");
const heroVideo = document.getElementById("heroVideo");
let heroReady = heroVideo.readyState >= HTMLMediaElement.HAVE_METADATA && Number.isFinite(heroVideo.duration);
let targetTime = 0;
let seekPending = false;

function markHeroReady() {
  heroReady = Number.isFinite(heroVideo.duration) && heroVideo.duration > 0;
  onScroll();
}
heroVideo.addEventListener("loadedmetadata", markHeroReady);
heroVideo.addEventListener("durationchange", markHeroReady);
heroVideo.addEventListener("seeked", () => { seekPending = false; });

function onScroll() {
  if (!heroReady || !heroVideo.duration) return;
  const rect = heroSection.getBoundingClientRect();
  const scrollable = heroSection.offsetHeight - window.innerHeight;
  // progress 0..1 through the pinned hero
  const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
  targetTime = progress * (heroVideo.duration - 0.05);
}

// smooth interpolation so scrubbing feels cinematic
function scrubLoop() {
  if (heroReady && heroVideo.duration) {
    if (Math.abs(targetTime - heroVideo.currentTime) > 0.015 && !seekPending) {
      try {
        seekPending = true;
        heroVideo.currentTime = Math.max(0, Math.min(heroVideo.duration - 0.05, targetTime));
      } catch (e) { seekPending = false; }
    }
  }
  requestAnimationFrame(scrubLoop);
}
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);
onScroll();
requestAnimationFrame(scrubLoop);

/* Poster frame while loading */
heroVideo.addEventListener("loadeddata", () => {
  markHeroReady();
  try { heroVideo.currentTime = Math.max(0.01, targetTime); } catch (e) {}
});

/* ---------- KEYBOARD: ESC closes drawer ---------- */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeDrawer();
});
