/**
 * Created by holland on 4/9/2015.
 */
var mongoose = require('mongoose');

var SummonerNewSchema = new mongoose.Schema({
    name:String,
    sID:Number,
    tier:Number,
    lastQueried:Date,
    matchTier:Number
});

module.exports = mongoose.model('SummonerNew', SummonerNewSchema);