var express = require('express');
const bodyParser = require("body-parser");
var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('./'));

app.get('/:x/:y', function (req, res) {
   console.log(req.params.x, req.params.y);
   res.send('done');
});

app.post('/events', function (req, res) {
    
    console.log(req.body);

    res.send('done');
});

app.listen(5000, function () {
    console.log('listening...');
});