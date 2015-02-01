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
    var langs, hljs, content, RSS, feed, newObj, permalink, post, post_items, chunk, postChunks = [], md, mdcontent, meta, data, options, output, path, Handlebars, MarkedMetadata, posts, pages, postTemplate, pageTemplate, indexTemplate, archiveTemplate, notFoundTemplate;

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

    // Get Highlight.js
    hljs = require('highlight.js');

    // Get languages
    langs = hljs.listLanguages();

    // Register partials
    Handlebars.registerPartial({
        header: grunt.file.read(options.template.header),
        footer: grunt.file.read(options.template.footer)
    });

    // Get Marked Metadata
    MarkedMetadata = require('meta-marked');
    MarkedMetadata.setOptions({
        gfm: true,
        tables: true,
        smartLists: true,
        smartypants: true,
        langPrefix: 'hljs lang-',
        highlight: function (code, lang) {
            if (typeof lang !== "undefined" && langs.indexOf(lang) > 0) {
                return hljs.highlight(lang, code).value;
            } else {
                return hljs.highlightAuto(code).value;
            }
        }
    });

    // Get matching files
    posts = grunt.file.expand(options.src.posts + '*.md', options.src.posts + '*.markdown');
    pages = grunt.file.expand(options.src.pages + '*.md', options.src.pages + '*.markdown');

    // Get Handlebars templates
    postTemplate = Handlebars.compile(grunt.file.read(options.template.post));
    pageTemplate = Handlebars.compile(grunt.file.read(options.template.page));
    indexTemplate = Handlebars.compile(grunt.file.read(options.template.index));
    archiveTemplate = Handlebars.compile(grunt.file.read(options.template.archive));
    notFoundTemplate = Handlebars.compile(grunt.file.read(options.template.notfound));

    // Generate pages
    pages.forEach(function (file) {
        // Convert it to Markdown
        content = grunt.file.read(file);
        md = new MarkedMetadata(content);
        mdcontent = md.html;
        meta = md.meta;

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
        path = options.www.dest + '/' + (file.replace(options.src.pages, '').replace(/(\d{4})-(\d{2})-(\d{2})-/, '$1/$2/$3/').replace('.markdown', '').replace('.md', ''));
        grunt.file.mkdir(path);
        grunt.file.write(path + '/index.html', output);
    });

    // Generate posts
    posts.forEach(function (file) {
        // Convert it to Markdown
        content = grunt.file.read(file);
        md = new MarkedMetadata(content);
        mdcontent = md.html;
        meta = md.meta;

        // Render the Handlebars template with the content
        data = {
            data: options.data,
            path: '/blog/' + (file.replace(options.src.posts, '').replace(/(\d{4})-(\d{2})-(\d{2})-/, '$1/$2/$3/').replace('.markdown', '').replace('.md', '')),
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
        path = options.www.dest + '/blog/' + (file.replace(options.src.posts, '').replace(/(\d{4})-(\d{2})-(\d{2})-/, '$1/$2/$3/').replace('.markdown', '').replace('.md', ''));
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
        content = grunt.file.read(post_items[post]);
        md = new MarkedMetadata(content);
        mdcontent = md.html;
        meta = md.meta;

        // Push it to the array
        permalink = '/blog/' + post_items[post].replace(options.src.posts, '').replace(/(\d{4})-(\d{2})-(\d{2})-/, '$1/$2/$3/').replace('.md', '').replace('.markdown', '') + '/';
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
    path = options.www.dest + '/blog/archives/';
    grunt.file.mkdir(path);
    grunt.file.write(path + '/index.html', output);

    // Generate RSS feed
    post_items = posts.slice(0, 20);
    feed = new RSS({
        title: options.data.title,
        description: options.data.description,
        url: options.data.url
    });

    // Get the posts
    for (post in post_items) {
        // Convert it to Markdown
        content = grunt.file.read(post_items[post]);
        md = new MarkedMetadata(content);
        mdcontent = md.html;
        meta = md.meta;

        // Render the Handlebars template with the content
        permalink = options.data.url + '/blog/' + post_items[post].replace(options.src.posts, '').replace(/(\d{4})-(\d{2})-(\d{2})-/, '$1/$2/$3/').replace('.markdown', '').replace('.md', '') + '/';
        data = {
            data: options.data,
            meta: {
                title: meta.title.replace(/"/g, ''),
                permalink: permalink,
                date: meta.date
            },
            post: {
                content: mdcontent
            }
        };

        // Add to feed
        feed.item({
            title: data.meta.title,
            description: data.post.content,
            url: data.meta.permalink,
            date: data.meta.date
        });
    }

    // Write the content to the file
    path = options.www.dest + '/atom.xml';
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
            content = grunt.file.read(postChunks[chunk][post]);
            md = new MarkedMetadata(content);
            mdcontent = md.html;
            meta = md.meta;

            // Push it to the array
            permalink = '/blog/' + postChunks[chunk][post].replace(options.src.posts, '').replace(/(\d{4})-(\d{2})-(\d{2})-/, '$1/$2/$3/').replace('.markdown', '').replace('.md', '') + '/';
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

    // Create 404 page
    newObj = {
        data: options.data
    };

    output = notFoundTemplate(newObj);
    path = options.www.dest;
    grunt.file.mkdir(path);
    grunt.file.write(path + '/404.html', output);

    // Create robots.txt file
    grunt.file.write(options.www.dest + '/robots.txt', 'User-agent: *\nDisallow:');

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
