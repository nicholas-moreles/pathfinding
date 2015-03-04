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
  
  // used as a dummy set of walls in filling the wall gaps
  var noWalls = [];
  for (var x = 0; x < WIDTH; ++x)
  {
    var row = [];
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
        if (inBounds(x, y))
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
      var x = Math.floor((event.pageX - canvasOffset.left) / CELL_SIZE);
      var y = Math.floor((event.pageY - canvasOffset.top) / CELL_SIZE);
      mousedown = true;
      prevMouse = new Position(x, y);
      
      gameWasRunning = game.isRunning();
      
      switch(selectedLeftClickButton)
      {
        case Selected.ADD_WALLS:
          game.addWall(x, y);
          break;
        case Selected.REMOVE_WALLS:
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