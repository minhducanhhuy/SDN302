const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['PRESENT', 'ABSENT'], required: true },
}, {
  timestamps: false,
  versionKey: false
});

module.exports = mongoose.model('Attendance', attendanceSchema, 'attendances');
