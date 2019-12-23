'use strict';



/**
 * Paths to project folders
 */

var paths = {
	input: 'src/',
	output: 'dist/',
	scripts: {
		input: 'src/js/*',
		output: 'dist/js/'
	},
	styles:{
			input: 'src/scss/**/*.scss',
			output: 'dist/css/'
	},
	copy: {
		input: 'src/copy/**/*',
		output: 'dist/'
	},
	reload: './dist/',
	resources: './src/resources/**/*.*'
};

var settings = {
	clean: true,
	scripts: true,
	styles: true,
  pages: true,
	reload: true,
	minifyModules: false,
	browserSync: {
		server: {
			baseDir: paths.reload
		},
		https: {
			key: "./OpenSSL/localhost.key",
			cert: "./OpenSSL/localhost.crt"
		},
		port: 8000
	}
};

var del = require('del');
var {gulp, src, dest, watch, series, parallel} = require('gulp');
var htmlmin = require('gulp-htmlmin');
var uglify = require('gulp-uglify');
var browserSync = require('browser-sync');
var concat = require('gulp-concat');
var npmDist = require('gulp-npm-dist');
var bro = require('gulp-bro');
var sass = require('gulp-sass');
var esmify = require('esmify');
var cachebust = require('gulp-cache-bust');

var clean = function(done){
  del(['dist/**/*.*']);
  return done();
}

// Gulp task to minify JavaScript files
var scripts = function(done) {
	if(!settings.scripts){
		return done();
	}
	return src('./src/js/app.js')
	.pipe(bro({
		plugin: [
			[esmify, {}]
		],
		error: 'emit'
	}))
	.pipe(dest('./dist/js'))
	done();
}

var styles = function(done){
	if(!settings.styles){
		return done();
	}
	return src('./src/scss/**/*.scss')
		.pipe(sass().on('error', sass.logError))
		.pipe(dest('./dist/css/'))
		done();
}

// Gulp task to minify HTML files
var pages = function(done) {
  if(!settings.pages){
    return done();
  }
  return src(['./src/**/*.html'])
		.pipe(cachebust({
			type:'timestamp'}
		))
    .pipe(htmlmin({
      collapseWhitespace: true,
      removeComments: true
    }))
    .pipe(dest('./dist'));
    done();
}

// Watch for changes to the src directory
var startServer = function (done) {

	// Make sure this feature is activated before running
	if (!settings.reload) return done();

	// Initialize BrowserSync
	browserSync.init(settings.browserSync);

	// Signal completion
	done();

};

// Reload the browser when files change
var reloadBrowser = function (done) {
	if (!settings.reload) return done();
	browserSync.reload();
	done();
};

// Watch for changes
var watchSource = function (done) {
	watch(paths.input, series(parallel(scripts, styles, pages), reloadBrowser));
	done();
};

var moveResources = function(done){
	return src(paths.resources)
	.pipe(dest('./dist/resources'))
}


// Gulp task to minify all files and watch for changes
//var modules = series(moveModules, minModules);

exports.default = series(clean, parallel(scripts, styles, pages, moveResources), startServer, watchSource);
exports.clean = series(clean);
