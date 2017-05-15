const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let UserSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, index: { unique: true } },
  credit: {type: Number, required: true}
});

module.exports = mongoose.model('users', UserSchema);

