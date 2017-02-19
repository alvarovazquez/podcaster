/* globals $ */
/* globals page */
/* globals Handlebars */

/* Model classes */
class Episode {
	constructor(id, title, publishDate, description, duration, media) {
		this.id = id;
		this.title = title;
		this.publishDate = publishDate;
		this.description = description;
		this.duration = duration;
		this.media = media;
	}
}

class Podcast {
	constructor(id, title, author, description, image) {
		this.id = id;
		this.title = title;
		this.author = author;
		this.description = description;
		this.image = image;
		this.episodes = [];
	}

	addEpisode(episode) {
		if (this.episodes === undefined) {
			this.episodes = [];
		}

		this.episodes.push(episode);
	}

	getEpisode(episodeId) {
		if (this.episodes !== undefined && episodeId !== undefined) {
			for (let i = 0; i < this.episodes.length; i = i + 1) {
				if (this.episodes[i].id === episodeId) {
					return this.episodes[i];
				}
			}
		}
	}
}

/* Helper classes */
class PodcastService {
	constructor (podcastUrl, episodesUrl) {
		this.podcastUrl = podcastUrl;
		this.episodesUrl = episodesUrl;
		// this.corsProxyUrl = 'http://cors.io/?u=';
		this.corsProxyUrl = 'https://crossorigin.me/';
		this.podcasts = [];
	}

	addPodcast(podcast) {
		if (this.podcasts === undefined) {
			this.podcasts = [];
		}

		this.podcasts.push(podcast);
	}

	getPodcasts() {
		return this.podcasts;
	}

	getFilteredPodcasts(filter) {
		let filteredPodcastList = [];

		if (this.podcasts !== undefined && filter !== undefined) {
			if (filter !== "") {
				for (let i = 0; i < this.podcasts.length; i = i + 1) {
					if (this.podcasts[i].title.toLowerCase().indexOf(filter.toLowerCase()) > -1 ||
						this.podcasts[i].author.toLowerCase().indexOf(filter.toLowerCase()) > -1) {
						filteredPodcastList.push(this.podcasts[i]);
					}
				}
			} else {
				filteredPodcastList = this.podcasts;
			}
		}

		return filteredPodcastList;
	}

	getPodcast(podcastId) {
		if (this.podcasts !== undefined && podcastId !== undefined) {
			for (let i = 0; i < this.podcasts.length; i = i + 1) {
				if (this.podcasts[i].id === podcastId) {
					return this.podcasts[i];
				}
			}
		}
	}

	savePodcastToCache(podcast) {
		let currentPodcastCache = localStorage.getItem("podcasts");
		if (currentPodcastCache !== undefined && currentPodcastCache !== null) {
			currentPodcastCache = JSON.parse(currentPodcastCache);
		}

		if (currentPodcastCache !== undefined &&
			currentPodcastCache.data !== undefined &&
			currentPodcastCache.data.length > 0) {

			// There are podcasts in cache. Look for the desired podcast.
			for (let i = 0; i < currentPodcastCache.data.length; i = i + 1) {
				if (currentPodcastCache.data[i].id === podcast.id) {
					// Podcast found in cache
					// Check last update
					if (currentPodcastCache.data[i].lastUpdate === undefined ||
						currentPodcastCache.data[i].lastUpdate === null ||
						new Date() - currentPodcastCache.data[i].lastUpdate > (24 * 60 * 60 * 1000)) {
						// Te chache is more than 24 hours old. Force podcast detail update.
						
						currentPodcastCache.data[i] = podcast;
						currentPodcastCache.data[i].lastUpdate = new Date();

						localStorage.setItem("podcasts", JSON.stringify(currentPodcastCache));

						break;
					}
				}
			}
		}
	}

