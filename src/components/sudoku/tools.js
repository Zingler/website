import { ThermoRule } from "./logic"
import { Location, LocationSet } from "./board.js"
import { box_width } from './rulerender.js'

class Tool {
    constructor(boardView) {
        this.boardView = boardView
        this.mouseEventHandler = undefined
        this.onMouseDown = this.onMouseDown.bind(this)
        this.onMouseMove = this.onMouseMove.bind(this)
        this.onMouseUp = this.onMouseUp.bind(this)
    }

    handleKeyPress(e) { }

    onMouseDown(e) {
        if (this.mouseEventHandler) {
            this.mouseEventHandler.onMouseDown(e)
        }
    }
    onMouseMove(e) {
        if (this.mouseEventHandler) {
            this.mouseEventHandler.onMouseMove(e)
        }
    }
    onMouseUp(e) {
        if (this.mouseEventHandler) {
            this.mouseEventHandler.onMouseUp(e)
        }
    }
}


export class GivenDigitTool extends Tool {
    constructor(boardView) {
        super(boardView)
        this.moveHandler = this.moveHandler.bind(this)
        this.handleKeyPress = this.handleKeyPress.bind(this)

        let cellSelector = new UniqueCellSelector()
        cellSelector.startHandler = this.moveHandler
        cellSelector.moveHandler = this.moveHandler

        let dragCellSelector = new DragCellSelector()
        dragCellSelector.handler = cellSelector

        this.mouseEventHandler = dragCellSelector
    }

    moveHandler(selection) {
        if (this.boardView.singleSelection() && selection.length == 1 && this.boardView.singleSelection().equals(selection[0])) {
            this.boardView.setState(prev => ({
                selection: []
            }))
        } else {
            this.boardView.setState(prev => ({
                selection: selection
            }))
        }
    }

    handleKeyPress(e) {
        e.preventDefault()
        let selection = this.boardView.singleSelection()
        if (!selection) {
            return;
        }
        let r = selection.row
        let c = selection.col

        if (e.key > '0' && e.key <= '9') {
            let value = parseInt(e.key, 10)
            this.boardView.state.board.grid[r][c].value = value
        } else if (e.key == " ") {
            this.boardView.state.board.grid[r][c].clear()
        }
        this.boardView.updateBoard(true)
    }
}

export class ThermoTool extends Tool {
    constructor(boardView) {
        super(boardView)

        this.activeThermo = undefined

        this.startHandler = this.startHandler.bind(this)
        this.moveHandler = this.moveHandler.bind(this)
        this.endHandler = this.endHandler.bind(this)

        let cellSelector = new UniqueCellSelector()
        cellSelector.startHandler = this.startHandler
        cellSelector.moveHandler = this.moveHandler
        cellSelector.endHandler = this.endHandler

        let dragCellSelector = new DragCellSelector()
        dragCellSelector.handler = cellSelector

        this.mouseEventHandler = dragCellSelector
        this.deletedSomething = false
    }

    startHandler(locationSet) {
        let first = locationSet[0]

        let idsToRemove = this.boardView.state.userRules.filter(rule => {
            let correctType = rule instanceof ThermoRule
            let correctLocation = rule.cell_indexes.filter(([r, c]) => r == first.row && c == first.col).length > 0
            return correctType && correctLocation
        }).map(r => r.id)
        if (idsToRemove.length > 0) {
            this.boardView.setState((state) => ({
                userRules: state.userRules.filter(r => idsToRemove.indexOf(r.id) == -1)
            }), () => this.boardView.updateBoard(true))
            this.deletedSomething = true
        }
    }

    moveHandler(locationSet) {
        if (this.deletedSomething) {
            return
        }
        if (!this.activeThermo) {
            this.activeThermo = new ThermoRule(locationSet)
            this.boardView.state.userRules.push(this.activeThermo)
        } else {
            this.activeThermo.cell_indexes = locationSet.map(l => [l.row, l.col])
        }
        this.boardView.updateBoard(true)
    }

    endHandler() {
        this.activeThermo = undefined
        this.deletedSomething = false
    }
}

class UniqueCellSelector {
    constructor() {
        this.startHandler = undefined
        this.moveHandler = undefined
        this.endHandler = undefined
    }

    start(location) {
        this.set = new LocationSet()
        this.set.add(location)
        if (this.startHandler) {
            this.startHandler(this.set.list)
        }
    }

    move(location) {
        if (this.set.add(location) && this.moveHandler) {
            this.moveHandler(this.set.list)
        }
    }

    end() {
        if (this.endHandler) {
            this.endHandler(this.set.list)
        }
    }
}

class DragCellSelector {
    constructor() {
        this.dragging = false
        this.handler = undefined
    }

    interiorSelection(float) {
        let int = Math.floor(float)
        let decimal = float - int
        return [int, (decimal > .2 && decimal < .8)]
    }

    toCellId(e, buffer = false) {
        let [row, rInterior] = this.interiorSelection(e.nativeEvent.offsetY / box_width)
        let [col, cInterior] = this.interiorSelection(e.nativeEvent.offsetX / box_width)
        if (!buffer || (rInterior || cInterior)) {
            return new Location(row, col)
        }
        return undefined
    }

    onMouseDown(e) {
        let location = this.toCellId(e)
        this.dragging = true
        if (this.handler) {
            this.handler.start(location)
        }
    }
    onMouseMove(e) {
        if (this.dragging) {
            let location = this.toCellId(e, true)
            if (location) {
                if (this.handler) {
                    this.handler.move(location)
                }
            }
        }
    }
    onMouseUp(e) {
        this.dragging = false
        if (this.handler) {
            this.handler.end()
        }
    }
}