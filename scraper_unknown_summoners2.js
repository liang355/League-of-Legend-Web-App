var base = 5;
//var base = 1;
//var base = 2;
//var base = 3;
//var base = 4;
//var base = 5;
//var base = 6;
//var base = 7;
//var base = 8;
//var base = 9;
//var base = 10;

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
var SummonerNew = require('./models/summonerNew.js');
var ChampionStatisticsNew = require('./models/championstatisticsNew.js');


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
    try {


        ChampionStatisticsNew.find({tier: summonerID}, function (err, champStats) {
            if (champStats == null) {
                console.log("updateChampionStatistics, none to update.");
                return;
            }
            else {
                console.log("updateChampionStatistics, " + champStats.length + " to update.");
                /*if(champStats.length==0){
                    Summoner.remove({sID:summonerID}, function(err){

                        if(err){
                            console.log(printERR+"updateChampionStatistics, err="+err);
                        }
                        else{
                            console.log("summoner removed.");
                        }
					});
                }*/
            }
            for (var c = 0; c < champStats.length; c++) {
                champStats[c].tier = tier;
                champStats[c].save();
            }
        });
    }
    catch(e){
        console.log(printERR+"updateChampionStatistics, "+e);
    }

};

var resolveUnknownPlayerTiers = function(currTier){
    var err = false;
    try {


        SummonerNew.findOne({tier: 404, matchTier:currTier}, function (err, summoners) {
            //console.log(summoners.length);
            if (summoners == null) {
                console.log(printLog + "summoners == null");
                return;
            }
			//var randSummoner = Math.floor(Math.random()*summoners.length);
            //var summonerID = summoners[randSummoner]['sID'];
            var summonerID = summoners['sID'];

            var api_key = config.api_key1;
            var region = "na";
            var host = "https://na.api.pvp.net";
            var matchPath = "/api/lol/" + region + "/v2.5/league/by-summoner/" + summonerID + "?api_key=";

            //send API request
            https.get(host + matchPath + api_key, function (response) {
                var statusCode = response.statusCode;
                var output = '';
                response.on("data", function (chunk) {
                    output += chunk;

                    //console.log(output);
                });
                response.on("end", function () {
                    if (statusCode == 200) {
                        var obj = JSON.parse(output);
						var tier;
						var division;
						var numeric;
						for(var q=0; q<obj[summonerID].length; q++){
							if(obj[summonerID][q]['queue']=="RANKED_SOLO_5x5"){
                                var p=0;
                                for(var p=0; p<obj[summonerID][q]['entries'].length; p++){
                                    if(obj[summonerID][q]['entries'][p]['playerOrTeamId'] == summonerID){
                                        console.log("summoner found");
                                        break;
                                    }
                                }
								tier = obj[summonerID][q]['tier'];
								division = obj[summonerID][q]['entries'][p]['division'];
								numeric = tierN[tier] + divisionN[division];
							}
						}
                        

                        console.log(printLog + summonerID + " " + tier + "_" + division);
                        //update db
                        //summoners[randSummoner]['tier'] = numeric;
                        //summoners[randSummoner].save(function(err){
						summoners['tier'] = numeric;
                        summoners.save(function(err){
                            if(err){
                                console.log(printERR+"resolveUnknownPlayerTiers, err="+err);
                            }
                        });

                        updateChampionStatistics(summonerID, numeric);
                    }
                    else if ((statusCode == 500) || (statusCode == 503)) {
                        console.log(printERR + "err: 500, 503, internal server err, or service unavalible.");
                    }
                    else if (statusCode == 429) {
                        console.log(printERR + "err: 429, rate limit exceded");
                    }
                    else {
                        console.log(printERR + "err: 400, 401, 404, bad request, setting tier to 42");
                        //summoners[randSummoner]['tier'] = 42;
                        //[randSummoner].save();
						summoners['tier'] = 42;
                        summoners.save();
                    }

                });

            });
        });
    }
    catch(e){
        console.log(printERR+"resolveUnknownPlayerTiers, "+e);
    }
};






var mainLoop = function(){
    var currTier = base;

    var mainLoopInterval = setInterval(function(){
        resolveUnknownPlayerTiers(currTier);
        currTier += 10;
        if(currTier >27){
            currTier = base;
        }
    },2001);

};

mainLoop();

