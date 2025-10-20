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
  if (!currentUser) {
    return;
  }

  try {
    const all = getWishlist();
    const wishlist = all.filter(
      (i) =>
        String(i.userEmail).toLowerCase() ===
        String(currentUser.email).toLowerCase()
    );

    const wishlistEmpty = document.getElementById("wishlist-empty");
    const wishlistItems = document.getElementById("wishlist-items");

    if (wishlist.length === 0) {
      wishlistEmpty.style.display = "block";
      wishlistItems.innerHTML = "";
    } else {
      wishlistEmpty.style.display = "none";
      wishlistItems.innerHTML = wishlist
        .map(
          (item) => `
        <div class="wishlist-item" data-id="${item.id}">
          <div class="wishlist-item-info">
            <h3>${item.gameName}</h3>
            <p class="price">$${Number(item.gamePrice || 0).toFixed(2)}</p>
            <p class="added-date">Added: ${new Date(
              item.addedAt
            ).toLocaleDateString()}</p>
          </div>
          <div class="wishlist-item-actions">
            <button class="move-to-cart-btn" onclick="moveToCart(${
              item.gameId
            }, '${escapeHtml(item.gameName)}', ${item.gamePrice}, ${item.id})">
              <i class="fas fa-shopping-cart"></i> Move to Cart
            </button>
            <button class="remove-from-wishlist-btn" onclick="removeFromWishlist(${
              item.id
            }, '${escapeHtml(item.gameName)}')">
              <i class="fas fa-trash"></i> Remove
            </button>
          </div>
        </div>
      `
        )
        .join("");
    }
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
    removeFromWishlist(wishlistId);
    
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