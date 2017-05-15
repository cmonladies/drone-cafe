const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let OrderSchema = new Schema({
  userID: {type: Schema.ObjectId, required: true, trim: true},
  status: {type: String, required: true, trim: true},
  ordersTime: {type: Date, required: true, default: Date.now},
  startCookingTime: {type: Date},
  showToClient: {type: Boolean, default: true},
  menuInfo: { title: String,
              image: {type: String, trim: true},
              id: Number,
              rating: Number,
              type: {type: String, trim: true},
              price: Number,
              ingredients: [] }
});

module.exports = mongoose.model('orders', OrderSchema);