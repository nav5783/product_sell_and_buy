const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const fs = require('fs');
const path = require('path');

// @desc    Get all products with search, filter, sorting, and pagination
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 9;
    const skip = (page - 1) * limit;

    const {
      search,
      category,
      minPrice,
      maxPrice,
      condition,
      location,
      status,
      sort,
    } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    } else if (!status) {
      query.status = { $ne: 'sold' }; // default show available/in-stock items
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        const foundCat = await Category.findOne({ slug: category });
        if (foundCat) {
          query.category = foundCat._id;
        }
      }
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (condition) {
      const conditionArr = Array.isArray(condition) ? condition : condition.split(',');
      query.condition = { $in: conditionArr };
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (sort === 'price-asc') {
      sortOption = { price: 1 };
    } else if (sort === 'price-desc') {
      sortOption = { price: -1 };
    } else if (sort === 'popular') {
      sortOption = { viewsCount: -1 };
    } else if (sort === 'discount') {
      sortOption = { discountPercent: -1 };
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug icon')
      .populate('seller', 'name email phone location avatar')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    res.json({
      products,
      page,
      pages: Math.ceil(total / limit) || 1,
      total,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ stockQuantity: { $gt: 0 } })
      .populate('category', 'name slug icon')
      .populate('seller', 'name email phone location avatar')
      .sort({ createdAt: -1 })
      .limit(6);

    res.json(products);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug description icon')
      .populate('seller', 'name email phone location avatar createdAt');

    if (!product) {
      return res.status(404).json({ message: 'Product listing not found' });
    }

    product.viewsCount += 1;
    await product.save();

    res.json(product);
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product (Admin or User)
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res, next) => {
  try {
    const { title, description, category, price, discountPercent, stockQuantity, condition, location } = req.body;

    if (!title || !description || !category || !price || !condition || !location) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    let imagePaths = [];
    if (req.files && req.files.length > 0) {
      imagePaths = req.files.map((file) => `/uploads/${file.filename}`);
    }

    const qty = Number(stockQuantity) !== undefined && !isNaN(Number(stockQuantity)) ? Number(stockQuantity) : 10;
    const disc = Number(discountPercent) || 0;

    const product = await Product.create({
      title,
      description,
      category,
      price: Number(price),
      discountPercent: disc,
      stockQuantity: qty,
      condition,
      location,
      images: imagePaths,
      seller: req.user._id,
      status: qty > 0 ? 'available' : 'out_of_stock',
    });

    const populatedProduct = await Product.findById(product._id)
      .populate('category', 'name slug icon')
      .populate('seller', 'name email phone location');

    res.status(201).json(populatedProduct);
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Owner or Admin)
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You can only edit your own listings or as admin' });
    }

    const { title, description, category, price, discountPercent, stockQuantity, condition, location, existingImages } = req.body;

    if (title) product.title = title;
    if (description) product.description = description;
    if (category) product.category = category;
    if (price !== undefined) product.price = Number(price);
    if (discountPercent !== undefined) product.discountPercent = Number(discountPercent);
    if (stockQuantity !== undefined) {
      product.stockQuantity = Number(stockQuantity);
      if (product.stockQuantity === 0) product.status = 'out_of_stock';
      else if (product.status === 'out_of_stock') product.status = 'available';
    }
    if (condition) product.condition = condition;
    if (location) product.location = location;

    let updatedImages = [];
    if (existingImages) {
      updatedImages = Array.isArray(existingImages) ? existingImages : [existingImages];
    }

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => `/uploads/${file.filename}`);
      updatedImages = [...updatedImages, ...newImages];
    }

    product.images = updatedImages;

    const updatedProduct = await product.save();

    const populatedProduct = await Product.findById(updatedProduct._id)
      .populate('category', 'name slug icon')
      .populate('seller', 'name email phone location');

    res.json(populatedProduct);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Owner or Admin)
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product listing not found' });
    }

    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin or owner access required' });
    }

    if (product.images && product.images.length > 0) {
      product.images.forEach((imgRelPath) => {
        if (imgRelPath.startsWith('/uploads/')) {
          const filePath = path.join(__dirname, '..', imgRelPath);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      });
    }

    await product.deleteOne();

    res.json({ message: 'Product removed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Buy Product (Reduces stock quantity & creates Order)
// @route   POST /api/products/:id/buy
// @access  Private
const buyProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requestedQty = Number(req.body.quantity) || 1;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stockQuantity < requestedQty) {
      return res.status(400).json({
        message: `Insufficient stock! Only ${product.stockQuantity} item(s) remaining.`,
      });
    }

    // Calculate discounted unit price
    const discount = product.discountPercent || 0;
    const unitPrice = product.price * (1 - discount / 100);
    const totalAmount = unitPrice * requestedQty;

    // Reduce stock quantity
    product.stockQuantity -= requestedQty;
    if (product.stockQuantity === 0) {
      product.status = 'out_of_stock';
    }
    await product.save();

    // Create Order Record
    const order = await Order.create({
      user: req.user._id,
      product: product._id,
      quantity: requestedQty,
      unitPrice,
      discountPercent: discount,
      totalAmount,
      paymentStatus: 'completed',
    });

    res.status(201).json({
      message: `Purchase successful! Order #${order._id.toString().slice(-6).toUpperCase()} placed.`,
      order,
      remainingStock: product.stockQuantity,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get listings created by current logged in user
// @route   GET /api/products/user/my-listings
// @access  Private
const getMyListings = async (req, res, next) => {
  try {
    const products = await Product.find({ seller: req.user._id })
      .populate('category', 'name slug icon')
      .sort({ createdAt: -1 });

    const totalListings = products.length;
    const availableCount = products.filter((p) => p.stockQuantity > 0).length;
    const soldCount = products.filter((p) => p.stockQuantity === 0).length;

    res.json({
      products,
      stats: {
        totalListings,
        availableCount,
        soldCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getFeaturedProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  buyProduct,
  getMyListings,
};
