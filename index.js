const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const cors = require("cors");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const session = require('express-session');

const app = express();
const port = 3000;

// EJS view engine ayarını ekleyin
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // EJS dosyalarınızın bulunduğu klasör

// Dosya yolları
const usersFilePath = path.join(__dirname, "users.json");
const reviewsFilePath = path.join(__dirname, "reviews.json");
const commentsFilePath = path.join(__dirname, "comments.json");

// Global değişkenler
let users = [];
let reviews = [];
let comments = [];

app.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  })
);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));
app.use(bodyParser.urlencoded({ extended: true })); // Form verilerini işleyebilmek için

// Session middleware'i ekleyin
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // HTTPS kullanılıyorsa true olarak ayarlayın
}));

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: "djgevocmm",
  api_key: "264777488666317",
  api_secret: "rGM5kJRp3LwGjOeGiZElJRMLVio",
});

// Set up Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "book-reviews", // Folder name on Cloudinary
    allowed_formats: ["jpg", "jpeg", "png"], // Allowed file types
  },
});

const upload = multer({ storage: storage });

// Load reviews from the JSON file on server start
fs.readFile(reviewsFilePath, (err, data) => {
  if (err) {
    console.error("Could not read reviews file:", err);
    reviews = [];
    // İlk kez çalıştırılıyorsa boş bir reviews.json dosyası oluştur
    saveReviews();
  } else {
    try {
      reviews = JSON.parse(data);
    } catch (e) {
      console.error("Error parsing reviews JSON:", e);
      reviews = [];
    }
  }
});

// Yorumları JSON dosyasından yükle
fs.readFile(commentsFilePath, (err, data) => {
  if (err) {
    console.error("Could not read comments file:", err);
    comments = [];
    // İlk kez çalıştırılıyorsa boş bir comments.json dosyası oluştur
    saveComments();
  } else {
    try {
      comments = JSON.parse(data);
    } catch (e) {
      console.error("Error parsing comments JSON:", e);
      comments = [];
    }
  }
});

// Kullanıcıları JSON dosyasından yükle
fs.readFile(usersFilePath, (err, data) => {
  if (err) {
    console.error("Could not read users file:", err);
    users = [
      {
        id: 1,
        username: "admin",
        email: "admin@example.com",
        password: "admin123",
        isAdmin: true
      }
    ];
    // İlk kez çalıştırılıyorsa varsayılan admin ile birlikte users.json dosyası oluştur
    saveUsers();
  } else {
    try {
      users = JSON.parse(data);
    } catch (e) {
      console.error("Error parsing users JSON:", e);
      users = [
        {
          id: 1,
          username: "admin",
          email: "admin@example.com",
          password: "admin123",
          isAdmin: true
        }
      ];
      saveUsers();
    }
  }
});

// Veri kaydetme fonksiyonları
function saveReviews() {
  fs.writeFile(reviewsFilePath, JSON.stringify(reviews, null, 2), (err) => {
    if (err) {
      console.error("Could not save reviews:", err);
    }
  });
}

function saveComments() {
  fs.writeFile(commentsFilePath, JSON.stringify(comments, null, 2), (err) => {
    if (err) {
      console.error("Could not save comments:", err);
    }
  });
}

function saveUsers() {
  fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), (err) => {
    if (err) {
      console.error("Could not save users:", err);
    }
  });
}

// Middleware: Kullanıcı giriş kontrolü
function checkAuthentication(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.status(401).json({ error: "Authentication required" });
}

// Middleware: Admin kontrolü
function checkAdmin(req, res, next) {
  if (req.session.user && req.session.user.isAdmin) {
    return next();
  }
  res.status(403).json({ error: "Admin rights required" });
}

// Ana sayfa yönlendirmesi
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Review.ejs sayfası için rota tanımlama
app.get('/review', (req, res) => {
  const reviewId = parseInt(req.query.id);
  if (!reviewId) {
    return res.status(400).send('Review ID is required');
  }
  
  // reviews.json dosyasından inceleme verilerini al
  const review = reviews.find(r => r.id === reviewId);
  
  if (!review) {
    return res.status(404).send('Review not found');
  }
  
  // Bu incelemeye ait yorumları bul
  const reviewComments = comments.filter(c => c.reviewId === reviewId);
  
  // review.ejs şablonuna verileri gönder
  res.render('review', { 
    review: review,
    comments: reviewComments 
  });
});

