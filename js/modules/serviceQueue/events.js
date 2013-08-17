(function () {
    'use strict';
    angular.module('ngService').factory('events', function () {
        return function events(instance) {
            instance.events = {
                LOG: 'serviceQueue::log',
                INFO: 'serviceQueue::info',
                WARN: 'serviceQueue::warn',
                ERROR: 'serviceQueue::error'
            };
            return instance;
        };

    });
}());