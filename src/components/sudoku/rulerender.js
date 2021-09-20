import React, { useRef, useEffect } from 'react'
import * as Logic from './logic.js'
export const box_width = 70

function cell_center(index) {
    return [index[1] * box_width + box_width / 2, index[0] * box_width + box_width / 2]
}

class Renderer {
    constructor(ruleClass) {
        this.ruleClass = ruleClass
    }

    applies(rule) {
        return rule instanceof this.ruleClass
    }
}

class LineRender extends Renderer {
    constructor(ruleClass, color) {
        super(ruleClass)
        this.color = color
    }

    render(ctx, rule) {
        ctx.strokeStyle = this.color
        ctx.lineWidth = 8
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        let cell_indexes = rule.cell_indexes
        ctx.beginPath()
        ctx.moveTo(...cell_center(cell_indexes[0]))

        for (let i = 1; i < cell_indexes.length; i++) {
            ctx.lineTo(...cell_center(cell_indexes[i]))
        }
        ctx.stroke()
    }
}

class AnyOrderConsecutiveRenderer extends LineRender {
    constructor(color) {
        super(Logic.AnyOrderConsecutiveRule, "rgba(85, 99, 250,.5)")
    }
}

class AdjacentMinDifferenceRenderer extends LineRender {
    constructor(color) {
        super(Logic.AdjacentMinDifferenceRule, "rgba(245, 182, 66, .5)")
    }
}

class ThermoRenderer extends Renderer {
    constructor() {
        super(Logic.ThermoRule)
    }

    render(ctx, rule) {
        ctx.strokeStyle = "rgb(200,200,200)"
        ctx.fillStyle = ctx.strokeStyle

        ctx.lineWidth = 16
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        let cell_indexes = rule.cell_indexes
        ctx.beginPath()
        ctx.moveTo(...cell_center(cell_indexes[0]))

        for (let i = 1; i < cell_indexes.length; i++) {
            ctx.lineTo(...cell_center(cell_indexes[i]))
        }
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(...cell_center(cell_indexes[0]), box_width / 2 * .7, 0, 2 * Math.PI)
        ctx.fill()
    }
}

class PalindromeRenderer extends Renderer {
    constructor() {
        super(Logic.PalindromeRule)
    }

    render(ctx, rule) {
        ctx.strokeStyle = "rgb(200,200,200)"
        ctx.fillStyle = ctx.strokeStyle

        ctx.lineWidth = 16
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        let cell_indexes = rule.cell_indexes
        ctx.beginPath()
        ctx.moveTo(...cell_center(cell_indexes[0]))

        for (let i = 1; i < cell_indexes.length; i++) {
            ctx.lineTo(...cell_center(cell_indexes[i]))
        }
        ctx.stroke()
    }
}

class RegionSumRenderer extends Renderer {
    constructor() {
        super(Logic.RegionSumRule)
    }

    has(rule, cell_index, offset) {
        let target = [cell_index[0] + offset[0], cell_index[1] + offset[1]]
        return rule.cell_indexes.find(e => e[0] == target[0] && e[1] == target[1]) !== undefined
    }

    topLeft(cell_indexes) {
        let best = cell_indexes[0]
        for(let index of cell_indexes) {
            if(index[0] < best[0]) { // Prefer the top most row
                best = index
            }
            if(index[0] == best[0] && index[1] < best[1]) { // Ties in the top most row go to the left most index
                best = index
            }
        }
        return best
    }

