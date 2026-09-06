const Favorite = require('../models/Favorite');
const Product = require('../models/Product');

// @desc    Get user favorite products
// @route   GET /api/favorites
// @access  Private
const getFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id })
      .populate({
        path: 'product',
        populate: [
          { path: 'category', select: 'name slug icon' },
          { path: 'seller', select: 'name email phone location' },
        ],
      })
      .sort({ createdAt: -1 });

    // Filter out deleted products if any
    const validFavorites = favorites
      .filter((fav) => fav.product !== null)
      .map((fav) => fav.product);

    res.json(validFavorites);
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle favorite (Add or Remove)
// @route   POST /api/favorites/:productId
// @access  Private
const toggleFavorite = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const existingFav = await Favorite.findOne({
      user: req.user._id,
      product: productId,
    });

    if (existingFav) {
      await existingFav.deleteOne();
      return res.json({ isFavorite: false, message: 'Removed from favorites' });
    } else {
      await Favorite.create({
        user: req.user._id,
        product: productId,
      });
      return res.json({ isFavorite: true, message: 'Added to favorites' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Check if product is in favorites
// @route   GET /api/favorites/check/:productId
// @access  Private
const checkFavorite = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const fav = await Favorite.findOne({
      user: req.user._id,
      product: productId,
    });

    res.json({ isFavorite: Boolean(fav) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFavorites,
  toggleFavorite,
  checkFavorite,
};
