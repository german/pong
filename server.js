var http = require('http')
  , url = require('url')
  , fs = require('fs')
  , io = require('./')
  , room_module = require('./room_module')
  , static = require('./lib/node-static')
  , sys = require('sys')
  , server;
    
var file = new(static.Server)('./public');

server = http.createServer(function(req, res){
  // all static files are served with https://github.com/cloudhead/node-static
  req.addListener('end', function () {
    file.serve(req, res);
  });
});

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
    //console.log(message);
    var selected_room = rooms[message.room_id];
    switch(message.type) {
      case 'connect':
        if(!selected_room.is_first_player_connected()) {
          selected_room.first_player_connect(client.sessionId, message.country_code, message.country_name);
          client.send({type: 'player_connected', player_id: 1, player1_country_code: message.country_code, player1_country_name: message.country_name});
        } else {
          selected_room.second_player_connect(client.sessionId, message.country_code, message.country_name);
          var player1_country = selected_room.get_first_player_country_hash();
          var player2_country = selected_room.get_second_player_country_hash();
          client.send({type: 'player_connected', player_id: 2, buffer: buffer, player1_country_code: player1_country[0], player1_country_name: player1_country[1], player2_country_code: player2_country[0], player2_country_name: player2_country[1] }); // when second player has connected, 1st player could had moved up or down his default position, so show him right cordinates in buffer variable
          client.broadcast({ type: 'round_could_be_started', room_id: message.room_id, country_code: message.country_code, country_name: message.country_name});
        }
        for(var i = 0; i < number_of_rooms; i++) {
          rooms[i].debug_session_ids();
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
    // 1. find in what room the client has disconnected and update rooms var
    var room_id_with_disconnected_player = null;
    for(var i = 0; i < number_of_rooms; i++) {
      var room = rooms[i];
      if(!room.is_empty()) {
        if(room.disconnect(client.sessionId)) {
          room_id_with_disconnected_player = i;
          break;
        }
      }
    }
    for(var i = 0; i < number_of_rooms; i++) {
      rooms[i].debug_session_ids();
    }

    // 2. send a message to the room if there is second user
    client.broadcast({ type: 'disconnect', room_id: room_id_with_disconnected_player });
  });
});
