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

function get_list_of_rooms() {
  var list_of_rooms = {type: 'list_of_rooms', number_of_rooms: number_of_rooms, rooms: []}
  for(var i = 0; i < number_of_rooms; i++) {
    list_of_rooms['rooms'].push({number_of_connected_players: rooms[i].get_number_of_connected_players(), player1_country: rooms[i].get_first_player_country(), player2_country: rooms[i].get_second_player_country()})
  }
  return list_of_rooms;
}

// number_of_rooms - global integer
// rooms - global array
function find_room_and_disconnect_by_session_id(session_id) {
  var room_id_with_disconnected_player = null;
  for(var i = 0; i < number_of_rooms; i++) {
    var room = rooms[i];
    if(!room.is_empty()) {
      if(room.disconnect(session_id)) {
        room_id_with_disconnected_player = i;
        break;
      }
    }
  }
  return room_id_with_disconnected_player;
}

io.on('connection', function(client){
  // if client just connected send him the list with all available rooms
  client.send(get_list_of_rooms());  
  client.on('message', function(message){
    var selected_room = rooms[message.room_id];
    switch(message.type) {
      case 'connect':
        // check whether this connected user was not connected to the other room on the same server
        find_room_and_disconnect_by_session_id(client.sessionId);

        if(!selected_room.is_first_player_connected()) {
          selected_room.first_player_connect(client.sessionId, message.country_code, message.country_name);
          client.send({type: 'player_connected', player_id: 1, player1_country: {code: message.country_code, name: message.country_name}});
        } else {
          selected_room.second_player_connect(client.sessionId, message.country_code, message.country_name);

          client.send({type: 'player_connected', player_id: 2, buffer: buffer, player1_country: selected_room.get_first_player_country(), player2_country: selected_room.get_second_player_country() }); // when second player has connected, 1st player could had moved up or down his default position, so show him right cordinates in buffer variable

          client.broadcast({ type: 'round_could_be_started', room_id: message.room_id, country_code: message.country_code, country_name: message.country_name});
        }
        for(var i = 0; i < number_of_rooms; i++) {
          rooms[i].debug_session_ids();
        }
        var list_of_rooms = get_list_of_rooms();
        client.send(list_of_rooms);
        client.broadcast(list_of_rooms);
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
    // TODO add a timeOut to disconnect

    // 1. find in what room the client has disconnected and update rooms var
    var room_id_with_disconnected_player = find_room_and_disconnect_by_session_id(client.sessionId);

    for(var i = 0; i < number_of_rooms; i++) {
      rooms[i].debug_session_ids();
    }

    // 2. send a message to the room if there is second user
    client.broadcast({ type: 'disconnect', room_id: room_id_with_disconnected_player });
    client.broadcast(get_list_of_rooms());
  });
});
