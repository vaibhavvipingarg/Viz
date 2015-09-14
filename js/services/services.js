var myServices = angular.module('app.services', []);
var API_END_POINT = 'https://data.seattle.gov/resource/3k2p-39jp.json';

myServices.filter('time', function() {
    return function(items, timeRange) {
        var filtered = [];
        var range = timeRange.split(';');
        var min = range[0];
        var max = range[1];
        // If time is with the range
        angular.forEach(items, function(item) {
        	if (item.event_clearance_date) {
        		var timeStamp = item.event_clearance_date.split('T');
        		var hour = timeStamp[1].split(':')[0];
        		if (hour[0] === '0') {
        		    hour = hour[1];
        		}
        		if (parseInt(hour) >= parseInt(min) && parseInt(hour) < parseInt(max)) {
        		    filtered.push(item);
        		}
        	}
        });
        return filtered;
    };
});
myServices.factory('dataService', function($http) {
    var formatedData = {};

    function buildIncidentsData(item) {
        var incidents = {};
        for (var k in item) {
            if (k === 'cad_cdw_id') {
                incidents.ID = item[k];
            }
            if (k === 'event_clearance_description') {
                incidents.Type = item[k];
            }
            if (k === 'event_clearance_date') {
                incidents.Time = item[k].split('T')[1];
            }
        }
        return incidents;
    }
    return {
        getData: function(query) {
            return $http.get(API_END_POINT + query);
        },
        formatData: function(data) {
            var updatedCoords = {};
            angular.forEach(data, function(item) {
                var newKey = item.latitude + item.longitude;
                if (updatedCoords[newKey]) {
                    updatedCoords[newKey].incidents.push(buildIncidentsData(item));
                } else {
                    updatedCoords[newKey] = {
                        incidents: [buildIncidentsData(item)],
                        latitude: item.latitude,
                        longitude: item.longitude
                    }
                }
            });
            data = updatedCoords;
            return data;
        },
        getLocationData: function(location, $scope) {
            var geocoder = new google.maps.Geocoder();
            geocoder.geocode({
                'address': location
            }, function(results, status, scope) {
                if (status == google.maps.GeocoderStatus.OK) {
                    var encodedLocation = results[0].geometry.location;
                    $scope.query = '?$limit=10000&$where=within_circle(incident_location,' + encodedLocation.G + ',' + encodedLocation.K + ',' + $scope.radius + ')';
                    $scope.location = encodedLocation;
                    $scope.dataService.getData($scope.query)
                        .success(function(response) {
                            $scope.data = response;
                            var filteredData = $scope.timeFilter($scope.data, $scope.value);
                            $scope.filteredData = $scope.dataService.formatData(filteredData);
                        })
                        .error(function(error) {
                            console.log('Error loading data');
                        });
                }
            });
        }
    }
});