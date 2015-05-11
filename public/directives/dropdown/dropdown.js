

app.directive('championDropdown', ['expressApi', function(expressApi){
    return {
        restrict: 'E',
        scope:{
            selected: "=ngModel",
        },
        templateUrl:'directives/dropdown/champions.html',
        controller:function($scope){
            expressApi.getChampions(function(data){
                //convert object to list
                var champions = [];
                for (var key in data){
                    champions.push(data[key]);
                }
                $scope.champions = champions;
            });

            var setChampion = function(name){
                for (var i = 0; i < $scope.champions.length; i++){
                    if ($scope.champions[i].name === name){
                        $scope.selected = $scope.champions[i];
                    }
                }
            };

            $scope.$on("setChampionDropdown", function(event, arg){
                setChampion(arg.name);
            });
        }
    };
}]);

app.directive('tierDropdown', ['expressApi', function(expressApi){
    return {
        restrict: 'E',
        scope:{
            selected: "=ngModel",
            change: "=change"
        },
        templateUrl:'directives/dropdown/tiers.html',
        controller:function($scope){
            expressApi.getTiers(function(data){
                var tiers = [];
                for (var key in data){
                    tiers.push(data[key]);
                }
                $scope.tiers = tiers;
            });

            var setTier = function(id){
                for (var i = 0; i < $scope.tiers.length; i++){
                    if ($scope.tiers[i].id === id){
                        $scope.selected = $scope.tiers[i];
                    }
                }
            };

            $scope.$on("setTierDropdown", function(event, arg){
                setTier(arg.id);
            });
        }
    };
}]);


app.directive('roleDropdown', ['expressApi', function(expressApi){
    return {
        restrict: 'E',
        scope:{
            selected: "=ngModel",
            change: "=change"
        },
        templateUrl:'directives/dropdown/roles.html',
        controller:function($scope){
            expressApi.getRoles(function(data){
                var roles = [];
                for (var key in data){
                    roles.push(data[key]);
                }
                $scope.roles = roles;
            });

            var setRole = function(id){
                for (var i = 0; i < $scope.roles.length; i++){
                    if ($scope.roles[i].id === id){
                        $scope.selected = $scope.roles[i];
                    }
                }
            };

            $scope.$on("setRoleDropdown", function(event, arg){
                setRole(arg.id);
            });
        }
    };
}]);