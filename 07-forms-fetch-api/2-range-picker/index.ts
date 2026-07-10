interface Options {
  from?: Date;
  to?: Date;
}

export default class RangePicker {
  element: HTMLElement | null = null;
  private selectingFrom = true;
  private from: Date;
  private to: Date;
  private currentFromMonth: Date;
  private onDocumentClick: (e: MouseEvent) => void;

  constructor({ from = new Date(), to = new Date() }: Options = {}) {
    this.from = from;
    this.to = to;
    this.currentFromMonth = new Date(from.getFullYear(), from.getMonth(), 1);
    this.onDocumentClick = this.handleDocumentClick.bind(this);
    this.render();
  }

  private render(): void {
    const wrapper = document.createElement('div');
    wrapper.className = 'rangepicker';
    wrapper.innerHTML = this.buildTemplate();
    this.element = wrapper;

    this.element.querySelector('.rangepicker__input')!.addEventListener('click', () => this.toggle());

    this.element.querySelector('.rangepicker__selector')!.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('.rangepicker__selector-control-left')) {
        e.stopPropagation();
        this.prevMonth();
        return;
      }
      if (target.closest('.rangepicker__selector-control-right')) {
        e.stopPropagation();
        this.nextMonth();
        return;
      }
      const cell = target.closest('[data-date]');
      if (cell) {
        const dateValue = (cell as HTMLElement).dataset.date!;
        const date = this.parseDate(dateValue);
        this.selectDate(date);
      }
    });
  }

  private buildTemplate(): string {
    const fromStr = this.formatDate(this.from);
    const toStr = this.formatDate(this.to);
    return `
      <div class="rangepicker__input" data-element="input">
        <span data-element="from">${fromStr}</span> -
        <span data-element="to">${toStr}</span>
      </div>
      <div class="rangepicker__selector" data-element="selector"></div>`;
  }

  private open(): void {
    if (!this.element) return;
    const selector = this.element.querySelector('.rangepicker__selector')!;
    selector.innerHTML = `
      <div class="rangepicker__selector-arrow"></div>
      <div class="rangepicker__selector-control-left"></div>
      <div class="rangepicker__selector-control-right"></div>
      ${this.renderCalendars()}
    `;
    this.element.classList.add('rangepicker_open');
    document.addEventListener('click', this.onDocumentClick, true);
  }
  private close(): void {
      if (!this.element) return;
      this.element.classList.remove('rangepicker_open');
      document.removeEventListener('click', this.onDocumentClick, true);
  }

  private handleDocumentClick(e: MouseEvent): void {
    if (!this.element) return;
    if (!this.element.contains(e.target as Node)) {
      this.close();
    }
  }

  private toggle(): void {
    if (!this.element) return;
    this.element.classList.contains('rangepicker_open') ? this.close() : this.open();
  }

  private renderCalendars(): string {
    const left = this.currentFromMonth;
    const right = new Date(left);
    right.setMonth(right.getMonth() + 1);
    return this.renderCalendar(left) + this.renderCalendar(right);
  }

  private renderCalendar(monthDate: Date): string {
    const monthName = monthDate.toLocaleString('ru', { month: 'long' });
    return `
      <div class="rangepicker__calendar">
        <div class="rangepicker__month-indicator"><time datetime="${monthName}">${monthName}</time></div>
        <div class="rangepicker__day-of-week">
          <span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span>
        </div>
        <div class="rangepicker__date-grid">${this.renderDaysGrid(monthDate)}</div>
      </div>`;
  }

  private renderDaysGrid(monthDate: Date): string {
    const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    const firstWeekday = firstDay.getDay(); // 0 – вс, 1 – пн, …
    const startCol = firstWeekday === 0 ? 7 : firstWeekday; // Пн=1 … Вс=7

    let html = '';
    let isFirst = true;
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const cur = new Date(monthDate.getFullYear(), monthDate.getMonth(), d);
      const dateStr = this.formatDate(cur);
      const classes = ['rangepicker__cell'];
      const curTime = cur.getTime();
      if (curTime === this.from.getTime()) {
        classes.push('rangepicker__selected-from');
      } else if (curTime === this.to.getTime()) {
        classes.push('rangepicker__selected-to');
      } else if (curTime > this.from.getTime() && curTime < this.to.getTime()) {
        classes.push('rangepicker__selected-between');
      }
      let style = 'display:flex;align-items:center;justify-content:center;';
      if (isFirst) {
        style += `grid-column-start:${startCol};`;
        isFirst = false;
      }
      html += `<div class="${classes.join(' ')}" data-date="${dateStr}" style="${style}">${d}</div>`;
    }
    return html;
  }

  private formatDate(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}.${mm}.${d.getFullYear()}`;
  }

  private parseDate(s: string): Date {
    const [dd, mm, yyyy] = s.split('.').map(Number);
    return new Date(yyyy, mm - 1, dd);
  }

  private selectDate(date: Date): void {
    if (this.selectingFrom) {
      this.from = date;
      this.to = date;
      this.selectingFrom = false;
    } else {
      if (date < this.from) {
        this.to = this.from;
        this.from = date;
      } else {
        this.to = date;
      }
      this.currentFromMonth = new Date(this.from.getFullYear(), this.from.getMonth(), 1);
      this.updateInput();
      this.dispatchEvent();
      this.selectingFrom = true;
 
    }
    this.updateHighlights();
  }

  private updateHighlights(): void {
    if (!this.element?.classList.contains('rangepicker_open')) return;
    const cells = this.element.querySelectorAll<HTMLElement>('.rangepicker__cell');
    const fromTime = this.from.getTime();
    const toTime = this.to.getTime();

    cells.forEach(cell => {
      const dateStr = cell.dataset.date!;
      const curTime = this.parseDate(dateStr).getTime();
      let cls = 'rangepicker__cell';
      if (curTime === fromTime) {
        cls += ' rangepicker__selected-from';
      } else if (curTime === toTime) {
        cls += ' rangepicker__selected-to';
      } else if (curTime > fromTime && curTime < toTime) {
        cls += ' rangepicker__selected-between';
      }
      cell.className = cls;
    });
  }

  private updateInput(): void {
    const fromEl = this.element!.querySelector('[data-element="from"]')!;
    const toEl = this.element!.querySelector('[data-element="to"]')!;
    fromEl.textContent = this.formatDate(this.from);
    toEl.textContent = this.formatDate(this.to);
  }

  private dispatchEvent(): void {
    this.element!.dispatchEvent(new CustomEvent('date-select', {
      bubbles: true,
      detail: { from: this.from, to: this.to }
    }));
  }

  private updateCalendars(): void {
    const selector = this.element?.querySelector('.rangepicker__selector');
    if (!selector || !selector.innerHTML) return;
    const calendars = selector.querySelectorAll('.rangepicker__calendar');
    const left = this.currentFromMonth;
    const right = new Date(left);
    right.setMonth(right.getMonth() + 1);
    if (calendars.length === 2) {
      calendars[0].outerHTML = this.renderCalendar(left);
      calendars[1].outerHTML = this.renderCalendar(right);
    } else {
      selector.innerHTML = `
        <div class="rangepicker__selector-arrow"></div>
        <div class="rangepicker__selector-control-left"></div>
        <div class="rangepicker__selector-control-right"></div>
        ${this.renderCalendars()}
      `;
    }
  }

  private prevMonth(): void {
    this.currentFromMonth.setMonth(this.currentFromMonth.getMonth() - 1);
    this.updateCalendars();
  }

  private nextMonth(): void {
    this.currentFromMonth.setMonth(this.currentFromMonth.getMonth() + 1);
    this.updateCalendars();
  }

  remove(): void {
    this.element?.remove();
    this.element = null;
  }

  destroy(): void {
    this.close();
    this.remove();
  }
}