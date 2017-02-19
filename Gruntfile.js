module.exports = function(grunt) {
	var rewrite = require('connect-modrewrite');

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		concat: {
			options: {
				separator: ';\n',
			},
			all: {
				src: ['src/js/*.js'],
				dest: 'src/js/<%= pkg.name %>.min.js',
			}
		},

		es6transpiler: {
			dist: {
				files: {
					'src/js/<%= pkg.name %>.min.js': 'src/js/<%= pkg.name %>.min.js'
				}
			}
		},

		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			dist: {
				files: {
					'dist/js/<%= pkg.name %>.min.js': ['src/js/<%= pkg.name %>.min.js']
				}
			}
		},
		
		copy: {
			all: {
				files: [
					{expand: true, cwd:'src/js/ext/', src: ['**/*.js'], dest: 'dist/js/ext/'},
					{expand: true, cwd:'src/js/', src: ['<%= pkg.name %>.min.js'], dest: 'dist/js/'},
					{expand: true, cwd:'src/styles/', src: ['**/*.css'], dest: 'dist/styles/'},
					{expand: true, cwd:'src/fonts/', src: ['**/*'], dest: 'dist/fonts/'},
					{expand: true, cwd:'src/templates/', src: ['**'], dest: 'dist/templates/'},
					{expand: true, cwd:'src/', src: ['index.html'], dest: 'dist/'}
				]
			}
		},
		
		clean: {
			all: ['dist/*'],
			allpost: ['src/js/<%= pkg.name %>.min.js'],
			commitpre: ['src/js/<%= pkg.name %>.min.js']
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
	
	grunt.loadNpmTasks('grunt-es6-transpiler');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-connect');
	
	grunt.registerTask('dev', ['clean:all', 'concat', 'copy:all', 'clean:allpost']);
	grunt.registerTask('dist', ['clean:all', 'concat', 'es6transpiler', 'uglify:dist', 'copy:all', 'clean:allpost']);

	grunt.registerTask('start-server', ['dev', 'connect']);

	grunt.registerTask('prepare-commit', ['clean']);

	grunt.registerTask('default', ['start-server']);
};
