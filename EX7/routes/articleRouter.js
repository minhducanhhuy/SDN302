const express = require('express');
const router = express.Router();

// Dữ liệu mô phỏng trong bộ nhớ (In-memory data)
let articles = [
    { id: 1, title: 'Hướng dẫn Node.js cơ bản', content: 'Nội dung bài học Node.js' },
    { id: 2, title: 'Express Router', content: 'Cách sử dụng Express Router' }
];

// GET: Lấy danh sách tất cả bài viết
router.get('/', (req, res) => {
    res.status(200).json(articles);
});

// GET: Lấy thông tin 1 bài viết theo ID
router.get('/:id', (req, res) => {
    const articleId = parseInt(req.params.id);
    const article = articles.find(a => a.id === articleId);
    
    if (article) {
        res.status(200).json(article);
    } else {
        res.status(404).json({ message: 'Không tìm thấy bài viết' });
    }
});

// POST: Thêm mới 1 bài viết
router.post('/', (req, res) => {
    const newArticle = {
        id: articles.length > 0 ? articles[articles.length - 1].id + 1 : 1,
        title: req.body.title,
        content: req.body.content
    };
    articles.push(newArticle);
    res.status(201).json({ message: 'Thêm bài viết thành công!', data: newArticle });
});

// PUT: Cập nhật bài viết theo ID
router.put('/:id', (req, res) => {
    const articleId = parseInt(req.params.id);
    const index = articles.findIndex(a => a.id === articleId);

    if (index !== -1) {
        articles[index] = { ...articles[index], ...req.body };
        res.status(200).json({ message: 'Cập nhật thành công!', data: articles[index] });
    } else {
        res.status(404).json({ message: 'Không tìm thấy bài viết để cập nhật' });
    }
});

// DELETE: Xóa bài viết theo ID
router.delete('/:id', (req, res) => {
    const articleId = parseInt(req.params.id);
    const index = articles.findIndex(a => a.id === articleId);

    if (index !== -1) {
        articles.splice(index, 1);
        res.status(200).json({ message: 'Đã xóa bài viết thành công!' });
    } else {
        res.status(404).json({ message: 'Không tìm thấy bài viết để xóa' });
    }
});

module.exports = router;
