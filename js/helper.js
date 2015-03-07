goog.require('goog.structs.PriorityQueue');

var STR_COST = 10; // horizontal or vertical move
var DIAG_COST = 14; // diagonal move
var CELL_SIZE = 16;
var WIDTH;
var HEIGHT;
var OFFSET_STR_SMALL = 2;
var OFFSET_STR_LARGE = 14;
var OFFSET_DIAG_SMALL = 8.5;
var OFFSET_DIAG_LARGE = 7.5;
var NO_WALLS = [];
var Colors = Object.freeze({HERO: "#cf5300",
                            GOAL: "green",
                            WALL: "grey",
                            CANVAS: "white"
                           });
var Speed = Object.freeze({SLOW: [200, 280],
                           NORMAL: [150, 210],
                           FAST: [100, 140]
                          });
var Selected = Object.freeze({DIAG: 0,
                              SLOW_SPEED: 1,
                              NORMAL_SPEED: 2,
                              FAST_SPEED: 3,
                              ADD_WALLS: 4,
                              REMOVE_WALLS: 5,
                              MOVE_HERO: 6,
                              MOVE_GOAL: 7                          
                             });
var KeyCodes = Object.freeze({RESET: 13, // enter
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
var Map = Object.freeze({RANDOM: 1,
                         SPIRAL: 2,
                         EMPTY: 3
                        });

function Hero(x, y)
{
  this.x = x;
  this.y = y;
  this.drawX = x * CELL_SIZE;
  this.drawY = y * CELL_SIZE;
}

function Position(x, y)
{
  this.x = x;
  this.y = y;
}

function Node(x, y, cost, parent)
{
  this.x = x;
  this.y = y;
  this.cost = cost;
  this.parent = parent;
}

Node.prototype.getChildren = function(walls, visited, diagAllowed)
{
  var children = [];
  
  for (var xOffset = -1; xOffset <= 1; ++xOffset)
  {
    for (var yOffset = -1; yOffset <= 1; ++yOffset)
    {
      // if diagonal moves are prohibited, don't check them
      if (diagAllowed || xOffset === 0 || yOffset === 0)
      {
        var nextX = this.x + xOffset;
        var nextY = this.y + yOffset;
        
        if (isValidChild(nextX, nextY, walls, visited))
        {
          var nextMoveCost = this.cost + (xOffset === 0 || yOffset === 0 ? STR_COST : DIAG_COST);
          children.push(new Node(nextX, nextY, nextMoveCost, this));
        }
      }
    }
  }
  return children;
};

function inBounds(x, y)
{
  return x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT;
}

function inBoundsAndNotWall(x, y, walls)
{
  return inBounds(x, y) && !walls[y][x];
}

function isValidChild(x, y, walls, visited)
{
  return inBoundsAndNotWall(x, y, walls) && !visited[y][x];
}

function mdHeuristic(a, b)
{
  return (Math.abs(a.x -b.x) + Math.abs(a.y - b.y)) * STR_COST;
}

function dsHeuristic(a, b)
{
  var xDist = Math.abs(a.x - b.x);
  var yDist = Math.abs(a.y - b.y);
  return (xDist > yDist ? (DIAG_COST * yDist + STR_COST * (xDist-yDist))
                        : (DIAG_COST * xDist + STR_COST * (yDist-xDist)));
}

function aStar(a, b, walls, diagAllowed)
{
  var path = [];
  
  if (a.x === b.x && a.y === b.y)
  {
    return path;
  }
  
  // create visited 2d array
  var visited = [];
  for (var y = 0; y < HEIGHT; ++y)
  {
    var row = [];
    for (var x = 0; x < WIDTH; ++x)
    {
      row.push(false);
    }
    visited.push(row);
  }
  
  var heuristic = diagAllowed ? dsHeuristic : mdHeuristic;
  var frontier = new goog.structs.PriorityQueue();
  frontier.enqueue(0, new Node(a.x, a.y, 0, null));
  
  while (!frontier.isEmpty())
  {
    var currNode = frontier.dequeue();
    if (!visited[currNode.y][currNode.x])
    {
      visited[currNode.y][currNode.x] = true;
      
      // goal check
      if (currNode.x === b.x && currNode.y === b.y)
      {
        var i = 0;
        while (currNode.parent !== null)
        {
          path.push(new Position(currNode.x, currNode.y));
          currNode = currNode.parent;
        }
        return path;
      }
    
      // get children and enqueue
      var children = currNode.getChildren(walls, visited, diagAllowed);
      for (var i = 0; i < children.length; ++i)
      {
        var currChild = children[i];
        var currChildCostEstimate = currChild.cost + heuristic(currChild, b);
        frontier.enqueue(currChildCostEstimate, currChild);
      }
    }
  }
  return path;
}

function getMapFromFile(fileName)
{
  var map = [];
  $.ajax({
    type: "GET",
    url: "maps/" + fileName,
    async: false,
    success: function(content) {
      var lines = content.split('\n');
      for (var y = 0 ; y < lines.length ; ++y) {
        var row = [];
        for (var x = 0; x < lines[y].length; ++x)
        {
          row.push(lines[y].charAt(x) === "-");
        }
        map.push(row);
      }
    },
    error: function() {
        console.log('error');
    }
  });
  return map;
}

function getRandomMap()
{
  var walls = [];
  for (var y = 0; y < HEIGHT; ++y)
  {
    var row = [];
    for (var x = 0; x < WIDTH; ++x)
    {
      row.push(false);
    }
    walls.push(row);
  }
  recursiveDivision(0, WIDTH-1, 0, HEIGHT-1, walls);
  return walls;
}

function recursiveDivision(x0, x1, y0, y1, walls)
{
  var width = x1-x0;
  var height = y1-y0;
  if (width > 1 && height > 1)
  {
    var horizontalCut = width === height ? Math.random() < 0.5 : height > width;
    var length = horizontalCut ? width : height;
    
    var cutX = horizontalCut ? x0 : getRandomInt(x0+1, x1-1);
    var cutY = horizontalCut ? getRandomInt(y0+1, y1-1) : y0;
    var x = cutX;
    var y = cutY;
    var dx = horizontalCut ? 1 : 0;
    var dy = horizontalCut ? 0 : 1;
    
    var openX = horizontalCut ? getRandomInt(x0, x1) : x;
    var openY = horizontalCut ? y : getRandomInt(y0, y1);
    
    for (var i = 0; i <= length; ++i)
    {
      walls[y][x] = !(openX === x && openY === y);
      x += dx;
      y += dy;
    }
    
    if (horizontalCut)
    {
      recursiveDivision(x0, x1, y0, cutY-1, walls);
      recursiveDivision(x0, x1, cutY+1, y1, walls);
      if (inBounds(openX, openY-1)) { walls[openY-1][openX] = false; }
      if (inBounds(openX, openY+1)) { walls[openY+1][openX] = false; }
    }
    else
    {
      recursiveDivision(x0, cutX-1, y0, y1, walls);
      recursiveDivision(cutX+1, x1, y0, y1, walls);
      if (inBounds(openX-1, openY)) { walls[openY][openX-1] = false; }
      if (inBounds(openX+1, openY)) { walls[openY][openX+1] = false; }
    }
  }
}

function getRandomInt (min, max)
{
  return Math.floor(Math.random() * (max - min + 1)) + min;
}