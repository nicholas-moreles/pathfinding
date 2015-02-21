goog.require('goog.structs.PriorityQueue');

CELL_SIZE = 16; // must be divisible evenly by the canvas width and height
OFFSET_STR_SMALL = 2;
OFFSET_STR_LARGE = 14;
OFFSET_DIAG_SMALL = 8.5;
OFFSET_DIAG_LARGE = 7.5;
STR_COST = 10; // horizontal or vertical move
DIAG_COST = 14; // diagonal move
Colors = Object.freeze({HERO: "#cf5300",
                        GOAL: "green",
                        WALL: "grey",
                        CANVAS: "white"
                       });
Selected = Object.freeze({ADD_WALLS: 0,
                          REMOVE_WALLS: 1,
                          MOVE_HERO: 2,
                          MOVE_GOAL: 3,
                         });
KeyCodes = Object.freeze({RESET: 13, // enter
                          TOGGLE: 32, // space 
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
  var hero;
  var goal;
  
  var width = canvas.width / CELL_SIZE;
  var height = canvas.height / CELL_SIZE;
  var ctx = canvas.getContext('2d');
  
  function Hero(x, y)
  {
    this.x = x;
    this.y = y;
    this.drawX = x;
    this.drawY = y;
  }
  
  function Position(x, y)
  {
    this.x = x;
    this.y = y;
  }

  function draw()
  {
    // draw background
    ctx.fillStyle = Colors.CANVAS;
    ctx.fillRect(0, 0, width * CELL_SIZE, height * CELL_SIZE);
    
    // draw walls
    ctx.fillStyle = Colors.WALL;
    for (var x = 0; x < width; ++x)
    {
      for (var y = 0; y < height; ++y)
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
    if (!gameNeedsReset && x >= 0 && x < width && y >= 0 && y < height
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
    if (!gameNeedsReset && x >= 0 && x < width && y >= 0 && y < height && walls[x][y])
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
    if (!gameNeedsReset && x >= 0 && x < width && y >= 0 && y < height && !walls[x][y]
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
      findPath();
      draw();
      if (wasRunning)
      {
        start();
      }
    }
  }
  
  function moveGoal(x, y)
  {
    if (!gameNeedsReset && x >= 0 && x < width && y >= 0 && y < height && !walls[x][y]
          && !(hero.x === x && hero.y === y) && !(goal.x === x && goal.y === y))
    {
      var wasRunning = running;
      if (wasRunning)
      {
        pause();
      }
      goal.x = x;
      goal.y = y;
      findPath();
      draw();
      if (wasRunning)
      {
        start();
      }
    }
  }
  
  function findPath()
  {    
    function isValidChild(x, y)
    {
      return x >= 0 && x < width && y >= 0 && y < height && !walls[x][y] && !visited[x][y];
    }
    
    function mdHeuristic(x1, y1, x2, y2)
    {
      return (Math.abs(x1 - x2) + Math.abs(y1 - y2)) * STR_COST;
    }
    
    function Node(x, y, cost, parent)
    {
      this.x = x;
      this.y = y;
      this.cost = cost;
      this.parent = parent;
    }
    
    Node.prototype.getChildren = function()
    {
      var children = [];
      
      for (var xOffset = -1; xOffset <= 1; ++xOffset)
      {
        for (var yOffset = -1; yOffset <= 1; ++yOffset)
        {
          var nextX = this.x + xOffset;
          var nextY = this.y + yOffset;
          
          if (isValidChild(nextX, nextY))
          {
            var nextMoveCost = this.cost + (xOffset === 0 || yOffset === 0 ? STR_COST : DIAG_COST);
            children.push(new Node(nextX, nextY, nextMoveCost, this));
          }
        }
      }

      return children;
    };   
    
  
    // early return
    if (hero.x === goal.x && hero.y === goal.y)
    {
      path = [];
      return;
    }
    
    // 2d array: true if visited, false otherwise
    var visited = [];
    for (var x = 0; x < width; ++x)
    {
      var row = [];
      for (var y = 0; y < height; ++y)
      {
        row.push(false);
      }
      visited.push(row);
    }
    
    // kick off the search
    var frontier = new goog.structs.PriorityQueue();
    frontier.enqueue(0, new Node(hero.x, hero.y, 0, null));
    
    var count = 0;
    
    while (!frontier.isEmpty())
    {
      var currNode = frontier.dequeue();
      
      if (currNode.x === goal.x && currNode.y === goal.y)
      {
        // success, return the path
        
        var solutionPath = [];
        var i = 0;
        while (currNode.parent !== null)
        {
          solutionPath.push(new Position(currNode.x, currNode.y));
          currNode = currNode.parent;
        }
        path = solutionPath;
        return;
      }
      
      if (!visited[currNode.x][currNode.y])
      {
        visited[currNode.x][currNode.y] = true;
        var children = currNode.getChildren(); // only gets valid, non-visited children
        
        for (var i = 0; i < children.length; ++i)
        {
          var currChild = children[i];
          var currChildCostEstimate = currChild.cost + mdHeuristic(currChild.x, currChild.y, goal.x, goal.y);
          frontier.enqueue(currChildCostEstimate, currChild);
        }
      }
    }
    path = [];
    gameOver(false);
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
    // create hero
    hero = new Hero(0, 0);
    
    // create goal
    goal = new Position(width - 1, height - 1);
    
    // initially, there are no walls
    for (var x = 0; x < width; ++x)
    {
      var row = [];
      for (var y = 0; y < height; ++y)
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
    
    findPath();
    
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
    var timeBetweenCells = (dirX === 0 || dirY === 0) ? 150 : 210;
    
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
          timeBetweenCells = (dirX === 0 || dirY === 0) ? 150 : 210;
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
    goal.x = width - 1;
    goal.y = height - 1;
    
    // remove all walls
    for (var x = 0; x < width; ++x)
    {
      for (var y = 0; y < height; ++y)
      {
        walls[x][y] = false;
      }
    }
    
    // remove the path
    path = [];
    
    draw();
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
    toggle: toggle
  };
}

// executed when document has loaded
$(document).ready(function() {
  var canvas = document.getElementById('game-canvas');
  var canvasOffset = $('#game-canvas').offset();
  var game = Game(canvas);
  var mousedown = false;
  var gameWasRunning = false;
  var selectedButton = Selected.ADD_WALLS;
  var keyDown = {RESET: false,
                 TOGGLE: false,
                 ADD_WALLS: false,
                 REMOVE_WALLS: false};
  
  game.init();
  
  $('#game-canvas').mousemove(function(event)
    {
      if (mousedown && !game.needsReset())
      {
        if (selectedButton === Selected.ADD_WALLS)
        {
          var x = Math.floor((event.pageX - canvasOffset.left) / CELL_SIZE);
          var y = Math.floor((event.pageY - canvasOffset.top) / CELL_SIZE);
          game.addWall(x, y);
        }
        else if (selectedButton === Selected.REMOVE_WALLS)
        {
          var x = Math.floor((event.pageX - canvasOffset.left) / CELL_SIZE);
          var y = Math.floor((event.pageY - canvasOffset.top) / CELL_SIZE);
          game.removeWall(x, y);
        }
      }
    });
    
  $('#game-canvas').mousedown(function(event)
    {
      mousedown = true;
      
      // get the x and y coordinates of the mousedown
      var x = Math.floor((event.pageX - canvasOffset.left) / CELL_SIZE);
      var y = Math.floor((event.pageY - canvasOffset.top) / CELL_SIZE);
      
      switch(selectedButton)
      {
        case Selected.ADD_WALLS:
          gameWasRunning = game.isRunning();
          game.addWall(x, y);
          break;
        case Selected.REMOVE_WALLS:
          gameWasRunning = game.isRunning();
          game.removeWalls(x, y);
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
      /* Try to remove "btn-info" class from all selector buttons
       * before adding it back to the correct button.
       */
      $("#add-walls-button").removeClass("btn-info");
      $("#remove-walls-button").removeClass("btn-info");
      $("#move-hero-button").removeClass("btn-info");
      $("#move-goal-button").removeClass("btn-info");
      
      if (choice === Selected.ADD_WALLS)
      {
        $("#add-walls-button").addClass("btn-info");
        selectedButton = Selected.ADD_WALLS;
      }
      else if (choice === Selected.REMOVE_WALLS)
      {
        $("#remove-walls-button").addClass("btn-info");
        selectedButton = Selected.REMOVE_WALLS;
      }
      else if (choice === Selected.MOVE_HERO)
      {
        $("#move-hero-button").addClass("btn-info");
        selectedButton = Selected.MOVE_HERO;
      }
      else if (choice === Selected.MOVE_GOAL)
      {
        $("#move-goal-button").addClass("btn-info");
        selectedButton = Selected.MOVE_GOAL;
      }
    }
  }
  
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
    if (event.which === KeyCodes.RESET && !keyDown.RESET)
    {
      keyDown.RESET = true;
      game.reset();
    }
    else if (event.which === KeyCodes.TOGGLE && !keyDown.TOGGLE)
    {
      if (!game.needsReset())
      {
        keyDown.TOGGLE = true;
        game.toggle();
      }
    }
    else if (event.which === KeyCodes.ADD_WALLS && !keyDown.ADD_WALLS)
    {
      keyDown.ADD_WALLS = true;
      select(Selected.ADD_WALLS);
    }
    else if (event.which === KeyCodes.REMOVE_WALLS && !keyDown.REMOVE_WALLS)
    {
      keyDown.REMOVE_WALLS = true;
      select(Selected.REMOVE_WALLS);
    }
    else if (event.which === KeyCodes.MOVE_HERO && !keyDown.MOVE_HERO)
    {
      keyDown.MOVE_HERO = true;
      select(Selected.MOVE_HERO);
    }
    else if (event.which === KeyCodes.MOVE_GOAL && !keyDown.MOVE_GOAL)
    {
      keyDown.MOVE_GOAL = true;
      select(Selected.MOVE_GOAL);
    }
  });
  
  $(document).keyup(function(event)
  {
    if (event.which === KeyCodes.RESET)
    {
      keyDown.RESET = false;
    }
    else if (event.which === KeyCodes.TOGGLE)
    {
      keyDown.TOGGLE = false;
    }
    else if (event.which === KeyCodes.ADD_WALLS)
    {
      keyDown.ADD_WALLS = false;
    }
    else if (event.which === KeyCodes.REMOVE_WALLS)
    {
      keyDown.REMOVE_WALLS = false;
    }
    else if (event.which === KeyCodes.MOVE_HERO)
    {
      keyDown.MOVE_HERO = false;
    }
    else if (event.which === KeyCodes.MOVE_GOAL)
    {
      keyDown.MOVE_GOAL = false;
    }
  });
});