// Yorum ekleme endpoint'i
app.post('/comments', (req, res) => {
  const { username, comment, reviewId } = req.body;
  
  // Gerekli alanları kontrol et
  if (!username || !comment || !reviewId) {
    return res.status(400).send('Username, comment and reviewId are required');
  }
  
  // Yeni yorumu oluştur
  const newComment = {
    id: Date.now(),
    reviewId: parseInt(reviewId),
    username,
    comment,
    date: new Date().toISOString()
  };
  
  // Yorumu kaydet
  comments.push(newComment);
  saveComments();
  
  // Yönlendirme yap
  res.redirect(`/review?id=${reviewId}`);
});

// Kullanıcı kaydı endpoint'i
app.post("/register", (req, res) => {
  const { username, email, password } = req.body;
  
  // Gerekli alanları kontrol et
  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }
  
  // Kullanıcı adı veya e-posta zaten kullanılıyor mu kontrol et
  if (users.some(user => user.username === username)) {
    return res.status(400).json({ error: "Username already exists" });
  }
  
  if (users.some(user => user.email === email)) {
    return res.status(400).json({ error: "Email already exists" });
  }
  
  // Yeni kullanıcı oluştur
  const newUser = {
    id: Date.now(),
    username,
    email,
    password, // Gerçek uygulamalarda şifre hashlenir
    isAdmin: false
  };
  
  // Kullanıcıyı kaydet
  users.push(newUser);
  saveUsers();
  
  // Kullanıcı bilgilerini döndür (şifre hariç)
  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

// Kullanıcı girişi endpoint'i
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  
  // Kullanıcıyı bul
  const user = users.find(user => user.username === username && user.password === password);
  
  if (!user) {
    return res.status(401).json({ error: "Invalid username or password" });
  }
  
  // Session'da kullanıcı bilgilerini sakla (şifre hariç)
  const { password: _, ...userWithoutPassword } = user;
  req.session.user = userWithoutPassword;
  
  res.json(userWithoutPassword);
});

// Kullanıcı çıkışı endpoint'i
app.post("/logout", (req, res) => {
  req.session.destroy();
  res.json({ message: "Logged out successfully" });
});

// Mevcut kullanıcı bilgilerini getir
app.get("/current-user", (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

// Get all reviews
app.get("/reviews", (req, res) => {
  res.json(reviews);
});

// İnceleme ekleme endpoint'i (sadece giriş yapmış kullanıcılar için)
app.post(
  "/reviews", 
  checkAuthentication,
  upload.fields([{ name: "cover" }, { name: "fullImage" }]),
  (req, res) => {
    const { title, author, review } = req.body;
    const reviewId = Date.now();

    const reviewData = {
      id: reviewId,
      title,
      author,
      review,
      userId: req.session.user.id,
      username: req.session.user.username,
      cover: req.files["cover"] ? req.files["cover"][0].path : null,
      fullImage: req.files["fullImage"] ? req.files["fullImage"][0].path : null,
    };

    reviews.push(reviewData);
    saveReviews();
    res.status(201).send("Review saved");
  }
);

// Update review
app.put(
  "/reviews/:id",
  checkAuthentication,
  upload.fields([{ name: "cover" }, { name: "fullImage" }]),
  (req, res) => {
    const reviewId = parseInt(req.params.id);
    const reviewIndex = reviews.findIndex((review) => review.id === reviewId);

    if (reviewIndex !== -1) {
      // Check if user is admin or the owner of the review
      if (!req.session.user.isAdmin && reviews[reviewIndex].userId !== req.session.user.id) {
        return res.status(403).json({ error: "You don't have permission to edit this review" });
      }

      const { title, author, review } = req.body;

      const updatedReview = {
        ...reviews[reviewIndex],
        title,
        author,
        review,
        cover: req.files["cover"]
          ? req.files["cover"][0].path
          : reviews[reviewIndex].cover,
        fullImage: req.files["fullImage"]
          ? req.files["fullImage"][0].path
          : reviews[reviewIndex].fullImage,
      };

      reviews[reviewIndex] = updatedReview;
      saveReviews();
      res.send("Review updated");
    } else {
      res.status(404).send("Review not found");
    }
  }
);

// İnceleme silme endpoint'i (sadece admin için)
app.delete("/reviews/:id", checkAdmin, (req, res) => {
  const reviewId = parseInt(req.params.id);
  reviews = reviews.filter((review) => review.id !== reviewId);
  comments = comments.filter((comment) => comment.reviewId !== reviewId);
  saveReviews();
  saveComments();
  res.send("Review deleted");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});