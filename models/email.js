var mongoose = require('mongoose');

var emailSchema = new mongoose.Schema({
  uuid : {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  email: {
    type: String,
    required: true
  },
  agreed: String,
});

//Export function to create "Email" model class
let Email = module.exports = mongoose.model('Email', emailSchema);

