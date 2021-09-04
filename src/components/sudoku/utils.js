export function candidateCount(cells) {
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
