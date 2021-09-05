function argMin(generator, key) {
    var result
    var min = undefined
    for(let e of generator) {
        let k = key(e)
        if(min === undefined || k < min) {
            min = k
            result = e
        }
    }
    return result
}

function recurse(board, rule) {
    while (rule.run(board)) {board.applyPending()}
    let [valid] = rule.valid(board)
    if (!valid) {
        return [false, undefined]
    }
    if (board.full()) {
        return [true, []]
    }

    let openCell = argMin(board.openCells(), c => c.candidates.size)

    for (let candidate of openCell.candidates) {
        let temp = board.copy()
        temp.grid[openCell.row][openCell.col].value = candidate
        let [found, actions] = recurse(temp, rule)
        if(found) {
            actions.push([openCell.row, openCell.col, candidate])
            return [true, actions]
        }
    }
    return [false, undefined]
}

export function search(board, rule) {
    return recurse(board, rule)
}

export function redundancy(board, rule) {
    let result = []
    if(!board.full()) {
        return []
    }
    for(let [cell] of board.elements()) {
        if(cell.value && !cell.solver_determined) {
            let temp = board.copy()
            temp.grid[cell.row][cell.col].clear()
            temp.clearSolverDetermined()
            temp.reset()
            while (rule.run(temp)) {temp.applyPending()}
            if(temp.full()) {
                result.push([cell.row, cell.col])
            }
        }
    }
    return result
}