# HƯỚNG DẪN TẠO MONGOOSE MODEL TỪ FILE JSON (TỰ ĐỘNG & THỦ CÔNG)

Tài liệu này được biên soạn dành riêng cho môn **SDN302 (Server-Side Development with Node.js & MongoDB)** tại Đại học FPT, phục vụ các bài thực hành và kỳ thi Practical Exam (PE).

---

## PHẦN 1: SỬ DỤNG TOOL TỰ ĐỘNG (`generate-models.js`)

File `generate-models.js` được viết hoàn toàn bằng **Node.js thuần (built-in modules: `fs`, `path`)**, **KHÔNG yêu cầu cài đặt thêm bất kỳ thư viện nào** (đảm bảo tuân thủ tuyệt đối quy chế thi không tải thêm thư viện).

### 1. Tính năng của Tool:

- Tự động quét tất cả file `.json` trong thư mục dữ liệu đề cho (ví dụ: `SDN302_given/`).
- Tự động nhận diện định dạng **MongoDB Extended JSON** (`$oid`, `$date`, `$numberInt`, ...).
- Tự động ánh xạ `ObjectId` sang kiểu `mongoose.Schema.Types.ObjectId`.
- Tự động phát hiện trường khóa ngoại liên kết (ví dụ: `studentId` -> `ref: 'Student'`, `subjectId` -> `ref: 'Subject'`, `classId` -> `ref: 'Class'`).
- Tự động nhận diện mảng con (**Subdocument array**) như mảng `enrollments` bên trong `Class`.
- Tự động chuẩn hóa tên Model (số ít, PascalCase: `Student`, `Class`) và tên Collection khớp chính xác với database (`students`, `classes`).

### 2. Cách chạy Tool:

Mở Terminal / PowerShell tại thư mục bài làm và gõ một trong các lệnh sau:

#### Cách 1: Chạy mặc định (Tool tự tìm thư mục chứa JSON và xuất vào `resource/model`):

```bash
node generate-models.js
```

#### Cách 2: Chỉ định rõ đường dẫn thư mục nguồn và thư mục đích:

```bash
node generate-models.js ./SDN302_given ./resource/model
```

#### Cách 3: Chỉ tạo Model cho 1 file JSON cụ thể:

```bash
node generate-models.js ./SDN302_given/students.json ./resource/model
```

---

## PHẦN 2: HƯỚNG DẪN TẠO MODEL THỦ CÔNG (KHI KHÔNG CHẠY ĐƯỢC TOOL)

Nếu máy tính trong phòng thi bị hạn chế hoặc bạn muốn tự tay viết để hiểu bản chất, hãy làm theo các bước chuẩn sau đây.

### Bước 1: Mở và phân tích file `.json` đề bài cho

Dữ liệu MongoDB export ra thường ở dạng mảng các object. Quan sát 1 phần tử mẫu trong từng file:

#### 1. Bảng quy đổi kiểu dữ liệu từ JSON sang Mongoose:

| Dữ liệu thực tế trong file `.json`                          | Kiểu dữ liệu trong Mongoose Schema                         | Ghi chú                     |
| :---------------------------------------------------------- | :--------------------------------------------------------- | :-------------------------- |
| `"anvn@fpt.edu.vn"`                                         | `type: String`                                             | Chuỗi văn bản               |
| `3` hoặc `4.5`                                              | `type: Number`                                             | Số nguyên hoặc số thực      |
| `true` hoặc `false`                                         | `type: Boolean`                                            | Giá trị logic               |
| `{"$date": "2026-01-06T00:00:00.000Z"}` hoặc `"2026-01-06"` | `type: Date`                                               | Kiểu ngày tháng             |
| `{"$oid": "65dd00000000000000000001"}`                      | `type: mongoose.Schema.Types.ObjectId`                     | ID tham chiếu               |
| Trường kết thúc bằng `...Id` (ví dụ `studentId`)            | `{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }` | Khóa ngoại có quan hệ `ref` |
| Mảng đối tượng con `[ { studentId, status } ]`              | `[{ _id: false, studentId: ..., status: ... }]`            | Mảng Subdocument            |

---

### Bước 2: Khung chuẩn (Template) cho một file Mongoose Model

Một file Model chuẩn mực gồm 4 phần:

```javascript
const mongoose = require("mongoose");

// 1. Khai báo Schema
const exampleSchema = new mongoose.Schema(
  {
    // Các trường dữ liệu ở đây
  },
  {
    // 2. Options cực kỳ quan trọng trong thi PE:
    timestamps: false, // Tắt tự động thêm createdAt, updatedAt nếu DB không có
    versionKey: false, // Tắt trường __v
  },
);

// 3. Export model:
// Tham số 1: Tên Model (PascalCase, số ít, e.g. 'Student')
// Tham số 2: Schema tương ứng
// Tham số 3: BẮT BUỘC ghi tên Collection chính xác trong MongoDB (ví dụ: 'students')
module.exports = mongoose.model("Example", exampleSchema, "examples");
```

> **LƯU Ý CỰC KỲ QUAN TRỌNG:** Luôn truyền **tham số thứ 3** vào `mongoose.model('ModelName', schema, 'collection_name_thực_tế')`. Nếu không truyền tham số thứ 3, Mongoose sẽ tự động biến đổi tên thành số nhiều dạng tiếng Anh (ví dụ: `Class` -> `classes`), nếu Mongoose biến đổi sai quy tắc thì truy vấn sẽ ra mảng rỗng `[]`!

