/**
 * Created by yingbinliang on 4/9/15.
 */

var x;
var i;
var chart;
var theInterval;
var timeLineLength;
var cs;
var rawCS;

var makeLineGraph = function(timeline){

    //put "object: array" into "array[array]"
    var timelinedatas = [];
    timelinedatas.push(
        //timeline['currentGold'],
        //timeline['totalGold'],

        timeline['minionsKilled'],
        timeline['jungleMinionsKilled']

        //timeline['sightWardsPlaced'],
        //timeline['visionWardsPlaced'],
        //timeline['yellowTrinketPlaced'],
        //timeline['level']
    );

    ////export CS to global variable "cs"
    //cs = timeline['minionsKilled'];

    //generate chart
    chart = c3.generate({
        bindto: '#chart',
        data: {
            columns: timelinedatas,
            hide: ['currentGold', 'totalGold', 'sightWardsPlaced', 'visionWardsPlaced', 'yellowTrinketPlaced', 'level'],
            types: {
                minionsKilled: 'area-spline',
                jungleMinionsKilled: 'area-spline'
            },
            groups: [['minionsKilled', 'jungleMinionsKilled']]
        }
    });

    ////set initial xgrid position
    //chart.xgrids([
    //    {value: 0}
    //]);

    ////get the length of timeline
    //timeLineLength = timelinedatas[0].length - 1;
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

