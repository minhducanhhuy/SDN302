const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  className: { type: String, required: true, unique: true, trim: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  lecturerName: { type: String, required: true, trim: true },
  status: { type: String, enum: ['OPEN', 'CLOSED'], required: true },
  enrollments: [{
    _id: false,
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    status: { type: String, required: true },
  }],
}, {
  timestamps: false,
  versionKey: false
});

module.exports = mongoose.model('Class', classSchema, 'classes');
