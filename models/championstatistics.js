/**
 * Created by holland on 4/9/2015.
 */
var mongoose = require('mongoose');

//var Timeline = new mongoose.Schema({
//    minute:Number,
//    visionWardsPlaced:Number,
//    sightWardsPlaced:Number,
//    yellowTrinketPlaced: Number,
//    jungleMinionsKilled:Number,
//    minionsKilled:Number,
//    level:Number,
//    totalGold:Number,
//    currentGold:Number
//});

//var RawData = new mongoose.Schema({
//
//});


var ChampionStatisticsSchema = new mongoose.Schema({
    id:String,
    name:String,
    role:String,
    tier:Number,
    winner:Boolean,

    assists:Number,
    kills:Number,
    deaths:Number,

    magicDamageTotal:Number,
    magicDamageChamp:Number,
    magicDamageTaken:Number,
    physicalDamageTotal:Number,
    physicalDamageChamp:Number,
    physicalDamageTaken:Number,
    heals:Number,

    wardsKilled:Number,
    wardsPlaced:Number,

    totalMinionsKilled:Number,
    neutralMinionsKilledEnemyJungle:Number,
    neutralMinionsKilledTeamJungle:Number,

    blueGolem:[],
    redLizard:[],
    visionWardsPlaced:[],
    sightWardsPlaced:[],
    yellowTrinketPlaced: [],
    jungleMinionsKilled:[],
    minionsKilled:[],
    level:[],
    totalGold:[],
    currentGold:[],

    baseTurrets:[],
    innerTurrets:[],
    outerTurrets:[],
    nexusTurrets:[],
    inhibitors:[],
    dragon:[],
    baronNashor:[]


});

//ChampionStatisticsSchema.index({name: 1, tier: 1, role: 1}, {role: 1});

module.exports = mongoose.model('ChampionStatistics', ChampionStatisticsSchema);


