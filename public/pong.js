$.facebox.settings.closeImage = 'facebox/closelabel.png';
$.facebox.settings.loadingImage = 'facebox/loading.gif';
var ctx    = document.getElementById('main_canvas').getContext('2d');

var TICK_INTERVAL  = 75;

var CANVAS_HEIGHT  = 500;
var CANVAS_WIDTH   = 500;

var SHAPE_WIDTH    = 20;
var SHAPE_HEIGHT   = 60;
var BALL_DIAMETER  = 3;
PLAYER_COLORS  = [null, '#D40000', '#07AF45']

var current_player_id;
window.player_shapes = [null];
var player_id_having_the_ball = 1; // this could vary once the ball went off the canvas / round ended
var BALL_X_STEP = 5, BALL_Y_STEP = 5;
var ball;

window.ball_movement_timer = null, window.shape_movement_timer = null, window.bg_timer = null;

window.round_could_be_started = false; //player 1 couldn't start if player 2 hadn't been connected
window.round_started = false; // global to know whether to draw the ball near the shape at the beginning of round
var player_1_won_rounds = 0;
var player_2_won_rounds = 0;

var redraw_all = function() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  for(var i = 1; i < 3; i++) { 
    player_shapes[i].draw(); 
  }
  ball.redraw();
}

var start_round = function() {
  round_started = true;
  clearInterval(ball_movement_timer);
  clearInterval(bg_timer);
  ball_movement_timer = setInterval(function() { ball.move.apply(ball) }, TICK_INTERVAL);  // in order to this.draw work in ball's move() function we use apply here
  ball.initial_shot();

  bg_timer = setInterval(function() {
    var info = {player_id: current_player_id, position_y: player_shapes[current_player_id].get_y_position(), room_id: window.room_id}
    if(current_player_id == player_id_having_the_ball) {
      var coords = ball.get_coordinates();
      info['ball_x'] = coords.ball_x;
      info['ball_y'] = coords.ball_y;
      info['previous_x'] = coords.previous_x;
      info['previous_y'] = coords.previous_y;
    }
    socket.json.emit('sync', info);
  }, TICK_INTERVAL);
}

var finish_round = function(player_won) {
  jQuery.facebox('Player ' + player_won + ' won!');
  setTimeout(function() { jQuery.facebox.close() }, 3000); // automatically close the alert after 3 seconds
  clearInterval(ball_movement_timer);
  clearInterval(bg_timer);
  ball_movement_timer = null;
  bg_timer = null;
  round_started = false;
  round_could_be_started = true;

  if(player_won == 1) {
    player_1_won_rounds += 1;
  } else {
    player_2_won_rounds += 1;
  }

  document.getElementById('score').innerHTML = player_1_won_rounds + ' : ' + player_2_won_rounds;
  ball = new Ball(ctx, window.player_id_having_the_ball, player_shapes[window.player_id_having_the_ball]);
  player_shapes[window.player_id_having_the_ball].set_ball(ball);
  redraw_all();
}

var point_current_player_with_arrow = function() {
  jQuery('#player1_arrow').hide();
  jQuery('#player2_arrow').hide();
  jQuery('#player' + current_player_id + '_arrow').show().animate({left: (current_player_id == 1 ? '+=100' : '-=100')}, 4000, 'easeOutBounce', function(){ jQuery('#player' + current_player_id + '_arrow').fadeOut(3000)});
}

// could be usefull if player #1 in some room reconnects to the other room which already has one player
var switch_rackets = function() {
  if(current_player_id == 1){
    current_player_id = 2;
    player_id_having_the_ball = 1;
  } else {
    current_player_id = 1;
    player_id_having_the_ball = 2;
  }
          
  player_shapes[player_id_having_the_ball].set_ball(ball);  
  redraw_all();

  point_current_player_with_arrow();

  reset_keyboard_bindings();
  set_keyboard_bindings_for(player_shapes[2]);
}

var reset_keyboard_bindings = function(){
  jQuery(window).unbind('keydown');
  jQuery(window).unbind('keyup');
  clearInterval(ball_movement_timer);
  clearInterval(bg_timer);
  ball_movement_timer = null;
  bg_timer = null;
}

