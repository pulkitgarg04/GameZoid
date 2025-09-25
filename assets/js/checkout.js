function accountRoute() {
  const currentUser = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
  
  if (currentUser) {
    window.location.href = './account.html';
  } else {
    window.location.href = './login.html';
  }
}

class CheckoutDatabase {
  constructor() {
    this.dbName = 'GameZoidDB';
    this.dbVersion = 1;
    this.db = null;
    this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Database failed to open');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('Checkout database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
      };
    });
  }

  async getGameById(id) {
    if (!this.db) return null;
    const transaction = this.db.transaction(['games'], 'readonly');
    const store = transaction.objectStore('games');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getProductById(id) {
    if (!this.db) return null;
    const transaction = this.db.transaction(['products'], 'readonly');
    const store = transaction.objectStore('products');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

let checkoutDB;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    checkoutDB = new CheckoutDatabase();
    await checkoutDB.init();
    await loadCheckoutItems();
    setupFormValidation();
  } catch (error) {
    console.error('Failed to initialize checkout database:', error);
    showCheckoutMessage('Failed to load checkout items', 'error');
  }
});

async function loadCheckoutItems() {
  try {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart.length === 0) {
      showCheckoutMessage('Your cart is empty', 'error');
      setTimeout(() => {
        window.location.href = './cart.html';
      }, 2000);
      return;
    }

    const checkoutItems = [];
    for (const cartItem of cart) {
      let item = null;
      if (cartItem.type === 'game') {
        item = await checkoutDB.getGameById(cartItem.id);
      } else if (cartItem.type === 'product') {
        item = await checkoutDB.getProductById(cartItem.id);
      }
      
      if (item) {
        checkoutItems.push({
          ...item,
          cartId: cartItem.id,
          type: cartItem.type,
          addedAt: cartItem.addedAt
        });
      }
    }

    displayCheckoutItems(checkoutItems);
    updateCheckoutSummary(checkoutItems);

    try {
      sessionStorage.setItem('checkoutItemsDetails', JSON.stringify(checkoutItems));
    } catch (e) {
      console.warn('Unable to cache checkout items for payment:', e);
    }
  } catch (error) {
    console.error('Error loading checkout items:', error);
    showCheckoutMessage('Failed to load checkout items', 'error');
  }
}

function displayCheckoutItems(items) {
  const checkoutItemsContainer = document.getElementById('checkout-items');
  
  checkoutItemsContainer.innerHTML = items.map(item => `
    <div class="checkout-item">
      <img src="${item.image}" alt="${item.name}" onerror="this.src='../assets/media/favicon.png'">
      <div class="checkout-item-details">
        <div class="checkout-item-name">${item.name}</div>
        <div class="checkout-item-category">${item.category}</div>
      </div>
      <div class="checkout-item-price">$${item.price}</div>
    </div>
  `).join('');
}

function updateCheckoutSummary(items) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const total = subtotal;

  document.getElementById('checkout-subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('checkout-total').textContent = `$${total.toFixed(2)}`;
}

function setupFormValidation() {
  const form = document.getElementById('checkoutForm');
  
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (validateForm()) {
      processCheckout();
    }
  });
}

function validateForm() {
  const requiredFields = [
    'firstName', 'lastName', 'email', 'phone', 
    'address', 'city', 'state', 'zipCode', 'country'
  ];
  
  let isValid = true;
  
  requiredFields.forEach(fieldName => {
    const field = document.getElementById(fieldName);
    const value = field.value.trim();
    
    if (!value) {
      showFieldError(field, 'This field is required');
      isValid = false;
    } else {
      clearFieldError(field);
    }
  });
  
  const email = document.getElementById('email').value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    showFieldError(document.getElementById('email'), 'Please enter a valid email address');
    isValid = false;
  }
  
  const phone = document.getElementById('phone').value.trim();
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  if (phone && !phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
    showFieldError(document.getElementById('phone'), 'Please enter a valid phone number');
    isValid = false;
  }
  
  return isValid;
}

function showFieldError(field, message) {
  clearFieldError(field);
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'field-error';
  errorDiv.textContent = message;
  
  field.parentNode.appendChild(errorDiv);
  field.style.borderColor = '#dc3545';
}

function clearFieldError(field) {
  const existingError = field.parentNode.querySelector('.field-error');
  if (existingError) {
    existingError.remove();
  }
  field.style.borderColor = 'rgba(255, 187, 0, 0.3)';
}

function processCheckout() {
  const formData = new FormData(document.getElementById('checkoutForm'));
  const checkoutData = Object.fromEntries(formData.entries());
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  let enrichedItems = [];
  try {
    enrichedItems = JSON.parse(sessionStorage.getItem('checkoutItemsDetails')) || [];
  } catch (_) {
    enrichedItems = [];
  }
  
  sessionStorage.setItem('checkoutData', JSON.stringify({
    ...checkoutData,
    items: Array.isArray(enrichedItems) && enrichedItems.length > 0 ? enrichedItems : cart,
    timestamp: new Date().toISOString()
  }));
  
  const submitBtn = document.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  submitBtn.disabled = true;
  
  setTimeout(() => {
    window.location.href = './payment.html';
  }, 1500);
}

function goBackToCart() {
  window.location.href = './cart.html';
}

function showCheckoutMessage(message, type) {
  const existingMessages = document.querySelectorAll('.checkout-message');
  existingMessages.forEach(msg => msg.remove());

  const messageDiv = document.createElement('div');
  messageDiv.className = `checkout-message ${type}`;
  messageDiv.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
    ${message}
  `;

  const checkoutContent = document.querySelector('#checkout-content');
  checkoutContent.insertBefore(messageDiv, checkoutContent.firstChild);

  setTimeout(() => {
    messageDiv.remove();
  }, 5000);
}

const checkoutMessageStyles = `
  .checkout-message {
    position: fixed;
    top: 100px;
    right: 20px;
    background: rgba(0, 0, 0, 0.9);
    border: 1px solid var(--color);
    color: var(--color);
    padding: 15px 20px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    z-index: 1000;
    animation: slideInRight 0.3s ease;
  }

  .checkout-message.success {
    border-color: #28a745;
    color: #28a745;
  }

  .checkout-message.error {
    border-color: #dc3545;
    color: #dc3545;
  }

  .checkout-message.info {
    border-color: var(--color);
    color: var(--color);
  }

  .field-error {
    color: #dc3545;
    font-size: 0.8rem;
    margin-top: 0.25rem;
    font-weight: 500;
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = checkoutMessageStyles;
document.head.appendChild(styleSheet);
