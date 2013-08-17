(function () {
    'use strict';
//TODO: they should just define this object. So they define to the interface. Then pass this in.
    function LocalStorage(localStorageManager, methodMap) {
        this.isSupported = methodMap.isSupported.bind(localStorageManager);
        this.get = methodMap.get.bind(localStorageManager);
        this.set = methodMap.set.bind(localStorageManager);
        this.remove = methodMap.remove.bind(localStorageManager);
        this.removeAll = methodMap.removeAll.bind(localStorageManager);
    }

    /**
     * @type {LocalStorage}
     */
    var storage,
        objKeys,
        each,
        util = function () {
            var api = {};

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
                        clearReferenceTo(value[i]);
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

            api.getSize = getSize;
            api.sizeOfObject = sizeOfObject;
            api.getBytesSize = getBytesSize;
            return api;
        }(),
        cacheUtil = function () {
            var api = {};

            function mergePaginatedCache(cacheData, paramsAsStr, limitOffset) {
                var list;
                if (limitOffset) {
                    this.log("\t_mergePaginatedCache on %s", limitOffset);
                    // the request is paginated. Load all of the pages that we have in order.
                    list = [];
                    var keyWithoutPagesParam = dropPropertyFromKey(paramsAsStr, limitOffset);
                    each(cacheData, function (value, key) {
                        self.log("\t%s === %s", keyWithoutPagesParam, key);
                        if (doesKeyMatchWithoutParam(keyWithoutPagesParam, key, limitOffset)) {
                            list.push(key);
                        }
                    });
                    mergePaginatedCachePagesToFirstEntry(list);
                }
            }

            function mergePaginatedCachePagesToFirstEntry(list) {
                this.log("\t_mergePaginatedCachePagesToFirstEntry");
                var listKey,
                    cachedResult,
                    cachedItem,
                    mergeCachedItem,
                    targetArray;
                list = list.sort();
                if (list.length) {
                    cachedItem = get(list[0]);
                    targetArray = getArrayFromObjectByPath(cachedItem.response.data, resultsArrayPath);
                    while (list.length > 1) {// there must be more than one page to merge.
                        listKey = list[1]; // grab the item at index 1. they are all merged into the item at index 0
                        mergeCachedItem = get(listKey);
                        cachedResult = getArrayFromObjectByPath(mergeCachedItem.response.data, resultsArrayPath);
                        each(cachedResult, function (item) {
                            cachedItem.time = mergeCachedItem.time; // since pages are loaded after. This will always be greater.
                            targetArray.push(item); // need to push them all onto the first instance.
                        });
                        list.splice(1, 1);// remove the 2nd item every time. we need to add them in order.
                        // now remove the cache key as well, because we don't need it anymore.
                        remove(listKey);
                    }
                    calculateSize(cachedItem);
                }
            }

            function getArrayFromObjectByPath(target, path) {
                var ary;
                if (path) {
                    ary = ObjectKeys.walkPath(target, path);
                } else if (get(target).response instanceof Array) {
                    ary = get(target).response;
                }
                return ary;
            }

            /**
             * Drop Property from json string.
             * @param {String} key
             * @param {String} property
             * @private
             */
            function dropPropertyFromKey(key, property) {
                var data = angular.fromJson(key);
                delete data[property];
                return angular.toJson(data);
            }

            function doesKeyMatchWithoutParam(keyToMatch, keyToRemovePropertyFrom, property) {
                var newKey = dropPropertyFromKey(keyToRemovePropertyFrom, property);
                return keyToMatch === newKey;
            }

            api.mergePaginatedCache = mergePaginatedCache;
            return api;
        }();

    var cacheDefaultConfig = {
            enabled: true,
            paramsFilter: null, // can be object or function to filter params.
            pagination: null,
//            pagination: {
//                offset: '',
//                list:''
//            },
//            paginationOffsetPath: null, // the property from a paginated response that tells the offset
//            resultsArrayPath: null, // the property of the array to append to for pagination.
            countLimit: 0,
            expireSeconds: 0,
            memoryLimit: 0
        },
        cacheEvents = {
            LOG: 'cache::log',
            INFO: 'cache::info',
            WARN: 'cache::warn',
            ERROR: 'cache::error',
            CHANGE: 'cache::change'
        };

    function createCacheItem(value) {
        return {
            bytes: util.sizeOfObject(value),
            value: value,
            timestamp: Date.now()
        };
    }

    function Cache(manager, name) {
        var api = {},
            memoryCache = {},
            config = {},
            size = {
                count: 0,
                bytes: 0
            };
        // apply defaults.
        angular.extend(config, cacheDefaultConfig);

        function getStorageKey(cacheKey) {
            return name + cacheKey;
        }

        function getConfig() {
            return config;
        }

        function setConfig(cfg) {
            angular.extend(config, cfg);
        }

        function get(cacheKey) {
            var result = memoryCache[cacheKey],
                storageKey;
            if (storage && result) {
                storageKey = getStorageKey(cacheKey);
                result.response = storage.get(storageKey);
                api.log("localStorage get for %s", storageKey);
            }
            return result;
        }

        function set(cacheKey, value) {
            var storageKey,
                cacheItem = createCacheItem(value);
            subtract(memoryCache[cacheKey]);
            add(cacheItem);
            memoryCache[cacheKey] = cacheItem;
            api.warn("%s Cache Size %s", name, size.bytes);
            if (storage) {
                storageKey = getStorageKey(cacheKey);
                storage.set(storageKey, cacheItem.value);
                api.log("\tlocalStorage put for %s", storageKey);
                manager.getTotalSize();
            }
            change();
        }

        function remove(cacheKey, silent) {
            var cacheItem = memoryCache[cacheKey],
                storageKey;
            subtract(cacheItem);
            if (storage) {
                storageKey = getStorageKey(cacheKey);
                storage.remove(storageKey);
                api.log("\tlocalStorage remove for %s", storageKey);
            }
            api.warn("%s Cache Size %s", name, size.bytes);
            delete memoryCache[cacheKey];
            if (!silent) {
                change();
            }
        }

        function removeAll() {
            api.info("%s CLEAR CACHE ", name);
            each(memoryCache, function (cache, key) {
                remove(key, true);// only fire one event whne we are done.
            });
            change();
        }

        function add(item) {
            size.count += 1;
            size.bytes += item.bytes;
            item.timestamp = Date.now();
        }

        function subtract(item) {
            if (item) {
                size.count -= 1;
                size.bytes -= item.bytes;
                item.timestamp = Date.now();
            }
        }

        function getByteSize() {
            return size.bytes;
        }

        function getCount() {
            return size.count;
        }

        function elapsed(key) {
            return Date.now() - get(key).timestamp;
        }

        function getTime(key) {
            return get(key).timestamp;
        }

        function change() {
            api.dispatch(cacheEvents.CHANGE, api);
        }

        function getCache(objOrStr) {
            var key = getKey(objOrStr), result;
            result = get(key);
            if (isExpired(result)) {
                this.warn("%s Cache %s is expired", name, key);
                remove(key);
                result = null;
            }
            return result && result.value || undefined;
        }

        function setCache(objOrStr, value) {
            var key = getKey(objOrStr);
            set(key, value);
            cacheUtil.mergePaginatedCache(memoryCache, key, getPaginationOffsetLimit(value));
//            cleanUp();
        }

        function getKey(objOrStr) {
            if (typeof objOrStr === 'string') {
                return objOrStr;
            }
            objOrStr = objKeys.filter(objOrStr, config.paramsFilter);
            integerizePaginationValue(objOrStr);
            return objKeys.objectToKey(objOrStr);
        }

        function isExpired(cacheItem) {
            if (config.expireSeconds && cacheItem) {
                var milliseconds = config.expireSeconds * 1000,
                    now = Date.now(),
                    cutoff = now - milliseconds;
                return cacheItem.timestamp < cutoff;
            }
            return false;
        }

        function integerizePaginationValue(data) {
            if (typeof data === "object" && config.pagination) { // always select the first page if getting a cached page response.
                var path = config.pagination.offset.split('.');
                var lastProperty = path.pop();
                objKeys.walkPath(data, path.join('.'))[lastProperty] = getPaginationOffsetLimit(data);
            }
        }

        function getPaginationOffsetLimit(data) {
            if (typeof data === "object" && config.pagination) { // always select the first page if getting a cached page response.
                return parseInt(objKeys.walkPath(data, config.pagination.offset), 10);
            }
            return 0;
        }

        api.events = cacheEvents;
        api.getConfig = getConfig;
        api.setConfig = setConfig;
        api.get = getCache;
        api.set = setCache;
        api.remove = remove;
        api.removeAll = removeAll;
        api.getBytesSize = getByteSize;
        api.getCount = getCount;
        api.elapsed = elapsed;
        api.getTime = getTime;
        return api;
    }


    function ObjectCacheManager($rootScope, addons) {
        var cache = {},
            localStorage = null;

        $rootScope.$on(cacheEvents.CHANGE, onCacheChange);

        function create(name, config) {
            var item = cache[name] = cache[name] || new Cache(this, name);
            if (config) {
                item.setConfig(config);
            }
            return applyAddons(item, addons);
        }

        function applyAddons(item, addons) {
            var i = 0, len = addons.length;
            while (i < len) {
                addons[i](item);
                i += 1;
            }
            return item;
        }

        function destroy(name) {
            if (cache[name]) {
                cache[name].removeAll();
                delete cache[name];
            }
        }

        function get(name) {
            return cache[name];
        }

        function clear(name) {
            get(name).removeAll();
        }

        function getTotalSize() {
            var result = util.getBytesSize(getTotalSizeInBytes());
            this.info("TOTAL SERVICE CACHE SIZE %s", result);
            return result;
        }

        function getTotalSizeInBytes() {
            var total = 0;
            each(cache, function (cacheItem) {
                total += cacheItem._totalSize;
            });
            return total;
        }

        function onCacheChange(event, cache) {

        }

//TODO: this should be called stores.
//TODO: setup a directory with a few stores examples localStorage, redis, mongodb, phonegap
//TODO: Should this be able to add a store to a config?
//TODO: default store set on manager. So default can also be a store stack.
        //TODO: (store list/store stack) passed to a single cache will override the default and use these caches instead.
        function addStore(localStorageManager, methodMap) {
            //TODO: validate interface to make sure all methdos I use are defined.
            if (!storage && methodMap.isSupported.apply(localStorageManager)) {
                this.info("localStorage instantiated");
                storage = new LocalStorage(localStorageManager, methodMap);
            } else {
                this.info("localStorage is not supported");
            }
        }

        this.create = create;
        this.destroy = destroy;
        this.clear = clear;
        this.get = get;
        this.clear = clear;
        this.getTotalSize = getTotalSize;
        this.getTotalSizeInBytes = getTotalSizeInBytes;
        this.addStore = addStore;
    }

    angular.module('ngCache', []).service('cacheManager', ['$rootScope', 'objectKeys', 'dispatcher', 'logDispatcher', function ($rootScope, objectKeys, dispatcher, logDispatcher) {
        each = objectKeys.each;
        var result = new ObjectCacheManager($rootScope, [dispatcher, logDispatcher]);
        objKeys = objectKeys;
        dispatcher(result);
        logDispatcher(result);
        return result;
    }]);

}());
