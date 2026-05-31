//example products to seed the database with. You can add more or change these as needed.
// seeder.js
// Run this script ONCE to populate the database with sample products
// Usage: node seeder.js
// To clear all products: node seeder.js --clear

const mongoose = require('mongoose');
const dotenv   = require('dotenv');
dotenv.config();

const Product = require('./models/product.js');
const User    = require('./models/user.js');

const sampleProducts = [
  {
    name:        'Apple iPhone 15 Pro',
    description: 'Latest iPhone with A17 Pro chip, titanium design, and 48MP camera system.',
    price:       129999,
    category:    'Electronics',
    brand:       'Apple',
    image:       'https://via.placeholder.com/400x400?text=iPhone+15+Pro',
    stock:       50,
    rating:      4.8,
    numReviews:  0,
  },
  {
    name:        'Samsung Galaxy S24',
    description: 'Flagship Android phone with AI-powered camera and 120Hz display.',
    price:       89999,
    category:    'Electronics',
    brand:       'Samsung',
    image:       'https://via.placeholder.com/400x400?text=Samsung+S24',
    stock:       35,
    rating:      4.5,
    numReviews:  0,
  },
  {
    name:        'Sony WH-1000XM5 Headphones',
    description: 'Industry-leading noise cancellation with 30-hour battery life.',
    price:       29999,
    category:    'Electronics',
    brand:       'Sony',
    image:       'https://via.placeholder.com/400x400?text=Sony+Headphones',
    stock:       20,
    rating:      4.9,
    numReviews:  0,
  },
  {
    name:        'Nike Air Max 270',
    description: 'Lightweight running shoes with Max Air cushioning for all-day comfort.',
    price:       8999,
    category:    'Clothing',
    brand:       'Nike',
    image:       'https://via.placeholder.com/400x400?text=Nike+Air+Max',
    stock:       100,
    rating:      4.3,
    numReviews:  0,
  },
  {
    name:        'The Pragmatic Programmer',
    description: 'A must-read for every software developer — timeless advice on coding craft.',
    price:       1299,
    category:    'Books',
    brand:       'Addison-Wesley',
    image:       'https://via.placeholder.com/400x400?text=Pragmatic+Programmer',
    stock:       200,
    rating:      4.7,
    numReviews:  0,
  },
  {
    name:        'IKEA MARKUS Office Chair',
    description: 'Ergonomic office chair with lumbar support — great for long coding sessions.',
    price:       12999,
    category:    'Home',
    brand:       'IKEA',
    image:       'https://via.placeholder.com/400x400?text=IKEA+Chair',
    stock:       15,
    rating:      4.2,
    numReviews:  0,
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    if (process.argv[2] === '--clear') {
      // Clear mode: wipe all products
      await Product.deleteMany({});
      console.log('🗑️  All products deleted');
      process.exit(0);
    }

    // Find an admin user to attach as createdBy
    // Make sure you have at least one admin user in the DB first
    // (create one via /api/auth/register then update role in Atlas)
    let adminUser = await User.findOne({ role: 'admin' });

    if (!adminUser) {
      // Create a default admin if none exists
      adminUser = await User.create({
        name:     'Admin User',
        email:    'admin@store.com',
        password: 'admin123',
        role:     'admin',
      });
      console.log('👤 Admin user created: admin@store.com / admin123');
    }

    // Attach adminUser._id to every product
    const productsWithCreator = sampleProducts.map((p) => ({
      ...p,
      createdBy: adminUser._id,
    }));

    // Clear existing products then insert fresh ones
    await Product.deleteMany({});
    await Product.insertMany(productsWithCreator);

    console.log(`✅ ${sampleProducts.length} sample products seeded!`);
    console.log('👤 Admin login: admin@store.com / admin123');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeder error:', error.message);
    process.exit(1);
  }
};

seedDB();