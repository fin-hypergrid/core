'use strict';

var files = {
    js: [
        'gruntfile.js',
        '*.js',
        'test/**/*.js'
    ],

    jshint: [
        'gruntfile.js',
        '*.js',
        'test/**/*.js',
    ],
    jsandhtml: [
        'gruntfile.js',
        '*.js',
        '*.html',
        'test/**/*.js',
        'test/**/*.html'
    ]
};
var delimeter = (__dirname.indexOf('/') > -1) ? '/' : '\\';
var myDir = __dirname.split(delimeter);
var elementName = myDir[myDir.length - 1];
myDir.pop();
var parentDir = myDir.join(delimeter);

module.exports = function(grunt) {
    //load all npm tasks automagically
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({

        watch: {
            jsandhtml: {
                files: files.js,
                tasks: ['jsbeautifier', 'jshint', 'concat', 'wct-test', 'vulcanize'],
            },
            gruntfile: {
                files: ['Gruntfile.js'],
                tasks: []
            },
            lr: {
                files: ['**/*.html', '*.js'],
                options: {
                    livereload: true
                },
                tasks: ['jshint']
            }
        },

        vulcanize: {
            default: {
                options: {
                    inline: true,
                    strip: true
                },
                files: {
                    'fin-hypergrid.min.html': 'fin-hypergrid.html'
                },
            },
        },

        jshint: {
            files: files.jshint,
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            }
        },

        concat: {
            'polymer-element': {
                src: [elementName + '.pre.html', elementName + '.js', elementName + '.post.html'],
                dest: elementName + '.html',
            },
            'basic-test': {
                src: ['test/basic-test.pre.html', 'test/basic-test.js', 'test/basic-test.post.html'],
                dest: 'test/basic-test.html',
            }
        },

        'wct-test': {
            default: {
                options: {
                    testTimeout: 3 * 1000,
                    browsers: ['chrome'],
                    remote: false
                },
            }
        },

        jsbeautifier: {
            files: files.js,
            options: {
                js: {
                    braceStyle: 'collapse',
                    breakChainedMethods: false,
                    e4x: false,
                    evalCode: false,
                    indentChar: ' ',
                    indentLevel: 0,
                    indentSize: 4,
                    indentWithTabs: false,
                    jslintHappy: false,
                    keepArrayIndentation: false,
                    keepFunctionIndentation: false,
                    maxPreserveNewlines: 10,
                    preserveNewlines: true,
                    spaceBeforeConditional: true,
                    spaceInParen: false,
                    unescapeStrings: false,
                    wrapLineLength: 0
                }
            }
        },
        'polymer-html-concat': {
            default: {
                js: 'poly-js',
                pre: 'poly-pre-html',
                post: 'poly-post-html',
                css: 'poly-css'
            }
        },
        connect: {
            server: {
                options: {
                    port: 9000,
                    // Change this to '0.0.0.0' to access the server from outside.
                    hostname: '0.0.0.0',
                    livereload: true,
                    open: true,
                    base: [{
                            path: './',
                            options: {
                                index: 'demo.html',
                                maxAge: 0
                            }
                        }, {
                            path: '../',
                            options: {
                                maxAge: 0
                            }
                        }

                    ]
                }
            },
            serverDocs: {
                options: {
                    port: 9090,
                    // Change this to '0.0.0.0' to access the server from outside.
                    hostname: '0.0.0.0',
                    livereload: true,
                    open: {
                        target: 'http://localhost:9090/' + elementName + '/' + 'index.html'
                    },
                    base: [{
                            path: parentDir
                        }

                    ]
                }
            }
        },

        //----------------------------------
    });

    grunt.loadNpmTasks('web-component-tester');
    grunt.registerTask('test', ['jshint', 'wct-test']);
    grunt.registerTask('default', [
        'jsbeautifier',
        'jshint',
        'wct-test',
    ]);

    grunt.registerTask('serve', function() {
        return grunt.task.run([
            'concat',
            'wct-test',
            'connect',
            'watch'
        ]);
    });

