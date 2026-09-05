const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  updateProductStockAndDiscount,
  getUsers,
  toggleUserBlock,
  deleteUser,
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/stats', protect, admin, getAdminStats);
router.patch('/products/:id/stock-discount', protect, admin, updateProductStockAndDiscount);
router.get('/users', protect, admin, getUsers);
router.patch('/users/:id/block', protect, admin, toggleUserBlock);
router.delete('/users/:id', protect, admin, deleteUser);

module.exports = router;