var set_keyboard_bindings_for = function(shape){ 
  // using here workaround with 38,40 pseudo-ASCII codes (button-up/button-down) to move the shape
  // these buttons generate only onkeydown/onkeyup events (which occur only once) so user should
  // push the button many times in order to constantly move it (one step at a time - really SLOW)
  // the keypressed event (which could handle continiously pressed buttons) doesn't react on special buttons
  // so I'd rather just start a timer with shape.move() function on 'onkeydown' event and clear it on 'onkeyup'
  // (explanation about a mess with keypress/up/down events could be found here: http://unixpapa.com/js/key.html)

  jQuery(window).keydown(function(e) {
    if ( e.keyCode == 38 && shape_movement_timer == null) {
      shape_movement_timer = setInterval(function() {
        if(shape.can_move({to: 'top'})) {
          shape.move({to: 'top'});
          redraw_all();
        }
      }, TICK_INTERVAL);
    } else if ( e.keyCode == 40 && shape_movement_timer == null) {
      shape_movement_timer = setInterval(function() {
        if(shape.can_move({to: 'bottom'})) {
          shape.move({to: 'bottom'});
          redraw_all();
        }
      }, TICK_INTERVAL);
    } else if (e.keyCode == 32) { // if spacebar pressed - begin round
      if(current_player_id == player_id_having_the_ball && round_could_be_started) {
        start_round();
        var coords = ball.get_coordinates();
        socket.json.emit('round_started', {room_id: window.room_id, ball_x: coords.ball_x, ball_y: coords.ball_y});
      }
    }
  });

  jQuery(window).keyup(function(e) {
    if ( e.keyCode == 38 && shape_movement_timer != null) {
      clearInterval(shape_movement_timer);
      shape_movement_timer = null;
    } else if ( e.keyCode == 40 && shape_movement_timer != null) {
      clearInterval(shape_movement_timer);
      shape_movement_timer = null;
    }
  });
}

var init = function() {
  var current_player_shape = new Shape(ctx, current_player_id);
  var other_player_shape = new Shape(ctx, ((current_player_id == 1) ? 2 : 1));

  if(current_player_id == 1){
    player_shapes.push(current_player_shape);
    player_shapes.push(other_player_shape);
  } else {
    player_shapes.push(other_player_shape);
    player_shapes.push(current_player_shape);
  }

  ball = new Ball(ctx, player_id_having_the_ball, player_shapes[player_id_having_the_ball]);
  player_shapes[player_id_having_the_ball].set_ball(ball);        

  current_player_shape.draw();
  other_player_shape.draw();

  jQuery('#log').html('');
  point_current_player_with_arrow();

  set_keyboard_bindings_for(current_player_shape);
}

var socket = io.connect('http://localhost:8080');

// messages could be 6 types
// 1. - 1st/2nd player connected
// 2. - round could be started (so player 1 couldn't start if player 2 hadn't connected yet)
// 3. - round just began, synchronive initial position of the ball
// 4. - sync token with information about current player's ball and racket's position
// 5. - ball went out of the field / who loose / new round
// 6. - player in the same room has been disconnected
socket.on('list_of_rooms', function(obj){
  $('#form_for_list_of_rooms').html('');
  var img_for_room, is_room_disabled_for_select = '', flags = '';
  for(var i = 0; i < obj.number_of_rooms; i++) {
    switch(obj.rooms[i].number_of_connected_players) {
      case 0:
        img_for_room = '<img src="images/green_dot.png" width="12" height="12" alt="Available"/ >';
        is_room_disabled_for_select = '';
        flags = '';
        break;
      case 1:
        img_for_room = '<img src="images/yellow_dot.png" width="12" height="11" alt="Available"/ >';
        is_room_disabled_for_select = ''
        flags = '<img src="country_icons/' + obj.rooms[i].player1_country.code + '.png" width="16" height="11" title="' + obj.rooms[i].player1_country.name + '" alt="' + obj.rooms[i].player1_country.name + '"/ >';
        break;
      case 2:
        img_for_room = '<img src="images/red_dot.png" width="12" height="11" alt="Full"/ >';
        is_room_disabled_for_select = 'disabled';
        flags = '<img src="country_icons/' + obj.rooms[i].player1_country.code + '.png" width="16" height="11" title="' + obj.rooms[i].player1_country.name + '" alt="' + obj.rooms[i].player1_country.name + '"/ >';
        flags += ' vs <img src="country_icons/' + obj.rooms[i].player2_country.code + '.png" width="16" height="11" title="' + obj.rooms[i].player2_country.name + '" alt="' + obj.rooms[i].player2_country.name + '"/ >'
        break;
      }
    $('#form_for_list_of_rooms').append(img_for_room+'<input type="radio" name="room_id" onclick="window.room_id=parseInt(this.value)" '+is_room_disabled_for_select+' value="' + i + '"> #' + i + " [" + obj.rooms[i].number_of_connected_players + "] players " + flags + "<br/ >");
  }
  $('#form_for_list_of_rooms').append('<input type="submit" value="Connect"/ >');
});

