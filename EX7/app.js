const express = require("express");
const app = express(); // Lưu ý: Cần thêm () để khởi tạo ứng dụng Express
const port = 3000;

// Middleware để parse body của các request thành JSON
app.use(express.json());

// Import các router từ thư mục routes
const articleRouter = require("./routes/articleRouter");
const videoRouter = require("./routes/videoRouter");

// Route GET cơ bản ở trang chủ kiểm tra server
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Server đang hoạt động! Truy cập /api/articles hoặc /api/videos để xem dữ liệu.",
    });
});

// Gắn các router vào đường dẫn tương ứng có tiền tố /api/
app.use("/api/articles", articleRouter);
app.use("/api/videos", videoRouter);

// Middleware xử lý cho những route không tồn tại (404 Not Found)
app.use((req, res) => {
    res.status(404).json({
        message: "API không tồn tại!"
    });
});

// Khởi động server
app.listen(port, () => {
    console.log(`Server đang hoạt động tại : http://localhost:${port}`);
});