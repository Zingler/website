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

                <div class="navbar">
                    <a href="/home">Home</a>
                    <div class="dropdown">
                        <button class="dropbtn">Projects <i className="fa fa-caret-down"></i>
                        </button>
                        <div class="dropdown-content">
                            <a href="#">Link 1</a>
                            <a href="#">Link 2</a>
                            <a href="#">Link 3</a>
                        </div>
                    </div>
                    <a href="/resume">Resume</a>
                </div>
                <div>
                    {this.props.children}
                </div>
            </div>
        )
    }
}