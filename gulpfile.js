'use strict';

var gulp        = require('gulp'),
    $$          = require('gulp-load-plugins')(),
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

gulp.task('build', gulp.series(
        'lint',
        //'images',
        'css-templates',
        'test',
        //'doc',
    )
);

gulp.task('default',  gulp.series('build'));

//  //  //  //  //  //  //  //  //  //  //  //

function lint() {
    return gulp.src([
        // 'index.js',
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

function swallowImages() {
    var config = {
        src: {
            globs: 'images/*.{gif,png,jpg,jpeg,svg,ico}',
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
            let filename = path.basename(file.path, "." + type);
            callback(null, `exports.${filename} = \`\n${content}\`;\n`); // the first argument is an error, if you encounter one
        }))
        .pipe($$.concat("index.js"))
        .pipe($$.header("'use strict';\n\n"))
        .pipe(gulp.dest(function(file) { return file.base; }));
}
