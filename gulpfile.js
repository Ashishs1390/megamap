var gulp = require('gulp'),
      sass = require('gulp-sass'),
      cleanCSS = require('gulp-clean-css'),
      strip = require('gulp-strip-comments'),
      ngAnnotate = require('gulp-ng-annotate'),
      sourcemaps = require('gulp-sourcemaps'),
      templates = require('gulp-angular-templatecache'),
      concat = require('gulp-concat'),
      nodemon = require('gulp-nodemon'),
      connect = require('gulp-connect'),
      proxy = require('http-proxy-middleware'),
      shell = require('gulp-shell'),
      run = require('run-sequence'),
      del = require('del'),
      autoprefixer = require('gulp-autoprefixer'),
      size = require('gulp-size'),
      notify = require("gulp-notify"),
      crypto = require('crypto'),
      hash = require('gulp-hash'),
      inject = require('gulp-inject'),
      terser = require('gulp-terser');

var public = './public/';
var src = public+'src/',
    build = public+'build/',
    vendor = require('./vendor.js');

vendor.styles.push(src+'css/vendor/*.css');

var paths = {
    cssVendor: vendor.styles,
    allCss:   [src+'**/*.css'],
    allScss:  [src+'**/*.scss'],
    mainScss: [src+'css/styles.scss'],
    scripts:  [src+'**/*.js'],
    markup:   [src+'**/*.html'],
    images:   [src+'images/**/*'],
    fonts:    [src+'fonts/*']
};

var autoprefixerOptions = {
    browsers: ['last 4 versions', '> 5%', 'Firefox ESR']
};

gulp.task('build:jsVendor', function() {
  return gulp.src(vendor.scripts)
    .pipe(sourcemaps.init({loadMaps:true}))
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest(build + 'vendor/'))
});

gulp.task('build:cssVendor', function() {
  return gulp.src(paths.cssVendor)
		.pipe(cleanCSS({debug: true}))
    .pipe(concat('vendor.css'))
    .pipe(gulp.dest(build + 'vendor/'))
		.pipe(connect.reload());
});

gulp.task('build:js', function() {
  gulp.src(paths.scripts)
    .pipe(concat('app.js'))
    .pipe(terser({
      mangle: false
    }))
    .pipe(hash())
    .pipe(gulp.dest(build))
    .pipe(hash.manifest(build+'assets.json', {
      deleteOld: true,
      sourceDir: build
    }))
    .pipe(gulp.dest('.'))
    .on('end', function() {
      return injectJs()
    })
});

gulp.task('build:html', function(){
  gulp.src(paths.markup)
    .pipe(templates({module:'workshop'}))
    .pipe(hash())
    .pipe(gulp.dest(build))
    .pipe(hash.manifest(build+'assets.json', {
      deleteOld: true,
      sourceDir: build
    }))
    .pipe(gulp.dest('.'))
    .on('end', function() {
      return injectJs()
    })
});

function injectJs() {
  return gulp.src('./public/index.html')
    .pipe(inject(gulp.src(build+'*.js'), {
      relative: true,
      addRootSlash: false
    }))
    .pipe(gulp.dest('./public'))
    .pipe(connect.reload())
}

gulp.task('build:fonts', function () {
  return gulp.src(paths.fonts)
    .pipe(gulp.dest(build + 'fonts'))
    .pipe(connect.reload());
});

gulp.task('build:images', function () {
  return gulp.src(paths.images)
    .pipe(gulp.dest(build + 'images'))
    .pipe(connect.reload());
});

gulp.task('clean', function() {
  del.sync(build+'*');
});

gulp.task('build:css', function() {
  return gulp.src(paths.allCss)
    .pipe(sass().on('error', sass.logError))
    .pipe(concat('app.css'))
    .pipe(cleanCSS())
    .pipe(autoprefixer(autoprefixerOptions) )
    .pipe(gulp.dest(build))
    .pipe(size())
    .pipe(connect.reload());
});

gulp.task('build:scss', function() {
  return gulp.src(paths.mainScss)
    .pipe(sass({ errLogToConsole: true }))
    .on('error', function(err) {
        notify().write(err);
        this.emit('end');
    })
    .pipe(cleanCSS())
    .pipe(autoprefixer(autoprefixerOptions) )
    .pipe(gulp.dest(build))
    .pipe(size())
    .pipe(connect.reload())
});

gulp.task('watch', function() {
  gulp.watch(paths.scripts,   ['build:js']);
  gulp.watch(paths.jsVendor,  ['build:jsVendor']);
  gulp.watch(paths.markup,    ['build:html']);
  gulp.watch(paths.cssVendor, ['build:cssVendor']);
  gulp.watch(paths.allCss,    ['build:css']);
  gulp.watch(paths.allScss,   ['build:scss']);
  gulp.watch(paths.images,    ['build:images']);
});
gulp.task("build",()=>{
  run('build:fonts', 'build:js', 'build:jsVendor','build:html', 'build:cssVendor','build:css','build:scss','build:images');
})

gulp.task('setEnvVariables', shell.task([
  'node .env.js'
]));
gulp.task('checkEnv', shell.task([
  'node deploy.js'
]));

gulp.task('serve', function () {
  nodemon({
    script: 'src/index.js',
    exec  : 'babel-node src --presets es2015,stage-0',
    ext   : 'js',
    watch : ['src', 'index.html'],
    // args  : ['--inspect'],
    env   : {'NODE_ENV': 'development'}
  }),
 connect.server({
    root: ['./public', './public/build'],
    port: '3000',
    livereload: true,
    fallback: public+'index.html',
    middleware: function (connect, opt) {
      return [
        proxy('/api', {
          target: 'http://localhost:8000',
          changeOrigin: true
        })
      ]
    }
  });
});

// Main tasks
gulp.task('start', function(cb) {
  run('watch', 'build', 'serve', cb);
});
// use remote api instead of local api in client files
gulp.task('start:remote', shell.task([
  'REMOTE_API=true gulp start'
]));

// lib tasks
gulp.task('lib:secret', function(){
  console.log(crypto.randomBytes(256).toString('hex'))
});
