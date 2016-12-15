function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {

    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    switch (messageText) {
      case 'generic':
        sendGenericMessage(senderID);
        break;

      default:
        sendMovieInfo(senderID, messageText, timeOfMessage);
      
      // default:
      //   sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

function movieSearch(name, callback){
  var url = "http://www.imdb.com/find?ref_=nv_sr_fn&s=tt&ttype=ft&q="+name;
  request(url, function(error, response, html){
    if(!error){
      var $ = cheerio.load(html);
      var movieList = [];
      $('.findResult').each(function(j,elem){
        if(j>6){
          return false;
        }
        movieList.push("http://www.imdb.com"+$(elem).find('td.result_text a').attr('href'));
      });
    }
    console.log("List of movies "+movieList);
    var totalMovies = 0;
    var movies = [];
    movieList.forEach(function(url){
      request(url, function(error, response, html){
        if(!error){
          var $ = cheerio.load(html);
          var movieObject = {};
          movieObject.title = $('h1').text().trim();
          movieObject.poster = $('.poster img').attr('src');
          movieObject.link = url;
          movieObject.rating = $('.ratingValue').text().trim().replace(/\/10/,'');
          console.log("Present movie object is "+JSON.stringify(movieObject));
          movies.push(movieObject);
        }
        totalMovies++;
        if(totalMovies==movieList.length){
          console.log("Movies string is "+movies.toString());
          callback(movies);
        }
      });
    });   
  }); 
}

function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to 
  // let them know it was successful
  sendTextMessage(senderID, "Postback called already");
}

function sendMovieInfo(recipientId, messageText, timeOfMessage){
  var movieName = messageText;
  movieName = movieName.replace(/movie: /, '');
  var moviesearch = movieSearch(movieName, function(response){
    console.log("Response is "+response);
  sendGenericMovieMessage(recipientId, response);
    //sendTextMessage(recipientId, response.substr(1,300)); 
  });
  // var db = admin.database().ref('/blog/345/title');
  // console.log("Database is "+db);
  // db.on('value', function(snapshot){
    // console.log("Snapshot value is "+snapshot.val());
    // sendTextMessage(recipientId, snapshot.val());
  // });
  // admin.database().ref('/users/'+recipientId+'/messages/').push().set({
    // 'timestamp' : timeOfMessage,
    // 'message' : messageText
  // });
    // var message = movieScraper(movieName, function(response){
    // var output = utf8.encode(JSON.stringify(response));
    // console.log("Output is "+output);
  // });
  // var rating = getMovieRating("http://www.imdb.com/title/tt1211837/", function(response){
    // //sendTextMessage(recipientId,response);
  // });
}

function movieScraper(movieName, callback){
  url = "http://www.imdb.com/title/tt1211837/";
  request(url, function(error, response, html){
    if(!error){
      var $ = cheerio.load(html);
      var title, release, rating;
      var json = { title : "" };
      $('h1').filter(function(){
        var data = $(this);
        title = data.text();
        json.title = title;
      });
    }
    console.log("Stringify: "+JSON.stringify(json));
    callback(JSON.stringify(json));    
  });
}

function sendGenericMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",               
            image_url: "http://messengerdemo.parseapp.com/img/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",               
            image_url: "http://messengerdemo.parseapp.com/img/touch.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }
      }
    }
  };  
  callSendAPI(messageData);
}

function sendGenericMovieMessage(recipientId, movieObject){
  var elementsResult = [];
  for(var i=0;i<movieObject.length;i++){
    elementsResult.push({
      title: movieObject[i].title,
      subtitle: "Next-generation virtual reality",
      item_url: movieObject[i].link,               
      image_url: movieObject[i].poster,
      buttons: [{
        type: "web_url",
        url: movieObject[i].link,
        title: "Open Web URL"
      }],
    });
  }
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: elementsResult
        }
      }
    }
  };  
  callSendAPI(messageData);
}


function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: 'EAAFCBvwvZCdoBAGIS9b3V2Wlw5rCSYDCkNUJgcD9kLfP01x37R6dylcu7bLZB2rtit2soThJgt9ZB0bZAiuafjq9ZCaiihZBPmHXHk7EhwHSBudp2doPbu56ZAjnZBpVoNLRfDLEYPoPbCRyOZAGNp8QhWz8oPqe0aRLDaGB7bmXJtwZDZD' },
    method: 'POST',
    json: messageData
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;
      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });  
}

function persistentMenu(){
  var messagedata = {
    setting_type : "call_to_actions",
    thread_state : "existing_thread",
    call_to_actions:[
      {
        type:"postback",
        title:"Movie Search",
        payload:"DEVELOPER_DEFINED_PAYLOAD_FOR_HELP"
      },
      {
        type:"web_url",
        title:"Storygag",
        url:"http://stroygag.com/"
      }
    ]
  };
  request({
    url: 'https://graph.facebook.com/v2.6/me/thread_settings',
    qs: { access_token: 'EAAFCBvwvZCdoBAGIS9b3V2Wlw5rCSYDCkNUJgcD9kLfP01x37R6dylcu7bLZB2rtit2soThJgt9ZB0bZAiuafjq9ZCaiihZBPmHXHk7EhwHSBudp2doPbu56ZAjnZBpVoNLRfDLEYPoPbCRyOZAGNp8QhWz8oPqe0aRLDaGB7bmXJtwZDZD' },
    method: 'POST',
    json: messagedata
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });  
}