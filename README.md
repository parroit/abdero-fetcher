# abdero-fetcher
[![Build Status](https://secure.travis-ci.org/parroit/abdero-fetcher.png?branch=master)](http://travis-ci.org/parroit/abdero-fetcher)  [![Npm module](https://badge.fury.io/js/abdero-fetcher.png)](https://npmjs.org/package/abdero-fetcher) [![Code Climate](https://codeclimate.com/github/parroit/abdero-fetcher.png)](https://codeclimate.com/github/parroit/abdero-fetcher)

fetch mails from imap

## Getting Started
Install the module with: `npm install abdero-fetcher --save`


## Documentation
see [docs folder](docs/README.md)

## Examples

### Create a fetcher instance

```javascript
var Fetcher = require('abdero-fetcher').Fetcher,
    concat = require("concat-stream");

transport = new Fetcher({
    user: process.env.MY_MAIL_ADDRESS,
    password: process.env.MY_MAIL_PASSWORD,
    host: "imap.gmail.com",
    port: 993,
    tls: true,
    tlsOptions: {
        rejectUnauthorized: false
    }
});

### Connect and retrieve a list of all boxes in account

```javascript
transport.connect().then(function(){
    transport.listBoxes();

    stream.pipe(concat(function(boxes) {
        console.log(boxes);
        transport.disconnect();
    });        
});

```

### Connect and retrieve a list of all messages in inbox

```javascript
transport.connect().then(function(){
    var stream = transport.list("INBOX", "1:*");

    stream.on("data", function(msg) {

        console.log(msg);
    });

    stream.once("end", function() {
        transport.disconnect();
    });
});

```

### Connect and download a message

```javascript
transport.connect().then(function(){
    var stream = transport.download("INBOX", 6);

    stream.pipe(concat(function(msg) {
        console.log(msg);
        transport.disconnect();
    });
});

```



## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality.


## License
Copyright (c) 2014 Andrea Parodi  
Licensed under the MIT license.
