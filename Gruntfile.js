module.exports = function(grunt) {
	var rewrite = require('connect-modrewrite');

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		concat: {
			options: {
				separator: ';\n',
			},
			all: {
				src: ['src/js/**/*.js'],
				dest: 'src/js/<%= pkg.name %>.js',
			}
		},

		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			dist: {
				src: 'src/js/<%= pkg.name %>.js',
				dest: 'dist/js/<%= pkg.name %>.js'
			}
		},
		
		copy: {
			all: {
				files: [
					{expand: true, cwd:'src/js/', src: ['**/*.js'], dest: 'dist/js/'},
					{expand: true, cwd:'src/styles/', src: ['**/*.css'], dest: 'dist/styles/'},
					{expand: true, cwd:'src/fonts/', src: ['**/*.ttf'], dest: 'dist/fonts/'},
					{expand: true, cwd:'src/img/', src: ['**'], dest: 'dist/img/'},
					{expand: true, cwd:'src/templates/', src: ['**'], dest: 'dist/templates/'},
					{expand: true, cwd:'src/', src: ['index.html'], dest: 'dist/'}
				]
			},
			dev: {
				files: [
					{expand: true, cwd:'src/js/', src: ['**/*.map'], dest: 'dist/js/'},
					{expand: true, cwd:'src/styles/', src: ['**/*.map', '**/*.scss'], dest: 'dist/styles/'},
					{expand: true, cwd:'src/fonts/', src: ['**/*.ttf'], dest: 'dist/fonts/'},
				]
			}
		},
		
		clean: {
			all: ['dist/*'],
			allpost: ['src/styles/main.css', 'src/js/<%= pkg.name %>.js'],
			commitpre: ['src/js/<%= pkg.name %>.js', 'src/styles/main.css.map']
		},

		connect: {
			server: {
				options: {
					port: 8081,
					base: 'dist',
					keepalive: true,
					middleware: function(connect, options, middlewares) {
						// Redirect all 'non-asset' request to index.html
						var rules = [
							'!\\.html|\\.js|\\.css|\\.svg|\\.jp(e?)g|\\.png|\\.gif$ /index.html'
						];
						middlewares.unshift(rewrite(rules));

						return middlewares;
					}
				}
			}
		}
	});
	
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-connect');
	
	grunt.registerTask('dev', ['clean:all', 'concat', 'copy:all', 'copy:dev', 'clean:allpost']);
	grunt.registerTask('dist', ['clean:all', 'concat', 'uglify', 'copy:all', 'clean:allpost', 'clean:distpost']);

	grunt.registerTask('start-server', ['connect']);

	grunt.registerTask('prepare-commit', ['clean']);

	grunt.registerTask('default', ['dist']);
};