	updatePodcasts() {
		let currentPodcastCache = localStorage.getItem("podcasts");
		if (currentPodcastCache !== undefined && currentPodcastCache !== null) {
			currentPodcastCache = JSON.parse(currentPodcastCache);
		}

		var that = this;

		// We create a promise that we will resolve once we get the information of every single podcast
		return new Promise(function (resolve, reject) {
			let updateCache = false;

			if (currentPodcastCache === undefined ||
				currentPodcastCache === null ||
				currentPodcastCache === "" ||
				currentPodcastCache.lastUpdate === undefined ||
				new Date() - new Date(currentPodcastCache.lastUpdate) > (24 * 60 * 60 * 1000)) {

				// Te chache does not exist or is more than 24 hours old. Force podcast update
				updateCache = true
			}

			if (updateCache === true) {
				if (that.podcastUrl !== undefined && that.podcastUrl !== "") {
					$.ajax(that.podcastUrl, {
						success: function (data, textStatus) {
							let jsonData = JSON.parse(data);

							if (jsonData.feed !== undefined && jsonData.feed.entry !== undefined && jsonData.feed.entry.length !== undefined) {
								that.podcasts = [];
								for (let i = 0; i < jsonData.feed.entry.length; i = i + 1) {
									let entryTmp = jsonData.feed.entry[i];

									// Check information integrity
									let id;
									if (entryTmp.id !== undefined &&
										entryTmp.id.attributes !== undefined &&
										entryTmp.id.attributes['im:id'] !== undefined) {
										id = entryTmp.id.attributes['im:id'];
									} else {
										console.error("Couldn't get field 'id' for podcast %O", entryTmp);
									}

									let title;
									if (entryTmp.title !== undefined &&
										entryTmp.title.label !== undefined) {
										title = entryTmp.title.label;
									} else {
										console.warn("Couldn't get field 'title' for podcast %O", entryTmp);
									}

									let author;
									if (entryTmp['im:artist'] !== undefined &&
										entryTmp['im:artist'].label !== undefined) {
										author = entryTmp['im:artist'].label;
									} else {
										console.warn("Couldn't get field 'author' for podcast %O", entryTmp);
									}

									let description;
									if (entryTmp.summary !== undefined &&
										entryTmp.summary.label !== undefined) {
										description = entryTmp.summary.label;
										// Trick to decode HTML entities
										description = $('<textarea />').html(description).text();
									} else {
										console.warn("Couldn't get field 'description' for podcast %O", entryTmp);
									}

									// TODO Check image size
									let image;
									if (entryTmp['im:image'] !== undefined &&
										entryTmp['im:image'][2] !== undefined &&
										entryTmp['im:image'][2].label !== undefined) {
										image = entryTmp['im:image'][2].label
									} else {
										console.warn("Couldn't get field 'image' for podcast %O", entryTmp);
									}

									// TODO Load episodes
									let episodes;
									if (id !== undefined) {
										// Create podcast object
										let podcast = new Podcast(id, title, author, description, image, episodes);

										// Add podcast to the list
										that.addPodcast(podcast);
									}
								}

								// Save podcast list in cache
								let podcastCacheData = {
									lastUpdate: new Date(),
									data: that.getPodcasts()
								};
								localStorage.setItem("podcasts", JSON.stringify(podcastCacheData));

								resolve();
							}
						},
						error: function (jqXHR, textStatus, errorThrown) {
							console.error("An error ocurred getting podcasts information: %S", textStatus, errorThrown);

							reject();
						}
					});
				} else {
					reject();
				}
			} else {
				that.podcasts = [];

				// Get information from cache
				for (let i = 0; i < currentPodcastCache.data.length; i = i + 1) {
					let id = currentPodcastCache.data[i].id;
					let title = currentPodcastCache.data[i].title;
					let author = currentPodcastCache.data[i].author;
					let description = currentPodcastCache.data[i].description;
					let image = currentPodcastCache.data[i].image;
					let episodes = currentPodcastCache.data[i].episodes;

					let podcast = new Podcast(id, title, author, description, image, episodes);

					that.addPodcast(podcast);
				}
				
				resolve();
			}
		});
	}

