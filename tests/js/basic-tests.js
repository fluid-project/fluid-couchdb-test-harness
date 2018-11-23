/* eslint-env node */
/* Tests for the "pouch" module */
"use strict";
var fluid = require("infusion");
fluid.logObjectRenderChars = 20480;
var gpii  = fluid.registerNamespace("gpii");

fluid.require("%gpii-couchdb-test-harness");
gpii.test.couchdb.loadTestingSupport();

var kettle = require("kettle");
kettle.loadTestingSupport();

require("./lib/checkResponse");

fluid.registerNamespace("gpii.tests.couchdb.basic");

gpii.tests.couchdb.basic.checkRecordAndStartDelete = function (response, body, expectedStatus, expectedBody, deleteRequest) {
    var record = JSON.parse(body);
    gpii.test.couchdb.checkResponse(response, body, expectedStatus, expectedBody);

    // DELETE requests must reference a specific revision, as in:
    // DELETE /recipes/FishStew?rev=1-9c65296036141e575d32ba9c034dd3ee
    deleteRequest.send({}, { termMap: { rev: record._rev } });
};

fluid.defaults("gpii.tests.couchdb.basic.caseHolder", {
    gradeNames: ["gpii.test.couchdb.caseHolder"],
    expected: {
        root:             { couchdb:"Welcome","vendor":{ "name":"The Apache Software Foundation" } },
        massive:          { total_rows: 150 },
        noData:           { total_rows: 0 },
        read:             { foo: "bar" },
        supplementalRead: { has: "data" },
        afterDelete:      {},
        beforeDelete:     { _id: "todelete"},
        insert:           { id: "toinsert", foo: "bar"}
    },
    rawModules: [
        {
            name: "Testing docker test harness.",
            tests: [
                {
                    name: "Testing loading CouchDB root.",
                    type: "test",
                    sequence: [
                        {
                            func: "{rootRequest}.send",
                            args: [{}]
                        },
                        {
                            listener: "gpii.test.couchdb.checkResponse",
                            event:    "{rootRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{rootRequest}.nativeResponse", "{arguments}.0", 200, "{testCaseHolder}.options.expected.root"]
                        }
                    ]
                },
                {
                    name: "Testing 'massive' database.",
                    type: "test",
                    sequence: [
                        {
                            func: "{massiveRequest}.send",
                            args: [{}]
                        },
                        {
                            listener: "gpii.test.couchdb.checkResponse",
                            event:    "{massiveRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{massiveRequest}.nativeResponse", "{arguments}.0", 200, "{testCaseHolder}.options.expected.massive"]
                        }
                    ]
                },
                {
                    name: "Testing 'nodata' database.",
                    type: "test",
                    sequence: [
                        {
                            func: "{noDataRequest}.send",
                            args: [{}]
                        },
                        {
                            listener: "gpii.test.couchdb.checkResponse",
                            event:    "{noDataRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{noDataRequest}.nativeResponse", "{arguments}.0", 200, "{testCaseHolder}.options.expected.noData"]
                        }
                    ]
                },
                {
                    name: "Testing reading a single record from the 'sample' database.",
                    type: "test",
                    sequence: [
                        {
                            func: "{readRequest}.send",
                            args: [{}]
                        },
                        {
                            listener: "gpii.test.couchdb.checkResponse",
                            event:    "{readRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{readRequest}.nativeResponse", "{arguments}.0", 200, "{testCaseHolder}.options.expected.read"]
                        }
                    ]
                },
                {
                    name: "Confirm that supplemental data was loaded for the 'sample' database.",
                    type: "test",
                    sequence: [
                        {
                            func: "{supplementalReadRequest}.send",
                            args: [{}]
                        },
                        {
                            listener: "gpii.test.couchdb.checkResponse",
                            event:    "{supplementalReadRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{supplementalReadRequest}.nativeResponse", "{arguments}.0", 200, "{testCaseHolder}.options.expected.supplementalRead"]
                        }
                    ]
                },
                {
                    name: "Testing deleting a single record from the 'sample' database.",
                    type: "test",
                    sequence: [
                        // The record should exist before we delete it.
                        {
                            func: "{preDeleteRequest}.send",
                            args: [{}]
                        },
                        // confirm that the record exists now and delete the latest revision.
                        {
                            listener: "gpii.tests.couchdb.basic.checkRecordAndStartDelete",
                            event:    "{preDeleteRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{preDeleteRequest}.nativeResponse", "{arguments}.0", 200, "{that}.options.expected.beforeDelete", "{deleteRequest}"]
                        },
                        // The delete request should be successful.
                        {
                            listener: "gpii.test.couchdb.checkResponse",
                            event:    "{deleteRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{deleteRequest}.nativeResponse", "{arguments}.0", 200, "{testCaseHolder}.options.expected.afterDelete"]
                        },
                        // The record should no longer exist after we delete it.
                        {
                            func: "{verifyDeleteRequest}.send",
                            args: [{}]
                        },
                        {
                            listener: "gpii.test.couchdb.checkResponse",
                            event:    "{verifyDeleteRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{verifyDeleteRequest}.nativeResponse", "{arguments}.0", 404]
                        }
                    ]
                },
                {
                    name: "Testing inserting a record into the 'sample' database.",
                    type: "test",
                    sequence: [
                        // The record should not exist before we create it.
                        {
                            func: "{preInsertRequest}.send",
                            args: [{}]
                        },
                        {
                            listener: "gpii.test.couchdb.checkResponse",
                            event:    "{preInsertRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{preInsertRequest}.nativeResponse", "{arguments}.0", 404]
                        },
                        // The insert should be successful.
                        {
                            func: "{insertRequest}.send",
                            args: ["{that}.options.expected.insert"]
                        },
                        {
                            listener: "gpii.test.couchdb.checkResponse",
                            event:    "{insertRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{insertRequest}.nativeResponse", "{arguments}.0", 201]
                        },
                        // The record should exist after we create it.
                        {
                            func: "{verifyInsertRequest}.send",
                            args: [{}]
                        },
                        {
                            listener: "gpii.test.couchdb.checkResponse",
                            event:    "{verifyInsertRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{verifyInsertRequest}.nativeResponse", "{arguments}.0", 200, "{testCaseHolder}.options.expected.insert"]
                        }
                    ]
                }
            ]
        }
    ],
    components: {
        rootRequest: {
            type: "gpii.test.couchdb.request",
            options: {
                path: "/"
            }
        },
        massiveRequest: {
            type: "gpii.test.couchdb.request",
            options: {
                path: "/massive/_all_docs"
            }
        },
        noDataRequest: {
            type: "gpii.test.couchdb.request",
            options: {
                path: "/nodata/_all_docs"
            }
        },
        readRequest: {
            type: "gpii.test.couchdb.request",
            options: {
                path: "/sample/foo"
            }
        },
        supplementalReadRequest: {
            type: "gpii.test.couchdb.request",
            options: {
                path: "/sample/supplemental"
            }
        },
        preDeleteRequest: {
            type: "gpii.test.couchdb.request",
            options: {
                path: "/sample/todelete"
            }
        },
        deleteRequest: {
            type: "gpii.test.couchdb.request",
            options: {
                path:   "/sample/todelete?rev=%rev",
                method: "DELETE",
                termMap: { "rev": "%rev"}
            }
        },
        verifyDeleteRequest: {
            type: "gpii.test.couchdb.request",
            options: {
                path: "/sample/todelete"
            }
        },
        preInsertRequest: {
            type: "gpii.test.couchdb.request",
            options: {
                path:   "/sample/toinsert"
            }
        },
        insertRequest: {
            type: "gpii.test.couchdb.request",
            options: {
                path:   "/sample/toinsert",
                method: "PUT"
            }
        },
        verifyInsertRequest: {
            type: "gpii.test.couchdb.request",
            options: {
                path:   "/sample/toinsert"
            }
        }

    }
});

fluid.defaults("gpii.tests.couchdb.basic.environment", {
    gradeNames: ["gpii.test.couchdb.environment"],
    components: {
        testCaseHolder: {
            type: "gpii.tests.couchdb.basic.caseHolder"
        }
    }
});

fluid.test.runTests("gpii.tests.couchdb.basic.environment");
