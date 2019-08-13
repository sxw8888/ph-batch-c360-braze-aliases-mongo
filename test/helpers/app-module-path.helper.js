const path = require('path');
const amp = require('app-module-path');

amp.addPath(path.join(__dirname, '../../src'));
amp.addPath(path.join(__dirname, '../../test'));
