// in order to make more people play the game simultaneously they should be divided into "rooms"
// for pong game the number of people in the "room" == 2

exports.Room = function() {
  var first_player_connected = false
  , second_player_connected = false
  , round_started = false /* we should maintain this*/
  , player_id_having_the_ball = 1 /* */
  , number_of_connected_players = 0
  ;

  this.is_first_player_connected = function() {
    return first_player_connected;
  }

  this.first_player_connect = function() {
    first_player_connected = true;
    number_of_connected_players++;
  }

  this.second_player_connect = function() {
    second_player_connected = true;
    number_of_connected_players++;
  }

  this.is_full = function() {
    return second_player_connected;
  }

  this.get_number_of_connected_players = function() {
    return number_of_connected_players;
  }

  this.is_round_started = function() {
    return round_started;
  }

  this.set_round_started = function(value) {
    round_started = value;
  }
}
