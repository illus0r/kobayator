#version 300 es
precision highp float;
uniform sampler2D tx;
uniform sampler2D img;
uniform float frame;
uniform float pass;
uniform float time;
uniform float alpha;
uniform vec2 res;
uniform vec4 rectSrc;
uniform vec4 rectDst;
uniform vec2 mouse;
uniform float rndjs[4];
out vec4 o;

void main(){
	/* vec2 uv = (gl_FragCoord.xy*2.-res)/res.y; */
	vec2 uv=gl_FragCoord.xy/res.xy;
	o=texture(img,uv);
	/* if( */
	/* 		gl_FragCoord.x>rectDst.x&& */
	/* 		gl_FragCoord.x<rectDst.z&& */
	/* 		(res.y-gl_FragCoord.y)>rectDst.y&& */
	/* 		(res.y-gl_FragCoord.y)<rectDst.w */
	/* ){ */
		vec2 duv = (rectSrc.xy-rectDst.xy)/res;
		o=texture(img,uv+duv*vec2(1,-1));
		/* o*=.8; */
		/* o.r = duv.x; */
		/* o.g = duv.y; */
	/* } */

	o.a=1.;
}
