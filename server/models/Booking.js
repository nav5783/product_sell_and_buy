const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true }, // <--- NEW FIELD
  
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
  packageName: { type: String, required: true },
  
  members: { type: Number, required: true },
  travelDate: { type: Date, required: true },
  endDate: { type: Date }, // <--- NEW FIELD (Auto Calculated)

  totalAmount: { type: Number, required: true },
  gstAmount: { type: Number, required: true },
  
  breakdown: {
    flight: { type: Number, default: 0 },
    hotel: { type: Number, default: 0 },
    food: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    guide: { type: Number, default: 0 }
  },

  status: { type: String, default: 'Confirmed' } 
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);