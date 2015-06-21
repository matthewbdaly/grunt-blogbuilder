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
    var parseUrl = require('url'), _ = require('lodash'), moment = require('moment'), recent_posts, categories, category, langs, hljs, content, Feed, feed, newObj, post, post_items = [], chunk, postChunks = [], md, mdcontent, meta, data, options, output, path, Handlebars, MarkedMetadata, posts, pages, postTemplate, pageTemplate, indexTemplate, archiveTemplate, notFoundTemplate, categoryTemplate, permalink, searchIndex, store = {}, lunr = require('lunr'), feeditem;

    // Merge task-specific and/or target-specific options with these defaults.
    options = this.options({
      punctuation: '.',
      separator: ', ',
      size: 5,
      year: new Date().getFullYear(),
    });
    options.domain = parseUrl.parse(options.data.url).hostname;

    // Get Handlebars
    Handlebars = require('handlebars');

    // Create a helper for joining arrays
    Handlebars.registerHelper('join', function (items) {
        return items.join(',');
    });

    // Create a helper for formatting categories for links
    Handlebars.registerHelper('linkformat', function (item, options) {
        return item.toLowerCase().replace(/\./g, '-');
    });

    // Create a helper for capitalizing the first letter of words
    Handlebars.registerHelper('capitalize', function (item, options) {
        // Break string into parts
        var reservedWords, word, words = item.split(' ');

        // Define reserved words
        reservedWords = [
            'a',
            'and',
            'in',
            'from',
            'to',
            'the',
            'for',
            'on',
            'of'
        ];

        // If is not one of the reserved words
        for (word in words) {
            // Skip the first word
            if (word === 0) {
                continue;
            }

            // Search for word in reservedWords
            if (reservedWords.indexOf(words[word]) === -1) {
                // Is word already capitalized?
                if (words[word].toUpperCase() !== words[word]) {
                    words[word] = words[word].charAt(0).toUpperCase() + words[word].slice(1).toLowerCase();
                }
            }
        }

        return words.join(' ');
    });

    // Get Feed
    Feed = require('feed');

    // Get Highlight.js
    hljs = require('highlight.js');

    // Set options
    hljs.configure({
        tabReplace: '    ',
        useBR: true
    });

    // Get languages
    langs = hljs.listLanguages();

    // Register partials
    Handlebars.registerPartial({
        header: grunt.file.read(options.template.header),
        footer: grunt.file.read(options.template.footer),
        sidebar: grunt.file.read(options.template.sidebar)
    });

    // Get Marked Metadata
    MarkedMetadata = require('meta-marked');

    // Create custom renderer
    var renderer = new MarkedMetadata.Renderer();
    renderer.code = function (code, lang, escaped) {
      if (this.options.highlight) {
        var out = this.options.highlight(code, lang);
        if (out != null && out !== code) {
          escaped = true;
          code = out;
        }
      }

      // Break into lines
      var codeoutput = '';
      var singleline;
      if (code.indexOf('\n') > -1) {
        singleline = false;
        var lines = code.split('\n');
        var linecount = lines.length;
        for (var i = 1; i <= linecount; i++) {
          codeoutput += ('<tr><td class="linenos" data-pseudo-content="' + i + '"></td><td>' + lines[i - 1] + '</td>');
        }
      } else {
        singleline = true;
        codeoutput = code;
      }

      // Trim trailing whitespace
      codeoutput = codeoutput.trimRight();

      if (!lang) {
        return '<pre><code' + (singleline ? ' class="singleline"' : '') + '>' +
          codeoutput + 
          '</code></pre>';
      }

      return '<pre><code class="' + 
        this.options.langPrefix +
        lang +
        (singleline ? ' singleline' : '') +
        '"><table>' +
        codeoutput +
        '</table></code></pre>\n';
    };

    // Set options
    var mdoptions = {
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
    };
    if (options.data.linenos) {
        mdoptions.renderer = renderer;
    }
    MarkedMetadata.setOptions(mdoptions);

    // Get matching files
    posts = grunt.file.expand(options.src.posts + '*.md', options.src.posts + '*.markdown');
    pages = grunt.file.expand(options.src.pages + '*.md', options.src.pages + '*.markdown');

    // Get Handlebars templates
    postTemplate = Handlebars.compile(grunt.file.read(options.template.post));
    pageTemplate = Handlebars.compile(grunt.file.read(options.template.page));
    indexTemplate = Handlebars.compile(grunt.file.read(options.template.index));
    archiveTemplate = Handlebars.compile(grunt.file.read(options.template.archive));
    notFoundTemplate = Handlebars.compile(grunt.file.read(options.template.notfound));
    categoryTemplate = Handlebars.compile(grunt.file.read(options.template.category));

    // Generate posts
    posts.forEach(function (file) {
        // Convert it to Markdown
        content = grunt.file.read(file);
        md = new MarkedMetadata(content);
        mdcontent = md.html;
        meta = md.meta;

        // Get path
        permalink = '/blog/' + (file.replace(options.src.posts, '').replace(/(\d{4})-(\d{2})-(\d{2})-/, '$1/$2/$3/').replace('.markdown', '').replace('.md', ''));
        path = options.www.dest + permalink;

        // Render the Handlebars template with the content
        data = {
            year: options.year,
            data: options.data,
            domain: options.domain,
            canonical: options.data.url + permalink + '/',
            path: permalink + '/',
            meta: {
                title: meta.title.replace(/"/g, ''),
                date: meta.date,
                formattedDate: moment(new Date(meta.date)).format('Do MMMM YYYY h:mm a'),
                categories: meta.categories || []
            },
            post: {
                content: mdcontent,
                rawcontent: content
            }
        };
        post_items.push(data);
    });

    // Sort posts
    post_items = _.sortBy(post_items, function (item) {
        return item.meta.date;
    });

    // Get recent posts
    recent_posts = post_items.slice(Math.max(post_items.length - 5, 1)).reverse();

    // Output them
    post_items.forEach(function (data, index, list) {
        // Get next and previous
        if (index < (list.length - 1)) {
            data.next = {
                title: list[index + 1].meta.title,
                path: list[index + 1].path
            };
        }
        if (index > 0) {
            data.prev = {
                title: list[index - 1].meta.title,
                path: list[index - 1].path
            };
        }

        // Get recent posts
        data.recent_posts = recent_posts;

        // Render template
        output = postTemplate(data);

        // Write post to destination
        grunt.file.mkdir(options.www.dest + data.path);
        grunt.file.write(options.www.dest + data.path + '/index.html', output);
    });

    // Generate index of posts
    searchIndex = lunr(function () {
        this.field('title', { boost: 10 });
        this.field('categories', { boost: 10 });
        this.field('body');
        this.ref('href');
    });
    for (post in post_items) {
        var doc = {
            'title': post_items[post].meta.title,
            'categories': post_items[post].meta.categories.join(','),
            'body': post_items[post].post.rawcontent,
            'href': post_items[post].path
        };
        store[doc.href] = {
            'title': doc.title
        };
        searchIndex.add(doc);
    }

    // Generate pages and add them to the index
    pages.forEach(function (file) {
        // Convert it to Markdown
        content = grunt.file.read(file);
        md = new MarkedMetadata(content);
        mdcontent = md.html;
        meta = md.meta;
        permalink = '/' + (file.replace(options.src.pages, '').replace('.markdown', '').replace('.md', ''));
        path = options.www.dest + permalink;

        // Render the Handlebars template with the content
        data = {
            year: options.year,
            data: options.data,
            domain: options.domain,
            canonical: options.data.url + permalink + '/',
            path: path,
            meta: {
                title: meta.title.replace(/"/g, ''),
                date: meta.date
            },
            post: {
                content: mdcontent,
                rawcontent: content
            },
            recent_posts: recent_posts
        };
        output = pageTemplate(data);

        // Write page to destination
        grunt.file.mkdir(path);
        grunt.file.write(path + '/index.html', output);

        // Add them to the index
        var doc = {
            'title': data.meta.title,
            'body': data.post.rawcontent,
            'href': permalink + '/'
        };
        store[doc.href] = {
            'title': data.meta.title
        };
        searchIndex.add(doc);
    });

    // Write index
    grunt.file.write(options.www.dest + '/lunr.json', JSON.stringify({
        index: searchIndex.toJSON(),
        store: store
    }));

    // Generate archive
    data = {
        year: options.year,
        data: options.data,
        domain: options.domain,
        canonical: options.data.url + '/blog/archives/',
        posts: [],
        recent_posts: recent_posts
    };

    // Get the posts
    post_items = post_items.reverse();
    for (post in post_items) {
        // Push it to the array
        data.posts.push(post_items[post]);
    }
    output = archiveTemplate(data);

    // Write the content to the file
    path = options.www.dest + '/blog/archives/';
    grunt.file.mkdir(path);
    grunt.file.write(path + '/index.html', output);

    // Generate RSS and Atom feeds
    feed = new Feed({
        title: options.data.title,
        description: options.data.description,
        link: options.data.url,
        copyright: options.data.author + ' ' + options.year,
        author: {
          name: options.data.author,
          email: options.data.email,
          link: options.data.url
        }
    });

    // Get the posts
    for (post in post_items.slice(0, 20)) {
        // Add to feed
        feeditem = {
            title: post_items[post].meta.title,
            link: options.data.url + post_items[post].path,
            date: post_items[post].meta.date,
            author: {
              name: options.data.author,
              email: options.data.email,
              link: options.data.url
            }
        };

        // If set to truncate feed items, do so
        if (options.data.truncatefeed) {
            feeditem.description = _.trunc(post_items[post].post.content, options.data.truncatefeed);
        } else {
            feeditem.description = post_items[post].post.content;
        }

        // Add to feed
        feed.addItem(feeditem);
    }

    // Write the content to the file
    //grunt.file.write(options.www.dest + '/rss.xml', feed.render('rss-2.0'));
    //grunt.file.write(options.www.dest + '/atom.xml', feed.render('atom-1.0'));

    // Create categories
    categories = {};
    _.each(post_items, function (element, index, list) {
        // Loop through each category
        for (var category in element.meta.categories) {
            // Push the object to that category's list
            if (!categories[element.meta.categories[category]]) {
                categories[element.meta.categories[category]] = [];
            }
            categories[element.meta.categories[category]].push(element);
        }
    });

    // Generate pages for categories
    _.each(categories, function (element, index, list) {
        // Loop through the categories and write them to the template
        var category_posts = [];
        for (var category_post in element) {
            category_posts.push(element[category_post]);
        }
        var data = {
            year: options.year,
            data: options.data,
            posts: category_posts,
            domain: options.domain,
            canonical: options.data.url + '/blog/categories/' + index.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '-') + '/',
            recent_posts: recent_posts,
            category: index.charAt(0).toUpperCase() + index.slice(1).toLowerCase()
        };
        output = categoryTemplate(data);

        // Write the content to the file
        path = options.www.dest + '/blog/categories/' + index.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '-') + '/';
        grunt.file.mkdir(path);
        grunt.file.write(path + '/index.html', output);
    });

    // Generate RSS feeds for categories
    _.each(categories, function (element, index, list) {
        // Loop through the categories and write them to the template
        var category_posts = [];
        for (var category_post in element) {
            category_posts.push(element[category_post]);
        }

        // Create the feed
        feed = new Feed({
            title: index + ' | ' + options.data.title,
            description: index + ' | ' + options.data.description,
            link: options.data.url + '/blog/categories/' + index.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '-') + '/'
        });

        // Get the posts
        for (var post in category_posts) {
            // Add to feed
            feed.addItem({
                title: category_posts[post].meta.title,
                description: category_posts[post].post.content,
                link: options.data.url + category_posts[post].path,
                date: category_posts[post].meta.date
            });
        }

        // Write feed
        path = options.www.dest + '/blog/categories/' + index.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '-');
        //grunt.file.write(path + '/rss.xml', feed.render('rss-2.0'));
        //grunt.file.write(path + '/atom.xml', feed.render('atom-1.0'));
    });

    // Generate index
    // First, break it into chunks
    while (post_items.length > 0) {
        postChunks.push(post_items.splice(0, options.size));
    }

    // Then, loop through each chunk and write the content to the file
    for (chunk in postChunks) {
        data = {
            year: options.year,
            data: options.data,
            domain: options.domain,
            posts: []
        };

        // Get the posts
        for (post in postChunks[chunk]) {
            data.posts.push(postChunks[chunk][post]);
        }

        // Generate content
        if (Number(chunk) + 1 < postChunks.length) {
          data.nextChunk = Number(chunk) + 2;
        }
        if (Number(chunk) + 1 > 1) {
          data.prevChunk = Number(chunk);
        }
        data.recent_posts = recent_posts;

        // Set canonical URL
        data.canonical = options.data.url + '/posts/' + (Number(chunk) + 1) + '/';

        // Generate output
        output = indexTemplate(data);

        // Write the content to the file
        path = options.www.dest + '/posts/' + (Number(chunk) + 1);
        grunt.file.mkdir(path);
        grunt.file.write(path + '/index.html', output);

        // If this is the first page, also write it as the index
        if (chunk === "0") {
            data.canonical = options.data.url + '/';
            output = indexTemplate(data);
            grunt.file.write(options.www.dest + '/index.html', output);
        }
    }

    // Create 404 page
    newObj = {
        data: options.data,
        year: options.year,
        domain: options.domain,
        canonical: options.data.url + '/404.html'
    };

    output = notFoundTemplate(newObj);
    path = options.www.dest;
    grunt.file.mkdir(path);
    grunt.file.write(path + '/404.html', output);

    // Create robots.txt file
    grunt.file.copy(options.template.robots, options.www.dest + '/robots.txt');
  });

};
