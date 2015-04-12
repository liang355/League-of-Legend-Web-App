var express = require('express');
var router = express.Router();

var Champion = require('../models/champion.js');
var Summoner = require('../models/summoner.js');
var Match = require('../models/match.js');
var ChampionStatistics = require('../models/championstatistics.js');

router.get('/champion/:name', function(req, res, next){
    console.log("routing");
    Champion.findOne({'name':req.params.name}, function(err, champion){
        if (err){
            return next(err);
        }
        res.json(champion);
    });
});

router.get('/champion', function(req, res, next){
    console.log("routing");
    Champion.find(function(err, champions){
        if (err){
            return next(err);
        }
        res.json(champions);
    });
});

router.get('/summoner', function(req, res, next){
    console.log("routing");
    Summoner.find(function(err, summoners){
        if(err){
            return next(err);
        }
        res.json(summoners);
    })
});

router.get('/summoner/:tier', function(req, res, next){
    console.log("routing");
    Summoner.find({'tier':req.params.tier}, function(err, summoners){
        if(err){
            return next(err);
        }
        res.json(summoners);
    })
});

module.exports = router;