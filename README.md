# grunt-pakman

> An MVC inspired dependency package manager for grunt.

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-pakman --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-pakman');
```

## The "pakman" task

### Overview
In your project's Gruntfile, add a section named `pakman` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  pakman: {
    options: {
        // bundle configuration
        bundleConfig: {
          //add css you want to bundle here
          css:{
              dest: 'output/dest/path.css',
              src: [
                  'source/css/to/include.css',
                  'another/source/to/include.css'
              ]
          },
          
          //add js you want to bundle here
          js:{
              dest: 'output/dest/path.js',
              src:[
                  'source/js/to/include/js',
                  'another/source/to/include.js'
              ]
          },
          
          //to copy files directly
          dependencies:{
              action: 'copy',
              dest: 'destination/directory/',
              src: [
                  './fonts/**/*',
                  './images/**/*',
                  './Web.config'
              ]
          }
      },
      //uglify options for bundled javascript
      uglify:{
        mangle: false,
        compress: true          
      },
              
      //postcss options for bundled css
      cssmin:{
        level: 0,
        rebaseTo: '' 
      },
    }
  }
});
```

In addition, you may also bundle directly from your source entry point:

##### gruntfile.js
```js
grunt.initConfig({
  pakman: {
    options: {
        packDependencies: true,
        src: './Index.html'
    }
  }
});
```

##### index.html
```html
<head>
    <!--pakMan:start {"action":'pack', "dest":'app.bundle.min.js'}-->
    <script src="app/app.module.js"></script>
    <script src="app/app.route.js"></script>
    <script src="app/app.config.js"></script>
    <!--pakMan:stop-->
</head>
```

##### output
```html
<head>
    <script src="app/app.bundle.min.js"></script>
</head>
```

### Options

#### options.bundleConfig
Type: `Object`
Default value: `undefined`

Defines the bundles that Pakman will create. Each property on the object
represents a bundle and there is no limit to how many bundles you can create.

```js
grunt.initConfig({
  pakman: {
    options: {
        bundleConfig: {
          vendor:{
              dest: 'release/vendor.bundle.js',
              src:[
                  'source/js/to/include/js',
                  'another/source/to/include.js'
              ]
          }
      }
    }
  }
});
```

Alternatively, you can abstract the bundleConfig from your grunt configuration.

##### bundle.config.js
```js
module.exports = {
    js:{
        dest: 'destination.min.js',
        src: [
            'source.one.js',
            'source.two.js'
        ]
    }
}
```

##### gruntfile.js
```js
const myBundleConfig = require('./bundle.config.js');

grunt.initConfig({
  pakman: {
    options: {
        bundleConfig: myBundleConfig
    }
  }
});
```


#### options.src
Type: `String`
Default value: `undefined`

Specifies the entry point of your web application
when options.packDependencies is set to true.

#### options.dest
Type: `String`
Default value: `undefined`

Specifies the path for the generated output
when options.packDependencies is set to true. 

#### options.targetDirectory
Type: `String`
Default value: `undefined`

Specifies the output directory for files generated
when options.dest is not supplied.


#### options.packDependencies
Type: `bool`
Default value: `false`

When set to true, pakman will package dependencies directly from your entry point specified by options.src.

Tell pakman where to start. List your dependencies. Then tell pakman to stop.
```html
    <!--pakMan:start {"action":'pack', "dest":'app.bundle.min.js'}-->
    <script src="app/app.module.js"></script>
    <script src="app/app.route.js"></script>
    <script src="app/app.config.js"></script>
    <!--pakMan:stop-->
```

The config object passed into the start comment tells pakman what to do:

##### object.action
Type: `String`
Default value: `pack`

`pack`: Will bundle the dependencies together.

(More actions coming soon)

##### object.dest
Type: `String` [required]
Default value: `undefined`

The result from the action will output to the path specified


##### Before:
```html
    <head>
        <!--pakMan:start {"action":'pack', "dest":'app.bundle.min.js'}-->
        <script src="app/app.module.js"></script>
        <script src="app/app.route.js"></script>
        <script src="app/app.config.js"></script>
        <!--pakMan:stop-->
    </head>
```

##### After:
Files have been bundled and written to the destination specified and the script reference has been replaced.
```html
    <head>
        <script src="app.bundle.min.js"></script>
    </head>
```



#### options.uglify
Type: `Object`
Default value: `undefined`

Specifies uglify options used when packaging javascript dependencies.
See [UglifyJs](https://www.npmjs.com/package/grunt-contrib-uglify) for options.

#### options.cssmin
Type: `Object`
Default value: `undefined`

Specifies postcss-url options used when packaging css dependencies.
See [postcss-url](https://github.com/postcss/postcss-url) for options.

### Usage Examples

```js
grunt.initConfig({
  pakman: {
    options: {
        //entry point
        src: './Index.html',
        
        //uglify options for bundled javascript
        uglify:{
            
        },
        
        //postcss options for bundled css
        cssmin:{
           level: 0,
           rebaseTo: '' 
        },
        // bundle configuration
        bundleConfig: {
          //add css you want to bundle here
          css:{
              dest: 'output/dest/path.css',
              src: [
                  'source/css/to/include.css',
                  'another/source/to/include.css'
              ]
          },
          
          //add js you want to bundle here
          js:{
              dest: 'output/dest/path.js',
              src:[
                  'source/js/to/include/js',
                  'another/source/to/include.js'
              ]
          },
          
          //to copy files directly
          dependencies:{
              action: 'copy',
              dest: 'destination/directory/',
              src: [
                  './fonts/**/*',
                  './images/**/*',
                  './Web.config'
              ]
          }
      }
    }
  }
});
```

## Release History
0.1.53 - Updated documentation

0.1.50 - Initial Release
