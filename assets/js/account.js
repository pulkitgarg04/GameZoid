function accountRoute() {
  const currentUser = sessionStorage.getItem("currentUser");

  if (currentUser) {
    window.location.href = "./account.html";
  } else {
    window.location.href = "./login.html";
  }
}

let currentUser = null;

function getWishlist() {
  try {
    const wishlist = localStorage.getItem("wishlist");
    return wishlist ? JSON.parse(wishlist) : [];
  } catch (e) {
    console.error("Error reading wishlist from localStorage", e);
    return [];
  }
}

function saveWishlist(arr) {
  try {
    localStorage.setItem("wishlist", JSON.stringify(arr || []));
  } catch (e) {
    console.error("Error saving wishlist to localStorage", e);
  }
}

function getCurrentUser() {
  let user = sessionStorage.getItem("currentUser");
  if (user) {
    try {
      return JSON.parse(user);
    } catch (e) {
      console.log("Error parsing current user from sessionStorage:", e);
      sessionStorage.removeItem("currentUser");
    }
  }

  return null;
}

function getUserInfo() {
  currentUser = getCurrentUser();

  if (currentUser) {
    document.getElementById("name").innerHTML = currentUser.name;
    document.getElementById("email").innerHTML = currentUser.email;

    loadWishlist();
  } else {
    alert("You need to login to access this page!");
    window.location.href = "./login.html";
  }
}

function loadWishlist() {
  if (!currentUser) return;

  try {
    const all = getWishlist();
    const wishlist = all.filter(
      (i) => String(i.userEmail).toLowerCase() === String(currentUser.email).toLowerCase()
    );

    const wishlistEmpty = document.getElementById("wishlist-empty");
    const wishlistItems = document.getElementById("wishlist-items");
    if (!wishlistItems) return;

    wishlistItems.innerHTML = "";

    if (!wishlist || wishlist.length === 0) {
      if (wishlistEmpty) wishlistEmpty.style.display = "block";
      return;
    }

    if (wishlistEmpty) wishlistEmpty.style.display = "none";

    wishlist.forEach((item) => {
      const name = item.gameName || item.productName || item.name || 'Item';
      const price = Number((item.gamePrice ?? item.productPrice ?? item.price) || 0).toFixed(2);
      const productId = item.gameId || item.productId || item.id;
      const wishlistId = item.id;

      const wrapper = document.createElement('div');
      wrapper.className = 'wishlist-item';
      if (wishlistId !== undefined) wrapper.setAttribute('data-id', String(wishlistId));

      const info = document.createElement('div');
      info.className = 'wishlist-item-info';
      const h3 = document.createElement('h3');
      h3.textContent = name;
      const pPrice = document.createElement('p');
      pPrice.className = 'price';
      pPrice.textContent = `$${price}`;
      const pDate = document.createElement('p');
      pDate.className = 'added-date';
      pDate.textContent = `Added: ${item.addedAt ? new Date(item.addedAt).toLocaleDateString() : ''}`;

      info.appendChild(h3);
      info.appendChild(pPrice);
      info.appendChild(pDate);

      const actions = document.createElement('div');
      actions.className = 'wishlist-item-actions';

      const moveBtn = document.createElement('button');
      moveBtn.className = 'move-to-cart-btn';
      moveBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Move to Cart';
      moveBtn.addEventListener('click', () => moveToCart(productId, name, Number((item.gamePrice ?? item.productPrice ?? item.price) || 0), wishlistId));

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-from-wishlist-btn';
      removeBtn.innerHTML = '<i class="fas fa-trash"></i> Remove';
      removeBtn.addEventListener('click', () => removeFromWishlist(wishlistId, name));

      actions.appendChild(moveBtn);
      actions.appendChild(removeBtn);

      wrapper.appendChild(info);
      wrapper.appendChild(actions);

      wishlistItems.appendChild(wrapper);
    });
  } catch (error) {
    console.error("Error loading wishlist:", error);
    const wishlistEmpty = document.getElementById("wishlist-empty");
    const wishlistItems = document.getElementById("wishlist-items");
    if (wishlistEmpty) wishlistEmpty.style.display = "block";
    if (wishlistItems) wishlistItems.innerHTML = "";
  }
}


function moveToCart(gameId, gameName, gamePrice, wishlistId) {
  if (!currentUser) {
    return;
  }

  let cart = JSON.parse(localStorage.getItem("cart") || "[]");

  if (cart.find((item) => item.id === gameId && item.type === "game")) {
    alert(`${gameName} is already in your cart!`);
    return;
  }

  const cartItem = {
    id: gameId,
    type: "game",
    addedAt: new Date().toISOString(),
    addedBy: currentUser.email,
    gameName: gameName,
    gamePrice: gamePrice,
  };

  cart.push(cartItem);
  localStorage.setItem("cart", JSON.stringify(cart));

  try {
    removeFromWishlist(wishlistId, gameName);
    
    alert(`${gameName} has been moved to your cart!`);
    
    loadWishlist();
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    alert("Error moving item to cart. Please try again.");
  }
}

function removeFromWishlist(wishlistId, gameName) {
  try {
    const all = getWishlist();
    const filtered = all.filter((i) => Number(i.id) !== Number(wishlistId));
    
    saveWishlist(filtered);
    alert(`${gameName} has been removed from your wishlist.`);
    
    loadWishlist();
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    alert("Error removing item from wishlist. Please try again.");
  }
}

function logout() {
  sessionStorage.removeItem("currentUser");
  localStorage.removeItem("cart");
  alert("You have been logged out!");
  window.location.href = "./login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  getUserInfo();
});