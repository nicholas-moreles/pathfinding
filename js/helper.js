goog.require('goog.structs.PriorityQueue');

var STR_COST = 10; // horizontal or vertical move
var DIAG_COST = 14; // diagonal move
var CELL_SIZE = 16;
var WIDTH;
var HEIGHT;

$(document).ready( function() {
  var canvas = document.getElementById('game-canvas');
  WIDTH = canvas.width / CELL_SIZE;
  HEIGHT = canvas.height / CELL_SIZE;
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

function isValidChild(x, y, walls, visited)
{
  return x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT && !walls[x][y] && !visited[x][y];
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