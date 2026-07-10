import { createElement } from "../../shared/utils/create-element";

type SortOrder = 'asc' | 'desc';

type SortableTableData = Record<string, string | number>;

interface SortableTableHeader {
  id: string;
  title: string;
  sortable?: boolean;
  sortType?: 'string' | 'number';
  template?: (value: string | number) => string;
}


export default class SortableTable {
  private _element: HTMLElement | null = null;
  private bodyElement: HTMLElement | null = null;
  private headersConfig: SortableTableHeader[];
  private data: SortableTableData[];

  constructor(headersConfig: SortableTableHeader[] = [], data: SortableTableData[] = []) {
    this.headersConfig = headersConfig;
    this.data = [...data]; // копия
    this._element = createElement(this.createTableTemplate());
    this.bodyElement = this._element.querySelector('[data-element="body"]') as HTMLElement;
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

  public sort(field: string, order: SortOrder): void {
    const columnConfig = this.headersConfig.find(header => header.id === field);
    if (!columnConfig || !columnConfig.sortable) return;

    // Сортировка данных
    const direction = order === 'asc' ? 1 : -1;
    const sortType = columnConfig.sortType || 'string';

    this.data.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      if (sortType === 'number') {
        return direction * ((aVal as number) - (bVal as number));
      } else {
        return direction * String(aVal).localeCompare(String(bVal), ['ru', 'en'], { sensitivity: 'variant' });
      }
    });

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

  public remove(): void {
    if (this._element?.parentNode) {
      this._element.parentNode.removeChild(this._element);
    }
  }

  public destroy(): void {
    this.remove();
    this._element = null;
    this.bodyElement = null;
  }
}
