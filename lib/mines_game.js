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
      this.onEnterStateMap[state] = new Array();
    } // Automatically "click" adjacent tiles if this tile has no adjacent mines.
    // This will not cause an infinite loop as (left) clicks are only processed
    // for squares in the "hidden" state, and clicking changes squares out of the
    // hidden state.


    this.onEnterState(VisibleState.safe, function (sq) {
      if (sq.adjacentMineCount === 0) {
        sq.adj.forEach(function (adjSq) {
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
          state: SquareValue.mine
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
      if (this.state !== currState) {
        return false;
      }

      this.setInternalState(newState);
      return true;
    }
  }, {
    key: "setInternalState",
    value: function setInternalState(newState) {
      // Exit early (and don't call events) if the state doesn't actually change.
      if (this.state === newState) {
        return;
      }

      this.state = newState;
      this.onEnterStateMap[this.getVisibleValue().state].forEach(function (f) {
        f();
      });
      this.stateChangeFuncs.forEach(function (f) {
        f(this.getVisibleValue());
      });
    }
  }, {
    key: "processRightClick",
    value: function processRightClick() {
      tryTransition(SquareState.hidden, SquareState.flag) || tryTransition(SquareState.flag, SquareState.hidden);
    }
  }]);

  return Square;
}(); // A specific structure of Squares.


exports.Square = Square;

var Grid =
/*#__PURE__*/
function () {
  function Grid(numRows, numCols) {
    var _this = this;

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

    var gameOverCallback = function gameOverCallback(sq) {
      if (sq.getVisibleValue === SquareValue.mine) {
        _this.gameOver = true;
      }
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