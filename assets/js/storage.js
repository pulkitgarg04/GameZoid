(function () {
  const db = "gamezoidDB";

  function safeParse(v, fallback) {
    try {
      return JSON.parse(v);
    } catch (e) {
      return fallback;
    }
  }

  const defaults = {
    games: [],
    products: [],
    users: [],
    wishlist: [],
  };

  const storageAPI = {
    async init() {
      const raw = localStorage.getItem(db);

      if (!raw) {
        localStorage.setItem(db, JSON.stringify(defaults));
      } else {
        const parsed = safeParse(raw, null);

        if (!parsed || typeof parsed !== "object") {
          localStorage.setItem(db, JSON.stringify(defaults));
        } else {
          const merged = Object.assign({}, defaults, parsed);
          localStorage.setItem(db, JSON.stringify(merged));
        }
      }

      return Promise.resolve();
    },

    readDataFromDB() {
      return safeParse(
        localStorage.getItem(db),
        JSON.parse(JSON.stringify(defaults))
      );
    },


    writeToDB(obj) {
      localStorage.setItem(db, JSON.stringify(obj));
    },

    async getAll(storeName) {
      const db = this.readDataFromDB();
      return Array.isArray(db[storeName])
        ? JSON.parse(JSON.stringify(db[storeName]))
        : [];
    },

    async getById(storeName, id) {
      const db = this.readDataFromDB();
      const arr = Array.isArray(db[storeName]) ? db[storeName] : [];
      const found = arr.find((x) => String(x.id) === String(id));
      return found ? JSON.parse(JSON.stringify(found)) : null;
    },

    nextID(arr) {
      if (!Array.isArray(arr) || arr.length === 0) return 1;

      const max = arr.reduce(
        (m, it) =>
          typeof it.id !== "undefined" && Number(it.id) > m ? Number(it.id) : m,
        0
      );

      return max + 1;
    },

    async add(storeName, item) {
      const db = this.readDataFromDB();
      db[storeName] = Array.isArray(db[storeName]) ? db[storeName] : [];

      const copy = Object.assign({}, item);

      if (typeof copy.id === "undefined" || copy.id === null) {
        copy.id = this.nextID(db[storeName]);
      }

      db[storeName].push(copy);
      this.writeToDB(db);

      return copy.id;
    },


    async put(storeName, item) {
      const db = this.readDataFromDB();
      db[storeName] = Array.isArray(db[storeName]) ? db[storeName] : [];

      const idx = db[storeName].findIndex(
        (x) => String(x.id) === String(item.id)
      );

      if (idx === -1) {
        db[storeName].push(item);
      } else {
        db[storeName][idx] = item;
      }

      this.writeToDB(db);
      return item.id;
    },


    async delete(storeName, id) {
      const db = this.readDataFromDB();
      db[storeName] = Array.isArray(db[storeName]) ? db[storeName] : [];

      db[storeName] = db[storeName].filter((x) => String(x.id) !== String(id));

      this.writeToDB(db);
      return true;
    },


    async getUserByEmail(email) {
      if (!email) return null;

      const users = await this.getAll("users");

      return (
        users.find(
          (u) => String(u.email).toLowerCase() === String(email).toLowerCase()
        ) || null
      );
    },


    async addUser(user) {
      if (!user || !user.email) throw new Error("Invalid user");

      const existing = await this.getUserByEmail(user.email);
      if (existing) throw new Error("ConstraintError");

      const db = this.readDataFromDB();
      db.users = Array.isArray(db.users) ? db.users : [];

      const copy = Object.assign({}, user, {
        email: String(user.email).toLowerCase(),
      });

      db.users.push(copy);
      this.writeToDB(db);

      return copy.email;
    },


    async getUserWishlist(userEmail) {
      const wl = await this.getAll("wishlist");

      return wl.filter(
        (i) =>
          String(i.userEmail).toLowerCase() === String(userEmail).toLowerCase()
      );
    },


    async addToWishlist(item) {
      return this.add("wishlist", item);
    },


    async checkWishlistItem(userEmail, productOrGameId) {
      const wl = await this.getAll("wishlist");

      return wl.some(
        (i) =>
          String(i.userEmail).toLowerCase() ===
            String(userEmail).toLowerCase() &&
          String(i.productId || i.gameId) === String(productOrGameId)
      );
    },


    async removeFromWishlist(wishlistId) {
      return this.delete("wishlist", wishlistId);
    },


    async removeFromWishlistByGameId(userEmail, gameId) {
      const wl = await this.getAll("wishlist");

      const match = wl.find(
        (i) =>
          String(i.userEmail).toLowerCase() ===
            String(userEmail).toLowerCase() &&
          String(i.gameId) === String(gameId)
      );

      if (match) return this.delete("wishlist", match.id);
      return false;
    },


    async populateDefaultData() {
      const candidates = [
        "/data/default-data.json",
        "./data/default-data.json",
        "../data/default-data.json",
        "assets/data/default-data.json",
        "./assets/data/default-data.json",
        "../assets/data/default-data.json",
      ];

      let data = null;

      for (const p of candidates) {
        try {
          const resp = await fetch(p);
          if (!resp.ok) continue;
          data = await resp.json();
          break;
        } catch (e) {
          continue;
        }
      }

      if (!data) throw new Error("Default data not found");

      const games = Array.isArray(data.games) ? data.games : [];
      const products = Array.isArray(data.products) ? data.products : [];

      for (const g of games) {
        try {
          await this.add("games", g);
        } catch (e) {
          continue;
        }
      }

      for (const p of products) {
        try {
          await this.add("products", p);
        } catch (e) {
          continue;
        }
      }

      return true;
    },


    async exportData() {
      const games = await this.getAll("games");
      const products = await this.getAll("products");

      return {
        games,
        products,
        exportDate: new Date().toISOString(),
        version: "1.0",
      };
    },


    async clearDatabase() {
      const db = this.readDataFromDB();

      db.games = [];
      db.products = [];
      db.wishlist = [];
      db.users = [];

      this.writeToDB(db);
      return true;
    },

  };


  window.storageAPI = storageAPI;
  window.gameDB = storageAPI;

})();
