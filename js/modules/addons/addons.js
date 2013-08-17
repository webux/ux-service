(function () {
    'use strict';

    angular.module('addons', []).factory('addons', ['$injector', function ($injector) {

        function applyAddons(addons, instance) {
            var i = 0, len = addons.length, result;
            while (i < len) {
                result = $injector.get(addons[i]);
                if (typeof result === "function") {
                    result(instance);
                } else {
                    // they must have returned a null? what was the point. Throw an error.
                    throw new Error("Addons expect a function to pass the grid instance to.");
                }
                i += 1;
            }
        }

        return function (instance, addons) {
            addons = addons instanceof Array ? addons : (addons && addons.split(',') || []);
            if (instance.addons) {
                addons = instance.addons = instance.addons.concat(addons);
            }
            applyAddons(addons, instance);
        }
    }])
}());