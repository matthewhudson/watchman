var http = require('http'),
	fs = require('fs'),
	yaml = require('yaml')
	_ = require('underscore'),
	nodemailer = require('nodemailer'),
	mailOptions = {},
	statusCode = 0,
	hostname = "";

// Open the config file and establish user settings.
var config = yaml.eval(fs.readFileSync('config.yaml', 'utf8').toString());

if (!config) {
	console.log("config.yaml is invalid, please check.")
}

// Initialize HTTP GET request settings.
var requestOptions = {
	'path': '/',
	'headers': {
		'user-agent': config['user-agent']
	}
};

// Configure the Mail
var mailTransport = nodemailer.createTransport("SES", {
	AWSAccessKeyID: config.ses.access,
	AWSSecretKey: config.ses.secret
});

// Begin polling websites.
setInterval(function () {
	_.each(config.websites, function (website) {
		requestOptions.host = website.host;

		http.get(requestOptions, function (response) {
			statusCode = response.statusCode;
			hostname = this._headers.host;
			console.log(hostname + " -> " + statusCode);
			
			// Check if this an acceptable status code, if not alert admin.
			if (_.indexOf(config['status-codes'], statusCode) === -1) {
				mailOptions = {
					from: config.from,
					to: website.contact,
					cc: config.cc.join(', '),
					subject: "DOWN alert: " + hostname + " EOM"
				}

				mailTransport.sendMail(mailOptions);
			}
		}).on('error', function (err) {
			console.log("HTTP Request Error: " + err.message);
		});
	});
}, config.interval);