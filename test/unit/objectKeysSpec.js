describe("objectKeys", function() {
    var injector = angular.injector(['app']),
        objectKeys = injector.get('objectKeys'),
        obj = {name:'Wes', job:'developer'},
        key = '{"job":"developer","name":"Wes"}';
    it("should put an object an its keys in alphabetical order json string", function() {
        var result = objectKeys.objectToKey(obj);
        expect(result).toBe(key);
    });

    it("should convert a key back to an object", function() {
        var result = objectKeys.keyToObject(key);
        expect(result.name).toBe(obj.name);
        expect(result.job).toBe(obj.job);
    });

    it("should walk a path", function() {
        expect(objectKeys.walkPath({
            user: {
                name: 'Wes'
            }
        }, 'user.name')).toBe('Wes');
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