async function ensureDbInitialized() {
  if (!window.gameDB || !window.gameDB.getAll) {
    if (window.storageAPI && typeof window.storageAPI.init === 'function') {
      await window.storageAPI.init();
      window.gameDB = window.storageAPI;
    } else {
      window.gameDB = window.gameDB || {};
    }
  }
}

function showMessage(message, type = "info") {
  const existing = document.querySelectorAll(".message");
  existing.forEach((e) => e.remove());
  const d = document.createElement("div");
  d.className = "message " + type + " fade-in";
  d.innerHTML = `<i class="fas fa-${
    type === "success"
      ? "check-circle"
      : type === "error"
      ? "exclamation-circle"
      : "info-circle"
  }"></i> ${message}`;
  const container = document.querySelector(".admin-container") || document.body;
  container.insertBefore(d, container.firstChild);
  setTimeout(() => d.remove(), 4500);
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "block";
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}

function checkScrollIndicator(element) {
  if (!element) return;
  const hasScroll = element.scrollHeight > element.clientHeight;
  element.classList.toggle("has-scroll", hasScroll);
  element.addEventListener("scroll", () => {
    const scrollTop = element.scrollTop;
    const max = element.scrollHeight - element.clientHeight;
    element.classList.toggle("has-scroll", scrollTop < max - 10);
  });
}

function parseKeyValueText(text) {
  const lines = (text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const out = {};
  lines.forEach((line) => {
    const idx = line.indexOf(":");
    if (idx > -1) {
      const k = line.slice(0, idx).trim();
      const v = line.slice(idx + 1).trim();
      if (k) out[k] = v;
    }
  });
  return out;
}

function stringifyKeyValue(obj) {
  return Object.keys(obj || {})
    .map((k) => `${k}: ${obj[k]}`)
    .join("\n");
}

function showTab(tabName) {
  document
    .querySelectorAll(".tab-content")
    .forEach((c) => c.classList.remove("active"));
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  const tab = document.getElementById(tabName + "-tab");
  if (tab) tab.classList.add("active");
  const btn = Array.from(document.querySelectorAll(".tab-btn")).find((b) =>
    b.getAttribute("onclick")?.includes(`showTab('${tabName}')`)
  );
  if (btn) btn.classList.add("active");
}

function showAddGameModal() {
  const f = document.getElementById("addGameForm");
  if (f) f.reset();
  openModal("addGameModal");
  setTimeout(
    () =>
      checkScrollIndicator(
        document.querySelector("#addGameModal .modal-form-content")
      ),
    100
  );
}

function showAddProductModal() {
  const f = document.getElementById("addProductForm");
  if (f) f.reset();
  openModal("addProductModal");
  setTimeout(
    () =>
      checkScrollIndicator(
        document.querySelector("#addProductModal .modal-form-content")
      ),
    100
  );
}

function showGameFields(isGame) {
  const ids = [
    "editTagline",
    "editDeveloper",
    "editPublisher",
    "editReleaseDate",
    "editPlatforms",
    "editRating",
    "editFeatures",
    "editReqMin",
    "editReqRec",
    "editScreenshots",
  ];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    const group = el ? el.closest(".form-group") : null;
    if (group) group.style.display = isGame ? "block" : "none";
  });
}

