var nextSpinningHeroDirection = Object.freeze({"0,0": [1, 1],
                                               "0,1": [-1,1],
                                               "-1,1": [-1,0],
                                               "-1,0": [-1,-1],
                                               "-1,-1": [0,-1],
                                               "0,-1": [1,-1],
                                               "1,-1": [1,0],
                                               "1,0": [1,1],
                                               "1,1": [0,1]});

function Game(c)
{
  var canvas = c;
  var time;
  var walls = [];
  var path = [];
  var running = false;
  var diagAllowed = true;
  var gameSpeed = Speed.NORMAL;
  var hero;
  var goal;
  var ctx = canvas.getContext('2d');
  var currentHeroDir = [0,0];
  var spinCount = 0;
  var resetMap = Map.RANDOM;

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
        if (walls[y][x])
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
    
    if (path.length === 0)
    {
      if (++spinCount >= 8)
      {
        spinCount = 0;
        currentHeroDir = nextSpinningHeroDirection[String(currentHeroDir)];
      }
    }
    else 
    {
      currentHeroDir = [path[path.length-1].x - hero.x, path[path.length-1].y - hero.y];
    }

    var dirX = currentHeroDir[0];
    var dirY = currentHeroDir[1];
    
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
    else if (dirX < 0)
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
  
  function addWall(x, y)
  {
    if (inBoundsAndNotWall(x, y, walls)
          && !(hero.x === x && hero.y === y)
          && !(goal.x === x && goal.y === y)
          // don't add a wall to the next cell in the path
          && (path.length === 0 || !(path[path.length-1].x === x && path[path.length-1].y === y)))
    {
      pauseIfRunning();
      walls[y][x] = true;
      draw();
    }
  }
  
  function removeWall(x, y)
  {
    if (inBounds(x, y) && walls[y][x])
    {
      pauseIfRunning();
      walls[y][x] = false;
      draw();
    }
  }
  
  function moveHero(x, y)
  {
    if (inBoundsAndNotWall(x, y, walls)
          && !(hero.x === x && hero.y === y) && !(goal.x === x && goal.y === y))
    {
      pauseIfRunning();
      hero = new Hero(x, y);
      path = aStar(hero, goal, walls, diagAllowed);
      draw();
    }
  }
  
  function moveGoal(x, y)
  {
    if (inBoundsAndNotWall(x, y, walls)
          && !(hero.x === x && hero.y === y) && !(goal.x === x && goal.y === y))
    {
      pauseIfRunning();
      goal = new Position(x, y);
      path = aStar(hero, goal, walls, diagAllowed);
      draw();
    }
  }
  
  function update(path) {
    if (path.length > 0)
    {
      var next = path.pop();
      hero.x = next.x;
      hero.y = next.y;
    }
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
    
    time = setInterval(function()
    {
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
    }, 10);
  }
  
  function pause() {
    running = false;
    
    // turn pause button into start button
    $("#start-pause-button").removeClass("btn-danger").addClass("btn-success");
    $("#start-pause-button").html('Start');
    
    clearInterval(time);
  }
  
  function init()
  {
    for (var x = 0; x < WIDTH; ++x)
    {
      var row = []
      for (var y = 0; y < HEIGHT; ++y)
      {
        row.push(false);
      }
      walls.push(row);
    }
    reset();
  }
  
  function reset()
  {
    switch (resetMap)
    {
      case Map.SPIRAL:
        loadMap(new Hero(0,0), new Position(19, 19), getMapFromFile("spiral.txt"));
        break;
      case Map.EMPTY:
        loadMap(new Hero(0, 0), new Position(WIDTH - 1, HEIGHT - 1), NO_WALLS);
        break;
      default:
        loadMap(new Hero(0,0), new Position(WIDTH - 1, HEIGHT - 1), getRandomMap());
        break;
    }
  }
  
  function setMap(mapType)
  {
    resetMap = mapType;
    reset();
  }
  
  function loadMap(newHero, newGoal, newWalls)
  {
    pauseIfRunning();
    hero = newHero;
    goal = newGoal;
    for (var x = 0; x < WIDTH; ++x)
    {
      for (var y = 0; y < HEIGHT; ++y)
      {
        walls[y][x] = newWalls[y][x];
      }
    }
    path = aStar(hero, goal, walls, diagAllowed);
    draw();
  }
  
  function toggleDiag()
  {
    var wasRunning = pauseIfRunning();
    diagAllowed = !diagAllowed
    unpauseIfWasRunning(wasRunning);
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
  
  function pauseIfRunning()
  {
    if (isRunning())
    {
      pause();
      return true;
    }
    return false;
  }
  
  function unpauseIfWasRunning(wasRunning)
  {
    if (wasRunning)
    {
      start();
    }
  }
  
  function toggle() {
    if (running)
    {
      pause();
    }
    else
    {
      start();
    }
  }
  
  return {
    init: init,
    addWall: addWall,
    removeWall: removeWall,
    moveHero: moveHero,
    moveGoal: moveGoal,
    reset: reset,
    setMap: setMap,
    isRunning: isRunning,
    toggleDiag: toggleDiag,
    setSpeed: setSpeed,
    toggle: toggle,
    loadMap: loadMap
  };
}