const fs = require('fs');
const content = 'Hello, node.js! This is a sample text file created using fs.writeFile';

//writeFile("filename", "content", "encoding", "callback")
fs.writeFile('sample.txt', content, 'utf8', (err) => {
    if (err) {
        console.error('Error writing to file:', err);
    } else {
        console.log('File written successfully!');
    }
});