require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Book = require('./models/Books');
const Member = require('./models/Members');
const Loan = require('./models/Loans');

const seedData = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not set in .env');
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB.');

        // Clear existing data
        await Book.deleteMany({});
        await Member.deleteMany({});
        await Loan.deleteMany({});
        console.log('Cleared existing collections (books, members, loans).');

        // Read JSON files
        const booksRaw = JSON.parse(fs.readFileSync(path.join(__dirname, 'DB', 'books.json'), 'utf-8'));
        const membersRaw = JSON.parse(fs.readFileSync(path.join(__dirname, 'DB', 'members.json'), 'utf-8'));
        const loansRaw = JSON.parse(fs.readFileSync(path.join(__dirname, 'DB', 'loans.json'), 'utf-8'));

        // Prepare books with proper ObjectId and Date
        const books = booksRaw.map(b => ({
            ...b,
            _id: new mongoose.Types.ObjectId(b._id),
            createdAt: b.createdAt ? new Date(b.createdAt) : undefined,
            updatedAt: b.updatedAt ? new Date(b.updatedAt) : undefined
        }));

        // Prepare members with proper ObjectId and Date
        const members = membersRaw.map(m => ({
            ...m,
            _id: new mongoose.Types.ObjectId(m._id),
            createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
            updatedAt: m.updatedAt ? new Date(m.updatedAt) : undefined
        }));

        // Prepare loans with proper ObjectId and Date
        const loans = loansRaw.map(l => ({
            ...l,
            _id: new mongoose.Types.ObjectId(l._id),
            member_id: new mongoose.Types.ObjectId(l.member_id),
            items: l.items.map(it => ({
                book_id: new mongoose.Types.ObjectId(it.book_id),
                quantity: it.quantity
            })),
            borrowDate: l.borrowDate ? new Date(l.borrowDate) : undefined,
            dueDate: l.dueDate ? new Date(l.dueDate) : undefined,
            returnDate: l.returnDate ? new Date(l.returnDate) : null,
            createdAt: l.createdAt ? new Date(l.createdAt) : undefined,
            updatedAt: l.updatedAt ? new Date(l.updatedAt) : undefined
        }));

        await Book.insertMany(books);
        console.log(`Inserted ${books.length} books.`);

        await Member.insertMany(members);
        console.log(`Inserted ${members.length} members.`);

        await Loan.insertMany(loans);
        console.log(`Inserted ${loans.length} loans.`);

        console.log('Database seeded successfully with proper ObjectId references!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error.message);
        process.exit(1);
    }
};

seedData();
