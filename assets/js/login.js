function accountRoute() {
  const currentUser = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
  
  if (currentUser) {
    window.location.href = './account.html';
  } else {
    window.location.href = './login.html';
  }
}

class UserDatabase {
  constructor() {
    this.dbName = 'GameZoidUserDB';
    this.dbVersion = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('User database failed to open');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('User database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('users')) {
          const usersStore = db.createObjectStore('users', { keyPath: 'email' });
          usersStore.createIndex('name', 'name', { unique: false });
        }

        if (!db.objectStoreNames.contains('wishlist')) {
          const wishlistStore = db.createObjectStore('wishlist', { keyPath: 'id', autoIncrement: true });
          wishlistStore.createIndex('userEmail', 'userEmail', { unique: false });
          wishlistStore.createIndex('gameId', 'gameId', { unique: false });
        }
      };
    });
  }

  async getUserByEmail(email) {
    const transaction = this.db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    return new Promise((resolve, reject) => {
      const request = store.get(email);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async addUser(user) {
    const transaction = this.db.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    return new Promise((resolve, reject) => {
      const request = store.add(user);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

let userDB;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    userDB = new UserDatabase();
    await userDB.init();
    console.log('User database initialized for login');
    
    await migrateUsers();
  } catch (error) {
    console.error('Failed to initialize user database:', error);
  }
});

async function migrateUsers() {
  try {
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    for (const user of existingUsers) {
      try {
        const existingUser = await userDB.getUserByEmail(user.email.toLowerCase());
        if (!existingUser) {
          await userDB.addUser({
            ...user,
            email: user.email.toLowerCase(),
            createdAt: new Date().toISOString()
          });
          console.log('Migrated user to IndexedDB:', user.email);
        }
      } catch (error) {
        console.log('User already exists in IndexedDB:', user.email);
      }
    }
    
    if (existingUsers.length > 0) {
      localStorage.removeItem('users');
      console.log('Cleared localStorage users after migration');
    }
  } catch (error) {
    console.error('Error migrating users:', error);
  }
}

document.querySelectorAll('.password-toggle-icon').forEach(icon => {
  icon.addEventListener('click', function () {
    const passwordInput = this.previousElementSibling;
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      this.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
      passwordInput.type = 'password';
      this.innerHTML = '<i class="fas fa-eye"></i>';
    }
  });
});

async function loginUser(event) {
  event.preventDefault();
  
  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;
  
  const adminEmail = 'admin@gamezoid.com';
  const adminPass = 'admin123';
  
  try {
    let user = null;
    
    if (email === adminEmail && password === adminPass) {
      user = { 
        name: 'Administrator', 
        email: adminEmail, 
        password: adminPass, 
        isAdmin: true,
        createdAt: new Date().toISOString()
      };
      
      try {
        const existingAdmin = await userDB.getUserByEmail(adminEmail);
        if (!existingAdmin) {
          await userDB.addUser(user);
          console.log('Admin user added to IndexedDB');
        }
      } catch (error) {
        console.log('Admin user already exists in IndexedDB');
      }
    } else {
      user = await userDB.getUserByEmail(email);
    }
    
    if (!user) {
      alert('No user found with this email address');
      return;
    }
    
    if (user.password !== password) {
      alert('Incorrect password');
      return;
    }
    
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    
    localStorage.removeItem('currentUser');

    console.log('User logged in successfully:', user.name);
    if (user.isAdmin) {
      window.location.href = './admin.html';
    } else {
      window.location.href = './account.html';
    }
    
  } catch (error) {
    console.error('Login error:', error);
    alert('An error occurred during login. Please try again.');
  }
}