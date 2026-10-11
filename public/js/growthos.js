(() => {
  const localPreview = ["localhost", "127.0.0.1"].includes(location.hostname);
  const demoBase = localPreview ? "http://127.0.0.1:43173" : "https://digital-x-growthos.vercel.app";
  const demoPath = "/beauty-salon/dashboard?lang=bs&utm_source=www.digital-x-marketing.com&utm_medium=growthos_showcase";

  document.querySelectorAll("[data-growthos-demo]").forEach((link) => {
    link.href = `${demoBase}${demoPath}`;
    link.target = "_blank";
    link.rel = "noopener";
  });

  const previews = {
    dashboard: {
      src: "assets/images/growthos-dashboard.webp",
      alt: "GrowthOS kontrolna tabla",
      caption: "Jedan pregled prihoda, pipelinea, termina i aktivnosti.",
    },
    crm: {
      src: "assets/images/growthos-crm.webp",
      alt: "GrowthOS CRM pipeline sa prodajnim fazama",
      caption: "Leadovi, vrijednost i naredni koraci kroz jasan prodajni pipeline.",
    },
    "second-brain": {
      src: "assets/images/growthos-second-brain.webp",
      alt: "GrowthOS Second Brain modul za povezano poslovno znanje",
      caption: "Znanje, izvori i poslovni kontekst dostupni timu na jednom mjestu.",
    },
  };

  const image = document.querySelector("[data-growthos-preview]");
  const caption = document.querySelector("[data-growthos-caption]");
  const frame = image?.closest(".growthos-product-frame");

  document.querySelectorAll("[data-preview-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const preview = previews[button.dataset.previewTarget];
      if (!preview || !image) return;

      document.querySelectorAll("[data-preview-target]").forEach((control) => {
        const active = control === button;
        control.classList.toggle("is-active", active);
        control.setAttribute("aria-pressed", String(active));
      });

      frame?.classList.add("is-changing");
      const show = () => {
        image.src = preview.src;
        image.alt = preview.alt;
        if (caption) caption.textContent = preview.caption;
        frame?.classList.remove("is-changing");
      };
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) show();
      else setTimeout(show, 120);
    });
  });
})();

