var http = require('http'),
  fs = require('fs'),
  yaml = require('yaml')
  _ = require('underscore'),
  nodemailer = require('nodemailer'),
  activeAlerts = [],
  isAcceptableStatus = false,
  isAlertActive = false;

// Handle uncaughtException
process.on('uncaughtException', function (err) {
  exit('Error: ' + err.message);
});

var exit = function (message) {
  if (message) {
    console.log(message);
  }
  console.log('Exiting...');
  process.exit(1);
};

// Open the config file and establish user settings.
var config = yaml.eval(fs.readFileSync('config.yaml', 'utf8').toString());

// Validate the config file and ensure mandatory fields exist
if (!_.has(config, 'interval') || !_.isNumber(config.interval)) {
  exit('Invalid config. Interval must be a number.');
}

if (!_.has(config, 'status-codes') || !_.isArray(config['status-codes'])) {
  exit('Invalid config. Status Codes must be a list.');
}

if (!_.has(config, 'from') || !_.isString(config.from)) {
  exit('Invalid config. From must be an email address.');
}

if (!_.has(config, 'ses') || !_.isObject(config.ses)) {
  exit('Invalid config. AWS SES settings are missing.');
}

if (!_.has(config.ses, 'access') || !_.isString(config.ses.access)) {
  exit('Invalid config. AWS SES Access Key is missing.');
}

if (!_.has(config.ses, 'secret') || !_.isString(config.ses.access)) {
  exit('Invalid config. AWS SES Secret Key is missing.');
}

if (!_.has(config, 'websites') || !_.isObject(config.websites)) {
  exit('Invalid config. Websites must be an Object.');
}

// Ensure each website has both a host + contact
_.each(config.websites, function (website) {
  if (!_.has(website, 'host') || !_.isString(website.host)) {
    exit('Invalid config. Each website must have a host.');
  }
  if (!_.has(website, 'contact') || !_.isString(website.contact)) {
    exit('Invalid config. Each website must have a contact email.');
  }
});

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