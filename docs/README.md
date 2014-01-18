

<!-- Start lib/abdero-fetcher.js -->

abdero-fetcher
https://github.com/parroit/abdero-fetcher

Copyright (c) 2014 Andrea Parodi
Licensed under the MIT license.

## Fetcher({Object})

Create a new Fetcher instance.
A Fetcher object could be used to read mails
from an IMAP connection and return them 
to user using node Stream pattern.

### Example options object

   var fetcher = new Fetcher({
     user: process.env.MY_MAIL_ADDRESS,
     password: process.env.MY_MAIL_PASSWORD,
     host: &quot;imap.gmail.com&quot;,
     port: 993,
     tls: true,
     tlsOptions: {
         rejectUnauthorized: false
     }
   })

### main options properties: 
 * user - username of the imap account.
 * password - password of the imap account.
 * host - imap server hostname
 * port - imap server port
 * tls - connection use tls
 * tlsOptions - tls advanced options
 

### Params: 

* **options** *{Object}* options for the fetcher object. main use is to specify connection options

<!-- End lib/abdero-fetcher.js -->

