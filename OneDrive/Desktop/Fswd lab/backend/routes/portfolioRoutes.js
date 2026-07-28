const express = require("express");
const router = express.Router();
const { getPublicPortfolio, sendContactMessage } = require("../controllers/portfolioController");

// Public endpoints (no authentication required)
router.get("/:username", getPublicPortfolio);
router.post("/:username/contact", sendContactMessage);

module.exports = router;
