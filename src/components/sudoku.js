import { fill } from "lodash"
import React from "react"
import { PureComponent } from "react"
import "../styles/sudoku.css"

class Board {
    constructor() {
        this.grid = []
        for (let i = 0; i < 9; i++) {
            let row = []
            for (let j = 0; j < 9; j++) {
                row.push(new Cell())
            }
            this.grid.push(row)
        }
    }

    reset(){
        for (let r = 0; r < this.grid.length; r++) {
            for (let c = 0; c < this.grid[r].length; c++) {
                this.grid[r][c].resetCandidates();
            }
        }
    }

    asString() {
        let result = ""
        for (let r = 0; r < this.grid.length; r++) {
            for (let c = 0; c < this.grid[r].length; c++) {
                result += this.grid[r][c].asString()

                if (c == 2 || c == 5) {
                    result += "|"
                }
            }
            result += "\n"
            if (r == 2 || r == 5) {
                result += "-".repeat(9 + 2) + "\n"
            }
        }
        return result;
    }
}

class Rule {
    constructor() {
    }
}

class AggregateRule extends Rule {
    constructor() {
        super()
    }

    valid(board) {
        for (let r of this.rules) {
            let [good, index] = r.valid(board)
            if (!good) {
                return [good, index]
            }
        }
        return [true, undefined];
    }

    run(board) {
        var changed = false
        for (let r of this.rules) {
            changed |= r.run(board)
        }
        return changed
    }
}

class AllUniqueRule extends Rule {
    constructor(cell_indexes) {
        super()
        this.cell_indexes = cell_indexes
    }

    valid(board) {
        let check_set = new Set()
        for (let index of this.cell_indexes) {
            let v = board.grid[index[0]][index[1]].value
            if (!v) {
                continue;
            }
            if (check_set.has(v)) {
                return [false, index];
            }
            check_set.add(v)
        }
        return [true, undefined];
    }

    prune(board) {
        var changes = false
        let values = new Set([])
        for (let index of this.cell_indexes) {
            let v = board.grid[index[0]][index[1]].value
            if (!v) {
                continue;
            }
            values.add(v)
        }
        for (let index of this.cell_indexes) {
            let cell = board.grid[index[0]][index[1]]
            for (let v of values) {
                changes |= cell.remove(v)
            }
        }
        return changes
    }

    fillLastLocation(board, num) {
        for (let index of this.cell_indexes) {
            let cell = board.grid[index[0]][index[1]]
            if (cell.candidates.has(num)) {
                cell.value = num
                cell.solver_determined = true
            }
        }
    }

    lastLocation(board) {
        var changes = false
        let candidate_count = Array(10).fill(0)
        for (let index of this.cell_indexes) {
            let cs = board.grid[index[0]][index[1]].candidates
            for (let c of cs) {
                candidate_count[c] += 1
            }
        }
        for (let i = 0; i < candidate_count.length; i++) {
            if (candidate_count[i] == 1) {
                this.fillLastLocation(board, i)
                changes = true
            }
        }
        return changes
    }

    loneSingle(board) {
        var changes = false
        for (let index of this.cell_indexes) {
            let cell = board.grid[index[0]][index[1]]
            if (cell.candidates.size == 1) {
                cell.value = cell.candidates.values().next().value
                cell.solver_determined = true
                changes = true
            }
        }
    }

    run(board) {
        var changed = this.prune(board)
        changed |= this.lastLocation(board)
        changed |= this.loneSingle(board)
        return changed
    }
}

class RowUniqueRule extends AggregateRule {
    constructor() {
        super()
        this.rules = []
        for (let r = 0; r < 9; r++) {
            let indexes = []
            for (let c = 0; c < 9; c++) {
                indexes.push([r, c])
            }
            this.rules.push(new AllUniqueRule(indexes))
        }
    }
}

class ColUniqueRule extends AggregateRule {
    constructor() {
        super()
        this.rules = []
        for (let c = 0; c < 9; c++) {
            let indexes = []
            for (let r = 0; r < 9; r++) {
                indexes.push([r, c])
            }
            this.rules.push(new AllUniqueRule(indexes))
        }
    }
}

