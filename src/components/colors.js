export function bezier(points) {
    if (points.length == 2) {
        return (t) => lerp(points[0], points[1], t)
    }
    return (t) => {
        let new_points = []
        for (let i = 0; i < points.length - 1; i++) {
            new_points.push(lerp(points[i], points[i + 1], t))
        }
        return bezier(new_points)(t)
    }
}

export function precompute(f, steps) {
    let values = []
    for(let i=0; i<steps+10; i++) {
        let t = i/steps;
        values.push(f(t))
    }
    return (t) => {
        var bucket = Math.floor(t*steps)
        if(bucket >= values.length) {
            bucket = values.length -1
        }
        return values[bucket]
    }
}

function lerp(s, e, t) {
    return s.map((x, i) => {
        return x * (1 - t) + e[i] * t
    });
}

export function parseToRGB(colorString) {
    var num = Number.parseInt(colorString.substring(1), 16)
    let b = num % 256
    num = Math.floor(num / 256)
    let g = num % 256
    num = Math.floor(num / 256)
    let r = num % 256
    return [r, g, b]
}

export function rgbToString(colorArray) {
    return `rgb(${colorArray[0]},${colorArray[1]},${colorArray[2]})`
}

/**
* Converts an RGB color value to HSV. Conversion formula
* adapted from http://en.wikipedia.org/wiki/HSV_color_space.
* Assumes r, g, and b are contained in the set [0, 255] and
* returns h, s, and v in the set [0, 1].
*
* @param   Number  r       The red color value
* @param   Number  g       The green color value
* @param   Number  b       The blue color value
* @return  Array           The HSV representation
*/
export function rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, v = max;

    var d = max - min;
    s = max == 0 ? 0 : d / max;

    if (max == min) {
        h = 0; // achromatic
    } else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
    }

    return [h, s, v];
}

/**
 * Converts an HSV color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes h, s, and v are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  v       The value
 * @return  Array           The RGB representation
 */
export function hsvToRgb(h, s, v) {
    var r, g, b;

    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0:
            r = v;
            g = t;
            b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }

    return [r * 255, g * 255, b * 255];
}