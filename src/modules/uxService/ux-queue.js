(function () {
    'use strict';

    var events = {
            LOG: 'queue::log',
            INFO: 'queue::info',
            WARN: 'queue::warn',
            ERROR: 'queue::error'
        },
        isFunction = angular.isFunction;

    angular.module('uxService').
        factory('queue', ['objectKeys', 'dispatcher', 'logDispatcher', function (objectKeys, dispatcher, logDispatcher) {
            function queue(array, queueName) {
                var name = queueName || 'queue',
                    api = {
                        name: name,
                        events: events
                    },
                    ary = null,
                    selItem = null,
                    selIndex = -1;

                function reset() {
                    selItem = null;
                    selIndex = -1;
                }

                function data(value) {
                    api.log(events.LOG, "\t%s set data", name);
                    if (value !== undefined) {
                        ary = value;
                        reset();
                    }
                    return ary;
                }

                function add(item) {
                    api.log(events.LOG, "\t%s add item", name);
                    ary.push(item);
                }

                function remove(item) {
                    api.log(events.LOG, "\t%s remove item", name);
                    var index = ary.indexOf(item);
                    if (index !== -1) {
                        ary.splice(index, 1);
                    }
                }

                function first() {
                    return ary[0];
                }

                function length() {
                    return ary.length;
                }

                function getItemWith(property, value) {
                    var i = 0, len = ary.length, result = false;
                    while (i < len) {
                        result = objectKeys.walkPath(ary[i], property);
                        if (result === value) {
                            return ary[i];
                        }
                        i += 1;
                    }
                    return null;
                }

                api.add = add;
                api.remove = remove;
                api.data = data;
                api.first = first;
                api.length = length;
                api.getItemWith = getItemWith;

                dispatcher(api);
                logDispatcher(api);

                data(array || []);
                return api;
            }

            queue.events = events;

            return queue;
        }]);
}());