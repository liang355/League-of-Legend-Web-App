

app.directive('championDropdown', function(){
    return {
        restrict: 'E',
        scope:{
            selected: "=ngModel"
        },
        templateUrl:'directives/dropdown/champions.html',
        controller:function($scope){
            $scope.champions = [{name: "Janna"}, {name:"Jinx"}];
        }
    };
});

app.directive('tierDropdown', function(){
    return {
        restrict: 'E',
        scope:{
            selected: "=ngModel"
        },
        templateUrl:'directives/dropdown/tiers.html',
        controller:function($scope){

            //TODO: populate
            $scope.tiers = [{name: "Bronze V", id:27}, {name:"Challenger", id:1}];
        }
    };
});


app.directive('roleDropdown', function(){
    return {
        restrict: 'E',
        scope:{
            selected: "=ngModel"
        },
        templateUrl:'directives/dropdown/roles.html',
        controller:function($scope){

            //TODO: populate
            $scope.roles = [{name: "Support", id:"SUPPORT"}, {name:"ADC", id:"ADC"}];
        }
    };
});