(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

var _mines_game = require("./mines_game.js");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var SquareRenderer =
/*#__PURE__*/
function () {
  function SquareRenderer(square, canvas, ctx, x, y, sideLen) {
    var _this = this;

    _classCallCheck(this, SquareRenderer);

    this.square = square;
    this.canvas = canvas;
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.sideLen = sideLen;
    this.square.onStateChange(function (value) {
      return _this.drawFromValue(value);
    });
  }

  _createClass(SquareRenderer, [{
    key: "draw",
    value: function draw() {
      this.drawFromValue(this.square.getVisibleValue());
    }
  }, {
    key: "drawFromValue",
    value: function drawFromValue(squareValue) {
      this.ctx.beginPath(); // Use `this.sideLen - 1` to leave room for a border.

      this.ctx.rect(this.x, this.y, this.sideLen - 1, this.sideLen - 1);
      this.ctx.closePath(); // Black border.

      this.ctx.strokeStyle = "#000000";
      this.ctx.stroke(); // Black border.

      this.ctx.strokeStyle = "#000000";
      this.ctx.stroke();

      if (squareValue.state === _mines_game.VisibleState.hidden) {
        this.drawHidden();
      } else if (squareValue.state === _mines_game.VisibleState.flag) {
        this.drawFlag();
      } else if (squareValue.state === _mines_game.VisibleState.mine) {
        this.drawMine();
      } else if (squareValue.state === _mines_game.VisibleState.safe) {
        this.drawNumber(squareValue.adjacentMineCount);
      } else {
        console.log("Unknown square value: ", squareValue);
      }
    }
  }, {
    key: "drawHidden",
    value: function drawHidden() {
      this.ctx.fillStyle = "#A9A9A9";
      this.ctx.fill();
    }
  }, {
    key: "drawFlag",
    value: function drawFlag() {
      this.ctx.fillStyle = "#CCCCCC";
      this.ctx.fill();
      this.drawText("F", "#AA1111");
    }
  }, {
    key: "drawMine",
    value: function drawMine() {
      var background = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "#EE1111";
      this.ctx.fillStyle = background;
      this.ctx.fill(); // Draw the mine.

      var centerX = this.x + (this.sideLen - 1) / 2;
      var centerY = this.y + (this.sideLen - 1) / 2;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, (this.sideLen - 1) / 5, 0, 2 * Math.PI);
      var lineDist = (this.sideLen - 1) / 3;
      this.ctx.moveTo(centerX, centerY);
      this.ctx.lineTo(centerX + lineDist, centerY);
      this.ctx.lineTo(centerX - lineDist, centerY);
      this.ctx.lineTo(centerX, centerY);
      this.ctx.lineTo(centerX, centerY + lineDist);
      this.ctx.lineTo(centerX, centerY - lineDist);
      this.ctx.lineTo(centerX, centerY);
      this.ctx.closePath();
      this.ctx.fillStyle = "#000000";
      this.ctx.fill();
      this.ctx.strokeStyle = "#000000";
      this.ctx.stroke();
    }
  }, {
    key: "drawNumber",
    value: function drawNumber(adjMineCount) {
      this.ctx.fillStyle = "#FFFFFF";
      this.ctx.fill(); // Draw a number (unless it's 0; leave that blank).

      if (adjMineCount === 0) {
        return;
      }

      this.drawText(adjMineCount);
    }
  }, {
    key: "addAdjacentSquare",
    value: function addAdjacentSquare(sq) {
      this.adj.push(sq);

      if (sq.value == SquareValue.mine) {
        this.adjacentMineCount++;
      }
    }
  }, {
    key: "drawText",
    value: function drawText(text) {
      var fillStyle = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "#000000";
      this.ctx.fillStyle = fillStyle;
      var centerX = this.x + this.sideLen / 2;
      var centerY = this.y + this.sideLen / 2 * 1.15; // Shifted down a little. Looks nicer.

      this.ctx.fillText(text, centerX, centerY);
    }
  }, {
    key: "processClick",
    value: function processClick(event) {
      var becameKnown = false;

      if (event.buttons === 1) {
        // Left click.
        // Hidden -> Known
        if (this.state === SquareState.hidden) {
          this.state = SquareState.known;
          becameKnown = true;
        } // Anything else -> no action.

      } else if (event.buttons === 2) {
        // Right click.
        if (this.state === SquareState.hidden) {
          // Hidden -> Flag
          this.state = SquareState.flag;
        } else if (this.state === SquareState.flag) {
          // Flag -> Hidden
          this.state = SquareState.hidden;
        }
      }

      this.drawDiff();

      if (becameKnown) {
        if (this.value == SquareValue.safe && this.adjacentMineCount == 0) {
          this.adj.forEach(function (adjSq) {
            adjSq.processClick(event);
          });
        }

        if (this.value == SquareValue.mine) {
          this.processMineClick();
        }
      }
    }
  }, {
    key: "processMineClick",
    value: function processMineClick() {
      this.mineClickCallback();
    }
  }]);

  return SquareRenderer;
}(); // Renders the grid, and handles clicks.


