"use strict";
var fluid = require("infusion");

fluid.defaults("gpii.test.couchdb.request", {
    gradeNames: ["kettle.test.request.http"],
    method:     "GET",
    port:       "{testEnvironment}.options.couch.port"
});
