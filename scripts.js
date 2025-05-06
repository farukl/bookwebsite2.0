document.addEventListener("DOMContentLoaded", () => {
  // Fetch and display reviews on the home page
  if (
    window.location.pathname.endsWith("index.html") ||
    window.location.pathname === "/" ||
    window.location.pathname === ""
  ) {
    fetchReviews();
  }

  // Handle review form submission
  const reviewForm = document.getElementById("reviewForm");
  if (reviewForm) {
    const urlParams = new URLSearchParams(window.location.search);
    const reviewId = urlParams.get("id");

    if (reviewId) {
      // We're in edit mode
      populateForm(reviewId);
      document.getElementById("submitButton").style.display = "none";
      document.getElementById("updateButton").style.display = "block";
      document
        .getElementById("updateButton")
        .addEventListener("click", handleReviewUpdate);
    } else {
      // We're in create mode
      reviewForm.addEventListener("submit", handleReviewFormSubmit);
    }
  }

  // Handle search input
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", handleSearchInput);
  }
});

async function fetchReviews() {
  const response = await fetch("/reviews");
  const reviews = await response.json();
  displayReviews(reviews);
}

function displayReviews(reviews) {
  const reviewGrid = document.getElementById("reviewGrid");
  if (!reviewGrid) return; // Exit if we're not on the reviews page
  
  reviewGrid.innerHTML = ""; // Clear existing reviews
  reviews.forEach((review) => {
    const tile = document.createElement("div");
    tile.className = "review-tile";
    tile.innerHTML = `
            <img src="${review.cover || "default-cover.jpg"}" alt="${
      review.title
    }" onerror="this.onerror=null;this.src='default-cover.jpg';">
            <h3>${review.title}</h3>
        `;
    tile.addEventListener("click", () => {
      // EJS yönlendirmesi
      window.location.href = `/review?id=${review.id}`;
    });
    reviewGrid.appendChild(tile);
  });
}

async function populateForm(reviewId) {
  const response = await fetch(`/reviews`);
  const reviews = await response.json();
  const review = reviews.find((review) => review.id === parseInt(reviewId));

  if (review) {
    document.getElementById("reviewId").value = review.id;
    document.getElementById("title").value = review.title;
    document.getElementById("author").value = review.author;
    document.getElementById("review").value = review.review;
    // Note: You might want to preload the images here if needed
  } else {
    console.error("Review not found for ID:", reviewId);
  }
}

async function handleReviewUpdate(event) {
  event.preventDefault();
  const reviewId = parseInt(document.getElementById("reviewId").value);
  const title = document.getElementById("title").value;
  const author = document.getElementById("author").value;
  const reviewText = document.getElementById("review").value;
  const cover = document.getElementById("cover").files[0];
  const fullImage = document.getElementById("fullImage").files[0];

  const formData = new FormData();
  formData.append("title", title);
  formData.append("author", author);
  formData.append("review", reviewText);
  if (cover) {
    formData.append("cover", cover);
  }
  if (fullImage) {
    formData.append("fullImage", fullImage);
  }

  await fetch(`/reviews/${reviewId}`, {
    method: "PUT",
    body: formData,
  });
  alert("Review updated successfully!");
  window.location.href = "/";
}

async function handleReviewFormSubmit(event) {
  event.preventDefault();
  const title = document.getElementById("title").value;
  const author = document.getElementById("author").value;
  const review = document.getElementById("review").value;
  const cover = document.getElementById("cover").files[0];
  const fullImage = document.getElementById("fullImage").files[0];

  const formData = new FormData();
  formData.append("title", title);
  formData.append("author", author);
  formData.append("review", review);
  if (cover) {
    formData.append("cover", cover);
  }
  if (fullImage) {
    formData.append("fullImage", fullImage);
  }

  await fetch("/reviews", {
    method: "POST",
    body: formData,
  });

  window.location.href = "/";
}

let debounceTimer;

async function handleSearchInput(event) {
  const query = event.target.value.toLowerCase();

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    const response = await fetch("/reviews");
    const reviews = await response.json();
    const filteredReviews = reviews.filter((review) =>
      review.title.toLowerCase().includes(query)
    );
    displayReviews(filteredReviews);
  }, 300); // Adjust the delay (300ms) as necessary
}

// Artık bu fonksiyonlar EJS şablonundaki onclick özelliklerinde çağrılıyor
function editReview(id) {
  window.location.href = `/form.html?id=${id}`;
}

