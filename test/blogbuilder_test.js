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

    // Test for RSS feed
    file = grunt.file.read('tmp/build/rss.xml');
    test.ok(file, 'RSS feed should exist.');

    // Test for Atom feed
    file = grunt.file.read('tmp/build/atom.xml');
    test.ok(file, 'Atom feed should exist');

    // Test for 404 page
    file = grunt.file.read('tmp/build/404.html');
    test.ok(file, '404 page should exist');

    // Test for robots.txt
    file = grunt.file.read('tmp/build/robots.txt');
    test.ok(file, 'robots.txt should exist');

    // Test for lunr.json
    file = grunt.file.read('tmp/build/lunr.json');
    test.ok(file, 'lunr.json should exist');

    // Test for index page
    file = grunt.file.read('tmp/build/index.html');
    test.ok(file, 'index page should exist');

    // Test for about page
    file = grunt.file.read('tmp/build/about/index.html');
    test.ok(file, 'about page should exist');

    // Test for post index
    file = grunt.file.read('tmp/build/posts/1/index.html');
    test.ok(file, 'post index should exist');

    // Test for individual posts
    file = grunt.file.read('tmp/build/blog/2015/01/17/my-new-blog-post/index.html');
    test.ok(file, 'individual post should exist');

    // Test for AMP posts
    file = grunt.file.read('tmp/build/blog/2015/01/17/my-new-blog-post/amp/index.html');
    test.ok(file, 'individual post should exist');

    // Test for archives
    file = grunt.file.read('tmp/build/blog/archives/index.html');
    test.ok(file, 'archive page should exist');

    // Test for category pages
    file = grunt.file.read('tmp/build/blog/categories/test/index.html');
    test.ok(file, 'category page should exist');

    // Test for category RSS feed
    file = grunt.file.read('tmp/build/blog/categories/test/rss.xml');
    test.ok(file, 'category RSS feed should exist');

    // Test for category Atom feed
    file = grunt.file.read('tmp/build/blog/categories/test/atom.xml');
    test.ok(file, 'category Atom feed should exist');

    // Finish up
    test.done();
  }
};
