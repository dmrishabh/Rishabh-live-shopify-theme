const formatMoney = function(cents, format) {
    var moneyFormat = 'Rs. {{amount_no_decimals}}';
    
    if (typeof cents === 'string') {
      cents = cents.replace('.', '');
    }
    var value = '';
    var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    var formatString = format || moneyFormat;
  
    function formatWithDelimiters(number, precision, thousands, decimal) {
      thousands = thousands || ',';
      decimal = decimal || '.';
  
      if (isNaN(number) || number === null) {
        return 0;
      }
  
      number = (number / 100.0).toFixed(precision);
  
      var parts = number.split('.');
      var dollarsAmount = parts[0].replace(
        /(\d)(?=(\d\d\d)+(?!\d))/g,
        '$1' + thousands
      );
      var centsAmount = parts[1] ? decimal + parts[1] : '';
  
      return dollarsAmount + centsAmount;
    }
  
    switch (formatString.match(placeholderRegex)[1]) {
      case 'amount':
        value = formatWithDelimiters(cents, 2);
        break;
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',');
        break;
      case 'amount_no_decimals_with_space_separator':
        value = formatWithDelimiters(cents, 0, ' ');
        break;
      case 'amount_with_apostrophe_separator':
        value = formatWithDelimiters(cents, 2, "'");
        break;
    }
  
    return formatString.replace(placeholderRegex, value);
  }


  
  class MarmetoProductCard extends HTMLElement {
    constructor() {
        super();
        this.currentVariant = {};
        this.variantSelector = this.querySelector('[name="id"]');
        this.addToBagButton = this.querySelector('[name="add"]');
        this.variantData = JSON.parse(this.querySelector('[type="application/json"]').textContent);
        
        this.variantSelector.addEventListener('change', this.variantChange.bind(this));
        this.addToBagButton.addEventListener('click', this.addToBag.bind(this));


        //  this.variantTitle = this.querySelector('[name="variant-title"]');
         this.variantPrice = this.querySelector('[name="variant-price"]');
         this.variantCompareAtPrice = this.querySelector('[name="variant-compare-to-price"]');
         this.variantMedia = this.querySelector('[name="variant-media"]');

      }
  
      variantChange() {
        console.log("varient change exc");
        let selectedVariantId = parseInt(this.variantSelector.value);   
        let getCurrentVariant = this.variantData.filter((e)=> {
          return e.id === selectedVariantId;
        }) 
        
        this.currentVariant = getCurrentVariant[0];
        console.log(this.currentVariant); 
    
        //Changing the DOM Elements

        let ProductLayoutUrl = `/products/${this.currentVariant.product_handle}?view=card&variant=${this.currentVariant.id}`
        console.log(ProductLayoutUrl);
        fetch( ProductLayoutUrl )
        .then((response)=> response.text())
        .then((responseText)=>{
            const html = new DOMParser().parseFromString( responseText ,'text/html');
            const sourceCard = html.querySelector('marmeto-product-card');

            console.log(sourceCard);


            this.innerHTML = sourceCard.innerHTML;


            // const priceId = `#Prices-${this.currentVariant.product_id}`;   
        // const priceSource = html.querySelector(priceId);  
        // const priceDestination = this.querySelector(priceId);

        // if (priceSource && priceDestination) priceDestination.innerHTML = priceSource.innerHTML;


        })        





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
  