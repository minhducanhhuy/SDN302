const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

const articleRouter = require('./routes/articleRouter');
const commentRouter = require('./routes/commentRouter');

app.use('/api/articles', articleRouter);
app.use('/api/comments', commentRouter);

app.use((req, res) => {
    res.status(404).json({ message: 'API không tồn tại' });
});

// Khởi động server
app.listen(port, () => {
    console.log(`Server đang hoạt động tại http://localhost:${port}`);
});
