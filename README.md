# Podcaster

## A simple SPA Podcast application

### Prerequisites
In order to be able to run this web application succesfully, you need **Node Package Manager** and **Grunt** previously installed in your computer.

For more information: 
* Install **Node Package Manager**: https://www.npmjs.com/get-npm
* Install **Grunt**: http://gruntjs.com/installing-grunt

### Instructions to run this application
#### Clone this repository
Run `git clone https://github.com/alvarovazquez/podcaster.git`

#### Go to repository folder
Run `cd podcaster`

#### Install dependencies
Run `npm install`

#### Preapre the application
There are two ways for preparing the application:
 * For **development** mode (non minified assets) run `grunt dev`
 * For **production** mode (minified assets) run `grunt dist`

#### Start the server
Run `grunt start-server` and open http://127.0.0.1:8081/ in your browser

#### Notes
For running the application in a different server than the one provided by Grunt for testing, take into account that this is a [Single Page Application](https://es.wikipedia.org/wiki/Single-page_application) with no HashBang navigation, so you need to redirect all non-asset requests to `/index.html`.

For more information on how to do this please check your server's documentation.

#### Credits
* **Page.js**, Micro client-side router: https://visionmedia.github.io/page.js/
* **Handlebars**, semantic HTML/JavaScript templates: http://handlebarsjs.com/
* **jQuery**, feature-rich JavaScript library: https://jquery.com/