import { createElement } from "../../shared/utils/create-element";

interface Options {
  data?: number[];
  label?: string;
  value?: number | string;
  link?: string;
  formatHeading?: (value: number | string) => string;
}

export default class ColumnChart {
  private data: number[];
  private label: string;
  private value: number | string;
  private link?: string;
  private formatHeading?: (value: number | string) => string;
  readonly chartHeight: number = 50;

  public element: HTMLElement;
  private bodyElement: HTMLElement;

  constructor(options: Options = {}) {
    this.data = options.data || [];
    this.label = options.label || '';
    this.value = options.value ?? 0;
    this.link = options.link || '';
    this.formatHeading = options.formatHeading;

    this.element = this.createElement();
    this.bodyElement = this.element.querySelector('[data-element="body"]') as HTMLElement;
  }

  private createElement(): HTMLElement {
    const root = document.createElement('div');
    root.className = `column-chart ${this.data.length ? '' : 'column-chart_loading'}`;

    const formattedValue = this.formatHeading
      ? this.formatHeading(this.value)
      : String(this.value);

    root.innerHTML = `
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
    `;

    return root;
  }

  private buildColumns(): string {
    if (!this.data.length) return '';

    const maxValue = Math.max(...this.data);
    const scale = this.chartHeight / maxValue;

    return this.data
      .map(item => {
        const value = Math.floor(item * scale);
        const percent = ((item / maxValue) * 100).toFixed(0);
        return `<div style="--value: ${value}" data-tooltip="${percent}%"></div>`;
      })
      .join('');
  }

  public update(data: number[]): void {
    this.data = data;

    if (this.data.length) {
      this.element.classList.remove('column-chart_loading');
    } else {
      this.element.classList.add('column-chart_loading');
    }

    this.bodyElement.innerHTML = this.buildColumns();
  }

  public remove(): void {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }

  public destroy(): void {
    this.remove();
    this.element = null!;
    this.bodyElement = null!;
  }
}