import * as React from "react"
import Layout from "../../components/layout"
import Wave from "../../components/wave"
import Wave2D from "../../components/wave2d"
import Blog from "../../components/blog"
import "../../styles/code.css"

// markup
const WavePage = () => {
  return (
    <Layout>

      <Blog title="The Wave Equation">
        <p>
          Waves, such as light waves or sound waves, can be described by the following equation in the one dimensional case.
        </p>

        <div style={{ display: "flex", justifyContent: "space-around", width: "50%", margin: "auto" }}>
          <div>{"\\[\\frac{\\partial^2\\, u}{\\partial\\, t^2} = v^2\\frac{\\partial^2\\, u}{\\partial\\, x^2}\\]"}</div>
          <div>
            <table>
              <tbody>
                <tr><td>{"\\(u\\)"}</td><td>Displacement of the wave</td></tr>
                <tr><td>{"\\(t\\)"}</td><td>Time</td></tr>
                <tr><td>{"\\(x\\)"}</td><td>The space dimension</td></tr>
                <tr><td>{"\\(v\\)"}</td><td>Velocity of the wave</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <p>
          This equation states that the second time derivative of the displacement of the wave as proportional to the second derivative
          with respect to the spatial dimension.
          Put more simply, how the wave will change over time is related to the current shape.
          For the rest of this discussion, lets assume {"\\(v\\)"} is 1 to remove if from this calculation.
        </p>
        <div style={{ float: "right" }}>
          <Wave />
        </div>

        <p>
          To the right we see a 1D wave with the first space derivative {"\\(\\frac{\\partial u}{\\partial x}\\)"} at this particular point highlighted in blue.
          The slope at points nearby this point will be similar but slightly different. The second derivative {"\\(\\frac{\\partial^2 u}{\\partial x^2}\\)"} tells us
          how quickly these slopes are changing.
        </p>
        <p>
          What does the graph look like at a point where the second derivative is large? If its a positive number,
          the slopes are increasing very quickly. This forms a trough and if negative (slopes are decreasing quickly),
          we have a hill. Intuitively, this second derivative indicates how 'pointy' the wave form is at this point, a more pronounced trough or hill.
        </p>
        <p>
          Lets look at the left half of the wave equation, the second time derivative {"\\(\\frac{\\partial^2 u}{\\partial t^2}\\)"}. The first
          derivative {"\\(\\frac{\\partial u}{\\partial t}\\)"} tells us how a point moves up and down over time. Mechanically, taking a derivative with
          respect to space or time is identical, but it can help to think of this as a speed (distance over time).
          Using this analogy, the second derivative with respect to time is the acceleration of the point. After all,
          acceleration is just how fast you are changing your speed over time.
        </p>
        <p>
          Looking back at our wave equation, the second time derivative is equal to the second space derivative. Using what we described earlier, the acceleration of the point
          is equal to the 'pointiness' of the wave at that point. If a point is at the top of a narrow peak, its second space derivative will be a large negative number. This means
          its second time derivative is also that large negative number and the point should be accelerating downward. Note that speed and acceleration can be in opposite directions.
          The point may still be traveling upwards at this time, but with a negative second time derivative its upward speed would be decreasing.
        </p>

        <h2>Code</h2>
        <p>
          Lets walkthrough some salient points of the code to generate the above wave simulation. Defintions of variables below.
          <table style={{ margin: "10px" }}>
            <tbody>
              <tr>
                <th>u</th>
                <td>Array of displacements of the wave. One entry for each point</td>
              </tr>

              <tr>
                <th>dt</th>
                <td>Array of first time derivative. One entry for each point</td>
              </tr>
            </tbody>
          </table>

          First we need an easy way to get the space derivative of this <code>u</code> array. We define <code>diff</code> to do that. Aside from the first and last entry of the array, the derivative is
          nothing more that the difference between the two values on either side of the point. Dividing by 2 is required since the distance between index <code>i-1</code> and <code>i+1</code> is 2.

          <div>
            <pre className="prettyprint"> {`function diff(u) {
    let result = []
    result[0] = u[1] - u[0]
    for (let i = 1; i < u.length - 1; i++) {
        result[i] = (u[i + 1] - u[i - 1]) / 2
    }
    result[u.length - 1] = u[u.length - 1] - u[u.length - 2]
    return result
}`}</pre>
          </div>

        </p>

        <p>
          Now we can advance one time step. We take two derivatives of our <code>u</code> array to find {"\\(\\frac{\\partial^2 u}{\\partial x^2}\\)"} which
          is also our {"\\(\\frac{\\partial^2 u}{\\partial t^2}\\)"}.
          We update our speed (dt) with our acceleration (dt2). Since our wave has two fixed points at the boundary where it can't move,
          we set its speed to 0 at these two points. We then update <code>u</code> by adding on the current speed.

          <div>
            <pre className="prettyprint"> {`function advance() {
    let du2 = diff(diff(u))
    let dt2 = du2
    let new_dt = []
    for (let i = 0; i < total_points; i++) {
        new_dt[i] = dt[i] + dt2[i]  // Update speed by adding acceleration
    }
    new_dt[0] = 0
    new_t[total_points - 1] = 0

    dt = new_dt
    for (let i = 0; i < total_points; i++) {
        u[i] = u[i] + dt[i]   // Update position by adding speed
    }
}`}</pre>
          </div>
        </p>
        <p>
          Stepping forward in time by small steps will give believable results, but is prone to accumulating errors. Our adjustments at the boundaries are also not perfect.
          More exact methods of running this simulation are beyond the scope of this post. Ideally, it would be time reversable so that stepping forward one unit then back one unit
          returns you to the same state. The above code does not guarentee that.
        </p>

        <h2>More dimensions</h2>

        <p>
          The wave equation applies in more than 1 spatial dimension. We simply need to sum the second space derivatives on the right hand side. If our wave is in 2 dimensions it takes the following form.
        </p>
        <p>{"\\[\\frac{\\partial^2\\, u}{\\partial\\, t^2} = v^2 \\left( \\frac{\\partial^2\\, u}{\\partial\\, x^2}\\ + \\frac{\\partial^2\\, u}{\\partial\\, y^2} \\right) \\]"}</p>

        <p>
          An example of a 2D wave might be the surface of a pool of water. X and Y are the coordinates over the surface and the displacement is the height of the water at that point.
          Our code would be very similar to before, but <code>u</code> is now a 2-D array. One value for each x,y pair. We would also need to take spacial derivatives with respect to two different axes.
          Derivative with respect to x is given below. Note how we move along the x axis with <code>x+1</code> and <code>x-1</code> offsets but always use just <code>y</code>. <code>diffy</code> would be the opposite.

          <pre className="prettyprint">{`function diffx(u) {
    let result = []
    for(let x=0; x<pointsx; x++) {
        result[x] = []
    }

    for(let y=0; y<u[0].length; y++) {
        result[0][y] = u[1][y] - u[0][y]

        for(let x=1; x<u.length-1; x++) {
            result[x][y] = (u[x+1][y] - u[x-1][y]) / 2
        }

        result[pointsx-1][y] = u[pointsx-1][y] - u[pointsx-2][y]
    }

    return result
}`} </pre>
        There's more boundary conditions here since the whole outside edge of this x-y rectangle needs to be concidered, but the core of the idea is simple.
        </p>

        <Wave2D/>
        Here we choose to render the displacement of the wave as a color rather than requiring a 3d rendered view.
      </Blog>
    </Layout>
  )
}

export default WavePage
