import React from "react"
import { PureComponent } from "react"
import "../../styles/sudoku.css"
import {Board} from "./board.js"
import * as Logic from "./logic.js";
import * as Analysis from "./analysis.js"
import { search } from "./search";

export default class SudokuBoard extends React.Component {
    constructor(props) {
        super(props);

        this.board = new Board()
        this.globalRules = [new (Logic.CellMustHaveNumberRule)(), new Logic.SudokuRule(), new Analysis.OnePlyAnalysisRule()]
        this.rule = new Logic.AggregateRule(this.globalRules)
        this.rule.run(this.board)
        this.handleClick = this.handleClick.bind(this)
        this.handleKeyPress = this.handleKeyPress.bind(this)
        this.handleGlobalRuleChange = this.handleGlobalRuleChange.bind(this)
        this.handleSettingChange = this.handleSettingChange.bind(this)
        this.findSolution = this.findSolution.bind(this)

        this.state = {
            selection: undefined,
            board: this.board,
            globalRules: [],
            settings: {
                "OnePlyAnalysis": false
            },
        }
    }

    handleKeyPress(e) {
        e.preventDefault()
        if (!this.state.selection) {
            return;
        }
        let r = this.state.selection[0]
        let c = this.state.selection[1]

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
        }
        this.setState(prev => ({
            board: this.board
        }))
    }

    handleClick(e) {
        let element = e.currentTarget
        let row = parseInt(element.getAttribute('data-r'))
        let col = parseInt(element.getAttribute('data-c'))
        this.setState(prev => ({
            selection: [row, col]
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
            this.globalRules.push(new cls())
        } else {
            this.globalRules = this.globalRules.filter(r => !(r instanceof cls))
        }
        this.rule = new Logic.AggregateRule(this.globalRules)
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
        if(found) {
            for(let [r,c,v] of actions) {
                this.board.grid[r][c].value = v
            }
        }
        this.updateBoard()
    }

    render() {
        let [valid, bad_index, message] = this.rule.valid(this.board)
        let rows = []
        if (this.state.selection) {
            let selectedCell = this.board.grid[this.state.selection[0]][this.state.selection[1]]
            var highlightCandidate = selectedCell.value
        }
        for (let r = 0; r < this.board.grid.length; r++) {
            let cells = []
            for (let c = 0; c < this.board.grid[r].length; c++) {
                let cell = this.board.grid[r][c];
                var celldiv;
                var props = {
                    "data-r": r,
                    "data-c": c,
                    "class": "cell"
                }
                let children = []

                if (this.state.selection) {
                    if (this.state.selection[0] === r && this.state.selection[1] === c) {
                        props['class'] += " selected";
                    }
                }
                if (cell.solver_determined) {
                    props['class'] += " solver"
                }
                if (r == 2 || r == 5) {
                    props['class'] += " bottom-border"
                }
                if (c == 2 || c == 5) {
                    props['class'] += " right-border"
                }
                if (bad_index && bad_index[0] == r && bad_index[1] == c) {
                    props['class'] += " invalid"
                    props['title'] = message
                    children.push(<div draggable="true" id="error-message" class="error-message">
                        <a style={{ float: "right" }} href="#error-message"><i class="fa fa-times" /></a>
                        {message}
                    </div>)
                }
                if (!cell.value && cell.candidates.has(highlightCandidate)) {
                    props['class'] += " candidate-highlight"
                }


                if (cell.value) {
                    celldiv = <div {...props} onClick={this.handleClick}><span class="value">{this.board.grid[r][c].value}</span>{children}</div>
                } else {
                    var v = 1
                    let candidates = []
                    for (let v = 1; v <= 9; v++) {
                        var text = " "
                        if (cell.candidates.has(v)) {
                            text = v
                        }
                        let candidateProps = {}
                        if (cell.addDigitAnalysis.has(v)) {
                            candidateProps["class"] = "add-digit-analysis"
                        }
                        if (cell.mvp && cell.mvp == v) {
                            candidateProps["class"] = "mvp"
                        }
                        if (cell.failedAnalysis.has(v)) {
                            candidateProps["class"] = "failed-analysis"
                        }
                        candidates.push(<div {...candidateProps}>{text}</div>)
                    }
                    celldiv = <div {...props} onClick={this.handleClick}><div class="candidates">{candidates}</div>{children}</div>
                }
                cells.push(celldiv)
            }
            rows.push(<div class="row">{cells}</div>)
        }
        return (
            <div>
                <div class="board" onKeyDown={this.handleKeyPress} tabIndex="0">
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
                <button onClick={this.findSolution}>Find a solution</button>
            </div>
        );
    }
}