'use strict';

var gulp        = require('gulp'),
    manifest    = require('./package.json'),
    $$          = require('gulp-load-plugins')(),
    browserify  = require('browserify'),
    source      = require('vinyl-source-stream'),
    buffer      = require('vinyl-buffer'),
    runSequence = require('run-sequence'),
    browserSync = require('browser-sync').create(),
    exec        = require('child_process').exec,
    path        = require('path');

var srcDir      = './src/',
    builderDir  = srcDir + 'builder/',
    testDir     = './test/',
    jsFiles     = '**/*.js',
    demoDir     = './demo/',
    buildDir    = demoDir + 'build/';

//  //  //  //  //  //  //  //  //  //  //  //

gulp.task('lint', lint);
gulp.task('test', test);
gulp.task('doc', doc);
gulp.task('images', swallowImages);
gulp.task('browserify', bundleUp.bind(null,
    manifest.name,
    builderDir,
    [
        buildDir,
        buildDir.replace('demo', manifest.version)
    ]
));
gulp.task('browserify-demo', bundleUp.bind(null,
    'index',
    './demo/js/demo/',
    ['./demo/js/demo/build/']
));

gulp.task('reloadBrowsers', reloadBrowsers);
gulp.task('serve', browserSyncLaunchServer);

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
        'browserify',
        'browserify-demo',
        //'doc',
        callback
    );
});

gulp.task('watch', function () {
    gulp.watch([
        srcDir + '**', '!' + srcDir + 'jsdoc/**',
        './css/*.css',
        './html/*.html',
        demoDir + 'js/' + jsFiles,
        '!' + demoDir + 'js/demo/build/' + jsFiles,
        testDir + '**'
    ], [
        'build'
    ]);

    gulp.watch([
        demoDir + '*.html',
        demoDir + 'css/demo.css',
        buildDir + '*'
    ], [
        'reloadBrowsers'
    ]);
});

gulp.task('default', ['build', 'watch'], browserSyncLaunchServer);

//  //  //  //  //  //  //  //  //  //  //  //

function lint() {
    return gulp.src([
        'index.js',
        srcDir + jsFiles,
        demoDir + 'js/' + jsFiles,
        '!' + demoDir + 'js/demo/build/' + jsFiles,
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

function bundleUp(destName, srcDir, buildDirs) {
    var options = {
        entries: srcDir + 'index.js',
        debug: true
    };

    function dest(dir) {
        stream = stream.pipe(gulp.dest(dir));
    }

    var stream = browserify(options)
        .bundle().on('error', $$.util.log)
        .pipe(source(options.entries))
        .pipe(buffer())
        .pipe($$.rename(destName + '.js'));

    buildDirs.forEach(dest);

    stream
        .pipe($$.rename(destName + '.min.js'))
        .pipe($$.uglify().on('error', $$.util.log));

    buildDirs.forEach(dest);

    return stream;
}

function doc(cb) {
    exec(path.resolve('jsdoc.sh'), function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
}

function browserSyncLaunchServer() {
    browserSync.init({
        server: {
            // Serve up our build folder
            baseDir: demoDir
        },
        port: 9000
    });
}

function reloadBrowsers() {
    browserSync.reload();
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
