// https://medium.com/@hey.aaron/getting-import-export-working-es6-style-using-browserify-babelify-gulp-5hrs-of-life-eca7786e44cc
import gulp from 'gulp';
import babelify from 'babelify';
import browserify from 'browserify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
var src = 'src/';
var build = 'build/';

gulp.task('scripts', (cb) => {
  browserify(['src/js/mines_canvas.js', 'src/js/mines_game.js'])
  .transform(babelify)
  .bundle()
  .pipe(source('bundle.js'))
  .pipe(gulp.dest(build + 'js'))
  .pipe(buffer()) // You need this if you want to continue using the stream with other plugins
  cb() // Signal completion. TODO: detect if the above fails?
});

gulp.task('default', gulp.series('scripts'));
