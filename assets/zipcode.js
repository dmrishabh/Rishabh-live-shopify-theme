class PincodeChecker extends HTMLElement {
    constructor() {
      super();
      this.pincodeJson = {};
      this.sheetKey = '1h0kscMJ6SHc6iScepk-jOZPDvfjhc5ffuxV0Sv75cQ4';
      this.apiKey = 'AIzaSyB_QbDtY6TNB2bdZoz4u3y3YDpeuB7BlME';
      this.pincodeInput = this.querySelector('[name="pincode-input"]');
      this.pincodeSubmitBtn = this.querySelector('[name="pincode-submit"]');
      this.pincodeMessage = this.querySelector('[name="pincode-message"]');
      this.sheetUrl = "https://sheets.googleapis.com/v4/spreadsheets/" + this.sheetKey + "/values/Sheet1?key=" + this.apiKey;
        
      this.getPincodeJson();
      this.pincodeSubmitBtn.addEventListener('click', this.validatePincode.bind(this));
      //COSMETICS :: CLEAR INPUT ON CLICK :: ALLOW ONLY NUMBERS
      this.pincodeInput.addEventListener('click', this.clearInput.bind(this));
      this.pincodeInput.addEventListener('keypress', function(e) {
        if (e.which < 48 || e.which > 57 || e.target.value.length === 6) 
          e.preventDefault();
      });
    }
  
    getPincodeJson() {
      if (sessionStorage.getItem("pincodeData") === null) {
        fetch(this.sheetUrl)
        .then(function(response) {
          return response.json();
        })
        .then(function(data) {
          let sheetData = JSON.stringify(data.values);
          sessionStorage.setItem("pincodeData", sheetData);        
        })
        .catch(function(error) {
          console.error('Error:', error);
        });
      }
    }
    
    validatePincode() {
      if(this.pincodeInput.value.length === 6) {      
        this.pincodeJson = JSON.parse(sessionStorage.getItem("pincodeData"));
        this.jsonResult = {
          pincodeServiceable: 'No',
          codAvailable: 'No',
          deliveryMessage: ''
        };
  
        for (let i=0; i<this.pincodeJson.length; i++) {
          if (this.pincodeJson[i] && this.pincodeJson[i][0] == this.pincodeInput.value) {
            this.jsonResult.pincodeServiceable = this.pincodeJson[i][1];
            this.jsonResult.codAvailable = this.pincodeJson[i][2];
            this.jsonResult.deliveryMessage = this.pincodeJson[i][3];   
            break;
          }
        }
  
        if(this.jsonResult.pincodeServiceable.toLowerCase() == 'yes') {
          let successHtml = '<ul>';
          successHtml += '<li>Service is available to your location</li>';
  
          if(this.jsonResult.codAvailable.toLowerCase() == 'yes') {
            successHtml += '<li>COD is available</li>';
          }
          if(this.jsonResult.deliveryMessage != '') {
            successHtml += '<li>'+ this.jsonResult.deliveryMessage +'</li>';
          }          
          successHtml += '</ul>';
  
          this.pincodeMessage.innerHTML = successHtml;
          this.pincodeMessage.classList.add('is-success');
          this.pincodeMessage.classList.remove('is-error', 'is-hidden');
        } 
        else {
          //IF THE ENTERED PINCODE DOESN'T MATCH WITH THE SHEET PINCODES OR UNSERVICEABLE
          this.pincodeMessage.innerHTML = 'Service is not available to your location. Please try with an alternative pincode!';
          this.pincodeMessage.classList.add('is-error');
          this.pincodeMessage.classList.remove('is-success', 'is-hidden');
        }
      } 
      else {
        //IF THE PINCODE IS NOT 6 DIGITS
        this.pincodeMessage.innerHTML = 'Please enter a valid 6 digit pincode!!';
        this.pincodeMessage.classList.add('is-error');
        this.pincodeMessage.classList.remove('is-success', 'is-hidden');
      }  
    }
  
    clearInput() {
      this.pincodeInput.value = '';
      this.pincodeMessage.classList.add('is-hidden');
      this.pincodeMessage.classList.remove('is-success', 'is-error');
    }
  }
  
  customElements.define('pincode-checker', PincodeChecker);