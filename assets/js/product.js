function accountRoute() {
  const currentUser = sessionStorage.getItem("currentUser");

  if (currentUser) {
    window.location.href = "./account.html";
  } else {
    window.location.href = "./login.html";
  }
}

let currentUser = null;

function getStore(name) {
  try {
    const raw = localStorage.getItem(name);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error(`Error parsing ${name} from localStorage`, e);
    return [];
  }
}

document.addEventListener("DOMContentLoaded", () => {
  try {
    currentUser = getCurrentUser();
    updateUserInterface();
  } catch (e) {
    console.error("Error loading user:", e);
  }

  loadProduct();
});

function getCurrentUser() {
  let user = sessionStorage.getItem("currentUser");
  if (user) {
    try {
      return JSON.parse(user);
    } catch (e) {
      console.error("Error parsing current user from sessionStorage:", e);
      sessionStorage.removeItem("currentUser");
    }
  }

  return null;
}

function updateUserInterface() {
  if (currentUser) {
    const buyButton = document.getElementById("buy-now");

    if (buyButton) {
      buyButton.innerHTML = `<i class="fas fa-shopping-cart"></i> Add to Cart`;
    }
  } else {
    const buyButton = document.getElementById("buy-now");
    if (buyButton) {
      buyButton.innerHTML = `<i class="fas fa-shopping-cart"></i> Login to Purchase`;
    }
  }
}

function checkLogin(message) {
  if (currentUser) {
    return true;
  }

  if (message) alert(message);
  window.location.href = './login.html';

  return false;
}

function getParam(name) {
  const u = new URL(window.location.href);
  return u.searchParams.get(name);
}

function loadProduct() {
  const id = getParam("id");
  if (!id) {
    fallback("No product specified");
    return;
  }

  let data = null;
  try {
    const products = getStore("products");
    data = products.find((p) => String(p.id) === String(id));
  } catch (e) {
    console.error("Error fetching product from localStorage:", e);
  }

  if (!data) {
    fallback("Product not found");
    return;
  }

  renderProduct(data);
}

function renderProduct(p) {
  document.getElementById("product-title").textContent = p.name || "Unknown";
  document.getElementById("product-tagline").textContent =
    p.tagline || p.description?.substring(0, 100) + "..." || "";
  document.getElementById("product-cover").src = p.image || "";
  document.getElementById("product-description").textContent =
    p.description || "No description available";

  document.getElementById("brand").textContent = p.brand || p.manufacturer || "Unknown";
  document.getElementById("model").textContent = p.model || p.name || "Unknown";
  document.getElementById("releaseDate").textContent = p.releaseDate || "-";
  document.getElementById("category").textContent = p.category || "-";
  document.getElementById("warranty").textContent = p.warranty || "1 Year Limited" || "-";
  document.getElementById("rating").textContent = p.rating ? `${p.rating}/5` : "-";
  document.getElementById("price").textContent = `$${Number(p.price || 0).toFixed(2)}`;

  const features = Array.isArray(p.features)
    ? p.features
    : p.keyFeatures
    ? p.keyFeatures
    : p.specifications
    ? Object.keys(p.specifications).slice(0, 5)
    : [];

  document.getElementById("product-features").innerHTML = features
    .map((i) => `<li><i class="fas fa-check"></i><span>${i}</span></li>`)
    .join("");

  const specs = p.specifications || {};
  const specKeys = Object.keys(specs);
  const halfPoint = Math.ceil(specKeys.length / 2);

  document.getElementById("product-specs").innerHTML = specKeys
    .slice(0, halfPoint)
    .map((k) => `<li><strong>${k}:</strong> ${specs[k]}</li>`)
    .join("");

  document.getElementById("product-compatibility").innerHTML = specKeys
    .slice(halfPoint)
    .map((k) => `<li><strong>${k}:</strong> ${specs[k]}</li>`)
    .join("");

  const add = () => {
    if (!checkLogin(`Please log in to add ${p.name} to your cart`)) return;

    let cart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (cart.find((i) => String(i.id) === String(p.id) && i.type === "product")) {
      alert(`${p.name} is already in your cart!`);
      return;
    }

    const cartItem = {
      id: p.id,
      type: "product",
      addedAt: new Date().toISOString(),
      addedBy: currentUser.email,
      productName: p.name,
      productPrice: p.price,
    };

    cart.push(cartItem);
    localStorage.setItem("cart", JSON.stringify(cart));

    alert(`${p.name} has been added to your cart!`);

    window.location.href = "./cart.html";
  };

  document.getElementById("buy-now").addEventListener("click", add);

  const wishlistBtn = document.getElementById("wishlist");
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', () => {
      if (!checkLogin('Please log in to add items to your wishlist')) return;

      try {
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        const exists = wishlist.find(
          (w) => w.userEmail === currentUser.email && String(w.productId) === String(p.id)
        );
        if (exists) {
          alert(`${p.name} is already in your wishlist!`);
          return;
        }

        const wishlistItem = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          userEmail: currentUser.email,
          productId: p.id,
          productName: p.name,
          productPrice: p.price,
          addedAt: new Date().toISOString()
        };

        wishlist.push(wishlistItem);
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        alert(`${p.name} has been added to your wishlist!`);
      } catch (error) {
        console.error('Error adding to wishlist:', error);
        alert('Error adding to wishlist. Please try again.');
      }
    });
  }
}

function fallback(msg) {
  document.getElementById("product-title").textContent = "Product";
  document.getElementById("product-description").textContent =
    msg || "Unable to load product";
}