var mongoose = require('mongoose');

var imageSchema = new mongoose.Schema({
  filename : {
    type: String,
    required: true
  },
  uuid : {
    type: String,
    required: true
  },
  rating : {
    type: Number,
    required: true
  },
  fake: {
    type: Number,
    default: -1,
  },
  likes: {
    type: Number,
    default: -1,
  },
  views: {
    type: Number,
    default: -1,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  }
});

//Export function to create "Image" model class
let Image = module.exports = mongoose.model('Image', imageSchema);

