/**
 * Created by yingbinliang on 4/9/15.
 */

var x;
var i;
var chart;
//var theInterval;
//var timeLineLength;
//var cs;
//var rawCS;

var makeLineGraphCS = function(dataLast, dataAvg){

    //cut-off graphs
    var lengthLast = dataLast['matchStatistics']['minionsKilled'].length;
    var lengthAvg = dataAvg['minionsKilled'].length;
    dataAvg['minionsKilled'].splice(lengthLast, lengthAvg - lengthLast);

    //put "object: array" into "array[array]"
    var timeLineData = [];
    timeLineData.push(
        dataLast['matchStatistics']['minionsKilled'],
        dataAvg['minionsKilled']

    );

    console.log(dataLast['matchStatistics']['minionsKilled']);
    console.log(dataAvg['minionsKilled']);


    //generate chart
    chart = c3.generate({
        bindto: '#chartCS',
        data: {
            columns: timeLineData,
            //hide: ['currentGold', 'totalGold', 'sightWardsPlaced', 'sightWardsPlaced', 'yellowTrinketPlaced', 'level'],
            types: {
                minionsKilled: 'area',
                'minionsKilled Last': 'area'
            },
            names: {
                minionsKilled: 'CS - Average Stat',
                'minionsKilled Last': 'CS - Your Last Game'
            },
            colors: {
                minionsKilled: '#a63603',
                'minionsKilled Last': '#fdae6b'
            }
        }
    });

    ////set initial xgrid position
    //chart.xgrids([
    //    {value: 0}
    //]);

    ////get the length of timeline
    //timeLineLength = timelinedatas[0].length - 1;
};


var makeLineGraphWard = function(dataLast, dataAvg){

    //cut off graph
    var lengthLast = dataLast['matchStatistics']['sightWardsPlaced'].length;
    var lengthAvg = dataAvg['sightWardsPlaced'].length;
    dataAvg['sightWardsPlaced'].splice(lengthLast, lengthAvg - lengthLast);

    //put "object: array" into "array[array]"
    var timeLineData = [];
    timeLineData.push(
        dataLast['matchStatistics']['sightWardsPlaced'],
        dataAvg['sightWardsPlaced']
    );

    console.log(dataLast['matchStatistics']['sightWardsPlaced']);
    console.log(dataAvg['sightWardsPlaced']);

    console.log(dataLast);
    console.log(dataAvg);

    //generate chart
    chart = c3.generate({
        bindto: '#chartWard',
        data: {
            columns: timeLineData,
            types: {
                sightWardsPlaced: 'area-step',
                'sightWardsPlaced Last': 'area-step'
            },
            names: {
                sightWardsPlaced: 'Sight Wards - Average Stat',
                'sightWardsPlaced Last': 'Sight Wards - Your Last Game'
            },
            colors: {
                sightWardsPlaced: '#bae4b3',
                'sightWardsPlaced Last': '#006d2c'
            }
        }
    });
};

////function that updates the position of xgrid
//function updateGrid(i){
//    chart.xgrids([
//        {value: i}
//    ]);
//}
//
////"start" button "onclick" event: function that iterates the update of xgrid
//function gridAnimate(){
//    i = 0;
//    clearInterval(theInterval);
//    var creepScore = document.getElementById("cs");
//
//    theInterval = setInterval(function(){
//        if(i < timeLineLength){
//            updateGrid(i);
//            creepScore.innerHTML= Math.round(cs[i+1]);
//            i++;
//        }
//        else{
//            clearInterval(theInterval);
//        }
//    }, 1000);
//}