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

  this.get_coordinates = function() {
    return {ball_x: current_x, ball_y: current_y, previous_x: previous_x, previous_y: previous_y};
  }

  this.set_coordinates = function(pos) {
    // we should check whether we're setting already outdated values since we could really make ball.move() do nothing
    // in ball_timer's function due dx will be == 0 and dy will be == 0 if we set current's values
    if(previous_x != pos.ball_x && previous_y != pos.ball_y) {
      current_x = pos.ball_x;
      current_y = pos.ball_y;
    }
    if(pos.previous_x && pos.previous_y) {
      previous_x = pos.previous_x;
      previous_y = pos.previous_y;
    }
  }

  this.redraw = function() {
    if(!window.round_started) {
      this.draw_initial();
      return;
    }

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
 
    // window.player_shapes[0] == null for better addressation (player1, player2)
    window.player_shapes[1].draw();
    window.player_shapes[2].draw();

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
    //console.log('ball timer - [' + current_x + ', ' + current_y + ']');
    if(current_x > CANVAS_WIDTH || current_x < 0 ) {
      var player_won = (current_x > CANVAS_WIDTH) ? 1 : 2;
      window.player_id_having_the_ball = (player_won == 1) ? 2 : 1;
      finish_round(player_won);
      socket.json.emit("end_of_the_round", {player_won: player_won, room_id: window.room_id});
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