---

### Bước 3: Chi tiết viết thủ công từng Model của đề bài này

#### 1. File `Student.js` (từ `students.json`)

File `students.json` có dạng:

```json
{
  "_id": { "$oid": "65dd00000000000000000001" },
  "studentCode": "SE001",
  "fullName": "Nguyen Van An",
  "email": "anvn@fpt.edu.vn"
}
```

=> Viết file `resource/model/Student.js`:

```javascript
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    studentCode: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

module.exports = mongoose.model("Student", studentSchema, "students");
```

---

#### 2. File `Subject.js` (từ `subjects.json`)

File `subjects.json` có dạng:

```json
{
  "_id": { "$oid": "65aa00000000000000000001" },
  "code": "PRJ301",
  "name": "Project Management",
  "credits": 3,
  "status": "ACTIVE"
}
```

=> Viết file `resource/model/Subject.js`:

```javascript
const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    credits: { type: Number, required: true },
    status: { type: String, required: true },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

module.exports = mongoose.model("Subject", subjectSchema, "subjects");
```

---

#### 3. File `Class.js` (từ `classes.json`)

File `classes.json` có dạng:

```json
{
  "_id": { "$oid": "65bb00000000000000000001" },
  "className": "SE1701",
  "subjectId": { "$oid": "65aa00000000000000000001" },
  "lecturerName": "Dr. Nguyen Minh Tuan",
  "status": "OPEN",
  "enrollments": [
    {
      "studentId": { "$oid": "65dd00000000000000000001" },
      "status": "enrolled"
    }
  ]
}
```

=> Viết file `resource/model/Class.js`:

```javascript
const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    className: { type: String, required: true, unique: true },
    // Liên kết tới Subject qua subjectId
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    lecturerName: { type: String, required: true },
    status: { type: String, required: true },
    // Mảng enrollments chứa studentId và status
    enrollments: [
      {
        _id: false, // Không cần tự sinh _id cho phần tử trong mảng này
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
          required: true,
        },
        status: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

module.exports = mongoose.model("Class", classSchema, "classes");
```

---

#### 4. File `Attendance.js` (từ `attendances.json`)

File `attendances.json` có dạng:

```json
{
  "_id": { "$oid": "65cc00000000000000000001" },
  "studentId": { "$oid": "65dd00000000000000000001" },
  "classId": { "$oid": "65bb00000000000000000001" },
  "date": { "$date": "2026-01-06T00:00:00.000Z" },
  "status": "PRESENT"
}
```

=> Viết file `resource/model/Attendance.js`:

```javascript
const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    date: { type: Date, required: true },
    status: { type: String, enum: ["PRESENT", "ABSENT"], required: true },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

module.exports = mongoose.model("Attendance", attendanceSchema, "attendances");
```

---

## PHẦN 3: BÍ QUYẾT & CÁC LỖI THƯỜNG GẶP TRONG BÀI THI PE

1. **Lỗi `CastError: Cast to ObjectId failed for value "..."`**:
   - **Nguyên nhân:** Người dùng truyền chuỗi ID không đúng định dạng ObjectId (ví dụ: `123`, `abc`) vào `req.params`. Mongoose cố tìm trong DB sẽ gây văng lỗi `CastError`.
   - **Cách khắc phục:** Luôn kiểm tra trước bằng:
     ```javascript
     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
       return res.status(400).json({ message: "Invalid ID" });
     }
     ```
   - _Đặc biệt lưu ý:_ Trong Requirement 3 của đề bài này, đề ghi rõ `return HTTP 300 if the ObjectId is invalid`. Hãy trả về `res.status(300)` đúng như đề chỉ thị.

2. **Lỗi `populate()` trả về `null`**:
   - **Nguyên nhân 1:** Tên `ref` trong Schema không trùng với tên Model lúc đăng ký (`'Student'` vs `'student'` hoặc `'Students'`).
   - **Nguyên nhân 2:** Dữ liệu trong database bị sai ObjectId không tồn tại bên collection được tham chiếu.
   - **Cách kiểm tra:** Luôn đảm bảo `ref: 'Student'` khớp chính xác với `mongoose.model('Student', ...)`.

3. **Lỗi `populate` 2 cấp lồng nhau**:
   - Khi lấy điểm danh của sinh viên, từ `Attendance` liên kết sang `Class`, và từ `Class` lại liên kết sang `Subject` để lấy `subjectName`:
     ```javascript
     const records = await Attendance.find({ studentId })
       .populate({
         path: "classId",
         populate: { path: "subjectId" },
       })
       .sort({ date: -1 });
     ```

4. **Lỗi `.env` không nhận khi chấm thi**:
   - Khi PEA Client chạy test, thư mục làm việc hiện tại (`process.cwd()`) có thể là thư mục cha hoặc thư mục gốc chứ không phải thư mục `resource`.
   - Do đó, trong `server.js` và `db.js` luôn truyền đường dẫn tuyệt đối:
     ```javascript
     const path = require("path");
     require("dotenv").config({ path: path.join(__dirname, ".env") });
     ```
   - Đồng thời luôn đặt fallback cho biến môi trường:
     ```javascript
     const MONGO_URI =
       process.env.MONGO_URI || "mongodb://127.0.0.1:27017/Assignment3";
     const PORT = process.env.PORT || 9999;
     const JWT_SECRET = process.env.JWT_SECRET || "ma-sinh-vien";
     ```

---

_Chúc bạn thi tốt và đạt điểm tối đa!_
