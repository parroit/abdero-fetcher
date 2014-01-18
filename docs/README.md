

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

```
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
```
### main options properties: 
 * user - username of the imap account.
 * password - password of the imap account.
 * host - imap server hostname
 * port - imap server port
 * tls - connection use tls
 * tlsOptions - tls advanced options
 

### Params: 

* **options** *{Object}* options for the fetcher object. main use is to specify connection options

## connect()

connect to imap server

### Return:

* **Object** a promise fullfilled when imap server is connected

## disconnect()

disconnect from imap server

### Return:

* **Object** a promise fullfilled when imap server is disconnected

## download(folder, uid)

read a single message from imap server

### Params: 

* **String** *folder* - path of the folder containing the message

* **String** *uid* - uid of the message to read

### Return:

* **Object** a readable stream containing the message in json format

## listBoxes()

return list of boxes in the account, in json format

### Return:

* **Object** a readable stream of boxes, in JSON format

## list(folderName, query)

Read a list of messages from a folder.

### Messages structure
returned stream contains an array of all messages in json format
Each message contains FROM TO SUBJECT DATE
but no body or attachments.

### Params: 

* **String** *folderName* - the folder to read

* **String** *query* - filter returned messages using this imap query

### Return:

* **Object** a readable stream that read messages in JSON format

<!-- End lib/abdero-fetcher.js -->

