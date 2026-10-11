export class CinematicLoader {
  constructor(element) {
    this.element = element;
    this.percentage = element.querySelector("[data-loader-percentage]");
    this.bar = element.querySelector("[data-loader-bar]");
    this.finished = false;
  }

  update(progress) {
    const value = Math.min(100, Math.max(0, Math.round(progress * 100)));
    this.percentage.textContent = `${value}%`;
    this.bar.style.transform = `scaleX(${value / 100})`;
    this.element.setAttribute("aria-valuenow", String(value));
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    this.update(1);
    this.element.classList.add("is-complete");
    this.element.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-loading");
  }
}