var GridRenderer =
/*#__PURE__*/
function () {
  function GridRenderer(grid, canvas, x, y, squareSideLen) {
    _classCallCheck(this, GridRenderer);

    this.grid = grid;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ctx.font = '15px Times-New-Roman';
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.lineWidth = 1;
    this.x = x;
    this.y = y;
    this.squareSideLen = squareSideLen;
    this.width = this.grid.numCols * this.squareSideLen;
    this.height = this.grid.numRows * this.squareSideLen;
    this.renderedSquares = new Array(this.grid.numRows);
    var squareY = this.y;

    for (var r = 0; r < this.grid.numRows; r++) {
      this.renderedSquares[r] = new Array(this.grid.numCols);
      var squareX = this.x;

      for (var c = 0; c < this.grid.numCols; c++) {
        this.renderedSquares[r][c] = new SquareRenderer(this.grid.squares[r][c], this.canvas, this.ctx, squareX, squareY, this.squareSideLen);
        squareX += this.squareSideLen;
      }

      squareY += this.squareSideLen;
    }
  }

  _createClass(GridRenderer, [{
    key: "draw",
    value: function draw() {
      // TODO: draw an outline for the grid.
      for (var r = 0; r < this.grid.numRows; r++) {
        for (var c = 0; c < this.grid.numCols; c++) {
          this.renderedSquares[r][c].draw();
        }
      }
    }
  }, {
    key: "containsPoint",
    value: function containsPoint(x, y) {
      return x >= 0 && y >= 0 && x < this.width && y < this.width;
    }
  }, {
    key: "pointToSquare",
    value: function pointToSquare(x, y) {
      console.assert(this.containsPoint(x, y), "Point (%d, %d) is not inside the grid.", x, y);
      var row = Math.floor(y / this.squareSideLen);
      var col = Math.floor(x / this.squareSideLen);
      return this.squares[row][col];
    }
  }, {
    key: "processClick",
    value: function processClick(event) {
      // Assuming in pixels... the easier solution is probably to not have a CSS border.
      var leftBorderWidth = parseInt(window.getComputedStyle(this.canvas)["border-left-width"]);
      var topBorderWidth = parseInt(window.getComputedStyle(this.canvas)["border-top-width"]);
      var gridX = event.pageX - this.x - this.canvas.getBoundingClientRect().left - leftBorderWidth;
      var gridY = event.pageY - this.y - this.canvas.getBoundingClientRect().top - topBorderWidth;
      var clickType = false;

      if (event.buttons === 1) {
        clickType = _mines_game.ClickType.left;
      } else if (event.buttons === 2) {
        clickType = _mines_game.ClickType.right;
      } else {
        return;
      }

      if (!this.containsPoint(gridX, gridY)) {
        return;
      }

      var c = Math.trunc(gridX / this.squareSideLen);
      var r = Math.trunc(gridY / this.squareSideLen);
      this.grid.processClick(r, c, clickType);
    }
  }]);

  return GridRenderer;
}();

