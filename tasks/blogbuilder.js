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
    var RSS, feed, newObj, permalink, post, post_items, chunk, postChunks = [], md, mdcontent, meta, data, options, output, path, Handlebars, MarkedMetaData, posts, pages, postTemplate, pageTemplate, indexTemplate, archiveTemplate;

    // Merge task-specific and/or target-specific options with these defaults.
    options = this.options({
      punctuation: '.',
      separator: ', ',
      size: 5,
      year: new Date().getFullYear()
    });

    // Get Handlebars
    Handlebars = require('handlebars');

    // Get RSS
    RSS = require('rss');

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
    archiveTemplate = Handlebars.compile(grunt.file.read(options.template.archive));

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
            },
            year: options.year
        };
        output = postTemplate(data);

        // Write post to destination
        path = options.www.dest + '/blog/' + (file.replace(options.src.posts, '').replace('.md', ''));
        grunt.file.mkdir(path);
        grunt.file.write(path + '/index.html', output);
    });

    // Generate archive
    post_items = posts.reverse();
    data = {
        data: options.data,
        posts: []
    };

    // Get the posts
    for (post in post_items) {
        // Convert it to Markdown
        md = new MarkedMetaData(post_items[post]);
        md.defineTokens('---', '---');
        mdcontent = md.markdown();
        meta = md.metadata();

        // Push it to the array
        permalink = '/blog/' + post_items[post].replace(options.src.posts, '').replace('.md', '') + '/';
        newObj = {
            meta: {
                title: meta.title.replace(/"/g, ''),
                permalink: permalink
            },
            post: {
                content: mdcontent
            }
        };
        data.posts.push(newObj);
    }
    output = archiveTemplate(data);

    // Write the content to the file
    path = options.www.dest + '/archive/';
    grunt.file.mkdir(path);
    grunt.file.write(path + '/index.html', output);

    // Generate RSS feed
    post_items = posts.slice(0, 20);
    feed = new RSS({
        title: options.data.title,
        description: options.data.description
    });

    // Get the posts
    for (post in post_items) {
        // Convert it to Markdown
        md = new MarkedMetaData(post_items[post]);
        md.defineTokens('---', '---');
        mdcontent = md.markdown();
        meta = md.metadata();

        // Render the Handlebars template with the content
        permalink = '/blog/' + post_items[post].replace(options.src.posts, '').replace('.md', '') + '/';
        data = {
            data: options.data,
            meta: {
                title: meta.title.replace(/"/g, ''),
                permalink: permalink
            },
            post: {
                content: mdcontent
            }
        };

        // Add to feed
        feed.item({
            title: data.meta.title,
            description: data.post.content,
            url: data.meta.permalink
        });
    }

    // Write the content to the file
    path = options.www.dest + '/rss.xml';
    grunt.file.write(path, feed.xml({indent: true}));

    // Generate index
    // First, break it into chunks
    post_items = posts;
    while (post_items.length > 0) {
        postChunks.push(post_items.splice(0, options.size));
    }

    // Then, loop through each chunk and write the content to the file
    for (chunk in postChunks) {
        data = {
            data: options.data,
            posts: []
        };

        // Get the posts
        for (post in postChunks[chunk]) {
            // Convert it to Markdown
            md = new MarkedMetaData(postChunks[chunk][post]);
            md.defineTokens('---', '---');
            mdcontent = md.markdown();
            meta = md.metadata();

            // Push it to the array
            permalink = '/blog/' + postChunks[chunk][post].replace(options.src.posts, '').replace('.md', '') + '/';
            newObj = {
                meta: {
                    title: meta.title.replace(/"/g, ''),
                    permalink: permalink
                },
                post: {
                    content: mdcontent
                }
            };
            data.posts.push(newObj);
        }

        // Generate content
        if (Number(chunk) + 1 < postChunks.length) {
          data.nextChunk = Number(chunk) + 2;
        }
        if (Number(chunk) + 1 > 1) {
          data.prevChunk = Number(chunk);
        }
        output = indexTemplate(data);

        // If this is the first page, also write it as the index
        if (chunk === "0") {
            grunt.file.write(options.www.dest + '/index.html', output);
        }

        // Write the content to the file
        path = options.www.dest + '/posts/' + (Number(chunk) + 1);
        grunt.file.mkdir(path);
        grunt.file.write(path + '/index.html', output);
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
