import * as React from "react"
import Layout from "../../components/layout"
import Wave from "../../components/wave"
import Wave2D from "../../components/wave2d"
import Project from "../../components/project"
import "../../styles/code.css"
import "../../components/sudoku/view"
import { Helmet } from "react-helmet"
import SudokuBoard from "../../components/sudoku/view"

// markup
const SudokuPage = () => {
  return (
    <Layout>
      <Project title="Sudoku">
        <b>Work in progress</b>: This project can be used to solve existing sudoku puzzles or create your new ones. Basic sudoku rules (unique 
        columns, rows and boxes) as always active and additional rule set varients can be turned on in the side bar. Given digits can be added
        by seleting a square and typing the value (spacebar clears the the value). Selecting different tools allows drawing additional constraints
        onto the board. Possible candidates for a square are updated in real time based on the rule set and given digits. 
      <SudokuBoard></SudokuBoard>
      </Project>
    </Layout >
  )
}

export default SudokuPage
