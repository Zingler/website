import React from "react"

export default class Wave extends React.Component {
    constructor(props) {
        super(props);
        this.state = { loaded: false }
    }

    componentDidMount() {
        if (this.state.loaded) {
            return
        }
        this.state.loaded = true

        let v = 1
        let fixed_points = []

        let points = this.props.points

        var u = []
        for (let i = 0; i < points; i++) {
            u[i] = (Math.sin(i / 20) + Math.sin(i / 36)) / 4;
        }

        let fixed_left = u[0]
        let fixed_right = u[points - 1]

        var dt = []
        for (let i = 0; i < points; i++) {
            dt[i] = 0
        }

        function render(u) {
            var c = document.getElementById("wave_canvas");
            var ctx = c.getContext("2d");
            ctx.clearRect(0, 0, c.width, c.height);
            ctx.strokeStyle = 'black'

            for (let i = 0; i < u.length - 1; i++) {
                ctx.beginPath();
                ctx.moveTo(i * c.width / points, u[i] * c.height / 2 + c.height / 2)
                ctx.lineTo((i + 1) * c.width / points, u[i + 1] * c.height / 2 + c.height / 2);
                ctx.stroke()
            }

            // ctx.strokeStyle = 'blue'
            // let diffu = diff(u)
            // for (let i = 0; i < u.length - 1; i++) {
            //     ctx.beginPath();
            //     ctx.moveTo(i * c.width / points, diffu[i] * 1000 + c.height / 2)
            //     ctx.lineTo((i + 1) * c.width / points, diffu[i + 1] * 1000 + c.height / 2);
            //     ctx.stroke()
            // }

            // ctx.strokeStyle = 'red'
            // let diffu2 = diff(diff(u))
            // for (let i = 0; i < u.length - 1; i++) {
            //     ctx.beginPath();
            //     ctx.moveTo(i * c.width / points, diffu2[i] * 10000 + c.height / 2)
            //     ctx.lineTo((i + 1) * c.width / points, diffu2[i + 1] * 10000 + c.height / 2);
            //     ctx.stroke()
            // }

            let d_point = 150
            let size = 40
            let slope = diff(u)[d_point]
            let start_x = d_point - size
            let end_x = d_point + size
            let start_y = u[d_point] - size * slope
            let end_y = u[d_point] + size * slope

            ctx.strokeStyle = 'blue'
            ctx.beginPath();
            ctx.moveTo(start_x * c.width / points, start_y * c.height / 2 + c.height / 2)
            ctx.lineTo(end_x * c.width / points, end_y * c.height / 2 + c.height / 2)
            ctx.stroke()
        }

        function add_fixed_point(event) {
            let x = Math.round(event.x / this.props.width * points)
            fixed_points = [{ x: x, u: u[x] }, { x: x + 1, u: u[x + 1] }, { x: x - 1, u: u[x - 1] }]
        }
        function clear_fixed_points(event) {
            fixed_points = []
        }

        function advance() {
            let du2 = diff(diff(u))
            let dt2 = du2.map(x => x * (v * v))
            let new_t = []
            for (let i = 0; i < points; i++) {
                new_t[i] = dt[i] + dt2[i] - 0.0 * dt[i]
            }
            new_t[0] = 0
            new_t[points - 1] = 0

            dt = new_t

            for (let i = 0; i < points; i++) {
                u[i] = u[i] + dt[i]
            }

            u[0] = fixed_left
            u[points - 1] = fixed_right

            fixed_points.forEach(x => {
                u[x['x']] = x['u']
                dt[x['x']] = 0
            })

            render(u)
        }

        function run() {
            setInterval(advance, 20)
        }

        function diff(u) {
            let res = []
            res[0] = u[1] - u[0]
            for (let i = 1; i < u.length - 1; i++) {
                res[i] = (u[i + 1] - u[i - 1]) / 2
            }
            res[u.length - 1] = u[u.length - 1] - u[u.length - 2]
            return res
        }
        run()
    }
    render() {
        return (
            <canvas id="wave_canvas" width={this.props.width} height={this.props.height} />
        )
    }
}

Wave.defaultProps = {
    width: 400,
    height: 200,
    points: 400,
    damping: 0
}
