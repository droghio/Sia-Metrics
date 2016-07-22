# Sia-Metrics
Metric collection and display dashboard

## Overview

This is a simple data collection and display toolset. It is configured to monitor various data sources related to the Sia network.
Once the app is started it will poll the api endpoints every hour and display the latest data in a web dashboard.

## Running

To start the web server and data logging:

````
  npm install
  npm start
````

By default the server listens on port 8080 but can be overridden by setting an environment variable called `SIA_METRIC_PORT`.
