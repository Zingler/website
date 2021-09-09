import React from "react"
import { PureComponent } from "react"
import "../../styles/sudoku.css"
import { Board, Location, LocationSet } from "./board.js"
import * as Logic from "./logic.js";
import * as Analysis from "./analysis.js"
import { search } from "./search";
import { box_width, RuleCanvas } from "./rulerender.js"

export default class SudokuBoard extends React.Component {
    constructor(props) {
        super(props);

        this.board = new Board()
        this.boardRef = React.createRef()
        this.globalRules = [new Logic.CellMustHaveNumberRule(), new Logic.SudokuRule(), new Analysis.OnePlyAnalysisRule()]
        this.rule = new Logic.AggregateRule(this.globalRules)
        this.userRules = []
        this.rule.run(this.board)
        this.handleKeyPress = this.handleKeyPress.bind(this)
        this.handleGlobalRuleChange = this.handleGlobalRuleChange.bind(this)
        this.handleSettingChange = this.handleSettingChange.bind(this)
        this.findSolution = this.findSolution.bind(this)
        this.addRule = this.addRule.bind(this)
        this.userRuleControls = this.userRuleControls.bind(this)
        this.removeRule = this.removeRule.bind(this)
        this.changeSelection = this.changeSelection.bind(this)

        this.state = {
            selection: [],
            board: this.board,
            globalRules: [],
            userRules: [],
            settings: {
                "OnePlyAnalysis": false,
                "HideCandidates": false,
                "HideSolverDetermined": false
            },
        }
    }

    componentDidMount() {
        let changeSelection = new UniqueCellSelector()
        changeSelection.endHandler = this.changeSelection
        changeSelection.moveHandler = this.changeSelection
        let cellSelector = new CellSelectionListener(this.boardRef.current)
        cellSelector.handler = changeSelection
        cellSelector.registerListeners()
    }

    singleSelection() {
        if (this.state.selection.length == 1) {
            return this.state.selection[0]
        }
        return undefined
    }

    handleKeyPress(e) {
        e.preventDefault()
        let selection = this.singleSelection()
        if (!selection) {
            return;
        }
        let r = selection.row
        let c = selection.col

        if (e.key > '0' && e.key <= '9') {
            let value = parseInt(e.key, 10)
            if (this.board.grid[r][c].value) {
                this.board.reset()
            }
            this.board.grid[r][c].value = value
        } else if (e.key == " ") {
            this.board.grid[r][c].clear()
            this.board.reset()
        }
        this.board.reset()
        this.updateBoard()
    }

    updateBoard(withReset = false) {
        if (withReset) {
            this.board.reset()
        }
        while (this.rule.run(this.board)) { this.board.applyPending() }
        if (this.state.settings.OnePlyAnalysis) {
            this.runAnalysis()
        } else {
            this.board.clearAnalysis()
        }
        if (this.state.settings.Redundency) {
            this.board.checkRedundency(this.rule)
        } else {
            this.board.clearRedundency()
        }
        this.setState(prev => ({
            board: this.board
        }))
    }

    changeSelection(selection) {
        if (this.singleSelection() && selection.length == 1 && this.singleSelection().equals(selection[0])) {
            this.setState(prev => ({
                selection: []
            }))
        } else {
            this.setState(prev => ({
                selection: selection
            }))
        }
    }

    static rule_constructors = {
        "KnightRule": Logic.KnightRule,
        "KingRule": Logic.KingRule,
        "NonConsecutiveRule": Logic.NonConsecutiveRule,
    }

    handleGlobalRuleChange(e) {
        let target = e.currentTarget
        let value = target.value
        let cls = SudokuBoard.rule_constructors[value]
        if (target.checked) {
            this.globalRules.push(new cls())
        } else {
            this.globalRules = this.globalRules.filter(r => !(r instanceof cls))
        }
        let rules = this.globalRules.concat(this.state.userRules)
        this.rule = new Logic.AggregateRule(rules)
        this.updateBoard(true)
    }

