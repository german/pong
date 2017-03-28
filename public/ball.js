class Ball {
  constructor(context, player_id_that_has_ball, shape) {
    this.ctx = context;
    this.related_shape = shape; // used only before the round start

    if(player_id_that_has_ball == 1) {
      this.current_x = SHAPE_WIDTH + 4; 
    } else {
      this.current_x = CANVAS_WIDTH - SHAPE_WIDTH - 4;    
    }

    this.current_y = this.related_shape.get_y_position() + SHAPE_HEIGHT / 2;

    this.previous_x = this.current_x;
    this.previous_y = this.current_y;
  }

  get_coordinates() {
    return {
      ball_x: this.current_x,
      ball_y: this.current_y,
      previous_x: this.previous_x,
      previous_y: this.previous_y
    };
  }

  set_coordinates(pos) {
    // we should check whether we're setting already outdated values since we could really make ball.move() do nothing
    // in ball_timer's function due dx will be == 0 and dy will be == 0 if we set current's values
    if(this.previous_x != pos.ball_x && this.previous_y != pos.ball_y) {
      this.current_x = pos.ball_x;
      this.current_y = pos.ball_y;
    }
    if(pos.previous_x && pos.previous_y) {
      this.previous_x = pos.previous_x;
      this.previous_y = pos.previous_y;
    }
  }

  redraw() {
    if(!window.round_started) {
      this.draw_initial();
      return;
    }

    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.ctx.beginPath();
      this.ctx.fillStyle = PLAYER_COLORS[window.player_id_having_the_ball];
		  this.ctx.arc(this.current_x, this.current_y, BALL_DIAMETER, 0, Math.PI*2, false);
		this.ctx.fill();
  }

  move() {
    // if ball was moving in some direction then just move it further
    const dx = this.current_x - this.previous_x;
    const dy = this.current_y - this.previous_y;

    this.previous_y = this.current_y;
    this.previous_x = this.current_x;

    this.current_x += dx;
    this.current_y += dy;

    if (this.current_y <= 0) {
      this.previous_y = 0; 
      // leave current_y symmentrical
      this.current_y -= dy;
    } else if (this.current_y >= CANVAS_HEIGHT)  {
      this.previous_y = CANVAS_HEIGHT;
      // leave current_y symmentrical
      this.current_y -= dy;
    }

    if ((this.current_x >= (CANVAS_WIDTH - SHAPE_WIDTH + 5)) &&
      (this.current_y >= player_shapes[2].get_y_position()) &&
      (this.current_y <= player_shapes[2].get_y_position() + SHAPE_HEIGHT)) {
      this.previous_x = (CANVAS_WIDTH - SHAPE_WIDTH);
      this.current_x = (CANVAS_WIDTH - SHAPE_WIDTH) - dx;
    } else if ((this.current_x <= (SHAPE_WIDTH - 5)) &&
      (this.current_y >= player_shapes[1].get_y_position()) &&
      (this.current_y <= (player_shapes[1].get_y_position() + SHAPE_HEIGHT))) {
      this.previous_x = SHAPE_WIDTH;
      this.current_x = SHAPE_WIDTH - dx;
    }
    //console.log('ball timer - [' + current_x + ', ' + current_y + ']');

    // if the ball goes out of the console
    if (this.current_x > CANVAS_WIDTH || this.current_x < 0 ) {
      const player_won = (this.current_x > CANVAS_WIDTH) ? 1 : 2;
      window.player_id_having_the_ball = (player_won == 1) ? 2 : 1;
      finish_round(player_won);
      socket.json.emit("end_of_the_round", {
        player_won: player_won,
        room_id: window.room_id
      });
    }

    this.redraw();
  }

  initial_shot() {
    this.previous_y = this.current_y;
    this.previous_x = this.current_x;
 
    this.current_y -= BALL_Y_STEP;
    this.current_x += BALL_X_STEP;

    this.redraw();
  }

  draw_initial(player_id) {    
    this.current_y = this.related_shape.get_y_position() + SHAPE_HEIGHT / 2;

    this.ctx.beginPath();
      this.ctx.fillStyle = PLAYER_COLORS[window.player_id_having_the_ball];
		  this.ctx.arc(this.current_x, this.current_y, BALL_DIAMETER, 0, Math.PI*2, false);
		this,ctx.fill();
  }
}