// /poly-css
// /poly-pre-html
// /poly-post-html
// /poly-js
    function createHtmlPre(elName){
        var strVar = '<link rel=\"import\" href=\"..\/polymer\/polymer.html\">\n';
        strVar += '<polymer-element name=\"' + elName + '\" attributes=\"\">\n';
        strVar += '  <template>\n';
        strVar += '    <link rel=\"stylesheet\" type=\"text\/css\" href=\"' + elName + '.css\">\n';
        strVar += '  <\/template>\n';
        strVar += '  <script>\n';
        return strVar;
    }
    function createHtmlPost() {
        var strVar= '  <\/script>\n';
        strVar += '<\/polymer-element>\n';
        return strVar;
    }
    function createCss() {
        var strVar= ':host {\n';
        strVar += '  display: block;\n';
        strVar += '  position: relative;\n';
        strVar += '}\n';
        return strVar;
    }
    function createJS(elName) {
        var strVar = '\'use strict\';\n';
        strVar += '\n';
        strVar += '(function() {\n';
        strVar += '\n';
        strVar += '    Polymer(\'' + elName + '\', { \/* jshint ignore:line  *\/\n';
        strVar += '    });\n';
        strVar += '\n';
        strVar += '})();\n';
        return strVar;
    }
    grunt.registerMultiTask('polymer-html-concat','this file handles construction of pre and post files for auto concatination of a polymer component',function() {

        var data = this.data;

        //lets create the dirs if they aren't there
        grunt.file.mkdir(data.js);
        grunt.file.mkdir(data.pre);
        grunt.file.mkdir(data.post);
        grunt.file.mkdir(data.css);

        var jsFiles = grunt.file.expand([data.js + '/**/*.js']).map(function(e) { return e.slice(0,-3).replace(data.js,''); });
        var preFiles = grunt.file.expand([data.pre + '/**/*.html']).map(function(e) { return e.slice(0,-5).replace(data.pre,''); });
        var postFiles = grunt.file.expand([data.post + '/**/*.html']).map(function(e) { return e.slice(0,-5).replace(data.post,''); });
        var cssFiles = grunt.file.expand([data.css + '/**/*.css']).map(function(e) { return e.slice(0,-4).replace(data.css,''); });

        //now we try and keep pre/post/css files in sync with the js files

        //if pre files do exist and there are no js files, delete them
        var preToDelete = preFiles.filter(function(e) { return jsFiles.indexOf(e) === -1});
        var postToDelete = postFiles.filter(function(e) { return jsFiles.indexOf(e) === -1});
        var cssToDelete = cssFiles.filter(function(e) { return jsFiles.indexOf(e) === -1});

        //if pre files do exist and there are no js files, delete them
        var preToAdd = jsFiles.filter(function(e) { return preFiles.indexOf(e) === -1});
        var postToAdd = jsFiles.filter(function(e) { return postFiles.indexOf(e) === -1});
        var cssToAdd = jsFiles.filter(function(e) { return cssFiles.indexOf(e) === -1});

        //adjust the pre html files
        preToDelete.forEach(function(e) {
            console.log('deleting ' + data.pre + e + '.html');
            grunt.file.delete(data.pre + e + '.html');
        });
        preToAdd.forEach(function(e) {
            console.log('adding ' + data.pre + e + '.html');
            grunt.file.write(data.pre + e + '.html', createHtmlPre(e.substr(1)));
        });

        //adjust the post html files
        postToDelete.forEach(function(e) {
            console.log('deleting ' + data.post + e + '.html');
            grunt.file.delete(data.post + e + '.html');
        });
        postToAdd.forEach(function(e) {
            console.log('adding ' + data.post + e + '.html');
            grunt.file.write(data.post + e + '.html', createHtmlPost(e.substr(1)));
        });

        //adjust the css files
        cssToDelete.forEach(function(e) {
            console.log('deleting ' + data.css + e + '.css');
            grunt.file.delete(data.css + e + '.css');
        });
        cssToAdd.forEach(function(e) {
            console.log('adding ' + data.css + e + '.css');
            grunt.file.write(data.css + e + '.css', createCss(e.substr(1)));
        });

    });

    grunt.registerTask('polymer','create a new polymer component', function() {
        var elName = this.args[0];
        var newEL = createJS(elName);
        var jsDir = grunt.config.data['polymer-html-concat'].default.js;
        grunt.file.write(jsDir + delimeter + elName + '.js', newEL);
        grunt.task.run('polymer-html-concat');
        console.log('created boilerplate ' + jsDir + delimeter + elName + '.js file and accompanying pre/post/css files');
    });

};
