(function () {
    'use strict';

    angular.module('uxService', ['ngResource', 'addons']).
        service('$serviceQueue', ['connection', 'queue', 'addons', 'events', 'dispatcher', 'logDispatcher', '$timeout',
            function (connection, queue, addons, events, dispatcher, logDispatcher, $timeout) {
                var instance = ux.serviceQueue(connection, queue, $timeout),
                //TODO: This needs defined externally.
                    addonList = "";//"eventLogger";
                events(instance);
                dispatcher(instance);
                logDispatcher(instance);
                addons(instance, addonList);
                instance.init();
                return instance;
            }]);
}());