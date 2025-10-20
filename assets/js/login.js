function accountRoute() {
  const currentUser = sessionStorage.getItem('currentUser');

  if (currentUser) {
    window.location.href = './account.html';
  } else {
    window.location.href = './login.html';
  }
}

function getUsers() {
  try {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
  } catch (e) {
    console.log('Error parsing users from localStorage:', e);
    return [];
  }
}

function saveUsers(users) {
  try {
    localStorage.setItem('users', JSON.stringify(users));
  } catch (e) {
    console.log('Error saving users to localStorage:', e);
  }
}

function findUserByEmail(email) {
  if (!email) {
    return null;
  }

  const users = getUsers();
  return users.find(u => String(u.email).toLowerCase() === String(email).toLowerCase()) || null;
}

function addUser(user) {
  if (!user || !user.email) {
    return null;
  }

  const users = getUsers();
  user.email = String(user.email).toLowerCase();
  users.push(user);

  saveUsers(users);

  return user;
}

if (!localStorage.getItem('users')) {
  saveUsers([]);
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
      user = findUserByEmail(adminEmail);

      if (!user) {
        user = addUser({
          name: 'Administrator',
          email: adminEmail,
          password: adminPass,
          isAdmin: true,
          createdAt: new Date().toISOString()
        });
      }
    } else {
      user = findUserByEmail(email);
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