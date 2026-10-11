export class ChapterRail {
  constructor(element, chapters) {
    this.element = element;
    this.chapters = chapters;
    this.items = [...element.querySelectorAll("[data-rail-chapter]")];
    this.current = -1;
  }

  chapterIndex(progress) {
    const index = this.chapters.findIndex((chapter) => progress >= chapter.start && progress < chapter.end);
    return index < 0 ? this.chapters.length - 1 : index;
  }

  update(progress) {
    const chapterIndex = this.chapterIndex(progress);
    if (chapterIndex === this.current) return chapterIndex;
    this.current = chapterIndex;
    this.items.forEach((item, index) => {
      const active = index === chapterIndex;
      item.classList.toggle("is-active", active);
      if (active) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
    });
    return chapterIndex;
  }
}
