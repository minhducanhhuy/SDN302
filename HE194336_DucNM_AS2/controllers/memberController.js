const Member = require('../models/Members');
const Loan = require('../models/Loans');

exports.getAllMembers = async (req, res) => {
    const members = await Member.find().sort({ fullName: 1 });
    res.status(200).json(members);
};

exports.getMemberById = async (req, res) => {
    const member = await Member.findById(req.params.id);
    if (!member) {
        return res.status(404).json({ message: 'Member not found.' });
    }
    res.status(200).json(member);
};

exports.createMember = async (req, res) => {
    const member = await Member.create(req.body);
    res.status(201).json(member);
};

exports.updateMember = async (req, res) => {
    if (req.method === 'PUT') {
        const requiredFields = ['fullName', 'email', 'phone'];
        const missingFields = requiredFields.filter(field => req.body[field] === undefined);
        if (missingFields.length > 0) {
            return res.status(400).json({
                message: `Missing required fields: ${missingFields.join(', ')}.`
            });
        }
    }
    const member = await Member.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    if (!member) {
        return res.status(404).json({ message: 'Member not found.' });
    }
    res.status(200).json(member);
};

exports.deleteMember = async (req, res) => {
    const hasLoanHistory = await Loan.exists({ member_id: req.params.id });
    if (hasLoanHistory) {
        return res.status(409).json({
            message: 'This member cannot be deleted because it is referenced by a loan record.'
        });
    }
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) {
        return res.status(404).json({ message: 'Member not found.' });
    }
    res.status(200).json({ message: 'Member deleted successfully.', member });
};
