import {Rule} from "./logic.js"

export class OnePlyAnalysisRule extends Rule {
    valid(board) {
        for (let [cell, row, col] of board.elements()) {
            if (!cell.value && cell.failedAnalysis.size > 0 && cell.failedAnalysis.size == cell.candidates.size) {
                return [false, [row, col], `Analysis of candidates shows that any value here leads to an invalid board`]
            }
        }
        return [true]
    }
}