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
var Summoner = require('./models/summoner.js');
var ChampionStatistics = require('./models/championstatistics.js');


/* pretty print statement codes */
var printERR    = "[ERROR CODE]    :";
var printLog    = "[LOG]           :";

var tiers = { 1:"CHALLENGER_I",
    2:"MASTER_I",
    3:"DIAMOND_I", 4:"DIAMOND_II", 5:"DIAMOND_III", 6:"DIAMOND_IV",7:"DIAMOND_V",
    8:"PLATINUM_I", 9:"PLATINUM_II",10:"PLATINUM_III", 11:"PLATINUM_IV", 12:"PLATINUM_V",
    13:"GOLD_I",14:"GOLD_II", 15:"GOLD_III", 16:"GOLD_IV", 17:"GOLD_V",
    18:"SILVER_I", 19:"SILVER_II", 20:"SILVER_III",21:"SILVER_IV", 22:"SILVER_V",
    23:"BRONZE_I", 24:"BRONZE_II",25:"BRONZE_III", 26:"BRONZE_IV", 27:"BRONZE_V"};

var tierN = {
    CHALLENGER:0,
    MASTER:1,
    DIAMOND:2,
    PLATINUM:7,
    GOLD:12,
    SILVER:17,
    BRONZE:22
};
var divisionN = {
    I:1,
    II:2,
    III:3,
    IV:4,
    V:5
};


var updateChampionStatistics = function(summonerID, tier){
    ChampionStatistics.find({tier:summonerID}, function(err, champStats) {
        if(champStats == null){
            console.log("updateChampionStatistics, none to update.")
            return;
        }
        else{
            console.log("updateChampionStatistics, "+champStats.length+" to update.")
        }
        for(var c=0; c<champStats.length; c++){
            champStats[c].tier = tier;
            champStats[c].save();
        }
    });

}

var resolveUnknownPlayerTiers = function(){
    var err = false;
    Summoner.findOne({tier:404}, function(err, summoners) {
        //console.log(summoners.length);
        if(summoners == null){
            console.log(printLog+"summoners == null");
            return;
        }
        var summonerID = summoners['sID'];

        var api_key = config.api_key;
        //var api_key = config.api_key3;
        var region = "na";
        var host = "https://na.api.pvp.net";
        var matchPath = "/api/lol/"+region+"/v2.5/league/by-summoner/"+summonerID+"?api_key=";

        //send API request
        https.get(host + matchPath + api_key, function(response){
            var statusCode = response.statusCode;
            var output = '';
            response.on("data", function(chunk){
                output += chunk;

                //console.log(output);
            });
            response.on("end", function(){
                if(statusCode == 200){
                    var obj = JSON.parse(output);
                    var tier = obj[summonerID][0]['tier'];
                    var division = obj[summonerID][0]['entries'][0]['division'];
                    var numeric = tierN[tier] + divisionN[division];

                    console.log(printLog+summonerID+" "+tier+"_"+division);
                    //update db
                    summoners['tier'] = numeric;
                    summoners.save();

                    updateChampionStatistics(summonerID, numeric);
                }
                else if((statusCode==500)||(statusCode==503)) {
                    console.log(printERR + "err: 500, 503, internal server err, or service unavalible.");
                }
                else if(statusCode == 429){
                    console.log(printERR + "err: 429, rate limit exceded");
                }
                else{
                    console.log(printERR + "err: 400, 401, 404, bad request, setting tier to 42");
                    summoners['tier'] = 42;
                    summoners.save();
                }

            });

        });
    });
};






var mainLoop = function(){
    var mainLoopInterval = setInterval(function(){
        resolveUnknownPlayerTiers();
    },6001);

};

mainLoop();

