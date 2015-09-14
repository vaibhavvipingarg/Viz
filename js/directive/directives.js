var myDirectives = angular.module('app.directives', ['app.services']);

//Helper function to build the info table
function createTable(tooltip, tableData) {
    var table = document.createElement('table'),
        tableHead = document.createElement('thead'),
        tableBody = document.createElement('tbody');

    var row = document.createElement('tr');
    var rowData = tableData[0];
    for (var k in rowData) {
        var cell = document.createElement('td');
        cell.appendChild(document.createTextNode(k));
        row.appendChild(cell);
    }

    tableHead.appendChild(row);

    angular.forEach(tableData, function(rowData) {
        var row = document.createElement('tr');

        angular.forEach(rowData, function(cellData) {
            var cell = document.createElement('td');
            cell.appendChild(document.createTextNode(cellData));
            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });

    table.appendChild(tableHead);
    table.appendChild(tableBody);
    if (tooltip[0][0].childNodes.length > 0) {
        tooltip[0][0].replaceChild(table, tooltip[0][0].childNodes[0]);
    } else {
        tooltip[0][0].appendChild(table);
    }
} 
myDirectives
    .directive('locationInput', function() {
        return {
            restrict: 'E',
            templateUrl: 'templates/directives/user-input.html',
            controller: function($scope) {
                $scope.updateLocation = function(elem) {
                    $scope.radius = this.radius;
                }
            }
        };
    })
    .directive('ngAutocomplete', function($parse) {
        return {
            scope: {
                details: '=',
                ngAutocomplete: '=',
                options: '='
            },

            link: function(scope, element, attrs, model) {
                //options for autocomplete
                var opts;
                //convert options provided to opts
                var initOpts = function() {
                    opts = {};
                    if (scope.options) {
                        if (scope.options.types) {
                            opts.types = [];
                            opts.types.push(scope.options.types)
                        }
                        if (scope.options.bounds) {
                            opts.bounds = scope.options.bounds
                        }
                        if (scope.options.country) {
                            opts.componentRestrictions = {
                                country: scope.options.country
                            }
                        }
                    }
                }
                initOpts();

                //create new autocomplete
                //reinitializes on every change of the options provided
                var newAutocomplete = function() {
                    scope.gPlace = new google.maps.places.Autocomplete(element[0], opts);
                    google.maps.event.addListener(scope.gPlace, 'place_changed', function() {
                        scope.$apply(function() {
                            scope.ngAutocomplete = element.val();
                        });
                    })
                }
                newAutocomplete();

                //watch options provided to directive
                scope.watchOptions = function() {
                    return scope.options;
                };
                scope.$watch(scope.watchOptions, function() {
                    initOpts();
                    newAutocomplete();
                    element[0].value = '';
                    scope.ngAutocomplete = element.val();
                }, true);
            }
        }
    })
    .directive('mapVisualization', function() {
        return {
            restrict: 'EA',
            link: function(scope, element, attrs) {
                scope.$watch('filteredData', function(newData, oldData, scope) {
                    if (oldData !== newData) {
                        //load the map viz
                        loadMapViz(scope.location, newData);
                    }
                });
                var geocoder = new google.maps.Geocoder();

                function loadMapViz(location, data) {
                    function loadOverLay(map, data) {
                        var overlay = new google.maps.OverlayView();
                        // Add the container when the overlay is added to the map.
                        overlay.onAdd = function() {
                            var tooltip = d3.select("body")
                                .append("div")
                                .attr("class", "info-window");

                            var layer = d3.select(this.getPanes().overlayMouseTarget)
                                .append("div")
                                .attr("class", "stations");

                            // Draw each marker as a separate SVG element.
                            // We could use a single SVG, but what size would it have?
                            overlay.draw = function() {
                                var projection = this.getProjection(),
                                    padding = 10;

                                var marker = layer.selectAll("svg")
                                    .data(d3.entries(data))
                                    .each(transform) // update existing markers
                                    .enter().append("svg:svg")
                                    .each(transform)
                                    .attr("class", "marker")
                                    .on("click", function(d) {
                                        createTable(tooltip, d.value.incidents);
                                        tooltip.style("visibility", "visible");
                                        tooltip.style("left", event.clientX + 'px');
                                        tooltip.style("top", event.clientY + 'px');
                                        return;
                                    })
                                    .on("mouseout", function(d) {
                                        return tooltip.style("visibility", "hidden");
                                    });

                                // Add a circle.
                                marker.append("svg:circle")
                                    .attr("r", function(d) {
                                        return 7.5 + (0.15 * d.value.incidents.length);
                                    })
                                    .attr("cx", padding)
                                    .attr("cy", padding);

                                // Add a label.
                                marker.append("svg:text")
                                    .attr("x", padding - 4)
                                    .attr("y", padding)
                                    .attr("dy", ".31em")
                                    .attr("color", "white")
                                    .text(function(d) {
                                        return d.value.incidents.length;
                                    });

                                function transform(d) {
                                    d = new google.maps.LatLng(d.value.latitude, d.value.longitude);
                                    d = projection.fromLatLngToDivPixel(d);
                                    return d3.select(this)
                                        .style("left", (d.x - padding) + "px")
                                        .style("top", (d.y - padding) + "px");
                                }
                            };
                        };

                        // Bind our overlay to the map…
                        overlay.setMap(map);

                        // Set mouseover event for each feature.
                        overlay.addListener('mouseover', function(event) {
                            tooltip.style("visibility", "visible");
                        });
                    }

                    var map = new google.maps.Map(d3.select("#map").node(), {
                        zoom: 15,
                        center: location,
                        mapTypeId: google.maps.MapTypeId.TERRAIN
                    });

                    loadOverLay(map, data);
                }
            }
        }
    });