    render(ctx, rule) {
        let rowSet = new IntervalSetCollection()
        let colSet = new IntervalSetCollection()
        let inset = 5

        for (let cell_index of rule.cell_indexes) {
            let topLeft = this.has(rule, cell_index, [-1, -1])
            let top = this.has(rule, cell_index, [-1, 0])
            let topRight = this.has(rule, cell_index, [-1, 1])
            let left = this.has(rule, cell_index, [0, -1])
            let right = this.has(rule, cell_index, [0, 1])
            let botLeft = this.has(rule, cell_index, [1, -1])
            let bot = this.has(rule, cell_index, [1, 0])
            let botRight = this.has(rule, cell_index, [1, 1])

            let leftBound = cell_index[1] * box_width + inset
            let rightBound = (cell_index[1] + 1) * box_width - inset
            let topBound = cell_index[0] * box_width + inset
            let botBound = (cell_index[0] + 1) * box_width - inset

            if (!left) {
                colSet.add(leftBound, topBound, botBound)
            }
            if (!right) {
                colSet.add(rightBound, topBound, botBound)
            }
            if (!top) {
                rowSet.add(topBound, leftBound, rightBound)
            }
            if (!bot) {
                rowSet.add(botBound, leftBound, rightBound)
            }

            if (left && (!topLeft || !top)) {
                rowSet.add(topBound, leftBound - inset, leftBound)
            }
            if (left && (!botLeft || !bot)) {
                rowSet.add(botBound, leftBound - inset, leftBound)
            }
            if (right && (!topRight || !top)) {
                rowSet.add(topBound, rightBound, rightBound + inset)
            }
            if (right && (!botRight || !bot)) {
                rowSet.add(botBound, rightBound, rightBound + inset)
            }

            if (top && (!topLeft || !left)) {
                colSet.add(leftBound, topBound - inset, topBound)
            }
            if (top && (!topRight || !right)) {
                colSet.add(rightBound, topBound - inset, topBound)
            }
            if (bot && (!botLeft || !left)) {
                colSet.add(leftBound, botBound, botBound + inset)
            }
            if (bot && (!botRight || !right)) {
                colSet.add(rightBound, botBound, botBound + inset)
            }
        }

        ctx.strokeStyle = "rgb(0,0,0)"
        ctx.fillStyle = ctx.strokeStyle
        ctx.lineWidth = 2
        ctx.setLineDash([10, 5])

        for (let row in rowSet.dict) {
            let segments = rowSet.dict[row].get()
            for (let [start, end] of segments) {
                ctx.beginPath()
                ctx.moveTo(start, row)
                ctx.lineTo(end, row)
                ctx.stroke()
            }
        }
        for (let col in colSet.dict) {
            let segments = colSet.dict[col].get()
            for (let [start, end] of segments) {
                ctx.beginPath()
                ctx.moveTo(col, start)
                ctx.lineTo(col, end)
                ctx.stroke()
            }
        }

        if (rule.sum) {
            ctx.font = '14px sans-serif'
            ctx.textBaseline = "top"
            let index = this.topLeft(rule.cell_indexes)
            ctx.fillText(rule.sum, index[1] * box_width+inset+3, index[0] * box_width+inset+3)
        }
    }
}

const RENDERERS = [
    new AnyOrderConsecutiveRenderer(),
    new AdjacentMinDifferenceRenderer(),
    new ThermoRenderer(),
    new PalindromeRenderer(),
    new RegionSumRenderer,
]

export class RuleCanvas extends React.Component {
    constructor(props) {
        super(props)
        this.canvasRef = React.createRef();
    }
    componentDidMount() {
        this.updateCanvas()
    }
    componentDidUpdate(prevProps) {
        this.updateCanvas()
    }

    updateCanvas() {
        let ctx = this.canvasRef.current.getContext('2d')
        ctx.clearRect(0, 0, 9 * box_width, 9 * box_width)
        for (let rule of this.props.rules) {
            for (let renderer of RENDERERS) {
                if (renderer.applies(rule)) {
                    ctx.save()
                    renderer.render(ctx, rule)
                    ctx.restore()
                }
            }
        }
    }

    render() {
        return (
            <canvas ref={this.canvasRef} width={box_width * 9} height={box_width * 9} {...this.props} />
        )
    }
}

class IntervalSet {
    constructor() {
        this.list = []
    }

    add(start, end) {
        this.list.push({ s: start })
        this.list.push({ e: end })
    }

    get() {
        this.list.sort((f, s) => (f.e || f.s) - (s.e || s.s))
        let result = []
        var count = 0
        var open = false
        var openPoint = undefined
        for (let point of this.list) {
            if (point.s) count++
            if (point.e) count--

            if (count == 1 && !openPoint) {
                openPoint = point.s
            } else if (count == 0 && openPoint) {
                result.push([openPoint, point.e])
                openPoint = undefined
            }
        }
        return result
    }
}

class IntervalSetCollection {
    constructor() {
        this.dict = {}
    }

    add(key, start, end) {
        if (!(key in this.dict)) {
            this.dict[key] = new IntervalSet()
        }
        this.dict[key].add(start - 1, end + 1)
    }
}
