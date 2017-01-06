'use strict';

var gulp        = require('gulp'),
    $$          = require('gulp-load-plugins')(),
    runSequence = require('run-sequence'),
    browserSync = require('browser-sync').create(),
    exec        = require('child_process').exec,
    path        = require('path'),
    pipe        = require('multipipe');

var name        = 'fin-hypergrid',
    srcDir      = './src/',
    testDir     = './test/',
    jsFiles     = '**/*.js',
    addOnsDir   = './add-ons/',
    demoDir     = './demo/',
    buildDir    = demoDir + 'build/';

//  //  //  //  //  //  //  //  //  //  //  //

gulp.task('lint', lint);
gulp.task('test', test);
gulp.task('doc', doc);
gulp.task('beautify', beautify);
gulp.task('images', swallowImages);
gulp.task('browserify', browserify.bind(null,
    name,
    srcDir,
    buildDir
));
gulp.task('browserify-hyperfilter', browserify.bind(null,
    'hyper-filter',
    addOnsDir + 'hyper-filter/',
    buildDir + addOnsDir,
    /\w+\.exports(\s*=)/,
    'window.fin.Hypergrid.Hyperfilter$1'
));
gulp.task('browserify-hypersorter', browserify.bind(null,
    'hyper-sorter',
    addOnsDir + 'hyper-sorter/',
    buildDir + addOnsDir,
    /\w+\.exports(\s*=)/,
    'window.fin.Hypergrid.Hypersorter$1'
));
gulp.task('browserify-totals-toolkit', browserify.bind(null,
    'totals-toolkit',
    addOnsDir + 'totals-toolkit/',
    buildDir + addOnsDir,
    /\w+\.exports(\s*=)/,
    'window.fin.Hypergrid.totalsToolkit$1'
));
gulp.task('browserify-dialog-ui', browserify.bind(null,
    'dialog-ui',
    addOnsDir + 'dialog-ui/',
    buildDir + addOnsDir,
    /\w+\.exports(\s*=\s*DialogUI)/,
    'window.fin.Hypergrid.DialogUI$1'
));
gulp.task('reloadBrowsers', reloadBrowsers);
gulp.task('serve', browserSyncLaunchServer);
gulp.task('add-ons', addOns);

gulp.task('html-templates', function() {
    return templates('./html/*.html', 'html');
});

gulp.task('css-templates', function() {
    return templates('./css/*.css', 'css');
});

gulp.task('dialogs-css-templates', function() {
    return templates(addOnsDir + 'dialog-ui/css/*.css', 'css');
});

gulp.task('build', function(callback) {
    clearBashScreen();
    runSequence(
        'lint',
        'images',
        'html-templates',
        'css-templates',
        'dialogs-css-templates',
        'test',
        'add-ons',
        'browserify-hyperfilter',
        'browserify-hypersorter',
        'browserify-totals-toolkit',
        'browserify-dialog-ui',
        //'beautify',
        'browserify',
        //'doc',
        callback
    );
});

gulp.task('watch', function () {
    gulp.watch([
        addOnsDir + jsFiles,
        srcDir + '**',
        '!' + srcDir + 'jsdoc/**',
        './css/*.css',
        './html/*.html',
        demoDir + 'js/*.js',
        testDir + '**',
        //'../../filter-tree/src/**' // comment off this line and the one below when filter tree on npm
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
        addOnsDir + jsFiles,
        srcDir + jsFiles,
        '!' + srcDir + '**/old/**/',
        demoDir + 'js/*.js',
        testDir + jsFiles,
        //'../../filter-tree/src/' + jsFiles // comment off this line and the one above when filter tree on npm
    ])
        .pipe($$.excludeGitignore())
        .pipe($$.eslint())
        .pipe($$.eslint.format())
        .pipe($$.eslint.failAfterError());
}

function test(cb) {
    return gulp.src(testDir + jsFiles)
        .pipe($$.mocha({reporter: 'spec'}));
}

function beautify() {
    return gulp.src([srcDir + jsFiles, testDir + jsFiles])
        .pipe($$.beautify()) //apparent bug: presence of a .jsbeautifyrc file seems to force all options to their defaults (except space_after_anon_function which is forced to true) so I deleted the file. Any needed options can be included here.
        .pipe(gulp.dest(srcDir));
}

function browserify(name, srcDir, buildDir, a, b) {
    return gulp.src(srcDir + 'index.js')
        .pipe(
            $$.mirror(
                pipe(
                    $$.rename(name + '.js'),
                    $$.browserify({ debug: true })
                        .on('error', $$.util.log),
                    $$.replace(a, b)
                ),
                pipe(
                    $$.rename(name + '.min.js'),
                    $$.browserify(),
                    $$.uglify()
                        .on('error', $$.util.log),
                    $$.replace(a, b)
                )
            )
        )
        .pipe(gulp.dest(buildDir));
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
            header: 'module.exports = { // This file generated by gulp-imagine-64 at '
            + (new Date).toLocaleTimeString() + ' on '
            + (new Date).toLocaleDateString() + '\n',
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

function addOns() {
    return gulp.src(addOnsDir + '*.js')
    // Insert an IIFE around the code...
        .pipe($$.replace( // ...starting immediately following 'use strict' and...
            "'use strict';\n",
            "'use strict';\n(function() {"
        ))
        .pipe($$.replace( // ...ending after modules.exports.
            /\w+\.exports(\s*=\s*)(\w+);/,
            'window.fin.Hypergrid.$2$1$2;\n})();'
        ))
        .pipe(
            $$.mirror(
                pipe(
                    $$.rename(function (path) {
                        path.basename = addOnsDir + path.basename;
                    })
                ),
                pipe(
                    $$.rename(function (path) {
                        path.basename = addOnsDir + path.basename + '.min';
                    }),
                    $$.uglify() // minimize
                        .on('error', $$.util.log)
                )
            )
        )
        .pipe(gulp.dest(buildDir));
}
