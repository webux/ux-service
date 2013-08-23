(function () {
    'use strict';

    var toArray = ux.arrayUtil.toArray,
        extend = angular.extend,
        defaultOptions = {
            blocking: false,
            cacheBust: false,
            delay: 0
        };

    angular.module('uxService').
        factory('$service', ['$serviceQueue', '$resource', function ($serviceQueue, $resource) {

            function ServiceFactory(url, paramDefaults, actions, $options) {
                // we want to save the resource for when it is time to execute it in the queue.
                var i, handle = $resource(url, paramDefaults, actions);
                $options = extend({}, defaultOptions, $options || {});

                function Service() {
                }// we want to wrap response in an api that can be used by the queue.

                function createServiceMethod(handle, method) { // prevent variable mutation so closure works correctly.
                    Service[method] = function (a1, a2, a3, a4) {
                        var result = actions[method].isArray ? [] : {};
                        $serviceQueue.add(this, handle, result, method, toArray(arguments));
                        return result;
                    };
                }

                for (i in handle) {
                    if (handle.hasOwnProperty(i)) {
                        createServiceMethod(handle, i);
                    }
                }

                Service.$config = {url: url, paramDefaults: paramDefaults, actions: actions, handle: handle}; // store for later.
                Service.$options = $options;
                Service.name = 'Service';

                return Service;
            }

            return ServiceFactory;
        }]);
}());