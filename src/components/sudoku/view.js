import React from "react"
import { PureComponent } from "react"
import "../../styles/sudoku.css"
import { Board } from "./board.js"
import * as Logic from "./logic.js";
import * as Analysis from "./analysis.js"
import { search } from "./search";
import { box_width, RuleCanvas } from "./rulerender.js"

export default class SudokuBoard extends React.Component {
    constructor(props) {
        super(props);

        this.board = new Board()
        this.globalRules = [new Logic.CellMustHaveNumberRule(), new Logic.SudokuRule(), new Analysis.OnePlyAnalysisRule()]
        this.rule = new Logic.AggregateRule(this.globalRules)
        this.userRules = []
        this.rule.run(this.board)
        this.handleClick = this.handleClick.bind(this)
        this.handleKeyPress = this.handleKeyPress.bind(this)
        this.handleGlobalRuleChange = this.handleGlobalRuleChange.bind(this)
        this.handleSettingChange = this.handleSettingChange.bind(this)
        this.findSolution = this.findSolution.bind(this)
        this.addRule = this.addRule.bind(this)

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
        let r = selection[0]
        let c = selection[1]

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
        if(this.state.settings.Redundency) {
            this.board.checkRedundency(this.rule)
        } else {
            this.board.clearRedundency()
        }
        this.setState(prev => ({
            board: this.board
        }))
    }

    handleClick(e) {
        let element = e.currentTarget
        let row = parseInt(element.getAttribute('data-r'))
        let col = parseInt(element.getAttribute('data-c'))
        if (e.shiftKey) {
            this.setState((state, props) => ({
                selection: state.selection.concat([[row, col]])
            }))
        } else {
            if (this.singleSelection()) {
                let s = this.singleSelection()
                if (s[0] == row && s[1] == col) { // Allow deselecting the current cell
                    this.setState(prev => ({
                        selection: []
                    }))
                    return;
                }
            }
            this.setState(prev => ({
                selection: [[row, col]]
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
            if(this.state.selection.length < 2) {
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

    render() {
        let [valid, bad_index, message] = this.rule.valid(this.board)
        let rows = []
        let selectedCells = this.state.selection.map(([r, c]) => this.board.grid[r][c])
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
                if(this.state.settings.HideSolverDetermined && cell.solver_determined) {
                    props['className'] += " hidden"
                }

                if (cell.value) {
                    celldiv = <div {...props} onClick={this.handleClick}><span className="value">{this.board.grid[r][c].value}</span>{children}</div>
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

            </div>
        );
    }
}