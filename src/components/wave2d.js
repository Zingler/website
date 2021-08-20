import React from "react"

export default class Wave2D extends React.Component {
    componentDidMount() {
        let pointsx = 800
        let pointsy = 300
        let v = 1

        let u = []
        for (let x = 0; x < pointsx; x++) {
            u[x] = []
            for (let y = 0; y < pointsy; y++) {
                const dx = Math.abs(x - pointsx / 2);
                const dy = Math.abs(y - pointsy / 2);
                u[x][y] = (dx * dx + dy * dy < 60 * 60) ? 1 : -0.5;
            }
        }

        let boundary_copy = []
        for (let x = 0; x < pointsx; x++) {
            boundary_copy[x] = []
            for (let y = 0; y < pointsy; y++) {
                boundary_copy[x][y] = u[x][y]
            }
        }

        let dt = []
        for (let x = 0; x < pointsx; x++) {
            dt[x] = []
            for (let y = 0; y < pointsy; y++) {
                dt[x][y] = 0
            }
        }

        function render(u) {
            var c = document.getElementById("wave2d_canvas");
            var context = c.getContext("2d");
            context.clearRect(0, 0, c.width, c.height);

            var myImageData = context.createImageData(c.width, c.height);

            for (let x = 0; x < u.length; x += 1) {
                for (let y = 0; y < u[x].length; y += 1) {
                    var color = (u[x][y] + 1) / 2 * 255
                    if (color < 0) {
                        color = 0
                    } else if (color > 255) {
                        color = 255
                    }

                    let index = (y * u.length + x) * 4
                    myImageData.data[index + 2] = color
                    myImageData.data[index + 3] = 255
                }
            }
            context.putImageData(myImageData, 0, 0);
        }

        function outOfView(elem) {
            // Get element's bounding
            var bounding = elem.getBoundingClientRect();

            // Check if it's out of the viewport on each side
            var out = {};
            out.top = bounding.top < 0;
            out.left = bounding.left < 0;
            out.bottom = bounding.bottom > (window.innerHeight || document.documentElement.clientHeight);
            out.right = bounding.right > (window.innerWidth || document.documentElement.clientWidth);
            return out.top || out.left || out.bottom || out.right;
        };


        function advance() {
            var c = document.getElementById("wave2d_canvas");
            if (outOfView(c)){
                return;
            }
            let du2x = diffx(diffx(u))
            let du2y = diffy(diffy(u))

            let dt2 = []
            for (let x = 0; x < pointsx; x++) {
                dt2[x] = []
                for (let y = 0; y < pointsy; y++) {
                    dt2[x][y] = (du2x[x][y] + du2y[x][y]) * v * v
                }
            }
            let new_t = []
            for (let x = 0; x < pointsx; x++) {
                new_t[x] = []
                for (let y = 0; y < pointsy; y++) {
                    new_t[x][y] = dt[x][y] + dt2[x][y]
                }
            }
            dt = new_t

            for (let x = 0; x < pointsx; x++) {
                for (let y = 0; y < pointsy; y++) {
                    u[x][y] += dt[x][y]
                }
            }
            apply_boundary()
            render(u)
        }

        function apply_boundary() {
            for (let x = 0; x < pointsx; x++) {
                u[x][0] = boundary_copy[x][0]
                u[x][pointsy - 1] = boundary_copy[x][pointsy - 1]
                dt[x][0] = 0
                dt[x][pointsy - 1] = 0
            }
            for (let y = 0; y < pointsy; y++) {
                u[0][y] = boundary_copy[0][y]
                u[pointsx - 1][y] = boundary_copy[pointsx - 1][y]
                dt[0][y] = 0
                dt[pointsx - 1][y] = 0
            }
        }

        function run() {
            setInterval(advance, 10)
        }

        function diffx(u) {
            let res = []
            for (let x = 0; x < pointsx; x++) {
                res[x] = []
            }

            for (let y = 0; y < u[0].length; y++) {
                res[0][y] = u[1][y] - u[0][y]

                for (let x = 1; x < u.length - 1; x++) {
                    res[x][y] = (u[x + 1][y] - u[x - 1][y]) / 2
                }

                res[pointsx - 1][y] = u[pointsx - 1][y] - u[pointsx - 2][y]
            }

            return res
        }

        function diffy(u) {
            let res = []
            for (let x = 0; x < pointsx; x++) {
                res[x] = []
            }

            for (let x = 0; x < u.length; x++) {
                res[x][0] = u[x][1] - u[x][0]
                res[x][pointsy - 1] = u[x][pointsy - 1] - u[x][pointsy - 2]

                for (let y = 1; y < u[x].length - 1; y++) {
                    res[x][y] = (u[x][y + 1] - u[x][y - 1]) / 2
                }
            }

            return res
        }
        run()
    }
    render() {
        return (
            <canvas id="wave2d_canvas" width="800" height="200"></canvas>
        )
    }
}
