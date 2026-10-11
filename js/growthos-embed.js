// Intent-loaded GrowthOS embed for the AI Second Brain premium showcase.
(function () {
  const stage = document.querySelector("[data-growthos-embed]");
  if (!stage) return;

  const button = stage.querySelector("[data-growthos-embed-load]");
  const placeholder = stage.querySelector("[data-growthos-placeholder]");
  const frame = stage.querySelector("[data-growthos-frame]");
  const status = stage.querySelector("[data-growthos-embed-status]");
  const external = stage.querySelector("[data-growthos-external]");
  const localPreview = ["127.0.0.1", "localhost"].includes(location.hostname);
  const configuredUrl = new URL(stage.dataset.src);

  if (localPreview) {
    configuredUrl.protocol = "http:";
    configuredUrl.hostname = "127.0.0.1";
    configuredUrl.port = "43173";
  }

  const expectedOrigin = configuredUrl.origin;
  const fullDemoUrl = new URL(configuredUrl);
  fullDemoUrl.pathname = "/beauty-salon/second-brain";
  fullDemoUrl.search = "?lang=bs";
  external.href = fullDemoUrl.href;

  function clampHeight(value) {
    return Math.max(520, Math.min(1400, Math.round(value)));
  }

  function loadDemo() {
    if (frame.src) return;
    button.disabled = true;
    button.textContent = "Učitavanje…";
    status.textContent = "Učitavamo sigurni javni GrowthOS demo…";
    frame.hidden = false;
    frame.src = configuredUrl.href;
  }

  button.addEventListener("click", loadDemo);
  frame.addEventListener("load", function () {
    placeholder.hidden = true;
    frame.classList.add("is-ready");
    status.textContent = "Interaktivni demo je spreman. Svi prikazani podaci su izmišljeni.";
  });

  addEventListener("message", function (event) {
    if (event.origin !== expectedOrigin || event.source !== frame.contentWindow) return;
    const message = event.data;
    if (!message || message.version !== 1 || typeof message.type !== "string") return;
    if (message.type === "growthos:resize" && Number.isFinite(message.height)) {
      frame.style.height = `${clampHeight(message.height)}px`;
    }
    if (message.type === "growthos:navigate" && typeof message.view === "string") {
      stage.dataset.activeView = message.view.slice(0, 40);
    }
  });
})();
