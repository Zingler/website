import * as React from "react"
import Layout from "../../components/layout"
import Wave from "../../components/wave"
import Wave2D from "../../components/wave2d"
import Project from "../../components/project"
import "../../styles/code.css"
import "../../components/sudoku"
import { Helmet } from "react-helmet"
import SudokuBoard from "../../components/sudoku"

// markup
const SudokuPage = () => {
  return (
    <Layout>
      <Project title="Sudoku">
      <SudokuBoard></SudokuBoard>
      </Project>
    </Layout >
  )
}

export default SudokuPage
