OFFSET_STR_SMALL = 2;
OFFSET_STR_LARGE = 14;
OFFSET_DIAG_SMALL = 8.5;
OFFSET_DIAG_LARGE = 7.5;
Colors = Object.freeze({HERO: "#cf5300",
                        GOAL: "green",
                        WALL: "grey",
                        CANVAS: "white"
                       });
Speed = Object.freeze({SLOW: [200, 280],
                       NORMAL: [150, 210],
                       FAST: [100, 140]
                      });
Selected = Object.freeze({DIAG: 0,
                          SLOW_SPEED: 1,
                          NORMAL_SPEED: 2,
                          FAST_SPEED: 3,
                          ADD_WALLS: 4,
                          REMOVE_WALLS: 5,
                          MOVE_HERO: 6,
                          MOVE_GOAL: 7                          
                         });
KeyCodes = Object.freeze({RESET: 13, // enter
                          TOGGLE: 32, // space
                          DIAG: 68, // D
                          SLOW_SPEED: 83, // S
                          NORMAL_SPEED: 78, // N
                          FAST_SPEED: 70, // F
                          ADD_WALLS: 65, // A
                          REMOVE_WALLS: 82, // R
                          MOVE_HERO: 72, // H
                          MOVE_GOAL: 71 // G
                         });

