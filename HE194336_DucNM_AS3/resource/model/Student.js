const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentCode: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
}, {
  timestamps: false,
  versionKey: false
});

module.exports = mongoose.model('Student', studentSchema, 'students');