var canvas = document.getElementById("minesCanvas");
var minesGrid = new _mines_game.Grid(10, 10);
var minesGridRenderer = new GridRenderer(minesGrid, canvas, 15, 15, 30);
minesGridRenderer.draw(); // TODO: Should be on mouse up and down. Issue: how to distinguish "left mouse button up" vs "right mouse button up"?
// On click would be okay too, but it also needs to work with right clicks (which it doesn't).

canvas.addEventListener('mousedown', function (event) {
  minesGridRenderer.processClick(event);
});
canvas.addEventListener('contextmenu', function (event) {
  event.preventDefault(); // Don't show the context menu.
});

},{"./mines_game.js":2}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Grid = exports.Square = exports.ClickType = exports.SquareValue = exports.VisibleState = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

// Enums
// TODO: Reconsider these enums. Overlapping values is a little confusing.
// What the player can see (excluding the adjacent mine count when safe).
var VisibleState = {
  "hidden": 1,
  "flag": 2,
  "mine": 3,
  "safe": 4
};
exports.VisibleState = VisibleState;
Object.freeze(VisibleState); // The state of the square (which can change).

var SquareState = {
  "hidden": 1,
  "flag": 2,
  "known": 3
};
Object.freeze(SquareState); // The unchanging value of the square.

var SquareValue = {
  "mine": 1,
  "safe": 2
};
exports.SquareValue = SquareValue;
Object.freeze(SquareValue);
var ClickType = {
  "left": 1,
  "right": 2
};
exports.ClickType = ClickType;
Object.freeze(ClickType);

var Square =
/*#__PURE__*/
function () {
  function Square() {
    var _this = this;

    _classCallCheck(this, Square);

    this.internalState = SquareState.hidden; // TODO: just default to safe. Will be nicer for solvers/generators.

    if (Math.random() < 0.15) {
      this.value = SquareValue.mine;
    } else {
      this.value = SquareValue.safe;
    }

    this.adj = new Array(); // Adjacent squares.

    this.adjacentMineCount = 0;
    this.stateChangeFuncs = new Array(); // [callback(this.getVisibleValue())]
    // Map: visible state -> [callback()];

    this.onEnterStateMap = {};

    for (var state in VisibleState) {
      this.onEnterStateMap[VisibleState[state]] = new Array();
    } // Automatically "click" adjacent tiles if this tile has no adjacent mines.
    // This will not cause an infinite loop as (left) clicks are only processed
    // for squares in the "hidden" state, and clicking changes squares out of the
    // hidden state.


    this.onEnterState(VisibleState.safe, function () {
      if (_this.adjacentMineCount === 0) {
        _this.adj.forEach(function (adjSq) {
          adjSq.processLeftClick();
        });
      }
    });
  }

  _createClass(Square, [{
    key: "onEnterState",
    value: function onEnterState(state, f) {
      this.onEnterStateMap[state].push(f);
    }
  }, {
    key: "onStateChange",
    value: function onStateChange(f) {
      this.stateChangeFuncs.push(f);
    }
  }, {
    key: "setValue",
    value: function setValue(v) {
      var neighborChange = 0; // How to change the adjacent mine count for each neighbor.

      if (this.value === SquareValue.mine) {
        neighborChange--;
      }

      if (v === SquareValue.mine) {
        neighborChange++;
      }

      this.value = v;
      this.adj.forEach(function (adjSq) {
        adjSq.adjacentMineCount += neighborChange;
      });
    }
  }, {
    key: "addAdjacentSquare",
    value: function addAdjacentSquare(sq) {
      this.adj.push(sq);

      if (sq.value == SquareValue.mine) {
        this.adjacentMineCount++;
      }
    } // Returns an object describing the current state.
    // state: a value in the VisibleState enum.
    // adjacentMineCount: the adjacent mine count, set only if state === VisibleState.safe

  }, {
    key: "getVisibleValue",
    value: function getVisibleValue() {
      if (this.internalState === SquareState.hidden) {
        return {
          state: SquareState.hidden
        };
      }

      if (this.internalState === SquareState.flag) {
        return {
          state: SquareState.flag
        };
      }

      console.assert(this.internalState === SquareState.known, "Square has unknown square state: ", this.state);

      if (this.value === SquareValue.mine) {
        return {
          state: VisibleState.mine
        };
      }

      return {
        state: VisibleState.safe,
        adjacentMineCount: this.adjacentMineCount
      };
    }
  }, {
    key: "processLeftClick",
    value: function processLeftClick() {
      this.tryTransition(SquareState.hidden, SquareState.known);
    } // Transitions to state `newState` if the square is in state `currState`.
    // Returns "true" if the transition was successful. This allows chaining
    // of transitions via && and || (via short circuiting):
    // tryTransition(1, 2) || tryTransition(2, 3) => do either of the transitions but not both.

  }, {
    key: "tryTransition",
    value: function tryTransition(currState, newState) {
      if (this.internalState !== currState) {
        return false;
      }

      this.setInternalState(newState);
      return true;
    }
  }, {
    key: "setInternalState",
    value: function setInternalState(newState) {
      var _this2 = this;

      // Exit early (and don't call events) if the state doesn't actually change.
      if (this.internalState === newState) {
        return;
      }

      this.internalState = newState;
      this.onEnterStateMap[this.getVisibleValue().state].forEach(function (f) {
        f(this);
      });
      this.stateChangeFuncs.forEach(function (f) {
        f(_this2.getVisibleValue());
      });
    }
  }, {
    key: "processRightClick",
    value: function processRightClick() {
      this.tryTransition(SquareState.hidden, SquareState.flag) || this.tryTransition(SquareState.flag, SquareState.hidden);
    }
  }]);

  return Square;
}(); // A specific structure of Squares.


