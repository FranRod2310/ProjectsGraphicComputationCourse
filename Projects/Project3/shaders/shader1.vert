#version 300 es
//Gouraud Vertex Shader

const int MAX_LIGHTS = 8;

struct LightInfo {
    // Light colour intensities
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;

    // Light brightness multiplier
    float brightness;
    
    // Light geometry
    vec4 position;  // Position/direction of light (in camera coordinates)

    // Spotlight properties
    bool is_spotlight; // Is this light a spotlight
    vec3 axis;      // Direction of spotlight axis 
    float aperture; // Spotlight aperture 
    float cutoff;   // Spotlight cutoff 
};

// Material properties
struct MaterialInfo {
    vec3 Ka;
    vec3 Kd;
    vec3 Ks;
    float shininess;
};

uniform int u_n_lights; // Effective number of lights used

uniform LightInfo u_lights[MAX_LIGHTS]; // The array of lights present in the scene
uniform MaterialInfo u_material;        // The material of the object being drawn

in vec4 a_position; // vertex position in modelling coordinates
in vec4 a_normal; // vertex normal in modelling coordinates
uniform mat4 u_mModelView; // model-view transformation
uniform mat4 u_mNormals; // model-view transformation for normals
uniform mat4 u_mProjection; // projection matrix
out vec3 v_color; // color to be passed to the fragment shader

void main() {
    vec3 result = vec3(0.0, 0.0, 0.0);
    // compute position in camera frame
    vec3 posC = (u_mModelView * a_position).xyz;
    // Compute the view vector
    vec3 V = normalize(-posC);
    // compute normal in camera frame
    vec3 N = normalize((u_mNormals * a_normal).xyz);
    vec3 L[MAX_LIGHTS];
    for (int i=0; i<u_n_lights; i++) { 
        // compute light vector in camera frame
        if(u_lights[i].position.w == 0.0)
            //the direction of the light is opposite to the position vector
            L[i] = normalize(-u_lights[i].position.xyz);
        else
            L[i] = normalize(u_lights[i].position.xyz - posC);
    }

    //convert material colors from [0,255] to [0,1]
    vec3 ka, kd, ks;
    for (int c = 0; c < 3; c++) {
        ka[c] = u_material.Ka[c] / 255.0;
        kd[c] = u_material.Kd[c] / 255.0;
        ks[c] = u_material.Ks[c] / 255.0;
    }

    for (int i = 0; i < u_n_lights; i++) {
        //convert light colors from [0,255] to [0,1]
        vec3 ambient, diffuse, specular;
        for (int c = 0; c < 3; c++) {
            ambient[c] = u_lights[i].ambient[c] / 255.0;
            diffuse[c] = u_lights[i].diffuse[c] / 255.0;
            specular[c] = u_lights[i].specular[c] / 255.0;
        }
        //calculate diffuse and specular factors
        //make sure there is no diffuse if the light is behind the surface
        float diffuseFactor = max( dot(L[i],N), 0.0 );
        vec3 R = normalize(2.0 * diffuseFactor * N - L[i]);
            
        float specularFactor = pow(max(dot(R,V), 0.0), u_material.shininess);
        //if is spotlight, apply spotlight effect
        if(u_lights[i].is_spotlight){
            vec3 S = normalize(-u_lights[i].axis);
            float cosAlpha = max(dot(L[i], S), 0.0);
            float cosAperture = cos(radians(u_lights[i].aperture));
            if(cosAlpha < cosAperture){
                diffuseFactor = 0.0;
                specularFactor = 0.0;
            } 
            //apply intensity attenuation and make sure it gives a no error for cosAlpha = 0
            float intensityAtt = pow(max(cosAlpha,0.0001), u_lights[i].cutoff);
            diffuseFactor *= intensityAtt;
            specularFactor *= intensityAtt;
        }

        //calculate ambient, diffuse and specular components
        vec3 resAmbient = ka * ambient;
        vec3 resDiffuse = kd * diffuse * diffuseFactor;
        vec3 resSpecular = ks * specular * specularFactor;

        //if light is behind the surface, no specular component
        if(dot(L[i],N) < 0.0) {
            resSpecular = vec3(0.0, 0.0, 0.0);
        }
        //add this light contribution to the result
        result += resAmbient + (resDiffuse + resSpecular) * u_lights[i].brightness; 
    }
    // Compute vertex position in clip coordinates (as usual)
    gl_Position = u_mProjection * u_mModelView * a_position;

    v_color = result;
}