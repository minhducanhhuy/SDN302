const express = require('express');
const router = express.Router();

// Dữ liệu mô phỏng trong bộ nhớ (In-memory data)
let videos = [
    { id: 1, title: 'Video học Node.js phần 1', url: 'https://youtube.com/watch?v=1' },
    { id: 2, title: 'Video học Node.js phần 2', url: 'https://youtube.com/watch?v=2' }
];

// GET: Lấy danh sách tất cả video
router.get('/', (req, res) => {
    res.status(200).json(videos);
});

// GET: Lấy thông tin 1 video theo ID
router.get('/:id', (req, res) => {
    const videoId = parseInt(req.params.id);
    const video = videos.find(v => v.id === videoId);
    
    if (video) {
        res.status(200).json(video);
    } else {
        res.status(404).json({ message: 'Không tìm thấy video' });
    }
});

// POST: Thêm mới 1 video
router.post('/', (req, res) => {
    const newVideo = {
        id: videos.length > 0 ? videos[videos.length - 1].id + 1 : 1,
        title: req.body.title,
        url: req.body.url
    };
    videos.push(newVideo);
    res.status(201).json({ message: 'Thêm video thành công!', data: newVideo });
});

// PUT: Cập nhật video theo ID
router.put('/:id', (req, res) => {
    const videoId = parseInt(req.params.id);
    const index = videos.findIndex(v => v.id === videoId);

    if (index !== -1) {
        videos[index] = { ...videos[index], ...req.body };
        res.status(200).json({ message: 'Cập nhật thành công!', data: videos[index] });
    } else {
        res.status(404).json({ message: 'Không tìm thấy video để cập nhật' });
    }
});

// DELETE: Xóa video theo ID
router.delete('/:id', (req, res) => {
    const videoId = parseInt(req.params.id);
    const index = videos.findIndex(v => v.id === videoId);

    if (index !== -1) {
        videos.splice(index, 1);
        res.status(200).json({ message: 'Đã xóa video thành công!' });
    } else {
        res.status(404).json({ message: 'Không tìm thấy video để xóa' });
    }
});

module.exports = router;
