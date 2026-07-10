import { fetchJson } from "../../shared/utils/fetch-json";

const BACKEND_URL = 'https://course-js.javascript.ru';

interface Options {
  url?: string;                  // адрес API относительно URL
  range?: {
    from: Date;
    to: Date;
  };
  label?: string;
  link?: string;
  formatHeading?: (value: number) => string;  
}

export default class ColumnChart {
  chartHeight = 50;

  private _element: HTMLElement | null = null;
  private bodyElement: HTMLElement | null = null;

  private label: string = '';
  private link?: string;
  private url: string;
  private range?: { from: Date; to: Date };
  private formatHeading?: (value: number) => string;

  private data: number[] = [];
  private value: number = 0;

  constructor(options: Options = {}) {
    this.url = options.url ?? '';
    this.range = options.range;
    this.label = options.label || '';
    this.link = options.link;
    this.formatHeading = options.formatHeading;

    this.render();

    if (this.url && this.range) {
      this.update(this.range.from, this.range.to);
    }
  }

  get element(): HTMLElement {
    if (!this._element) {
      throw new Error('ColumnChart is not rendered');
    }
    return this._element;
  }

  async update(from: Date, to: Date): Promise<Record<string, number>> {
    const url = new URL(this.url, BACKEND_URL);
    url.searchParams.set('from', from.toISOString());
    url.searchParams.set('to', to.toISOString());

    // fetchJson возвращает Promise с распарсенным JSON
    const data = await fetchJson(url.href) as Record<string, number>;

    this.data = Object.values(data);
    this.value = this.data.reduce((sum, val) => sum + val, 0);

    this.updateBody();           // перерисовать столбцы
    this.updateHeader();         // обновить итоговое число в заголовке
    this.setLoadingState(false); // убрать скелетон

    return data;                 
  }

  remove() {
    this._element?.remove();
  }

  destroy() {
    this.remove();
    this._element = null;
    this.bodyElement = null;
  }

  private render() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.buildTemplate();
    this._element = wrapper.firstElementChild as HTMLElement;
    this.bodyElement = this._element.querySelector('[data-element="body"]');
    this.setLoadingState(true);
  }

  private buildTemplate(): string {
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
            <img src="charts-skeleton.svg" alt="Loading..." />
          </div>
        </div>
      </div>
    `;
  }

  private setLoadingState(isLoading: boolean) {
    this._element?.classList.toggle('column-chart_loading', isLoading);
  }

  private updateBody() {
    if (this.bodyElement) {
      this.bodyElement.innerHTML = this.buildColumns();
    }
  }

  private updateHeader() {
    const headerElement = this._element?.querySelector('[data-element="header"]');
    if (headerElement) {
      headerElement.textContent = this.formatHeading
        ? this.formatHeading(this.value)
        : String(this.value);
    }
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
        const height = Math.floor(item * scale);
        const percent = ((item / maxValue) * 100).toFixed(0);
        return `<div style="--value: ${height}" data-tooltip="${percent}%"></div>`;
      })
      .join('');
  }
}
