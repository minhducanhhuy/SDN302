Nguyễn Minh Đức
HE194336

GET /articles
![alt text](image-1.png)
GET /articles/1
![alt text](image-2.png)
GET /articles/999
![alt text](image-3.png)

POST /articles/
![alt text](image-4.png)
POST /articles/ (thiếu dữ liệu)
![alt text](image-5.png)

PUT /articles/1
![alt text](image-7.png)
PUT /articles/999
![alt text](image-6.png)

DELETE /articles/1
![alt text](image-10.png)
DELETE /articles/999
![alt text](image-11.png)

GET /comments
![alt text](image-12.png)
GET /comments/1
![alt text](image-13.png)
GET /comments/999
![alt text](image-14.png)

POST /comments (articleID hợp lệ)
![alt text](image-15.png)
POST /comments  (articleID không tồn tại)
![alt text](image-16.png)

PUT /comments/1
![alt text](image-17.png)
PUT /comments/999
![alt text](image-18.png)

DELETE /comments/1
![alt text](image-19.png)
DELETE /comments/999
![alt text](image-20.png)

GET /articles/1/comments
![alt text](image-21.png)
GET /articles/999/comments
![alt text](image-22.png)