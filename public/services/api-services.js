

app.factory('championStatistics', ['$http', function($http){
    var getStatistics = function(championName, tierId, roleId, callback){
        $http.get('/api/championStatistics/'+tierId+'/'+championName+'/'+roleId)
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

app.factory('championStatistics2', ['$http', function($http){
    var getStatistics = function(championId, tierId, roleId, callback){
        $http.get('/api/championStatistics2/'+tierId+'/'+championId+'/'+roleId)
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


app.factory('expressApi', ['$http', function($http) {
    var getRoles = function(callback) {
        $http.get('/api/static/role/list')
            .success(function(data){
                callback(data);
            })
            .error(function(data){
                console.log("error ", data);
            }
        );
    };

    var getTiers = function(callback) {
        $http.get('/api/static/tier/list')
            .success(function(data){
                callback(data);
            })
            .error(function(data){
                console.log("error ", data);
            }
        );
    };

    var getChampions = function(callback){
        $http.get('/api/static/champions/list')
            .success(function(data){
                callback(data);
            })
            .error(function(data){
                console.log("error ", data);
            }
        );
    };

    var getCurrentGame = function(summonerName, callback){
        $http.get('/api/currentGame/'+summonerName)
            .success(function(data){
                callback(data);
            })
            .error(function(data){
                console.log("error ", data);
            }
        );
    };

    var getChampion = function(id, callback){
        $http.get('/api/static/champion/'+id)
            .success(function(data){
                callback(data);
            })
            .error(function(data){
               console.log("error", data);
            }
        );
    };

    var getSummoner = function(id, callback){
        $http.get('/api/summoner/'+id)
            .success(function(data){
                callback(data);
            })
            .error(function(data){
                console.log("error", data);
            }
        );
    };

    var getRoleCount = function(championName, callback){
        $http.get('/api/mostRecordedRole/'+championName)
            .success(function(data){
                callback(data);
            })
            .error(function(data){
                console.log("error", data);
            }
        );
    };


    return {
        getRoles:getRoles,
        getTiers:getTiers,
        getChampions:getChampions,
        getChampion:getChampion,
        getCurrentGame:getCurrentGame,
        getRoleCount:getRoleCount
    };
}]);