const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Favorite = require('./models/Favorite');
const Order = require('./models/Order');
const Feedback = require('./models/Feedback');

dotenv.config();

const categoriesData = [
  { name: 'Electronics', slug: 'electronics', icon: 'Smartphone', description: 'Gadgets, laptops, phones, TVs & audio equipment' },
  { name: 'Vehicles', slug: 'vehicles', icon: 'Car', description: 'Cars, motorcycles, bicycles, and auto accessories' },
  { name: 'Furniture & Decor', slug: 'furniture-decor', icon: 'Armchair', description: 'Chairs, tables, sofas, beds & home decorations' },
  { name: 'Fashion & Apparel', slug: 'fashion-apparel', icon: 'Shirt', description: 'Clothing, shoes, watches & fashion accessories' },
  { name: 'Books & Hobbies', slug: 'books-hobbies', icon: 'BookOpen', description: 'Books, musical instruments, art & collectibles' },
  { name: 'Home Appliances', slug: 'home-appliances', icon: 'Tv', description: 'Refrigerators, washing machines, microwaves & ACs' },
  { name: 'Sports & Outdoors', slug: 'sports-outdoors', icon: 'Dumbbell', description: 'Fitness gear, bicycles, camping equipment & sports items' },
];

const sampleProducts = [
  {
    title: 'Apple MacBook Pro 14" M1 Pro (16GB RAM, 512GB SSD)',
    description: 'MacBook Pro 14-inch in Space Gray. Includes original charger and box. Excellent condition with 92% battery health. Tested and verified.',
    categorySlug: 'electronics',
    price: 1299,
    discountPercent: 10, // Discount applied by Admin
    stockQuantity: 8,
    condition: 'Like New',
    location: 'San Francisco, CA',
    images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80'],
  },
  {
    title: 'Sony WH-1000XM4 Noise Canceling Headphones',
    description: 'Active noise cancellation works flawlessly. Includes carrying case, audio cable, and USB-C charging cord.',
    categorySlug: 'electronics',
    price: 220,
    discountPercent: 15,
    stockQuantity: 14,
    condition: 'Good',
    location: 'Seattle, WA',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'],
  },
  {
    title: 'Modern Ergonomic Office Mesh Chair',
    description: 'High-back ergonomic mesh office chair with adjustable lumbar support, 3D armrests, and smooth casters.',
    categorySlug: 'furniture-decor',
    price: 160,
    discountPercent: 20,
    stockQuantity: 12,
    condition: 'Good',
    location: 'Austin, TX',
    images: ['https://images.unsplash.com/photo-1580481072645-022f9a6d1298?w=800&auto=format&fit=crop&q=80'],
  },
  {
    title: 'Specialized Allez Road Bike 54cm',
    description: 'Aluminum frame road bike with Shimano Claris drivetrain. Recently serviced with new tires and brake pads.',
    categorySlug: 'sports-outdoors',
    price: 550,
    discountPercent: 5,
    stockQuantity: 4,
    condition: 'Like New',
    location: 'Denver, CO',
    images: ['https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&auto=format&fit=crop&q=80'],
  },
  {
    title: 'Canon EOS R6 Mirrorless Camera Body',
    description: 'Full-frame mirrorless camera body. Low shutter count (~12k). Works perfectly. Comes with two original batteries and charger.',
    categorySlug: 'electronics',
    price: 1450,
    discountPercent: 12,
    stockQuantity: 6,
    condition: 'Like New',
    location: 'Chicago, IL',
    images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80'],
  },
  {
    title: 'Vintage Solid Oak Dining Table & 4 Chairs',
    description: 'Beautiful vintage solid oak wood dining set. Sturdy construction with minor cosmetic wear on table surface. Dimensions: 60" x 36".',
    categorySlug: 'furniture-decor',
    price: 320,
    discountPercent: 10,
    stockQuantity: 3,
    condition: 'Fair',
    location: 'Portland, OR',
    images: ['https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=800&auto=format&fit=crop&q=80'],
  },
  {
    title: 'Fender Player Stratocaster Electric Guitar - Sunburst',
    description: 'Made in Mexico Fender Stratocaster in 3-color sunburst. Alder body, maple neck, 3 single-coil pickups.',
    categorySlug: 'books-hobbies',
    price: 520,
    discountPercent: 8,
    stockQuantity: 7,
    condition: 'Like New',
    location: 'Nashville, TN',
    images: ['https://images.unsplash.com/photo-1550291652-6ea9114a47b1?w=800&auto=format&fit=crop&q=80'],
  },
  {
    title: 'Nespresso VertuoPlus Coffee Machine',
    description: 'Works like a charm! Includes milk frother and a sampler box of coffee pods.',
    categorySlug: 'home-appliances',
    price: 90,
    discountPercent: 0,
    stockQuantity: 0, // Out of stock
    condition: 'Good',
    location: 'New York, NY',
    images: ['https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80'],
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/used_products_db', {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany();
    await Category.deleteMany();
    await Product.deleteMany();
    await Favorite.deleteMany();
    await Order.deleteMany();
    await Feedback.deleteMany();

    // Create Admin User
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await User.create({
      name: 'Platform Administrator',
      email: 'admin@marketplace.com',
      password: adminPassword,
      phone: '+1 (555) 019-2831',
      location: 'HQ San Francisco',
      role: 'admin',
      status: 'active',
    });

    // Create Normal User
    const userPassword = await bcrypt.hash('user123', 10);
    const normalUser = await User.create({
      name: 'Alex Mercer',
      email: 'user@marketplace.com',
      password: userPassword,
      phone: '+1 (555) 712-4410',
      location: 'Seattle, WA',
      role: 'user',
      status: 'active',
    });

    console.log('Users created: Admin (admin@marketplace.com), User (user@marketplace.com)');

    // Create Categories
    const createdCategories = await Category.insertMany(categoriesData);
    console.log(`${createdCategories.length} categories created.`);

    const categoryMap = {};
    createdCategories.forEach((cat) => {
      categoryMap[cat.slug] = cat._id;
    });

    // Create Products (Admin is listed as initial inventory manager)
    const productsToInsert = sampleProducts.map((p) => ({
      title: p.title,
      description: p.description,
      category: categoryMap[p.categorySlug] || createdCategories[0]._id,
      price: p.price,
      discountPercent: p.discountPercent,
      stockQuantity: p.stockQuantity,
      condition: p.condition,
      location: p.location,
      images: p.images,
      seller: adminUser._id,
      status: p.stockQuantity > 0 ? 'available' : 'out_of_stock',
      viewsCount: Math.floor(Math.random() * 80) + 12,
    }));

    const createdProducts = await Product.insertMany(productsToInsert);
    console.log(`${createdProducts.length} products created with stock & discounts.`);

    // Seed Orders across recent months for Monthly/Yearly Analytics
    const now = new Date();
    const sampleOrders = [
      {
        user: normalUser._id,
        product: createdProducts[0]._id,
        quantity: 1,
        unitPrice: 1169.1,
        discountPercent: 10,
        totalAmount: 1169.1,
        createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2), // This month
      },
      {
        user: normalUser._id,
        product: createdProducts[1]._id,
        quantity: 2,
        unitPrice: 187,
        discountPercent: 15,
        totalAmount: 374,
        createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5), // This month
      },
      {
        user: normalUser._id,
        product: createdProducts[2]._id,
        quantity: 1,
        unitPrice: 128,
        discountPercent: 20,
        totalAmount: 128,
        createdAt: new Date(now.getFullYear(), now.getMonth() - 1, 15), // Last month
      },
      {
        user: normalUser._id,
        product: createdProducts[3]._id,
        quantity: 1,
        unitPrice: 522.5,
        discountPercent: 5,
        totalAmount: 522.5,
        createdAt: new Date(now.getFullYear(), now.getMonth() - 2, 10), // 2 months ago
      },
    ];

    await Order.insertMany(sampleOrders);
    console.log(`${sampleOrders.length} historical orders created for sales analytics.`);

    // Seed Amazon/Flipkart style feedbacks
    const sampleFeedbacks = [
      {
        user: normalUser._id,
        product: createdProducts[0]._id,
        rating: 5,
        experienceCategory: 'Product Quality',
        comment: 'Received the MacBook in pristine condition! Fast delivery and great discount applied by admin.',
        recommended: true,
      },
      {
        user: normalUser._id,
        product: createdProducts[1]._id,
        rating: 5,
        experienceCategory: 'App Experience',
        comment: 'Seamless checkout process! Stock levels updated instantly after purchase. Highly recommended platform!',
        recommended: true,
      },
      {
        user: normalUser._id,
        product: createdProducts[2]._id,
        rating: 4,
        experienceCategory: 'Value for Money',
        comment: 'Great ergonomic chair for remote work. Good discount price.',
        recommended: true,
      },
    ];

    await Feedback.insertMany(sampleFeedbacks);
    console.log(`${sampleFeedbacks.length} sample customer feedbacks created.`);

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
