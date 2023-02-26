const http = require('http');
const fs = require('fs');
const path = require('path');
const root = '../../../jamil/public';

const getType = (ext) => {
    switch (ext.toLowerCase()) {
        case '.txt':
          return 'text/plain';
        case '.html':
          return 'text/html';
        case '.js':
          return 'text/javascript';
        case '.css':
          return 'text/css';
        case '.png':
          return 'image/png';
        case '.jpg':
        case '.jpeg':
          return 'image/jpeg';
        case '.webp':
            return 'image/webp';
        case '.gif':
          return 'image/gif';
        case '.mp4':
            return 'video/mp4';
        default:
          return 'application/octet-stream';
      }
}

const recordLog = (log) => {

    console.log(log);

    fs.appendFile(root + '/log.txt' , log + '\n', (err) => {
        if(err){
            console.log(err);
            return;
        }
    });
}

const server = http.createServer((req, res) => {

    const ip = req.socket.remoteAddress;

    if(req.url == "/") {
        fs.readdir(root, (err, files) => {
            if (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain');
                res.end('Server error');
                console.log(err);
                return;
            } 
            let result = "Files that can be accessed from this directory: \n";
            files.forEach((file) => {
                result += file + "\n";
            });
            console.log(result);
            res.end(result + "_________  End of list ____________");
          });
          return;
    }

    const filePath =  root + req.url ;

    console.log(req.url);
    console.log(filePath);

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {

            recordLog('url: ' + req.url + ", status code: " + 404 + ", client ip: " + ip);

            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain');
            res.end('File not found');

        } else {  

            fs.access(filePath, fs.constants.R_OK, (err) => {
                
                if (err) {

                    recordLog('url: ' + req.url + ", status code: " + 403 + ", client ip: " + ip);

                    res.statusCode = 403;
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('Forbidden');

                } else {

                    fs.stat(filePath, (err, stats) => {
                        if (err) {
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'text/plain');
                            res.end('Server error');
                        }
                      
                        const fileType = getType ( path.extname(filePath) );
                        const fileSize = stats.size;

                        recordLog('Url: ' + req.url + ", Type: " + fileType + ", Size: " + fileSize + " bytes, Status Code: " + 200 + ", client ip: " + ip);

                        res.statusCode = 200;
                        res.setHeader('Content-Type', fileType)
                        const readStream = fs.createReadStream(filePath);
                        readStream.pipe(res)
                
                      });

                }
            });
            
        }
    });
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
