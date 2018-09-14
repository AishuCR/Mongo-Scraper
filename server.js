var mongoose = require('mongoose');
var bodyParser = require('body-parser')
var cheerio = require('cheerio');
var request = require('request');
var express = require('express');
var logger = require('morgan');
var exphbs = require('express-handlebars');
//Initialize express
var app = express();

mongoose.Promise = Promise;
mongoose.connect("mongodb://ds255332.mlab.com:55332/heroku_s85nsds0");
var db = mongoose.connection;

app.use(logger('dev'));

var PORT = process.env.PORT || 3000;
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static('public'));

db.on('error', function(err){
    console.log("Mongoose Error: ", err);
});
db.on('open', function(){
    console.log("Mongoose connection successful");
});
var Note = require('./models/note.js');
var Article = require('./models/article.js');

app.get('/', function(req, res) {
    res.send(index.html); // sending the html file rather than rendering a handlebars file
  });

app.get('/scrape', function(req, res) {
request('https://www.nytimes.com/', function(error, response, html) {
  var $ = cheerio.load(html);
  $('span balancedHeadline').each(function(i, element) {

              var result = {};

              result.title = $(this).children('a').text();
              result.link = $(this).children('a').attr('href');

              var entry = new Article (result);

              entry.save(function(err, doc) {
                if (err) {
                  console.log(err);
                } else {
                  console.log(doc);
                }
              });
  });
});
res.send("Scrape Complete");
});

app.get('/articles', function(req, res){
  Article.find({}, function(err, doc){
      if (err){
          console.log(err);
      } else {
          res.json(doc);
      }
  });
});

app.get('/articles/:id', function(req, res){
  Article.findOne({'_id': req.params.id})
  .populate('note')
  .exec(function(err, doc){
      if (err){
          console.log(err);
      } else {
          res.json(doc);
      }
  });
});


app.post('/articles/:id', function(req, res){
  var newNote = new Note(req.body);

  newNote.save(function(err, doc){
      if(err){
          console.log(err);
      } else {
          Article.findOneAndUpdate({'_id': req.params.id}, {'note':doc._id})
          .exec(function(err, doc){
              if (err){
                  console.log(err);
              } else {
                  res.send(doc);
              }
          });

      }
  });
});
// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});

