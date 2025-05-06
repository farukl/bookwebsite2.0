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
  
  // Initialize auth-related UI
  initializeAuth();
  updateAuthUI();
});

// Initialize auth-related event listeners
function initializeAuth() {
  // Set up auth tabs
  const authTabs = document.querySelectorAll('.auth-tab');
  if (authTabs.length > 0) {
    authTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs and forms
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding form
        tab.classList.add('active');
        const formId = `${tab.dataset.tab}-form`;
        document.getElementById(formId).classList.add('active');
      });
    });
    
    // Set up login button
    const loginButton = document.getElementById('login-button');
    if (loginButton) {
      loginButton.addEventListener('click', handleLogin);
    }
    
    // Set up register button
    const registerButton = document.getElementById('register-button');
    if (registerButton) {
      registerButton.addEventListener('click', handleRegister);
    }
  }
}

async function fetchReviews() {
  try {
    const response = await fetch("/reviews");
    const reviews = await response.json();
    displayReviews(reviews);
  } catch(error) {
    console.error("Error fetching reviews:", error);
  }
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
      window.location.href = `/review?id=${review.id}`;
    });
    reviewGrid.appendChild(tile);
  });
}

async function populateForm(reviewId) {
  try {
    const response = await fetch(`/reviews`);
    const reviews = await response.json();
    const review = reviews.find((review) => review.id === parseInt(reviewId));

    if (review) {
      document.getElementById("reviewId").value = review.id;
      document.getElementById("title").value = review.title;
      document.getElementById("author").value = review.author;
      document.getElementById("review").value = review.review;
      // Note: We can't preload the images due to security restrictions
    } else {
      console.error("Review not found for ID:", reviewId);
    }
  } catch(error) {
    console.error("Error populating form:", error);
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

  try {
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

    const response = await fetch(`/reviews/${reviewId}`, {
      method: "PUT",
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update review");
    }
    
    alert("Review updated successfully!");
    window.location.href = "/";
  } catch(error) {
    alert("Error updating review: " + error.message);
    console.error("Error updating review:", error);
  }
}

async function handleReviewFormSubmit(event) {
  event.preventDefault();
  const title = document.getElementById("title").value;
  const author = document.getElementById("author").value;
  const review = document.getElementById("review").value;
  const cover = document.getElementById("cover").files[0];
  const fullImage = document.getElementById("fullImage").files[0];

  try {
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

    const response = await fetch("/reviews", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to submit review");
    }

    window.location.href = "/";
  } catch(error) {
    alert("Error submitting review: " + error.message);
    console.error("Error submitting review:", error);
  }
}

let debounceTimer;

async function handleSearchInput(event) {
  const query = event.target.value.toLowerCase();

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    try {
      const response = await fetch("/reviews");
      const reviews = await response.json();
      const filteredReviews = reviews.filter((review) =>
        review.title.toLowerCase().includes(query)
      );
      displayReviews(filteredReviews);
    } catch(error) {
      console.error("Error searching reviews:", error);
    }
  }, 300); // Adjust the delay (300ms) as necessary
}

function editReview(id) {
  window.location.href = `/form.html?id=${id}`;
}

async function deleteReview(id) {
  if (confirm("Are you sure you want to delete this review?")) {
    try {
      const response = await fetch(`/reviews/${id}`, {
        method: "DELETE",
        credentials: 'include' // Important for session-based auth
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete review");
      }
      
      window.location.href = "/";
    } catch(error) {
      alert("Error deleting review: " + error.message);
      console.error("Error deleting review:", error);
    }
  }
}

// Auth functions
async function handleLogin() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const errorElement = document.getElementById('login-error');
  
  // Clear previous error
  errorElement.textContent = "";
  errorElement.style.display = "none";
  
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
      body: JSON.stringify({ username, password }),
      credentials: 'include' // Important for session cookies
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      errorElement.textContent = data.error || "Login failed";
      errorElement.style.display = "block";
      return;
    }
    
    // Login success - store minimal user info in localStorage
    localStorage.setItem('user', JSON.stringify({
      id: data.id,
      username: data.username,
      isAdmin: data.isAdmin
    }));
    
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
  
  // Clear previous error
  errorElement.textContent = "";
  errorElement.style.display = "none";
  
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
      body: JSON.stringify({ username, email, password }),
      credentials: 'include' // Important for session cookies
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      errorElement.textContent = data.error || "Registration failed";
      errorElement.style.display = "block";
      return;
    }
    
    // Registration success
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
    const response = await fetch('/logout', {
      method: 'POST',
      credentials: 'include' // Important for session cookies
    });
    
    if (!response.ok) {
      throw new Error('Logout failed');
    }
    
    localStorage.removeItem('user');
    window.location.href = '/';
  } catch (error) {
    console.error('Logout error:', error);
    alert('Error logging out. Please try again.');
  }
}