    addRule(RuleConstructor) {
        let adder = () => {
            if (this.state.selection.length < 2) {
                return
            }
            let rule = new RuleConstructor(this.state.selection)
            this.userRules = this.userRules.concat([rule])
            let rules = this.globalRules.concat(this.userRules)
            this.rule = new Logic.AggregateRule(rules)
            this.setState(prev => ({ userRules: this.userRules }))
            this.updateBoard(true)
        }
        return adder
    }

    removeRule(e) {
        let target = e.currentTarget
        let ruleId = target.getAttribute("data-rule-id")
        this.userRules = this.state.userRules.filter(r => r.id !== ruleId)
        let rules = this.globalRules.concat(this.userRules)
        this.rule = new Logic.AggregateRule(rules)
        this.setState(prev => ({ userRules: this.userRules }))
        this.updateBoard(true)
    }

    handleSettingChange(e) {
        let target = e.currentTarget
        let value = target.value
        this.setState((state, props) => ({
            settings: {
                ...state.settings,
                [value]: target.checked
            }
        }))
        if (value == "OnePlyAnalysis") {
            this.board.clearAnalysis()
        }
        this.updateBoard(true)
    }

    runAnalysis() {
        this.board.runOnePlyAnalysis(this.rule)
        this.setState(prev => ({
            board: this.board
        }))
    }

    findSolution() {
        let [found, actions] = search(this.board, this.rule)
        if (found) {
            for (let [r, c, v] of actions) {
                this.board.grid[r][c].value = v
            }
        }
        this.updateBoard()
    }

    userRuleControls() {
        let rules = []
        for (let rule of this.state.userRules) {
            rules.push(<div key={rule.id}>{rule.id}<button data-rule-id={rule.id} onClick={this.removeRule}><i className="fa fa-times" /></button></div>)
        }
        return rules
    }

