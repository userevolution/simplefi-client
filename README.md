# SimpleFi
<p align="center">
  <br/>
  <img src="./images/logo/simplefi-logo-transp.png" width=250/>
</p>
<br/>
SimpleFi makes it easy to manage your decentralised finance investment portfolio.


## Screenshots

<p align="center">
  <img src="./images/screenshots/simplefi-splash.png" width=400/>
  <img src="./images/screenshots/simplefi-dash.png" width=400/>
</p>


## Getting started

1. Clone the repo

```
git https://github.com/raphael-mazet/simplefi-client.git
```

2. start the simplefi server
Refer to the [SimpleFi server](https://github.com/raphael-mazet/simplefi-client.git) documentation.


3. start the app in development
```
npm install
npm start
```
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

Note that this app has been optimised for deployment with Heroku. Procfile.js will instruct the development server to serve the app via a static Express server in server.js. To simulate this in development:
```
npm run build
node server.js
```
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.
You can learn more in the documentation for [Create React App](https://facebook.github.io/create-react-app/docs/getting-started) and [React](https://facebook.github.io/create-react-app/docs).


## Built with

* [React](https://reactjs.org/) - javaScript library for building user interfaces
* [ethers.js](https://docs.ethers.io/v5/) - lightweight javaScript library to interact with the Ethereum blockchain
* [Express](https://expressjs.com/) - fast, unopinionated, minimalist web framework for Node.js
* [Chart.js](https://www.chartjs.org/) - simple yet flexible JavaScript charting for designers & developers
