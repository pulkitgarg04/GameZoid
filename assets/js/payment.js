function accountRoute() {
  const currentUser = sessionStorage.getItem('currentUser');
  
  if (currentUser) {
    window.location.href = './account.html';
  } else {
    window.location.href = './login.html';
  }
}

let checkoutData = null;
let paymentTimer = null;
let timeLeft = 300;

document.addEventListener('DOMContentLoaded', () => {
  try {
    loadPaymentData();
    setupPaymentHandlers();
  } catch (e) {
    console.log('Failed to initialize payment database:', e);
    showPaymentMessage('Failed to load payment data', 'error');
  }
});

function loadPaymentData() {
  try {
    const storedData = sessionStorage.getItem('checkoutData');
    if (!storedData) {
      showPaymentMessage('No checkout data found', 'error');
      setTimeout(() => {
        window.location.href = './checkout.html';
      }, 2000);

      return;
    }

    checkoutData = JSON.parse(storedData);
    
    const cart = checkoutData.items || [];
    if (!Array.isArray(cart) || cart.length === 0) {
      showPaymentMessage('No items to pay for', 'error');
      setTimeout(() => {
        window.location.href = './cart.html';
      }, 2000);
      return;
    }

    const paymentItems = cart.map(item => ({
      cartId: item.cartId || item.id,
      id: item.id,
      type: item.type,
      name: item.name || 'Item',
      category: item.category || '',
      price: Number(item.price || 0),
      image: item.image || '../assets/media/favicon.png',
      addedAt: item.addedAt
    }));

    displayPaymentItems(paymentItems);
    updatePaymentSummary(paymentItems);
    generateQRCode(paymentItems);
    startPaymentTimer();
  } catch (error) {
    console.error('Error loading payment data:', error);
    showPaymentMessage('Failed to load payment data', 'error');
  }
}

function displayPaymentItems(items) {
  const paymentItemsContainer = document.getElementById('payment-items');
  
  paymentItemsContainer.innerHTML = items.map(item => `
    <div class="payment-item">
      <img src="${item.image}" alt="${item.name}" onerror="this.src='../assets/media/favicon.png'">
      <div class="payment-item-details">
        <div class="payment-item-name">${item.name}</div>
        <div class="payment-item-category">${item.category}</div>
      </div>
      <div class="payment-item-price">$${item.price}</div>
    </div>
  `).join('');
}

function updatePaymentSummary(items) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const total = subtotal;

  document.getElementById('payment-subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('payment-total').textContent = `$${total.toFixed(2)}`;
  document.getElementById('qr-amount').textContent = `$${total.toFixed(2)}`;
  document.getElementById('amount-paid').textContent = `$${total.toFixed(2)}`;
}

function generateQRCode(items) {
  const canvas = document.getElementById('qrCode');
  const wrapper = canvas?.parentElement;
  if (!wrapper) {
    return;
  }

  const img = document.createElement('img');
  
  img.src = '../assets/media/pay/qr-code.png';
  img.alt = 'Payment QR Code';
  img.style.maxWidth = '200px';
  img.style.display = 'block';

  canvas.replaceWith(img);
}

function generateOrderId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);

  return `${timestamp.toString().slice(-6)}-${random}`;
}

function startPaymentTimer() {
  updateTimerDisplay();

  paymentTimer = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    
    if (timeLeft <= 0) {
      clearInterval(paymentTimer);
      showPaymentMessage('Payment session expired', 'error');
      setTimeout(() => {
        window.location.href = './checkout.html';
      }, 2000);
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerElement = document.getElementById('payment-timer');
  timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function setupPaymentHandlers() {
  const cardForm = document.getElementById('cardForm');
  if (cardForm) {
    cardForm.addEventListener('submit', function(e) {
      e.preventDefault();
      processCardPayment();
    });
  }

  const cardNumberInput = document.getElementById('cardNumber');
  if (cardNumberInput) {
    cardNumberInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
      let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
      e.target.value = formattedValue;
    });
  }

  const expiryDateInput = document.getElementById('expiryDate');
  if (expiryDateInput) {
    expiryDateInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
      }
      e.target.value = value;
    });
  }

  const cvvInput = document.getElementById('cvv');
  if (cvvInput) {
    cvvInput.addEventListener('input', function(e) {
      e.target.value = e.target.value.replace(/\D/g, '').substring(0, 3);
    });
  }
}

