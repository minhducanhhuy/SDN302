const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../utils');

router.get('/', (req, res) => {
    const db = readDB();
	 res.status(200).json(db.articles);
});

router.get('/:id/comments', (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    const article = db.articles.find(c => c.id === id);

    if (article) {
			const comments = db.comments.filter(comment => comment.articleId === article.id);
         res.status(200).json(comments);
    } else {
        res.status(404).json({ message: "Không tìm thấy article" });
    }
});


router.get('/:id', (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    const article = db.articles.find(c => c.id === id);

    if (article) {
         res.status(200).json(article);
    } else {
        res.status(404).json({ message: "Không tìm thấy article" });
    }
});

router.post('/', (req, res) => {
    const db = readDB();
    const newId = db.articles.length > 0 ? db.articles[db.articles.length - 1].id + 1 : 1;
    if(!req.body.title || !req.body.content || !req.body.author || !req.body.date) {
		 res.status(400).json({ message: "required field is mising" });
	 }
	 else {
		const newItem = { id: newId, ...req.body };
			
		db.articles.push(newItem);
		writeDB(db);
		res.status(201).json(newItem);
	 }

});

router.put('/:id', (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    const index = db.articles.findIndex(c => c.id === id);
    if (index !== -1) {
        db.articles[index] = { ...db.articles[index], ...req.body };
        writeDB(db);
        res.status(200).json(db.articles[index]);
    } else {
       res.status(404).json({ message: "Không tìm thấy article" });
    }
});

router.delete('/:id', (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    const index = db.articles.findIndex(c => c.id === id);
    if (index !== -1) {
        db.articles.splice(index, 1);
        writeDB(db);
        res.status(200).json({ message: 'Xóa article thành công!' });;
    } else {
        res.status(404).json({ message: 'Không tìm thấy article để xóa' });
    }
});

module.exports = router;