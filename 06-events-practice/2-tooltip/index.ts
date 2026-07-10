export default class Tooltip {
  static instance: Tooltip | null = null;

  private _element: HTMLElement | null = null;
  private onPointerOver!: (event: Event) => void;
  private onPointerOut!: (event: Event) => void;

  constructor() {
    if (Tooltip.instance) {
      return Tooltip.instance;
    }
    Tooltip.instance = this;
    this.onPointerOver = this.handlePointerOver.bind(this);
    this.onPointerOut = this.handlePointerOut.bind(this);
  }

    public get element(): HTMLElement | null {
    return this._element;
    }
    
  initialize(): void {
    document.addEventListener('pointerover', this.onPointerOver);
    document.addEventListener('pointerout', this.onPointerOut);
  }

  render(html: string): void {
    if (!this._element) {
      this._element = document.createElement('div');
      this._element.className = 'tooltip';
      this._element.style.position = 'absolute';
      this._element.style.display = 'none';
      document.body.append(this._element);
    }
    this._element.innerHTML = html;
    this._element.style.display = 'block';
  }

  private handlePointerOver = (event: Event): void => {
    const target = (event.target as HTMLElement)?.closest('[data-tooltip]') as HTMLElement | null;
    if (!target) return;

    const tooltipText = target.dataset.tooltip;
    if (tooltipText === undefined) return;

    this.render(tooltipText);
    this.positionTooltip(event as PointerEvent);
  };

  private handlePointerOut = (): void => {
    this.hideTooltip();
  };

  private positionTooltip(event: PointerEvent): void {
    if (!this._element) return;
    this._element.style.left = `${event.clientX + 10}px`;
    this._element.style.top = `${event.clientY + 10}px`;
  }

  private hideTooltip(): void {
    if (this._element) {
      this._element.remove();
      this._element = null;
    }
  }

  destroy(): void {
    this.hideTooltip();
    document.removeEventListener('pointerover', this.onPointerOver);
    document.removeEventListener('pointerout', this.onPointerOut);
    Tooltip.instance = null;
  }
}