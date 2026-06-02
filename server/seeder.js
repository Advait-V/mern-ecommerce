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
    name:     'Apple iPhone 15 Pro',
    image:    'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium?wid=400&hei=400&fmt=jpeg',
    price:    129999,
    category: 'Electronics',
    brand:    'Apple',
    description: 'Latest iPhone with A17 Pro chip, titanium design, and 48MP camera.',
    stock:    50,
  },
  {
    name:     'Samsung Galaxy S24',
    image:    'https://images.samsung.com/in/smartphones/galaxy-s24/images/galaxy-s24-highlights-color-carousel-exclusive.jpg?imbypass=true',
    price:    89999,
    category: 'Electronics',
    brand:    'Samsung',
    description: 'Flagship Android with AI camera and 120Hz display.',
    stock:    35,
  },
  {
    name:     'Sony WH-1000XM5',
    image:    'https://www.bhphotovideo.com/images/images500x500/sony_wh1000xm5_b_wh_1000xm5_wireless_noise_canceling_over_ear_1646060955_1668136.jpg',
    price:    29999,
    category: 'Electronics',
    brand:    'Sony',
    description: 'Industry-leading noise cancellation with 30-hour battery.',
    stock:    20,
  },
  {
    name:     'Nike Air Max 270',
    image:    'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/05219f4d-a023-487e-91ff-87a11adeda94/NIKE+AIR+MAX+270+%28GS%29.png',
    price:    8999,
    category: 'Clothing',
    brand:    'Nike',
    description: 'Lightweight running shoes with Max Air cushioning.',
    stock:    100,
  },
  {
    name:     'The Pragmatic Programmer',
    image:    'https://m.media-amazon.com/images/I/71f743sOPoL._AC_UF1000,1000_QL80_.jpg',
    price:    1299,
    category: 'Books',
    brand:    'Addison-Wesley',
    description: 'Timeless advice on coding craft for every developer.',
    stock:    200,
  },
  {
    name:     'IKEA MARKUS Chair',
    image:    'https://www.ikea.com/in/en/images/products/markus-office-chair-vissle-dark-grey__0724714_pe734597_s5.jpg?f=xl',
    price:    12999,
    category: 'Home',
    brand:    'IKEA',
    description: 'Ergonomic office chair with lumbar support.',
    stock:    15,
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