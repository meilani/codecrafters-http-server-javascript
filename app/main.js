const net = require("net");
const fs = require("fs");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");
// Uncomment this to pass the first stage
const server = net.createServer((socket) => {

    socket.on('data', data => { 
        const dataArr = data.split(/[\r\n]+/)
        let req = dataArr[0].split(' ')
        let method = req[0]
        let path = req[1]
        const argDirectory = (process.argv.includes('--directory')) ? process.argv[process.argv.indexOf('--directory') + 1] : '';
        
        const dataObj = {}
        for (let i = 1; i < dataArr.length; i++) {
            let newProp = dataArr[i].split(':')
            if (newProp.length == 2) {
                dataObj[newProp[0].toString()] = newProp[1].trim()
            }
        }

        const contentType = dataObj['Content-Type'] || 'text/plain'
        const acceptEncoding = dataObj['Accept-Encoding']


        if (method === 'GET') {

            if (path.startsWith('/files/')) {
                let fileName = `${argDirectory}${path.slice(7)}`
                try {
                    const stats = fs.statSync(fileName);
                    fs.readFile(fileName, 'utf8', function(err, data) {
                        socket.write(
                            `HTTP/1.1 200 OK\r\nContent-Type: ${contentType}\r\nContent-Length: ${stats.size}\r\n\r\n${data}`
                        );
                    })
                } catch (err) {
                    if (err.code === "ENOENT") {
                        socket.write(
                        'HTTP/1.1 404 Not Found\r\n\r\n'
                        );
                    } 
                    console.error(err);
                }
            } else if (path.startsWith('/echo/')) {
                let resBody = path.slice(6);
                let contentLength = resBody.length;
                let res = `HTTP/1.1 200 OK\r\nContent-Type: ${contentType}\r\n`
                if (acceptEncoding === 'gzip') {
                    res += `Content-Encoding: gzip\r\n`
                } 
                res += `Content-Length: ${contentLength}\r\n\r\n${resBody}`
                socket.write(res);
            } else if (path.startsWith('/user-agent')) {
                let resBody = dataObj['User-Agent']
                let contentLength = resBody.length
                socket.write(
                    `HTTP/1.1 200 OK\r\nContent-Type: ${contentType}\r\nContent-Length: ${contentLength}\r\n\r\n${resBody}`
                );
            }   else if (path === '/') {
                socket.write(
                    'HTTP/1.1 200 OK\r\n\r\n' 
                );
            }  else {
                socket.write(
                    'HTTP/1.1 404 Not Found\r\n\r\n'
                );
            }
        } else if (method === 'POST') {
            if (path.startsWith('/files/')) {
                let fileName = `${argDirectory}${path.slice(7)}`
                let reqBody = dataArr[dataArr.length-1]
                try {
                    fs.writeFile(fileName, reqBody, (err) => {
                        if (err)
                          console.log(err);
                        else {
                          socket.write(
                            'HTTP/1.1 201 Created\r\n\r\n'
                          );
                        }
                    });
                } catch (err) {
                    if (err.code === "ENOENT") {
                        socket.write(
                        'HTTP/1.1 404 Not Found\r\n\r\n'
                        );
                    } 
                    console.error(err);
                }
            }
        }
    });

    socket.setEncoding('utf8')

    socket.on("close", () => {
        socket.end();
    });
});

server.listen(4221, "localhost");
