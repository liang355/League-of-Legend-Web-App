/* scraper.js */

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
var Champion = require('./models/champion.js');
var Summoner = require('./models/summoner.js');
var Match = require('./models/match.js');
var ChampionStatistics = require('./models/championstatistics.js');

//harder for us to read, but easier to loop through
var tiers = [{tier:1,name:"challenger1"},
            {tier:2, name:"master1"},
            {tier:3, name:"diamond1"}, {tier:4, name:"diamond2"}, {tier:5, name:"diamond3"}, {tier:6, name:"diamond4"}, {tier:7, name:"diamond5"},
            {tier:8, name:"platinum1"}, {tier:9, name:"platinum2"}, {tier:10, name:"platinum3"}, {tier:11, name:"platinum4"}, {tier:12, name:"platinum5"},
            {tier:13, name:"gold1"}, {tier:14, name:"gold2"}, {tier:15, name:"gold3"}, {tier:16, name:"gold4"}, {tier:17, name:"gold5"},
            {tier:18, name:"silver1"}, {tier:19, name:"silver2"}, {tier:20, name:"silver3"}, {tier:21, name:"silver4"}, {tier:22, name:"silver5"},
            {tier:23, name:"bronze1"}, {tier:24, name:"bronze2"}, {tier:25, name:"bronze3"}, {tier:26, name:"bronze4"}, {tier:27, name:"bronze5"}];

//hand grabbed these from LoLKings leaderboards
var lolKingSeeds = [{name:"Turtle the Cat", tier:1},{name:"Westrice",tier:2},{name:"Dark Eggs",tier:3},
                    {name:"KMS",tier:4},{name:"ENTP",tier:5},{name:"YoWei",tier:6},
                    {name:"Tera",tier:7},{name:"Wisher",tier:8},{name:"MrLoLGuy",tier:9},
                    {name:"pinkoreos",tier:10},{name:"LoveMmm",tier:11},{name:"Fellini",tier:12},
                    {name:"AGARI",tier:13},{name:"Malagbo",tier:14},{name:"Chessgenius",tier:15},
                    {name:"Frankenberry",tier:16},{name:"Fourward",tier:17},{name:"Tickelly",tier:18},
                    {name:"BlackThorn95",tier:19},{name:"rainicorn",tier:20},{name:"superGODLIKE",tier:21},
                    {name:"Waterbendr",tier:22},{name:"Malaxeur",tier:23},{name:"Lorindia",tier:24},
                    {name:"PaddleBurger",tier:25},{name:"kevinco",tier:26},{name:"MinionSlayer",tier:27}];

//add summoners from lolking:
var addLoLKingSeeds = function(summonerData){
    for (var key in summonerData){
        var summoner = summonerData[key];
        console.log(summoner);
        Summoner.create({name:summoner.name, tier:summoner.tier, lastQueried:null});
    }
};

var displaySummonersFromDatabase = function () {
    Summoner.find(function(err, summoners){
        if(err){
            console.log(err);
        }
        console.log(summoners);
    });
};

//addLoLKingSeeds(lolKingSeeds); //works
//displaySummonersFromDatabase(); //works

var addChampions = function(championData){
    for (var key in championData){
        var champion = championData[key];
        //console.log(champion);
        Champion.create({id:champion.id, name:champion.name});
    }
};

//make api requests, then move it to our db
var addChampionsToDatabase = function() {
    var api_key = config.api_key;
    var region = "na";
    var host = "https://na.api.pvp.net";

    //paths
    var championPath = "/api/lol/static-data/" + region + "/v1.2/champion?api_key=";


    https.get(host + championPath + api_key, function (response) {
        console.log("making request");
        var output = '';
        response.on("data", function (chunk) {
            output += chunk;
        });
        response.on('end', function () {
            var obj = JSON.parse(output);
            addChampions(obj.data);
        });
    });
};


var displayChampionsFromDatabase = function(){
    Champion.find(function(err, champions){
       if (err){
           console.log(err);
       }
       console.log(champions);
    });
};


//drop champions in case they already exist
Champion.remove({});
//add champions

//addChampionsToDatabase();
//displayChampionsFromDatabase();

