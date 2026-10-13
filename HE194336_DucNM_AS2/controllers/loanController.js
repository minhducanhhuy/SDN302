const mongoose = require('mongoose');
const Loan = require('../models/Loans');
const Member = require('../models/Members');
const Book = require('../models/Books');

const memberFields = 'fullName email phone membershipType isActive';
const bookFields = 'title author category isbn publishedYear';

const loanDetails = query => query
    .populate({ path: 'member_id', select: memberFields })
    .populate({ path: 'items.book_id', select: bookFields });

const requestError = (message, status = 400) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

const aggregateItems = items => {
    const quantities = new Map();
    for (const item of items) {
        const key = item.book_id.toString();
        quantities.set(key, (quantities.get(key) || 0) + item.quantity);
    }
    return [...quantities].map(([book_id, quantity]) => ({ book_id, quantity }));
};

const validateReferences = async (loanData, { requireActiveMember = false } = {}) => {
    if (!loanData.member_id || !mongoose.isValidObjectId(loanData.member_id)) {
        throw requestError('member_id must be a valid member ID.');
    }

    const member = await Member.findById(loanData.member_id);
    if (!member) {
        throw requestError('Member not found.', 404);
    }
    if (requireActiveMember && !member.isActive) {
        throw requestError('Only active members are allowed to borrow books.', 403);
    }

    if (!Array.isArray(loanData.items) || loanData.items.length === 0) {
        throw requestError('A loan must contain at least one book.');
    }
    for (const item of loanData.items) {
        if (!item || !mongoose.isValidObjectId(item.book_id)) {
            throw requestError('Every loan item must have a valid book_id.');
        }
        if (!Number.isInteger(item.quantity) || item.quantity < 1) {
            throw requestError('Each book quantity must be a positive integer.');
        }
        const book = await Book.findById(item.book_id);
        if (!book) {
            throw requestError(`Book not found: ${item.book_id}.`, 404);
        }
    }
};

const changeAvailableCopies = async (items, direction) => {
    const changedItems = [];
    for (const { book_id, quantity } of items) {
        const filter = { _id: book_id };
        if (direction < 0) {
            filter.availableCopies = { $gte: quantity };
        }
        const result = await Book.updateOne(filter, {
            $inc: { availableCopies: direction * quantity }
        });
        if (result.matchedCount !== 1) {
            await changeAvailableCopies(changedItems, -direction);
            const bookExists = await Book.exists({ _id: book_id });
            if (!bookExists) {
                throw requestError(`Book not found: ${book_id}.`, 404);
            }
            throw requestError(`Not enough available copies for book ${book_id}.`, 409);
        }
        changedItems.push({ book_id, quantity });
    }
    return changedItems;
};

const safelyRestoreCopies = async items => {
    try {
        await changeAvailableCopies(items, 1);
    } catch (error) {
        throw new Error(`Failed to restore book copies after an error: ${error.message}`, { cause: error });
    }
};

const validateLoanId = id => {
    if (!mongoose.isValidObjectId(id)) {
        throw requestError('Loan not found.', 404);
    }
};

exports.getAllLoans = async (req, res) => {
    const loans = await loanDetails(Loan.find().sort({ borrowDate: -1 }));
    res.status(200).json(loans);
};

exports.getLoanById = async (req, res) => {
    validateLoanId(req.params.id);
    const loan = await loanDetails(Loan.findById(req.params.id));
    if (!loan) {
        return res.status(404).json({ message: 'Loan not found.' });
    }
    res.status(200).json(loan);
};

exports.getLoansByMemberId = async (req, res) => {
    const { memberId } = req.params;
    if (!mongoose.isValidObjectId(memberId)) {
        throw requestError('Member ID must be a valid ObjectId.');
    }
    const memberExists = await Member.exists({ _id: memberId });
    if (!memberExists) {
        return res.status(404).json({ message: 'Member not found.' });
    }
    const loans = await loanDetails(
        Loan.find({ member_id: memberId }).sort({ borrowDate: -1 })
    );
    res.status(200).json(loans);
};

exports.createLoan = async (req, res) => {
    if (Object.hasOwn(req.body, 'status') || Object.hasOwn(req.body, 'returnDate')) {
        throw requestError('New loans must start in the Borrowing status.');
    }
    await validateReferences(req.body, { requireActiveMember: true });
    const items = aggregateItems(req.body.items);
    const reservedItems = await changeAvailableCopies(items, -1);

    try {
        const loan = await Loan.create({
            ...req.body,
            items,
            returnDate: null,
            status: 'Borrowing'
        });
        res.status(201).json(await loanDetails(Loan.findById(loan._id)));
    } catch (error) {
        await safelyRestoreCopies(reservedItems);
        throw error;
    }
};

