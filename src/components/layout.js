import React from "react"
import { render } from "react-dom"
import "../styles/layout.css"

export default class Layout extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <div class="content" style={{ maxWidth: 960, margin: "auto" }}>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"></link>

                <nav className="navbar">
                    <ul>
                        <li><a href="/">Home</a></li>
                        <li><div className="dropdown">
                            <button className="dropbtn">Blog <i className="fa fa-caret-down"></i>
                            </button>
                            <ul className="dropdown-content">
                                <li>
                                    <a href="/blog/tetrisattack">Tetris Attack</a>
                                </li>
                                <li>
                                    <a href="/blog/wave">Wave Equation</a>
                                </li>
                            </ul>
                        </div>
                        </li>
                        <li><a href="/resume">About Me</a></li>
                    </ul>
                </nav>
                <div class="main-content">
                    {this.props.children}
                </div>
            </div>
        )
    }
}