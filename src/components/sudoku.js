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
                row.push(new Cell(i, j))
            }
            this.grid.push(row)
        }
    }

    reset() {
        for (let r = 0; r < this.grid.length; r++) {
            for (let c = 0; c < this.grid[r].length; c++) {
                this.grid[r][c].resetCandidates();
            }
        }
    }

    * elements() {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                yield [this.grid[r][c], r, c]
            }
        }
    }

    * blocks() {
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                let cells = []
                for (let i = r * 3; i < (r + 1) * 3; i++) {
                    for (let j = c * 3; j < (c + 1) * 3; j++) {
                        cells.push(this.grid[i][j])
                    }
                }
                yield cells
            }
        }
    }

    cellsAtOffsets(origin, offsets) {
        let r = origin[0]
        let c = origin[1]
        let result = []
        for (let o of offsets) {
            let one = r + o[0]
            let two = c + o[1]
            if (one >= 0 && one < 9 && two >= 0 && two < 9) {
                result.push(this.grid[one][two])
            }
        }
        return result
    }
}

class Rule {
    constructor() {
    }

    run(board) {
    }
}

class AggregateRule extends Rule {
    constructor(rules, inferences = []) {
        super()
        this.rules = rules
        this.inferences = inferences
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
        for (let i of this.inferences) {
            changed |= i.run(board)
        }
        return changed
    }
}

class AllUniqueRule extends Rule {
    constructor(cell_indexes) {
        super()
        this.cell_indexes = cell_indexes
        this.inferences = [new InsuffientCandidatesForUniqueGroup(cell_indexes)]
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
        for(let i of this.inferences) {
            let [good, badIndex] = i.valid(board)
            if (!good) {
                return [false, badIndex]
            }
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

function candidateCount(cells) {
    let candidate_count = Array(10).fill(0)
    delete candidate_count[0]
    for (let cell of cells) {
        let cs = cell.candidates
        for (let c of cs) {
            candidate_count[c] += 1
        }
    }
    return candidate_count
}

class RowUniqueRule extends AggregateRule {
    constructor() {
        let rules = []
        for (let r = 0; r < 9; r++) {
            let indexes = []
            for (let c = 0; c < 9; c++) {
                indexes.push([r, c])
            }
            rules.push(new AllUniqueRule(indexes))
        }
        super(rules)
    }
}

class ColUniqueRule extends AggregateRule {
    constructor() {
        let rules = []
        for (let c = 0; c < 9; c++) {
            let indexes = []
            for (let r = 0; r < 9; r++) {
                indexes.push([r, c])
            }
            rules.push(new AllUniqueRule(indexes))
        }
        super(rules)
    }
}

class BoxUniqueRule extends AggregateRule {
    constructor() {
        let rules = []
        for (let br = 0; br < 3; br++) {
            for (let bc = 0; bc < 3; bc++) {
                let indexes = []
                for (let r = br * 3; r < (br + 1) * 3; r++) {
                    for (let c = bc * 3; c < (bc + 1) * 3; c++) {
                        indexes.push([r, c])
                    }
                }
                rules.push(new AllUniqueRule(indexes))
            }
        }
        super(rules)
    }
}

class NonDuplicatesAtOffsets extends Rule {
    constructor(offsets) {
        super()
        this.offsets = offsets;
    }

    valid(board) {
        for (let [cell, r, c] of board.elements()) {
            if (cell.value) {
                for (let adj of board.cellsAtOffsets([r, c], this.offsets)) {
                    if (cell.value === adj.value) {
                        return [false, [r, c]]
                    }
                }
            }
        }
        return [true, undefined]
    }

    run(board) {
        var changed = false;
        for (let [cell, r, c] of board.elements()) {
            if (cell.value) {
                for (let adj of board.cellsAtOffsets([r, c], this.offsets)) {
                    if (!adj.value) {
                        changed |= adj.remove(cell.value)
                        changed |= adj.remove(cell.value)
                    }
                }
            }
        }
        return changed
    }
}

class KnightRule extends NonDuplicatesAtOffsets {
    constructor() {
        let offsets = []
        for (let l of [-1, 1]) {
            for (let b of [-2, 2]) {
                offsets.push([l, b])
                offsets.push([b, l])
            }
        }
        super(offsets)
    }
}

class KingRule extends NonDuplicatesAtOffsets {
    constructor() {
        let offsets = []
        for (let r of [-1, 0, 1]) {
            for (let c of [-1, 0, 1]) {
                if (r * c !== 0) {
                    offsets.push([r, c])
                }
            }
        }
        super(offsets)
    }
}

class NonConsecutiveRule extends Rule {
    static adjOffsets = [[-1, 0], [1, 0], [0, -1], [0, 1]]

    valid(board) {
        for (let [cell, r, c] of board.elements()) {
            if (cell.value) {
                for (let adj of board.cellsAtOffsets([r, c], NonConsecutiveRule.adjOffsets)) {
                    if (Math.abs(cell.value - adj.value) === 1) {
                        return [false, [r, c]]
                    }
                }
            }
        }
        return [true, undefined]
    }

    run(board) {
        var changed = false;
        for (let [cell, r, c] of board.elements()) {
            if (cell.value) {
                for (let adj of board.cellsAtOffsets([r, c], NonConsecutiveRule.adjOffsets)) {
                    if (!adj.value) {
                        changed |= adj.remove(cell.value + 1)
                        changed |= adj.remove(cell.value - 1)
                    }
                }
            }
        }
        return changed
    }
}

class SudokuRule extends AggregateRule {
    constructor() {
        let rules = [new BoxUniqueRule(), new RowUniqueRule, new ColUniqueRule()]
        super(rules, [new PointedPairInference()])
    }
}

class CellMustHaveNumberRule extends Rule {
    valid(board) {
        for (let [cell, r, c] of board.elements()) {
            if (!cell.value && cell.candidates.size == 0) {
                return [false, [r, c]]
            }
        }
        return [true, undefined]
    }
}

class Inference {
    run(board) { }
    valid(board) { }
}

class PointedPairInference extends Inference {
    run(board) {
        var changed = false
        for (let cells of board.blocks()) {
            let can_count = candidateCount(cells)
            for (let index = 1; index <= 9; index++) {
                if (can_count[index] <= 3 && can_count[index] > 0) {
                    changed |= this.checkForPair(board, cells, index)
                }
            }
        }
        return changed
    }

    checkForPair(board, cells, candidate) {
        var changed = false
        let rSet = new Set()
        let cSet = new Set()
        for (let cell of cells) {
            if (cell.candidates.has(candidate)) {
                rSet.add(cell.row)
                cSet.add(cell.col)
            }
        }

        if (rSet.size == 1) {
            let row = rSet.values().next().value
            let colSet = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8])
            cells.forEach(c => colSet.delete(c.col))
            for (let c of colSet) {
                changed |= board.grid[row][c].remove(candidate)
            }
        }
        if (cSet.size == 1) {
            let col = cSet.values().next().value
            let rowSet = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8])
            cells.forEach(c => rowSet.delete(c.row))
            for (let r of rowSet) {
                changed |= board.grid[r][col].remove(candidate)
            }
        }
        return changed
    }
}

