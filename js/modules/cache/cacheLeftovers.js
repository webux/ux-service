function ObjectCacheX(name) {
        var cache = {},
            totalSize = 0,

            /**
             * if set to true, serviceQueue will cache calls from this request that match the same params.
             */
                _cacheResults = false,

            /**
             * Params that can be ignored when comparing for a cached request.
             */
                _ignoreParamsOnCacheCheck = null,

            /**
             * For pagination caching this will append the cached result to the first call
             * if it is executed from cache for all pages that have been loaded.
             */
                _limitOffset = null,

            /**
             * The path to drill down into on response data to find the array to merge for
             * concatination.
             */
                _resultsArrayPath = null,

            _countLimit = 0,
            _expireSeconds = 0,
            _memoryLimit = 0;

        function getStorageKey(cacheKey) {
            return name + cacheKey;
        }

        function get(cacheKey) {
            var result = cache[cacheKey],
                storageKey;
            if (storage && result) {
                storageKey = getStorageKey(cacheKey);
                result.response = storage.get(storageKey);
                this.log("localStorage get for %s", storageKey);
            }
            return result;
        }

        function set(cacheKey, value) {
            var storageKey;
            cache[cacheKey] = value;
            calculateSize(value);
            if (storage) {
                storageKey = getStorageKey(cacheKey);
                storage.set(storageKey, value.response);
                value.response = null;
                this.log("localStorage put for %s", storageKey);
                ObjectCacheManager.getTotalCacheSize();
            }
        }

        function remove(cacheKey) {
            var cacheItem = cache[cacheKey],
                storageKey;
            this._totalSize -= cacheItem.size;
            if (storage) {
                storageKey = getStorageKey(cacheKey);
                storage.remove(storageKey);
                this.log("localStorage remove for %s", storageKey);
            }
            delete cache[cacheKey];
        }

        function removeAll() {
            this.info("%s CLEAR CACHE ", this.name);
            each(this._cache, function (cache, key) {
                remove(key);
            }.bind(this));
        }

        function calculateSize(cacheItem) {
            cacheItem.size = util.sizeOfObject(cacheItem.response);
            totalSize += cacheItem.size;
            this.warn("%s Cache Size %s", name, getCacheSize());
        }

        function getCache(params) {
            var key,
                result;
            params = filterPropertiesFromObject(params, ignoreParamsOnCacheCheck);
            integerizePaginationValue(params);
            key = ObjectKeys.objectToKey(params);
            result = get(key);
            if (isExpired(result)) {
                this.warn("%s Cache %s is expired", name, key);
                remove(key);
                result = null;
            }
            return result;
        }

        function setCache(response, params) {
            var key,
                value;
            params = filterPropertiesFromObject(params, this.ignoreParamsOnCacheCheck);
            integerizePaginationValue(params);
            key = ObjectKeys.objectToKey(params);
            value = {key: key, time: new Date().getTime(), response: response};
            set(key, value);
            mergePaginatedCache(key);
            cleanUp();
        }

        function clear(key) {
            if (key) {
                remove(key);
            } else { // clear all
                removeAll();
            }
        }

        /**
         * If this is set to true if the serviceQueue should cache results from this call.
         * @param {Boolean=} value
         * @param {Array=} ignoreParams - properties that you want removed when comparing caching params. This is handy
         * for removing cacheBusters that are messing up your cache.
         */
        function cacheResults(value, ignoreParams) {
            if (value !== undefined) {
                cacheResults = value === true;
            }
            if (ignoreParams !== undefined) {
                ignoreParamsOnCacheCheck = ignoreParams;
            }
            return cacheResults;
        }

        /**
         * Setup caching for pagination.
         * @param {String=} limitOffset - this is used for when you want to have the results merged from your
         * paginated response. So if you have a "start" property that specifies the index that you pagination is
         * starting at on the result this property would be "start".
         * @param {String=} resultsArrayPath - this is the path that points to the array that you want merged for
         * your paginated responses.
         */
        function pagination(limitOffset, resultsArrayPath) {
            if (limitOffset !== undefined) {
                limitOffset = limitOffset;
            }
            if (resultsArrayPath !== undefined) {
                resultsArrayPath = resultsArrayPath;
            }
        }

        function countLimit(limit) {
            if (limit !== undefined) {
                _countLimit = limit;
            }
            return _countLimit;
        }

        function expireSeconds(seconds) {
            if (seconds !== undefined) {
                _expireSeconds = seconds;
            }
            return _expireSeconds;
        }

        function memoryLimit(bytes) {
            if (bytes !== undefined) {
                _memoryLimit = bytes;
            }
            return _memoryLimit;
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

        function mergePaginatedCache(paramsAsStr) {
            var list;
            if (limitOffset) {
                this.log("\t_mergePaginatedCache on %s", limitOffset);
                // the request is paginated. Load all of the pages that we have in order.
                list = [];
                var keyWithoutPagesParam = dropPropertyFromKey(paramsAsStr, limitOffset);
                each(_cache, function (value, key) {
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

        function integerizePaginationValue(data) {
            if (limitOffset) { // always select the first page if getting a cached page response.
                data[limitOffset] = parseInt(data[limitOffset], 10);
            }
        }

        /**
         * Generate the list of items so we can sort it correctly and then have all cleanup functions perform
         * their cleanup on the same array to make them faster.
         */
        function cleanUp() {
            var list = [];
            each(this._cache, function (item) {
                list.push(item);
            });
            list = sortListBy(list, 'time');
            clearOverCountCache(list);
            clearExpiredCache(list);
            clearOverMemoryLimitCache(list);
        }

        function getCacheSize() {
            return util.getBytesSize(_totalSize);
        }

        function sortListBy(list, p, desc) {
            if (desc) {
                desc = 1;
            } else {
                desc = 0;
            }
            var sortfunc = function (a, b) {// handle both numbers and strings.
                return desc ? (b[p] > a[p] ? 1 : (a[p] > b[p] ? -1 : 0)) : (b[p] < a[p] ? 1 : (a[p] < b[p] ? -1 : 0));
            };
            return list.sort(sortfunc);
        }

        function clearOverCountCache(list) {
            if (countLimit) { // only clear if there is a limit. 0 === unlimited.
                while (list.length > countLimit) {
                    this.warn("\t\tremoving over count cache item %s", list[0].key);
                    this.clear(list.shift().key); // remove oldest. Sorted lowest to largest
                }
            }
        }

        function clearExpiredCache(list) {
            var milliseconds,
                now,
                cutoff;
            if (expireSeconds) {
                milliseconds = expireSeconds * 1000;
                now = new Date().getTime();
                cutoff = now - milliseconds;
                while (list[0].time < cutoff) {
                    this.warn("\t\tremoving expired cache item %s", list[0].key);
                    clear(list.shift().key);
                }
            }
        }

        function isExpired(cacheItem) {
            if (expireSeconds && cacheItem) {
                var milliseconds = expireSeconds * 1000,
                    now = new Date().getTime(),
                    cutoff = now - milliseconds;
                return cacheItem.time < cutoff;
            }
            return false;
        }

        function clearOverMemoryLimitCache(list) {
            var usedMemory;
            if (_memoryLimit) {
                while (totalSize > _memoryLimit) {
                    this.warn("\t\tremoving over memory cache item %s", list[0].key);
                    this.clear(list.shift().key);
                }
                this.info("\tcache size %s", getCacheSize());
            }
        }

        function doesKeyMatchWithoutParam(keyToMatch, keyToRemovePropertyFrom, property) {
            var newKey = dropPropertyFromKey(keyToRemovePropertyFrom, property);
            return keyToMatch === newKey;
        }

        function filterPropertiesFromObject(params, properties) {
            var data = angular.copy(params || {});// clone it.;
            if (properties) {
                each(properties, function (property) {
                    delete data[property];
                });
            }
            return data;
        }

        return api;
    }