//Thực hiện định tuyến với các API
//Get: /api/users
//Get /api/users/:id
//post/put delete
const express = require("express");
const fs = require("fs").promises;
const path = require("path"); //xử lý đường dẫn file
//tạo 1 router riêng cho user
const router = express.Router();
//Đường dẫn file đến data.json
const DATA_FILE = path.join(__dirname, "../data.json");
//function : đọc dữ liệu từ file
async function readUsers() {
    try{
const data = await fs.readFile(DATA_FILE, "utf-8");
return JSON.parse(data);
    }catch(error){
        return [];
}
}
//function : ghi dữ liệu vào file
async function writeUsers(user) {
    await fs.writeFile(DATA_FILE, JSON.stringify(user, null, 2), "utf-8");
}
//API : GET/api/users : đọc tất cả dữ liệu của users
router.get("/", async (req, res) => {
    try{
        //đọc danh sách users từ data.json
        const users = await readUsers();
        //trả về 200 : ok
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }
})
//GET/api/users/:id : đọc 1 user
router.get("/:id", async (req, res) => {
    try {
        const userId = parseInt(req.params.id); 
        const users = await readUsers();
        const user = users.find((u) => u.id === userId);
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: "User không tồn tại" });
        }
    } catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }
})
//POST /api/users : thêm 1 user mới
router.post("/", async (req, res) => {  
    try {
        const { name, email } = req.body;
        if (!name || !email) {
            return res.status(400).json({ message: "Thiếu thông tin user" });
        }
        const users = await readUsers();
        const newUser = {
            id: users.length > 0 ? users[users.length - 1].id + 1 : 1,
            name,
            email,
        };

        users.push(newUser);
        await writeUsers(users);
        res.status(201).json(newUser);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }

})
//PUT /api/users/:id : cập nhật 1 user
router.put("/:id", async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { name, email } = req.body;
        if (!name || !email) {
            return res.status(400).json({ message: "Thiếu thông tin user" });
        }
        const users = await readUsers();
        const userIndex = users.findIndex((u) => u.id === userId);
        if (userIndex === -1) {
            return res.status(404).json({ message: "User không tồn tại" });
        }
        users[userIndex] = { ...users[userIndex], name, email };
        await writeUsers(users);
        res.status(200).json(users[userIndex]);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }
});
//DELETE /api/users/:id : xóa 1 user
router.delete("/:id", async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const users = await readUsers();
        const userIndex = users.findIndex((u) => u.id === userId);
        if (userIndex === -1) {
            return res.status(404).json({ message: "User không tồn tại" });
        }
        const deletedUser = users.splice(userIndex, 1)[0];
        await writeUsers(users);
        res.status(200).json(deletedUser);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }   
})
module.exports = useRouter;