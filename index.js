'use strict';

const udp = require('dgram');
const os = require('os');

const SPACE = ' ';
const NIL = '-';

const LOG_EMERG = 0;
/* system is unusable */
const LOG_ALERT = 1;
/* action must be taken immediately */
const LOG_CRIT = 2;
/* critical conditions */
const LOG_ERR = 3;
/* error conditions */
const LOG_WARNING = 4;
/* warning conditions */
const LOG_NOTICE = 5;
/* normal but significant condition */
const LOG_INFO = 6;
/* informational */
const LOG_DEBUG = 7;
/* debug-level messages */

const INTERNAL_NOPRI = 0x10;

const severities = {
  "alert": LOG_ALERT,
  "crit": LOG_CRIT,
  "debug": LOG_DEBUG,
  "emerg": LOG_EMERG,
  "err": LOG_ERR,
  "error": LOG_ERR, /* DEPRECATED */
  "info": LOG_INFO,
  "none": INTERNAL_NOPRI, /* INTERNAL */
  "notice": LOG_NOTICE,
  "panic": LOG_EMERG, /* DEPRECATED */
  "warn": LOG_WARNING, /* DEPRECATED */
  "warning": LOG_WARNING
};
/* facility codes */
const LOG_KERN = (0 << 3);
/* kernel messages */
const LOG_USER = (1 << 3);
/* random user-level messages */
const LOG_MAIL = (2 << 3);
/* mail system */
const LOG_DAEMON = (3 << 3);
/* system daemons */
const LOG_AUTH = (4 << 3);
/* security/authorization messages */
const LOG_SYSLOG = (5 << 3);
/* messages generated internally by syslogd */
const LOG_LPR = (6 << 3);
/* line printer subsystem */
const LOG_NEWS = (7 << 3);
/* network news subsystem */
const LOG_UUCP = (8 << 3);
/* UUCP subsystem */
const LOG_CRON = (9 << 3);
/* clock daemon */
const LOG_AUTHPRIV = (10 << 3);
/* security/authorization messages (private) */

/* other codes through 15 reserved for system use */
const LOG_LOCAL0 = (16 << 3);
/* reserved for local use */
const LOG_LOCAL1 = (17 << 3);
/* reserved for local use */
const LOG_LOCAL2 = (18 << 3);
/* reserved for local use */
const LOG_LOCAL3 = (19 << 3);
/* reserved for local use */
const LOG_LOCAL4 = (20 << 3);
/* reserved for local use */
const LOG_LOCAL5 = (21 << 3);
/* reserved for local use */
const LOG_LOCAL6 = (22 << 3);
/* reserved for local use */
const LOG_LOCAL7 = (23 << 3);
/* reserved for local use */

const facilities = {
  kern: LOG_KERN,
  user: LOG_USER,
  mail: LOG_MAIL,
  daemon: LOG_DAEMON,
  auth: LOG_AUTH,
  syslog: LOG_SYSLOG,
  lpr: LOG_LPR,
  news: LOG_NEWS,
  uucp: LOG_UUCP,
  cron: LOG_CRON,
  authpriv: LOG_AUTHPRIV,

  local0: LOG_LOCAL0,
  local1: LOG_LOCAL1,
  local2: LOG_LOCAL2,
  local3: LOG_LOCAL3,
  local4: LOG_LOCAL4,
  local5: LOG_LOCAL5,
  local6: LOG_LOCAL6,
  local7: LOG_LOCAL7
};

const DEFAULT_OPTIONS = {
  facility: facilities.user,
  name: null,
  debug: false
};
var hostname = os.hostname();

function generateLogFormat(msg, severity, o) {
  var pri = '<' + (o.facility + severity) + '>1';
  var msg = [
    pri,
    new (Date)().toJSON(),
    hostname,
    o.name,
    process.pid,
    NIL,
    NIL,
    msg
  ].join(SPACE);

  return new Buffer(msg,"utf-8");
}

const factory = {
  create: function(port, host, options) {
    port = port || 514;
    host = host || 'localhost';
    options = Object.assign({}, DEFAULT_OPTIONS, options);

    if (!options.name) {
      options.name = process.title || process.argv.join(' ')
    }
    const socket = udp.createSocket('udp4', function (err) {
      if (err) {
        console.error('Error creating socket.', err);
      } else {
        socket.on('close', function () {
          console.log('Socket closing');
        });

        socket.on('error', function (err) {
          console.error('Socket error', err);
          throw err;
        });
      }
    });

    return {
      log: function(msg, severity, callback) {
        callback = callback || function () {};
        severity = severity !== undefined ? severity : LOG_INFO;

        const entry = generateLogFormat(msg.trim(), severity, options);

        socket && socket.send(entry, 0, entry.length, port, host, function(err, bytes) {
          var emsg='';
          if(err) { emsg = 'error sending message'; }
          else { emsg = bytes + ' bytes sent'; }
          callback(err, emsg);
        });
      },
      close: function() {
        socket && socket.close();
      }
    }
  },
  facilities: facilities,
  severities: severities
};

module.exports = factory;

