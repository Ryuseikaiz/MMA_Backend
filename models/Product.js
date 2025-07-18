const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  imageUrl: { type: String, required: false, default: '' },
  location: { type: String, required: true }, 
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);