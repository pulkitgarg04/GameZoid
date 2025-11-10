function accountRoute() {
  const currentUser = sessionStorage.getItem('currentUser');
  
  if (currentUser) {
    window.location.href = './account.html';
  } else {
    window.location.href = './login.html';
  }
}

function getStore(name) {
  try {
    const item = localStorage.getItem(name);
    return item ? JSON.parse(item) : [];
  } catch (e) {
    console.error(`Error reading ${name} from localStorage`, e);
    return [];
  }
}

function loadCart() {
  try {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (!Array.isArray(cart) || cart.length === 0) return showEmptyCart();

    const cartItems = cart.map(cartItem => {
      const storeName = cartItem.type === 'product' ? 'products' : 'games';
      const store = getStore(storeName);
      
      const product = store.find(x => String(x.id) === String(cartItem.id));
      
      if (product) {
        return {
          cartId: cartItem.id,
          type: cartItem.type,
          id: product.id,
          name: product.name || product.title || 'Item',
          price: Number(cartItem.price ?? product.price ?? 0),
          image: product.image || '../assets/media/favicon.png',
          category: product.category || '',
          quantity: Number(cartItem.quantity || 1),
          addedAt: cartItem.addedAt || ''
        };
      }

      return {
        cartId: cartItem.id,
        type: cartItem.type,
        id: cartItem.id,
        name: cartItem.name || 'Item',
        price: Number(cartItem.price || 0),
        image: cartItem.image || '../assets/media/favicon.png',
        category: '',
        quantity: Number(cartItem.quantity || 1),
        addedAt: cartItem.addedAt || ''
      };
    });

    displayCartItems(cartItems);
    updateCartSummary(cartItems);
  } catch (error) {
    console.error('Error loading cart:', error);
    showEmptyCart();
  }
}

function showEmptyCart() {
  const cartItemsContainer = document.getElementById('cart-items');
  const emptyCart = document.getElementById('empty-cart');
  const cartSummary = document.getElementById('cart-summary');

  if (cartItemsContainer) {
    cartItemsContainer.style.display = 'none';
  }

  if (emptyCart) {
    emptyCart.style.display = 'block';
  }

  if (cartSummary) {
    cartSummary.style.display = 'none';
  }
}

function removeFromCart(cartId, type) {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const item = cart.find(i => String(i.id) === String(cartId) && i.type === type);

  if (!item) {
    return showCartMessage('Item not found in cart', 'error');
  }

  if (!confirm(`Remove ${item.name || 'this item'} from cart?`)) {
    return;
  }

  const updated = cart.filter(i => !(String(i.id) === String(cartId) && i.type === type));
  localStorage.setItem('cart', JSON.stringify(updated));
  showCartMessage('Item removed from cart', 'info');
  loadCart();
}

function clearCart() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  if (!cart || cart.length === 0) {
    return showCartMessage('Cart is already empty', 'info');
  }
  
  if (!confirm(`Are you sure you want to clear all ${cart.length} items from your cart?`)) {
    return;
  }

  localStorage.removeItem('cart');
  showCartMessage('Cart cleared successfully', 'success');
  showEmptyCart();
}

function updateCartSummary(items) {
  const subtotal = (items || []).reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
  const subtotalElement = document.getElementById('subtotal');
  const totalElement = document.getElementById('total');

  if (subtotalElement) subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
  if (totalElement) totalElement.textContent = `$${subtotal.toFixed(2)}`;
}

function continueShopping() {
  window.location.href = './store.html';
}

function proceedToCheckout() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  
  if (cart.length === 0) {
    showCartMessage('Your cart is empty', 'error');
    return;
  }

  window.location.href = './checkout.html';
}

function showCartMessage(message, type) {
  const existingMessages = document.querySelectorAll('.cart-message');
  existingMessages.forEach(msg => msg.remove());

  const messageDiv = document.createElement('div');
  messageDiv.className = `cart-message ${type}`;
  messageDiv.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
    ${message}
  `;

  const cartContent = document.querySelector('#cart-content');
  cartContent.insertBefore(messageDiv, cartContent.firstChild);

  setTimeout(() => {
    messageDiv.remove();
  }, 3000);
}

const cartMessageStyles = `
  .cart-message {
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

  .cart-message.success {
    border-color: #28a745;
    color: #28a745;
  }

  .cart-message.error {
    border-color: #dc3545;
    color: #dc3545;
  }

  .cart-message.info {
    border-color: var(--color);
    color: var(--color);
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

function getCartItemCount() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  return cart.length;
}

function displayCartItems(items) {
  const cartItemsContainer = document.getElementById('cart-items');
  const emptyCart = document.getElementById('empty-cart');
  const cartSummary = document.getElementById('cart-summary');

  if (items.length === 0) {
    showEmptyCart();
    return;
  }

  cartItemsContainer.style.display = 'block';
  emptyCart.style.display = 'none';
  cartSummary.style.display = 'block';

  cartItemsContainer.innerHTML = `
    <div class="cart-controls">
      <div class="cart-stats">
        <span>Total Items: ${items.length}</span>
        <span>Total Value: $${items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</span>
      </div>
    </div>
  ` + items.map(item => `
    <div class="cart-item" data-cart-id="${item.cartId}" data-type="${item.type}">
      <img src="${item.image}" alt="${item.name}" class="item-image" onerror="this.src='../assets/media/favicon.png'">
      <div class="item-details">
        <h3 class="item-name">${item.name}</h3>
        <div class="item-category">${item.category}</div>
        <div class="item-price">$${item.price}</div>
      </div>
      <div class="item-controls">
        <button class="remove-btn" onclick="removeFromCart('${item.cartId}', '${item.type}')">
          <i class="fas fa-trash"></i> Remove
        </button>
      </div>
    </div>
  `).join('');
}

const styleSheet = document.createElement('style');
styleSheet.textContent = cartMessageStyles + `
  .cart-controls {
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(255, 187, 0, 0.3);
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .cart-stats {
    display: flex;
    gap: 1rem;
    color: var(--color);
    font-weight: 600;
  }

  @media (max-width: 768px) {
    .cart-controls {
      flex-direction: column;
      text-align: center;
    }
    
    .cart-stats {
      justify-content: center;
    }
  }
`;
document.head.appendChild(styleSheet);
document.addEventListener('DOMContentLoaded', () => loadCart());