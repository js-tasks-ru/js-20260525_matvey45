import { createElement } from "../../shared/utils/create-element";

interface Options {
  duration?: number;
  type?: 'success' | 'error';
 }

export default class NotificationMessage {
  static activeNotification: NotificationMessage | null = null;
  private _element: HTMLElement | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private duration: number;
  private type: 'success' | 'error';
  private message: string;

  constructor(message: string,{ duration, type }: Options = {}) {
    this.message = message;
    this.duration = duration ?? 2000;
    this.type = type ?? 'success';

    if (NotificationMessage.activeNotification) {
      NotificationMessage.activeNotification.remove();
    }

    this._element = createElement(this.template);

    NotificationMessage.activeNotification = this;
  }

  public get element(): HTMLElement {
    if (!this._element) {
      throw new Error('NotificationMessage element is not available.');
    }
    return this._element;
  }

  private get template(): string {
    const durationInSeconds = `${this.duration / 1000}s`;
    return `
      <div class="notification ${this.type}" style="--value: ${durationInSeconds}">
        <div class="timer"></div>
        <div class="inner-wrapper">
          <div class="notification-header">${this.type}</div>
          <div class="notification-body">${this.message}</div>
        </div>
      </div>
    `;
  }

  public show(target: HTMLElement = document.body): void {
    if (!this._element) return;

    target.append(this._element);

    this.timer = setTimeout(() => {
      this.remove();
    }, this.duration);
  }

  // Удалить элемент из DOM
  public remove(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this._element?.parentNode) {
      this._element.parentNode.removeChild(this._element);
    }
  }

  public destroy(): void {
    this.remove();
    this._element = null;

    if (NotificationMessage.activeNotification === this) {
      NotificationMessage.activeNotification = null;
    }
  }
}
