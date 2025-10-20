function accountRoute() {
  const currentUser = sessionStorage.getItem('currentUser');
  if (currentUser) {
    window.location.href = './account.html';
    return;
  }

  window.location.href = './login.html';
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

async function signupUser(event) {
  event.preventDefault();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (!name || !email || !password || !confirmPassword) {
    alert('Please fill in all fields');
    return;
  }

  if (password !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }

  if (password.length < 6) {
    alert('Password must be at least 6 characters long');
    return;
  }

  try {
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      alert('Email already registered. Please use a different email or try logging in.');
      return;
    }

    const newUser = {
      name,
      email,
      password,
      isAdmin: false,
      createdAt: new Date().toISOString()
    };

    addUser(newUser);
    
    alert('Account created successfully! Please log in.');

    window.location.href = './login.html';
  } catch (error) {
    console.error('Signup error:', error);
    alert('An error occurred during registration. Please try again.');
  }
}