import { createElement } from "../../shared/utils/create-element";
interface Options {
  data?: number[];
  label?: string;
  value?: number;
  link?: string;
  formatHeading?: (value: number) => string;
}

export default class ColumnChart {
  private data: number[];
  private label: string;
  private value: number;
  private link?: string;
  private formatHeading?: (value: number) => string;
  readonly chartHeight: number = 50;

  private _element: HTMLElement | null = null;
  private bodyElement: HTMLElement | null = null;

  constructor(options: Options = {}) {
    this.data = options.data || [];
    this.label = options.label || '';
    this.value = options.value ?? 0;
    this.link = options.link;
    this.formatHeading = options.formatHeading;

    this.render();
  }

  public get element(): HTMLElement {
    if (!this._element) {
      throw new Error('ColumnChart ошибка');
    }
    return this._element;
  }

private get template(): string {
  const formattedValue = this.formatHeading
    ? this.formatHeading(this.value)
    : String(this.value);

  return `
    <div class="column-chart">
      <div class="column-chart__title">
        Total ${this.label}
        ${this.link ? `<a href="${this.link}" class="column-chart__link">View all</a>` : ''}
      </div>
      <div class="column-chart__container">
        <div data-element="header" class="column-chart__header">${formattedValue}</div>
        <div data-element="body" class="column-chart__chart">
          ${this.buildColumns()}
        </div>
      </div>
    </div>
  `;
}

  private render(): void {
    this._element = createElement(this.template);
    this.bodyElement = this._element.querySelector('[data-element="body"]') as HTMLElement;
    this.updateLoadingState();
  }

  private buildColumns(): string {
    if (!this.data.length) return '';

    const sanitizedData = this.data.map(item => Math.max(0, Number(item)));
    const maxValue = Math.max(...sanitizedData, 0);

    if (maxValue === 0) {
      return this.data.map(() => `<div style="--value: 0" data-tooltip="0%"></div>`).join('');
    }

    const scale = this.chartHeight / maxValue;

    return sanitizedData
      .map(item => {
        const value = Math.floor(item * scale);
        const percent = ((item / maxValue) * 100).toFixed(0);
        return `<div style="--value: ${value}" data-tooltip="${percent}%"></div>`;
      })
      .join('');
  }

  private updateLoadingState(): void {
    const isLoading = !this.data.length;
    if (this._element) {
      this._element.classList.toggle('column-chart_loading', isLoading);
    }
  }

  public update(data: number[]): void {
    this.data = data;
    this.updateLoadingState();
    if (this.bodyElement) {
      this.bodyElement.innerHTML = this.buildColumns();
    }
  }

  public remove(): void {
    if (this._element && this._element.parentNode) {
      this._element.parentNode.removeChild(this._element);
    }
  }

  public destroy(): void {
    this.remove();
    this._element = null;
    this.bodyElement = null;
  }
}