/* HTTP Server for League Web App
 * Currently serves webpages, default is index.html */

/* http: for the server
 * url: for reading urls
 * fs: for reading the file system */
var http_ = require('http');
var url_ = require('url');
var fs_ = require('fs');


/* this is the function that will take care of
 * any server request */
function handleHttpRequest (request, response){
    try{
        /* my_path: requested path from url
         * full_path: dir where the server is running */
        var my_path = url_.parse(request.url).pathname;
        var full_path = process.cwd() + my_path.toLowerCase();

        /*
         * redirect to index.html if no file is requested
         */
        if(my_path== "/"){
            /* IMPORTANT: may need to change the '\\' to nothing or '/' depending on the file system*/
            full_path += '\\index.html';
        }

        /*
         * attempt to serve request
         */
        fs_.exists(full_path, function(exists){
            /* accessing file and it exists so send it */
            if(exists){
                /* everything worked fine */
                response.writeHeader(200);
                response.write(file, "binary");
                response.end();
            }
            /* possibly accessing DB */
            else if (my_path == "/letsAccessDataBase!"){
                try{
                    /*send db get request*/
                    http.get('http://databaseURL/', function(resp){
                        console.log('entering GET callback function for databaseURL');
                        var str = '';
                        /*concatinate the object response into a variable*/
                        resp.on('data', function(chunk){
                            console.log('recived data');
                            str += chunk;
                        });
                        /*when the whole object has been received, send it*/
                        resp.on('end', function(){
                            console.log('received all json data');
                            /* everything worked fine */
                            response.writeHeader(200, {"Content-Type": "application/json"});
                            response.write(str);
                            response.end();
                        })
                    })
                }
                catch (e){
                    /* something is incorrect about request URL */
                    response.writeHeader(404, {"Content-Type": "text/plain"});
                    response.write("404 Not Found\n");
                    response.end();
                }
            }
        });
    }
    catch(e){
        /* server error occured */
        response.writeHeader(500, {"Content-Type": "text/plain"});
        response.write(e + "\n");
        response.end();
    }

}

/* create a HTTP server at port 1337, send all requests to
 * the function 'handleHttpRequest' */
http_.createServer(handleHttpRequest).listen(1337, '127.0.0.1');
console.log('server running at localhost:1337');