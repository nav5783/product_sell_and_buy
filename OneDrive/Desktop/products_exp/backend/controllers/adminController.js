const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Feedback = require('../models/Feedback');

// @desc    Get detailed admin stats & monthly/yearly sales analytics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const availableProducts = await Product.countDocuments({ stockQuantity: { $gt: 0 } });
    const soldProducts = await Product.countDocuments({ stockQuantity: 0 });
    const totalCategories = await Category.countDocuments();
    const totalOrdersCount = await Order.countDocuments();
    const totalFeedbackCount = await Feedback.countDocuments();

    // Date calculations for Monthly and Yearly sales metrics
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Monthly sales aggregation
    const monthlySalesAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth }, paymentStatus: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, totalQuantity: { $sum: '$quantity' }, orderCount: { $sum: 1 } } },
    ]);

    // Yearly sales aggregation
    const yearlySalesAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfYear }, paymentStatus: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, totalQuantity: { $sum: '$quantity' }, orderCount: { $sum: 1 } } },
    ]);

    // Total All-Time Revenue
    const allTimeSalesAgg = await Order.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]);

    const monthlySales = monthlySalesAgg[0] || { totalRevenue: 0, totalQuantity: 0, orderCount: 0 };
    const yearlySales = yearlySalesAgg[0] || { totalRevenue: 0, totalQuantity: 0, orderCount: 0 };
    const allTimeRevenue = allTimeSalesAgg[0]?.totalRevenue || 0;

    // Monthly sales breaking down month-by-month for current year (User Behavior Chart Data)
    const monthlyBreakdown = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfYear }, paymentStatus: 'completed' } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
          itemsSold: { $sum: '$quantity' },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const salesChartData = monthNames.map((name, index) => {
      const found = monthlyBreakdown.find((m) => m._id.month === index + 1);
      return {
        month: name,
        revenue: found ? found.revenue : 0,
        orders: found ? found.orders : 0,
        itemsSold: found ? found.itemsSold : 0,
      };
    });

    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .populate('product', 'title price')
      .sort({ createdAt: -1 })
      .limit(6);

    const recentProducts = await Product.find()
      .populate('category', 'name')
      .populate('seller', 'name email')
      .sort({ createdAt: -1 })
      .limit(6);

    res.json({
      totalUsers,
      totalProducts,
      availableProducts,
      soldProducts,
      totalCategories,
      totalOrdersCount,
      totalFeedbackCount,
      allTimeRevenue,
      monthlySales,
      yearlySales,
      salesChartData,
      recentOrders,
      recentProducts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin quick update product stock & discount
// @route   PATCH /api/admin/products/:id/stock-discount
// @access  Private/Admin
const updateProductStockAndDiscount = async (req, res, next) => {
  try {
    const { stockQuantity, discountPercent } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (stockQuantity !== undefined) {
      product.stockQuantity = Number(stockQuantity);
      if (product.stockQuantity === 0) product.status = 'out_of_stock';
      else if (product.status === 'out_of_stock') product.status = 'available';
    }

    if (discountPercent !== undefined) {
      product.discountPercent = Number(discountPercent);
    }

    await product.save();

    res.json({
      _id: product._id,
      stockQuantity: product.stockQuantity,
      discountPercent: product.discountPercent,
      message: 'Product stock and discount updated by admin',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users for admin
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const orders = await Order.find({ user: u._id }).populate('product', 'title price images').sort({ createdAt: -1 });
        const userProducts = await Product.find({ seller: u._id }).select('title price stockQuantity discountPercent condition status images');
        return {
          ...u.toObject(),
          ordersCount: orders.length,
          purchasedItems: orders,
          userProducts: userProducts,
        };
      })
    );

    res.json(usersWithStats);
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle block/unblock user
// @route   PATCH /api/admin/users/:id/block
// @access  Private/Admin
const toggleUserBlock = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot block administrator account' });
    }

    user.status = user.status === 'active' ? 'blocked' : 'active';
    await user.save();

    res.json({
      _id: user._id,
      status: user.status,
      message: `User status changed to ${user.status}`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete administrator account' });
    }

    await Product.deleteMany({ seller: user._id });
    await Order.deleteMany({ user: user._id });
    await Feedback.deleteMany({ user: user._id });

    await user.deleteOne();
    res.json({ message: 'User account and history removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
  updateProductStockAndDiscount,
  getUsers,
  toggleUserBlock,
  deleteUser,
};
