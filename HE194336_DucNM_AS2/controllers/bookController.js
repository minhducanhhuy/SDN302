const mongoose = require('mongoose');
const Book = require('../models/Books');
const Loan = require('../models/Loans');

const hasInvalidId = id => !mongoose.isValidObjectId(id);

const validateCopies = book => {
    if (!Number.isInteger(book.totalCopies) || book.totalCopies < 0) {
        return 'totalCopies must be a non-negative integer.';
    }
    if (!Number.isInteger(book.availableCopies) || book.availableCopies < 0) {
        return 'availableCopies must be a non-negative integer.';
    }
    if (book.availableCopies > book.totalCopies) {
        return 'availableCopies cannot exceed totalCopies.';
    }
    return null;
};

exports.getAllBooks = async (req, res) => {
    const books = await Book.find().sort({ title: 1 });
    res.status(200).json(books);
};

exports.getBookById = async (req, res) => {
    if (hasInvalidId(req.params.id)) {
        return res.status(404).json({ message: 'Book not found.' });
    }
    const book = await Book.findById(req.params.id);
    if (!book) {
        return res.status(404).json({ message: 'Book not found.' });
    }
    res.status(200).json(book);
};

exports.createBook = async (req, res) => {
    const copiesError = validateCopies(req.body);
    if (copiesError) {
        return res.status(400).json({ message: copiesError });
    }
    const book = await Book.create(req.body);
    res.status(201).json(book);
};

exports.updateBook = async (req, res) => {
    if (hasInvalidId(req.params.id)) {
        return res.status(404).json({ message: 'Book not found.' });
    }
    if (req.method === 'PUT') {
        const requiredFields = ['title', 'author', 'category', 'isbn', 'totalCopies', 'availableCopies'];
        const missingFields = requiredFields.filter(field => req.body[field] === undefined);
        if (missingFields.length > 0) {
            return res.status(400).json({
                message: `Missing required fields: ${missingFields.join(', ')}.`
            });
        }
    }
    const existingBook = await Book.findById(req.params.id);
    if (!existingBook) {
        return res.status(404).json({ message: 'Book not found.' });
    }
    const copiesError = validateCopies({
        totalCopies: req.body.totalCopies ?? existingBook.totalCopies,
        availableCopies: req.body.availableCopies ?? existingBook.availableCopies
    });
    if (copiesError) {
        return res.status(400).json({ message: copiesError });
    }
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    if (!book) {
        return res.status(404).json({ message: 'Book not found.' });
    }
    res.status(200).json(book);
};

exports.deleteBook = async (req, res) => {
    if (hasInvalidId(req.params.id)) {
        return res.status(404).json({ message: 'Book not found.' });
    }
    const hasLoanHistory = await Loan.exists({ 'items.book_id': req.params.id });
    if (hasLoanHistory) {
        return res.status(409).json({
            message: 'This book cannot be deleted because it is referenced by a loan record.'
        });
    }
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
        return res.status(404).json({ message: 'Book not found.' });
    }
    res.status(200).json({ message: 'Book deleted successfully.', book });
};