	updatePodcastEpisodes(podcastId) {
		let currentPodcastCache = localStorage.getItem("podcasts");
		if (currentPodcastCache !== undefined && currentPodcastCache !== null) {
			currentPodcastCache = JSON.parse(currentPodcastCache);
		}

		let podcast = this.getPodcast(podcastId);
		let updateCache = false;
		let that = this;

		// We create a promise that we will resolve once we get the information for this particular podcast
		return new Promise(function (resolve, reject) {
			if (currentPodcastCache !== undefined &&
				currentPodcastCache.data !== undefined &&
				currentPodcastCache.data.length > 0) {

				// There are podcasts in cache. Look for the desired podcast.
				for (let i = 0; i < currentPodcastCache.data.length; i = i + 1) {
					if (currentPodcastCache.data[i].id === podcastId) {
						// Podcast found in cache
						// Check last update
						if (currentPodcastCache.data[i].lastUpdate === undefined ||
							currentPodcastCache.data[i].lastUpdate === null ||
							new Date() - currentPodcastCache.data[i].lastUpdate > (24 * 60 * 60 * 1000)) {
							// Te chache is more than 24 hours old. Force podcast detail update.
							updateCache = true;

							break;
						}
					}
				}
			}

			if (updateCache === true) {
				if (that.episodesUrl !== undefined && podcastId !== undefined) {
					let corsFeedUrl = that.corsProxyUrl;

					// We get the podcast episode feed URL from apple lookup service
					$.ajax(that.episodesUrl, {
						crossDomain: true,
						dataType: 'jsonp',
						data: {
							id: podcastId
						},
						success: function (data, textStatus) {
							if (data.results !== undefined && data.results[0].feedUrl !== undefined) {
								// We get the actual feed and parse it to get the episode list
								$.ajax(corsFeedUrl + data.results[0].feedUrl, {
									dataType: 'xml',
									success: function (data, textStatus) {
										podcast.episodes = [];
										let lastUpdate = new Date();

										let id = $(data).find('item').length;

										$(data).find('item').each(function () {
											let title;
											if ($(this).find('title').length > 0) {
												title = $(this).find('title').get(0).innerHTML;
												title = title.replace('<![CDATA[', '').replace(']]>', '');
											}

											let publishDate;
											if ($(this).find('pubDate').length > 0) {
												let publishDateTmp = $(this).find('pubDate').get(0).innerHTML;
												publishDateTmp = publishDateTmp.replace('<![CDATA[', '').replace(']]>', '');

												publishDate = new Date(publishDateTmp);
											}

											let description;
											if ($(this).find('description').length > 0) {
												description = $(this).find('description').get(0).innerHTML;
												description = description.replace('<![CDATA[', '').replace(']]>', '');
												// Trick to decode HTML entities
												description = $('<textarea />').html(description).text();
											}

											let duration;
											if ($(this).find('duration').length > 0) {
												duration = $(this).find('duration').get(0).innerHTML;
												duration = duration.replace('<![CDATA[', '').replace(']]>', '');
											}

											let media;
											if ($(this).find('enclosure').length > 0) {
												media = {
													url: $(this).find('enclosure').attr('url'),
													type: $(this).find('enclosure').attr('type')
												};
											}

											let episode = new Episode(id.toString(), title, publishDate, description, duration, media);

											podcast.addEpisode(episode);

											id = id - 1;
										});

										that.savePodcastToCache(podcast);

										resolve();
									},
									error: function (jqXHR, textStatus, errorThrown) {
										console.error("An error ocurred getting podcast episodes information: %s", textStatus, errorThrown);

										reject();
									}
								});
							} else {
								console.error("Unknown data format for podcast id = %s, Data: %O", podcastId, data);

								reject();
							}
						},
						error: function (jqXHR, textStatus, errorThrown) {
							console.error("An error ocurred getting podcast information: %s, Error: %O", textStatus, errorThrown);

							reject();
						}
					});
				}
			} else {
				// Get information from cache
				for (let i = 0; i < currentPodcastCache.data.length; i = i + 1) {
					if (currentPodcastCache.data[i].id === podcastId) {
						let episodes = currentPodcastCache.data[i].episodes;

						//let podcast = new Podcast(id, title, author, description, image);
						for (let j = 0; j < episodes.length; j = j + 1) {
							let episodeId = episodes[j].id;
							let episodeTitle = episodes[j].title;
							let episodePublishDate = new Date(episodes[j].publishDate);
							let episodeDescription = episodes[j].description;
							let episodeDuration = episodes[j].duration;
							let episodeMedia = episodes[j].media;

							let episode = new Episode(episodeId, episodeTitle, episodePublishDate, episodeDescription, episodeDuration, episodeMedia);

							podcast.addEpisode(episode);
						}

						//that.addPodcast(podcast);
					}
				}
				
				resolve();
			}
		});
	}
}

