//VERTEX SHADER

// minimal vertex shader for physically based rendering 
varying vec3 awayFromTriangle;
varying vec2 textureCoordinate;
varying vec3 toCamera;

void main(void) {
	// direction away from the this corner of the triangle
	awayFromTriangle = normalMatrix * normal;

	// map from this corner of the triangle to the texture
	textureCoordinate = uv;

	// direction from this corner of the triangle to the camera 
	toCamera = cameraPosition - position;

	// where you see triangles when you look through the camera
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
}
