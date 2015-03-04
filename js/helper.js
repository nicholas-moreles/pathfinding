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
  return inBounds(x, y) && !walls[x][y];
}

function isValidChild(x, y, walls, visited)
{
  return inBoundsAndNotWall(x, y, walls) && !visited[x][y];
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
  
  // early return
  if (a.x === b.x && a.y === b.y)
  {
    return path;
  }
  
  // 2d array: true if visited, false otherwise
  var visited = [];
  for (var x = 0; x < WIDTH; ++x)
  {
    var row = [];
    for (var y = 0; y < HEIGHT; ++y)
    {
      row.push(false);
    }
    visited.push(row);
  }
  
  // kick off the search
  var frontier = new goog.structs.PriorityQueue();
  frontier.enqueue(0, new Node(a.x, a.y, 0, null));
  
  var heuristic = diagAllowed ? dsHeuristic : mdHeuristic;
  
  while (!frontier.isEmpty())
  {
    var currNode = frontier.dequeue();
    
    if (currNode.x === b.x && currNode.y === b.y)
    {
      // success, return the path
      var i = 0;
      while (currNode.parent !== null)
      {
        path.push(new Position(currNode.x, currNode.y));
        currNode = currNode.parent;
      }
      return path;
    }
    
    if (!visited[currNode.x][currNode.y])
    {
      visited[currNode.x][currNode.y] = true;
      var children = currNode.getChildren(walls, visited, diagAllowed); // only gets valid, non-visited children
      
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