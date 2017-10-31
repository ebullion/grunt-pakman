/*
 * grunt-pakman
 * https://github.com/ebullion/grunt-pakman
 *
 * Copyright (c) 2017 Eric Bullion
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks

    const _ = require('lodash');
    const htmlParser = require('htmlparser2');
    const decomment = require('decomment');
    const uglify = require('uglify-js');
    const cssmin = require('cssmin');
    const postcss = require("postcss");
    const url = require('postcss-url');
    const glob = require('glob');

    grunt.registerMultiTask('pakman', 'A dependency package manager for grunt', function () {
        // Merge task-specific and/or target-specific options with these defaults.
        var options = this.options({
            packDependencies: false,
            bundleConfig: undefined,
            src: undefined,
            dest: undefined,
            uglify: undefined,
            cssmin: true,
            targetDirectory: undefined
        });

        //execute task
        onLoad();

        function onLoad(){
            //reference bundle config
            var bundleConfig = options.bundleConfig;

            //validate config
            validateOptions();

            //pack bundle if applicable
            if(bundleConfig)
                packBundle(bundleConfig);

            //pack source if applicable
            if(options.packDependencies)
                packDependencies();
        }

        function validateOptions(){
            if(!options.bundleConfig)
                grunt.fail.fatal('Bundle config not specified in configuration');

            if(!options.src && options.packDependencies === true)
                grunt.fail.fatal('Source not specified in configuration');
        }

        function packBundle(config){

            function pack(bundle){
                var dest = bundle.dest;
                var src = bundle.src;
                var jsToPack = {};
                var cssToPack = '';

                grunt.log.ok('Packing '+ dest +'...');

                var chunks = dest.split('.');
                var extension = chunks[chunks.length - 1];

                switch(extension.toLowerCase()){
                    case 'js':
                        if(_.isArray(src)){
                            _.forEach(src, function(path){
                                grunt.log.ok('Pakman consuming ' + path + '...');
                                jsToPack[path] = decomment(grunt.file.read(path));
                            });

                            grunt.log.ok('Pakman crunching bundle...');
                            var minified = uglify.minify(jsToPack, options.uglify);

                            grunt.log.ok('Pakman spitting out ' + dest +'....');
                            grunt.file.write(dest, minified.code);
                        }else{
                            grunt.log.ok('Pakman crunching bundle...');
                            var minified = uglify.minify(src, options.uglify);

                            grunt.log.ok('Pakman spitting out ' + dest +'....');
                            grunt.file.write(dest, minified.code);
                        }
                        break;
                    case 'css':
                        if(_.isArray(src)){
                            _.forEach(src, function(path){
                                grunt.log.ok('Pakman consuming ' + path + '...');
                                cssToPack += postcss().use(url({
                                    url: 'rebase'
                                })).process(grunt.file.read(path), {
                                    from: path,
                                    to: dest
                                });
                            });

                            grunt.log.ok('Pakman crunching bundle...');
                            var minified = options.cssmin !== false ? cssmin(cssToPack) : cssToPack;

                            grunt.log.ok('Pakman spitting out ' + dest +'....');
                            grunt.file.write(dest, minified);
                        }else{
                            grunt.log.ok('Pakman crunching bundle...');
                            cssToPack += postcss().use(url({
                                url: 'rebase'
                            })).process(grunt.file.read(path), {
                                from: path,
                                to: dest
                            });
                            var minified = options.cssmin !== false ? cssmin(cssToPack) : decomment.text(grunt.file.read(src));

                            grunt.log.ok('Pakman spitting out ' + dest +'....');
                            grunt.file.write(dest, minified);
                        }
                        break;
                    default:
                        grunt.log.error('Pakman does not consume the following file type: .' + extension);
                        break;
                }
            }

            function copy(bundle){
                grunt.log.ok('Pakman getting ready to copy files...');
                if(_.isArray(bundle.src)){
                    _.forEach(bundle.src, function(path){
                        grunt.log.ok('Pakman copying files in ' + path);
                        var matches = glob.sync(path);
                        _.forEach(matches, function(filePath){
                            grunt.file.copy(filePath, bundle.dest + filePath);
                        })
                    })
                }else{
                    var matches = glob.sync(bundle.src);
                    grunt.log.ok('Pakman copying files in ' + bundle.src);
                    _.forEach(matches, function(filePath){
                        grunt.file.copy(filePath, bundle.dest + filePath)
                    })
                }
            }

            _.forEach(config, function(bundle){
                try{

                    if(!bundle.dest){
                        grunt.log.error('Destination path not provided in bundle.');
                        return;
                    }

                    if(!bundle.src){
                        grunt.log.error("Source not provided in bundle");
                        return;
                    }

                    //perform specific action on bundle if specified
                    if(bundle.action){
                        switch(bundle.action.toUpperCase()){
                            case 'COPY':
                                copy(bundle);
                                break;
                            case 'PACK':
                                pack(bundle);
                                break;
                            default:
                                pack(bundle);
                        }
                    }else{
                        //attempt to pack the bundle if no action is specified
                        pack(bundle);
                    }
                }catch(e){
                    grunt.fail.warn(e);
                }
            })
        }

        function packDependencies(){
            try{
                var index = grunt.file.read(options.src);
                var newIndex = "";
                var lines = index.split('\r\n');
                var config = undefined;
                var inEditMode = false;
                var newFile = '';
                var jsToPack = {};
                var cssToPack = '';
                var dPath = '';

                _.forEach(lines, function (line) {
                    if (inEditMode === false) {
                        if (line.toUpperCase().indexOf('PAKMAN:START') > -1) {
                            inEditMode = true;
                            parseOptions(line);
                        } else {
                            addLine(line);
                        }
                    } else {
                        if (line.toUpperCase().indexOf('PAKMAN:STOP') > -1) {
                            inEditMode = false;
                            completeAction();
                        } else {
                            performAction(line);
                            return;
                        }
                    }

                    //add line break
                    lineBreak();
                });


                if(options.targetDirectory && options.dest){
                    dPath = options.targetDirectory + options.dest;
                }else if(options.targetDirectory){
                    dPath = options.targetDirectory + options.src.replace('./', '');
                }else{
                    if(!options.dest)
                        grunt.fail.warn('Destination path not specified for output');
                    dPath = options.dest;
                }

                grunt.file.write(dPath, newIndex);
            }catch(e){
                grunt.fail.warn(e);
            }

            function lineBreak() {
                newIndex += "\r\n";
            }

            function addLine(line, includeBreak) {
                newIndex += line;
                if (includeBreak)
                    lineBreak();
            }

            function parseOptions(line) {
                var startIndex = line.indexOf('{');
                var stopIndex = line.indexOf('}');

                if (startIndex > -1 && stopIndex > -1) {
                    config = JSON.parse(line.replace(/'/g, "\"").substring(startIndex, stopIndex + 1));
                } else {
                    config = undefined;
                }

                if (options) {
                    config.action = config.action.toUpperCase();

                    if(options.dest){
                        options.dest = options.dest.replace('.js','').replace('.css', '');
                    }
                }
            }

            function performAction(line) {
                var action = config.action.toUpperCase();
                switch (action) {
                    case 'PACK':
                        concatFile(line);
                        break;
                    default:
                        grunt.fail.fatal('Pakman action not defined in source');
                }
            }

            function completeAction(line) {
                var action = config.action.toUpperCase();
                var chunks  = config.dest.split('.');
                var extension = undefined;
                if(chunks.length > 1)
                    extension = chunks[chunks.length - 1];

                switch (action) {
                    case 'PACK':
                        if(!isEmptyObject(jsToPack)){
                            grunt.log.ok('Pakman consuming javascript...');
                            addLine('     <script src="' + config.dest +'"></script>', true);
                            var minified = uglify.minify(jsToPack, options.uglify);
                            grunt.file.write(options.targetDirectory + config.dest, minified.code);
                        }

                        if(cssToPack.length > 0){
                            grunt.log.ok('Pakman consuming CSS...');
                            addLine('     <link href="'+ config.dest.replace('.' + extension, '')  +'.css" rel="stylesheet" />');
                            grunt.file.write(options.targetDirectory + config.dest.replace('.' + extension, '') + '.css', options.cssmin === true ? cssmin(cssToPack) : cssToPack);
                        }
                        break;
                    default:
                        grunt.fail.fatal('Pakman action not defined in source');
                }
                reset();
            }

            function isEmptyObject(obj) {
                for(var prop in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                        return false;
                    }
                }
                return true;
            }

            function concatFile(line) {
                var parser = new htmlParser.Parser({
                    onopentag: function (name, attribs) {

                    },
                    ontext: function (text) {

                    },
                    onclosetag: function (tagname) {

                    },
                    onattribute: function (name, value) {
                        if(name.toLowerCase() === 'src'){
                            jsToPack[value] = decomment(grunt.file.read(value));
                        }else if(name.toLowerCase() === 'href'){
                            var output = postcss().use(url({
                                url: 'rebase'
                            })).process(grunt.file.read(decomment.text(value)), {
                                from: value,
                                to: config.dest + '.css'
                            });
                            cssToPack += output;
                        }
                    }
                }, {decodeEntities: true});

                parser.write(line);
                parser.end();
            }

            function reset() {
                config = undefined;
                newFile = undefined;
                jsToPack = {};
                cssToPack = '';
            }
        }



        // Iterate over all specified file groups.
        // this.files.forEach(function (f) {
        //     // Concat specified files.
        //     var src = f.src.filter(function (filepath) {
        //         // Warn on and remove invalid source files (if nonull was set).
        //         if (!grunt.file.exists(filepath)) {
        //             grunt.log.warn('Source file "' + filepath + '" not found.');
        //             return false;
        //         } else {
        //             return true;
        //         }
        //     }).map(function (filepath) {
        //         // Read file source.
        //         return grunt.file.read(filepath);
        //     }).join(grunt.util.normalizelf(options.separator));
        //
        //     // Handle options.
        //     src += options.punctuation;
        //
        //     // Write the destination file.
        //     grunt.file.write(f.dest, src);
        //
        //     // Print a success message.
        //     grunt.log.writeln('File "' + f.dest + '" created.');
        // });
    });

};
