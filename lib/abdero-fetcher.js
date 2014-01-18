/*
 * abdero-fetcher
 * https://github.com/parroit/abdero-fetcher
 *
 * Copyright (c) 2014 Andrea Parodi
 * Licensed under the MIT license.
 */

"use strict";

var MailParser = require("mailparser").MailParser,
    addressparser = require("addressparser"),
    moment = require("moment"),
    concat = require("concat-stream"),
    through = require("through"),
    Imap = require("imap"),
    fs = require("fs"),
    Promise = require("promise"),
    Status = {
        connected: 1,
        disconnected: 0
    };

exports.Status = Status;
exports.Fetcher = Fetcher;


/**
 * Create a new Fetcher instance.
 * A Fetcher object could be used to read mails
 * from an IMAP connection and return them 
 * to user using node Stream pattern.
 * 
 * ### Example options object
 * 
 * ```
 *    var fetcher = new Fetcher({
 *      user: process.env.MY_MAIL_ADDRESS,
 *      password: process.env.MY_MAIL_PASSWORD,
 *      host: "imap.gmail.com",
 *      port: 993,
 *      tls: true,
 *      tlsOptions: {
 *          rejectUnauthorized: false
 *      }
 *    })
 * ```
 * ### main options properties: 
 *  * user - username of the imap account.
 *  * password - password of the imap account.
 *  * host - imap server hostname
 *  * port - imap server port
 *  * tls - connection use tls
 *  * tlsOptions - tls advanced options
 *  
 * @constructor
 * @param options {Object} options for the fetcher object. main use is to specify connection options
 *
 
 
 */
function Fetcher(options) {

    if (Object.prototype.toString.call(options) !== "[object Object]") {
        throw new Error("Please provide an object options argument");
    }


    var self = this;
    self.imap = new Imap(options);

    self.status = Status.disconnected;


    self.imap.once("error", function(err) {
        console.log(err);
    });



}


/**
 * connect to imap server
 *
 * @return {Object} a promise fullfilled when imap server is connected
 */
Fetcher.prototype.connect = function(onConnected) {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.imap.once("ready", function() {
            self.status = Status.connected;
            resolve();
        });
        self.imap.connect();
    });

};

/**
 * disconnect from imap server
 *
 * @return {Object} a promise fullfilled when imap server is disconnected
 */
Fetcher.prototype.disconnect = function(onDisconnected) {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.imap.once("end", function() {
            self.status = Status.disconnected;
            resolve();
        });
        self.imap.end();
    });
};


/**
 * read a single message from imap server
 *
 * @param  {String} folder  -   path of the folder containing the message
 * @param  {String} uid     -   uid of the message to read
 * @return {Object}        a readable stream containing the message in json format
 */
Fetcher.prototype.download = function(folder, uid) {


    var self = this,
        stream = through();

    var mailparser = new MailParser({
        streamAttachments: true
    });

    mailparser.on("end", function(msg) {
        //console.dir(msg);
        stream.queue(JSON.stringify(msg));
        stream.queue(null);
    });

    self.fetch(folder, uid)
        .then(function(msg) {
            //console.dir(msg);
            msg.stream.pipe(mailparser);
        })

    .then(null, function(err) {
        stream.emit("error", err);
    });;

    return stream;
};

Fetcher.prototype.fetch = function(folderName, uid) {
    var self = this;
    return self._openBox(folderName)
        .then(function(box) {

            var f = self.imap.fetch(uid, {
                bodies: ""
            });


            return new Promise(function(resolve, reject) {

                f.once("error", function(err) {
                    reject(err);
                });

                f.on("message", function(msg, seqno) {


                    msg.on("body", function(stream, info) {


                        resolve({
                            stream: stream,
                            info: info
                        });
                    });
                });
            });
        });

};



Fetcher.prototype.listBoxes = function() {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.imap.getSubscribedBoxes(function(err, boxes) {
            if (err) {
                return reject(err);
            }
            resolve(buildBoxesTree(boxes));

        });
    });
};

/**
 * Read a list of messages from a folder.
 *
 * ### Messages structure
 * returned stream contains an array of all messages in json format
 * Each message contains FROM TO SUBJECT DATE
 * but no body or attachments.
 *
 * @param  {String} folderName  - the folder to read
 * @param  {String} query   - filter returned messages using this imap query
 * @return {Object}     a readable stream that read messages in JSON format
 */
Fetcher.prototype.list = function(folderName, query) {
    var self = this,
        msgsStream = through();

    self._openBox(folderName).then(function(box) {

        var f = self.imap.fetch(query, {
            bodies: "HEADER.FIELDS (FROM TO SUBJECT DATE)",
            struct: true
        });



        var pending = 0,
            done = false;


        f.once("error", function(err) {
            msgsStream.emit("error", err);
        });

        f.once("end", function() {
            done = true;

        });

        f.on("message", function(msg) {
            pending++;
            var uid;
            var buffer;

            msg.once("attributes", function(attrs) {
                uid = attrs.uid;
                if (buffer && uid) {
                    buildMailObject(buffer, uid);
                }
            });

            msg.on("body", function(stream) {
                stream.pipe(concat({
                    encoding: "string"
                }, function(buff) {
                    buffer = buff;
                    if (buffer && uid) {
                        buildMailObject(buffer, uid);
                    }

                }));


            });
        });

        function buildMsg(options) {

            var headers = options.Imap.parseHeader(options.buffer);
            var people = [];
            [].push.apply(people, addressparser(headers.from));
            [].push.apply(people, addressparser(headers.to));
            var subject = "";

            if (headers.subject && headers.subject.length) {
                subject = headers.subject[0];
            }

            return {
                uid: options.uid,
                subject: subject,
                date: moment(headers.date[0]).valueOf(),
                people: people
            };
        }

        function buildMailObject(buffer, uid) {

            var msg;

            try {
                msg = buildMsg({
                    Imap: Imap,
                    buffer: buffer,
                    uid: uid
                });
                msgsStream.queue(msg);
            } catch (err) {
                msgsStream.emit("error", err)
            }


            pending--;

            if (done && pending === 0) {
                msgsStream.queue(null);
            }
        }



    });

    return msgsStream;
};


Fetcher.prototype._openBox = function(folderName) {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.imap.openBox(folderName, true, function(err, box) {
            if (err) {
                return reject(err);
            }
            resolve(box);

        });
    });
};

function buildBoxesTree(boxes, parent) {
    var results = [];
    parent = parent || "";
    Object.keys(boxes).forEach(function(boxName) {
        var origBox = boxes[boxName];

        var box = {
            text: boxName,
            id: parent + boxName
        };


        if (origBox.children) {
            var par = box.id + origBox.delimiter;
            box.children = buildBoxesTree(origBox.children, par);
        }

        results.push(box);
    });
    return results;
}