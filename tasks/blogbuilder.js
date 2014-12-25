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

    // Declare variables
    var indexContent, post, post_items, chunk, postChunks = [], md, mdcontent, meta, data, options, output, path, Handlebars, MarkedMetaData, posts, pages, postTemplate, pageTemplate, indexTemplate;

    // Merge task-specific and/or target-specific options with these defaults.
    options = this.options({
      punctuation: '.',
      separator: ', ',
      size: 5
    });

    // Get Handlebars
    Handlebars = require('handlebars');

    // Register partials
    Handlebars.registerPartial({
        header: grunt.file.read(options.template.header),
        footer: grunt.file.read(options.template.footer)
    });

    // Get Marked Metadata
    MarkedMetaData = require('marked-metadata');

    // Get matching files
    posts = grunt.file.expand(options.src.posts + '*.md');
    pages = grunt.file.expand(options.src.pages + '*.md');

    // Get Handlebars templates
    postTemplate = Handlebars.compile(grunt.file.read(options.template.post));
    pageTemplate = Handlebars.compile(grunt.file.read(options.template.page));
    indexTemplate = Handlebars.compile(grunt.file.read(options.template.index));

    // Generate pages
    pages.forEach(function (file) {
        // Convert it to Markdown
        md = new MarkedMetaData(file);
        md.defineTokens('---', '---');
        mdcontent = md.markdown();
        meta = md.metadata();

        // Render the Handlebars template with the content
        data = {
            data: options.data,
            meta: {
                title: meta.title.replace(/"/g, '')
            },
            post: {
                content: mdcontent
            }
        };
        output = pageTemplate(data);

        // Write page to destination
        path = options.www.dest + '/' + (file.replace(options.src.pages, '').replace('.md', ''));
        grunt.file.mkdir(path);
        grunt.file.write(path + '/index.html', output);
    });

    // Generate posts
    posts.forEach(function (file) {
        // Convert it to Markdown
        md = new MarkedMetaData(file);
        md.defineTokens('---', '---');
        mdcontent = md.markdown();
        meta = md.metadata();

        // Render the Handlebars template with the content
        data = {
            data: options.data,
            meta: {
                title: meta.title.replace(/"/g, '')
            },
            post: {
                content: mdcontent
            }
        };
        output = postTemplate(data);

        // Write post to destination
        path = options.www.dest + '/blog/' + (file.replace(options.src.posts, '').replace('.md', ''));
        grunt.file.mkdir(path);
        grunt.file.write(path + '/index.html', output);
    });

    // Generate index
    // First, break it into chunks
    post_items = posts.reverse();
    while (post_items.length > 0) {
        postChunks.push(post_items.splice(0, options.size));
    }

    // Then, loop through each chunk and write the content to the file
    for (chunk in postChunks) {
        indexContent = [];

        // Get the posts
        for (post in postChunks[chunk]) {
            // Convert it to Markdown
            md = new MarkedMetaData(postChunks[chunk][post]);
            md.defineTokens('---', '---');
            mdcontent = md.markdown();
            meta = md.metadata();

            // Get the data
            data = {
                data: options.data,
                meta: {
                    title: meta.title.replace(/"/g, '')
                },
                post: {
                    content: mdcontent
                }
            };

            // Push it to the array
            indexContent.push(data);
        }

        // If this is the first page, also write it as the index
        if (chunk === "0") {
            grunt.file.write(options.www.dest + '/index.html', '');
        }

        // Write the content to the file
        path = options.www.dest + '/posts/' + (Number(chunk) + 1);
        grunt.file.mkdir(path);
        grunt.file.write(path + '/index.html', '');
    }

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
