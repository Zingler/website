import { redundancy } from "./search"

export class Board {
    constructor(grid = undefined) {
        this.grid = grid
        if (!this.grid) {
            this.grid = []
            for (let i = 0; i < 9; i++) {
                let row = []
                for (let j = 0; j < 9; j++) {
                    row.push(new Cell(i, j))
                }
                this.grid.push(row)
            }
        }
    }

    copy() {
        let grid = []
        for (let i = 0; i < 9; i++) {
            let row = []
            for (let j = 0; j < 9; j++) {
                row.push(this.grid[i][j].copy())
            }
            grid.push(row)
        }
        return new Board(grid)
    }

    full() {
        for(let [cell] of this.elements()) {
            if(!cell.value) {
                return false
            }
        }
        return true
    }

    cellsWithValue() {
        var count = 0
        for (let [cell] of this.elements()) {
            if (cell.value) {
                count += 1
            }
        }
        return count
    }

    * openCells() {
        for(let [cell] of this.elements()) {
            if(!cell.value) {
                yield cell
            }
        }
    }

    applyPending() {
        for (let [cell] of this.elements()) {
            cell.applyPending()
        }
    }

    checkRedundency(rule) {
        this.clearRedundency()
        let indexes = redundancy(this, rule)
        for(let index of indexes) {
            this.grid[index[0]][index[1]].redundant = true
        }
    }

    clearRedundency() {
        for(let [cell] of this.elements()) {
            delete cell.redundant
        }
    }

    clearAnalysis() {
        for (let [cell] of this.elements()) {
            cell.clearAnalysis();
        }
    }

    runOnePlyAnalysis(rule) {
        let currentValueCount = this.cellsWithValue()
        let mvp = [-1, -1, -1, -1]
        for (let [cell, r, c] of this.elements()) {
            cell.clearAnalysis()
            if (!cell.value) {
                for (let can of cell.candidates) {
                    let tempBoard = this.copy()
                    tempBoard.grid[r][c].value = can
                    while (rule.run(tempBoard)) { tempBoard.applyPending() }
                    let [good] = rule.valid(tempBoard)
                    if (!good) {
                        cell.addFailedOnePlyAnalysis(can)
                    }
                    let newCount = tempBoard.cellsWithValue()
                    if (newCount > currentValueCount + 1) {
                        cell.addAddDigitOnePlyAnalysis(can)
                    }
                    if(newCount > mvp[0] && good) {
                        mvp = [newCount, r, c, can]
                    }
                }
            }
        }
        if(mvp[0] > 0) {
            this.grid[mvp[1]][mvp[2]].mvp = mvp[3]
        }
    }

    clearSolverDetermined() {
        for(let [cell] of this.elements()) {
            if(cell.solver_determined) {
                cell.clear()
            }
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

class Cell {
    constructor(row, col, candidates = undefined) {
        this.candidates = candidates
        if (!this.candidates) {
            this.clear()
        }
        this.row = row
        this.col = col
        this.clearAnalysis()
    }

    copy() {
        let candidates = new Set(this.candidates.values())
        let cell = new Cell(this.row, this.col, candidates)
        cell._value = this._value
        cell.solver_determined = this.solver_determined
        return cell
    }

    remove(candidate) {
        return this.candidates.delete(candidate)
    }

    clear() {
        this._value = undefined
        this.solver_determined = false
        this.resetCandidates()
    }

    clearCandidates() {
        this.candidates = new Set()
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

    addFailedOnePlyAnalysis(candidate) {
        this.failedAnalysis.add(candidate)
    }
    addAddDigitOnePlyAnalysis(candidate) {
        this.addDigitAnalysis.add(candidate)
    }

    clearAnalysis() {
        this.failedAnalysis = new Set()
        this.addDigitAnalysis = new Set()
        delete this.mvp
    }

    get value() {
        return this._value
    }

    set value(v) {
        this._value = v
    }

    set pendingValue(v) {
        this._pendingValue = v
    }

    applyPending() {
        if (this._pendingValue) {
            this.value = this._pendingValue
            this._pendingValue = undefined
            return true
        }
        return false
    }

    asString() {
        return this.value || " ";
    }
}