/*
 * abdero-fetcher
 * https://github.com/parroit/abdero-fetcher
 *
 * Copyright (c) 2014 Andrea Parodi
 * Licensed under the MIT license.
 */
 
'use strict';


var fs = require("fs"),
    imap = require("../lib/imap-fetcher"),
    Fetcher = imap.Fetcher,
    
    expect = require("expect.js"),
    abdero_fetcher = require("../lib/abdero-fetcher");




describe("imapFetcher", function() {
    describe("module", function() {
        it("is defined", function() {
            expect(imap).to.be.a("object");

        });
    });

    describe("Fetcher", function() {
        it("throw on non object option argument", function() {
            expect(function() {
                return new Fetcher(null, "", "");
            }).to.throwException(Error);

            expect(function() {
                return new Fetcher(undefined, "", "");
            }).to.throwException(Error);

            expect(function() {
                return new Fetcher(true, "", "");
            }).to.throwException(Error);

            expect(function() {
                return new Fetcher(/ /, "", "");
            }).to.throwException(Error);

            expect(function() {
                return new Fetcher(42, "", "");
            }).to.throwException(Error);

            expect(function() {
                return new Fetcher("some options", "", "");
            }).to.throwException(Error);

            expect(function() {
                return new Fetcher(function() {}, "", "");
            }).to.throwException(Error);

        });


        var transport = new Fetcher({
            user: process.env.MY_MAIL_ADDRESS,
            password: process.env.MY_MAIL_PASSWORD,
            host: "imap.gmail.com",
            port: 993,
            tls: true,
            tlsOptions: {
                rejectUnauthorized: false
            }
        });

        it("should be instantiable with config", function() {
            expect(transport).not.to.be.null;
        });

        describe("status", function() {


            it("should be disconnected at start", function() {
                expect(transport.status).to.be.equal(imap.Status.disconnected);

            });

            it("go to connected upon connection", function(done) {
                this.timeout(5000);
                transport.connect(function() {
                    expect(transport.status).to.be.equal(imap.Status.connected);
                    transport.disconnect(function() {
                        done();
                    });

                });


            });

            it("go to disconnected upon disconnection", function(done) {
                this.timeout(25000);
                transport.connect(function() {

                    transport.disconnect(function() {
                        expect(transport.status).to.be.equal(
                            imap.Status.disconnected
                        );
                        done();
                    });
                });


            });

        });

        describe("list", function() {
            var msgs;

            before(function(done) {
                this.timeout(25000);


                transport.connect(function() {
                    transport.list("INBOX", "1:*")
                        .then(function(msgsStream) {

                            msgs = [];

                            msgsStream.on("data", function(msg) {
                                msgs.push(msg);
                            });
                            msgsStream.once("end", function() {

                                transport.disconnect(function() {
                                    done();
                                });

                            });

                        })

                    .then(null, function(err) {
                        console.log(err.stack);
                    });
                });

            });

            it("return all messages in array", function() {

                expect(msgs.length).to.be.equal(5);


            });

            it("messages contains subject", function() {

                expect(msgs[0].subject).to.be.equal("this is a test");


            });

            it("messages contains uid", function() {

                expect(msgs[0].uid).to.be.a("number");
                expect(msgs[0].uid).to.be.equal(5);
                //                console.log(msgs[0].uid);


            });

            it("messages contains date", function() {

                expect(msgs[0].date).to.be.equal(1381592397000);


            });



            it("messages contains people", function() {

                expect(msgs[1].people.length).to.be.equal(2);


            });


            it("people has address", function() {

                expect(msgs[1].people[0].address).to.be.equal(
                    "mail-noreply@google.com"
                );


            });



            it("people has name", function() {

                expect(msgs[1].people[0].name).to.be.equal("Team di Gmail");


            });
        });

        describe("listBoxes", function() {
            var boxesList;

            before(function(done) {
                this.timeout(25000);
                transport.connect(function() {
                    transport.listBoxes()
                        .then(function(boxes) {
                            boxesList = boxes;
                            //console.log(JSON.stringify(boxes));
                            transport.disconnect(function() {
                                done();
                            });
                        })

                    .then(null, function(err) {
                        console.log(err.stack);
                    });
                });
            });


            it("boxes has text property", function() {

                expect(boxesList[0].text).to.be.equal("INBOX");
            });

            it("boxes has id property", function() {

                expect(boxesList[0].id).to.be.equal("INBOX");
                expect(boxesList[0].children[0].id).to.be.equal("INBOX/test");
            });

            it("boxes has children", function() {

                expect(boxesList[0].children).to.be.an("array");
            });

            it("return all boxes", function() {

                expect(boxesList.length).to.be.equal(3);
            });

            it("return boxes array", function() {
                this.timeout(25000);
                expect(boxesList).to.be.an("array");
            });

        });

        describe("fetch", function() {


            it("return message fetched promise", function(done) {
                this.timeout(25000);


                transport.connect(function() {
                    transport.fetch("INBOX", 5)
                        .then(function(msg) {
                            //console.log(msg)
                            expect(msg.stream).to.not.equal(null);
                            expect(msg.info).to.not.equal(null);
                            transport.disconnect(function() {
                                done();
                            });

                        })

                    .then(null, function(err) {
                        console.log(err.stack);
                    });
                });


            });

            it("message stream contains full message body", function(done) {
                this.timeout(25000);


                transport.connect(function() {
                    transport.fetch("INBOX/test", 2)
                        .then(function(msg) {

                            var buffer = "",
                                messageStream = msg.stream;

                            messageStream.on("data", function(chunk) {
                                buffer += chunk.toString("utf8");
                            });

                            messageStream.once("end", function() {
                                var fs = require("fs");
                                var path = "./test/expected.msg";
                                var expected = fs.readFileSync(path, "utf8");
                                var actual = buffer.replace(/[\r\n]/g, "");
                                expect(actual).to.be.equal(
                                    expected.replace(/[\r\n]/g, "")
                                );
                                transport.disconnect(function() {
                                    done();
                                });
                            });

                        })

                    .then(null, function(err) {
                        console.log(err.stack);
                    });
                });


            });
        });

        describe("download", function() {
            var html,
                text;

            before(function(done) {
                this.timeout(25000);


                transport.connect(function() {
                    transport.download("INBOX", 6)
                        .then(function(msg) {
                            var path = "./test/expected-body.html";
                            var expected = fs.readFileSync(path, "utf8");

                            html = msg.html.replace(/[\r\n ]/g, "");
                            text = msg.text.replace(/[\r\n ]/g, "");

                            transport.disconnect(function() {
                                done();
                            });

                        })

                    .then(null, function(err) {
                        console.log(err.stack);
                    });
                });


            });

            it("return message body as html", function() {
                this.timeout(25000);
                var path = "./test/expected-body.html";
                var expected = fs.readFileSync(path, "utf8");
                expected = expected.replace(/[\r\n ]/g, "");



                expect(html).to.be.equal(expected);

            });



            it("return message body as text", function() {
                this.timeout(25000);
                var path = "./test/expected-body.txt";
                var expected = fs.readFileSync(path, "utf8");
                expected = expected.replace(/[\r\n ]/g, "");



                expect(text).to.be.equal(expected);

            });


        });
    });
});