const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    productId: String,
    quantity: Number,
    dateAdded: { type: Date, default: Date.now }
});

const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: [cartItemSchema]
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
