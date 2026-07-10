import { escapeHtml } from '../../shared/utils/escape-html';
import { fetchJson } from '../../shared/utils/fetch-json';

const IMGUR_CLIENT_ID = '28aaa2e823b03b1';
const BACKEND_URL = 'https://course-js.javascript.ru';

interface ProductImage {
  url: string;
  source: string;
}

interface Category {
  id: string;
  title: string;
  subcategories?: Category[];
}

export default class ProductForm {
  element: HTMLElement | null = null;
  private subElements: Record<string, HTMLElement> = {};
  private productId: string | undefined;
  private isEditMode: boolean;
  private categories: Category[] = [];
  private productData: any = null;
  private submitHandler: (e: Event) => void;

  constructor(productId?: string) {
    this.productId = productId;
    this.isEditMode = !!productId;
    this.submitHandler = this.onSubmit.bind(this);
  }

  async render(): Promise<HTMLElement> {
    const [categoriesResponse, productResponse] = await Promise.all([
      fetchJson(`${BACKEND_URL}/api/rest/categories?_embed=subcategories`),
      this.productId
        ? fetchJson(`${BACKEND_URL}/api/rest/products?id=${this.productId}`)
        : Promise.resolve(null)
    ]);

    const rawCategories = Array.isArray(categoriesResponse)
      ? categoriesResponse
      : (categoriesResponse as any)?.data ?? [];
    this.categories = rawCategories as Category[];

    const productResponseRaw = (productResponse as any)?.data ?? productResponse;
    this.productData = Array.isArray(productResponseRaw)
      ? productResponseRaw[0]
      : productResponseRaw;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.buildFormHTML();
    const productFormElement = wrapper.firstElementChild as HTMLElement;

    const container = document.createElement('div');
    container.append(productFormElement);
    this.element = container;

    this.subElements = this.collectSubElements(productFormElement);
    this.initEventListeners(productFormElement);

    if (this.productData) {
      this.fillForm();
    }

    return this.element;
  }

  private initEventListeners(formContainer: HTMLElement): void {
    const form = formContainer.querySelector('form');
    if (form) {
      form.addEventListener('submit', this.submitHandler);
    }
  }

  private buildFormHTML(): string {
    const categoriesOptions = this.buildCategoriesOptions();
    const imageList = this.buildImageList();

    return `
      <div class="product-form" data-element="productForm">
        <form class="form-grid">
          <div class="form-group form-group__half_left">
            <fieldset>
              <label class="form-label">Название товара</label>
              <input required type="text" name="title" id="title" class="form-control" placeholder="Название товара">
            </fieldset>
          </div>
          <div class="form-group form-group__wide">
            <label class="form-label">Описание</label>
            <textarea required name="description" id="description" class="form-control" placeholder="Описание товара"></textarea>
          </div>
          <div class="form-group form-group__wide">
            <label class="form-label">Фото</label>
            <div data-element="imageListContainer">
              <ul class="sortable-list">
                ${imageList}
              </ul>
            </div>
            <button type="button" name="uploadImage" class="button-primary-outline"><span>Загрузить</span></button>
          </div>
          <div class="form-group form-group__half_left">
            <label class="form-label">Категория</label>
            <select required name="subcategory" id="subcategory" class="form-control">
              ${categoriesOptions}
            </select>
          </div>
          <div class="form-group form-group__half_left form-group__two-col">
            <fieldset>
              <label class="form-label">Цена ($)</label>
              <input required type="number" name="price" id="price" class="form-control" placeholder="100">
            </fieldset>
            <fieldset>
              <label class="form-label">Скидка ($)</label>
              <input required type="number" name="discount" id="discount" class="form-control" placeholder="0">
            </fieldset>
          </div>
          <div class="form-group form-group__part-half">
            <label class="form-label">Количество</label>
            <input required type="number" class="form-control" name="quantity" id="quantity" placeholder="1">
          </div>
          <div class="form-group form-group__part-half">
            <label class="form-label">Статус</label>
            <select required name="status" id="status" class="form-control">
              <option value="1">Активен</option>
              <option value="0">Неактивен</option>
            </select>
          </div>
          <div class="form-buttons">
            <button type="submit" name="save" class="button-primary-outline">Сохранить товар</button>
          </div>
        </form>
      </div>
    `;
  }

