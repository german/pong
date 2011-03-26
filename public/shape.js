function Shape(ctx, a_current_player_id) {
  var current_player_id = a_current_player_id;
  var context = ctx; // canvas context from main loop  
  var ball;
  
  var current_y_position = CANVAS_HEIGHT / 2 - SHAPE_HEIGHT / 2;
  var shape_x_shift = (current_player_id - 1) * CANVAS_WIDTH - (current_player_id - 1) * SHAPE_WIDTH; // 1st player - at left, 2nd - at right

  this.move = function(options) {
    if(options['to_pos']) {
      current_y_position = options['to_pos'];
    } else if(options['to']) {
      if(options['to'] == 'bottom') {
        current_y_position += 5;
      } else if(options['to'] == 'top') {
        current_y_position -= 5;
      }
    }
  }

  this.can_move = function(options) {
    if(options['to_pos']) {
      if(((options['to_pos'] + SHAPE_HEIGHT) > CANVAS_HEIGHT) || (options['to_pos'] <= 0)) {
        return false;
      } else {
        return true;
      }
    } else if(options['to']) {
      if(options['to'] == 'bottom') {
        if((current_y_position + SHAPE_HEIGHT) > CANVAS_HEIGHT) {
          return false;
        } else {
          return true;
        }
      } else if(options['to'] == 'top') {
        if(current_y_position <= 0) {
          return false;
        } else {
          return true;
        }
      }
    }
  }

  this.draw = function() {    
    context.beginPath();
      ctx.fillStyle = PLAYER_COLORS[current_player_id];
      context.moveTo(shape_x_shift, current_y_position);
      context.lineTo(shape_x_shift + SHAPE_WIDTH, current_y_position);
      context.lineTo(shape_x_shift + SHAPE_WIDTH, current_y_position + SHAPE_HEIGHT);
      context.lineTo(shape_x_shift, current_y_position + SHAPE_HEIGHT);
    context.closePath();
    context.fill();

    if(!window.round_started && ball != undefined)
      ball.draw_initial();
  }

  this.set_ball = function(a_ball) {
    ball = a_ball;
  }

  this.get_y_position = function() {
    return current_y_position;
  }
}
