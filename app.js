// const http = require('http');
// http.createServer((req, res) => {
//   res.writeHead(200, {'Content-Type': 'text/plain'});
//   res.end('Hello World!');
// }).listen(8080);

//Arrow function
const add = (a,b) => a + b;
const user = {
    name: 'Israel Alalibo',
    age: 20,
    greet(){
        console.log('Hi my name is',this.name, '\n');
    }
}
//user.greet();
//console.log(add(3, 7), '\n');

const fs = require('fs');
fs.readFile('text.txt', 'utf-8', (err, data) => {
    if (err) throw err;
    console.log(data, '\n');
});

console.log('All arguments', process.argv);