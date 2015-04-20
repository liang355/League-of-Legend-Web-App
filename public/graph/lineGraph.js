/**
 * Created by yingbinliang on 4/9/15.
 */

var x;
var i;
var chart;
var theInterval;

var makeLineGraph = function(timeline){

    var timelinedatas = [];
    timelinedatas.push(timeline['currentGold']);
    timelinedatas.push(timeline['jungleMinionsKilled']);
    timelinedatas.push(timeline['level']);
    timelinedatas.push(timeline['minionsKilled']);
    timelinedatas.push(timeline['sightWardsPlaced']);
    timelinedatas.push(timeline['totalGold']);
    timelinedatas.push(timeline['visionWardsPlaced']);
    timelinedatas.push(timeline['yellowTrinketPlaced']);

    //generate chart
    chart = c3.generate({
        data: {
            columns: timelinedatas
        }
    });

    //set initial xgrid position
    chart.xgrids([
        {value: 0}
    ]);
};


//function that updates the position of xgrid
function updateGrid(i){
    chart.xgrids([
        {value: i}
    ]);
}

//function that iterate the update of xgrid
function gridAnimate(callback){
    i = 0;
    chart.xgrids([
        {value: i}
    ]);
    i++;
    clearInterval(theInterval);

    theInterval = setInterval(function(){
        if(i < x.length){
            updateGrid(i);
            i++;
        }
        else{
            clearInterval(theInterval);
        }
    }, 500);
}

