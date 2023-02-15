//FRAGMENT SHADER

struct Light
{
    float intensity;
    vec3 direction;
    vec3 color;
};

const float pi = 3.1415926535897932384626433832795;

varying vec3 awayFromTriangle;
varying vec3 toCamera;

// distribution of reflective microfacets on a surface
// see: https://en.wikipedia.org/wiki/Specular_highlight#Beckmann_distribution
float beckmannDistribution(float HN)
{
    // roughness
    const float m = 0.5;
    const float m2 = m * m;
    
    float cos2 = HN * HN;
    float cos4 = cos2 * cos2;
    
    float num = exp((cos2 - 1.0) / (cos2 * m2));
    float den = pi * m2 * cos4;
    
    float k = num / den;
    
    return k;
}

// amount of light reflected at boundary of air and object 
// see: https://en.wikipedia.org/wiki/Schlick%27s_approximation
float schlickApproximation(float VN)
{
    /// refractive indices
    // air
    const float n_1 = 1.000293;
    // diamond
    const float n_2 = 2.417;
    
    float R_0 = (n_1 - n_2) / (n_1 + n_2);
    R_0 *= R_0;
    
    float incidence = 1.0 - VN;
    incidence *= incidence * incidence * incidence * incidence;
    float R = R_0 + (1.0 - R_0) * incidence;
    
    return R;
}

// specular reflections off a rough surface
// see: https://en.wikipedia.org/wiki/Specular_highlight#Cook%E2%80%93Torrance_model
vec3 cookTorrance(vec3 V, vec3 N, Light L)
{
    vec3 H = normalize(V + L.direction);
    float VN = dot(V, N);
    float NL = dot(N, L.direction);
    float HN = dot(H, N);
    float VH = dot(V, H);
    
    float g = 2.0 * HN / VH;
    float G = 1.0;
    G = min(G, g * VN);
    G = min(G, g * NL);
    
    float D = beckmannDistribution(HN);
    float F = schlickApproximation(VN);
    
    float k = 0.25 * D * F * G / (VN * NL);
    
    vec3 color = k * L.intensity * L.color;

	 color = clamp(color, 0.0, 1.0);
        
    return color;
}

// diffuse reflections on a rough surface
// see: https://en.wikipedia.org/wiki/Oren%E2%80%93Nayar_reflectance_model
float orenNayar(vec3 normal, Light light, vec3 eye)
{
    // roughness
    const float sigma = 0.3;
    const float sigma2 = sigma * sigma;
    const float A = 1.0 - 0.5 * sigma2 / (sigma2 + 0.33);
    const float B = 0.45 * sigma2 / (sigma2 + 0.09);
    
    float eyeNormalProjection = dot(eye, normal);
    float lightNormalProjection = -dot(light.direction, normal);
    float thetaEye = acos(eyeNormalProjection);
    float thetaLight = acos(lightNormalProjection);
    float alpha = max(thetaEye, thetaLight);
    float beta = min(thetaEye, thetaLight);
    vec3 eyeNormalRejection = eye - eyeNormalProjection * normal;
    vec3 lightNormalRejection = eye - lightNormalProjection * normal;
    vec3 axis = cross(vec3(0.0, 1.0, 0.0), normal);
    float phiEye = acos(dot(eyeNormalRejection, axis));
    float phiLight = acos(dot(lightNormalRejection, axis));
    
    float L = A + B * max(cos(phiEye - phiLight), 0.0) * sin(alpha) * tan(beta);
    L *= max(lightNormalProjection, 0.0);
    L *= light.intensity;

	 L = max(L, 0.);
    
    return L;
}

// scattering of light below the surface of the object
float sss(Light light, float orenNayar)
{
    const float scatterWidth = 0.3;
    const float scatterWidth2 = 2.0 * scatterWidth;
    float s = light.intensity * smoothstep(0.0, scatterWidth, orenNayar) * smoothstep(scatterWidth2, scatterWidth, orenNayar);
        
    return s;
}

void main() {
	// light
	Light lights[2];
	lights[0] = Light(.14, normalize(vec3(1., 1., 1.)), vec3(1., 1., 1.));
	lights[1] = Light(.07, normalize(vec3(-1., .5, 1.)), vec3(1., 1., 1.));

	gl_FragColor.rgb = vec3(.1);
	Light light;
	vec3 specular;
	float d;
	vec3 diffuse;
	vec3 scattered;

	// specular reflections
	#pragma unroll_loop_start
	for ( int i = 0; i < 2; i ++ ) {
		light = lights[i];

		// ...
		specular = cookTorrance(toCamera, awayFromTriangle, light);

		//  diffuse reflections
		d = orenNayar(awayFromTriangle, light, toCamera);
		diffuse = vec3(d);

		// subsurface scattering
		scattered = vec3(sss(light, d));

		// 
		gl_FragColor.rgb += diffuse + specular + scattered;
	}
	#pragma unroll_loop_end

	gl_FragColor.a = 1.;

	float screenGamma = 2.2;
	gl_FragColor = pow(gl_FragColor / 2., vec4(1.0 / screenGamma));
}
