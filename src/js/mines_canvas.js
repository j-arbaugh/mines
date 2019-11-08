import {ClickType, VisibleState, Square, Grid} from './mines_game.js';

var SquareRenderer = class {
  constructor(square, canvas, ctx, x, y, sideLen) {
    this.square = square;
    this.canvas = canvas;
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.sideLen = sideLen;

    this.square.onStateChange((value) => this.drawFromValue(value));
  }

  draw() {
    this.drawFromValue(this.square.getVisibleValue());
  }

  drawFromValue(squareValue) {
    this.ctx.beginPath();
    // Use `this.sideLen - 1` to leave room for a border.
    this.ctx.rect(this.x, this.y, this.sideLen - 1, this.sideLen - 1);
    this.ctx.closePath();

    // Black border.
    this.ctx.strokeStyle = "#000000";
    this.ctx.stroke();

    // Black border.
    this.ctx.strokeStyle = "#000000";
    this.ctx.stroke();

    if (squareValue.state === VisibleState.hidden) {
      this.drawHidden();
    } else if (squareValue.state === VisibleState.flag) {
      this.drawFlag();
    } else if (squareValue.state === VisibleState.mine) {
      this.drawMine();
    } else if (squareValue.state === VisibleState.safe) {
      this.drawNumber(squareValue.adjacentMineCount);
    } else {
      console.log("Unknown square value: ", squareValue);
    }
  }

  drawHidden() {
    this.ctx.fillStyle = "#A9A9A9";
    this.ctx.fill();
  }

  drawFlag() {
    this.ctx.fillStyle = "#CCCCCC";
    this.ctx.fill();

    this.drawText("F", "#AA1111");
  }

  drawMine(background = "#EE1111") {
    this.ctx.fillStyle = background;
    this.ctx.fill();

    // Draw the mine.
    var centerX = this.x + ((this.sideLen-1) / 2);
    var centerY = this.y + ((this.sideLen-1) / 2);
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, (this.sideLen-1)/5, 0, 2*Math.PI);
    var lineDist = (this.sideLen-1) / 3;
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

  drawNumber(adjMineCount) {
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.fill();
    // Draw a number (unless it's 0; leave that blank).
    if (adjMineCount === 0) {
      return;
    }
    this.drawText(adjMineCount);
  }

  addAdjacentSquare(sq) {
    this.adj.push(sq);
    if (sq.value == SquareValue.mine) {
      this.adjacentMineCount++;
    }
  }

  drawText(text, fillStyle = "#000000") {
    this.ctx.fillStyle = fillStyle;
    var centerX = this.x + (this.sideLen / 2);
    var centerY = this.y + (this.sideLen / 2)*1.15; // Shifted down a little. Looks nicer.
    this.ctx.fillText(text, centerX, centerY);
  }

  processClick(event) {
    var becameKnown = false;
    if (event.buttons === 1) {
      // Left click.
      // Hidden -> Known
      if (this.state === SquareState.hidden) {
        this.state = SquareState.known;
        becameKnown = true;
      }
      // Anything else -> no action.
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
        })
      }
      if (this.value == SquareValue.mine) {
        this.processMineClick();
      }
    }
  }

  processMineClick() {
    this.mineClickCallback();
  }
}

// Renders the grid, and handles clicks.
var GridRenderer = class {
  constructor(grid, canvas, x, y, squareSideLen) {
    this.grid = grid;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ctx.font = '15px Times-New-Roman';
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.lineWidth = 1;
    this.x = x
    this.y = y
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

  draw() {
    // TODO: draw an outline for the grid.
    for (var r = 0; r < this.grid.numRows; r++) {
      for (var c = 0; c < this.grid.numCols; c++) {
        this.renderedSquares[r][c].draw();
      }
    }
  }

  containsPoint(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.width;
  }

  pointToSquare(x, y) {
    console.assert(this.containsPoint(x, y), "Point (%d, %d) is not inside the grid.", x, y);
    var row = Math.floor(y / this.squareSideLen);
    var col = Math.floor(x / this.squareSideLen);
    return this.squares[row][col];
  }

  processClick(event) {
    // Assuming in pixels... the easier solution is probably to not have a CSS border.
    var leftBorderWidth = parseInt(window.getComputedStyle(this.canvas)["border-left-width"]);
    var topBorderWidth = parseInt(window.getComputedStyle(this.canvas)["border-top-width"]);
    var gridX = event.pageX - this.x - this.canvas.getBoundingClientRect().left - leftBorderWidth;
    var gridY = event.pageY - this.y - this.canvas.getBoundingClientRect().top - topBorderWidth;

    var clickType = false;
    if (event.buttons === 1) {
      clickType = ClickType.left;
    } else if (event.buttons === 2) {
      clickType = ClickType.right;
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
}

var canvas = document.getElementById("minesCanvas");

var minesGrid = new Grid(10, 10);
var minesGridRenderer = new GridRenderer(minesGrid, canvas, 15, 15, 30);
minesGridRenderer.draw();

// TODO: Should be on mouse up and down. Issue: how to distinguish "left mouse button up" vs "right mouse button up"?
// On click would be okay too, but it also needs to work with right clicks (which it doesn't).
canvas.addEventListener('mousedown', (event) => {
  minesGridRenderer.processClick(event);
});

canvas.addEventListener('contextmenu', (event) => {
  event.preventDefault(); // Don't show the context menu.
});
