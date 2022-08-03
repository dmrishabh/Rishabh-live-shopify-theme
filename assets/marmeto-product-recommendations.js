window.marmeto = window.marmeto || {};
  
marmeto.ProductRecommendations = (function() {
  function ProductRecommendations(element) {
    var container = document.querySelector('[data-section-type="' + element + '"]');  
    var baseUrl = container.dataset.baseUrl;
    var productId = container.dataset.productId;
    var recommendationsSectionUrl =
      baseUrl +
      '?section_id=marmeto-product-recommendations&product_id=' +
      productId +
      '&limit=4';

    fetch(recommendationsSectionUrl)
      .then(function(response) {
        return response.text();
      })
      .then(function(productHtml) {
        if (productHtml.trim() === '') return;

        container.innerHTML = productHtml;
        container.innerHTML = container.firstElementChild.innerHTML;
      });
  }

  return ProductRecommendations;
})();

new marmeto.ProductRecommendations('marmeto-product-recommendations');