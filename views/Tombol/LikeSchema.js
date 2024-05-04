const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    products: [{ type: String, ref: 'Product' }]
});


const Like = mongoose.model('Like', likeSchema);
module.exports = Like;