function displayGames(games) {
  const grid = document.getElementById("gamesGrid");
  if (!grid) return;
  if (!games || games.length === 0) {
    grid.innerHTML = `<div class="empty-state"><i class="fas fa-gamepad"></i><h3>No games found</h3><p>Add your first game to get started!</p></div>`;
    return;
  }
  grid.innerHTML = games
    .map(
      (g) => `
      <div class="item-card slide-up">
        <img src="${
          g.image || "../assets/media/favicon.png"
        }" alt="${escapeHtml(
        g.name
      )}" class="item-image" onerror="this.src='../assets/media/favicon.png'">
        <div class="item-content">
          <div class="item-category">${escapeHtml(g.category || "")}</div>
          <h3 class="item-name">${escapeHtml(g.name)}</h3>
          <div class="item-price">$${Number(g.price || 0).toFixed(2)}</div>
          ${
            g.description
              ? `<p class="item-description">${escapeHtml(g.description)}</p>`
              : ""
          }
          <div class="item-actions">
            <button class="btn-edit" onclick="editGame(${
              g.id
            })"><i class="fas fa-edit"></i> Edit</button>
            <button class="btn-delete" onclick="deleteGame(${
              g.id
            })"><i class="fas fa-trash"></i> Delete</button>
          </div>
        </div>
      </div>
    `
    )
    .join("");
}

function displayProducts(products) {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;
  if (!products || products.length === 0) {
    grid.innerHTML = `<div class="empty-state"><i class="fas fa-box"></i><h3>No products found</h3><p>Add your first gaming product to get started!</p></div>`;
    return;
  }
  grid.innerHTML = products
    .map(
      (p) => `
      <div class="item-card slide-up">
        <img src="${
          p.image || "../assets/media/favicon.png"
        }" alt="${escapeHtml(
        p.name
      )}" class="item-image" onerror="this.src='../assets/media/favicon.png'">
        <div class="item-content">
          <div class="item-category">${escapeHtml(p.category || "")}</div>
          <h3 class="item-name">${escapeHtml(p.name)}</h3>
          <div class="item-price">$${Number(p.price || 0).toFixed(2)}</div>
          ${
            p.description
              ? `<p class="item-description">${escapeHtml(p.description)}</p>`
              : ""
          }
          <div class="item-actions">
            <button class="btn-edit" onclick="editProduct(${
              p.id
            })"><i class="fas fa-edit"></i> Edit</button>
            <button class="btn-delete" onclick="deleteProduct(${
              p.id
            })"><i class="fas fa-trash"></i> Delete</button>
          </div>
        </div>
      </div>
    `
    )
    .join("");
}

function escapeHtml(s) {
  return String(s || "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c])
  );
}

async function loadGames() {
  try {
    await ensureDbInitialized();
    const games = await window.gameDB.getAll("games");
    displayGames(games || []);
  } catch (e) {
    console.error("loadGames error", e);
    showMessage("Error loading games", "error");
  }
}

async function loadProducts() {
  try {
    await ensureDbInitialized();
    const products = await window.gameDB.getAll("products");
    displayProducts(products || []);
  } catch (e) {
    console.error("loadProducts error", e);
    showMessage("Error loading products", "error");
  }
}

