#version 300 es

precision mediump float;
in float v_colorVariable;
out vec4 frag_color;

void main() {
    vec4 color;
    //first 1/3 of the points are mixed from red to green, second 1/3 green to blue, last 1/3 blue to red
    if(v_colorVariable < 0.33) {
        // Red -> Green
        float f = v_colorVariable / 0.33;
        color = mix(vec4(1.0, 0.0, 0.0, 1.0), vec4(0.0, 1.0, 0.0, 1.0), f);
    } else if(v_colorVariable < 0.66) {
        // Green -> Blue
        float f = (v_colorVariable - 0.33) / (0.33);
        color = mix(vec4(0.0, 1.0, 0.0, 1.0), vec4(0.0, 0.0, 1.0, 1.0), f);
    } else if (v_colorVariable <= 1.0) {
        // Blue -> Red
        float f = (v_colorVariable - 0.66) / (0.34);
        color = mix(vec4(0.0, 0.0, 1.0, 1.0), vec4(1.0, 0.0, 0.0, 1.0), f);
    }
    else {
        //circles color
        color = vec4(0.5, 0.0, 0.0, 1.0);  
    }
    frag_color = color;
}