/* HTTP Server for League Web App
 * Currently serves webpages, default is index.html */

/* http: for the server
 * url: for reading urls
 * fs: for reading the file system */
var http_ = require('http');
var url_ = require('url');
var fs_ = require('fs');

http_.createServer(function(request, response){
    /* my_path: requested path from url*/
    var my_path = url_.parse(request.url).pathname;
    /* full_path: dir where the server is running */
    var full_path = process.cwd() + my_path.toLowerCase();
    var isIndexPage = false;

    /* redirect to index.html if no file is requested */
    try{
        if(my_path.length <= 1){
            /* IMPORTANT: may need to change the '\\' to nothing or '/' depending on the file system*/
            full_path += '\\index.html';
            isIndexPage = true;
        }
    }
    catch(e){}

    /* attempt to serve requested file */
    fs_.exists(full_path, function(exists){
        if(!exists){
            response.writeHeader(404, {"Content-Type": "text/plain"});
            response.write("404 Not Found\n");
            response.end();
            console.log('File not found: '+full_path);
        }
        else{
            fs_.readFile(full_path, "binary", function (error, file) {
                if(error){
                    response.writeHeader(500, {"Content-Type": "text/plain"});
                    response.write(error + "\n");
                    response.end();
                }
                else{
                    response.writeHeader(200);
                    response.write(file, "binary");
                    response.end();
                    if(isIndexPage){
                        console.log(full_path);
                    }
                }
            });
        }
    });

}).listen(1337, '127.0.0.1');
console.log('server running at localhost:1337');