async function onAddGame(e) {
  e.preventDefault();
  const game = {
    name: document.getElementById("gameName").value.trim(),
    tagline: document.getElementById("gameTagline").value.trim(),
    category: document.getElementById("gameCategory").value,
    developer: document.getElementById("gameDeveloper").value.trim(),
    publisher: document.getElementById("gamePublisher").value.trim(),
    releaseDate: document.getElementById("gameReleaseDate").value,
    price: parseFloat(document.getElementById("gamePrice").value) || 0,
    image: document.getElementById("gameImage").value.trim(),
    description: document.getElementById("gameDescription").value.trim(),
    platforms: (document.getElementById("gamePlatforms").value || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    rating: parseFloat(document.getElementById("gameRating").value) || 0,
    features: (document.getElementById("gameFeatures").value || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    requirements: {
      minimum: parseKeyValueText(
        document.getElementById("gameReqMin").value || ""
      ),
      recommended: parseKeyValueText(
        document.getElementById("gameReqRec").value || ""
      ),
    },
    screenshots: (document.getElementById("gameScreenshots").value || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
  };
  try {
    await ensureDbInitialized();
    await window.gameDB.add("games", game);
    showMessage("Game added", "success");
    closeModal("addGameModal");
    await loadGames();
    await refreshStats();
  } catch (e) {
    console.error("add game", e);
    showMessage("Error adding game", "error");
  }
}

async function onAddProduct(e) {
  e.preventDefault();
  const p = {
    name: document.getElementById("productName").value.trim(),
    category: document.getElementById("productCategory").value,
    price: parseFloat(document.getElementById("productPrice").value) || 0,
    image: document.getElementById("productImage").value.trim(),
    description: document.getElementById("productDescription").value.trim(),
    tagline: document.getElementById("productTagline")
      ? document.getElementById("productTagline").value.trim()
      : "",
  };
  try {
    await ensureDbInitialized();
    await window.gameDB.add("products", p);
    showMessage("Product added", "success");
    closeModal("addProductModal");
    await loadProducts();
    await refreshStats();
  } catch (e) {
    console.error("add product", e);
    showMessage("Error adding product", "error");
  }
}

async function editGame(id) {
  try {
    await ensureDbInitialized();
    const games = await window.gameDB.getAll("games");
    const g = games.find((x) => x.id === id);
    if (!g) return showMessage("Game not found", "error");
    document.getElementById("editModalTitle").textContent = "Edit Game";
    document.getElementById("editId").value = id;
    document.getElementById("editType").value = "game";
    document.getElementById("editName").value = g.name || "";
    document.getElementById("editTagline").value = g.tagline || "";
    document.getElementById("editCategory").value = g.category || "";
    document.getElementById("editPrice").value = g.price || 0;
    document.getElementById("editImage").value = g.image || "";
    document.getElementById("editDescription").value = g.description || "";
    document.getElementById("editDeveloper").value = g.developer || "";
    document.getElementById("editPublisher").value = g.publisher || "";
    document.getElementById("editReleaseDate").value = g.releaseDate || "";
    document.getElementById("editPlatforms").value = Array.isArray(g.platforms)
      ? g.platforms.join(", ")
      : g.platforms || "";
    document.getElementById("editRating").value = g.rating || "";
    document.getElementById("editFeatures").value = Array.isArray(g.features)
      ? g.features.join("\n")
      : "";
    document.getElementById("editReqMin").value = stringifyKeyValue(
      g.requirements?.minimum || {}
    );
    document.getElementById("editReqRec").value = stringifyKeyValue(
      g.requirements?.recommended || {}
    );
    document.getElementById("editScreenshots").value = Array.isArray(
      g.screenshots
    )
      ? g.screenshots.join("\n")
      : "";
    showGameFields(true);
    openModal("editModal");
    setTimeout(
      () =>
        checkScrollIndicator(
          document.querySelector("#editModal .modal-form-content")
        ),
      100
    );
  } catch (e) {
    console.error("editGame", e);
    showMessage("Error loading game for edit", "error");
  }
}

async function editProduct(id) {
  try {
    await ensureDbInitialized();
    const ps = await window.gameDB.getAll("products");
    const p = ps.find((x) => x.id === id);
    if (!p) return showMessage("Product not found", "error");
    document.getElementById("editModalTitle").textContent = "Edit Product";
    document.getElementById("editId").value = id;
    document.getElementById("editType").value = "product";
    document.getElementById("editName").value = p.name || "";
    document.getElementById("editCategory").value = p.category || "";
    document.getElementById("editPrice").value = p.price || 0;
    document.getElementById("editImage").value = p.image || "";
    document.getElementById("editDescription").value = p.description || "";
    showGameFields(false);
    openModal("editModal");
    setTimeout(
      () =>
        checkScrollIndicator(
          document.querySelector("#editModal .modal-form-content")
        ),
      100
    );
  } catch (e) {
    console.error("editProduct", e);
    showMessage("Error loading product for edit", "error");
  }
}

async function onEditSubmit(e) {
  e.preventDefault();
  const id = parseInt(document.getElementById("editId").value, 10);
  const type = document.getElementById("editType").value;
  const item = {
    id,
    name: document.getElementById("editName").value.trim(),
    category: document.getElementById("editCategory").value,
    price: parseFloat(document.getElementById("editPrice").value) || 0,
    image: document.getElementById("editImage").value.trim(),
    description: document.getElementById("editDescription").value.trim(),
    tagline: document.getElementById("editTagline")
      ? document.getElementById("editTagline").value.trim()
      : "",
  };

  if (type === "game") {
    item.developer = document.getElementById("editDeveloper").value.trim();
    item.publisher = document.getElementById("editPublisher").value.trim();
    item.releaseDate = document.getElementById("editReleaseDate").value;
    item.platforms = (document.getElementById("editPlatforms").value || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    item.rating = parseFloat(document.getElementById("editRating").value) || 0;
    item.features = (document.getElementById("editFeatures").value || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    item.requirements = {
      minimum: parseKeyValueText(
        document.getElementById("editReqMin").value || ""
      ),
      recommended: parseKeyValueText(
        document.getElementById("editReqRec").value || ""
      ),
    };
    item.screenshots = (document.getElementById("editScreenshots").value || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  try {
    await ensureDbInitialized();
    if (type === "game") await window.gameDB.put("games", item);
    else await window.gameDB.put("products", item);
    showMessage("Updated successfully", "success");
    closeModal("editModal");
    await loadGames();
    await loadProducts();
    await refreshStats();
  } catch (e) {
    console.error("edit submit", e);
    showMessage("Error updating item", "error");
  }
}

function showConfirmModal(title, message, onConfirm) {
  const msg = document.getElementById("confirmMessage");
  if (msg) msg.textContent = message;
  openModal("confirmModal");
  const confirmButton = document.getElementById("confirmButton");
  const newBtn = confirmButton.cloneNode(true);
  confirmButton.parentNode.replaceChild(newBtn, confirmButton);
  newBtn.addEventListener("click", () => {
    closeModal("confirmModal");
    onConfirm();
  });
}

async function deleteGame(id) {
  showConfirmModal(
    "Delete Game",
    "Are you sure you want to delete this game? This action cannot be undone.",
    async () => {
      try {
        await ensureDbInitialized();
        await window.gameDB.delete("games", id);
        showMessage("Game deleted", "success");
        await loadGames();
        await refreshStats();
      } catch (e) {
        console.error("deleteGame", e);
        showMessage("Error deleting game", "error");
      }
    }
  );
}

async function deleteProduct(id) {
  showConfirmModal(
    "Delete Product",
    "Are you sure you want to delete this product? This action cannot be undone.",
    async () => {
      try {
        await ensureDbInitialized();
        await window.gameDB.delete("products", id);
        showMessage("Product deleted", "success");
        await loadProducts();
        await refreshStats();
      } catch (e) {
        console.error("deleteProduct", e);
        showMessage("Error deleting product", "error");
      }
    }
  );
}

function searchGames() {
  const term = (
    document.getElementById("gameSearch").value || ""
  ).toLowerCase();
  document.querySelectorAll("#gamesGrid .item-card").forEach((card) => {
    const name = (
      card.querySelector(".item-name")?.textContent || ""
    ).toLowerCase();
    const category = (
      card.querySelector(".item-category")?.textContent || ""
    ).toLowerCase();
    card.style.display =
      name.includes(term) || category.includes(term) ? "block" : "none";
  });
}

function searchProducts() {
  const term = (
    document.getElementById("productSearch").value || ""
  ).toLowerCase();
  document.querySelectorAll("#productsGrid .item-card").forEach((card) => {
    const name = (
      card.querySelector(".item-name")?.textContent || ""
    ).toLowerCase();
    const category = (
      card.querySelector(".item-category")?.textContent || ""
    ).toLowerCase();
    card.style.display =
      name.includes(term) || category.includes(term) ? "block" : "none";
  });
}

async function refreshStats() {
  try {
    await ensureDbInitialized();
    const games = await window.gameDB.getAll("games");
    const products = await window.gameDB.getAll("products");
    const gamesCount = games.length;
    const productsCount = products.length;
    document.getElementById("gamesCount").textContent = gamesCount;
    document.getElementById("productsCount").textContent = productsCount;
    document.getElementById("dbSize").textContent =
      Math.round(
        new Blob([JSON.stringify([...games, ...products])]).size / 1024
      ) + " KB";
  } catch (e) {
    console.error("refreshStats", e);
  }
}

async function exportData() {
  try {
    await ensureDbInitialized();
    const games = await window.gameDB.getAll("games");
    const products = await window.gameDB.getAll("products");
    const data = {
      games,
      products,
      exportDate: new Date().toISOString(),
      version: "1.0",
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `gamezoid-data-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    showMessage("Data exported", "success");
  } catch (e) {
    console.error("export", e);
    showMessage("Error exporting data", "error");
  }
}

async function clearDatabase() {
  showConfirmModal(
    "Clear Database",
    "Are you sure you want to clear all data? This will delete games and products.",
    async () => {
      try {
        await ensureDbInitialized();
        const games = await window.gameDB.getAll("games");
        for (const g of games) await window.gameDB.delete("games", g.id);
        const products = await window.gameDB.getAll("products");
        for (const p of products) await window.gameDB.delete("products", p.id);
        showMessage("Database cleared", "success");
        await loadGames();
        await loadProducts();
        await refreshStats();
      } catch (e) {
        console.error("clearDatabase", e);
        showMessage("Error clearing database", "error");
      }
    }
  );
}

async function populateDefaultData() {
  showConfirmModal(
    "Populate Default Data",
    "This will add default games and products from data/default-data.json. Continue?",
    async () => {
      try {
        if (window.storageAPI && typeof window.storageAPI.populateDefaultData === 'function') {
          await window.storageAPI.populateDefaultData();
        } else {
          throw new Error('Storage API not available');
        }
        showMessage("Default data populated", "success");
        await loadGames();
        await loadProducts();
        await refreshStats();
      } catch (e) {
        console.error("populateDefaultData", e);
        showMessage("Error populating default data", "error");
      }
    }
  );
}

function accountRoute() {
  const currentUser =
    sessionStorage.getItem("currentUser") ||
    localStorage.getItem("currentUser");
  if (currentUser) window.location.href = "./account.html";
  else window.location.href = "./login.html";
}

window.showTab = showTab;
window.showAddGameModal = showAddGameModal;
window.showAddProductModal = showAddProductModal;
window.openModal = openModal;
window.closeModal = closeModal;
window.editGame = editGame;
window.editProduct = editProduct;
window.deleteGame = deleteGame;
window.deleteProduct = deleteProduct;
window.searchGames = searchGames;
window.searchProducts = searchProducts;
window.populateDefaultData = populateDefaultData;
window.exportData = exportData;
window.clearDatabase = clearDatabase;
window.refreshStats = refreshStats;
window.accountRoute = accountRoute;

document.addEventListener("DOMContentLoaded", async () => {
  const addGameForm = document.getElementById("addGameForm");
  if (addGameForm) addGameForm.addEventListener("submit", onAddGame);
  const addProductForm = document.getElementById("addProductForm");
  if (addProductForm) addProductForm.addEventListener("submit", onAddProduct);
  const editForm = document.getElementById("editForm");
  if (editForm) editForm.addEventListener("submit", onEditSubmit);

  window.addEventListener("click", (ev) => {
    document.querySelectorAll(".modal").forEach((m) => {
      if (ev.target === m) m.style.display = "none";
    });
  });

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape")
      document.querySelectorAll(".modal").forEach((m) => {
        if (m.style.display === "block") m.style.display = "none";
      });
  });

  try {
    await ensureDbInitialized();
    await loadGames();
    await loadProducts();
    await refreshStats();
  } catch (e) {
    console.error("Admin init error", e);
  }
});
