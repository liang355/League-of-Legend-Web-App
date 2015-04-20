

app.factory('championStatistics', ['$http', function($http){
    var getStatistics = function(champion, tier, role, callback){
        $http.get('/api/championStatistics/'+tier.id+'/'+champion.name+'/'+role.id)
            .success(function(data){
                callback(data);
            })
            .error(function(data){
                console.log("error ", data);
            }
        );
    };

    return {
        getStatistics: getStatistics
    };
}]);



app.factory('champions', ['$http', function($http) {

    var getChampionList = function(callback) {
        $http.get('/api/champion')
            .success(function(data){
                callback(data);
            })
            .error(function(data){
                console.log("error ", data);
            }
        );
    };

    return {
        get: getChampionList
    };

}]);