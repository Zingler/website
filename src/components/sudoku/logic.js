import {candidateCount} from './utils.js'

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
        for (let [cell, r, c] of board.elements()) {
            if (cell.value && cell.candidates.size > 0) {
                cell.clearCandidates()
                changed = true
            }
        }
        return changed
    }
    // TODO include lone single logic
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