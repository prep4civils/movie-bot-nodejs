var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');
var cheerio = require('cheerio');
var fs = require('fs');
var utf8 = require('utf8');
var firebase = require('firebase');
var admin = require("firebase-admin");

function redirectSec(req, res, next) {
  if (req.headers['x-forwarded-proto'] == 'http') {
      res.redirect('https://' + req.headers.host + req.path);
  } else {
      return next();
  }
}

self.app.get(r, redirectSec, self.routes[r]);

eval(fs.readFileSync('messenger.js')+'');

admin.initializeApp({
  credential: admin.credential.cert("serviceAccount.json"),
  databaseURL: "https://first-firbase-project.firebaseio.com"
});

app.set('port', (process.env.PORT || 8080));

app.use(express.static(__dirname + '/public'));

var jsonParser = bodyParser.json();
var formParser = bodyParser.urlencoded();

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});

app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === 'this_is_firebase_token') {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }  
});

app.post('/webhook', jsonParser, function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        }  else if (event.postback) {
          receivedPostback(event); 
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    res.sendStatus(200);
  }
});

app.get('/authorize', function(req, res) {
  var temp = {};
  temp.uri = req.query['redirect_uri'];
  res.render('pages/login', {data: temp});
});

app.post('/authenticate', formParser, function(req, res){
  var url = req.body.redirect_uri;
  return res.redirect(url+'&authorization_code=testing_code');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
