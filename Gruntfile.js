'use strict';

var files = {
    polymerjs: [
        'polymer/js/**/*.js'
    ],

    polymercss: [
        'polymer/css/**/*.css'
    ],

    polymerhtml: [
        'polymer/html/**/*.html'
    ],
    polymertestjs: [
        'polymer/js/**/*.js',
        'test/**/*.js'
    ],
};
var delimeter = (__dirname.indexOf('/') > -1) ? '/' : '\\';
var myDir = __dirname.split(delimeter);
var elementName = myDir[myDir.length - 1];
myDir.pop();
var parentDir = myDir.join(delimeter);

module.exports = function(grunt) {
    //load all npm tasks automagically
    require('load-grunt-tasks')(grunt);

    var myConfig = {

        watch: {
            polymerjs: {
                files: files.polymertestjs,
                tasks: ['jshint', 'polymer-component-sync', 'jsbeautifier', 'wct-test', 'vulcanize:default'],
                options: {
                    debounceDelay: 1000,
                },
            },
            polymercss: {
                files: files.polymercss,
                tasks: ['csslint:default', 'cssbeautifier', 'wct-test', 'vulcanize:default'],
                options: {
                    debounceDelay: 1000,
                },
            },
            polymerhtml: {
                files: files.polymerhtml,
                tasks: ['htmllint', 'prettify', 'wct-test', 'vulcanize:default'],
                options: {
                    debounceDelay: 1000,
                },
            },
            lr: {
                files: ['polymer/**/*.*'],
                options: {
                    livereload: true
                },
            }
        },
        vulcanize: {
            default: {
                options: {
                    inline: true,
                    strip: true,
                    abspath: '../../'
                },
                files: {
                    //see below as this key value pair is set programmatically
                },
            }
        },

        jshint: {
            files: files.polymertestjs,
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            }
        },
        csslint: {
            default: {
                options: {
                    'outline-none': false,
                },
                src: files.polymercss
            }
        },
        htmllint: {
            all: {
                options: {
                    ignore: ['Start tag seen without seeing a doctype first. Expected “<!DOCTYPE html>”.',
                    'Bad value “import” for attribute “rel” on element “link”: The string “import” is not a registered keyword.',
                    'Element “head” is missing a required instance of child element “title”.',
                    'Element “polymer-element” not allowed as child of element “body” in this context. (Suppressing further errors from this subtree.)',
                    'The “color” input type is not supported in all browsers. Please be sure to test, and consider using a polyfill.',
                    'The “date” input type is not supported in all browsers. Please be sure to test, and consider using a polyfill.']
                },
                src: files.polymerhtml,
            }
        },
        concat: {
            // 'polymer-element': {
            //     src: [elementName + '.pre.html', elementName + '.js', elementName + '.post.html'],
            //     dest: elementName + '.html',
            // },
            // 'basic-test': {
            //     src: ['test/basic-test.pre.html', 'test/basic-test.js', 'test/basic-test.post.html'],
            //     dest: 'test/basic-test.html',
            // }
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
            files:  files.polymertestjs,
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
        cssbeautifier : {
            files : files.polymercss
        },
        prettify: {
          all: {
            expand: true,
            cwd: './',
            src: files.polymerhtml[0]
          }
        },
        'polymer-component-sync': {
            default: {
                js: 'polymer/js',
                html: 'polymer/html',
                css: 'polymer/css'
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
    };

    //we need to dynamicaly set the name of this property
    myConfig.vulcanize.default.files[elementName + '.min.html'] = myConfig['polymer-component-sync'].default.html + delimeter + elementName + '.html';

    grunt.initConfig(myConfig);

    grunt.loadNpmTasks('web-component-tester');
    grunt.registerTask('test', ['build', 'wct-test']);
    grunt.registerTask('default', ['build']);

    grunt.registerTask('build', [
                'polymer-component-sync',
                'jshint',
                'jsbeautifier',
                'csslint:default',
                'cssbeautifier',
                'htmllint',
                'prettify',
                'wct-test',
                'vulcanize:default'
    ]);

    grunt.registerTask('serve', function() {
        return grunt.task.run([
            'build',
            // 'wct-test',
            'connect',
            'watch'
        ]);
    });
    function createTestJS(elementName) {
        var shortName = elementName.split(delimeter).reverse()[0];
        var strVar = '\/* globals describe, it, assert *\/\n';
        strVar += '\n';
        strVar += '\'use strict\';\n';
        strVar += '\n';
        strVar += 'var customElement = document.querySelector(\'' + shortName + '\');\n';
        strVar += '\n';
        strVar += 'describe(\'<' + shortName + '>\', function() {\n';
        strVar += '\n';
        strVar += '    describe(\'' + elementName + '.js\', function() {\n';
        strVar += '        it(\'should have real tests filled out\', function() {\n';
        strVar += '            assert.equal(customElement, customElement);\n';
        strVar += '        });\n';
        strVar += '\n';
        strVar += '    });\n';
        strVar += '\n';
        strVar += '});\n';
        return strVar;
    }

    function createTestHtml(elementName) {
        var shortName = elementName.split(delimeter).reverse()[0];
        var nestingLevel = Math.max(0,(elementName.split('/').length - 1)) * 3;
        var nestingProto = '..\/..\/..\/..\/..\/..\/..\/..\/..\/..\/..\/..\/..\/..\/..\/..\/';
        var nestingPad = nestingProto.substr(0, nestingLevel);
        var strVar = '<!doctype html>\n';
        strVar += '<html>\n';
        strVar += '<head>\n';
        strVar += '    <meta charset=\"UTF-8\">\n';
        strVar += '    <meta name=\"viewport\" content=\"width=device-width, minimum-scale=1.0, initial-scale=1.0, user-scalable=yes\">\n';
        strVar += '    <title>' + shortName + '<\/title>\n';
        strVar += '    <script src=\"' + nestingPad + '..\/..\/webcomponentsjs\/webcomponents.js\"><\/script>\n';
        strVar += '    <script src=\"' + nestingPad + '..\/..\/web-component-tester\/browser.js\"><\/script>\n';
        strVar += '    <link rel=\"import\" href=\"' + nestingPad + '..\/..\/polymer/js/' + elementName + '.html\">\n';
        strVar += '<\/head>\n';
        strVar += '<body>\n';
        strVar += '    <' + shortName + '><\/' + shortName + '>\n';
        strVar += '    <script src=\"' + shortName + '.js\"><\/script>\n';
        strVar += '<\/body>\n';
        strVar += '<\/html>\n';
        return strVar;
    }
    function createTestIndexHtml(fileNames) {
        var strVar ='<!doctype html>\n';
        strVar +='<html>\n';
        strVar +='  <head>\n';
        strVar +='    <meta charset=\"UTF-8\">\n';
        strVar +='    <meta name=\"viewport\" content=\"width=device-width, minimum-scale=1.0, initial-scale=1.0, user-scalable=yes\">\n';
        strVar +='    <title>Tests<\/title>\n';
        strVar +='\n';
        strVar +='  <script src=\"..\/..\/webcomponentsjs\/webcomponents.js\"><\/script>\n';
        strVar +='    <script src=\"..\/..\/web-component-tester\/browser.js\"><\/script>\n';
        strVar +='  <\/head>\n';
        strVar +='\n';
        strVar +='  <body>\n';
        strVar +='    <script>\n';
        strVar +='      WCT.loadSuites([\n';
        for (var i = 0; i < fileNames.length; i++) {
            strVar +='        \'' + fileNames[i].slice(1) + '.html\',\n';
        }
        strVar +='      ]);\n';
        strVar +='    <\/script>\n';
        strVar +='  <\/body>\n';
        strVar +='<\/html>\n';
        return strVar
    }

    function createHtml(elName){

        var shortName = elName.split(delimeter).reverse()[0];
        var nestingLevel = Math.max(0,(elName.split('/').length + 1)) * 3;
        var nestingProto = '..\/..\/..\/..\/..\/..\/..\/..\/..\/..\/..\/..\/..\/..\/..\/..\/';
        var nestingPad = nestingProto.substr(0, nestingLevel);

        var strVar = '<link rel=\"import\" href=\"' + nestingPad + '..\/polymer\/polymer.html\">\n';
        strVar += '<polymer-element name=\"' + shortName + '\" attributes=\"\">\n';
        strVar += '  <template>\n';
        strVar += '    <link rel=\"stylesheet\" type=\"text\/css\" href=\"' + nestingPad + 'polymer/css/' + elName + '.css\">\n';
        strVar += '  <\/template>\n';
        strVar += '  <script src=\"' + nestingPad + 'polymer/js/' + elName + '.js\"></script>\n';
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
    grunt.registerMultiTask('polymer-component-sync','this file handles construction of pre and post files for auto concatination of a polymer component',function() {

        var data = this.data;

        //lets create the dirs if they aren't there
        grunt.file.mkdir(data.js);
        grunt.file.mkdir(data.html);
        grunt.file.mkdir(data.css);

        var jsFiles = grunt.file.expand([data.js + '/**/*.js']).map(function(e) { return e.slice(0,-3).replace(data.js,''); });
        var htmlFiles = grunt.file.expand([data.html + '/**/*.html']).map(function(e) { return e.slice(0,-5).replace(data.html,''); });
        var cssFiles = grunt.file.expand([data.css + '/**/*.css']).map(function(e) { return e.slice(0,-4).replace(data.css,''); });

        var jsTestFiles = grunt.file.expand(['test/**/*.js']).map(function(e) { return e.slice(0,-3).replace('test',''); });
        var htmlTestFiles = grunt.file.expand(['test/**/*.html']).map(function(e) { return e.slice(0,-5).replace('test',''); });


        //now we try and keep pre/post/css files in sync with the js files

        //does the main js file exist? if not create it
        if (jsFiles.indexOf(delimeter + elementName) === -1) {
            jsFiles.unshift(delimeter + elementName);
            var newEL = createJS(elementName);
            var jsDir = grunt.config.data['polymer-component-sync'].default.js;
            console.log('creating main file ' + elementName + '.js');
            grunt.file.write(jsDir + delimeter + elementName + '.js', newEL);
        }


        //if pre files do exist and there are no js files, delete them
        var htmlToDelete = htmlFiles.filter(function(e) { return jsFiles.indexOf(e) === -1});
        var cssToDelete = cssFiles.filter(function(e) { return jsFiles.indexOf(e) === -1});
        var jsTestToDelete = jsTestFiles.filter(function(e) { return jsFiles.indexOf(e) === -1});
        var htmlTestToDelete = htmlTestFiles.filter(function(e) { return htmlFiles.indexOf(e) === -1});

        //if html files do exist and there are no js files, delete them
        var htmlToAdd = jsFiles.filter(function(e) { return htmlFiles.indexOf(e) === -1});
        var cssToAdd = jsFiles.filter(function(e) { return cssFiles.indexOf(e) === -1});
        var jsTestToAdd = jsFiles.filter(function(e) { return jsTestFiles.indexOf(e) === -1});
        var htmlTestToAdd = jsFiles.filter(function(e) { return htmlTestFiles.indexOf(e) === -1});

        //adjust the html files
        htmlToDelete.forEach(function(e) {
            console.log('deleting ' + data.html + e + '.html');
            grunt.file.delete(data.html + e + '.html');
        });
        htmlToAdd.forEach(function(e) {
            console.log('adding ' + data.html + e + '.html');
            grunt.file.write(data.html + e + '.html', createHtml(e.substr(1)));
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

        //addjust the js test files
        jsTestToDelete.forEach(function(e) {
            console.log('deleting test' + e + '.js');
            grunt.file.delete('test' + e + '.js');
        });
        jsTestToAdd.forEach(function(e) {
            console.log('adding test' + e + '.js');
            grunt.file.write('test' + e + '.js', createTestJS(e.substr(1)));
        });

        //addjust the html test files
        htmlTestToDelete.forEach(function(e) {
            console.log('deleting test' + e + '.html');
            grunt.file.delete('test' + e + '.html');
        });
        htmlTestToAdd.forEach(function(e) {
            console.log('adding test' + e + '.html');
            grunt.file.write('test' + e + '.html', createTestHtml(e.substr(1)));
        });

        //create main testing file
        var testhtml = createTestIndexHtml(jsFiles);
        console.log('creating test/index.html');
        grunt.file.write('test/index.html', testhtml);
    });

    grunt.registerTask('polymer','create a new polymer component', function() {
        var elName = this.args[0];
        var shortName = elName.split(delimeter).reverse()[0];
        var newEL = createJS(shortName);
        var jsDir = grunt.config.data['polymer-component-sync'].default.js;
        grunt.file.write(jsDir + delimeter + elName + '.js', newEL);
        grunt.task.run('polymer-component-sync');
        console.log('created boilerplate ' + jsDir + delimeter + elName + '.js file and accompanying pre/post/css files');
    });

};
