### Setting Up Credentials for Basic Auth

1. in the file `credentials.json`, replace `"username"` and `"password"` with the desired log in information. 

### Running the App

1. `npm i` to install the required dependencies.
2. `npm start` will run the server on port 8888.

### Endpoints

GET `/` - serves up the web form where PDFs, interval, and transition data may be uploaded for each sign.

POST `/update` - accepts `sign` (an integer from 1-3) and `timestamp` (in `YYYYMMDDHHmmss` format) as query strings. 
