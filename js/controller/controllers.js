// create the module and name it myApp
var myControllers = angular.module('app.controllers', ['app.services']);

// create the controller and inject Angular's $scope
myControllers.controller('mainController', ['$scope', 'dataService', 'timeFilter', function($scope, dataService, timeFilter) {
	//Time slider config settings
	$scope.value = '06;12';
	$scope.location = '';
    $scope.options = {
        from: '00:00',
        to: '24:00',
        step: 1,
        scale: [0, 1, 2, 3, 4, 5, '6am', 7, 8, 9, 10, 11, '12pm', 1, 2, 3, 4, 5, '6pm', 7, 8, 9, 10, 11, '12am']
    };

    //Helper methods
	$scope.dataService = dataService;
    $scope.timeFilter = timeFilter;

    //Model values for the map visualization
    $scope.address = '800 Occidental Ave S, Seattle, WA 98134';
    $scope.radius = 500;
    $scope.query = '';
    $scope.data = {};

    //Watch for changes on the visualization inputs
    $scope.$watch('value', function(newValues, oldValues, scope) {
        //filter the data in the model based on this value change
        var filteredData = $scope.timeFilter($scope.data, newValues);
        $scope.filteredData = $scope.dataService.formatData(filteredData);
    });

    //Add watch on the marking radius
    $scope.$watch('radius', function(newValue, oldValue, scope) {
        //make a new API resquest to load the data and update the model
        if (newValue && typeof newValue === 'string') {
            dataService.getLocationData($scope.address, $scope);
        }
    })

    //Add watch on the location
    $scope.$watch('location', function(newValue, oldValue, scope) {
        if (newValue && typeof newValue === 'string') {
            dataService.getLocationData(newValue, $scope);
            $scope.address = newValue;
        }
    });

    //Initialize the visualization
    dataService.getLocationData($scope.address, $scope);

}]);