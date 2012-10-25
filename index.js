var http = require('http'),
	fs = require('fs'),
	yaml = require('yaml')
	_ = require('underscore'),
	nodemailer = require('nodemailer'),
	activeAlerts = [],
	isAcceptableStatus = false,
	isAlertActive = false;

// Handle uncaughtException
process.on('uncaughtException', function(err){
    console.log('Error: %s', err.message);
	console.log('Exiting...');
    process.exit(1);
});

// Open the config file and establish user settings.
var config = yaml.eval(fs.readFileSync('config.yaml', 'utf8').toString());

// Initialize HTTP GET request settings.
var requestOptions = {
	'path': '/',
	'headers': {
		'user-agent': config['user-agent']
	}
};

// Configure the Mail
var mailTransport = nodemailer.createTransport('SES', {
	AWSAccessKeyID: config.ses.access,
	AWSSecretKey: config.ses.secret
});

var checkStatus = function (hostname, contact, statusCode) {
	console.log('CHECK ' + hostname + ' -> ' + statusCode);

	isAcceptableStatus = _.indexOf(config['status-codes'], statusCode) >= 0;
	isAlertActive = _.indexOf(activeAlerts, hostname) >= 0;

	// Send admin email alert if:
	// 1. Status code is unacceptable (not in config[status-codes])
	// 2. We haven't already notified them.
	if (!isAcceptableStatus && !isAlertActive) {
		console.log('ALERTING contact for ' + hostname);

		// Send the email:
		mailTransport.sendMail({
			from: config.from,
			to: contact,
			cc: config.cc,
			subject: 'DOWN alert: ' + hostname + ' EOM'
		});

		// Add hostname to activeAlerts[]
		activeAlerts.push(hostname);

		// If status check is healthy, remove the hostname from activeAlerts
	} else if (isAcceptableStatus && isAlertActive) {
		// Remove 'hostname' from activeAlerts[]
		activeAlerts = _.without(activeAlerts, hostname);
	}
};

// Begin polling websites.
setInterval(function () {
	_.each(config.websites, function (website) {
		requestOptions.host = website.host;

		http.get(requestOptions, function (response) {
			checkStatus(website.host, website.contact, response.statusCode);
		}).on('error', function (err) {
			checkStatus(website.host, website.contact, false);
		});
	});
}, config.interval);