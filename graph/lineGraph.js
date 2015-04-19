/**
 * Created by yingbinliang on 4/9/15.
 */

var chart = c3.generate({
    data: {
        json: {
            data1: [30, 20, 50, 40, 60, 50, 200, 130, 90, 240, 130, 220],
            data2: [200, 130, 90, 240, 130, 220, 300, 200, 160, 400, 250, 250],
            data3: [300, 200, 160, 400, 250, 250, 30, 20, 50, 40, 60, 50]
        }
    }
});

//create variables and chart, set initial xgrid position
var x = chart.data.values('data1');
var i;
var flag = true;
chart.xgrids([
    {value: 0}
]);

//function that updates the position of xgrid
function updateGrid(i){
    chart.xgrids([
        {value: i}
    ]);
}

var theInterval;
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