// Check user authentication status
async function checkAuthStatus() {
  try {
    const response = await fetch('/current-user', {
      credentials: 'include' // Important for session cookies
    });
    
    if (response.ok) {
      const userData = await response.json();
      // Update localStorage with the latest session data
      localStorage.setItem('user', JSON.stringify({
        id: userData.id,
        username: userData.username,
        isAdmin: userData.isAdmin
      }));
    } else {
      // If not authenticated on server, clear local storage
      localStorage.removeItem('user');
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
  }
  
  // Update UI based on current auth state
  updateAuthUI();
}

// Update UI based on authentication status
function updateAuthUI() {
  const navElement = document.querySelector('nav ul');
  if (!navElement) return;
  
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  // Remove existing auth links
  const existingAuthLinks = document.querySelectorAll('.auth-link');
  existingAuthLinks.forEach(link => link.remove());
  
  if (user) {
    // User is logged in
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
    
    // Show review submission link for logged-in users
    const reviewFormLinkElement = document.querySelector('a[href="form.html"]');
    if (reviewFormLinkElement && reviewFormLinkElement.parentElement) {
      reviewFormLinkElement.parentElement.style.display = 'block';
    }
    
    // Show edit/delete buttons on review page for admin or review owner
    if (window.location.pathname.includes('review')) {
      const editButton = document.querySelector('button[onclick^="editReview"]');
      const deleteButton = document.querySelector('button[onclick^="deleteReview"]');
      
      // Get the review ID from the URL
      const urlParams = new URLSearchParams(window.location.search);
      const reviewId = parseInt(urlParams.get('id'));
      
      // Fetch the review to check ownership
      fetch(`/reviews`)
        .then(response => response.json())
        .then(reviews => {
          const review = reviews.find(r => r.id === reviewId);
          
          if (review) {
            // Show edit button if admin or owner
            if (editButton) {
              if (user.isAdmin || review.userId === user.id) {
                editButton.style.display = 'inline-block';
              } else {
                editButton.style.display = 'none';
              }
            }
            
            // Show delete button only for admin
            if (deleteButton) {
              deleteButton.style.display = user.isAdmin ? 'inline-block' : 'none';
            }
          }
        })
        .catch(error => console.error('Error fetching review for permission check:', error));
    }
  } else {
    // User is not logged in
    const loginElement = document.createElement('li');
    loginElement.className = 'auth-link';
    const loginLink = document.createElement('a');
    loginLink.href = '/auth.html';
    loginLink.textContent = 'Login / Register';
    loginElement.appendChild(loginLink);
    navElement.appendChild(loginElement);
    
    // Hide review submission link for non-logged-in users
    const reviewFormLinkElement = document.querySelector('a[href="form.html"]');
    if (reviewFormLinkElement && reviewFormLinkElement.parentElement) {
      reviewFormLinkElement.parentElement.style.display = 'none';
    }
    
    // Hide edit/delete buttons on review page
    if (window.location.pathname.includes('review')) {
      const editButton = document.querySelector('button[onclick^="editReview"]');
      const deleteButton = document.querySelector('button[onclick^="deleteReview"]');
      
      if (editButton) editButton.style.display = 'none';
      if (deleteButton) deleteButton.style.display = 'none';
    }
  }
}

// Check auth status when page loads
checkAuthStatus();
