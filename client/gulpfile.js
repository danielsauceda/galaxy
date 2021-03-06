var path = require('path');
var fs = require('fs');
var del = require('del');
var _ = require('underscore');

var gulp = require('gulp');
var babel = require('gulp-babel');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var beautify = require('gulp-beautify');
var gulpif = require('gulp-if');
var cached = require('gulp-cached');
var plumber = require('gulp-plumber');

var paths = {
    node_modules: './node_modules',
    scripts: [
        'galaxy/scripts/**/*.js',
        '!galaxy/scripts/qunit/**/*',
        '!galaxy/scripts/apps/**/*',
        '!galaxy/scripts/libs/**/*'
    ],
    lib_locs: {
        // This is a stepping stone towards having all this staged
        // automatically.  Eventually, this dictionary and staging step will
        // not be necessary.
        'backbone': [ 'backbone.js', 'backbone.js' ],
        'd3': [ 'd3.js', 'd3.js' ],
        'bibtex-parse-js': [ 'bibtexParse.js', 'bibtexParse.js' ],
        'jquery': ['dist/jquery.js', 'jquery/jquery.js'],
        'jquery.complexify':     [ 'jquery.complexify.js', 'jquery/jquery.complexify.js' ],
        'jquery.cookie': [ 'jquery.cookie.js', 'jquery/jquery.cookie.js' ],
        'jquery-migrate': [ 'dist/jquery-migrate.js', 'jquery/jquery.migrate.js' ],
        'jquery-mousewheel': [ 'jquery.mousewheel.js', 'jquery/jquery.mousewheel.js' ],
        'raven-js': ['dist/raven.js', 'raven.js'],
        'requirejs': [ 'require.js', 'require.js' ],
        'underscore': [ 'underscore.js', 'underscore.js' ]
    },
    libs: ['galaxy/scripts/libs/**/*.js']
};

var dev_mode = function(){
    return process.env.NODE_ENV != "production";
};

var source_maps = function(){
    return dev_mode() || process.env.GXY_BUILD_SOURCEMAPS !== undefined;
};

gulp.task('scripts', function() {
  return gulp.src(paths.scripts)
    .pipe(plumber())
    .pipe(cached('scripts'))
    .pipe(gulpif(source_maps, sourcemaps.init()))
    .pipe(babel({
        plugins: ['transform-es2015-modules-amd']
    }))
    .pipe(gulpif(dev_mode, beautify(), uglify()))
    .pipe(gulpif(source_maps, sourcemaps.write('../maps/')))
    .pipe(gulp.dest('../static/scripts/'));
});

gulp.task('stage-libs', function(callback){
    _.each(_.keys(paths.lib_locs), function(lib){
        var p1 = path.resolve(path.join(paths.node_modules, lib, paths.lib_locs[lib][0]));
        var p2 = path.resolve(path.join('galaxy', 'scripts', 'libs', paths.lib_locs[lib][1]));
        if (fs.existsSync(p1)) {
            del.sync(p2);
            fs.createReadStream(p1).pipe(fs.createWriteStream(p2));
        } else {
            callback(p1 + " does not exist, yet it is a required library.  This is an error.  Check that the package in question exists in node_modules.");
        }
    });
});

gulp.task('libs', function() {
  return gulp.src(paths.libs)
    .pipe(uglify())
    .pipe(gulp.dest('../static/scripts/libs/'));
});

gulp.task('clean', function(){
    //Wipe out all scripts that aren't handled by webpack
    return del(['../static/scripts/**/*.js',
                '!../static/scripts/bundled/**.*.js'],
               {force: true});
});

gulp.task('watch', function(){
    gulp.watch(paths.scripts, ['scripts']);
});

gulp.task('default', ['scripts', 'libs']);
