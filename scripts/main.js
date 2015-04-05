

/*an example of how we would make data requests through the HTTP server
 * we send a 'getJSON' request with the path = to the path of the data in
 * the rest server, the HTTP server will see that path, then make an
 * approprate HTTP-GET request to the DB server using that path, then
 * reply with the data it receives.
 */
function getStatsByMinute (tier, champion, lane, role){
    $.getJSON('http://127.0.0.1:1337/'+tier+'/'+champion+'/'+lane+'/'+role+'/', function(data){
        /*do something with data*/
        console.log("have received the following from the server: "+data);
    }).error(function(){ console.log("error occured durring 'getJSON' request"); });
}
