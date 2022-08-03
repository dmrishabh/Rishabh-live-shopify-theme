/*----------------------------------------------
  COLLAPSABLE TABS
----------------------------------------------*/
function onKeyUpEscape(event) {
    if (event.code.toUpperCase() !== 'ESCAPE') return;
  
    const openDetailsElement = event.target.closest('details[open]');
    if (!openDetailsElement) return;
  
    const summaryElement = openDetailsElement.querySelector('summary');
    openDetailsElement.removeAttribute('open');
    summaryElement.setAttribute('aria-expanded', false);
    summaryElement.focus();
  }
  document.querySelectorAll('[id^="Tabs-"] summary').forEach((summary) => {
    summary.setAttribute('role', 'button');
    summary.setAttribute('aria-expanded', 'false');
  
    if(summary.nextElementSibling.getAttribute('id')) {
      summary.setAttribute('aria-controls', summary.nextElementSibling.id);
    }
  
    summary.addEventListener('click', (event) => {
      event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
    });
  
    summary.parentElement.addEventListener('keyup', onKeyUpEscape);
  });
  
  
  /*----------------------------------------------
    QUANTITY SELECTOR
  ----------------------------------------------*/
  class MarmetoQuantityInput extends HTMLElement {
    constructor() {
      super();
      this.input = this.querySelector('input');
      this.changeEvent = new Event('change', { bubbles: true })
  
      this.querySelectorAll('button').forEach(
        (button) => button.addEventListener('click', this.onButtonClick.bind(this))
      );
    }
  
    onButtonClick(event) {
      event.preventDefault();
      const previousValue = this.input.value;
  
      event.target.name === 'plus' ? this.input.stepUp() : this.input.stepDown();
      if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);
    }
  }
  
  customElements.define('marmeto-quantity-input', MarmetoQuantityInput);
  
  
  /*----------------------------------------------
    PRODUCT MEDIA SLIDER
  ----------------------------------------------*/
  function initMediaSlider() {
    var sliderElement = document.querySelector('.product__media-list');
    var sliderElementCells = sliderElement ? sliderElement.querySelectorAll('.product__media-item') : [];
    
    if(!sliderElement) { return; }
   
    // For some reason, Flickity set a zero height at start, 
    // so I am pre-setting the height of first item
    var initialIndex = 0;
    var firstSlide = sliderElementCells[initialIndex];
    
    firstSlide.classList.add('is-selected');            
    firstSlide.style.height = "".concat(firstSlide.clientHeight, "px");
    
    var initFlickty = new Flickity(sliderElement, {
      accessibility: false,
      prevNextButtons: true,
      pageDots: false,
      adaptiveHeight: true,
      cellSelector: '.product__media-item',
      initialIndex: initialIndex
    });
  }
  
  initMediaSlider();
  
  
  /*----------------------------------------------
    VARIANT CHANGE
  ----------------------------------------------*/
  class MarmetoVariantRadios extends HTMLElement {
    constructor() {
      super();
      this.addEventListener('change', this.onVariantChange);
    }
    
    onVariantChange() {
      this.updateOptions();
      this.updateMasterId();
      this.toggleAddButton(true, '', false);
  
      if (!this.currentVariant) {
        this.toggleAddButton(true, '', true);
        this.setUnavailable();
      } else {
        this.updateURL();
        this.updateVariantInput();
        this.renderProductInfo();
      }
    }
     
    updateOptions() {
      const fieldsets = Array.from(this.querySelectorAll('.product__variant'));
      this.options = fieldsets.map((fieldset) => {
        return Array.from(fieldset.querySelectorAll('input')).find((radio) => radio.checked).value;
      });
    }
    
    updateMasterId() {
      this.currentVariant = this.getVariantData().find((variant) => {
        return !variant.options.map((option, index) => {
          return this.options[index] === option;
        }).includes(false);
      });
    }
    
    updateURL() {
      if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
      window.history.replaceState({ }, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
    }
    
    updateVariantInput() {
      const productForms = document.querySelectorAll(`#product-form-${this.dataset.section}`);
      productForms.forEach((productForm) => {
        const input = productForm.querySelector('input[name="id"]');
        input.value = this.currentVariant.id;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
    
    renderProductInfo() {
      fetch(`${this.dataset.url}?variant=${this.currentVariant.id}&section_id=${this.dataset.section}`)
        .then((response) => response.text())
        .then((responseText) => {
          const id = `price-${this.dataset.section}`;
          const html = new DOMParser().parseFromString(responseText, 'text/html')
          const destination = document.getElementById(id);
          const source = html.getElementById(id);
  
          if (source && destination) destination.innerHTML = source.innerHTML;
          this.toggleAddButton(!this.currentVariant.available, 'SOLD OUT');
        });
    }
    
    toggleAddButton(disable = true, text, modifyClass = true) {
      const productForm = document.getElementById(`product-form-${this.dataset.section}`);
      if (!productForm) return;
      const addButton = productForm.querySelector('[name="add"]');
      const addButtonText = productForm.querySelector('[name="add"] > span');
  
      if (!addButton) return;
  
      if (disable) {
        addButton.setAttribute('disabled', 'disabled');
        if (text) addButtonText.textContent = text;
      }
      // ajax-cart

      if(document.querySelector('ajax-cart')){
        document.querySelector('ajaxcart-container').classList.add('active-ajax-cart');
        document.querySelector('ajax-cart').refreshCart(response?.sections['ajaxcart']);
        document.querySelector('ajax-cart').open(false);
      }
      // ajax-cart
       else {
        addButton.removeAttribute('disabled');
        addButtonText.textContent = 'ADD TO CART';
       
      }
  
      if (!modifyClass) return;
    }
    
    setUnavailable() {
      const button = document.getElementById(`product-form-${this.dataset.section}`);
      const addButton = button.querySelector('[name="add"]');
      const addButtonText = button.querySelector('[name="add"] > span');
      if (!addButton) return;
      addButtonText.textContent = 'UNAVAILABLE';
    }
  
    getVariantData() {
      this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
      return this.variantData;
    }
  }
  
  customElements.define('marmeto-variant-radios', MarmetoVariantRadios);
  
  
  /*----------------------------------------------
    PRODUCT FORM
  ----------------------------------------------*/
  if (!customElements.get('marmeto-product-form')) {
    function fetchConfig(type = 'json') {
      return {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': `application/${type}` }
      };
    }
    
    customElements.define('marmeto-product-form', class ProductForm extends HTMLElement {
      constructor() {
        super();
  
        this.form = this.querySelector('form');
        this.form.querySelector('[name=id]').disabled = false;
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
      }
  
      onSubmitHandler(evt) {
        evt.preventDefault();
        const submitButton = this.querySelector('[type="submit"]');
        
        this.handleErrorMessage();
              
        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];
  
        const formData = new FormData(this.form);
        formData.append('sections_url', window.location.pathname);
        config.body = formData;
  
        fetch('/cart/add', config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              this.handleErrorMessage(response.description);
              return;
            }
          
            document.location.href = '/cart';
          })
          .catch((e) => {
            console.error(e);
          });
      }
  
      handleErrorMessage(errorMessage = false) {
        this.errorMessageWrapper = this.querySelector('.product__form-error');
        this.errorMessage = this.errorMessageWrapper.querySelector('.product__form-error-message');
  
        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);
  
        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }
    });
  }

  /*----------------------------------------------
  PRODUCT DESCRIPTION TABS
----------------------------------------------*/
document.querySelectorAll('.description-tabs__heading').forEach((heading) => {
    heading.addEventListener('click', (event) => {
      var tabId = heading.dataset.tab;
      
      document.querySelectorAll('.description-tabs__heading').forEach((h) => {
        h.classList.remove('is--active');
      })
      document.querySelectorAll('.description-tabs__content').forEach((c) => {
        c.classList.remove('is--active');
      })
  
      heading.classList.add('is--active');
      document.getElementById(tabId).classList.add('is--active');
    });
  });