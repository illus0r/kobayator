"use strict";

import {loadText} from './shdr/loadText.js'
import {Gl} from './shdr/gl.js'
import {Pr} from './shdr/pr.js'
import {Tx} from './shdr/tx.js'
import {rsz} from './shdr/rsz.js'

let isPlaying = true
let rndjs=[...Array(4)].map(_=>[fxrand()])
let mouse = [.5, .5];
let palette = [ "#000001", "#1D2B52", "#7E2552", "#008750", "#AB5235", "#5F574E", "#C2C3C8", "#FFF1E7", "#FF014D", "#FFA300", "#FFEC28", "#01E435", "#30ADFF", "#83769D", "#FF77A7", "#FFCCAB",
].sort(_=>fxrand()-.5).slice(0,5)
palette = palette.map(color => {
  color = color.slice(1)
  color = color.match(/(.{2})/g).map(v=>Number("0x"+v)/255)
  return color
})
console.log('palette:',palette)

let gl = new Gl('canvas')
let pr = new Pr(gl,loadText('./shader.frag'))
let prDr = new Pr(gl,`#version 300 es
			precision highp float;
			uniform sampler2D tx;
			uniform vec2 res;
			uniform float time;
			out vec4 o;
			void main(){
				vec2 uv = gl_FragCoord.xy/res;
				o = texture(tx,fract(uv));
				// o=vec4(0.,1.,0.,1.);
				o.a=1.;
			}`)

let u_tx=[]//.map(_=>new Tx(gl, tx_opt))
// window.addEventListener('resize',resize, true)
// window.dispatchEvent(new Event('resize'))
// resize()

let u_tx_img = new Tx(gl, {src: './img.jpg', loc:3, filter:gl.LINEAR }, (tx)=>{// ← 1
	gl.canvas.width = tx.w
	gl.canvas.height = tx.h
	u_tx=[0,0].map((_,i)=>new Tx(gl, {w:tx.w,h:tx.h,loc:i}))

	for(let i=0;i<2;i++){
		pr.uf({
			'res': [u_tx[0].w,u_tx[0].h],
			'tx': u_tx[0],
			'img': tx,
			'rectSrc': rectSrc,
			'rectDst': rectDst,
		})
		pr.draw(u_tx[1])
		u_tx.reverse()
	}

	frame('init')
})

window.addEventListener('mousemove', e=>{
	let [w,h] = [gl.canvas.width, gl.canvas.height]
	mouse = [e.clientX/w*2-1, (1-e.clientY/h)*2-1]
})

let timeInit=+new Date()
let timePrev=timeInit
let timeNew=timeInit
let u_frame=0

let state = 'select' // or 'draw'
let rectSrc = [0,0,0,0]
let rectDst = [0,0,0,0]
let div = document.querySelector('.select')


// first select region, then draw
//
// select region
let mousePrev = [0,0]

document.addEventListener('mousedown', e=>{
	if(state == 'select'){
		rectSrc[0] = rectSrc[2] = e.pageX
		rectSrc[1] = rectSrc[3] = e.pageY
		mousePrev = [e.pageX, e.pageY]
		div.style.display = 'block'
		updateDiv()
	}
	else if(state == 'draw'){
		div.style.display = 'none'
	}
})
document.addEventListener('mousemove', e=>{
	if(state == 'select'){
		rectSrc[2] = e.pageX
		rectSrc[3] = e.pageY
		updateDiv()
	}
	else if(state == 'draw'){// ← 2
		// if mouse is down, draw
		if(e.buttons == 1){
			// get mouse movement
			let dx=e.pageX-mousePrev[0]
			let dy=e.pageY-mousePrev[1]
			let len = Math.hypot(dx,dy) * 4

			gl.enable(gl.SCISSOR_TEST)
			// gl.enable(gl.BLEND)
			// let alpha = 1.
			// gl.blendColor(alpha, alpha, alpha, .5);
			// gl.blendFunc(gl.CONSTANT_COLOR, gl.ONE_MINUS_CONSTANT_COLOR);

			for(let i=0;i<len;i++){
				rectDst[0] += dx/len
				rectDst[1] += dy/len
				rectDst[2] += dx/len
				rectDst[3] += dy/len

				gl.scissor(rectDst[0], gl.canvas.height-rectDst[3], rectDst[2]-rectDst[0], rectDst[3]-rectDst[1])

				pr.uf({
					'res': [u_tx[0].w,u_tx[0].h],
					'tx': u_tx[0],
					'img': u_tx_img,
					'rectSrc': rectSrc,
					'rectDst': rectDst,
				})
				pr.draw(u_tx[1])
				u_tx.reverse()
			}
			frame()
		}
	}
	mousePrev = [e.pageX, e.pageY]
})
document.addEventListener('mouseup', e=>{
	if(state == 'select'){
		[rectSrc[0], rectSrc[2]] = [Math.min(rectSrc[0], rectSrc[2]), Math.max(rectSrc[0], rectSrc[2])];
		[rectSrc[1], rectSrc[3]] = [Math.min(rectSrc[1], rectSrc[3]), Math.max(rectSrc[1], rectSrc[3])];
		rectDst = [...rectSrc]
		state = 'draw'
	}
	else if(state == 'draw'){
		state = 'select'
	}
})

function updateDiv(){
	div.style.left = Math.min(rectSrc[0], rectSrc[2]) + 'px'
	div.style.top = Math.min(rectSrc[1], rectSrc[3]) + 'px'
	div.style.width = Math.abs(rectSrc[2] - rectSrc[0]) + 'px'
	div.style.height = Math.abs(rectSrc[3] - rectSrc[1]) + 'px'
}

function frame(init) {// ← 3
	timePrev=timeNew
	timeNew=+new Date()
	let time = (timeNew-timeInit)/1000
	u_frame++

	if(isPlaying && u_tx.length > 0){
		gl.disable(gl.SCISSOR_TEST)
		gl.disable(gl.BLEND)
		console.log('loc',u_tx[0].loc)
		prDr.uf({
			'time': time,
			'res': [gl.canvas.width,gl.canvas.height],
			'tx': u_tx[0],
			'frame': u_frame,
			'rndjs': rndjs,
		})
		prDr.draw()
	}
	else{ 
		timeInit+=timeNew-timePrev
	}
}

document.addEventListener('keydown', (event) => {
	if (event.code === 'Space') {
		isPlaying=!isPlaying
		return
	}
}, false)

// function resize(){
// 	if(u_tx.length > 0){
// 		u_tx.forEach(tx=>gl.deleteTexture(tx))
// 	}
// 	let [w,h] = rsz(gl)
// 	u_tx=[0,0].map((_,i)=>new Tx(gl, {w:w,h:h,loc:i}))
// }

function saveImage (e){
	let downloadLink = document.createElement('a');
	downloadLink.setAttribute('download', `${fxhash}.png`);
	// let canvas = document.getElementById('Canvas');
	let canvas = document.querySelector('canvas')
	canvas.toBlob(function(blob) {
		let url = URL.createObjectURL(blob);
		downloadLink.setAttribute('href', url);
		downloadLink.click();
	});
}
// save only if key S is pressed
document.addEventListener('keydown', e=>e.code=='KeyS'?saveImage():0)

