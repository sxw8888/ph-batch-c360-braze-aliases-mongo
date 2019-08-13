const Bunyan = require('bunyan');
const PrettyStream = require('bunyan-prettystream');
const RotatingStream = require('logrotate-stream');

const prettyStdOut = new PrettyStream();
prettyStdOut.pipe(process.stdout);
const name = process.env.SERVICE_NAME || 'ph-node-c360-upload-braze';
const level = process.env.LOG_LEVEL || 'debug';

const logger = Bunyan.createLogger({
  name,
  streams: [
    {
      level,
      type: 'raw',
      stream: prettyStdOut,
    },
    // below are for local
    /* {
          level:      "info",
          stream: new RotatingStream(
              {
                  file:       'log' + "/info-logs.json",
                  size:       "1m",
                  keep:       50,
                  compress:   false
              } )
      },

      {
          level:      "debug",
          stream: new RotatingStream(
              {
                  file:       'log' + "/debug-logs.json",
                  size:       "1m",
                  keep:       50,
                  compress:   false
              } )
      },
      {
          level:      "error",
          stream: new RotatingStream(
              {
                  file:       'log' + "/error-logs.json",
                  size:       "1m",
                  keep:       50,
                  compress:   false
              } )
      } */


  ],

});


module.exports = logger;
