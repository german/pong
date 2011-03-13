var http = require('http')
  , url = require('url')
  , fs = require('fs')
  , io = require('./')
  , room_module = require('./room_module')
  , sys = require('sys')
  , server;
    
server = http.createServer(function(req, res){
  var path = url.parse(req.url).pathname, content_type;
  switch (path){
    case '/':
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write('<h1><a href="index.html">Play ping-pong</a></h1>');
      res.end();
      break;
    case '/ping':
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write('pong', 'utf8');
      res.end();
      break;
    case '/ball.js':
    case '/shape.js':
    case '/jquery.js':
    case '/facebox/facebox.js':
    case '/facebox/closelabel.png':
    case '/images/red_dot.png':
    case '/images/yellow_dot.png':
    case '/images/green_dot.png':
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

// TODO make port configurable
server.listen(8080);

var io = io.listen(server)
  , buffer = []
  , number_of_rooms = 10
  , rooms = []
  ;

for(var i = 0; i < number_of_rooms; i++) {
  rooms[i] = new room_module.Room();
}

io.on('connection', function(client){
  // if client just connected send him the list with all available rooms
  var list_of_rooms = {type: 'list_of_rooms', number_of_rooms: number_of_rooms, rooms: []}
  for(var i = 0; i < number_of_rooms; i++) {
    list_of_rooms['rooms'].push({number_of_connected_players: rooms[i].get_number_of_connected_players()})
  }
  console.log(list_of_rooms);
  client.send(list_of_rooms);

  //client.broadcast({ announcement: client.sessionId + ' connected' });
  
  client.on('message', function(message){
    //var msg = { message: [client.sessionId, message] };
    console.log(message);
    var selected_room = rooms[message.room_id];
    switch(message.type) {
      case 'connect':
        if(!selected_room.is_first_player_connected()) {
          selected_room.first_player_connect();
          client.send({type: 'player_connected', player_id: 1});
          console.log('1st player connected in room '+message.room_id);
        } else {
          selected_room.second_player_connect();
          client.send({type: 'player_connected', player_id: 2, buffer: buffer }); // when second player has connected, 1st player could had moved up or down his default position, so show him right
          client.broadcast({ type: 'round_could_be_started', room_id: message.room_id });
          console.log('2nd player connected in room '+message.room_id);
        }
        for(var i = 0; i < number_of_rooms; i++) {
          console.log('room['+i+']='+rooms[i].get_number_of_connected_players());
        }
        break;
      case 'sync':
        var info = {type: 'sync', player_id: message.player_id, position_y: message.position_y, room_id: message.room_id};
        if(message.ball_x) {
          info['ball_x'] = message.ball_x;
        }
        if(message.ball_y) {
          info['ball_y'] = message.ball_y;
        }
        if(message.previous_x) {
          info['previous_x'] = message.previous_x;
        }
        if(message.previous_y) {
          info['previous_y'] = message.previous_y;
        }
        client.broadcast(info);
        break;
      /*case 'move':
        if(!selected_room.is_round_started()) {
          buffer = {position_y: message.position_y, player_id: message.player_id};
        }
        var info = {type: 'move', player_id: message.player_id, position_y: message.position_y, room_id: message.room_id};
        if(message.ball_x) {
          info['ball_x'] = message.ball_x;
        }
        if(message.ball_y) {
          info['ball_y'] = message.ball_y;
        }
        client.broadcast(info);
        break;*/
      case 'round_started':
        selected_room.set_round_started(true);
        client.broadcast({type: "round_started", room_id: message.room_id, ball_x: message.ball_x, ball_y: message.ball_y});
        break;
      case 'end_of_the_round':
        selected_room.set_round_started(false);
        selected_room.player_id_having_the_ball = message.player_won == 1 ? 2 : 1; // player that lost now has the ball
        client.broadcast({type: "end_of_the_round", player_won: message.player_won, player_id_having_the_ball: selected_room.player_id_having_the_ball, room_id: message.room_id});
        break;
    }
  });

  client.on('disconnect', function(){
    client.broadcast({ announcement: client.sessionId + ' disconnected' });
  });
});
