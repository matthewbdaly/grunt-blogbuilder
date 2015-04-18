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
    var actual, expected;

    // Test RSS feed
    actual = grunt.file.read('tmp/build/atom.xml');
    expected = grunt.file.read('test/expected/atom.xml');
    test.equal(actual, expected, 'should generate an RSS feed with one item.');

    test.done();
  }
};
