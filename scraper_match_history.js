//modules
var express = require('express');
var mongoose = require('mongoose');
var https = require('https');

//config
var config = require("./config/config");

//app
var app = express();

//connect to database
mongoose.connect(config.db_uri);

/** MONGOOSE EXAMPLE **/
var Match = require('./models/match.js');
var Summoner = require('./models/summoner.js');


/* pretty print statement codes */
var printERR    = "[ERROR CODE]    :";
var printLog    = "[LOG]           :";





var findOneAdd = function (matchID, mapID, queueType, tier){
    Match.findOne({'id':matchID}, function(err, match){
        if(match == null){
            console.log(printLog+"match added, matchID:"+matchID);
            Match.create({id:matchID, tier:tier, hasBeenQueried:false});
        }
        else{
            console.log(printLog+"match not added, already in DB");
        }
    });
};

// (3) parse matches and store ones that are not already in DB
var addMatchesToDB = function(matches, tier){
    var err = false;
    //var matchID;

    try{

        for(var i=0; i<matches['matches'].length; i++){
            var matchID = matches['matches'][i]['matchId'];
            var mapID = matches['matches'][i]['mapId'];
            var queueType = matches['matches'][i]['queueType'];
            if(( mapID == 11) && (queueType == "RANKED_SOLO_5x5")){
                findOneAdd(matchID, mapID, queueType, tier);
            }
            else{
                console.log(printLog+"match not added, mapID:"+mapID+", queueType:",queueType);
            }
        }
    }
    catch(e){
        err = true;
        console.log(printERR+" addMatchesToDB, "+e);
    }
    return err;
};

// (2) make request to API for recent matches
var queryForRecentMatches = function(summonerID, tier, callback){
    var err = false;
    //construct API request
    var api_key = config.api_key;
    var region = "na";
    var host = "https://na.api.pvp.net";
    console.log("summonerID = "+summonerID);

    if(summonerID == 0){
        console.log("error with nextSummoner(), returned 0");
        err = true;
        return err;
    }

    var matchPath = "/api/lol/"+region+"/v2.2/matchhistory/"+summonerID+"?api_key=";

    //send API request
    https.get(host + matchPath + api_key, function(response){
        var statusCode = response.statusCode;
        var output = '';
        response.on("data", function(chunk){
            output += chunk;
        });
        response.on("end", function(){
            if(statusCode == 200){
                var obj = JSON.parse(output);
                addMatchesToDB(obj, tier);
            }
            else if((statusCode==500)||(statusCode==503)) {
                console.log(printERR + "err: 500, 503, internal server err, or service unavalible.");
                err = true;
            }
            else if(statusCode == 429){
                console.log(printERR + "err: 429, rate limit exceded");
                err = true;
            }
            else{
                console.log(printERR + "err: 400, 401, 404, bad request, setting tier to 42");
                err = true;
            }
        });

    });

    callback(err);
};

// (1) find next player based on currTier
var findRecentMatches = function(tier, nummatchhistorys){
    var err = false;
    var summonerID = 0;
    try{
        //look up next summoners by tier from DB
        Summoner.findOne({'tier':tier, 'lastQueried':null}, function(error, summoner) {
            //console.log(summoner);
            if(summoner == null){
                console.log(printLog+"findRecentMatches, summoner==null.");
                return;
            }

            summonerID = summoner['sID'];

            var currTier = summoner['tier'];

            err = queryForRecentMatches(summonerID, currTier, function(err){
                if(!err){
                    var d = new Date();
                    var n = d.getTime();
                    summoner['lastQueried'] = n;
                    summoner.save();
                }
            });

            if (error) {
                console.log(printERR + "findRecentMatches, "+next(error));
                err = true;
            }
        });
    }
    catch(e){
        console.log(printERR+" find recent matches, e="+e);
    }


    return err;
};



var mainLoop = function(){
    var currTier =1;

    var mainLoopInterval = setInterval(function(){
        console.log(printLog+"tier="+currTier);
        findRecentMatches(currTier);
        currTier++;
        if(currTier>27){
            currTier = 1;
        }
    },6001);

};

mainLoop();

