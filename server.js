/**
 * Important note: this application is not suitable for benchmarks!
 */

var http = require('http')
  , url = require('url')
  , fs = require('fs')
  , io = require('./')
  , sys = require('sys')
  , server;
    
server = http.createServer(function(req, res){
  // your normal server code
  var path = url.parse(req.url).pathname, content_type;
  switch (path){
    case '/':
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write('<h1><a href="/index.html">Play ping-pong</a></h1>');
      res.end();
      break;
      
    case '/ball.js':
    case '/shape.js':
    case '/jquery.js':
    case '/facebox/facebox.js':
    case '/facebox/closelabel.png':
    case '/facebox/facebox.css':
    case '/index.html':
      if(path.match(/\.js$/) != null) {
        content_type = 'text/javascript';
      } else if(path.match(/\.css$/) != null) {
        content_type = 'text/css';
      } else if(path.match(/\.png$/) != null) {
        content_type = 'image/png';
      } else {
        content_type = 'text/html';
      }

      fs.readFile(__dirname + path, function(err, data){
        if (err) return send404(res);
        res.writeHead(200, {'Content-Type': content_type})
        res.write(data, 'utf8');
        res.end();
      });
      break;
      
    default: send404(res);
  }
}),

send404 = function(res){
  res.writeHead(404);
  res.write('404');
  res.end();
};

server.listen(8080);

var io = io.listen(server)
  , buffer = []
  , first_player_connected = false
  , second_player_connected = false
  , round_started = false
  , player_id_having_the_ball = 1
  ;
  
io.on('connection', function(client){
  if(!first_player_connected) {
    first_player_connected = true;
    client.send({type: 'player_connected', player_id: 1});
    console.log('1st player connected');
  } else {
    second_player_connected = true;
    client.send({type: 'player_connected', player_id: 2, buffer: buffer }); // when second player has connected, 1st player could had moved up or down his default position, so show him right
    client.broadcast({ type: 'round_could_be_started' });
    console.log('2nd player connected');
  }

  //client.broadcast({ announcement: client.sessionId + ' connected' });
  
  client.on('message', function(message){
    //var msg = { message: [client.sessionId, message] };
    console.log(message);
    switch(message.type) {
      case 'move':
        if(!round_started) {
          buffer.push({direction: message.direction});
        }
        client.broadcast({type: 'move', player_id: message.player_id, direction: message.direction});
        break;
      case 'round_started':
        round_started = true;
        client.broadcast({type: "round_started"});
        break;
      case 'end_of_the_round':
        round_started = false;
        player_id_having_the_ball = message.player_won == 1 ? 2 : 1; // player that lost now has the ball
        client.broadcast({type: "end_of_the_round", player_won: message.player_won, player_id_having_the_ball: player_id_having_the_ball});
        break;
    }
  });

  client.on('disconnect', function(){
    client.broadcast({ announcement: client.sessionId + ' disconnected' });
  });
});
