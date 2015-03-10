'use strict';

var files = {

    polymerjs: [
        'polymer/js/**/*.js',
        'test/**/*.js'
    ],

    polymercss: [
        'polymer/css/**/*.css'
    ],

    polymerhtml: [
        'polymer/html/**/*.html'
    ],

};
var testingDurationTimeout = 3; //this may need to be larger if your tests take more time
var delimeter = (__dirname.indexOf('/') > -1) ? '/' : '\\';
var myDir = __dirname.split(delimeter);
var elementName = 'fin-hypergrid';
myDir.pop();
var parentDir = myDir.join(delimeter);
var lr = require('connect-livereload')({
    port: 35729
});

module.exports = function(grunt) {
    //load all npm tasks automagically
    console.log(__dirname);
    require('load-grunt-tasks')(grunt);

    var myConfig = {

        watch: {
            polymerjs: {
                files: files.polymerjs,
                tasks: ['jshint', 'polymer-component-sync', 'jsbeautifier', 'wct-test', 'vulcanize:default'],
            },
            polymercss: {
                files: files.polymercss,
                tasks: ['csslint:default', 'cssbeautifier', 'vulcanize:default'],
            },
            polymerhtml: {
                files: files.polymerhtml,
                tasks: ['htmllint', 'prettify', 'vulcanize:default'],
            },
            livereloadflag: {
                files: ['abc.html'],
                options: {
                    livereload: true
                },
            },
            livereload: {
                files: ['polymer/**/*.*', 'demo.html'],
                tasks: ['http:livereload'],
            },
        },
        vulcanize: {
            default: {
                options: {
                    inline: true,
                    strip: false,
                    abspath: '../../'
                },
                files: {
                    //see below as this key value pair is set programmatically
                },
            }
        },

        jshint: {
            files: files.polymerjs,
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

        'wct-test': {
            default: {
                options: {
                    testTimeout: testingDurationTimeout * 1000,
                    browsers: ['chrome'],
                    remote: false
                },
            }
        },

        jsbeautifier: {
            files:  files.polymerjs,
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

        http: {
            livereload: {
              options: {
                url: 'http://localhost:35729/changed',
                qs: {
                    files: 'foobarbaz'
                }
              }
            }
        },

        express: {
          all: {
            options: {
              port: 9000,
              hostname: "0.0.0.0",
              bases: [parentDir + '\/'],
              middleware: [lr]
            }
          }
        },
        open: {
            docs: {
                path: 'http://localhost:<%= express.all.options.port%>' + delimeter + elementName
            },
            demo: {
                path: 'http://localhost:<%= express.all.options.port%>' + delimeter + elementName + '/demo.html'
            }

        },

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
            'express',
            'build',
            'open',
            'watch'
        ]);
    });


    //these functions need to be moved into a yeoman subgenerator
    function createIndexHtml(files) {
        var strVar='<!doctype html>\n';
        strVar += '<!--\n';
        strVar += 'Copyright (c) 2014 The Polymer Project Authors. All rights reserved.\n';
        strVar += 'This code may only be used under the BSD style license found at http:\/\/polymer.github.io\/LICENSE\n';
        strVar += 'The complete set of authors may be found at http:\/\/polymer.github.io\/AUTHORS\n';
        strVar += 'The complete set of contributors may be found at http:\/\/polymer.github.io\/CONTRIBUTORS\n';
        strVar += 'Code distributed by Google as part of the polymer project is also\n';
        strVar += 'subject to an additional IP rights grant found at http:\/\/polymer.github.io\/PATENTS\n';
        strVar += '-->\n';
        strVar += '<html>\n';
        strVar += '<head>\n';
        strVar += '  <meta name=\"viewport\" content=\"width=device-width, minimum-scale=1.0, initial-scale=1.0, user-scalable=yes\">\n';
        strVar += '  <script src=\"..\/webcomponentsjs\/webcomponents.js\"><\/script>\n';
        strVar += '  <link rel=\"import\" href=\"..\/core-component-page\/core-component-page.html\">\n';
        strVar += '\n';
        strVar += '<\/head>\n';
        strVar += '<body unresolved>\n';
        strVar += '\n';
        strVar += '  <core-component-page\n';
        strVar += '    sources=\"[';
        //strVar += '      \'.\/polymer\/html\/' + elementName + '.html\'';
        var isFirst = true;
        for (var i = 0; i < files.length; i++) {
            if (isFirst) {
                isFirst = false;
            } else {
                strVar += ',';
            }
            if (files[i] !== elementName) {
                strVar += '\n      \'.\/polymer\/html' + files[i] + '.html\'';
            }
        }
        strVar += '\n      ]\"><\/core-component-page>\n';
        strVar += '<\/body>\n';
        strVar += '<\/html>\n';
        return strVar;
    }

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
            strVar +='        \'' + fileNames[i].slice(1) + '.js\',\n';
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
        var strVar = '<!--\n';
        strVar += 'The `' + shortName + '` element is a custom Polymer web component\n';
        strVar += '@element ' + shortName + '\n';
        strVar += '-->\n';
        if (elName === elementName) {
            '<link rel=\"import\" href=\"' + nestingPad + '..\/polymer\/polymer.html\">\n';
        } else
        {
            '<!-- only needed for root element <link rel=\"import\" href=\"' + nestingPad + '..\/polymer\/polymer.html\"> -->\n';
        }
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

        var jsFiles = grunt.file.expand([data.js + '/**/*.js']).map(function(e) { return e.slice(0,-3).replace(data.js,''); }).sort();
        var htmlFiles = grunt.file.expand([data.html + '/**/*.html']).map(function(e) { return e.slice(0,-5).replace(data.html,''); });
        var cssFiles = grunt.file.expand([data.css + '/**/*.css']).map(function(e) { return e.slice(0,-4).replace(data.css,''); });

        var jsTestFiles = grunt.file.expand(['test/**/*.js']).map(function(e) { return e.slice(0,-3).replace('test',''); });


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

        //if html files do exist and there are no js files, delete them
        var htmlToAdd = jsFiles.filter(function(e) { return htmlFiles.indexOf(e) === -1});
        var cssToAdd = jsFiles.filter(function(e) { return cssFiles.indexOf(e) === -1});
        var jsTestToAdd = jsFiles.filter(function(e) { return jsTestFiles.indexOf(e) === -1});

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

        //create core index.html file
        var indexhtml = createIndexHtml(jsFiles);
        console.log('creating index.html');
        grunt.file.write('index.html', indexhtml);

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
