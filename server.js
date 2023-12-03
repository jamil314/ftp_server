const http = require('http');
const fs = require('fs');
const root = '.';
const PORT = 314;



const server = http.createServer((req, res) => {

	let {method, url} = req;
	const {host} = req.headers;
	
	url = url.replaceAll("%20", " ");

	let entry = {
		'clientIp' : req.socket.remoteAddress,
		'time' : new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" } ),
		'method' : method,
		'url' : url,
		'resCode' : 444,
	}

    if(method != "GET") {
		reply ( res, 405 );
		entry.resCode = 405;
		log (entry);
        return;
    }

	if(url == '//log.txt' || url == '//server.js'){
		reply ( res, 403 );
		entry.resCode = 403;
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
				files.sort();
				files.forEach((file) => {
					fileCount++;
					const fileUrl = `"http://${host}${url}/${file}"`;
					result += `<li> 
						<a href = ${fileUrl} download> <button> ${downloadIcon} </button> </a>
						<a href = ${fileUrl}> ${file} </a>
					</li>`;
				});

				result += "</ol> <h3> ~~~~~~~~~~~~~~~ End of List ~~~~~~~~~~~~~~~~~~~~~  </h3> </div>"
				res.end(fileCount? result : "<h1> Empty Directory </h1>");

				entry.resCode = 200;
				log (entry);
				
				return;    
			});


		} else if(stats.isFile()) {

			const {range} = req.headers;
			const total = stats.size;
			let readStream = fs.createReadStream(filePath);
			
			if (range) {
				const[partialstart, partialend] =  range.replace(/bytes=/, "").split("-");
				const start = parseInt(partialstart, 10);
				const end = partialend ? parseInt(partialend, 10) : total-1;
				const chunksize = (end-start)+1;
				readStream = fs.createReadStream(filePath, {start: start, end: end});
				
				res.writeHead(206, {
					'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
					'Accept-Ranges': 'bytes', 'Content-Length': chunksize,
				});
		
			} else {
				res.writeHead(200, { 'Content-Length': total });
			}

			readStream.pipe(res);
			
			readStream.on('close', () => {
				entry.resCode = 200;
				log (entry);
			})
			
			readStream.on("error", err => {
				if(err.code == 'EACCES') {
					reply ( res, 401 );
					entry.resCode = 401;
					log (entry);
				} else if( err.code == 'ENOENT' ) {
					reply ( res, 404 );
					entry.resCode = 404;
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

const downloadIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 52 52" xml:space="preserve"><path d="M48.5 31h-3c-.8 0-1.5.7-1.5 1.5v10c0 .8-.7 1.5-1.5 1.5h-33c-.8 0-1.5-.7-1.5-1.5v-10c0-.8-.7-1.5-1.5-1.5h-3c-.8 0-1.5.7-1.5 1.5V46c0 2.2 1.8 4 4 4h40c2.2 0 4-1.8 4-4V32.5c0-.8-.7-1.5-1.5-1.5z"/><path d="M25 37.6c.6.6 1.5.6 2.1 0l13.5-13.5c.6-.6.6-1.5 0-2.1l-2.1-2.1c-.6-.6-1.5-.6-2.1 0l-5.6 5.6c-.6.6-1.7.2-1.7-.7V3.5C29 2.7 28.2 2 27.5 2h-3c-.8 0-1.5.7-1.5 1.5v21.2c0 .9-1.1 1.3-1.7.7l-5.6-5.6c-.6-.6-1.5-.6-2.1 0L11.5 22c-.6.6-.6 1.5 0 2.1L25 37.6z"/></svg>`