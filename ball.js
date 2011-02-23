function Ball(context, player_id_that_has_ball, shape) {
  var ctx = context;
  var related_shape = shape; // used only before the round start

  var current_x, current_y, previous_x, previous_y;

  if(player_id_that_has_ball == 1) {
    current_x = SHAPE_WIDTH + 4; 
  } else {
    current_x = CANVAS_WIDTH - SHAPE_WIDTH - 4;    
  }

  current_y = related_shape.get_y_position() + SHAPE_HEIGHT / 2;

  previous_x = current_x;
  previous_y = current_y;

  this.redraw = function() {
    if(!window.round_started) {
      this.draw_initial();
      return;
    }

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    for(var i = 1; i < 3; i++) { 
      window.player_shapes[i].draw(); 
    }

    ctx.beginPath();
      ctx.fillStyle = PLAYER_COLORS[window.player_id_having_the_ball];
		  ctx.arc(current_x, current_y, BALL_DIAMETER, 0, Math.PI*2, false);
		ctx.fill();
  }

  this.move = function() {
    // if ball was moving in some direction then just move it further
    var dx = current_x - previous_x;
    var dy = current_y - previous_y;

    previous_y = current_y;
    previous_x = current_x;

    current_x += dx;
    current_y += dy;

    if(current_y <= 0) {
      previous_y = 0; 
      // leave current_y symmentrical
      current_y -= dy;
    } else if(current_y >= CANVAS_HEIGHT)  {
      previous_y = CANVAS_HEIGHT;
      // leave current_y symmentrical
      current_y -= dy;
    }

    if((current_x >= (CANVAS_WIDTH - SHAPE_WIDTH + 5)) && (current_y >= player_shapes[2].get_y_position()) && (current_y <= player_shapes[2].get_y_position() + SHAPE_HEIGHT)) {
      previous_x = (CANVAS_WIDTH - SHAPE_WIDTH);
      current_x = (CANVAS_WIDTH - SHAPE_WIDTH) - dx;
    } else if((current_x <= (SHAPE_WIDTH - 5)) && (current_y >= player_shapes[1].get_y_position()) && (current_y <= (player_shapes[1].get_y_position() + SHAPE_HEIGHT))) {
      previous_x = SHAPE_WIDTH;
      current_x = SHAPE_WIDTH - dx;
    }

    if(current_x > CANVAS_WIDTH || current_x < 0 ) {
      window.round_started = false;
      window.round_could_be_started = false;
      current_x > CANVAS_WIDTH ? jQuery.facebox('Player 1 won!') : jQuery.facebox('Player 2 won!');
      clearInterval(window.ball_movement_timer);
      socket.send({type: "end_of_the_round", player_won: (current_x > CANVAS_WIDTH ? 1 : 2), room_id: window.room_id});
    }

    this.redraw();
  }

  this.initial_shot = function() {
    previous_y = current_y;
    previous_x = current_x;
 
    current_y -= BALL_Y_STEP;
    current_x += BALL_X_STEP;

    this.redraw();
  }

  this.draw_initial = function(player_id) {    
    current_y = related_shape.get_y_position() + SHAPE_HEIGHT / 2;

    ctx.beginPath();
      ctx.fillStyle = PLAYER_COLORS[window.player_id_having_the_ball];
		  ctx.arc(current_x, current_y, BALL_DIAMETER, 0, Math.PI*2, false);
		ctx.fill();
  }
}
