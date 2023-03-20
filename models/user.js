var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
  uuid : {
    type: String,
    required: true
  },
  query_params: String,
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  age_range: String,
  eye_quality: String,
  room_quality: String,
  computer_type: String,
  screen_size: String,
  browser_agent: String,
  image_list: [{type: String}],
  fake_likes_list: [{type: Number}],
  image_index: {
    type: Number,
    required: true,
    default: 0
  }
});

//Export function to create "User" model class
let User = module.exports = mongoose.model('User', userSchema);

