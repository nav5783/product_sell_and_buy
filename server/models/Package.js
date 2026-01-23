const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  
  // MAIN THUMBNAIL (For the card view)
  image: { type: String, required: true },

  category: { 
    type: String, 
    enum: ['Family', 'Single', 'Couple', 'Friends'], 
    required: true 
  },
  duration: { type: Number, required: true },


  mapUrl: { type: String, required: true },

  // --- NEW: PHOTO GALLERIES ---
  gallery: {
    places: [{ type: String }], // Array of URLs for tourist spots
    hotels: [{ type: String }], // Array of URLs for rooms/hotels
    food:   [{ type: String }]  // Array of URLs for food
  },

  // COST BREAKDOWN
  costs: {
    flight: { type: Number, required: true },
    hotel: { type: Number, required: true },
    food: { type: Number, required: true },
    transport: { type: Number, required: true },
    guide: { type: Number, default: 0 },
  },

  gstRate: { type: Number, default: 18 },
}, { timestamps: true });

module.exports = mongoose.model('Package', PackageSchema);