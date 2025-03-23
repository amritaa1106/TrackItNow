const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fetch = require('node-fetch');

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const JSON_SERVER_URL = "http://localhost:5000"; // JSON Server URL

// Middleware for authentication (if needed)
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'Access Denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid Token' });
  }
};

// User Registration (Fake API Call)
app.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { name, email, password: hashedPassword, role };

    const response = await fetch(`${JSON_SERVER_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });

    if (!response.ok) throw new Error("Failed to register user");

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error registering user', error: err.message });
  }
});

// User Login (Fake API Call)
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const response = await fetch(`${JSON_SERVER_URL}/users`);
    const users = await response.json();
    
    const user = users.find(user => user.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get Products (Uses JSON Server)
app.get('/products', async (req, res) => {
  try {
    const response = await fetch(`${JSON_SERVER_URL}/products`);
    const products = await response.json();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching products', error: err.message });
  }
});

// Add Product
app.post('/products', async (req, res) => {
  const { name, sku, quantity, price, supplier } = req.body;
  try {
    const newProduct = { name, sku, quantity, price, supplier };

    const response = await fetch(`${JSON_SERVER_URL}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProduct),
    });

    if (!response.ok) throw new Error("Failed to add product");

    res.status(201).json({ message: 'Product added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error adding product', error: err.message });
  }
});

// Update Product
app.put('/products/:id', async (req, res) => {
  const { name, sku, quantity, price, supplier } = req.body;
  try {
    const updatedProduct = { name, sku, quantity, price, supplier };

    const response = await fetch(`${JSON_SERVER_URL}/products/${req.params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedProduct),
    });

    if (!response.ok) throw new Error("Failed to update product");

    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating product', error: err.message });
  }
});

// Delete Product
app.delete('/products/:id', async (req, res) => {
  try {
    const response = await fetch(`${JSON_SERVER_URL}/products/${req.params.id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete product");

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting product', error: err.message });
  }
});

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/build")));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

