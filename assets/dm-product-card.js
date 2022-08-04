class MarmetoProductCard extends HTMLElement {
  constructor() {
    super();
    
    this.currentVariant = {};
    this.variantData = JSON.parse(this.querySelector('[type="application/json"]').textContent);

    this.addEventListener('change', event => {
      if(event.target.name == "id") this.variantChange();
    })
    this.addEventListener('click', event => {
      if(event.target.name == "add") this.addToBag();
    })
  }

  variantChange() {
    this.variantSelector = this.querySelector('[name="id"]');
    let selectedVariantId = parseInt(this.variantSelector.value);
    let getCurrentVariant = this.variantData.filter(function(v) {
      return v.id === selectedVariantId;
    })   
    
    this.currentVariant = getCurrentVariant[0];

    //Change the DOM Elements
    let variantUrl = `/products/${this.currentVariant.product_handle}?view=card&variant=${this.currentVariant.id}`;  
    fetch(variantUrl)
      .then((response) => response.text())
      .then((responseText) => {
        const html = new DOMParser().parseFromString(responseText, 'text/html');
        const responseCard = html.querySelector('marmeto-product-card');

        this.innerHTML = responseCard.innerHTML;
      });
  }

  addToBag() { 
    let formData = {
     'items': [{
      'id': this.currentVariant.id,
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
