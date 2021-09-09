import React from "react"
import { PureComponent } from "react"
import "../../styles/sudoku.css"
import { Board, Location } from "./board.js"
import * as Logic from "./logic.js";
import * as Analysis from "./analysis.js"
import { search } from "./search";
import { box_width, RuleCanvas } from "./rulerender.js"
import * as Tool from './tools.js'

export default class SudokuBoard extends React.Component {
    constructor(props) {
        super(props);

        let board = new Board()
        let globalRules = [new Logic.CellMustHaveNumberRule(), new Logic.SudokuRule(), new Analysis.OnePlyAnalysisRule()]

        this.handleGlobalRuleChange = this.handleGlobalRuleChange.bind(this)
        this.handleSettingChange = this.handleSettingChange.bind(this)
        this.findSolution = this.findSolution.bind(this)
        this.addRule = this.addRule.bind(this)
        this.tools = this.tools.bind(this)

        this.state = {
            selection: [],
            board: board,
            globalRules: globalRules,
            userRules: [],
            settings: {
                "OnePlyAnalysis": false,
                "HideCandidates": false,
                "HideSolverDetermined": false
            },
        }
        this.state["tool"] = new Tool.GivenDigitTool(this)

        this.rule.run(this.state.board)
    }

    get rule() {
        return new Logic.AggregateRule(this.state.globalRules.concat(this.state.userRules))
    }

    singleSelection() {
        if (this.state.selection.length == 1) {
            return this.state.selection[0]
        }
        return undefined
    }

    updateBoard(withReset = false) {
        if (withReset) {
            this.state.board.reset()
        }
        while (this.rule.run(this.state.board)) { this.state.board.applyPending() }
        if (this.state.settings.OnePlyAnalysis) {
            this.runAnalysis()
        } else {
            this.state.board.clearAnalysis()
        }
        if (this.state.settings.Redundency) {
            this.state.board.checkRedundency(this.rule)
        } else {
            this.state.board.clearRedundency()
        }
        this.setState(prev => ({
            board: this.state.board
        }))
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
            this.state.globalRules.push(new cls())
        } else {
            this.state.globalRules = this.state.globalRules.filter(r => !(r instanceof cls))
        }
        this.setState(prev => ({
            globalRules: this.state.globalRules
        }))
        this.updateBoard(true)
    }

    addRule(RuleConstructor) {
        let adder = () => {
            if (this.state.selection.length < 2) {
                return
            }
            let rule = new RuleConstructor(this.state.selection)
            this.state.userRules = this.state.userRules.concat([rule])
            this.setState(prev => ({ userRules: this.state.userRules }))
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
            this.state.board.clearAnalysis()
        }
        this.updateBoard(true)
    }

    runAnalysis() {
        this.state.board.runOnePlyAnalysis(this.rule)
        this.setState(prev => ({
            board: this.state.board
        }))
    }

    findSolution() {
        let [found, actions] = search(this.state.board, this.rule)
        if (found) {
            for (let [r, c, v] of actions) {
                this.state.board.grid[r][c].value = v
            }
        }
        this.updateBoard()
    }

    static toolList = [
        [Tool.GivenDigitTool, "Given Digit"],
        [Tool.ThermoTool, "Thermometer"],
        [Tool.AnyOrderConsecutiveTool, "Any Order Consecutive"],
        [Tool.AdjacentMinDifferenceTool, "Adjacent Min Difference"],
        [Tool.PalindromeTool, "Palindrome Line"],
    ]

    tools() {
        let tools = []
        for(let [constructor, description] of SudokuBoard.toolList) {
            tools.push(
                <label key={constructor.name}>
                    <input type="radio" name="tool" checked={this.state.tool instanceof constructor} onChange={() => this.setState(prev => ({
                       tool: new constructor(this),
                       selection: []
                    }))}/>
                    {description}
                </label>
            )
        }
        return tools
    }

    render() {
        let [valid, bad_index, message] = this.rule.valid(this.state.board)
        let rows = []
        let selectedCells = this.state.selection.map(s => this.state.board.grid[s.row][s.col])
        if (this.singleSelection()) {
            var highlightCandidate = selectedCells[0].value
        }
        for (let r = 0; r < this.state.board.grid.length; r++) {
            let cells = []
            for (let c = 0; c < this.state.board.grid[r].length; c++) {
                let cell = this.state.board.grid[r][c];
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
                    children.push(<div id="error-message" className="error-message">
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
                    celldiv = <div {...props}><span className="value">{this.state.board.grid[r][c].value}</span>{children}</div>
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
                <div className="board" onKeyDown={this.state.tool.handleKeyPress} tabIndex="0">
                    <RuleCanvas rules={this.state.userRules} />
                    {rows}
                    <div id="interactLayer" onMouseDown={this.state.tool.onMouseDown} onMouseMove={this.state.tool.onMouseMove} onMouseUp={this.state.tool.onMouseUp} style={{ position: "absolute", top: 0, width: "100%", height: "100%" }}></div>
                </div>
                <h2>Global Rules</h2>
                <label>
                    <input type="checkbox" value="NonConsecutiveRule" onChange={this.handleGlobalRuleChange} />
                    Non Consecutive Adjacent cells
                </label>
                <label>
                    <input type="checkbox" value="KingRule" onChange={this.handleGlobalRuleChange} />
                    King Move restriction
                </label>
                <label>
                    <input type="checkbox" value="KnightRule" onChange={this.handleGlobalRuleChange} />
                    Knight Move restriction
                </label>
                <h2>Solver settings</h2>
                <label>
                    <input type="checkbox" value="OnePlyAnalysis" onChange={this.handleSettingChange} />
                    Run One Ply Analysis
                </label>
                <label>
                    <input type="checkbox" value="Redundency" onChange={this.handleSettingChange} />
                    Analyse redundent digits
                </label>

                <button onClick={this.findSolution}>Find a solution</button>
                <h2>Tools</h2>
                {this.tools()}
                <h2>Display Settings</h2>
                <label>
                    <input type="checkbox" value="HideCandidates" onChange={this.handleSettingChange} />
                    Hide Candidates
                </label>
                <label>
                    <input type="checkbox" value="HideSolverDetermined" onChange={this.handleSettingChange} />
                    Hide Solver Determined
                </label>
            </div>
        );
    }
}

