/**
 * Created by holland on 4/9/2015.
 */
var mongoose = require('mongoose');

var SummonerSchema = new mongoose.Schema({
    name:String,
    tier:Number,
    lastQueried:Date
});

module.exports = mongoose.model('Summoner', SummonerSchema);