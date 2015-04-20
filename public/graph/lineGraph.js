/**
 * Created by yingbinliang on 4/9/15.
 */

var x;
var i;
var chart;
var theInterval;
var timeLineLength;

var makeLineGraph = function(timeline){

    //put "object: array" into "array[array]"
    var timelinedatas = [];
    timelinedatas.push(timeline['currentGold']);
    timelinedatas.push(timeline['totalGold']);
    timelinedatas.push(timeline['jungleMinionsKilled']);
    timelinedatas.push(timeline['minionsKilled']);
    timelinedatas.push(timeline['sightWardsPlaced']);
    timelinedatas.push(timeline['visionWardsPlaced']);
    timelinedatas.push(timeline['yellowTrinketPlaced']);
    timelinedatas.push(timeline['level']);

    //generate chart
    chart = c3.generate({
        bindto: '#chart',
        data: {
            columns: timelinedatas,
            hide: ['currentGold', 'totalGold', 'sightWardsPlaced', 'visionWardsPlaced', 'yellowTrinketPlaced', 'level']
        }
    });

    //set initial xgrid position
    chart.xgrids([
        {value: 0}
    ]);

    //get the length of timeline
    timeLineLength = timelinedatas[0].length - 1;
};

//function that updates the position of xgrid
function updateGrid(i){
    chart.xgrids([
        {value: i}
    ]);
}

//function that iterates the update of xgrid
function gridAnimate(){
    i = 0;
    clearInterval(theInterval);

    theInterval = setInterval(function(){
        if(i < timeLineLength){
            updateGrid(i);
            i++;
        }
        else{
            clearInterval(theInterval);
        }
    }, 500);
}

