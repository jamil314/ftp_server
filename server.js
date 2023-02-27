const http = require('http');
const fs = require('fs');
const path = require('path');
const root = '../../../jamil/public';

const ContentType = {
	'.txt' : 'text/plain',
	'.html' : 'text/html',
	'.js' : 'text/javascript',
	'.css' : 'text/css',
	'.png' : 'image/png',
	'.jpg' : 'image/jpg',
	'.jpeg' : 'image/jpeg',
	'.webp' : 'image/webp',
	'.gif' : 'image/gif',
	'.mp4' : 'video/mp4',
}

const getType = (ext) => {
	console.log(ext, ContentType[ext]);
	return ContentType[ext] ;
}

const reply = (res, resCode, message, note, clientIp, reqURL, reqMethod, fileSize, fileType) => {

	console.log(resCode, message, clientIp, reqMethod, reqURL);
	

	fs.appendFile(root + '/log.txt', 
		reqMethod.padEnd(10, ' ') + "| "
		+ reqURL.padEnd(35, ' ') + "| "
		+ clientIp.padEnd(25, ' ') + "| "
		+ ( resCode.toString() ).padEnd(5, ' ') + "| "
		+ note.padEnd(25, ' ') + "| "
		+ ((fileSize || "Unknown ") + " bytes").padEnd(15, ' ') + "| "
		+ (fileType || "Unknown" ).padEnd(20, ' ') 
		+ '\n'
	, err => {
		if( err ) {
			console.log( err );
			return;
		}
	});

	res.statusCode = resCode;

	if( resCode == 200) {

		res.setHeader('Content-Type', fileType || 'application/octet-stream');
		res.setHeader('Content-Length', fileSize);

		const readStream = fs.createReadStream(root + reqURL);
		readStream.pipe(res)

	} else res.end(message);

}

const server = http.createServer((req, res) => {

    const clientIp = req.socket.remoteAddress;
	const {method, url} = req;

	console.log(clientIp, method, url);

    if(method != "GET") {
		reply(res, 405, `Invalid Method: ${method} (Only 'GET' si valid)`, `Invalid Method`, clientIp, url, method);
        return;
    }

    if(req.url == "/") {
        fs.readdir(root, (err, files) => {

            if (err) {
				console.log(err);
				reply(res, 500, err, 'Server Error', clientIp, 'Directory', method);
                return;
            } 

            let result = "Files that can be accessed from this directory: \n";
            files.forEach((file) => {
                result += file + "\n";
            });

			reply(res, 222, result, 'Directory Query', clientIp, 'Directory', method);
			return;    
		});
		return;
    }

    const filePath =  root + url ;
	
    fs.access(filePath, (err) => {
        if (err) {

			console.log(err);
			
			reply(res, 404, 'The requested resource can not be found in the server !! ', 'Resource not Found', clientIp, url, method);
			return;

        } else {  

			fs.stat(filePath, (err, stats) => {
				
				if (err) {
					console.log(err);
					reply(res, 500, err, 'Server Error', clientIp, 'Directory', method);
					return;
				} 

				const fileType = getType ( path.extname(filePath).toLowerCase() ) ;
				const fileSize = stats.size;
				
				reply(res, 200, '', 'OK', clientIp, url, method, fileSize, fileType);
			});
            
        }
    });
});

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

