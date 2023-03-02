const http = require('http');
const fs = require('fs');
const root = 'files';
const PORT = 3000;



const server = http.createServer((req, res) => {
	
	const {method, url} = req;
	
	let entry = {
		'clientIp' : req.socket.remoteAddress,
		'time' : new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" } ),
		'method' : method,
		'url' : url,
		'resCode' : 444,
	}

	while( entry.url != "" && entry.url[0] == '/')
		entry.url = entry.url.slice(1);

    if(method != "GET") {
		reply ( res, 405 );
		entry.resCode = 405;
		log (entry);
        return;
    }

	const filePath =  root + url ;
	
	fs.stat(filePath, (err, stats) => {
		if ( err ) {
			if( err.code == 'ENOENT' ) {
				reply ( res, 404 );
				entry.resCode = 404;
				log (entry);
			} else {
				reply ( res, 500 );
				entry.resCode = 500;
				log (entry);
			}
		} else if(stats.isDirectory()) {

			entry.url += "/";

			fs.readdir(filePath, (err, files) => {

				if (err) {
					if(err.code == 'EACCES') {
						reply ( res, 401 );
						entry.resCode = 401;
						log (entry);
					} else {
						reply ( res, 500 );
						entry.resCode = 500;
						log (entry);
					}
					return;
				} 
	
				let result = "<div> <h1>Files on this directory: </h1> <ol> ";
				let fileCount = 0;
				files.forEach((file) => {
					fileCount++;
					result += `<li> <a href = "http://localhost:3000/${url}/${file}"> ${file} </a> </li>`;
				});

				result += "</ol> <h3> ~~~~~~~~~~~~~~~ End of List ~~~~~~~~~~~~~~~~~~~~~  </h3> </div>"
				res.end(fileCount? result : "<h1> Empty Directory </h1>");

				entry.resCode = 200;
				log (entry);
				
				return;    
			});


		} else if(stats.isFile()) {
			const readStream = fs.createReadStream( filePath );
			
			readStream.pipe(res);
			
			readStream.on('open', () => {
				res.setHeader('Content-Length', stats.size);
			})

			readStream.on('close', () => {
				entry.resCode = 200;
				log (entry);
			})

			readStream.on("error", err => {
				if(err.code == 'EACCES') {
					reply ( res, 401 );
					entry.resCode = 401;
					log (entry);
				} else {
					reply ( res, 500 );
					entry.resCode = 500;
					log (entry);
				}
				return;
			})

		} else {
			reply ( res, 400 );
			entry.resCode = 400;
			log (entry);
		}
	})
});

const resMessage = {
	400 : 'Bad request !! Requested resource is neither a file nor a directory.',
	401 : 'Unauthorized content !!',
	404 : 'Content not found !!',
	405 : `Invalid Request Method !! only "GET" is valid.`,
	500 : 'Unknown error',
}

const reply = (res, resCode) => {
	res.statusCode = resCode;
	res.end(resMessage[resCode]);
}

const log = ( entry ) => {
	fs.appendFile('log.txt', 
		 		entry.time.padEnd(25, ' ')
		+ "| " +entry.clientIp.padEnd(25, ' ')
		+ "| " +entry.method.padEnd(10, ' ')
		+ "| " +`${entry.resCode}`.padEnd(5, ' ')
		+ "| " +entry.url
		+"\n"
	, err => {
		if(err){
			console.log(err);
		}
	})
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

