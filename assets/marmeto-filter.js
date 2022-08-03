window.marmeto = window.marmeto || {};

marmeto.Collection = (function() {
  var selectors = {
    priceFilterSelected: '[data-tag="Price"] .filter-selected',
    productCounter: '[data-product-count]',
    productContainer: '#js-product-loop',
    emptyProductContainer: '#js-empty-products',
    paginationContainer: '#js-pagination-holder',
    countElement: '#js-products-count',
    filterSidebar: '#sidebar-filter',
    filterItem: '.filter-item',
    clearFilterElement: '.clear-all',
    accordionHeading: '.js-accordion-heading',
    accordionContent: '.js-accordion-content',
    desktopSort: '#js-sort-desktop li',
    desktopSortSelectedText: '#js-sort-desktop [data-sort-value]',
    mobileSort: '#js-sort-mobile li',
    mobileSortSelectedText: '#js-sort-mobile [data-sort-value]',
    mobileFilterOpener: '[data-action="open-filter"]',
    mobileFilterClose: '[data-action="close-filter"]',
    mobileSortElem: '[data-action="open-sort"]',
    mobileSortByDrawer: '#js-sort-mobile'
  }

  function Collection(element) {
  	this.container = document.querySelector('[data-section-type="' + element + '"]');
    
    if(!this.container) {
      return;
    }
    
    this.productsPerAjax = 100;
    this.allProducts = [];
    this.totalPage = '';
    this.params = {
      page: 1,
      q: undefined,
      filterOptions: undefined,
      sortBy: undefined
    };
    
    this.customFilters = this.initCustomFilters();
    
    this.options = JSON.parse(this.container.getAttribute('data-section-settings'));
        
    //FILL THE PRICE FILTER HIDDEN INPUT DATA-TAG
    if(history && history.state && history.state.filterOptions && history.state.filterOptions.price) {
      var priceRange = history.state.filterOptions.price[0];
      document.querySelector('.price-filter-item').dataset.tag = priceRange;
      
      document.querySelector('[name="PriceFilterMin"]').value = priceRange.split('-')[0];
      document.querySelector('[name="PriceFilterMax"]').value = priceRange.split('-')[1];
    }
       
    this.initQueryFromUrl();
    this.initCollection();
    this.attachEventListeners();
  }
  
  Collection.prototype.attachEventListeners = function() {
  	var _this = this;
        
    //FILTER SELECTION
    var filterItems = document.querySelectorAll(selectors.filterItem);
    for (var filterItem of filterItems) {
      filterItem.addEventListener('click', function() {
        this.classList.toggle('filter-selected');
        _this.handleFilterChange();
      })
    }
    
    //CLEAR FILTERS
    var clearElements = document.querySelectorAll(selectors.clearFilterElement);
    for (var clearElement of clearElements) {
      clearElement.addEventListener('click', function(event) {
        event.preventDefault();

        document.querySelector(selectors.filterSidebar).querySelectorAll(".filter-item").forEach(function(e){
          e.classList.remove('filter-selected');
        })  
        _this.handleFilterChange();
      })
    }
    
    //DESKTOP SORTING
    var sortElements = document.querySelectorAll(selectors.desktopSort);
    for (var sortElement of sortElements) {
      sortElement.addEventListener('click', function(event) {
        event.preventDefault();
		
        var sortValue = this.getAttribute('data-value');
        
        _this.params.sortBy = sortValue;
    	_this.getProducts(_this.params.page);       
        _this.handleFilterChange();

        document.querySelector(selectors.desktopSortSelectedText).innerHTML = this.textContent;
      })
    }
    
    //MOBILE SORTING
    var mobileSortElements = document.querySelectorAll(selectors.mobileSort);
    for (var mobileSortElement of mobileSortElements) {
      mobileSortElement.addEventListener('click', function(event) {
        event.preventDefault();

        var mobileSortValue = this.getAttribute('data-value');

        _this.params.sortBy = mobileSortValue;
        _this.getProducts(_this.params.page);       
        _this.handleFilterChange();

        document.querySelector(selectors.mobileSortByDrawer).classList.remove('is--opened');
      })
    }
    
    //ACCORDION
    var accordionHeadings = document.querySelectorAll(selectors.accordionHeading);
    for (var accordionHeading of accordionHeadings) {
      accordionHeading.addEventListener('click', function(event) {
        event.preventDefault();
        
        this.classList.toggle('is-closed');
		_this.helpers().slideToggle(this.nextElementSibling);
      })
    }
    
    //PAGINATION CLICK
    document.querySelector(selectors.paginationContainer).addEventListener('click', function(e) {
      e.preventDefault();
      var page = '';

      if(e.target.tagName === 'A') {
        page = e.target.getAttribute("data-page");
      } 
      else if(e.target.tagName === 'svg' || e.target.tagName === 'path') {
        page = e.target.closest('a').getAttribute("data-page");
      }

      _this.helpers().scrollToTop();

      if (page === '') page = '999';
      if (page !== '999') page = parseInt(page);

      if (page != _this.params.page) {
        _this.params.page = page;
        _this.pushState();
        _this.getProducts(page);
      }
    })
    
    //MOBILE FILTER DRAWER
    var filterOpenElement = document.querySelector(selectors.mobileFilterOpener);
    filterOpenElement.addEventListener('click', function() {
      document.querySelector('.mmc-main__filter').classList.add('is--opened');
      
      if (document.querySelector(selectors.mobileSortByDrawer).classList.contains('is--opened')) {
        document.querySelector(selectors.mobileSortByDrawer).classList.remove('is--opened')
      }
    })

    var filterCloseElements = document.querySelectorAll(selectors.mobileFilterClose);
    for (var filterCloseElement of filterCloseElements) {
      filterCloseElement.addEventListener('click', function() {
        document.querySelector('.mmc-main__filter').classList.remove('is--opened');
      })
    }

    //MOBILE SORT DRAWER
    var sortByOpenElem = document.querySelector(selectors.mobileSortElem);
    sortByOpenElem.addEventListener('click', function() {
      document.querySelector(selectors.mobileSortByDrawer).classList.toggle('is--opened');
    })
    
    //PRICE FILTER CHANGE
    var minPriceInput = document.querySelector('[name="PriceFilterMin"]');
    var maxPriceInput = document.querySelector('[name="PriceFilterMax"]');

    document.querySelector('[name="PriceFilterMin"]').addEventListener('change', function(event){      
      event.target.value = Math.max(Math.min(parseInt(event.target.value), parseInt(maxPriceInput.value || event.target.max) - 1), event.target.min);
	  
      var minPrice = event.target.value;
      var maxPrice = parseInt(maxPriceInput.value || event.target.max);
      var dataTag = minPrice + '-' + maxPrice;
      
      document.querySelector('.price-filter-item').dataset.tag = dataTag;
      document.querySelector('.price-filter-item').classList.add('filter-selected');
      _this.handleFilterChange();
    })
    
    document.querySelector('[name="PriceFilterMax"]').addEventListener('change', function(event){
      event.target.value = Math.min(Math.max(parseInt(event.target.value), parseInt(minPriceInput.value || event.target.min) + 1), event.target.max);
      
      var minPrice = parseInt(minPriceInput.value || event.target.min);
      var maxPrice = event.target.value;
      var dataTag = minPrice + '-' + maxPrice;
      
      document.querySelector('.price-filter-item').dataset.tag = dataTag;
      document.querySelector('.price-filter-item').classList.add('filter-selected');
      _this.handleFilterChange();
    })
  }
  
  Collection.prototype.initCollection = function() {
  	var _this = this,
        queries = [],
        sortUrl = '',
        view = '?view=json&page=',
        numRequests = Math.ceil(this.options.productCount / this.productsPerAjax);

    if(this.params.sortBy) {
      sortUrl = '&sort_by='+ this.params.sortBy;
    }

    for (var page=1; page <= numRequests; page++) {
      queries.push(fetch(location.pathname + view + page + sortUrl));
    }
    
    if(!queries.length) {
      console.error('Nothing to fetch!! Either you forgot to add .json template or the current page type doesn\'t have any products.')
      return; 
    }

    Promise.all(queries).then(function (responses) {
      Promise.all(responses.map(function (response) {
        return response.json();
      })).then(function (productsArray) {
        for(var i=0; i<productsArray.length; i++) {
          var products = productsArray[i];
          
          for(var j=0; j<products.length; j++) {
            _this.allProducts.push(products[j])
          }
        }

        _this.getProducts(_this.params.page);
      });      
    }); 
  }
  
  Collection.prototype.getProducts = function(pageNumber) {  
    var _this = this,
    	priceRanges = [],
    	getProducts = [],
    	filteredProducts = this.filterHelpers().filterProducts(this.allProducts, this.params.filterOptions);

    /* EXCLUDE OUT OF STOCK PRODUCTS */
    if(this.options.excludeOosProducts) {
      getProducts = filteredProducts.filter(function(p) {
        return p.available;
      });
    } else {
      getProducts = filteredProducts;
    }
    
    this.sortProducts(getProducts);
    this.totalPage = Math.ceil(getProducts.length / this.options.productPerPage);
    
    /* SHOW OUT OF STOCK PRODUCTS ON LAST */
    if(this.options.showOosLast) {
      getProducts.sort(function(a,b) {
        return b.available - a.available
      })
    }
    
    if(document.querySelector(selectors.countElement)) {
      document.querySelector(selectors.countElement).innerHTML = 'Showing ' + getProducts.length +' products';
    }
       
    if(getProducts.length > 0 && pageNumber) {
      if (pageNumber !== '999' && pageNumber > this.totalPage) pageNumber = 1;

      var productGrid = "",
      	  endIndex = ((getProducts.length < (pageNumber * this.options.productPerPage)) || (pageNumber === '999') ) ? getProducts.length : pageNumber * this.options.productPerPage,
      	  startIndex = (pageNumber === '999' || (endIndex < this.options.productPerPage)) ? 0 : (pageNumber - 1) * this.options.productPerPage;

      for (var i=startIndex; i<endIndex; i++) {        
        productGrid += _this.htmlRenderer().renderProduct(i, getProducts[i]);        
      } 

      this.generatePagination(pageNumber);      
      document.querySelector(selectors.productContainer).classList.remove('is-hidden');
      document.querySelector(selectors.emptyProductContainer).classList.add('is-hidden');

      if(this.options.paginationType == 'infinite_scroll' && pageNumber !== 1) {
        document.querySelector(selectors.productContainer).innerHTML += productGrid;
      } else {
        document.querySelector(selectors.productContainer).innerHTML = productGrid;
      } 
    } else {
      document.querySelector(selectors.productContainer).innerHTML = '';
      document.querySelector(selectors.productContainer).classList.add('is-hidden');
      document.querySelector(selectors.paginationContainer).classList.add('is-hidden');
      document.querySelector(selectors.emptyProductContainer).classList.remove('is-hidden');  
    }
  }
  
  Collection.prototype.generatePagination = function(currentPage) {
    var _this = this;
    
    if(this.totalPage <= 1) {
      document.querySelector(selectors.paginationContainer).classList.add('is-hidden');
      return;
    }

    var paginationHtml = '';
    if (currentPage !== '999') {
      paginationHtml +=
        ((currentPage - 1 >= 1) ? '<a href="'+ this.options.collectionUrl + '?page=' + (currentPage - 1) + '" class="pagination__item" rel="prev" title="Previous page" data-page="' + (currentPage - 1) + '"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.00293 8.00004C3.00913 8.19072 3.08671 8.37972 3.23612 8.5254L9.64155 14.772C9.95238 15.076 10.4574 15.076 10.7691 14.772C11.0809 14.4689 11.0809 13.9764 10.7691 13.6724L4.95256 8.00001L10.7691 2.32764C11.0809 2.02362 11.0809 1.53114 10.7691 1.22802C10.4574 0.923993 9.95238 0.923993 9.64155 1.22802L3.23615 7.47462C3.08674 7.62033 3.00916 7.8093 3.00293 8.00001L3.00293 8.00004Z" fill="black"/></svg></a>' : '')
      + ((currentPage !== 1) ? '<a href="'+ this.options.collectionUrl + '?page=1" class="pagination__item" title="Navigate to page 1" data-page="1">1</a>' : '' )
      + ((currentPage >= 4) ? '…' : '')
      + ((currentPage - 2 > 1) ? '<a href="'+ this.options.collectionUrl + '?page=' + (currentPage - 2) + '" class="pagination__item" title="Navigate to page ' + (currentPage - 2) + '" data-page="' + (currentPage - 2) + '">' + (currentPage - 2) + '</a>' : '' )
      + ((currentPage - 1 > 1) ? '<a href="'+ this.options.collectionUrl + '?page=' + (currentPage - 1) + '" class="pagination__item" title="Navigate to page ' + (currentPage - 1) + '" data-page="' + (currentPage - 1) + '">' + (currentPage - 1) + '</a>' : '' )
      + '<span class="pagination__item pagination__item--current">' + currentPage + '</span>'
      + ((currentPage + 1 < this.totalPage) ? '<a href="'+ this.options.collectionUrl + '?page=' + (currentPage + 1) + '" class="pagination__item" title="Navigate to page ' + (currentPage + 1) + '" data-page="' + (currentPage + 1) + '">' + (currentPage + 1) + '</a>' : '' )
      + ((currentPage + 2 < this.totalPage) ? '<a href="'+ this.options.collectionUrl + '?page=' + (currentPage + 2) + '" class="pagination__item" title="Navigate to page ' + (currentPage + 2) + '" data-page="' + (currentPage + 2) + '">' + (currentPage + 2) + '</a>' : '' )
      + ((currentPage <= this.totalPage - 4) ? '…' : '')
      + ((currentPage !== this.totalPage) ? '<a href="'+ this.options.collectionUrl + '?page=' + this.totalPage + '" class="pagination__item" title="Navigate to page ' + this.totalPage + '" data-page="' + this.totalPage + '">' + this.totalPage + '</a>' : '' )
      + ((currentPage + 1 <= this.totalPage) ? '<a href="'+ this.options.collectionUrl + '?page=' + (currentPage + 1) + '" class="pagination__item" rel="next" title="Next page" data-page="' + (currentPage + 1) + '"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13 8C12.9938 7.80932 12.9162 7.62035 12.7668 7.47461L6.36138 1.22802C6.05055 0.923993 5.54555 0.923993 5.2338 1.22802C4.92207 1.53114 4.92207 2.02364 5.2338 2.32764L11.0504 8L5.2338 13.6724C4.92207 13.9764 4.92207 14.4689 5.2338 14.772C5.54555 15.076 6.05053 15.076 6.36138 14.772L12.7668 8.52539C12.9162 8.37968 12.9938 8.19068 13 8Z" fill="black"/></svg></a>' : '');
    }
    paginationHtml += '<a href="'+ this.options.collectionUrl + '?page=' + (currentPage === '999' ? "1" : '999' ) + '" class="pagination__item" title="' + (currentPage === '999' ? 'View Less' : 'View All' ) + '" data-page="' + (currentPage === '999' ? '1' : '' ) + '">' + (currentPage === '999' ? 'View Less' : 'View All' ) + '</a>';        
    paginationHtml += '<div class="infinite-scroll-element"></div>';

    document.querySelector(selectors.paginationContainer).innerHTML = paginationHtml;
    
    if(this.options.paginationType == 'infinite_scroll') {
      document.querySelector(selectors.paginationContainer).classList.add('is-hidden');
      const infiniteScroll = document.querySelector(".infinite-scroll-element"),io=new IntersectionObserver(e=>{e[0].intersectionRatio<=0||_this.totalPage<=currentPage||_this.getProducts(currentPage+1)});io.observe(infiniteScroll);   
    } else {
      document.querySelector(selectors.paginationContainer).classList.remove('is-hidden');
    }
  }

  Collection.prototype.initQueryFromUrl = function() {
    var queryString = this.helpers().generateQuery();

    if (queryString.q) {
      this.params.q = queryString.q;
    }
    if (queryString.sort_by) {	
      this.params.sortBy = queryString.sort_by;
    }
    if (queryString.page) {
      this.params.page = parseInt(queryString.page);
    }

    if (this.params.q) {
      this.params.q = decodeURI(this.params.q);      	

      this.filterHelpers().searchToFilter(this.params.q.split(','));
      this.handleFilterChange();
    }
    
    if(this.params.filterOptions) {
      this.filterHelpers().setFilterOptions(this.params);
    }
  }
  
  Collection.prototype.sortProducts = function(products) {
    var e = 0;
    
    if (this.params.sortBy == 'title-descending')
      e = function (b,a) { return a.title.localeCompare(b.title)}
    else if (this.params.sortBy == 'title-ascending')
      e = function (a,b) { return a.title.localeCompare(b.title)}
    else if (this.params.sortBy == 'price-ascending')
      e = function (a,b) { return a.price - b.price}
    else if (this.params.sortBy == 'price-descending')
      e = function (b,a) { return a.price - b.price}
    else if (this.params.sortBy == 'created-ascending')
      e = function (a,b) { return (a.published_at > b.published_at  ? -1 : (a.published_at == b.published_at  ? a.title.localeCompare(b.title) : 1)); }
    else if (this.params.sortBy == 'created-descending')
      e = function (b,a) { return (a.published_at > b.published_at  ? 1 : (a.published_at == b.published_at  ? a.title.localeCompare(b.title) : -1)); }
    
    if (e) {
      return products.sort(e);
    }
    
    return products;
  }
  
  Collection.prototype.pushState = function() {
    var a = {},	
        p = !1,	
        _this = this,
        path = location.pathname,
        searchParams = new URLSearchParams();
        
    1 != _this.params.page && ((a.page = _this.params.page), (p = 1)), 
    _this.params.sortBy && _this.params.q && ((a.sortBy = _this.params.sortBy), (a.q = _this.params.q), (p = 1)), 
    _this.params.q && ((a.q = _this.params.q), (p = 1)), _this.params.sortBy && ((a.sortBy = _this.params.sortBy), (p = 1));	
  
    if(a.q){	
      a.q = decodeURI(a.q);	
    }	
      
    Object.keys(a).forEach(function(key){searchParams.append(key, a[key])})
    p && (path = "?" + searchParams.toString()), history.pushState({
      filterOptions: _this.params.filterOptions
    }, " ", path)
  }
  
  Collection.prototype.handleFilterChange = function() {
  	var _this = this;
    
    _this.params.filterOptions = _this.filterHelpers().fillFilter();

    if (_this.params.page !== '999') _this.params.page = 1;
    _this.getProducts(_this.params.page);
    
    var query = Object.keys(_this.params.filterOptions).map(function(o) {
      return _this.params.filterOptions[o].map(function(o) {
        return encodeURIComponent(o)
      }).join(',')
    }).join(',');
    
    if (query) {
      query = location.pathname + '?q=' + query;
      
      if(_this.params.sortBy){ 
        query += '&sort_by='+ _this.params.sortBy 
      }
    } else {
      query = location.pathname;

      if(_this.params.sortBy){ 
        query += '?sort_by='+ _this.params.sortBy 
      }
    }
    
    history.replaceState(_this.params, 'Filtered', query);
  }

  /*
   * HELPER FUNCTIONS FOR FILTERING
   */
  Collection.prototype.filterHelpers = function() { 
  	var _this = this,
        sidebarFilter = document.querySelector(selectors.filterSidebar);
    
    return {
      filterProducts: function(data, filters) {
        var output = [];
        if(filters&&Object.keys(filters).length)for(var i=0;i<data.length;i++)_this.helpers().productTagFilter(filters,data[i])&&output.push(data[i]);else output=data;
        return output;
      },
      fillFilter: function() {
        var andtags = {};

        document.querySelectorAll(".and", sidebarFilter).forEach(function(a) {
          var t = [];
          a.querySelectorAll(".or.filter-selected").forEach(function(a) {
            t.push(_this.helpers().getTagName(a))
          }), t.length && (andtags[a.getAttribute("data-tag")] = t)
        });
        return andtags;
      },
      searchToFilter: function(arr) {
        document.querySelectorAll(".and", sidebarFilter).forEach(function(a) {
          a.querySelectorAll(".or").forEach(function(a) {
            -1 !== arr.indexOf(_this.helpers().getTagName(a)) && a.classList.add("filter-selected")
          })
        });
      },
      setFilterOptions: function(filters) {
        document.querySelectorAll(".and", sidebarFilter).forEach(function(a) {
          var e = a.getAttribute("data-tag");
          var i = filters[e];
          
          i && i.length && a.querySelectorAll(".or").forEach(function(a) {
            i.indexOf(_this.helpers().handleize(a.getAttribute("data-tag")) || _this.helpers().handleize(a.textContent).trim()) >= 0 && a.classList.add("filter-selected")
          })
        });
      }
    }
  }
  
  /*
   * TINY HELPERS FUNCTIONS
   */
  Collection.prototype.helpers = function() { 
    var _this = this;
    
    return {
      handleize: function(string) {
        return string.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '').replace(/^-/, '');
      },
      scrollToTop: function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      generateQuery: function() {
        var url = window.location.href;
        var urlParams= url.split('?'),
            queryArray = [];
    
        if (urlParams.length != 2) {
          return queryArray;
        }
    
        var splitUrl = urlParams[1].split('&');
        for (var i = 0; i < splitUrl.length; i++) {
          var splitEqual  = splitUrl[i].split('=');
          queryArray[splitEqual[0]] = splitEqual[1];
        }
        return queryArray;
      },
      getTagName: function(element) {
        return _this.helpers().handleize(element.getAttribute('data-tag')) || _this.helpers().handleize(element.textContent).trim();       
      },
      basicSearch: function(ortags, classes) {
        var or = false;
        
        classes = classes.map(function(c) {
          return _this.helpers().handleize(c)
        });

        if("object" == typeof ortags) {
          Object.keys(ortags).forEach(function(item){
            if(classes.indexOf(ortags[item]) > -1) return or=!0, !1
          });
        }
        else {
          [ortags].forEach(function(items) {
            Object.keys(items).forEach(function(item) {
              if(classes.indexOf(items[item]) > -1) return or=!0, !1
            });
          })
        }
        return or;
      },
      basicTagSearch: function(ortags, object) {
        return object.tags ? _this.helpers().basicSearch(ortags, object.tags) : false;
      },
      productTagFilter: function(filters, object) {
        var and = true;
        
        Object.keys(filters).forEach(function(ortags) {
          if(and && filters[ortags] && filters[ortags].length) {
            and = and && (_this.customFilters[ortags] ? _this.customFilters[ortags](filters[ortags],object) : _this.helpers().basicTagSearch(filters[ortags],object))
          }
          return and;
        });
        return and;
      },
      compareRanges: function(r,n) {
        for(var e=0;e<n.length;e++)if(r>=n[e][0]&&r<=n[e][1])return!0;return!1
      },
      formatMoney: function(cents, format) {
      	var moneyFormat = '₹ {{amount_no_decimals}}';
        
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
      },
      slideToggle: function(target, duration=300) {
        //TODO:: FIND A BETTER SOLUTION FOR THIS          
      	function slideUp(e,t=500){e.style.transitionProperty="height, margin, padding",e.style.transitionDuration=t+"ms",e.style.boxSizing="border-box",e.style.height=e.offsetHeight+"px",e.offsetHeight,e.style.overflow="hidden",e.style.height=0,e.style.paddingTop=0,e.style.paddingBottom=0,e.style.marginTop=0,e.style.marginBottom=0,window.setTimeout(function(){e.style.display="none",e.style.removeProperty("height"),e.style.removeProperty("padding-top"),e.style.removeProperty("padding-bottom"),e.style.removeProperty("margin-top"),e.style.removeProperty("margin-bottom"),e.style.removeProperty("overflow"),e.style.removeProperty("transition-duration"),e.style.removeProperty("transition-property")},t)}
      	function slideDown(e,t=500){e.style.removeProperty("display");let o=window.getComputedStyle(e).display;"none"===o&&(o="block"),e.style.display=o;let r=e.offsetHeight;e.style.overflow="hidden",e.style.height=0,e.style.paddingTop=0,e.style.paddingBottom=0,e.style.marginTop=0,e.style.marginBottom=0,e.offsetHeight,e.style.boxSizing="border-box",e.style.transitionProperty="height, margin, padding",e.style.transitionDuration=t+"ms",e.style.height=r+"px",e.style.removeProperty("padding-top"),e.style.removeProperty("padding-bottom"),e.style.removeProperty("margin-top"),e.style.removeProperty("margin-bottom"),window.setTimeout(function(){e.style.removeProperty("height"),e.style.removeProperty("overflow"),e.style.removeProperty("transition-duration"),e.style.removeProperty("transition-property")},t)}
      
        if (window.getComputedStyle(target).display === 'none') {
          return slideDown(target, duration);
        } else {
          return slideUp(target, duration);
        }
      }
    }
  }
  
  /*
   * DEFAULT CUSTOM FILTERS
   */
  Collection.prototype.initCustomFilters = function() {
    var _this = this;
    
    return {
      availability: function(ortags, product) {
        var or = false;
        
        ortags.filter(function(tag) {
          if(tag == 'in-stock' && product.available) or = true;
          if(tag == 'out-of-stock' && !product.available) or = true;
        })
        return or;
      },
      brand: function(ortags, product) {
        var or = false;
         
        ortags.filter(function(tag) {
          if(product.vendor && _this.helpers().handleize(tag) == _this.helpers().handleize(product.vendor)) or = true;
        })        
        return or;
      },
      size: function(ortags, product) {
        var or = false;

        ortags.filter(function(tag) {
          product.variants.forEach(function(variant) {
            if(	 variant.option1 && _this.helpers().handleize(tag) == _this.helpers().handleize(variant.option1)
              || variant.option2 && _this.helpers().handleize(tag) == _this.helpers().handleize(variant.option2)
              || variant.option3 && _this.helpers().handleize(tag) == _this.helpers().handleize(variant.option3)
              ) {
              or = true;
            }
          })
        })
        return or;
      },      
      color: function(ortags, product) {
        var or = false;

        ortags.filter(function(tag) {
          product.variants.forEach(function(variant) {
            if(	 variant.option1 && _this.helpers().handleize(tag) == _this.helpers().handleize(variant.option1)
              || variant.option2 && _this.helpers().handleize(tag) == _this.helpers().handleize(variant.option2)
              || variant.option3 && _this.helpers().handleize(tag) == _this.helpers().handleize(variant.option3)
              ) {
              or = true;
            }
          })
        })
        return or;
      },      
      price: function(ortags, product) {
        var or = false,
            prices = [];

        ortags.filter(function(tag) {
          prices.push(tag.split('-'));  
          
          if(_this.helpers().compareRanges(product.price / 100, prices)) or = true;
        })
        return or;
      },
      producttype: function(ortags, product) {
        var or = false;

        ortags.filter(function(tag) {
          if(product.type && _this.helpers().handleize(tag) == _this.helpers().handleize(product.type)) or = true;
        })
        return or;
      },
      length: function(ortags, product) {
        var or = false;

        ortags.filter(function(tag) {
          if(product.metafield.length && _this.helpers().handleize(tag) == _this.helpers().handleize(product.metafield.length)) or = true;
        })
        return or;
      }
    }
  }
  
  /*
   * CREATE FILTER & PRODUCT CARDS HTML
   */
  Collection.prototype.htmlRenderer = function() {
  	var _this = this;
    
    return {
      renderProduct: function (index, product) {
      	var productHtml = '';
        
        var image_space = 100;
        if(product.featured_image) {
          var splitImage = product.featured_image.split(".");          
          splitImage[splitImage.length-2] = splitImage[splitImage.length-2] + "_360x";
          
          var product_image = splitImage.join('.');
          image_space = 100;
        }
        
        productHtml += '<div class="mmc-loop-item" data-index="'+ index +'">';
        productHtml += '<div class="mmc-product-card">';
        
        //Product Badges

        if (product.compare_at_price != null) {

        productHtml += '<span class="badge">Sale</span>';        

          
        }
        
        //Product Image
        productHtml += '<a href="'+ product.url +'" class="mmc-card-image" style="padding-bottom: '+ image_space +'%;">';
        productHtml += '<img src="'+ product_image +'" alt="'+ product.title +'" />';
        productHtml += '</a>';
        
        //Product Info
        productHtml += '<div class="mmc-card-info">';        
        productHtml += '<a href="'+ product.url +'" class="mmc-card-title">'+ product.title +'</a>';
        
        productHtml += '<div class="mmc-card-price">';        
        
        if(product.compare_at_price > product.price) {
          productHtml += '<span class="mmc-price-sale">'+ _this.helpers().formatMoney(product.price) +'</span>';
          productHtml += '<span class="mmc-price-compare">'+ _this.helpers().formatMoney(product.compare_at_price) +'</span>';
          let discount = ((product.compare_at_price - product.price)*100)/product.compare_at_price;
          
          productHtml += '<span class="mmc-percent-discount">'+" ("+ Math.trunc(discount) + "% Off)" +'</span>';

        } else {
          productHtml += '<span class="mmc-price-regular">'+ _this.helpers().formatMoney(product.price) +'</span>';
        }
        productHtml += '<div class="mmc-card-buy-btn">BUY</div>';        


        productHtml += '</div>';        
        productHtml += '</div>';
        
        productHtml += '</div>';  
        productHtml += '</div>';
        
        return productHtml;
      }
    }
  }
  
  return Collection;
})();

new marmeto.Collection('marmeto-collection-template');