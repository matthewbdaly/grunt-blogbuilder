'use strict';

var grunt = require('grunt');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports.blogbuilder = {
  setUp: function (done) {
    // setup here if necessary
    done();
  },
  default: function (test) {
    // Declare variables
    var file;

    // Test RSS feed
    file = grunt.file.read('tmp/build/atom.xml');
    test.ok(file, 'RSS feed should exist.');

    test.done();
  }
};
