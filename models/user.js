// import mongoose lib
const mongoose = require('mongoose');

// init user Schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  addedAt: {
    type: Date,
    default: Date.now,
  },
});


// export user model
module.exports = mongoose.model('User', userSchema);
