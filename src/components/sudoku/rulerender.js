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

const RENDERERS = [
    new AnyOrderConsecutiveRenderer(),
    new AdjacentMinDifferenceRenderer(),
    new ThermoRenderer()
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
                    renderer.render(ctx, rule)
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
