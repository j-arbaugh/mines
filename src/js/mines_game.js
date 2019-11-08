// Enums
// TODO: Reconsider these enums. Overlapping values is a little confusing.

// What the player can see (excluding the adjacent mine count when safe).
export const VisibleState = {"hidden":1, "flag":2, "mine":3, "safe":4};
Object.freeze(VisibleState);

// The state of the square (which can change).
const SquareState = {"hidden":1, "flag":2, "known":3};
Object.freeze(SquareState);

// The unchanging value of the square.
export const SquareValue = {"mine":1, "safe":2};
Object.freeze(SquareValue);

export const ClickType = {"left":1, "right":2};
Object.freeze(ClickType);

export class Square {
  constructor() {
    this.internalState = SquareState.hidden;
    // TODO: just default to safe. Will be nicer for solvers/generators.
    if (Math.random() < 0.15) {
      this.value = SquareValue.mine;
    } else {
      this.value = SquareValue.safe;
    }
    this.adj = new Array();  // Adjacent squares.
    this.adjacentMineCount = 0;
    this.stateChangeFuncs = new Array();  // [callback(this.getVisibleValue())]
    // Map: visible state -> [callback()];
    this.onEnterStateMap = {};
    for (var state in VisibleState) {
      this.onEnterStateMap[VisibleState[state]] = new Array();
    }

    // Automatically "click" adjacent tiles if this tile has no adjacent mines.
    // This will not cause an infinite loop as (left) clicks are only processed
    // for squares in the "hidden" state, and clicking changes squares out of the
    // hidden state.
    this.onEnterState(VisibleState.safe, () => {
      if (this.adjacentMineCount === 0) {
        this.adj.forEach(function (adjSq) {
          adjSq.processLeftClick();
        })
      }
    });
  }

  onEnterState(state, f) {
    this.onEnterStateMap[state].push(f);
  }

  onStateChange(f) {
    this.stateChangeFuncs.push(f);
  }

  setValue(v) {
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
    })
  }

  addAdjacentSquare(sq) {
    this.adj.push(sq);
    if (sq.value == SquareValue.mine) {
      this.adjacentMineCount++;
    }
  }

  // Returns an object describing the current state.
  // state: a value in the VisibleState enum.
  // adjacentMineCount: the adjacent mine count, set only if state === VisibleState.safe
  getVisibleValue() {
    if (this.internalState === SquareState.hidden) {
      return {state: SquareState.hidden};
    }
    if (this.internalState === SquareState.flag) {
      return {state: SquareState.flag};
    }
    console.assert(this.internalState === SquareState.known, "Square has unknown square state: ", this.state);
    if (this.value === SquareValue.mine) {
      return {state: VisibleState.mine};
    }
    return {state: VisibleState.safe, adjacentMineCount: this.adjacentMineCount};
  }

  processLeftClick() {
    this.tryTransition(SquareState.hidden, SquareState.known);
  }

  // Transitions to state `newState` if the square is in state `currState`.
  // Returns "true" if the transition was successful. This allows chaining
  // of transitions via && and || (via short circuiting):
  // tryTransition(1, 2) || tryTransition(2, 3) => do either of the transitions but not both.
  tryTransition(currState, newState) {
    if (this.internalState !== currState) {
      return false;
    }
    this.setInternalState(newState);
    return true;
  }

  setInternalState(newState) {
    // Exit early (and don't call events) if the state doesn't actually change.
    if (this.internalState === newState) {
      return;
    }
    this.internalState = newState;
    this.onEnterStateMap[this.getVisibleValue().state].forEach(function (f) {
      f(this);
    });
    this.stateChangeFuncs.forEach((f) => {
      f(this.getVisibleValue());
    });
  }

  processRightClick() {
    this.tryTransition(SquareState.hidden, SquareState.flag)
      || this.tryTransition(SquareState.flag, SquareState.hidden);
  }
}

// A specific structure of Squares.
export class Grid {
  constructor(numRows, numCols) {
    this.numRows = numRows;
    this.numCols = numCols;
    this.gameOver = false;

    // Initialize the grid.
    this.squares = new Array(numRows);
    for (var r = 0; r < numRows; r++) {
      this.squares[r] = new Array(numCols);
      
      for (var c = 0; c < numCols; c++) {
        this.squares[r][c] = new Square();
      }
    }

    var gameOverCallback = () => {
      this.gameOver = true;
    };

    for (var r = 0; r < numRows; r++) {
      for (var c = 0; c < numCols; c++) {
        var sq = this.squares[r][c];
        sq.onEnterState(VisibleState.mine, gameOverCallback);

        // Let each square know about its neighbors.
        this.getAdjacentSquares(r, c).forEach(adjSq => {
          sq.addAdjacentSquare(adjSq);
        });
      }
    }
  }

  getAdjacentSquares(r, c) {
    var result = new Array();
    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        if (this.isValid(r+dr, c+dc)) {
          result.push(this.squares[r+dr][c+dc]);
        }
      }
    }
    return result;
  }

  isValid(r, c) {
    return r >= 0 && c >= 0 && r < this.numRows && c < this.numRows;
  }

  containsPoint(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.width;
  }

  processClick(r, c, clickType) {
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
}
