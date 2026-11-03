const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Student = require('../model/Student');
const Attendance = require('../model/Attendance');
const Class = require('../model/Class');
const Subject = require('../model/Subject');
const { verifyToken } = require('../middlewares/auth');

// ========================================================
// Requirement 4: GET /api/students/:studentId/attendances
// Protected by verifyToken
// ========================================================
const getStudentAttendances = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Validate studentId: return HTTP 400 if not valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: 'Invalid studentId' });
    }

    // Check student exists: return HTTP 404 if not found
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Return all attendance records belonging to student across all classes
    // Sorted by date in descending order (newest records first)
    const attendances = await Attendance.find({ studentId: student._id })
      .populate({
        path: 'classId',
        populate: {
          path: 'subjectId'
        }
      })
      .sort({ date: -1 });

    // Each attendance record must include: className, subjectName, date, and status
    const result = attendances.map(a => ({
      className: a.classId ? a.classId.className : '',
      subjectName: a.classId && a.classId.subjectId ? a.classId.subjectId.name : '',
      date: a.date,
      status: a.status
    }));

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

router.get('/:studentId/attendances', verifyToken, getStudentAttendances);
router.get('/:studentId/attendance', verifyToken, getStudentAttendances);

module.exports = router;

