class Shape {
  constructor(ctx, a_current_player_id) {
    this.current_player_id = a_current_player_id;
    this.current_y_position = CANVAS_HEIGHT / 2 - SHAPE_HEIGHT / 2;

    // canvas context from main loop
    this.context = ctx;

    // 1st player - at left, 2nd - at right
    this.shape_x_shift = (this.current_player_id - 1) * CANVAS_WIDTH - (this.current_player_id - 1) * SHAPE_WIDTH;
  }
  
  move(options) {
    if (options['to_pos']) {
      this.current_y_position = options['to_pos'];
    } else if (options['to']) {
      if(options['to'] == 'bottom') {
        this.current_y_position += 5;
      } else if (options['to'] == 'top') {
        this.current_y_position -= 5;
      }
    }
  }

  can_move(options) {
    if (options['to_pos']) {
      if (((options['to_pos'] + SHAPE_HEIGHT) > CANVAS_HEIGHT) || (options['to_pos'] <= 0)) {
        return false;
      } else {
        return true;
      }
    } else if (options['to']) {
      if (options['to'] == 'bottom') {
        if ((this.current_y_position + SHAPE_HEIGHT) > CANVAS_HEIGHT) {
          return false;
        } else {
          return true;
        }
      } else if(options['to'] == 'top') {
        if(this.current_y_position <= 0) {
          return false;
        } else {
          return true;
        }
      }
    }
  }

  draw() {    
    this.context.beginPath();
      this.context.fillStyle = PLAYER_COLORS[this.current_player_id];
      this.context.moveTo(this.shape_x_shift, this.current_y_position);
      this.context.lineTo(this.shape_x_shift + SHAPE_WIDTH, this.current_y_position);
      this.context.lineTo(this.shape_x_shift + SHAPE_WIDTH, this.current_y_position + SHAPE_HEIGHT);
      this.context.lineTo(this.shape_x_shift, this.current_y_position + SHAPE_HEIGHT);
    this.context.closePath();
    this.context.fill();

    if (!window.round_started && this.ball != undefined)
      this.ball.draw_initial();
  }

  set_ball(a_ball) {
    this.ball = a_ball;
  }

  get_y_position() {
    return this.current_y_position;
  }
}