class InsuffientCandidatesForUniqueGroup extends Inference {
    constructor(indexes) {
        super()
        this.indexes = indexes
    }

    valid(board) {
        let cells = this.indexes.map(index => board.grid[index[0]][index[1]])
        var openCells = cells.filter(c => !c.value)
        let canCount = candidateCount(cells)
        let uniqueCandidates = canCount.filter(count => count > 0).length
        if(uniqueCandidates < openCells.length) {
            let firstOpen = openCells[0]
            return [false, [firstOpen.row, firstOpen.col]]
        }
        return [true, undefined]
    }
}

class Cell {
    constructor(row, col) {
        this.clear()
        this.row = row
        this.col = col
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
        this.globalRules = [new CellMustHaveNumberRule(), new SudokuRule()]
        this.rule = new AggregateRule(this.globalRules)
        this.rule.run(this.board)
        this.handleClick = this.handleClick.bind(this)
        this.handleKeyPress = this.handleKeyPress.bind(this)
        this.handleGlobalRuleChange = this.handleGlobalRuleChange.bind(this)

        this.state = {
            selection: undefined,
            board: this.board,
            globalRules: []
        }
    }

    handleKeyPress(e) {
        e.preventDefault()
        if (!this.state.selection) {
            return;
        }
        let r = this.state.selection[0]
        let c = this.state.selection[1]

        if (e.key > '0' && e.key <= '9') {
            let value = parseInt(e.key, 10)
            if (this.board.grid[r][c].value) {
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

    handleGlobalRuleChange(e) {
        let target = e.currentTarget
        let value = target.value
        let cls = eval(value)
        if (target.checked) {
            this.globalRules.push(new cls())
        } else {
            this.globalRules = this.globalRules.filter(r => !(r instanceof cls))
        }
        this.rule = new AggregateRule(this.globalRules)
        this.board.reset()
        while (this.rule.run(this.board)) { }
        this.setState(prev => ({
            board: this.board
        }))
    }

    render() {
        let [valid, bad_index] = this.rule.valid(this.board)
        let rows = []
        if (this.state.selection) {
            let selectedCell = this.board.grid[this.state.selection[0]][this.state.selection[1]]
            var highlightCandidate = selectedCell.value
        }
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
                if (bad_index && bad_index[0] == r && bad_index[1] == c) {
                    props['class'] += " invalid"
                }
                if (!cell.value && cell.candidates.has(highlightCandidate)) {
                    props['class'] += " candidate-highlight"
                }

                if (cell.value) {
                    celldiv = <div {...props} onClick={this.handleClick}><span class="value">{this.board.grid[r][c].value}</span></div>
                } else {
                    var v = 1
                    let candidates = []
                    for (let v = 1; v <= 9; v++) {
                        var text = " "
                        if (cell.candidates.has(v)) {
                            text = v
                        }
                        candidates.push(<div>{text}</div>)
                    }
                    celldiv = <div {...props} onClick={this.handleClick}><div class="candidates">{candidates}</div></div>
                }
                cells.push(celldiv)
            }
            rows.push(<div class="row">{cells}</div>)
        }
        return (
            <div>
                <div class="board" onKeyDown={this.handleKeyPress} tabIndex="0">
                    {rows}
                </div>
                <h2>Global Rules</h2>
                <label>
                    <input type="checkbox" value="NonConsecutiveRule" onChange={this.handleGlobalRuleChange} />
                    Non Consecutive Adjacent cells
                </label>
                <br />
                <label>
                    <input type="checkbox" value="KingRule" onChange={this.handleGlobalRuleChange} />
                    King Move restriction
                </label>
                <br />
                <label>
                    <input type="checkbox" value="KnightRule" onChange={this.handleGlobalRuleChange} />
                    Knight Move restriction
                </label>
            </div>
        );
    }
}