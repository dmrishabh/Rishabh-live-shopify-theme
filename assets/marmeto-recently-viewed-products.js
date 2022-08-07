window.marmeto = window.marmeto || {};

marmeto.RecentlyViewedProducts = (function() {
  function RecentlyViewedProducts(element) {
  	this.container = document.querySelector('[data-section-type="' + element + '"]');
    
    if(!this.container) {
      return;
    }
    
    this.options = JSON.parse(this.container.getAttribute('data-section-settings'));

    if (this.options['productId']) {
      this.saveCurrentProduct();
    }
    this.fetchProducts();
    this.attachEventListeners();
  }
  
  RecentlyViewedProducts.prototype.attachEventListeners = function() {
    //ADD ANY EVENTLISTNRES LIKE :: ADD TO CART, QUICK VIEW ETC..
  }
  
  RecentlyViewedProducts.prototype.fetchProducts = function() {
  	var _this = this;   
    var queryString = this.getSearchQueryString();

    if (queryString === '') {
      return;
    }
    
    fetch(("/search?view=marmeto-recently-viewed-products&type=product&q=").concat(queryString), {
      credentials: 'same-origin',
      method: 'GET'
    })
    .then(function (response) {
      response.text().then(function (content) {
      	var blankDivElement = document.createElement('div');
        blankDivElement.innerHTML = content;
        
        _this.container.querySelector('.mm-recentlyviewed__container').innerHTML = blankDivElement.querySelector('[data-section-type="mm-recently-viewed-products"] .mm-recentlyviewed__container').innerHTML;
		_this.container.parentNode.style.display = 'block';
        
        _this.initSlider();
      })
    })
  }
  
  RecentlyViewedProducts.prototype.saveCurrentProduct = function() {
    /*
     * - Check if the current product already exists, and if it does not, add it at the start
     * - Then, we save the current product into the local storage, by keeping only the 18 most recent
    */    
    var items = JSON.parse(localStorage.getItem('mmRecentlyViewedProducts') || '[]'),
        productId = this.options['productId']; 

    if (!items.includes(productId)) {
      items.unshift(productId);
    }
    
    try {
      localStorage.setItem('mmRecentlyViewedProducts', JSON.stringify(items.slice(0, 8)));
    } 
    catch (error) {}
  }
  
  RecentlyViewedProducts.prototype.getSearchQueryString = function() {
    var items = JSON.parse(localStorage.getItem('mmRecentlyViewedProducts') || '[]');
	
    if (items.includes(this.options['productId'])) {
      items.splice(items.indexOf(this.options['productId']), 1);
    }

    return items.map(function (item) {
      return 'id:' + item;
    }).join(' OR ');
  }
  
  RecentlyViewedProducts.prototype.initSlider = function() {
  	//INITIALIZE THE SLIDER HERE
    //PARENT ELEMENT IS :: .mm-recentlyviewed__products
  }
  
  return RecentlyViewedProducts;
})();

new marmeto.RecentlyViewedProducts('mm-recently-viewed-products');