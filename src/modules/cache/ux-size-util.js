(function () {
    'use strict';
    function SizeUtil() {

        function getSize(obj) {
            return getBytesSize(sizeOfObject(obj));
        }

        /**
         * Get the estimated size in memory of an object.
         * @param {Object} value
         * @param {Number=} level
         * @returns {number}
         */
        function sizeOfObject(value, level) {
            if (level == undefined) level = 0;
            var bytes = 0,
                i;
            if (value === null || value === undefined) {
                bytes = 0;
            } else if (typeof value === 'boolean') {
                bytes = 4;
            } else if (typeof value === 'string') {
                bytes = value.length * 2;
            } else if (typeof value === 'number') {
                bytes = 8;
            } else if (typeof value === 'object') {
                if (value['__visited__']) return 0;
                value['__visited__'] = 1;
                for (i in value) {
                    if (value.hasOwnProperty(i)) {
                        bytes += i.length * 2;
                        bytes += 8; // an assumed existence overhead
                        bytes += sizeOfObject(value[i], 1);
                    }
                }
            }

            if (level == 0) {
                clearReferenceTo(value);
            }
            return bytes;
        }

        function clearReferenceTo(value) {
            if (value && typeof value == 'object') {
                delete value['__visited__'];
                for (var i in value) {
                    if (value.hasOwnProperty(i)) {
                        clearReferenceTo(value[i]);
                    }
                }
            }
        }

        function getBytesSize(bytes) {
            if (bytes > 1024 && bytes < 1024 * 1024) {
                return (bytes / 1024).toFixed(2) + "K";
            }
            else if (bytes > 1024 * 1024 && bytes < 1024 * 1024 * 1024) {
                return (bytes / (1024 * 1024)).toFixed(2) + "M";
            }
            else if (bytes > 1024 * 1024 * 1024) {
                return (bytes / (1024 * 1024 * 1024)).toFixed(2) + "G";
            }
            return bytes.toString();
        }

        this.getSize = getSize;
        this.sizeOfObject = sizeOfObject;
        this.getBytesSize = getBytesSize;
        return this;
    }

    window.ux = window.ux || {};
    window.ux.sizeUtil = new SizeUtil();
}());