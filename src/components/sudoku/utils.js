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


export const IDMixin = (C, prefix) => class extends C {
    static _id = 1

    constructor(...args) {
        super(...args)
        this.id = prefix + " #" + this.constructor._id
        this.constructor._id += 1
    }
}