const express = require('express');
const router = express.Router();
const {
  getFavorites,
  toggleFavorite,
  checkFavorite,
} = require('../controllers/favoriteController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getFavorites);
router.post('/:productId', protect, toggleFavorite);
router.get('/check/:productId', protect, checkFavorite);

module.exports = router;
