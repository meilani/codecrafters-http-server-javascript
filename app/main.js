const net = require("net");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {

    socket.on('data', data => { 
        const dataArr = data.split(/[\r\n]+/)
        let req = dataArr[0].split(' ')
        let path = req[1]
        const dataObj = {}
        for (let i = 1; i < dataArr.length; i++) {
            let newProp = dataArr[i].split(':')
            if (newProp.length == 2) {
                dataObj[newProp[0]] = newProp[1].trim()
            }
        }

        if (path.startsWith('/echo/')) {
            let resBody = path.slice(6);
            let contentLength = res.length;
            socket.write(
                `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${contentLength}\r\n\r\n${resBody}`
            );
        } else if (path.startsWith('/user-agent')) {
            let resBody = dataObj['User-Agent']
            let contentLength = resBody.length
            socket.write(
                `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${contentLength}\r\n\r\n${resBody}`
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
    });

    socket.setEncoding('utf8')

    socket.on("close", () => {
        socket.end();
    });
});

server.listen(4221, "localhost");