/* Application setup */
// Create podcast service
var podcastService = new PodcastService(
	'https://itunes.apple.com/us/rss/toppodcasts/limit=100/genre=1310/json',
	'https://itunes.apple.com/lookup'
);

// Loading animation
$('#loading-indicator').on('start-loading', function() {
	$(this).addClass('loading');
});

$('#loading-indicator').on('stop-loading', function() {
	$(this).removeClass('loading');
});

// Handlebars helpers for formating data
Handlebars.registerHelper('formatDate', function(date) {
	return date.getDate() + "/" + (date.getUTCMonth() + 1) + "/" + date.getFullYear();
});

Handlebars.registerHelper('formatDuration', function(duration) {
	if (duration === undefined || duration === null) {
		return 'no duration';
	} else if (duration.length > 0 && isNaN(duration)) {
		return duration;
	} else {
		let hours = Math.floor(duration / 3600);
		let minutes = Math.floor(duration % 3600 / 60);
		let seconds = Math.floor(duration % 3600 % 60);

		return ((hours > 0 ? hours + ":" + (minutes < 10 ? "0" : "") : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds);
	}
});

Handlebars.registerHelper('lineSeparator', function(index) {
	if (index > 0 && index % 4 === 0) {
		return '<li class="separator"></li>'
	} else {
		return '';
	}
});

Handlebars.registerHelper('exists', function(variable, options) {
	if (typeof variable !== 'undefined') {
		return options.fn(this);
	} else {
		return options.inverse(this);
	}
});

let podcastFilterSetup = function () {
	// Podcast filter setup
	$('#podcast-filter-text').keyup(function () {
		let filteredPodcasts = podcastService.getFilteredPodcasts($(this).val());

		console.debug("List size: %i", filteredPodcasts.length);
	});
}

// Routing configuration
function loadRoute(route, callback) {
	$("main#container").load(route, callback);
}

// Controllers for each view
let podcastListController = function (data) {
	$('#loading-indicator').trigger('start-loading');

	// Update podcasts
	podcastService.updatePodcasts().then(
		function () {
			// Podcast list
			let podcasts = podcastService.getPodcasts();

			// Once we get the podcast list, we load the template
			loadRoute("/templates/main.html", function () {
				// Prepare Handlebars templates
				let source	= $("#podcasts").html();
				let sourceList	= $("#podcast-list-template").html();
				let sourceCount	= $("#podcast-count-template").html();

				let template = Handlebars.compile(source);
				let templateList = Handlebars.compile(sourceList);
				let templateCount = Handlebars.compile(sourceCount);

				let context = {
					podcasts: podcasts
				};

				// Compile Handlebars main template
				let templateHtml = template(context);
				let templateHtmlList = templateList(context);
				let templateHtmlCount = templateCount(context);

				$("main#container").html(templateHtml);
				$("main#container .podcast-list").html(templateHtmlList);
				$("main#container #podcast-filter-qty").html(templateHtmlCount);

				// Podcast filter setup
				$('#podcast-filter-text').keyup(function () {
					// Filter
					let filteredPodcasts = podcastService.getFilteredPodcasts($(this).val());
					// Update context
					let context = {
						podcasts: filteredPodcasts
					};

					// Recompile subtemplates
					let templateHtmlList = templateList(context);
					let templateHtmlCount = templateCount(context);

					$("main#container .podcast-list").html(templateHtmlList);
					$("main#container #podcast-filter-qty").html(templateHtmlCount);
				});

				$('#loading-indicator').trigger('stop-loading');
			});
		}
	).catch(function () {
		console.error('An error ocurred loading the podcast list');

		$('#loading-indicator').trigger('stop-loading');
	});
};

let podcastDetailController = function (context) {
	$('#loading-indicator').trigger('start-loading');

	// Update podcasts
	podcastService.updatePodcasts().then(
		function (value) {
			// Update podcast episodes
			podcastService.updatePodcastEpisodes(context.podcastId).then(
				function () {
					let podcast = podcastService.getPodcast(context.podcastId);

					if (podcast !== undefined) {
						// Once we get the podcast episode list, we load the template
						loadRoute("/templates/podcast-detail.html", function () {
							// Compile Handlebars template
							let source	= $("#podcast-detail-template").html();
							let template = Handlebars.compile(source);
							let context = {
								podcast: podcast
							};
							let templateHtml = template(context);

							$("main#container").html(templateHtml);
						});
					} else {
						console.error('Podcast with id = %s not found', context.podcastId);
					}

					$('#loading-indicator').trigger('stop-loading');
				}
			).catch(function () {
				console.error('An error ocurred loading the podcast detail');

				$('#loading-indicator').trigger('stop-loading');
			});
		}
	).catch(function () {
		console.error('An error ocurred loading the podcast list');

		$('#loading-indicator').trigger('stop-loading');
	});
};

let episodeDetailController = function (context) {
	$('#loading-indicator').trigger('start-loading');

	// Update podcasts
	podcastService.updatePodcasts().then(
		function () {
			// Update podcast episodes
			podcastService.updatePodcastEpisodes(context.podcastId).then(
				function (value) {
					let podcast = podcastService.getPodcast(context.podcastId);
					let episode = podcast.getEpisode(context.episodeId);

					if (podcast !== undefined) {
						if (episode !== undefined) {
							// Once we get the podcast episode list, we load the template
							loadRoute("/templates/podcast-episode-detail.html", function () {
								// Compile Handlebars template
								let source	= $("#episode-detail-template").html();
								let template = Handlebars.compile(source);
								let context = {
									podcast: podcast,
									episode: episode
								};
								let templateHtml = template(context);

								$("main#container").html(templateHtml);
							});
						} else {
							console.error('Episode with id = %s not found for podcast %s', context.podcastId, podcast.title);
						}
					} else {
						console.error('Podcast with id = %s not found', context.podcastId);
					}

					$('#loading-indicator').trigger('stop-loading');
				}
			).catch(function () {
				console.error('An error ocurred loading the episode detail');

				$('#loading-indicator').trigger('stop-loading');
			});
		}
	).catch(function () {
		console.error('An error ocurred loading the podcast list');

		$('#loading-indicator').trigger('stop-loading');
	});
};

// Page.js routing configuration
page('/', function () {
	podcastListController();
});

page('/podcast/:podcastId', function (context) {
	let controllerContext = {
		podcastId: context.params.podcastId
	};

	podcastDetailController(controllerContext);
});

page('/podcast/:podcastId/episode/:episodeId', function (context) {
	let controllerContext = {
		podcastId: context.params.podcastId,
		episodeId: context.params.episodeId
	};

	episodeDetailController(controllerContext);
});

page();
