'use strict';

var gulp        = require('gulp'),
    $$          = require('gulp-load-plugins')(),
    runSequence = require('run-sequence'),
    exec        = require('child_process').exec,
    path        = require('path'),
    pkg         = require('./package.json');

var srcDir      = './src/',
    testDir     = './test/',
    jsFiles     = '**/*.js';

//  //  //  //  //  //  //  //  //  //  //  //

gulp.task('lint', lint);
gulp.task('test', test);
gulp.task('doc', doc);
gulp.task('images', swallowImages);

gulp.task('css-templates', function() {
    return templates('./css/*.css', 'css');
});

gulp.task('build', function(callback) {
    clearBashScreen();
    runSequence(
        'lint',
        'images',
        'css-templates',
        'test',
        //'doc',
        callback
    );
});

gulp.task('default', ['build']);

//  //  //  //  //  //  //  //  //  //  //  //

function lint() {
    return gulp.src([
        'index.js',
        srcDir + jsFiles,
        testDir + jsFiles
    ])
        .pipe($$.eslint())
        .pipe($$.eslint.format())
        .pipe($$.eslint.failAfterError());
}

function test(cb) {
    return gulp.src(testDir + jsFiles)
        .pipe($$.mocha({reporter: 'spec'}));
}

function doc(cb) {
    exec(path.resolve('jsdoc.sh; sed -E "s/Hypergrid API Documentation/Hypergrid ' + pkg.version + ' API Documentation/" <doc/index.html >tmp; mv tmp doc/index.html'), function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
}

function clearBashScreen() {
    var ESC = '\x1B';
    console.log(ESC + 'c'); // (VT-100 escape sequence)
}

function swallowImages() {
    var config = {
        src: {
            globs: [ 'images/*.png', 'images/*.gif','images/*.jpeg', 'images/*.jpg' ],
            options: {}
        },
        transform: {
            options: {},
            header: '',
            footer: ''
        },
        dest: {
            path: 'images',
            filename: 'images.js',
            header: 'module.exports = {\n',
            footer: '\n};\n',
            options: {}
        }
    };

    return gulp.src(config.src.globs, config.src.options)
        .pipe($$.imagine64(config.transform.options))
        .pipe($$.header(config.transform.header))
        .pipe($$.footer(config.transform.footer))
        .pipe($$.concat(config.dest.filename))
        .pipe($$.header(config.dest.header))
        .pipe($$.footer(config.dest.footer))
        .pipe(gulp.dest(config.dest.path, config.dest.options));
}

function templates(src, type) {
    return gulp.src(src)
        .pipe($$.each(function(content, file, callback) {
            var filename = path.basename(file.path, "." + type),
                member = /[^\w]/.test(filename) ? "['" + filename + "']" : "." + filename;

            // convert (groups of) 4 space chars at start of lines to tab(s)
            do {
                var len = content.length;
                content = content.replace(/\n((    )*)    (.*)/, "\n$1\t$3");
            } while (content.length < len);

            // quote each line and join them into a single string
            content = 'exports' + member + " = [\n'" + content
                    .replace(/\\/g, "\\\\") // escape all backslashes
                    .replace(/'/g, "\\'") // escape all single-quotes
                    .replace(/\n/g, "',\n'") + "'\n].join('\\n');\n";

            // remove possible blank line at end of each
            content = content.replace(/,\n''\n]/g, "\n]");

            callback(null, content); // the first argument is an error, if you encounter one
        }))
        .pipe($$.concat("index.js"))
        .pipe($$.header("'use strict';\n\n"))
        .pipe(gulp.dest(function(file) { return file.base; }));
}
