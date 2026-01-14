#version 300 es
//Phong Vertex Shader

const int MAX_LIGHTS = 8;

in vec4 a_position; // vertex position in modelling coordinates
in vec4 a_normal; // vertex normal in modelling coordinates
uniform mat4 u_mModelView; // model-view transformation
uniform mat4 u_mNormals; // model-view transformation for normals
uniform mat4 u_mProjection; // projection matrix
out vec3 v_normal; // normal vector in camera space
out vec3 v_viewer; // View vector in camera space 

void main() {
    // compute position in camera frame
    vec3 posC = (u_mModelView * a_position).xyz;

    // compute normal in camera frame
    v_normal = (u_mNormals * a_normal).xyz;
    
    // Compute the view vector
    v_viewer = -posC; // Perspective projection
    // Compute vertex position in clip coordinates (as usual)
    gl_Position = u_mProjection * u_mModelView * a_position;
}