exports.Square = Square;

var Grid =
/*#__PURE__*/
function () {
  function Grid(numRows, numCols) {
    var _this3 = this;

    _classCallCheck(this, Grid);

    this.numRows = numRows;
    this.numCols = numCols;
    this.gameOver = false; // Initialize the grid.

    this.squares = new Array(numRows);

    for (var r = 0; r < numRows; r++) {
      this.squares[r] = new Array(numCols);

      for (var c = 0; c < numCols; c++) {
        this.squares[r][c] = new Square();
      }
    }

    var gameOverCallback = function gameOverCallback() {
      _this3.gameOver = true;
    };

    for (var r = 0; r < numRows; r++) {
      for (var c = 0; c < numCols; c++) {
        var sq = this.squares[r][c];
        sq.onEnterState(VisibleState.mine, gameOverCallback); // Let each square know about its neighbors.

        this.getAdjacentSquares(r, c).forEach(function (adjSq) {
          sq.addAdjacentSquare(adjSq);
        });
      }
    }
  }

  _createClass(Grid, [{
    key: "getAdjacentSquares",
    value: function getAdjacentSquares(r, c) {
      var result = new Array();

      for (var dr = -1; dr <= 1; dr++) {
        for (var dc = -1; dc <= 1; dc++) {
          if (this.isValid(r + dr, c + dc)) {
            result.push(this.squares[r + dr][c + dc]);
          }
        }
      }

      return result;
    }
  }, {
    key: "isValid",
    value: function isValid(r, c) {
      return r >= 0 && c >= 0 && r < this.numRows && c < this.numRows;
    }
  }, {
    key: "containsPoint",
    value: function containsPoint(x, y) {
      return x >= 0 && y >= 0 && x < this.width && y < this.width;
    }
  }, {
    key: "processClick",
    value: function processClick(r, c, clickType) {
      // Don't allow any interaction after game end.
      if (this.gameOver) {
        return;
      }

      var sq = this.squares[r][c];

      if (clickType === ClickType.left) {
        sq.processLeftClick();
      } else {
        sq.processRightClick();
      }
    }
  }]);

  return Grid;
}();

exports.Grid = Grid;

},{}]},{},[1,2]);
