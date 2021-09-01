import React from "react"
import "../styles/layout.css"

export default function Project(props) {
    return (
        <div>
            <h1>{props.title}</h1>
            <hr></hr>
            <div>
                {props.children}
            </div>
            <br></br>
            <br></br>
        </div>
    )
}