exports.updateLoan = async (req, res) => {
    validateLoanId(req.params.id);
    if (req.method === 'PUT') {
        const requiredFields = ['member_id', 'items', 'dueDate'];
        const missingFields = requiredFields.filter(field => req.body[field] === undefined);
        if (missingFields.length > 0) {
            throw requestError(`Missing required fields: ${missingFields.join(', ')}.`);
        }
    }
    if (Object.hasOwn(req.body, 'status') || Object.hasOwn(req.body, 'returnDate')) {
        throw requestError('Use the return endpoint to change a loan status or returnDate.');
    }

    const currentLoan = await Loan.findById(req.params.id);
    if (!currentLoan) {
        return res.status(404).json({ message: 'Loan not found.' });
    }
    const updatedData = {
        member_id: req.body.member_id ?? currentLoan.member_id,
        items: req.body.items ?? currentLoan.items,
        dueDate: req.body.dueDate ?? currentLoan.dueDate,
        borrowDate: req.body.borrowDate ?? currentLoan.borrowDate
    };
    const isActiveLoan = currentLoan.status !== 'Returned' && !currentLoan.returnDate;
    await validateReferences(updatedData, { requireActiveMember: isActiveLoan });

    const oldItems = aggregateItems(currentLoan.items);
    const newItems = aggregateItems(updatedData.items);
    const oldQuantities = new Map(oldItems.map(item => [item.book_id.toString(), item.quantity]));
    const newQuantities = new Map(newItems.map(item => [item.book_id.toString(), item.quantity]));
    const bookIds = new Set([...oldQuantities.keys(), ...newQuantities.keys()]);
    const reserveItems = [];
    const releaseItems = [];

    if (isActiveLoan) {
        for (const book_id of bookIds) {
            const difference = (newQuantities.get(book_id) || 0) - (oldQuantities.get(book_id) || 0);
            if (difference > 0) {
                reserveItems.push({ book_id, quantity: difference });
            } else if (difference < 0) {
                releaseItems.push({ book_id, quantity: -difference });
            }
        }
    }

    const reservedItems = await changeAvailableCopies(reserveItems, -1);
    try {
        const loan = await Loan.findByIdAndUpdate(req.params.id, updatedData, {
            new: true,
            runValidators: true
        });
        if (!loan) {
            await safelyRestoreCopies(reservedItems);
            return res.status(404).json({ message: 'Loan not found.' });
        }
        await changeAvailableCopies(releaseItems, 1);
        res.status(200).json(await loanDetails(Loan.findById(loan._id)));
    } catch (error) {
        await safelyRestoreCopies(reservedItems);
        throw error;
    }
};

exports.returnLoan = async (req, res) => {
    validateLoanId(req.params.id);
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
        return res.status(404).json({ message: 'Loan not found.' });
    }
    if (loan.returnDate || loan.status === 'Returned') {
        return res.status(409).json({ message: 'This loan has already been returned.' });
    }

    const returnedAt = new Date();
    const updatedLoan = await Loan.findOneAndUpdate(
        {
            _id: loan._id,
            returnDate: null,
            status: { $in: ['Borrowing', 'Overdue'] }
        },
        {
            $set: {
                returnDate: returnedAt,
                status: 'Returned'
            }
        },
        { new: true, runValidators: true }
    );
    if (!updatedLoan) {
        return res.status(409).json({ message: 'This loan has already been returned.' });
    }

    try {
        await changeAvailableCopies(aggregateItems(loan.items), 1);
    } catch (error) {
        const rollback = await Loan.updateOne(
            { _id: loan._id, returnDate: returnedAt, status: 'Returned' },
            { $set: { returnDate: null, status: loan.status } }
        );
        if (rollback.matchedCount !== 1) {
            throw new Error(`Failed to restore book copies and roll back loan ${loan._id}.`, { cause: error });
        }
        throw error;
    }

    res.status(200).json(await loanDetails(Loan.findById(updatedLoan._id)));
};

exports.deleteLoan = async (req, res) => {
    validateLoanId(req.params.id);
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
        return res.status(404).json({ message: 'Loan not found.' });
    }
    if (!loan.returnDate && loan.status !== 'Returned') {
        await changeAvailableCopies(aggregateItems(loan.items), 1);
    }
    await loan.deleteOne();
    res.status(200).json({ message: 'Loan deleted successfully.', loan });
};
