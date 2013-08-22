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
        factory('queue', ['dispatcher', 'logDispatcher', function (dispatcher, logDispatcher) {
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

                function selectedItem(item) {
                    if (item !== undefined) {
                        var index = ary.indexOf(item);
                        if (index !== -1) {
                            selItem = item;
                            selIndex = index;
                            api.log(events.LOG, "\t%s set selected item", name);
                        } else {
                            reset();
                        }
                    }
                    return selItem;
                }

                function selectedIndex(value) {
                    if (value !== undefined) {
                        if (ary.hasOwnProperty(value)) {
                            value = parseInt(value, 10);
                            selIndex = value;
                            selItem = ary[selIndex];
                            api.log(events.LOG, "\t%s set selected index", name);
                        } else {
                            reset();
                        }
                    }
                    return selIndex;
                }

                function next() {
                    api.log(events.LOG, "\tnext");
                }

                function prev() {
                    api.log(events.LOG, "\tprev");
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
                        result = getValue(ary[i], property);
                        if (result === value) {
                            return ary[i];
                        }
                        i += 1;
                    }
                    return null;
                }

                function getValue(obj, property) {
                    var properties = property.split('.'), prop = properties.shift();
                    while (properties.length && obj.hasOwnProperty(prop)) {
                        obj = obj[prop];
                        prop = properties.shift();
                    }
                    if (isFunction(obj[prop])) {
                        return obj[prop]();
                    }
                    return obj[prop];
                }

                api.selectedItem = selectedItem;
                api.selectedIndex = selectedIndex;
                api.add = add;
                api.remove = remove;
                api.next = next;
                api.prev = prev;
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