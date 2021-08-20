import React from "react"
import { render } from "react-dom"
import "../styles/layout.css"

export default class Layout extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <div style={{ maxWidth: 800, padding: `0 1rem` }}>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"></link>

                <div className="navbar">
                    <a href="/">Home</a>
                    <div className="dropdown">
                        <button className="dropbtn">Blog <i className="fa fa-caret-down"></i>
                        </button>
                        <div className="dropdown-content">
                            <a href="/blog/tetrisattack">Tetris Attack</a>
                            <a href="/blog/wave">Wave Equation</a>
                        </div>
                    </div>
                    <a href="/resume">About Me</a>
                </div>
                <div>
                    {this.props.children}
                </div>
            </div>
        )
    }
}