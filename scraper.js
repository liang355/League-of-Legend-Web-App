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

addChampionsToDatabase();

displayChampionsFromDatabase();

