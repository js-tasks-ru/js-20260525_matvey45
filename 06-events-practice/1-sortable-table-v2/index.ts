import { createElement } from "../../shared/utils/create-element";

type SortOrder = 'asc' | 'desc';

type SortableTableData = Record<string, string | number>;

type SortableTableSort = {
  id: string;
  order: SortOrder;
};

interface SortableTableHeader {
  id: string;
  title: string;
  sortable?: boolean;
  sortType?: 'string' | 'number' | 'custom';
  template?: (value: string | number) => string;
  customSorting?: (a: SortableTableData, b: SortableTableData) => number;
}

interface Options {
  data?: SortableTableData[];
  sorted?: SortableTableSort;
  isSortLocally?: boolean;
}

export default class SortableTable {
  private _element: HTMLElement | null = null;
  private bodyElement: HTMLElement | null = null;
  private headersConfig: SortableTableHeader[];
  private data: SortableTableData[];
  private sorted: SortableTableSort | undefined;
  private isSortLocally: boolean;
  private headerClickHandler: (event: Event) => void;

  constructor(headersConfig: SortableTableHeader[] = [], {
    data = [],
    sorted,
    isSortLocally = true
  }: Options = {}) {
     this.headersConfig = headersConfig;
    this.data = [...data];
    this.sorted = sorted;
    this.isSortLocally = isSortLocally;

    this._element = createElement(this.createTableTemplate());
    this.bodyElement = this._element.querySelector('[data-element="body"]') as HTMLElement;

    // Обработчик клика на заголовок
    this.headerClickHandler = this.onHeaderClick.bind(this);
    const headerElement = this._element.querySelector('[data-element="header"]');
    if (headerElement) {
      headerElement.addEventListener('pointerdown', this.headerClickHandler);
    }

    if (this.sorted) {
      this.sort(this.sorted.id, this.sorted.order);
    }
  }
   public get element(): HTMLElement {
    if (!this._element) {
      throw new Error('SortableTable element is not available');
    }
    return this._element;
  }

  private createTableTemplate(): string {
    return `
      <div class="sortable-table">
        <div data-element="header" class="sortable-table__header" style="display: grid; grid-auto-flow: column;">
          ${this.headersConfig.map(header => this.createHeaderCell(header)).join('')}
        </div>
        <div data-element="body" class="sortable-table__body">
          ${this.buildBody()}
        </div>
      </div>
    `;
  }

  private createHeaderCell(header: SortableTableHeader): string {
    return `
      <div class="sortable-table__cell" data-id="${header.id}" data-sortable="${header.sortable ? 'true' : 'false'}">
        <span>${header.title}</span>
        <span data-element="arrow" class="sortable-table__sort-arrow"></span>
      </div>
    `;
  }

  private buildBody(): string {
    return this.data.map(row => this.buildRow(row)).join('');
  }

  private buildRow(row: SortableTableData): string {
    const cells = this.headersConfig.map(header => {
      const value = row[header.id];
      const content = header.template
        ? header.template(value as string | number)
        : value !== undefined ? String(value) : '';
      return `<div class="sortable-table__cell">${content}</div>`;
    }).join('');
    return `<div class="sortable-table__row">${cells}</div>`;
  }

  private onHeaderClick(event: Event): void {
    const target = event.target as HTMLElement;
    const cell = target.closest<HTMLElement>('.sortable-table__cell[data-id]');
    if (!cell) return;

    const field = cell.dataset.id;
    if (!field) return;

    const columnConfig = this.headersConfig.find(h => h.id === field);
    if (!columnConfig || !columnConfig.sortable) return;

    // Определяем порядок сортировки
    let order: SortOrder;
    if (!this.sorted) {
      order = 'asc';
    } else if (this.sorted.id === field) {
      order = this.sorted.order === 'asc' ? 'desc' : 'asc';
    } else {
      order = this.sorted.order === 'asc' ? 'desc' : 'asc';
    }

    this.sort(field, order);
  }

  public sort(field: string, order: SortOrder): void {
    if (this.isSortLocally) {
      this.sortOnClient(field, order);
    } else {
      return;
    }

    this.sorted = { id: field, order };

    const headerCells = this._element?.querySelectorAll<HTMLElement>('.sortable-table__cell[data-id]');
    headerCells?.forEach(cell => {
      if (cell.dataset.id === field) {
        cell.dataset.order = order;
      } else {
        delete cell.dataset.order;
      }
    });

    if (this.bodyElement) {
      this.bodyElement.innerHTML = this.buildBody();
    }
  }

  private sortOnClient(field: string, order: SortOrder): void {
    const columnConfig = this.headersConfig.find(h => h.id === field);
    if (!columnConfig || !columnConfig.sortable) return;

    const direction = order === 'asc' ? 1 : -1;
    const sortType = columnConfig.sortType || 'string';

    if (sortType === 'custom' && columnConfig.customSorting) {
      this.data.sort((a, b) => direction * columnConfig.customSorting!(a, b));
      return;
    }

    this.data.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      if (sortType === 'number') {
        return direction * ((aVal as number) - (bVal as number));
      } else {
        return direction * String(aVal).localeCompare(String(bVal), ['ru', 'en'], { sensitivity: 'variant' });
      }
    });
  }

  public remove(): void {
    if (this._element?.parentNode) {
      this._element.parentNode.removeChild(this._element);
    }
  }

  public destroy(): void {
    if (this._element) {
      const headerElement = this._element.querySelector('[data-element="header"]');
      if (headerElement) {
        headerElement.removeEventListener('pointerdown', this.headerClickHandler);
      }
    }
    this.remove();
    this._element = null;
    this.bodyElement = null;
  }
}
