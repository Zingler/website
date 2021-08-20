// Import React so that you can use JSX in HeadComponents
const React = require("react")


const HeadComponents = {
    "/blog/tetrisattack/": [
        <script key="ta-script" src="js/ta.js" />
    ]
}

exports.onRenderBody = ({
    pathname,
    setHeadComponents,
}, pluginOptions) => {
    setHeadComponents(HeadComponents[pathname] || [])
}