class BoxUniqueRule extends AggregateRule {
    constructor() {
        super()
        this.rules = []
        for (let br = 0; br < 3; br++) {
            for (let bc = 0; bc < 3; bc++) {
                let indexes = []
                for (let r = br * 3; r < (br + 1) * 3; r++) {
                    for (let c = bc * 3; c < (bc + 1) * 3; c++) {
                        indexes.push([r, c])
                    }
                }
                this.rules.push(new AllUniqueRule(indexes))
            }
        }
    }
}

class SudokuRule extends AggregateRule {
    constructor() {
        super()
        this.rules = [new BoxUniqueRule(), new RowUniqueRule, new ColUniqueRule()]
    }
}

class Cell {
    constructor() {
        this.clear()
    }

    remove(candidate) {
        return this.candidates.delete(candidate)
    }

    clear() {
        this._value = undefined
        this.solver_determined = false
        this.resetCandidates()
    }

    resetCandidates() {
        if (this.solver_determined) {
            this._value = undefined
            this.solver_determined = false
        }
        if (!this._value) {
            this.candidates = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9])
        }
    }

    get value() {
        return this._value
    }

    set value(v) {
        this._value = v
        this.candidates.clear()
    }

    asString() {
        return this.value || " ";
    }
}

export default class SudokuBoard extends React.Component {
    constructor(props) {
        super(props);

        this.board = new Board()
        this.rule = new SudokuRule()
        this.rule.run(this.board)
        this.handleClick = this.handleClick.bind(this)
        this.handleKeyPress = this.handleKeyPress.bind(this)

        this.state = {
            selection: undefined,
            board: this.board
        }
    }

    handleKeyPress(e) {
        if (!this.state.selection) {
            return;
        }
        let r = this.state.selection[0]
        let c = this.state.selection[1]

        if (e.key > '0' && e.key <= '9') {
            let value = parseInt(e.key, 10)
            if(this.board.grid[r][c].value) {
                this.board.reset()
            }
            this.board.grid[r][c].value = value
        } else if (e.key == " ") {
            this.board.grid[r][c].clear()
            this.board.reset()
        }
        while (this.rule.run(this.board)) { }
        this.setState(prev => ({
            board: this.board
        }))
    }

    handleClick(e) {
        e.preventDefault()
        let element = e.currentTarget
        let row = parseInt(element.getAttribute('data-r'))
        let col = parseInt(element.getAttribute('data-c'))
        this.setState(prev => ({
            selection: [row, col]
        }))
    }

    render() {
        let [valid, bad_index] = this.rule.valid(this.board)
        let rows = []
        for (let r = 0; r < this.board.grid.length; r++) {
            let cells = []
            for (let c = 0; c < this.board.grid[r].length; c++) {
                let cell = this.board.grid[r][c];
                var celldiv;
                var props = {
                    "data-r": r,
                    "data-c": c,
                    "class": "cell"
                }

                if (this.state.selection) {
                    if (this.state.selection[0] === r && this.state.selection[1] === c) {
                        props['class'] += " selected";
                    }
                }
                if (cell.solver_determined) {
                    props['class'] += " solver"
                }
                if (r == 2 || r == 5) {
                    props['class'] += " bottom-border"
                }
                if (c == 2 || c == 5) {
                    props['class'] += " right-border"
                }
                if(bad_index && bad_index[0] == r && bad_index[1] == c) {
                    props['class'] += " invalid"
                }

                if (cell.value) {
                    celldiv = <div {...props} onClick={this.handleClick}><span class="value">{this.board.grid[r][c].value}</span></div>
                } else {
                    let string = ""
                    for (let can of cell.candidates) {
                        string += can
                    }
                    celldiv = <div {...props} onClick={this.handleClick}><span class="candidates">{string}</span></div>
                }
                cells.push(celldiv)
            }
            rows.push(<div class="row">{cells}</div>)
        }
        return (
            <div class="board" onKeyDown={this.handleKeyPress} tabindex="0">
                {rows}
            </div>
        );
    }
}