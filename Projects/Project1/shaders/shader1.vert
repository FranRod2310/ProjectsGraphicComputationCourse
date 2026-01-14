#version 300 es

uniform float u_ratio;

uniform float u_numberOfCirclePoints;
uniform vec3 u_circle; // x = centerX, y = centerY, z = radius
uniform bool u_isCircle;

uniform int u_curveFamily;
uniform float u_numberOfPoints;
uniform vec3 u_coefs; // x = a, y = b, z = c
uniform vec2 u_t; // x = t0, y = t1
uniform vec4 u_curveLimits; // x = Xmin, y = Xmax, z = Ymin, w = Ymax
uniform int u_numberOfCircles;
uniform vec2 u_circleCenters[15];

in float a_numberOfCurrentPoint;

out float v_colorVariable;

void main() {
    vec4 a_position;
    //if it's a circle, calculate position on the circle
    if(u_isCircle){
        float angle = 2.0 * 3.14159 * a_numberOfCurrentPoint / u_numberOfCirclePoints;
        a_position.x = (u_circle.x + u_circle.z * cos(angle)) / u_ratio;
        a_position.y = u_circle.y + u_circle.z * sin(angle);
        a_position.w = 1.0;
        v_colorVariable = 2.0; // Set to a value greater than 1.0 to indicate circle points
    }
    else {
        //calculate t for the current point
        float t = u_t.x + a_numberOfCurrentPoint * (u_t.y - u_t.x) / u_numberOfPoints;
        //set color variable based on the position of the point in the curve
        v_colorVariable = a_numberOfCurrentPoint / u_numberOfPoints;
        //equations for different curve families
        switch(u_curveFamily) {
            case 1:
                a_position.x = cos(u_coefs.x * t) + cos(u_coefs.y * t) / 2.0 + sin(u_coefs.z * t) / 3.0;
                a_position.y = sin(u_coefs.x * t) + sin(u_coefs.y * t) / 2.0 + cos(u_coefs.z * t) / 3.0;
                break;
            case 2:
                a_position.x = 2.0 * (cos(u_coefs.x * t) + pow(cos(u_coefs.y * t), 3.0));
                a_position.y = 2.0 * (sin(u_coefs.x * t) + pow(sin(u_coefs.y * t), 3.0));
                break;
            case 3:
                a_position.x = cos(u_coefs.x * t) * sin(sin(u_coefs.x * t));
                a_position.y = sin(u_coefs.x * t) * cos(cos(u_coefs.y * t));
                break;
            case 4:
                a_position.x = cos(u_coefs.x * t) * cos(u_coefs.y * t);
                a_position.y = sin(cos(u_coefs.x * t));
                break;
            case 5:
                a_position.x = sin(u_coefs.x * t) * (exp(cos(u_coefs.x * t)) - 2.0 * cos(u_coefs.y * t));
                a_position.y = cos(u_coefs.x * t) * (exp(cos(u_coefs.x * t)) - 2.0 * cos(u_coefs.y * t));
                break;
            case 6:
                a_position.x = (u_coefs.x - u_coefs.y) * cos(u_coefs.y * t) + cos(u_coefs.x * t - u_coefs.y * t);
                a_position.y = (u_coefs.x - u_coefs.y) * sin(u_coefs.y * t) - sin(u_coefs.x * t - u_coefs.y * t);
                break;
        }
        a_position.z = 0.0;
        a_position.w = 1.0;
        //normalize position to fit in the viewport
        //considering the ratio of the viewport and the curve limits
        float Xmin = u_curveLimits.x * u_ratio;
        float Xmax = u_curveLimits.y * u_ratio;
        a_position.x = 2.0 * (a_position.x - Xmin) / (Xmax - Xmin) - 1.0;
        a_position.y = 2.0 * (a_position.y - u_curveLimits.z) / (u_curveLimits.w - u_curveLimits.z) - 1.0;
        //adjust point size based on proximity to circles
        float pointSize = 5.0;
        float rx = u_circle.z / u_ratio; // semi-axis x
        float ry = u_circle.z;           // semi-axis y
        
        for (int i = 0; i < u_numberOfCircles; i++) {
            //calculate ellipse equation (circle stretched by the aspect ratio)
            float centerX = u_circleCenters[i].x / u_ratio;
            float centerY = u_circleCenters[i].y;
            float ellipse = pow(a_position.x - centerX, 2.0) / pow(rx, 2.0) + pow(a_position.y - centerY, 2.0) / pow(ry, 2.0);
            //calculate variation based on distance to the ellipse to make it smoothly increase point size
            float variation = 1.0 - smoothstep(0.0, 1.0, ellipse);
            //increase point size based on the closest circle
            pointSize = max(pointSize, mix(5.0, 15.0, variation));
        }
        gl_PointSize = pointSize;
    }
    gl_Position = a_position;

}