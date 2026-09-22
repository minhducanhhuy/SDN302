const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../utils');

router.get('/', (req, res) => {
    const db = readDB();
	 res.status(200).json(db.comments);
});

router.get('/:id', (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    const article = db.comments.find(c => c.id === id);

    if (article) {
         res.status(200).json(article);
    } else {
        res.status(404).json({ message: "Không tìm thấy comment" });
    }
});

router.post('/', (req, res) => {
    const db = readDB();
    let check = db.articles.find(c => c.id === req.body.articleId)
	if(!check) {
		 res.status(400).json({ message: "không tìm thấy id article tương ứng" });
	 }
	 else {
		const newId = db.comments.length > 0 ? db.comments[db.comments.length - 1].id + 1 : 1;
		const newItem = { id: newId, ...req.body };
		db.comments.push(newItem);
		writeDB(db);
		res.status(201).json(newItem);
	 }

});

router.put('/:id', (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    const index = db.comments.findIndex(c => c.id === id);
    if (index !== -1) {
        db.comments[index] = { ...db.comments[index], ...req.body };
        writeDB(db);
        res.status(200).json(db.comments[index]);
    } else {
       res.status(404).json({ message: "Không tìm thấy comment" });
    }
});

router.delete('/:id', (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    const index = db.comments.findIndex(c => c.id === id);
    if (index !== -1) {
        db.comments.splice(index, 1);
        writeDB(db);
        res.status(200).json({ message: 'Xóa comment thành công!' });;
    } else {
        res.status(404).json({ message: 'Không tìm thấy comment để xóa' });
    }
});

module.exports = router;