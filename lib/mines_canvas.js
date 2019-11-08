"use strict";

var _mines_game = require("./mines_game.js");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var SquareRenderer =
/*#__PURE__*/
function () {
  function SquareRenderer(square, canvas, ctx, x, y, sideLen) {
    _classCallCheck(this, SquareRenderer);

    this.square = square;
    this.canvas = canvas;
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.sideLen = sideLen;
    this.drawStateMap = {};
    this.drawStateMap[_mines_game.VisibleState.hidden] = this.drawHidden;
    this.drawStateMap[_mines_game.VisibleState.flag] = this.drawFlag;
    this.drawStateMap[_mines_game.VisibleState.mine] = this.drawMine;
    this.drawStateMap[_mines_game.VisibleState.known] = this.drawValue;
  }

  _createClass(SquareRenderer, [{
    key: "draw",
    value: function draw() {
      this.lastDrawnState = this.state;
      this.ctx.beginPath(); // Use `this.sideLen - 1` to leave room for a border.

      this.ctx.rect(this.x, this.y, this.sideLen - 1, this.sideLen - 1);
      this.ctx.closePath(); // Black border.

      this.ctx.strokeStyle = "#000000";
      this.ctx.stroke();
      this.drawState(square.getVisibleValue());

      if (this.state === SquareState.hidden) {
        this.drawHidden();
      } else if (this.state === SquareState.flag) {
        this.drawFlag();
      } else if (this.state === SquareState.known) {
        this.drawValue();
      } else {
        console.log("Unknown state: ", this.state);
      }
    }
  }, {
    key: "draw",
    value: function draw(squareValue) {
      this.drawState[squareValue.state](squareValue);
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
      this.ctx.fill(); // Draw the mine itself.

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
    key: "drawValue",
    value: function drawValue(squareValue) {
      this.ctx.fillStyle = "#FFFFFF";
      this.ctx.fill(); // Draw a number (unless it's 0; leave that blank).

      if (squareValue.adjacentMineCount === 0) {
        return;
      }

      this.drawText(this.adjacentMineCount);
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
    key: "drawDiff",
    value: function drawDiff() {
      if (this.state === this.lastDrawnState) {
        return;
      }

      this.draw();
      this.lastDrawnState = this.state;
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
  function GridRenderer(grid, canvas, x, y) {
    _classCallCheck(this, GridRenderer);

    // console.log("Creating grid at (%d, %d) with (nr, nc) = (%d, %d)", x, y, numRows, numCols);
    this.grid = grid;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ctx.font = '15px Times-New-Roman';
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.lineWidth = 1;
    this.squareSideLen = 20;
    this.x = x;
    this.y = y;
    this.width = grid.numCols * this.squareSideLen;
    this.height = grid.numRows * this.squareSideLen;
    var squareY = this.y;

    for (var r = 0; r < grid.numRows; r++) {
      var squareX = this.x;

      for (var c = 0; c < grid.numCols; c++) {
        var rcSquareRenderer = new SquareRenderer(this.grid.squares[r][c], this.canvas, this.ctx, squareX, squareY, this.squareSideLen);
        squareX += this.sideLen;
      }

      squareY += this.sideLen;
    }
  }

  _createClass(GridRenderer, [{
    key: "draw",
    value: function draw() {// TODO: draw an outline for the grid.
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

      c = Math.trunc(gridX / this.squareSideLen);
      r = Math.trunc(gridY / this.squareSideLen);
      this.grid.processClick(r, c, clickType);
    }
  }]);

  return GridRenderer;
}();

var canvas = document.getElementById("minesCanvas");
var minesGrid = new _mines_game.Grid(canvas, 10, 10, 15, 15);
minesGrid.draw(); // TODO: Should be on mouse up and down. Issue: how to distinguish "left mouse button up" vs "right mouse button up"?
// On click would be okay too, but it also needs to work with right clicks (which it doesn't).

canvas.addEventListener('mousedown', function (event) {
  minesGrid.processClick(event);
});
canvas.addEventListener('contextmenu', function (event) {
  event.preventDefault(); // Don't show the context menu.
});