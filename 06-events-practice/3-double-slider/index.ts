interface Options {
  min?: number;
  max?: number;
  formatValue?: (value: number) => string;
  selected?: { from: number; to: number };
}

export default class DoubleSlider {
  public readonly element: HTMLElement;
  public min: number;
  public max: number;
  private formatValue: (value: number) => string;
  private from: number;
  private to: number;
  private activeThumb: 'left' | 'right' | null = null;

  private thumbLeft: HTMLElement;
  private thumbRight: HTMLElement;
  private fromElement: HTMLElement;
  private toElement: HTMLElement;
  private progressElement: HTMLElement;

  constructor({
    min = 0,
    max = 100,
    formatValue = (value) => String(value),
    selected = { from: min, to: max }
  }: Options = {}) {
    this.min = min;
    this.max = max;
    this.formatValue = formatValue;
    this.from = selected.from;
    this.to = selected.to;

    this.element = document.createElement('div');
    this.element.className = 'range-slider';
    this.element.innerHTML = `
      <span data-element="from">${formatValue(this.from)}</span>
      <div class="range-slider__inner">
        <div class="range-slider__progress"></div>
      </div>
      <span class="range-slider__thumb-left" data-element="thumbLeft"></span>
      <span class="range-slider__thumb-right" data-element="thumbRight"></span>
      <span data-element="to">${formatValue(this.to)}</span>
    `;

    this.thumbLeft = this.element.querySelector('.range-slider__thumb-left')!;
    this.thumbRight = this.element.querySelector('.range-slider__thumb-right')!;
    this.fromElement = this.element.querySelector('[data-element="from"]')!;
    this.toElement = this.element.querySelector('[data-element="to"]')!;
    this.progressElement = this.element.querySelector('.range-slider__progress')!;

    const range = this.max - this.min || 1;
    const leftPercent = ((this.from - this.min) / range) * 100;
    const rightPercent = ((this.max - this.to) / range) * 100;
    this.thumbLeft.style.left = `${leftPercent}%`;
    this.thumbRight.style.right = `${rightPercent}%`;
    this.progressElement.style.left = `${leftPercent}%`;
    this.progressElement.style.right = `${rightPercent}%`;

    this.thumbLeft.addEventListener('pointerdown', this.handleLeftPointerDown);
    this.thumbRight.addEventListener('pointerdown', this.handleRightPointerDown);
    document.addEventListener('pointermove', this.handlePointerMove);
    document.addEventListener('pointerup', this.handlePointerUp);
  }

  private handleLeftPointerDown = (event: PointerEvent): void => {
    event.preventDefault();
    this.activeThumb = 'left';
  };

  private handleRightPointerDown = (event: PointerEvent): void => {
    event.preventDefault();
    this.activeThumb = 'right';
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (!this.activeThumb) return;
    const rect = this.element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const range = this.max - this.min || 1;
    const percent = Math.min(Math.max(x / rect.width, 0), 1);
    const value = Math.round(this.min + percent * range);

    if (this.activeThumb === 'left') {
      this.from = Math.min(value, this.to);
    } else {
      this.to = Math.max(value, this.from);
    }

    const leftPercent = ((this.from - this.min) / range) * 100;
    const rightPercent = ((this.max - this.to) / range) * 100;
    this.thumbLeft.style.left = `${leftPercent}%`;
    this.thumbRight.style.right = `${rightPercent}%`;
    this.progressElement.style.left = `${leftPercent}%`;
    this.progressElement.style.right = `${rightPercent}%`;

    this.fromElement.textContent = String(this.from);
    this.toElement.textContent = String(this.to);
  };

  private handlePointerUp = (): void => {
    if (!this.activeThumb) return;
    this.activeThumb = null;

    this.element.dispatchEvent(new CustomEvent('range-select', {
      bubbles: true,
      detail: { from: this.from, to: this.to }
    }));
  };

  public destroy(): void {
    this.thumbLeft.removeEventListener('pointerdown', this.handleLeftPointerDown);
    this.thumbRight.removeEventListener('pointerdown', this.handleRightPointerDown);
    document.removeEventListener('pointermove', this.handlePointerMove);
    document.removeEventListener('pointerup', this.handlePointerUp);
    this.element.remove();
  }
}