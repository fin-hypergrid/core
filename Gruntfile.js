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
};