socket.on('player_connected', function(obj){
  // if this is 1st player then draw ball near him
  // if first connect to server (current_player_id undefined) then init() all
  if(!current_player_id) {
    current_player_id = obj.player_id;
    init();
  } else if(current_player_id != obj.player_id) { // if current_player_id was already initialized and player was connected as the second player to the room => swap the rackets (if he connects to empty room there's no need to init() or switch_rackets())
    switch_rackets();
  }
  
  if(obj.player_id == 1) {
    jQuery('#player1_flag').html('<img src="country_icons/' + obj.player1_country.code + '.png" width="16" height="11" title="' + obj.player1_country.name + '" alt="' + obj.player1_country.name + '"/ >');
  } else {
    jQuery('#player1_flag').html('<img src="country_icons/' + obj.player1_country.code + '.png" width="16" height="11" title="' + obj.player1_country.name + '" alt="' + obj.player1_country.name + '"/ >');
    jQuery('#player2_flag').html('<img src="country_icons/' + obj.player2_country.code + '.png" width="16" height="11" title="' + obj.player2_country.name + '" alt="' + obj.player2_country.name + '"/ >');
  }
  // and wait till 2nd user connects to the game  
});

socket.on('sync', function(obj){
  if(obj.room_id == window.room_id && player_shapes[obj.player_id].can_move({to_pos: obj.position_y})) {
    player_shapes[obj.player_id].move({to_pos: obj.position_y});
    // ball's position is synced to player having the ball in this round
    if(obj.ball_x && obj.ball_y) {
      // second player just corrects position of his ball from player_1's one
      ball.set_coordinates(obj);
    }
    redraw_all();
  }
});

socket.on('round_could_be_started', function(obj){
  if(obj.room_id == window.room_id) {
    round_could_be_started = true;

    if(jQuery('#player1_notice_audio')[0].play && jQuery('#play_sound_when_someone_joins_the_room')[0].checked) {
      jQuery('#player1_notice_audio')[0].play();
    }

    jQuery('#player2_flag').html('<img src="country_icons/' + obj.country_code + '.png" alt="' + obj.country_name + '" width="16" height="11" alt="' + obj.country_name + '"/ >');
    jQuery.facebox('Round could be started: you could press spacebar to start!');
    setTimeout(function() { jQuery.facebox.close() }, 3000); // automatically close the alert after 3 seconds
  }
});

socket.on('round_started', function(obj){
  console.log('round started from server')
  if(obj.room_id == window.room_id) {
    ball.set_coordinates(obj);
    start_round();
  }
});

socket.on('end_of_the_round', function(obj){
  if(obj.room_id == window.room_id) {
    window.player_id_having_the_ball = obj.player_id_having_the_ball;
    if(round_started) finish_round(obj.player_won);
  }
});

var window_width = jQuery(window).width();
var player1_arrow_width = jQuery('#player1_arrow').width();
jQuery('#player1_arrow').css({left: ((window_width / 2) - player1_arrow_width - 350) + 'px'});
jQuery('#player2_arrow').css({left: ((window_width / 2) + 350) + 'px'});
