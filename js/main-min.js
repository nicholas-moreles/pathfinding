$(document).ready(function(){var b=document.getElementById("game-canvas");WIDTH=b.width/CELL_SIZE;HEIGHT=b.height/CELL_SIZE;var n=$("#game-canvas").offset();var l=Game(b);var a=false;var e=false;var g=Selected.ADD_WALLS;var h={};var c;for(var k=0;k<WIDTH;++k){var o=[];for(var i=0;i<HEIGHT;++i){o.push(false)}NO_WALLS.push(o)}l.init();$("#change-map").on("change",function(){l.setMap(parseInt(this.value))});$("#game-canvas").mousemove(function(s){if(a&&(g===Selected.ADD_WALLS||g===Selected.REMOVE_WALLS)){var p=Math.floor((s.pageX-n.left)/CELL_SIZE);var u=Math.floor((s.pageY-n.top)/CELL_SIZE);if(inBounds(p,u)){var q=new Position(p,u);if(c===null){c=q}var t=aStar(c,q,NO_WALLS,false);if(g===Selected.ADD_WALLS){for(var r in t){l.addWall(t[r].x,t[r].y)}}else{if(g===Selected.REMOVE_WALLS){for(var r in t){l.removeWall(t[r].x,t[r].y)}}}c=q}else{c=null}}});$("#game-canvas").mousedown(function(q){var p=Math.floor((q.pageX-n.left)/CELL_SIZE);var r=Math.floor((q.pageY-n.top)/CELL_SIZE);a=true;c=new Position(p,r);e=l.isRunning();switch(g){case Selected.ADD_WALLS:l.addWall(p,r);break;case Selected.REMOVE_WALLS:l.removeWall(p,r);break;case Selected.MOVE_HERO:l.moveHero(p,r);break;case Selected.MOVE_GOAL:l.moveGoal(p,r);break}});$(window).mouseup(function(p){a=false;if(e&&!l.isRunning()){l.toggle();e=false}});$("#start-pause-button").on("click",function(p){l.toggle()});$("#reset-button").on("click",function(p){l.reset()});function j(p){switch(p){case Selected.DIAG:f();break;case Selected.SLOW_SPEED:case Selected.NORMAL_SPEED:case Selected.FAST_SPEED:d(p);break;case Selected.ADD_WALLS:case Selected.REMOVE_WALLS:case Selected.MOVE_HERO:case Selected.MOVE_GOAL:m(p);break}}function f(){$("#diag-moves-button").removeClass("btn-info");if(l.toggleDiag()){$("#diag-moves-button").addClass("btn-info")}}function d(p){$("#slow-speed-button").removeClass("btn-info");$("#normal-speed-button").removeClass("btn-info");$("#fast-speed-button").removeClass("btn-info");switch(p){case Selected.SLOW_SPEED:$("#slow-speed-button").addClass("btn-info");break;case Selected.NORMAL_SPEED:$("#normal-speed-button").addClass("btn-info");break;case Selected.FAST_SPEED:$("#fast-speed-button").addClass("btn-info");break}l.setSpeed(p)}function m(p){$("#add-walls-button").removeClass("btn-info");$("#remove-walls-button").removeClass("btn-info");$("#move-hero-button").removeClass("btn-info");$("#move-goal-button").removeClass("btn-info");g=p;switch(p){case Selected.ADD_WALLS:$("#add-walls-button").addClass("btn-info");break;case Selected.REMOVE_WALLS:$("#remove-walls-button").addClass("btn-info");break;case Selected.MOVE_HERO:$("#move-hero-button").addClass("btn-info");break;case Selected.MOVE_GOAL:$("#move-goal-button").addClass("btn-info");break}}$("#slow-speed-button").on("click",function(p){j(Selected.SLOW_SPEED)});$("#normal-speed-button").on("click",function(p){j(Selected.NORMAL_SPEED)});$("#fast-speed-button").on("click",function(p){j(Selected.FAST_SPEED)});$("#diag-moves-button").on("click",function(p){j(Selected.DIAG)});$("#add-walls-button").on("click",function(p){j(Selected.ADD_WALLS)});$("#remove-walls-button").on("click",function(p){j(Selected.REMOVE_WALLS)});$("#move-hero-button").on("click",function(p){j(Selected.MOVE_HERO)});$("#move-goal-button").on("click",function(p){j(Selected.MOVE_GOAL)});$(document).keydown(function(p){p.preventDefault();switch(p.which){case KeyCodes.RESET:if(!h.RESET){h.RESET=true;l.reset()}break;case KeyCodes.TOGGLE:if(!h.TOGGLE){h.TOGGLE=true;l.toggle()}break;case KeyCodes.DIAG:if(!h.DIAG){h.DIAG=true;j(Selected.DIAG)}break;case KeyCodes.SLOW_SPEED:if(!h.SLOW_SPEED){h.SLOW_SPEED=true;j(Selected.SLOW_SPEED)}break;case KeyCodes.NORMAL_SPEED:if(!h.NORMAL_SPEED){h.NORMAL_SPEED=true;j(Selected.NORMAL_SPEED)}break;case KeyCodes.FAST_SPEED:if(!h.FAST_SPEED){h.FAST_SPEED=true;j(Selected.FAST_SPEED)}break;case KeyCodes.ADD_WALLS:if(!h.ADD_WALLS){h.ADD_WALLS=true;j(Selected.ADD_WALLS)}break;case KeyCodes.REMOVE_WALLS:if(!h.REMOVE_WALLS){h.REMOVE_WALLS=true;j(Selected.REMOVE_WALLS)}break;case KeyCodes.MOVE_HERO:if(!h.MOVE_HERO){h.MOVE_HERO=true;j(Selected.MOVE_HERO)}break;case KeyCodes.MOVE_GOAL:if(!h.MOVE_GOAL){h.MOVE_GOAL=true;j(Selected.MOVE_GOAL)}break}});$(document).keyup(function(p){p.preventDefault();switch(p.which){case KeyCodes.RESET:h.RESET=false;break;case KeyCodes.TOGGLE:h.TOGGLE=false;break;case KeyCodes.DIAG:h.DIAG=false;break;case KeyCodes.SLOW_SPEED:h.SLOW_SPEED=false;break;case KeyCodes.NORMAL_SPEED:h.NORMAL_SPEED=false;break;case KeyCodes.FAST_SPEED:h.FAST_SPEED=false;break;case KeyCodes.ADD_WALLS:h.ADD_WALLS=false;break;case KeyCodes.REMOVE_WALLS:h.REMOVE_WALLS=false;break;case KeyCodes.MOVE_HERO:h.MOVE_HERO=false;break;case KeyCodes.MOVE_GOAL:h.MOVE_GOAL=false;break}})});
