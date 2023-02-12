//FRAGMENT SHADER

varying vec3 awayFromTriangle;
varying vec2 textureCoordinate;
varying vec3 toCamera;

void main() {
	// loops
	#pragma unroll_loop_start
	for ( int i = 0; i < 10; i ++ ) {

		// ...

	}
	#pragma unroll_loop_end

	// gamma correction
	float screenGamma = 2.2;
	gl_FragColor = pow(gl_FragColor / 2., vec4(1.0 / screenGamma));
}


