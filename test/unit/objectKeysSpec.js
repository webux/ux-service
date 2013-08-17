describe("objectKeys", function() {
    var injector = angular.injector(['app']),
        objectKeys = injector.get('objectKeys'),
        obj = {
            user: {
                name:'Wes',
                job:'developer'
            }
        },
        key = '{"user":{"job":"developer","name":"Wes"}}';
    it("should put an object an its keys in alphabetical order json string", function() {
        var result = objectKeys.objectToKey(obj);
        expect(result).toBe(key);
    });

    it("should convert a key back to an object", function() {
        var result = objectKeys.keyToObject(key);
        expect(result.user.name).toBe(obj.user.name);
        expect(result.user.job).toBe(obj.user.job);
    });

    it("should walk a path", function() {
        expect(objectKeys.walkPath(obj, 'user.name')).toBe('Wes');
    });

    it("hasPath should return true if that path exists", function() {
        expect(objectKeys.hasPath(obj, 'user.name')).toBe(true);
    });

    it("hasPath should return false if that path does not exist", function() {
        expect(objectKeys.hasPath(obj, 'user.foo')).toBe(false);
    });

    it("removePath should remove a path", function() {
        var clone = angular.copy(obj);
        objectKeys.removePath(clone, 'user.name');
        expect(objectKeys.hasPath(clone, 'user.name')).toBe(false);
    });

    describe("filter", function() {
        it("should filter out properties not in an object", function() {
            var result = objectKeys.filter({one:1, two:2,three:3}, ['one', 'two']);
            expect(result.one).toBe(1);
            expect(result.two).toBe(2);
            expect(result.three).toBeUndefined();
        });

        it("should filter with a custom function", function() {
            var result = objectKeys.filter({one:1, two:2,three:3}, function(value, key) {
                return (key === 'one' || key === 'two');
            });
            expect(result.one).toBe(1);
            expect(result.two).toBe(2);
            expect(result.three).toBeUndefined();
        });
    });
});