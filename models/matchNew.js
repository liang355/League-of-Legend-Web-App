/**
 * Created by holland on 4/9/2015.
 */
var mongoose = require('mongoose');

var MatchNewSchema = new mongoose.Schema({
    id:Number,
    hasBeenQueried:Boolean,
    tier:Number
});

module.exports = mongoose.model('MatchNew', MatchNewSchema);