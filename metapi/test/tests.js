/* globals describe, before, it */

var assert = require('assert');
var jsdom = require('jsdom');
var mp = require('../metapi.js').metapi;
var obj = require('./object-equality.js');

var metapi;

describe("metapi", () => {
  before(done => {
    jsdom.env({
      url: 'http://chat.stackexchange.com/rooms/11540/charcoal-hq',
      scripts: ['https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js'],
      done: function (err, window) {
        if (err) {
          console.error(err);
          done(err);
          return;
        }
        metapi = mp(window.$);
        done();
      }
    });
  });

  describe("Cache", () => {
    var cache;
    before(() => {
      cache = new metapi.Cache();
    });

    describe("constructor", () => {
      it("should return a valid Cache object", () => {
        assert(cache.hasOwnProperty("add"));
        assert(cache.hasOwnProperty("get"));
        assert(cache.hasOwnProperty("delete"));
      });
    });

    describe("add", () => {
      it("should add a nonexistent value to the cache", () => {
        cache.add("test_key", {this: 'is', a: 'test'});
      });

      it("should refuse to overwrite without overwrite specified", () => {
        assert.throws(() => {
          cache.add("test_key", {this: 'should', throw: 'an error'});
        }, ReferenceError);
      });

      it("should overwrite when told to", () => {
        cache.add("test_key", {this: 'should', overwrite: 'previous data'}, {overwrite: true});
      });
    });

    describe("get", () => {
      it("should retrieve the most recent value", () => {
        assert(obj.equal({this: 'should', overwrite: 'previous data'}, cache.get("test_key")));
      });

      it("should return null for nonexistent values", () => {
        assert.equal(null, cache.get("foo"));
      });

      it("should throw errors when told to", () => {
        assert.throws(() => {
          cache.get("foo", {throwOnFail: true});
        }, ReferenceError);
      });
    });

    describe("delete", () => {
      it("should remove an existing key", () => {
        cache.delete("test_key");
        assert.equal(null, cache.get("test_key"));
      });

      it("should not care if the key doesn't exist", () => {
        assert.doesNotThrow(() => {
          cache.delete("foo");
        });
      });
    });
  });

  describe("Response", () => {
    describe("constructor", () => {
      it("should return a valid Response object", () => {
        var data = {a: 'b', c: 'd'};
        var response = new metapi.Response(true, data);
        assert(response.hasOwnProperty("success"));
        assert(response.hasOwnProperty("data"));
        assert(!response.hasOwnProperty("error_name"));
        assert(!response.hasOwnProperty("error_code"));
        assert(!response.hasOwnProperty("error_message"));
        assert(obj.equal(response.data, data));
      });

      it("should set error properties if success is false", () => {
        var data = {error_name: 'test', error_code: 0, error_message: 'test'};
        var response = new metapi.Response(false, data);
        assert(response.hasOwnProperty("success"));
        assert(!response.hasOwnProperty("data"));
        assert(response.hasOwnProperty("error_name"));
        assert(response.hasOwnProperty("error_code"));
        assert(response.hasOwnProperty("error_message"));

        assert.equal(data.error_name, response.error_name);
        assert.equal(data.error_code, response.error_code);
        assert.equal(data.error_message, response.error_message);
      });
    });
  });

  describe("Filter", () => {
    describe("constructor", () => {
      it("should return a valid Filter object", () => {
        var filter = new metapi.Filter(["posts.id"]);
        assert(filter.hasOwnProperty("success"));
        assert(filter.hasOwnProperty("filter"));
        assert(filter.hasOwnProperty("included_fields"));
        assert(filter.hasOwnProperty("api_field_mappings"));

        assert(!filter.hasOwnProperty("error_name"));
        assert(!filter.hasOwnProperty("error_code"));
        assert(!filter.hasOwnProperty("error_message"));
      });
    });
  });

  // Can't (yet) test the WebSocket class because we need a Node websocket library to inject into metapi in place of
  // window.WebSocket.
  //
  // describe("WebSocket", () => {
  //   var socket;
  //   before(done => {
  //     socket = new metapi.WebSocket("wss://sandbox.kaazing.org/echo", () => {
  //       done();
  //     });
  //   });
  //
  //   var messageCallback = () => {};
  //
  //   describe("constructor", () => {
  //     it("should return a valid WebSocket object", () => {
  //       assert(socket.hasOwnProperty("_conn"));
  //       assert(socket.hasOwnProperty("getCallbacks"));
  //       assert(socket.hasOwnProperty("addCallback"));
  //       assert(socket.hasOwnProperty("removeCallback"));
  //       assert(socket.hasOwnProperty("send"));
  //     });
  //   });
  //
  //   describe("addCallback", () => {
  //     it("should add a callback to the list", () => {
  //       socket.addCallback(messageCallback);
  //     });
  //   });
  //
  //   describe("getCallbacks", () => {
  //     it("should return a list of all callbacks", () => {
  //       var callbacks = socket.getCallbacks();
  //       assert.equal(1, callbacks.length);
  //       assert.equal([messageCallback], callbacks);
  //     });
  //   });
  //
  //   describe("removeCallbacks", () => {
  //     it("should remove a callback from the list", () => {
  //       socket.removeCallback(messageCallback);
  //       var callbacks = socket.getCallbacks();
  //       assert.equal(0, callbacks.length);
  //     });
  //   });
  //
  //   describe("send", () => {
  //     it("should send a message", () => {
  //       socket.send("test");
  //     });
  //   });
  //
  //   it("should call callbacks when a message is received", done => {
  //     socket.addCallback(data => {
  //       var message = data.data;
  //       assert.equal('test', message);
  //       done();
  //     });
  //     socket.send('test');
  //   });
  // });
});
