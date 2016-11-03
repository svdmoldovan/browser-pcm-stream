var express = require('express');
var BinaryServer = require('binaryjs').BinaryServer;
var fs = require('fs');
var wav = require('wav');

//----------- IBM Watson
var watson = require('watson-developer-cloud');

    var speech_to_text = watson.speech_to_text({
    username: 'username',
    password: 'password',
    version: 'v1',
    });

    var params = {
    content_type: 'audio/l16;rate=48000',
    continuous: true,
    interim_results: true
    };
//---------------------------

var port = 3700;
var outFile = 'demo.wav';
var app = express();

app.set('views', __dirname + '/tpl');
app.set('view engine', 'jade');
app.engine('jade', require('jade').__express);
app.use(express.static(__dirname + '/public'))

app.get('/', function(req, res){
  res.render('index');
});

app.listen(port);

console.log('server open on port ' + port);

binaryServer = BinaryServer({port: 9001});

binaryServer.on('connection', function(client) {
  console.log('new connection');

  var fileWriter = new wav.FileWriter(outFile, {
    channels: 1,
    sampleRate: 48000,
    bitDepth: 16
	});
    
	
    // Create the stream.
    var recognizeStream = speech_to_text.createRecognizeStream(params);

	client.on('stream', function(stream, meta) {
		console.log('new stream');
		
		stream.pipe(fileWriter);
	
		// Pipe in the audio.
		stream.pipe(recognizeStream);
		
		// Pipe out the transcription to a file.
		recognizeStream.pipe(fs.createWriteStream('transcription.txt'));

		// Get strings instead of buffers from 'data' events.
		recognizeStream.setEncoding('utf8');

		// Listen for events.
		recognizeStream.on('data', function(event) { onEvent('Data:', event); });
		recognizeStream.on('results', function(event) { onEvent('Results:', event); });
		recognizeStream.on('error', function(event) { onEvent('Error:', event); });
		recognizeStream.on('close-connection', function(event) { onEvent('Close:', event); });

		stream.on('end', function() {
		  fileWriter.end();
		  console.log('wrote to file ' + outFile);
		});
  });
});


// Displays events on the console.
function onEvent(name, event) {
	console.log(name, event);
};

function onErrorCallback(error){
	console.log("error " + error);
}	