function deleteReview(id) {
  if (confirm("Are you sure you want to delete this review?")) {
    fetch(`/reviews/${id}`, {
      method: "DELETE",
    }).then(() => {
      window.location.href = "/";
    });
  }
}

// Var olan scripts.js dosyasının sonuna eklenecek kısım:

// Kullanıcı giriş ve kayıt işlemleri

async function handleLogin() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const errorElement = document.getElementById('login-error');
  
  // Validate input
  if (!username || !password) {
    errorElement.textContent = "Please fill in all fields";
    errorElement.style.display = "block";
    return;
  }
  
  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      errorElement.textContent = data.error || "Login failed";
      errorElement.style.display = "block";
      return;
    }
    
    // Login success
    localStorage.setItem('user', JSON.stringify(data));
    window.location.href = '/';
  } catch (error) {
    errorElement.textContent = "An error occurred. Please try again.";
    errorElement.style.display = "block";
    console.error('Login error:', error);
  }
}

async function handleRegister() {
  const username = document.getElementById('register-username').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm-password').value;
  const errorElement = document.getElementById('register-error');
  
  // Validate input
  if (!username || !email || !password || !confirmPassword) {
    errorElement.textContent = "Please fill in all fields";
    errorElement.style.display = "block";
    return;
  }
  
  if (password !== confirmPassword) {
    errorElement.textContent = "Passwords do not match";
    errorElement.style.display = "block";
    return;
  }
  
  try {
    const response = await fetch('/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      errorElement.textContent = data.error || "Registration failed";
      errorElement.style.display = "block";
      return;
    }
    
    // Registration success - automatically log in
    alert('Registration successful! You can now log in.');
    
    // Switch to login tab
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.querySelector('.auth-tab[data-tab="login"]').classList.add('active');
    document.getElementById('login-form').classList.add('active');
    
    // Pre-fill login form
    document.getElementById('login-username').value = username;
  } catch (error) {
    errorElement.textContent = "An error occurred. Please try again.";
    errorElement.style.display = "block";
    console.error('Registration error:', error);
  }
}

async function handleLogout() {
  try {
    await fetch('/logout', {
      method: 'POST'
    });
    localStorage.removeItem('user');
    window.location.href = '/';
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Kullanıcı durumunu kontrol et ve UI'ı güncelle
function updateAuthUI() {
  const navElement = document.querySelector('nav ul');
  if (!navElement) return;
  
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  // Var olan login/logout linklerini temizle
  const existingAuthLinks = document.querySelectorAll('.auth-link');
  existingAuthLinks.forEach(link => link.remove());
  
  if (user) {
    // Kullanıcı giriş yapmış
    const userElement = document.createElement('li');
    userElement.className = 'auth-link';
    userElement.innerHTML = `<span>Hello, ${user.username}</span>`;
    navElement.appendChild(userElement);
    
    const logoutElement = document.createElement('li');
    logoutElement.className = 'auth-link';
    const logoutLink = document.createElement('a');
    logoutLink.href = '#';
    logoutLink.textContent = 'Logout';
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });
    logoutElement.appendChild(logoutLink);
    navElement.appendChild(logoutElement);
  } else {
    // Kullanıcı giriş yapmamış
    const loginElement = document.createElement('li');
    loginElement.className = 'auth-link';
    const loginLink = document.createElement('a');
    loginLink.href = '/auth.html';
    loginLink.textContent = 'Login / Register';
    loginElement.appendChild(loginLink);
    navElement.appendChild(loginElement);
  }
  
  // İnceleme ekleme butonunu kontrol et
  const reviewFormLink = document.querySelector('a[href="form.html"]');
  if (reviewFormLink) {
    reviewFormLink.parentElement.style.display = user ? 'block' : 'none';
  }
  
  // Silme butonlarını kontrol et (sadece admin için göster)
  if (user && user.isAdmin) {
    const deleteButtons = document.querySelectorAll('button[onclick^="deleteReview"]');
    deleteButtons.forEach(button => {
      button.style.display = 'inline-block';
    });
  } else {
    const deleteButtons = document.querySelectorAll('button[onclick^="deleteReview"]');
    deleteButtons.forEach(button => {
      button.style.display = 'none';
    });
  }
}

// Sayfa yüklendiğinde UI'ı güncelle
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  
  // Önceden var olan kodlar burada kalacak
});