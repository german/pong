let http = require('http')
  , express = require('express')
  , app = express()
  , port = 8081; // (process.env.PORT || 8081);

app.use(express.static(__dirname + '/public'));
app.listen(port);

// TODO make port configurable
// if you going to change this you also will need to change port in the connection line in ./public/pong.js
// let io = require('socket.io').listen(8080);
const server = require('http').createServer(app);
const io = require('socket.io')(server);

let buffer = [], number_of_rooms = 10, rooms = [];

for (let i = 0; i < number_of_rooms; i++) {
  rooms[i] = {count: 0, player_id_having_the_ball: 1}; //, round_started: false};
}

function get_list_of_rooms() {
  let list_of_rooms = {number_of_rooms: number_of_rooms, rooms: []};
  for (var i = 0; i < number_of_rooms; i++) {
    var player1_country = rooms[i].player1_country || {};
    var player2_country = rooms[i].player2_country || {};
    list_of_rooms['rooms'].push({number_of_connected_players: rooms[i].count, player1_country: player1_country, player2_country: player2_country })
  }
  return list_of_rooms;
}

function find_room_and_disconnect_by_session_id(id) {
  for (var i = 0; i < number_of_rooms; i++) {
    let room = rooms[i];
    if(room.count > 0) {
      if (room.player1_id == id) {
        room.player1_id = null;
        room.count -= 1;
        break;
      } else if (room.player2_id == id) {
        room.player2_id = null;
        room.count -= 1;
        break;
      }
    }
  }
}

io.on('connection', (socket) => {
  socket.emit('list_of_rooms', get_list_of_rooms());  
  
  socket.on('disconnect', () => {
    // make sure that socket's room_id variable is set, so we could keep
    // table of connected users relevant
    if(socket.room_id != null) {
      rooms[socket.room_id].count -= 1;
      find_room_and_disconnect_by_session_id(socket.id);
      socket.leave(`room#${socket.room_id}`);
    }
    io.sockets.json.emit('list_of_rooms', get_list_of_rooms());
  });
  
  socket.on('round_started', (msg) => {
    io.sockets.in(`room#${msg.room_id}`).json.emit('round_started', msg);
  });
  
  socket.on('sync', (msg) => {
    io.sockets.in(`room#${msg.room_id}`).emit('sync', msg);
  });
  
  socket.on('end_of_the_round', (msg) => {
    // player that lost now has the ball
    rooms[msg.room_id].player_id_having_the_ball = (msg.player_won == 1 ? 2 : 1);
    io.sockets.in(`room#${msg.room_id}`).json.emit("end_of_the_round", {
      player_won: msg.player_won,
      player_id_having_the_ball: rooms[msg.room_id].player_id_having_the_ball,
      room_id: msg.room_id
    });
  });
        
  socket.on('connect', (msg) => {
    socket.join(`room#${msg.room_id}`);
    socket.room_id = msg.room_id;
    find_room_and_disconnect_by_session_id(socket.id);
    rooms[msg.room_id].count += 1;
    
    if (rooms[msg.room_id].count == 1) {
      rooms[msg.room_id].player1_country = {};
      rooms[msg.room_id].player1_id = socket.id;
      rooms[msg.room_id].player1_country['code'] = msg.country_code;
      rooms[msg.room_id].player1_country['name'] = msg.country_name;
    } else {
      rooms[msg.room_id].player2_country = {};
      rooms[msg.room_id].player2_id = socket.id;
      rooms[msg.room_id].player2_country['code'] = msg.country_code;
      rooms[msg.room_id].player2_country['name'] = msg.country_name;
    }
    
    // check whether this connected user was not connected
    // to the other room on the same server
    if (rooms[msg.room_id].count == 1) {
      socket.json.emit('player_connected', {
        player_id: 1,
        room_id: msg.room_id,
        player1_country: rooms[msg.room_id].player1_country
      });
    } else if (rooms[msg.room_id].count == 2) {
      // when second player has connected, 1st player could had moved up 
      // or down his default position, so show him right cordinates in buffer variable
      io.sockets.in(`room#${msg.room_id}`).json.emit('player_connected', {
        player_id: 2,
        room_id: msg.room_id,
        player1_country: rooms[msg.room_id].player1_country,
        player2_country: rooms[msg.room_id].player2_country
      });
      io.sockets.in(`room#${msg.room_id}`).json.emit('round_could_be_started', {
        room_id: socket.room_id
      });
    }
    
    io.sockets.json.emit('list_of_rooms', get_list_of_rooms());
  })
});

server.listen(8080);