    render() {
        let [valid, bad_index, message] = this.rule.valid(this.board)
        let rows = []
        let selectedCells = this.state.selection.map(s => this.board.grid[s.row][s.col])
        if (this.singleSelection()) {
            var highlightCandidate = selectedCells[0].value
        }
        for (let r = 0; r < this.board.grid.length; r++) {
            let cells = []
            for (let c = 0; c < this.board.grid[r].length; c++) {
                let cell = this.board.grid[r][c];
                var celldiv;
                var props = {
                    "data-r": r,
                    "data-c": c,
                    "className": "cell"
                }
                let children = []

                if (selectedCells.find(x => x === cell)) {
                    props['className'] += " selected";
                }
                if (cell.solver_determined) {
                    props['className'] += " solver"
                }
                if (cell.redundant) {
                    props['className'] += " redundant"
                }
                if (r == 2 || r == 5) {
                    props['className'] += " bottom-border"
                }
                if (c == 2 || c == 5) {
                    props['className'] += " right-border"
                }
                if (bad_index && bad_index[0] == r && bad_index[1] == c) {
                    props['className'] += " invalid"
                    props['title'] = message
                    children.push(<div draggable="true" id="error-message" className="error-message">
                        <a style={{ float: "right" }} href="#error-message"><i className="fa fa-times" /></a>
                        {message}
                    </div>)
                }
                if (!cell.value && cell.candidates.has(highlightCandidate)) {
                    props['className'] += " candidate-highlight"
                }
                if (this.state.settings.HideSolverDetermined && cell.solver_determined) {
                    props['className'] += " hidden"
                }

                if (cell.value) {
                    celldiv = <div {...props}><span className="value">{this.board.grid[r][c].value}</span>{children}</div>
                } else {
                    var v = 1
                    let candidates = []
                    if (this.state.settings["HideCandidates"] == false) {
                        for (let v = 1; v <= 9; v++) {
                            var text = " "
                            if (cell.candidates.has(v)) {
                                text = v
                            }
                            let candidateProps = {}
                            if (cell.addDigitAnalysis.has(v)) {
                                candidateProps["className"] = "add-digit-analysis"
                            }
                            if (cell.mvp && cell.mvp == v) {
                                candidateProps["className"] = "mvp"
                            }
                            if (cell.failedAnalysis.has(v)) {
                                candidateProps["className"] = "failed-analysis"
                            }
                            candidates.push(<div key={v} {...candidateProps}>{text}</div>)
                        }
                    }
                    celldiv = <div key={"cell" + r + "-" + c} {...props} onClick={this.handleClick}><div className="candidates">{candidates}</div>{children}</div>
                }
                cells.push(celldiv)
            }
            rows.push(<div key={"row" + r} className="row">{cells}</div>)
        }
        return (
            <div>
                <div className="board" onKeyDown={this.handleKeyPress} tabIndex="0">
                    <RuleCanvas rules={this.state.userRules} />
                    {rows}
                    <div id="interactLayer" ref={this.boardRef} style={{ position: "absolute", top: 0, width: "100%", height: "100%" }}></div>
                </div>
                <h2>Global Rules</h2>
                <label>
                    <input type="checkbox" value="NonConsecutiveRule" onChange={this.handleGlobalRuleChange} />
                    Non Consecutive Adjacent cells
                </label>
                <br />
                <label>
                    <input type="checkbox" value="KingRule" onChange={this.handleGlobalRuleChange} />
                    King Move restriction
                </label>
                <br />
                <label>
                    <input type="checkbox" value="KnightRule" onChange={this.handleGlobalRuleChange} />
                    Knight Move restriction
                </label>
                <h2>Solver settings</h2>
                <label>
                    <input type="checkbox" value="OnePlyAnalysis" onChange={this.handleSettingChange} />
                    Run One Ply Analysis
                </label>
                <br></br>
                <label>
                    <input type="checkbox" value="Redundency" onChange={this.handleSettingChange} />
                    Analyse redundent digits
                </label>
                <br></br>

                <button onClick={this.findSolution}>Find a solution</button>
                <h2>Rules</h2>
                <button onClick={this.addRule(Logic.ThermoRule)}>Add Thermometer</button>
                <button onClick={this.addRule(Logic.AnyOrderConsecutiveRule)}>Add Any Order Consecutive Line</button>
                <button onClick={this.addRule(Logic.AdjacentMinDifferenceRule)}>Add Adjacent Min Difference Line</button>
                <h2>Display Settings</h2>
                <label>
                    <input type="checkbox" value="HideCandidates" onChange={this.handleSettingChange} />
                    Hide Candidates
                </label>
                <br></br>
                <label>
                    <input type="checkbox" value="HideSolverDetermined" onChange={this.handleSettingChange} />
                    Hide Solver Determined
                </label>
                <br></br>
                <h2>User Added Rules</h2>
                {this.userRuleControls()}

            </div>
        );
    }
}


class CellSelectionListener {
    constructor(element) {
        this.element = element
        this.dragging = false
        this.handler = undefined
    }

    interiorSelection(float) {
        let int = Math.floor(float)
        let decimal = float - int
        return [int, (decimal > .2 && decimal < .8)]
    }

    toCellId(e, buffer = false) {
        let [row, rInterior] = this.interiorSelection(e.offsetY / box_width)
        let [col, cInterior] = this.interiorSelection(e.offsetX / box_width)
        if (!buffer || (rInterior || cInterior)) {
            return new Location(row, col)
        }
        return undefined
    }

    registerListeners() {
        this.element.addEventListener('mousedown', e => {
            let location = this.toCellId(e)
            this.dragging = true
            if (this.handler) {
                this.handler.start(location)
            }
        })
        this.element.addEventListener('mousemove', e => {
            if (this.dragging) {
                let location = this.toCellId(e, true)
                if (location) {
                    if (this.handler) {
                        this.handler.move(location)
                    }
                }
            }
        })
        this.element.addEventListener('mouseup', e => {
            this.dragging = false
            if (this.handler) {
                this.handler.end()
            }
        })
    }
}


class UniqueCellSelector {
    constructor() {
        this.moveHandler = undefined
        this.endHandler = undefined
    }

    start(location) {
        this.set = new LocationSet()
        this.set.add(location)
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