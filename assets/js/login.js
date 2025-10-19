function accountRoute() {
  const currentUser = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
  
  if (currentUser) {
    window.location.href = './account.html';
  } else {
    window.location.href = './login.html';
  }
}

let userDB;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    if (window.storageAPI && typeof window.storageAPI.init === 'function') await window.storageAPI.init();
    userDB = window.storageAPI;
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
        }
      } catch (error) {
        console.error('User already exists in IndexedDB:', user.email);
      }
    }
    
    if (existingUsers.length > 0) {
      localStorage.removeItem('users');
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
        }
      } catch (error) {
        console.error('Admin user already exists in IndexedDB');
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