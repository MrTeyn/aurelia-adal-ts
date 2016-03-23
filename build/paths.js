var path = require('path');
var fs = require('fs');

var appRoot = 'src/';
var pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

module.exports = {
  root: appRoot,
  source: appRoot + '**/*.ts',
  html: appRoot + '**/*.html',
  style: 'styles/**/*.css',
  output: 'dist/',
  doc:'./doc',
  e2eSpecsSrc: 'test/e2e/src/*.js',
  e2eSpecsDist: 'test/e2e/dist/',
  dtsSrc: [
    'typings/**/*.ts', 
    './jspm_packages/**/*.d.ts'
  ],
  es6DtsSrc: [
      'es6-typings/**/*.ts'
  ],
  packageName: pkg.name
};