function switchPaymentMethod(method) {
  document.querySelectorAll('.payment-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  event.target.classList.add('active');

  document.querySelectorAll('.payment-section').forEach(section => {
    section.classList.remove('active');
  });
  document.getElementById(method + '-payment').classList.add('active');

  document.getElementById('payment-method').textContent = method === 'qr' ? 'QR Code' : 'Card Payment';
}

function simulatePayment() {
  const button = event.target;
  const originalText = button.innerHTML;
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  button.disabled = true;

  setTimeout(() => {
    clearInterval(paymentTimer);
    showPaymentSuccess();
  }, 2000);
}

function processCardPayment() {
  const cardNumber = document.getElementById('cardNumber').value;
  const expiryDate = document.getElementById('expiryDate').value;
  const cvv = document.getElementById('cvv').value;
  const cardName = document.getElementById('cardName').value;

  if (!cardNumber || !expiryDate || !cvv || !cardName) {
    showPaymentMessage('Please fill in all card details', 'error');
    return;
  }

  if (cardNumber.replace(/\s/g, '').length !== 16) {
    showPaymentMessage('Please enter a valid 16-digit card number', 'error');
    return;
  }

  if (expiryDate.length !== 5) {
    showPaymentMessage('Please enter a valid expiry date (MM/YY)', 'error');
    return;
  }

  if (cvv.length !== 3) {
    showPaymentMessage('Please enter a valid 3-digit CVV', 'error');
    return;
  }

  const button = document.querySelector('#cardForm button[type="submit"]');
  const originalText = button.innerHTML;
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  button.disabled = true;

  setTimeout(() => {
    clearInterval(paymentTimer);
    showPaymentSuccess();
  }, 2000);
}

function showPaymentSuccess() {
  const modal = document.getElementById('payment-success-modal');
  const orderId = generateOrderId();
  
  document.getElementById('order-id').textContent = orderId; 
  modal.classList.add('show');
  localStorage.removeItem('cart');
  sessionStorage.removeItem('checkoutData');
}


function downloadReceipt() {
  if (!checkoutData) {
    showPaymentMessage('No payment data available for receipt', 'error');
    return;
  }

  const items = checkoutData.items || [];
  const total = items.reduce((sum, item) => sum + (item.price || 0), 0);
  const orderId = document.getElementById('order-id').textContent;
  const paymentMethod = document.getElementById('payment-method').textContent;

  const receiptContent = generateReceiptContent(checkoutData, total, orderId, paymentMethod);
    
  const blob = new Blob([receiptContent], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  a.href = url;
  a.download = `GameZoid_Receipt_${orderId}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  window.URL.revokeObjectURL(url);
  
  showPaymentMessage('Receipt downloaded successfully!', 'success');
}

function generateReceiptContent(checkoutData, total, orderId, paymentMethod) {
  const items = checkoutData.items || [];
  const timestamp = new Date().toLocaleString();
  
  let receipt = `
GAMEZOID - PAYMENT RECEIPT
============================

Order ID: ${orderId}
Date: ${timestamp}
Payment Method: ${paymentMethod}

BILLING INFORMATION:
-------------------
Name: ${checkoutData.firstName} ${checkoutData.lastName}
Email: ${checkoutData.email}
Phone: ${checkoutData.phone}
Address: ${checkoutData.address}
City: ${checkoutData.city}
State: ${checkoutData.state}
ZIP: ${checkoutData.zipCode}
Country: ${checkoutData.country}

ORDER ITEMS:
-----------
`;

  items.forEach((item, index) => {
    receipt += `${index + 1}. ${item.name || 'Unknown Item'}\n`;
    receipt += `   Category: ${item.category || 'N/A'}\n`;
    receipt += `   Price: $${(item.price || 0).toFixed(2)}\n\n`;
  });

  receipt += `
TOTAL AMOUNT: $${total.toFixed(2)}

Thank you for your purchase!
============================

This is a demo receipt generated by GameZoid.
For support, contact us at support@gamezoid.com

Generated on: ${timestamp}
`;

  return receipt;
}

function goToHome() {
  window.location.href = '/';
}

function showPaymentMessage(message, type) {
  const existingMessages = document.querySelectorAll('.payment-message');
  existingMessages.forEach(msg => msg.remove());

  
  const messageDiv = document.createElement('div');
  messageDiv.className = `payment-message ${type}`;
  messageDiv.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
    ${message}
  `;

  const paymentContent = document.querySelector('#payment-content');
  paymentContent.insertBefore(messageDiv, paymentContent.firstChild);

  setTimeout(() => {
    messageDiv.remove();
  }, 5000);
}

const paymentMessageStyles = `
  .payment-message {
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

  .payment-message.success {
    border-color: #28a745;
    color: #28a745;
  }

  .payment-message.error {
    border-color: #dc3545;
    color: #dc3545;
  }

  .payment-message.info {
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

const styleSheet = document.createElement('style');
styleSheet.textContent = paymentMessageStyles;
document.head.appendChild(styleSheet);