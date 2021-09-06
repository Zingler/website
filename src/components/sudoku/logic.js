import { candidateCount, IDMixin } from './utils.js'

export class Rule {
    constructor() {
    }

    run(board) {
    }
}

export class AggregateRule extends Rule {
    constructor(rules, inferences = []) {
        super()
        this.rules = rules
        this.inferences = inferences
    }

    valid(board) {
        for (let r of this.rules) {
            let [good, index, message] = r.valid(board)
            if (!good) {
                return [good, index, message]
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

export class AllUniqueRule extends Rule {
    constructor(cell_indexes, groupName) {
        super()
        this.cell_indexes = cell_indexes
        this.groupName = groupName
        this.inferences = [new InsuffientCandidatesForUniqueGroup(cell_indexes, groupName)]
    }

    valid(board) {
        let check_set = new Set()
        for (let index of this.cell_indexes) {
            let v = board.grid[index[0]][index[1]].value
            if (!v) {
                continue;
            }
            if (check_set.has(v)) {
                return [false, index, `${this.groupName} contains more than one ${v}`];
            }
            check_set.add(v)
        }
        for (let i of this.inferences) {
            let [good, badIndex, message] = i.valid(board)
            if (!good) {
                return [false, badIndex, message]
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
                cell.pendingValue = num
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

    run(board) {
        var changed = this.prune(board)
        changed |= this.lastLocation(board)
        return changed
    }
}

export class RowUniqueRule extends AggregateRule {
    constructor() {
        let rules = []
        for (let r = 0; r < 9; r++) {
            let indexes = []
            for (let c = 0; c < 9; c++) {
                indexes.push([r, c])
            }
            rules.push(new AllUniqueRule(indexes, `Row ${r + 1}`))
        }
        super(rules)
    }
}

export class ColUniqueRule extends AggregateRule {
    constructor() {
        let rules = []
        for (let c = 0; c < 9; c++) {
            let indexes = []
            for (let r = 0; r < 9; r++) {
                indexes.push([r, c])
            }
            rules.push(new AllUniqueRule(indexes, `Column ${c + 1}`))
        }
        super(rules)
    }
}

export class BoxUniqueRule extends AggregateRule {
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
                rules.push(new AllUniqueRule(indexes, `Box ${br * 3 + bc + 1}`))
            }
        }
        super(rules)
    }
}

export class NonDuplicatesAtOffsets extends Rule {
    constructor(offsets, moveType) {
        super()
        this.offsets = offsets;
        this.moveType = moveType;
    }

    valid(board) {
        for (let [cell, r, c] of board.elements()) {
            if (cell.value) {
                for (let adj of board.cellsAtOffsets([r, c], this.offsets)) {
                    if (cell.value === adj.value) {
                        return [false, [r, c], `There is another ${cell.value} a ${this.moveType}'s move away`]
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

export class KnightRule extends NonDuplicatesAtOffsets {
    constructor() {
        let offsets = []
        for (let l of [-1, 1]) {
            for (let b of [-2, 2]) {
                offsets.push([l, b])
                offsets.push([b, l])
            }
        }
        super(offsets, "Knight")
    }
}

export class KingRule extends NonDuplicatesAtOffsets {
    constructor() {
        let offsets = []
        for (let r of [-1, 0, 1]) {
            for (let c of [-1, 0, 1]) {
                if (r * c !== 0) {
                    offsets.push([r, c])
                }
            }
        }
        super(offsets, "King")
    }
}

class OrderedCellRule extends Rule {
    constructor(cell_indexes) {
        super()
        this.cell_indexes = cell_indexes
    }
}

export class ThermoRule extends IDMixin(OrderedCellRule, "Thermo") {
    constructor(cell_indexes) {
        super(cell_indexes)
    }

    valid(board) {
        var current_value = 0
        for (let index of this.cell_indexes) {
            let cell = board.grid[index[0]][index[1]]
            if (cell.value) {
                if (cell.value <= current_value) {
                    return [false, index, `Thermometer requires this cell to be at least ${current_value + 1}`]
                }
                current_value = cell.value
            }
        }
        return [true]
    }

    run(board) {
        var changed = false

        // Restrict candidates from the bulb to the tip
        var min = 1
        for (let i = 0; i < this.cell_indexes.length; i++) {
            let index = this.cell_indexes[i]
            let cell = board.grid[index[0]][index[1]]
            if (cell.value) {
                min = cell.value
            } else {
                for (let j = 1; j < min; j++) {
                    changed |= cell.remove(j)
                }
                min = Math.min(10, ...cell.candidates)
            }
            min += 1
        }

        // Restrict candidates from the tip to the bulb
        var max = 9
        for (let i = this.cell_indexes.length - 1; i >= 0; i--) {
            let index = this.cell_indexes[i]
            let cell = board.grid[index[0]][index[1]]
            if (cell.value) {
                max = cell.value
            } else {
                for (let j = 9; j > max; j--) {
                    changed |= cell.remove(j)
                }
                max = Math.max(0, ...cell.candidates)
            }
            max -= 1
        }

        return changed
    }
}

function findDuplicate(values) {
    let s = new Set()
    for (let v of values) {
        if (s.has(v)) {
            return v
        }
        s.add(v)
    }
    return undefined
}

export class AnyOrderConsecutiveRule extends IDMixin(OrderedCellRule, "AnyOrderConsecutive") {
    constructor(cell_indexes) {
        super(cell_indexes)
        this.max_range = cell_indexes.length - 1
    }

    valid(board) {
        let values = this.cell_indexes.map(i => board.grid[i[0]][i[1]]).filter(c => c.value).map(c => c.value)
        if (values.length == 0) {
            return [true]
        }
        let dup = findDuplicate(values)
        if (dup) {
            return [false, this.cell_indexes[0], `Line contains multiple ${dup}'s`]
        }

        let min = Math.min(...values)
        let max = Math.max(...values)
        let range = max - min
        if (range > this.max_range) {
            return [false, this.cell_indexes[0], `Difference in max and min values on this line must be less than ${this.max_range + 1} but was ${range}`]
        }
        return [true]
    }

    run(board) {
        var changed = false
        var min = 1
        var max = 9
        let values = this.cell_indexes.map(i => board.grid[i[0]][i[1]]).filter(c => c.value).map(c => c.value)
        let valuesPlusMaxRange = values.map(i => i + this.max_range)
        let valuesMinusMaxRange = values.map(i => i - this.max_range)
        min = Math.max(min, ...valuesMinusMaxRange)
        max = Math.min(max, ...valuesPlusMaxRange)

        let open_cells = this.cell_indexes.map(i => board.grid[i[0]][i[1]]).filter(c => !c.value)
        for (let cell of open_cells) {
            for (let i = 1; i < min; i++) {
                changed |= cell.remove(i)
            }
            for (let i = 9; i > max; i--) {
                changed |= cell.remove(i)
            }
        }
        return changed
    }
}

export class AdjacentMinDifferenceRule extends IDMixin(OrderedCellRule, "AdjacentMinDifference") {
    constructor(cell_indexes, { min_difference = 3 } = {}) {
        super(cell_indexes)
        this.min_difference = min_difference
    }

    valid(board) {
        for (let i = 0; i < this.cell_indexes.length - 1; i++) {
            let start = board.grid[this.cell_indexes[i][0]][this.cell_indexes[i][1]]
            let end = board.grid[this.cell_indexes[i + 1][0]][this.cell_indexes[i + 1][1]]
            if (start.value && end.value) {
                let diff = Math.abs(start.value - end.value)
                if (diff < this.min_difference) {
                    return [false, this.cell_indexes[i], `Difference between this cell (${start.value}) and the next cell (${end.value}) must be at least ${this.min_difference}`]
                }
            }
        }
        return [true]
    }

    run(board) {
        var changed = false

        for (let i = 0; i < this.cell_indexes.length - 1; i++) {
            let current = board.grid[this.cell_indexes[i][0]][this.cell_indexes[i][1]]
            let next = board.grid[this.cell_indexes[i + 1][0]][this.cell_indexes[i + 1][1]]
            changed |= this.restrictCandidates(current, next)
        }

        for (let i = 1; i < this.cell_indexes.length; i++) {
            let current = board.grid[this.cell_indexes[i][0]][this.cell_indexes[i][1]]
            let previous = board.grid[this.cell_indexes[i - 1][0]][this.cell_indexes[i - 1][1]]
            changed |= this.restrictCandidates(current, previous)
        }

        return changed
    }

    restrictCandidates(cell, neighbor) {
        let changed = false
        if(!cell.value && neighbor.value) {
            let min = neighbor.value - this.min_difference + 1
            let max = neighbor.value + this.min_difference - 1
            for(let i=min; i<=max; i++) {
                changed |= cell.remove(i)
            }
        }
        return changed
    }
}

export class NonConsecutiveRule extends Rule {
    static adjOffsets = [[-1, 0], [1, 0], [0, -1], [0, 1]]

    valid(board) {
        for (let [cell, r, c] of board.elements()) {
            if (cell.value) {
                for (let adj of board.cellsAtOffsets([r, c], NonConsecutiveRule.adjOffsets)) {
                    if (Math.abs(cell.value - adj.value) === 1) {
                        return [false, [r, c], `Adjacent to a ${adj.value} which is one away from this cell's value of ${cell.value}`]
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

export class SudokuRule extends AggregateRule {
    constructor() {
        let rules = [new BoxUniqueRule(), new RowUniqueRule, new ColUniqueRule()]
        super(rules, [new PointedPairInference()])
    }
}

export class CellMustHaveNumberRule extends Rule {
    valid(board) {
        for (let [cell, r, c] of board.elements()) {
            if (!cell.value && cell.candidates.size == 0) {
                return [false, [r, c], "No possible value can go here"]
            }
        }
        return [true, undefined]
    }

    run(board) {
        var changed = false
        changed |= this.clearCandidates(board)
        changed |= this.loneDigit(board)
        return changed
    }

    clearCandidates(board) {
        var changed = false
        for (let [cell, r, c] of board.elements()) {
            if (cell.value && cell.candidates.size > 0) {
                cell.clearCandidates()
                changed = true
            }
        }
        return changed
    }

    loneDigit(board) {
        let changed = false
        for (let [cell] of board.elements()) {
            if (cell.candidates.size == 1) {
                cell.pendingValue = cell.candidates.values().next().value
                cell.solver_determined = true
                changed = true
            }
        }
        return changed
    }
}

export class Inference {
    run(board) { }
    valid(board) { }
}

export class PointedPairInference extends Inference {
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

export class InsuffientCandidatesForUniqueGroup extends Inference {
    constructor(indexes, groupName) {
        super()
        this.indexes = indexes
        this.groupName = groupName
    }

    valid(board) {
        let cells = this.indexes.map(index => board.grid[index[0]][index[1]])
        var openCells = cells.filter(c => !c.value)
        let canCount = candidateCount(cells)
        let uniqueCandidates = canCount.filter(count => count > 0).length
        if (uniqueCandidates < openCells.length) {
            let firstOpen = openCells[0]
            return [false, [firstOpen.row, firstOpen.col], `${this.groupName} has ${openCells.length} open cells but only ${uniqueCandidates} values that can fill them`]
        }
        return [true, undefined]
    }
}