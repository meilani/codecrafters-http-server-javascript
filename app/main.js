const net = require("net");
const fs = require("fs");
const zlib = require('zlib'); 
const pathN = require('path');

function sanitizePath (url, baseDir) {
    url = url.replace(/%2e/ig, '.')
    url = url.replace(/%2f/ig, '/')
    url = url.replace(/%5c/ig, '\\')
    url = url.replace(/^[\/\\]?/, '/')
    url = url.replace(/[\/\\]\.\.[\/\\]/, '/')

    url = pathN.normalize(url).replace(/\\/g, '/')

    if (!url.startsWith(baseDir)) return false;

    return url;
}

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");
// Uncomment this to pass the first stage
const server = net.createServer((socket) => {

    socket.on('data', data => { 
        data = data.toString()
        const dataArr = data.split(/[\r\n]+/)
        let req = dataArr[0].split(' ')
        let method = req[0]
        let path = pathN.normalize(req[1])
        const argDirectory = (process.argv.includes('--directory')) ? process.argv[process.argv.indexOf('--directory') + 1] : '';
        
        const dataObj = {}
        for (let i = 1; i < dataArr.length; i++) {
            let newProp = dataArr[i].split(':')
            if (newProp.length == 2) {
                dataObj[newProp[0].toString()] = newProp[1].trim()
            }
        }
        let contentType = dataObj['Content-Type'] || 'text/plain'
        const acceptEncoding = dataObj['Accept-Encoding']

        if (method === 'GET') {

            if (path.startsWith('/files/')) {
                
                try {
                    let fileName = sanitizePath(`${argDirectory}${path.slice(7)}`, '/tmp')
                    const stats = fs.statSync(fileName);
                    contentType = "application/octet-stream"

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

                if (acceptEncoding && acceptEncoding.includes('gzip')) {
                    let zipBody = zlib.gzipSync(resBody)
                    socket.write(
                        `HTTP/1.1 200 OK\r\nContent-Type: ${contentType}\r\nContent-Encoding: gzip\r\nContent-Length: ${zipBody.length}\r\n\r\n`
                    );  
                    socket.write(zipBody)
                                    
                } else {
                    socket.write(
                        `HTTP/1.1 200 OK\r\nContent-Type: ${contentType}\r\nContent-Length: ${contentLength}\r\n\r\n${resBody}`
                    );
                }
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
                let fileName = sanitizePath(`${argDirectory}${path.slice(7)}`, '/tmp')
                let reqBody = dataArr[dataArr.length-1]
                try {
                    fs.writeFile(pathN.normalize(fileName), reqBody, (err) => {
                        if (err)
                          console.error(err);
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

    socket.on("close", () => {
        socket.end();
    });
});

server.listen(4221, "localhost");
