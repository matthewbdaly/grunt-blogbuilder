/*
 * blogbuilder
 * 
 *
 * Copyright (c) 2014 Matthew Daly
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('blogbuilder', 'Grunt plugin for building a blog.', function () {

    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      punctuation: '.',
      separator: ', '
    });

    // Get Handlebars
    var Handlebars = require('handlebars');

    // Register partials
    Handlebars.registerPartial({
        header: grunt.file.read(options.template.header),
        footer: grunt.file.read(options.template.footer)
    });

    // Get Marked Metadata
    var MarkedMetaData = require('marked-metadata');

    // Get matching files
    var posts = grunt.file.expand(options.src.posts + '*.md');
    var pages = grunt.file.expand(options.src.pages + '*.md');

    // Get Handlebars templates
    var postTemplate = Handlebars.compile(grunt.file.read(options.template.post));
    var pageTemplate = Handlebars.compile(grunt.file.read(options.template.page));

    // Iterate through source files
    pages.forEach(function (file) {
        // Convert it to Markdown
        var md = new MarkedMetaData(file);
        md.defineTokens('---', '---');
        var mdcontent = md.markdown();

        // Render the Handlebars template with the content
        var data = {
            data: options.data,
            post: {
                content: mdcontent
            }
        };
        var output = pageTemplate(data);

        // Write page to destination
        var path = options.www.dest + '/' + (file.replace(options.src.pages, '').replace('.md', ''));
        grunt.file.mkdir(path);
        grunt.file.write(path + '/index.html', output);
    });
    posts.forEach(function (file) {
        // Convert it to Markdown
        var md = new MarkedMetaData(file);
        md.defineTokens('---', '---');
        var mdcontent = md.markdown();

        // Render the Handlebars template with the content
        var data = {
            data: options.data,
            post: {
                content: mdcontent
            }
        };
        var output = postTemplate(data);

        // Write post to destination
        var path = options.www.dest + '/blog/' + (file.replace(options.src.posts, '').replace('.md', ''));
        grunt.file.mkdir(path);
        grunt.file.write(path + '/index.html', output);
    });

    // Iterate over all specified file groups.
    this.files.forEach(function (file) {
      // Concat specified files.
      var src = file.src.filter(function (filepath) {
        // Warn on and remove invalid source files (if nonull was set).
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        } else {
          return true;
        }
      }).map(function (filepath) {
        // Read file source.
        return grunt.file.read(filepath);
      }).join(grunt.util.normalizelf(options.separator));

      // Handle options.
      src += options.punctuation;

      // Write the destination file.
      grunt.file.write(file.dest, src);

      // Print a success message.
      grunt.log.writeln('File "' + file.dest + '" created.');
    });
  });

};
