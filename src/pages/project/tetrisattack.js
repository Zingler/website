import * as React from "react"
import Layout from "../../components/layout"
import Wave from "../../components/wave"
import Wave2D from "../../components/wave2d"
import Project from "../../components/project"
import "../../styles/code.css"
import { Helmet } from "react-helmet"

// markup
const TAPage = () => {
  return (
    <Layout>
      <Helmet>
        <script type="text/javascript" src="./js/ta.js" />
      </Helmet>

      <Project title="Tetris Attack">
        Below is a javascript implementation of the main mechanics of the  SNES Nintendo game <a href="https://en.wikipedia.org/wiki/Tetris_Attack">Tetris Attack</a>.
        An AI player controls the right screen while the player controls the left screen (Up, Down, Left, Right, Space to swap). 
        <div style={{display: "flex"}}>
          <div className="game" id="game-container-left"> </div>
          <div style={{minWidth: "20px"}}> </div>
          <div className="game" id="game-container-right"> </div>
        </div>
        Source code can be found <a href="https://github.com/Zingler/panel-de-js">Here</a>.

      </Project>
      <script dangerouslySetInnerHTML={{__html:`
        window.addEventListener("load", () => setTimeout(() => TA.InitiateGame(), 1000), false);
      `}}/>
    </Layout >
  )
}

export default TAPage
