const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
        <h1>Welcome to my node.js server</h1>
        <p>This is a simple Node.js server.</p>
    `);
});
server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});

// demo xử lý với nhiều url khác nhau
//localhost:3000/                Đây là trang chủ
//localhost:3000/about           Đây là trang giới thiệu
//localhost:3000/contact         Đây là trang liên hệ
