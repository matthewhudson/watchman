# [WATCHMAN](http://www.matthewghudson.com/projects/watchman/)

Watchman monitors websites to ensure they return an expected Status Code. If not, an email is sent to the respective admin.

## Usage

Edit config-sample.yaml, and then rename to config.yaml. Then run: 

	node index.js

Bam! As long as watchman is running in the background, it will monitor your websites and send alerts if anything is amiss.

## Configuration

Edit config-sample.yaml to you suit your needs. 

### Basic

##### Websites

This is a list of websites to monitor.

##### Interval

Controls how often to poll each host in websites.

##### User Agent

The polling service with send this User Agent string during the request. This helps distinguish bot requests in the HTTP Access Logs.

##### Status Codes

A list of acceptable HTTP Status Codes. If the request does not return a status code in this list, an email alert is sent.

##### CC

A list of emails to be CC'ed if ANY of the sites in the list of monitored websites are down.

#### Amazon SES

Watchman relies on Amazon SES to send email alerts.

##### Access/Secret Keys

Without these, Watchman can't see emails.

##### From

This is an SES verified email address. All alerts are sent from this address.


## SUGGESTIONS

All comments in how to improve this library are very welcome. Feel free post suggestions to the Issue tracker, or even better, fork the repository to implement your own ideas and submit a pull request.

## LICENSE

Unless attributed otherwise, everything is under the MIT License (see LICENSE for more info).