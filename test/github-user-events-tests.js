/* global describe, beforeEach, afterEach, flush, it, fixture, assert, sinon, Polymer */
describe('github-user-events', function () {
    var element, server,
        username = 'dpobel';

    function configureServerResponse(server, code, response, username) {
        server.respondWith(
            'GET',
            `https://api.github.com/users/${username}/events`,
            [code, {"Content-Type": "application/json"}, JSON.stringify(response)]
        );
    }

    beforeEach(function (done) {
        server = sinon.fakeServer.create();

        element = fixture('github-user-events-fixture');
        flush(done);
    });

    afterEach(function () {
        server.restore();
    });

    describe('properties', function () {
        describe('loading', function () {
            it('should be true while loading', function () {
                assert.isTrue(element.loading);
                assert.strictEqual(element.getAttribute('loading'), "");
            });

            it('should be false when getting a successful response', function (done) {
                configureServerResponse(server, 200, [], username);
                server.respond();
                flush(function () {
                    assert.isFalse(element.loading);
                    assert.isNull(element.getAttribute('loading'));
                    done();
                });
            });

            it('should be false when getting an error response', function (done) {
                configureServerResponse(server, 404, [], username);
                server.respond();
                flush(function () {
                    assert.isFalse(element.loading);
                    assert.isNull(element.getAttribute('loading'));
                    done();
                });
            });
        });

        describe('error', function () {
            it('should be false by default', function () {
                assert.isFalse(element.error);
                assert.isNull(element.getAttribute('error'));
            });

            it('should be falsy with a successful response', function (done) {
                configureServerResponse(server, 200, [], username);
                server.respond();

                flush(function () {
                    assert.notOk(element.error);
                    assert.isNull(element.getAttribute('error'));
                    done();
                });
            });

            it('should be truthy with an error response', function (done) {
                configureServerResponse(server, 404, [], username);
                server.respond();

                flush(function () {
                    assert.ok(element.error);
                    assert.strictEqual(element.getAttribute('error'), "");
                    done();
                });
            });
        });

        describe('events', function () {
            it('should be an empty array by default', function () {
                assert.isArray(element.events);
                assert.equal(element.events.length, 0);
            });

            describe('parsers', function () {
                var rawEvent = {
                        type: 'RunningUnitTestEvent',
                        created_at: "2016-02-24T10:44:27Z",
                        repo: {},
                    };

                it('should unify events', function (done) {
                    var event;

                    configureServerResponse(server, 200, [rawEvent], username);
                    server.respond();

                    flush(function () {
                        assert.isArray(element.events);
                        assert.equal(element.events.length, 1);
                        event = element.events[0];

                        assert.equal(event.type, "Running Unit Test");
                        assert.equal(event.created, "Wed, 24 Feb 2016 10:44:27 GMT");
                        assert.deepEqual(event.repository, rawEvent.repo);
                        done();
                    });
                });
            });
        });

        describe('username', function () {
            it('should refetch the events based on the username', function (done) {
                var newUsername = 'user',
                    rawEvent = {
                        type: 'UpdateUserEvent',
                    };

                configureServerResponse(server, 200, [rawEvent], newUsername);
                element.username = newUsername;
                server.respondImmediately = true;
                server.respond();

                flush(function () {
                    assert.equal(element.getAttribute('username'), newUsername);
                    assert.isFalse(element.loading);
                    assert.equal(element.events[0].type, 'Update User');
                    done();
                });
            });

        });
    });

    describe('dom', function () {
        it('should generate an item per returned event', function (done) {
            var rawEvent = {
                    type: 'RunningUnitTestEvent',
                },
                response = [rawEvent, rawEvent, rawEvent];

            configureServerResponse(server, 200, response, username);
            server.respond();
            flush(function () {
                var items = Polymer.dom(element.root).querySelectorAll('paper-item');

                assert.equal(items.length, response.length + 2);
                done();
            });
        });
    });
});