  private buildCategoriesOptions(): string {
    if (!Array.isArray(this.categories)) return '';
    return this.categories
      .flatMap(cat => {
        if (cat.subcategories) {
          return cat.subcategories.map(sub =>
            `<option value="${escapeHtml(sub.id)}">${escapeHtml(cat.title)} &gt; ${escapeHtml(sub.title)}</option>`
          );
        } else {
          return [`<option value="${escapeHtml(cat.id)}">${escapeHtml(cat.title)}</option>`];
        }
      })
      .join('');
  }

  private buildImageList(): string {
    if (!this.productData?.images?.length) return '';
    return this.productData.images
      .map((img: ProductImage) =>
        `<li class="sortable-list__item">
          <input type="hidden" name="url" value="${escapeHtml(img.url)}">
          <input type="hidden" name="source" value="${escapeHtml(img.source)}">
          <span>
            <img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.source)}" class="sortable-table__cell-img">
          </span>
        </li>`
      )
      .join('');
  }

  private fillForm(): void {
    const d = this.productData;
    const form = this.element?.querySelector('form');
    if (!form || !d) return;

    (form.querySelector('#title') as HTMLInputElement).value = d.title || '';
    (form.querySelector('#description') as HTMLTextAreaElement).value = d.description || '';
    (form.querySelector('#price') as HTMLInputElement).value = d.price;
    (form.querySelector('#discount') as HTMLInputElement).value = d.discount;
    (form.querySelector('#quantity') as HTMLInputElement).value = d.quantity;
    (form.querySelector('#status') as HTMLSelectElement).value = d.status;
    if (d.subcategory) {
      (form.querySelector('#subcategory') as HTMLSelectElement).value = d.subcategory;
    }
  }

  private collectSubElements(element: HTMLElement): Record<string, HTMLElement> {
    const result: Record<string, HTMLElement> = {};
    element.querySelectorAll('[data-element]').forEach(el => {
      const name = (el as HTMLElement).dataset.element;
      if (name) result[name] = el as HTMLElement;
    });
    return result;
  }

  private async onSubmit(e: Event): Promise<void> {
    e.preventDefault();
    await this.save();
  }

  async save(): Promise<void> {
    const form = this.element?.querySelector('form') as HTMLFormElement;
    if (!form) return;

    const fd = new FormData(form);
    const productData: any = Object.fromEntries(fd.entries());
    productData.price = parseInt(productData.price, 10);
    productData.discount = parseInt(productData.discount, 10);
    productData.quantity = parseInt(productData.quantity, 10);
    productData.status = parseInt(productData.status, 10);

    const existingImages: ProductImage[] = [];
    const imageItems = this.element?.querySelectorAll('.sortable-list__item') ?? [];
    imageItems.forEach(item => {
      const urlInput = item.querySelector('input[name="url"]') as HTMLInputElement;
      const sourceInput = item.querySelector('input[name="source"]') as HTMLInputElement;
      if (urlInput && sourceInput) {
        existingImages.push({ url: urlInput.value, source: sourceInput.value });
      }
    });
    productData.images = existingImages;

    const url = this.isEditMode
      ? `${BACKEND_URL}/api/rest/products/${this.productId}`
      : `${BACKEND_URL}/api/rest/products`;
    const method = this.isEditMode ? 'PUT' : 'POST';

    try {
      const response = await fetchJson<{ id?: string }>(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
        referrer: 'https://course-js.javascript.ru'
      });

      const eventName = this.isEditMode ? 'product-updated' : 'product-saved';
      this.element?.dispatchEvent(new CustomEvent(eventName, {
        bubbles: true,
        detail: { id: response.id || this.productId }
      }));
    } catch (error) {
      console.error('Product save failed', error);
    }
  }

  remove(): void {
    this.element?.parentNode?.removeChild(this.element);
  }

  destroy(): void {
    const form = this.element?.querySelector('form');
    if (form) {
      form.removeEventListener('submit', this.submitHandler);
    }
    this.remove();
    this.element = null;
  }
}