'use strict';

var EventyCtrl = function($rootScope, $http, $document, $timeout, $scope, $q, FileUploader, Storage) {

    var ctrl = this;

    $scope.log = function() {
        window.s = $scope;
        console.log($scope);
    };

    ctrl.activeTab = 0;
    $scope.events = [];
    $scope.futureEvents = [];
    $scope.eventTypes = Storage.eventTypes;
    $scope.eventTypesMap = Storage.eventTypesMap;
    $scope.newEvent = {};
    $scope.modifyEvent = {};
    $scope.showAllFieldsCreate = false;
    $scope.showAllFieldsModify = false;
    $scope.eventsSize = 10;

    $scope.users = [{
        name: 'alex'
    }, {
        name: 'zhopka'
    }];

    $scope.eventsFilter = {
        filterType: undefined
        // eventsOrderBy: 'creationDate' // new first
    };

    $scope.listEvents = function() {
        $scope.fillEventTypes().then($scope.updateEventList);
    };

    $scope.updateEventList = function() {
        let size = $scope.eventsSize;
        let typeObj = $scope.eventsFilter.filterType;
        let userObj = $scope.eventsFilter.user;
        $http.get('event?size=' + size + (typeObj ? '&type=' + typeObj.type : '') + (userObj ? '&user=' + userObj.name : '')).then(function(res) {
            let events = res.data;
            events = events.map(function(e) {
                // $rootScope.asdf=JSON.stringify(e);
                // $rootScope.fdsa=new Date().toISOString();
                $scope.createDateObjects(e);
                var type = Storage.eventTypesMap[e.type];
                e.color = type.color;
                e.icon = type.icon;
                e.when = moment(e.creationDate).fromNow();
                return e;
            });
            events[0].startperiod = "New start";
            events[3].endperiod = "New start (end)";
            // update existing list
            $scope.events = events;
            // $timeout(function(){
            //     console.log("Running after the digest cycle");
            //     checkImages(function() {
            //         console.log('callback');
            //     });
            // },0,false);

            // for (let e of events) {
            //     let found = false;
            //     for (let event of $scope.events) {
            //         if (event.id === e.id) {
            //             found = true;
            //             break;
            //         }
            //     }
            //     if (!found) {
            //         $scope.events.push(e)
            //     }
            // }
            // for (let i = $scope.events.length - 1; i >= 0; i--) {
            //     let event = $scope.events[i];
            //     let found = false;
            //     for (let e of events) {
            //         if (event.id === e.id) {
            //             found = true;
            //             break;
            //         }
            //     }
            //     if (!found) {
            //         $scope.events.splice(i, 1);
            //     }
            // }
        });
        // $http.get('event-future').then(function(res) {
        //     var events = res.data;
        //     events.forEach(function(e) {
        //         $scope.createDateObjects(e);
        //         var type = Storage.eventTypesMap[e.type];
        //         e.color = type.color;
        //         e.icon = type.icon;
        //         e.when = moment(e.creationDate).fromNow();
        //         $scope.futureEvents.push(e)
        //     });
        // });
    };

    $scope.setSizeAndUpdateEventList = function(size) {
        $scope.eventsSize = size;
        $scope.updateEventList();
    };

    $scope.fillEventTypes = function() {
        const p = $http.get('event-type');
        p.then(function(res) {
            let eventTypes = res.data;
            eventTypes.forEach(function(e) {
                Storage.eventTypesMap[e.type] = e; // fill the map
                Storage.eventTypes.push(e)
            });
        });
        return p;
    };

    $scope.eventsFilterFn = function(event, index, events) {
        $scope.scrollHack();
        var showThisEvent = true;
        if ($scope.eventsFilter.filterType) {
            showThisEvent = event.type == $scope.eventsFilter.filterType.type;
        }
        if (!showThisEvent) {
            return false;
        }
        if ($scope.eventsFilter.user) {
            showThisEvent = event.user && event.user == $scope.eventsFilter.user.name;
        }
        return showThisEvent;
    };

    /** Create section */
    $scope.createEventServer = function() {
        $scope.newEvent.creationDate = (new Date()).toISOString();
        // if no date - add as creation date
        if (!$scope.newEvent.date) {
            $scope.newEvent.date = $scope.newEvent.creationDate
        }
        $scope.newEvent.when = 'now';
        $http({
            url: 'event',
            method: 'POST',
            data: $scope.newEvent,
            transformResponse: [function (data) {
                return data;
            }]
        }).then(function(res) {
            $scope.newEvent.id = res.data;
            $scope.events.push($scope.newEvent);
            // cleanup
            ctrl.selectedType = undefined;
            $scope.newEvent = {};
            $scope.createSubEventType = undefined;
            ctrl.activeTab = 0;
        });
    };

    $scope.selectTypeToCreate = function(type) {
        $scope.newEvent.type = type.type;
        $scope.newEvent.color = type.color;
        $scope.newEvent.icon = type.icon;
        $scope.createSubEventType = undefined;
    };

    $scope.addCreateSubEvent = function(type) {
        if (!$scope.newEvent.events) {
            $scope.newEvent.events = [];
        }
        $scope.createSubEventType = Storage.eventTypesMap[type];
        $scope.newEvent.events.push({
            type: $scope.createSubEventType.type,
            color: $scope.createSubEventType.color,
            icon: $scope.createSubEventType.icon
        })
    };

    /** Modification section */
    $scope.navigateModifyEvent = function(event) {
        $scope.modifyEvent = event;
        $scope.modifyEventType = Storage.eventTypesMap[$scope.modifyEvent.type];
        ctrl.activeTab = 2;
    };

    $scope.saveModificationsServer = function() {
        $http({
            url: 'event',
            method: 'PUT',
            data: $scope.modifyEvent,
            transformResponse: [function (data) {
                return data;
            }]
        }).then(function(res) {
            $scope.modifyEvent = undefined;
            $scope.modifySubEventType = undefined;
            ctrl.activeTab = 0;
        })
    };

    $scope.changeEventType = function(newType) {
        $scope.modifyEventType = newType;
        $scope.modifyEvent.type = newType.type;
    };

    $scope.addModifySubEvent = function() {
        if (!$scope.modifyEvent.events) {
            $scope.modifyEvent.events = [];
        }
        $scope.modifyEvent.events.push({
            type: $scope.modifySubEventType.type,
            color: $scope.modifySubEventType.color,
            icon: $scope.modifySubEventType.icon
        })
    };

    /** Delete section */
    $scope.deleteEvent = function(event) {
        $http({
            url: 'event/' + event.id,
            method: 'DELETE',
            transformResponse: [function (data) {
                return data;
            }]
        }).then(function(res) {
            var idx = $scope.events.indexOf(event);
            $scope.events.splice(idx, 1);
        })
    };

    /** Utils */
    $scope.createDateObjects = function(ge) {
        if (ge.date) {
            ge.date = parseDate(ge.date);
        }
        if (ge.start) {
            ge.start = parseDate(ge.start);
        }
        if (ge.end) {
            ge.end = parseDate(ge.end);
        }
        if (ge.events) {
            ge.events.forEach(function(e) {
                if (e.date) {
                    e.date = parseDate(e.date);
                }
                if (e.start) {
                    e.start = parseDate(e.start);
                }
                if (e.end) {
                    e.end = parseDate(e.end);
                }
            });
        }
    };

    function parseDate(input, format) {
        format = format || 'yyyy-mm-dd'; // default format
        var parts = input.match(/(\d+)/g),
            i = 0, fmt = {};
        // extract date-part indexes from the format
        format.replace(/(yyyy|dd|mm)/g, function(part) { fmt[part] = i++; });

        return new Date(parts[fmt['yyyy']], parts[fmt['mm']]-1, parts[fmt['dd']]);
    }

    function parseDateISO(input) {
        return parseDate(input, 'yyyy-mm-dd')
    }

    $scope.scrollHack = function() {
        var st = document.body.scrollTop;
        document.body.scrollTop = st+1;
        document.body.scrollTop = st;
    };

    $scope.listEvents();

    /** Special handling for each event type */
    $scope.filterEventByType = function(events, type) {
        if (events && type) {
            return events.filter(function(e) {
                return e.type == type;
            });
        }
    };

    /** Some animations */
    // optional: not mandatory (uses angular-scroll-animate)
    $scope.animateElementIn = function($el) {
        $el.removeClass('timeline-hidden');
        $el.addClass('bounce-in');
    };

    // optional: not mandatory (uses angular-scroll-animate)
    $scope.animateElementOut = function($el) {
        $el.addClass('timeline-hidden');
        $el.removeClass('bounce-in');
    };

    $scope.side = 'left';
    $scope.leftAlign = function() {
        $scope.side = 'left';
    };

    $scope.rightAlign = function() {
        $scope.side = 'right';
    };

    $scope.defaultAlign = function() {
        $scope.side = ''; // or 'alternate'
    }

};

angular.module('eventy').controller('EventyCtrl', EventyCtrl);
