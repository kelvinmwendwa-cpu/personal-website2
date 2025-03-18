require('dotenv').config();
require("dotenv").config(); // Load environment variables from .env file
const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

// Database connection pool using environment variables
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10
});

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads"); // Save files in the "uploads" folder
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName); // Ensure unique file names
  }
});
const upload = multer({ storage });

// Serve static files
app.use(express.static("public"));
app.use("/uploads", express.static("uploads")); // Serve uploaded images

// Log when the connection pool is established
console.log("Connection pool established");

// Handle GET request to the root URL
app.get("/", (req, res) => {
  res.send("<h1>Welcome to Kelvin's Server</h1><p>Upload pictures <a href='/test_form.html'>here</a>.</p>");
});

// Handle form submissions with image upload
app.post("/submit", upload.single("image"), (req, res) => {
  const { name, message } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  const sql = "INSERT INTO messages (name, message, image_path) VALUES (?, ?, ?)";
  db.query(sql, [name, message, imagePath], (err, result) => {
    if (err) {
      console.error("Error inserting data:", err.message);
      res.status(500).send("An error occurred while saving your data.");
      return;
    }
    res.send("Your message and image have been uploaded successfully!");
  });
});

// Fetch and display uploaded images with descriptions
app.get("/gallery", (req, res) => {
  const sql = "SELECT name, message, image_path FROM messages ORDER BY created_at DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching data:", err.message);
      res.status(500).send("An error occurred while retrieving the gallery.");
      return;
    }

    let galleryHTML = "<h1>Gallery</h1>";
    results.forEach(row => {
      galleryHTML += `
        <div>
          <h3>${row.name}</h3>
          <p>${row.message}</p>
          <img src="${row.image_path}" alt="${row.name}" style="max-width: 300px;"/>
        </div>
        <hr/>
      `;
    });
    res.send(galleryHTML);
  });
});

// Start the server
app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on http://0.0.0.0:3000");
});