function Game(c)
{
  var canvas = c;
  var time;
  var walls = [];
  var path = [];
  var running = false;
  var gameNeedsReset = false;
  var diagAllowed = true;
  var gameSpeed = Speed.NORMAL;
  var hero;
  var goal;
  var ctx = canvas.getContext('2d');

  function draw()
  {
    // draw background
    ctx.fillStyle = Colors.CANVAS;
    ctx.fillRect(0, 0, WIDTH * CELL_SIZE, HEIGHT * CELL_SIZE);
    
    // draw walls
    ctx.fillStyle = Colors.WALL;
    for (var x = 0; x < WIDTH; ++x)
    {
      for (var y = 0; y < HEIGHT; ++y)
      {
        if (walls[x][y])
        {
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
    }
    
    // draw goal
    ctx.fillStyle = Colors.GOAL;
    ctx.fillRect(goal.x * CELL_SIZE, goal.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    
    // draw hero
    ctx.fillStyle = Colors.HERO;
    if (path.length > 0)
    {
      var dirX = path[path.length-1].x - hero.x;
      var dirY = path[path.length-1].y - hero.y;
      
      ctx.beginPath();
      if (dirX > 0)
      {
        if (dirY > 0)
        {
          // down-right
          ctx.moveTo(hero.drawX + OFFSET_DIAG_SMALL, hero.drawY);
          ctx.lineTo(hero.drawX, hero.drawY + OFFSET_DIAG_SMALL);
          ctx.lineTo(hero.drawX + CELL_SIZE, hero.drawY + CELL_SIZE);
        }
        else if (dirY < 0)
        {
          // up-right
          ctx.moveTo(hero.drawX, hero.drawY + OFFSET_DIAG_LARGE);
          ctx.lineTo(hero.drawX + CELL_SIZE, hero.drawY);
          ctx.lineTo(hero.drawX + OFFSET_DIAG_SMALL, hero.drawY + CELL_SIZE);
        }
        else
        {
          // right
          ctx.moveTo(hero.drawX, hero.drawY + OFFSET_STR_SMALL);
          ctx.lineTo(hero.drawX, hero.drawY + OFFSET_STR_LARGE);
          ctx.lineTo(hero.drawX + CELL_SIZE, hero.drawY + CELL_SIZE/2);
        }
      }
      else if (dirX <0)
      {
        if (dirY > 0)
        {
          // down-left
          ctx.moveTo(hero.drawX + OFFSET_DIAG_LARGE, hero.drawY);
          ctx.lineTo(hero.drawX, hero.drawY + CELL_SIZE);
          ctx.lineTo(hero.drawX + CELL_SIZE, hero.drawY + OFFSET_DIAG_SMALL);
        }
        else if (dirY < 0)
        {
          // up-left
          ctx.moveTo(hero.drawX, hero.drawY);
          ctx.lineTo(hero.drawX + CELL_SIZE, hero.drawY + OFFSET_DIAG_LARGE);
          ctx.lineTo(hero.drawX + OFFSET_DIAG_LARGE, hero.drawY + CELL_SIZE);
        }
        else
        {
          // left
          ctx.moveTo(hero.drawX + CELL_SIZE, hero.drawY + OFFSET_STR_SMALL);
          ctx.lineTo(hero.drawX + CELL_SIZE, hero.drawY + OFFSET_STR_LARGE);
          ctx.lineTo(hero.drawX, hero.drawY + CELL_SIZE/2);
        }
      }
      else
      {
        if (dirY > 0)
        {
          // down
          ctx.moveTo(hero.drawX + OFFSET_STR_SMALL, hero.drawY);
          ctx.lineTo(hero.drawX + OFFSET_STR_LARGE, hero.drawY);
          ctx.lineTo(hero.drawX + CELL_SIZE/2, hero.drawY + CELL_SIZE);
        }
        else
        {
          // up
          ctx.moveTo(hero.drawX + OFFSET_STR_SMALL, hero.drawY + CELL_SIZE);
          ctx.lineTo(hero.drawX + OFFSET_STR_LARGE, hero.drawY + CELL_SIZE);
          ctx.lineTo(hero.drawX + CELL_SIZE/2, hero.drawY);
        }
      }
      ctx.closePath();
      ctx.fill();
    }
    else
    {
      if (gameNeedsReset)
      {
        ctx.fillRect(hero.x * CELL_SIZE, hero.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
      else
      {
        // on page load and after reset point down-right
        ctx.beginPath();
        ctx.moveTo(hero.drawX + OFFSET_DIAG_SMALL, hero.drawY);
        ctx.lineTo(hero.drawX, hero.drawY + OFFSET_DIAG_SMALL);
        ctx.lineTo(hero.drawX + CELL_SIZE, hero.drawY + CELL_SIZE);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
  
  function addWall(x, y)
  {
    if (!gameNeedsReset && x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT
          && !walls[x][y] && !(hero.x === x && hero.y === y)
          && !(goal.x === x && goal.y === y)
          && (path.length === 0 || !(path[path.length-1].x === x && path[path.length-1].y === y)))
    {
      if (isRunning())
      {
        pause();
      }
      walls[x][y] = true;
      draw();
    }
  }
  
  function removeWall(x, y)
  {
    if (!gameNeedsReset && x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT && walls[x][y])
    {
      if (isRunning())
      {
        pause();
      }
      walls[x][y] = false;
      draw();
    }
  }
  
  function moveHero(x, y)
  {
    if (!gameNeedsReset && x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT && !walls[x][y]
          && !(hero.x === x && hero.y === y) && !(goal.x === x && goal.y === y))
    {
      var wasRunning = running;
      if (wasRunning)
      {
        pause();
      }
      hero.x = x;
      hero.y = y;
      hero.drawX = x * CELL_SIZE;
      hero.drawY = y * CELL_SIZE;
      path = aStar(hero, goal, walls, diagAllowed);
      draw();
      if (wasRunning)
      {
        start();
      }
    }
  }
  
  function moveGoal(x, y)
  {
    if (!gameNeedsReset && x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT && !walls[x][y]
          && !(hero.x === x && hero.y === y) && !(goal.x === x && goal.y === y))
    {
      var wasRunning = running;
      if (wasRunning)
      {
        pause();
      }
      goal.x = x;
      goal.y = y;
      path = aStar(hero, goal, walls, diagAllowed);
      draw();
      if (wasRunning)
      {
        start();
      }
    }
  }
  
  
  
  function update(path) {
    if (path.length > 0)
    {
      var next = path.pop();
      hero.x = next.x;
      hero.y = next.y;
    }
    else
    {
      if (hero.x === goal.x && hero.y === goal.y)
      {
        gameOver(true);
      }
      else
      {
        gameOver(false);
      }
    }
  }
  
  function init() {    
    // create hero and goal
    hero = new Hero(0, 0);
    goal = new Position(WIDTH - 1, HEIGHT - 1);
    
    // initially, there are no walls
    for (var x = 0; x < WIDTH; ++x)
    {
      var row = [];
      for (var y = 0; y < HEIGHT; ++y)
      {
        row.push(false);
      }
      walls.push(row);
    }
    
    walls[10][10] = true;
    walls[10][9] = true;
    walls[9][10] = true;
    
    draw();
  }
  
  function start() {
    running = true;
    
    path = aStar(hero, goal, walls, diagAllowed);
    
    // turn start button into pause button
    $("#start-pause-button").removeClass("btn-success").addClass("btn-danger");
    $("#start-pause-button").html('Pause');
    
    var lastFrame = +new Date;
    var currX = hero.drawX;
    var currY = hero.drawY;
    var nextCell = path.length > 0 ? path[path.length-1] : hero;
    var nextX = nextCell.x * CELL_SIZE;
    var nextY = nextCell.y * CELL_SIZE;
    var dirX = nextCell.x - hero.x;
    var dirY = nextCell.y - hero.y;
    var timeBetweenCells = (dirX === 0 || dirY === 0) ? gameSpeed[0] : gameSpeed[1];
    
    time = setInterval(function() { // execute function below every 16ms
      var now = +new Date;
      var deltaT = now - lastFrame;
      
      if (deltaT > timeBetweenCells)
      {
        // move to next cell
        deltaT -= timeBetweenCells;
        lastFrame = now;
        update(path);
        
        currX = hero.drawX;
        currY = hero.drawY;
        if (path.length > 0)
        {
          nextCell = path[path.length-1]
          nextX = nextCell.x * CELL_SIZE;
          nextY = nextCell.y * CELL_SIZE;
          dirX = nextCell.x - hero.x;
          dirY = nextCell.y - hero.y;
          timeBetweenCells = (dirX === 0 || dirY === 0) ? gameSpeed[0] : gameSpeed[1];
        }
      }
      
      hero.drawX = currX + (deltaT / timeBetweenCells) * (nextX - currX);
      hero.drawY = currY + (deltaT / timeBetweenCells) * (nextY - currY);
      
      draw();
    }, 10); // 16 for smooth animation
  }
  
  function pause() {
    running = false;
    
    // turn pause button into start button
    $("#start-pause-button").removeClass("btn-danger").addClass("btn-success");
    $("#start-pause-button").html('Start');
    
    clearInterval(time);
  }
  
  function reset()
  {
    pause();
    gameNeedsReset = false;
    
    // return the buttons to the correct state
    $("#start-pause-button").show();
    $("#reset-button").removeClass("btn-success").removeClass("btn-danger").addClass("btn-warning");
    $("#reset-button").html('Reset');
      
    hero.x = 0;
    hero.y = 0;
    hero.drawX = 0;
    hero.drawY = 0;
    goal.x = WIDTH - 1;
    goal.y = HEIGHT - 1;
    
    // remove all walls
    for (var x = 0; x < WIDTH; ++x)
    {
      for (var y = 0; y < HEIGHT; ++y)
      {
        walls[x][y] = false;
      }
    }
    
    // remove the path
    path = [];
    
    draw();
  }
  
  function toggleDiag()
  {
    var wasRunning = running;
    if (wasRunning)
    {
      pause();
    }
    diagAllowed = !diagAllowed
    if (wasRunning)
    {
      start();
    }    
    return diagAllowed;
  }
  
  function setSpeed(choice)
  {
    switch(choice)
    {
      case Selected.SLOW_SPEED:
        gameSpeed = Speed.SLOW;
        break;
      case Selected.NORMAL_SPEED:
        gameSpeed = Speed.NORMAL;
        break;
      case Selected.FAST_SPEED:
        gameSpeed = Speed.FAST;
        break;
    }
  }
  
  function isRunning()
  {
    return running;
  }
  
  function needsReset()
  {
    return gameNeedsReset;
  }
  
  function gameOver(goalFound)
  {
    pause();
    path = [];
    gameNeedsReset = true;
    if (goalFound)
    {
      $("#start-pause-button").hide();
      $("#reset-button").removeClass("btn-warning").addClass("btn-success");
      $("#reset-button").html('Game over! The goal was found! Click to play again!');
    }
    else
    {
      $("#start-pause-button").hide();
      $("#reset-button").removeClass("btn-warning").addClass("btn-danger");
      $("#reset-button").html('Game over! No path to the goal exists! Click to play again!');
    }
  }
  
  function toggle() {
    if (running)
    {
      pause();
    }
    else
    {
      if (!gameNeedsReset)
      {
        start();
      }
    }
  }
  
  return {
    init: init,
    addWall: addWall,
    removeWall: removeWall,
    moveHero: moveHero,
    moveGoal: moveGoal,
    reset: reset,
    isRunning: isRunning,
    needsReset: needsReset,
    toggleDiag: toggleDiag,
    setSpeed: setSpeed,
    toggle: toggle
  };
}

// executed when document has loaded
$(document).ready(function() {
  var canvas = document.getElementById('game-canvas');
  WIDTH = canvas.width / CELL_SIZE;
  HEIGHT = canvas.height / CELL_SIZE;
  var canvasOffset = $('#game-canvas').offset();
  var game = Game(canvas);
  var mousedown = false;
  var gameWasRunning = false;
  var selectedLeftClickButton = Selected.ADD_WALLS;
  var keyDown = {};
  
  var prevMouse;
  
  game.init();
  
  var noWalls = []; // used to fill wall gaps
  for (var x = 0; x < WIDTH; ++x)
  {
    var row = []
    for (var y = 0; y < HEIGHT; ++y)
    {
      row.push(false);
    }
    noWalls.push(row);
  }  
  
  $('#game-canvas').mousemove(function(event)
    {
      if (mousedown && !game.needsReset()
        && (selectedLeftClickButton === Selected.ADD_WALLS
              || selectedLeftClickButton === Selected.REMOVE_WALLS))
      {
        var x = Math.floor((event.pageX - canvasOffset.left) / CELL_SIZE);
        var y = Math.floor((event.pageY - canvasOffset.top) / CELL_SIZE);
        if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT)
        {
          var currentMouse = new Position(x, y);
          if (prevMouse === null)
          {
            prevMouse = currentMouse;
          }
          var path = aStar(prevMouse, currentMouse, noWalls, false);
          
          if (selectedLeftClickButton === Selected.ADD_WALLS)
          {
            for (var i in path)
            {
              game.addWall(path[i].x, path[i].y);
            }
          }
          else if (selectedLeftClickButton === Selected.REMOVE_WALLS)
          {
            for (var i in path)
            {
              game.removeWall(path[i].x, path[i].y);
            }
          }
          prevMouse = currentMouse;
        }
        else
        {
          // prevent some unnecessary walls from being added
          // does not catch all, needs to be revisited
          prevMouse = null;
        }
      }
    });
    
  $('#game-canvas').mousedown(function(event)
    {
      mousedown = true;
      
      // get the x and y coordinates of the mousedown
      var x = Math.floor((event.pageX - canvasOffset.left) / CELL_SIZE);
      var y = Math.floor((event.pageY - canvasOffset.top) / CELL_SIZE);
      prevMouse = new Position(x, y);
      
      switch(selectedLeftClickButton)
      {
        case Selected.ADD_WALLS:
          gameWasRunning = game.isRunning();
          game.addWall(x, y);
          break;
        case Selected.REMOVE_WALLS:
          gameWasRunning = game.isRunning();
          game.removeWall(x, y);
          break;
        case Selected.MOVE_HERO:
          game.moveHero(x, y);
          break;
        case Selected.MOVE_GOAL:
          game.moveGoal(x, y);
          break;
      }
    });
    
  $(window).mouseup(function(event)
    {
      mousedown = false;
      if (gameWasRunning && !game.isRunning())
      {
        game.toggle();
        gameWasRunning = false;
      }
    });
  
  $("#start-pause-button").on("click", function(event)
  {
    game.toggle();
  });
  
  $("#reset-button").on("click", function(event)
  {
    game.reset();
  });
  
  function select(choice)
  {
    if (!game.needsReset())
    {
      switch(choice)
      {
        case Selected.DIAG:
          selectDiag();
          break;
        case Selected.SLOW_SPEED:
        case Selected.NORMAL_SPEED:
        case Selected.FAST_SPEED:
          selectSpeed(choice);
          break;
        case Selected.ADD_WALLS:
        case Selected.REMOVE_WALLS:
        case Selected.MOVE_HERO:
        case Selected.MOVE_GOAL:
          selectLeftClickButton(choice);
          break;
      }
    }
  }
  
  function selectDiag()
  {
    $("#diag-moves-button").removeClass("btn-info");
    if (game.toggleDiag())
    {
      $("#diag-moves-button").addClass("btn-info");
    }
  }
  
  function selectSpeed(choice)
  {
    $("#slow-speed-button").removeClass("btn-info");
    $("#normal-speed-button").removeClass("btn-info");
    $("#fast-speed-button").removeClass("btn-info");
    switch(choice)
    {
      case Selected.SLOW_SPEED:
        $("#slow-speed-button").addClass("btn-info");
        break;
      case Selected.NORMAL_SPEED:
        $("#normal-speed-button").addClass("btn-info");
        break;
      case Selected.FAST_SPEED:
        $("#fast-speed-button").addClass("btn-info");
        break;
    }
    
    game.setSpeed(choice);
  }
  
  function selectLeftClickButton(choice)
  {
    $("#add-walls-button").removeClass("btn-info");
    $("#remove-walls-button").removeClass("btn-info");
    $("#move-hero-button").removeClass("btn-info");
    $("#move-goal-button").removeClass("btn-info");
    selectedLeftClickButton  = choice;
    switch(choice)
    {
      case Selected.ADD_WALLS:
        $("#add-walls-button").addClass("btn-info");
        break;
      case Selected.REMOVE_WALLS:
        $("#remove-walls-button").addClass("btn-info");   
        break;
      case Selected.MOVE_HERO:
        $("#move-hero-button").addClass("btn-info");
        break;
      case Selected.MOVE_GOAL:
        $("#move-goal-button").addClass("btn-info");
        break;
    }
  }
  
  $("#slow-speed-button").on("click", function(event)
  {
    select(Selected.SLOW_SPEED);
  });
  
  $("#normal-speed-button").on("click", function(event)
  {
    select(Selected.NORMAL_SPEED);
  });
  
  $("#fast-speed-button").on("click", function(event)
  {
    select(Selected.FAST_SPEED);
  });
  
  $("#diag-moves-button").on("click", function(event)
  {
    select(Selected.DIAG);
  });
  
  $("#add-walls-button").on("click", function(event)
  {
    select(Selected.ADD_WALLS);
  });
  
  $("#remove-walls-button").on("click", function(event)
  {
    select(Selected.REMOVE_WALLS);
  });
  
  $("#move-hero-button").on("click", function(event)
  {
    select(Selected.MOVE_HERO);
  });
  
  $("#move-goal-button").on("click", function(event)
  {
    select(Selected.MOVE_GOAL);
  });
  
  // keyboard shortcuts
  $(document).keydown(function(event)
  {
    event.preventDefault(); // stop space and enter from clicking buttons again
    switch(event.which)
    {
      case KeyCodes.RESET:
        if (!keyDown.RESET)
        {
          keyDown.RESET = true;
          game.reset();
        }
        break;
      case KeyCodes.TOGGLE:
        if (!keyDown.TOGGLE)
        {
          keyDown.TOGGLE = true;
          game.toggle();
        }
        break;
      case KeyCodes.DIAG:
        if (!keyDown.DIAG)
        {
          keyDown.DIAG = true;
          select(Selected.DIAG);
        }
        break;
      case KeyCodes.SLOW_SPEED:
        if (!keyDown.SLOW_SPEED)
        {
          keyDown.SLOW_SPEED = true;
          select(Selected.SLOW_SPEED);
        }
        break;
      case KeyCodes.NORMAL_SPEED:
        if (!keyDown.NORMAL_SPEED)
        {
          keyDown.NORMAL_SPEED = true;
          select(Selected.NORMAL_SPEED);
        }
        break;
      case KeyCodes.FAST_SPEED:
        if (!keyDown.FAST_SPEED)
        {
          keyDown.FAST_SPEED = true;
          select(Selected.FAST_SPEED);
        }
        break;
      case KeyCodes.ADD_WALLS:
        if (!keyDown.ADD_WALLS)
        {
          keyDown.ADD_WALLS = true;
          select(Selected.ADD_WALLS);
        }
        break;
      case KeyCodes.REMOVE_WALLS:
        if (!keyDown.REMOVE_WALLS)
        {
          keyDown.REMOVE_WALLS = true;
          select(Selected.REMOVE_WALLS);
        }
        break;
      case KeyCodes.MOVE_HERO:
        if (!keyDown.MOVE_HERO)
        {
          keyDown.MOVE_HERO = true;
          select(Selected.MOVE_HERO);
        }
        break;
      case KeyCodes.MOVE_GOAL:
        if (!keyDown.MOVE_GOAL)
        {
          keyDown.MOVE_GOAL = true;
          select(Selected.MOVE_GOAL);
        }
        break;
    }
  });
  
  $(document).keyup(function(event)
  {
    event.preventDefault(); // stop space and enter from clicking buttons again
    switch(event.which)
    {
      case KeyCodes.RESET:
        keyDown.RESET = false;
        break;
      case KeyCodes.TOGGLE:
        keyDown.TOGGLE = false;
        break;
      case KeyCodes.DIAG:
        keyDown.DIAG = false;
        break;
      case KeyCodes.SLOW_SPEED:
        keyDown.SLOW_SPEED = false;
        break;
      case KeyCodes.NORMAL_SPEED:
        keyDown.NORMAL_SPEED = false;
        break;
      case KeyCodes.FAST_SPEED:
        keyDown.FAST_SPEED = false;
        break;
      case KeyCodes.ADD_WALLS:
        keyDown.ADD_WALLS = false;
        break;
      case KeyCodes.REMOVE_WALLS:
        keyDown.REMOVE_WALLS = false;
        break;
      case KeyCodes.MOVE_HERO:
        keyDown.MOVE_HERO = false;
        break;
      case KeyCodes.MOVE_GOAL:
        keyDown.MOVE_GOAL = false;
        break;
    }
  });
});