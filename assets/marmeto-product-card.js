class MarmetoProductCard extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('change', event => {
      if(event.target.name == "id") this.variantChange();
    })
    this.addEventListener('click', event => {
      if(event.target.name == "add") this.addToBag();
    })
  }
  variantChange() {
    
    this.selectedVariantId = this.querySelector('[name="id"]').value;
    let variantUrl = `/products/${this.dataset.productHandle}?view=card&variant=${this.selectedVariantId}`;
     
    //Change the DOM Elements
    fetch(variantUrl)
      .then((response) => response.text())
      .then((responseText) => {
        const html = new DOMParser().parseFromString(responseText, 'text/html');
        const responseCard = html.querySelector('marmeto-product-card');

        this.innerHTML = responseCard.innerHTML;
      });
  }
  addToBag() {
    this.selectedVariantId = this.querySelector('[name="id"]').value;

    let formData = {
     'items': [{
      'id': this.selectedVariantId,
      'quantity': 1
      }]
    };
    fetch(window.Shopify.routes.root + 'cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
    .then(response => {
      return response.json();
    })
    .then(response => {
      //Replace the below line with ajax cart open and update code
      document.location.href = '/cart';
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  }
}
customElements.define('marmeto-product-card', MarmetoProductCard);

