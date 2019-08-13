#!/usr/bin/env node

const path = require("path");
const Command = require("jasmine/lib/command");
const Jasmine = require("ph-batch-c360-sync2braze-caf/bin/jasmine");
const JasmineConsoleReporter = require("jasmine-console-reporter");
const JUnitXmlReporter = require("jasmine-reporters").JUnitXmlReporter;

const projectBaseDir = path.resolve(`${__dirname}/..`);
const jasmine = new Jasmine({ projectBaseDir });
const command = new Command(projectBaseDir);

jasmine.addReporter(
  new JUnitXmlReporter({
    savePath: `${projectBaseDir}/build-output/test-reports`,
    filePrefix: "junit-report",
    consolidate: true,
    useDotNotation: true
  })
);

jasmine.addReporter(
  new JasmineConsoleReporter({
    colors: true,
    cleanStack: 1, // (0|false)|(1|true)|2|3
    verbosity: 4, // (0|false)|1|2|3|(4|true)
    listStyle: "indent", // 'flat'|'indent'
    activity: false
  })
);

jasmine.onComplete(passed => {
  process.exit(passed ? 0 : 1);
});

command.run(jasmine, process.argv.slice(2));
