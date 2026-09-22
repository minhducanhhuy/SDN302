const express = require('express');
const app = express();
const PORT = 3000;
//1. GET/api/students
//2. GET/api/students/:id
//3. POST/api/students
//4. PUT/api/students/:id
//5. DELETE/api/students/:id


app.use(express.json());
let students = [
    {
        id: 1,
        name: "Nguyen Van A",
        age: 20,
    },
    {
        id: 2,
        name: "Tran Thi B",
        age: 18,
    },
];
//tạo url đầu tiên
app.get('/', (req, res) => {
    res.send("Xin chào Express!")
})
//template literal của js:GET/app/students
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

//GET - lấy dữ liệu students
app.get("/api/students", (req, res) => {
    res.json(students);
});
//GET : Lấy student theo id
app.get("/api/students/:id", (req,res)=>{
    const id = Number(req.params.id);
    const student = students.find((student) => student.id===id);
    if(!student){
        return res.status(404).json({
            message:"Không tìm thấy sinh viên",
        });
    }
    return res.json(student);
});
//PORT : TẠO STUDENT MỚI
app.post("/api/students", (req,res)=>{
    const {name, age} = req.body;
    const newStudent = {
        id: students.length + 1,
        name: name,
        age: age
    };
    students.push(newStudent);
    res.status(201).json({
        message: "Tạo sinh viên thành công",
        data: newStudent,
    });
});
//PUT : CẬP NHẬT STUDENT 
app.put("/api/students/:id", (req, res) => {
    const id = Number(req.params.id);
    const { name, age } = req.body;
    const student = students.find((student) => student.id === id);
    if (!student) {
        return res.status(404).json({
            message: "Không tìm thấy sinh viên",
        });
    }
     student.name = name;
     student.age = age;

    res.json({
        message: "Cập nhật sinh viên thành công",
        data: student,
    });
});
//DELETE : XÓA STUDENT
app.delete("/api/students/:id", (req, res) => {
    const id = Number(req.params.id);
    const student = students.find((student) => student.id === id);
    if (!student) {
        return res.status(404).json({
            message: "Không tìm thấy sinh viên",
        });
    }
    
  const delStudent = students.splice(student,1);
  res.json({
        message: "Xóa sinh viên thành công",
        data: delStudent
    });
});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});