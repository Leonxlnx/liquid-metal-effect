import React, { useEffect, useRef } from 'react';

// Shader Sources
const vertexShaderSource = `#version 300 es
precision mediump float;

in vec2 a_position;
out vec2 vUv;

void main() {
    vUv = .5 * (a_position + 1.);
    gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const liquidFragSource = `#version 300 es
precision mediump float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D u_image_texture;
uniform float u_time;
uniform float u_ratio;
uniform float u_img_ratio;
uniform float u_patternScale;
uniform float u_refraction;
uniform float u_edge;
uniform float u_patternBlur;
uniform float u_liquid;

#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846

vec3 mod289(vec3 x) { return x - floor(x * (1. / 289.)) * 289.; }
vec2 mod289(vec2 x) { return x - floor(x * (1. / 289.)) * 289.; }
vec3 permute(vec3 x) { return mod289(((x*34.)+1.)*x); }
float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1., 0.) : vec2(0., 1.);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0., i1.y, 1.)) + i.x + vec3(0., i1.x, 1.));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.);
    m = m*m;
    m = m*m;
    vec3 x = 2. * fract(p * C.www) - 1.;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130. * dot(m, g);
}

vec2 get_img_uv() {
    vec2 img_uv = vUv;
    img_uv -= .5;
    if (u_ratio > u_img_ratio) {
        img_uv.x = img_uv.x * u_ratio / u_img_ratio;
    } else {
        img_uv.y = img_uv.y * u_img_ratio / u_ratio;
    }
    float scale_factor = 1.;
    img_uv *= scale_factor;
    img_uv += .5;
    img_uv.y = 1. - img_uv.y;
    return img_uv;
}
vec2 rotate(vec2 uv, float th) {
    return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}
float get_color_channel(float c1, float c2, float stripe_p, vec3 w, float extra_blur, float b) {
    float ch = c2;
    float border = 0.;
    float blur = u_patternBlur + extra_blur;
    ch = mix(ch, c1, smoothstep(.0, blur, stripe_p));
    border = w[0];
    ch = mix(ch, c2, smoothstep(border - blur, border + blur, stripe_p));
    b = smoothstep(.2, .8, b);
    border = w[0] + .4 * (1. - b) * w[1];
    ch = mix(ch, c1, smoothstep(border - blur, border + blur, stripe_p));
    border = w[0] + .5 * (1. - b) * w[1];
    ch = mix(ch, c2, smoothstep(border - blur, border + blur, stripe_p));
    border = w[0] + w[1];
    ch = mix(ch, c1, smoothstep(border - blur, border + blur, stripe_p));
    float gradient_t = (stripe_p - w[0] - w[1]) / w[2];
    float gradient = mix(c1, c2, smoothstep(0., 1., gradient_t));
    ch = mix(ch, gradient, smoothstep(border - blur, border + blur, stripe_p));
    return ch;
}

void main() {
    vec2 uv = vUv;
    uv.y = 1. - uv.y;
    uv.x *= u_ratio;
    
    // Standard diagonal calculation
    float diagonal = uv.x - uv.y;
    
    float t = .001 * u_time;
    vec2 img_uv = get_img_uv();
    vec4 img = texture(u_image_texture, img_uv);
    vec3 color = vec3(0.);
    float opacity = 1.;
    
    // Pure Monochrome Colors (No tint)
    vec3 color1 = vec3(1.0, 1.0, 1.0); // Bright Silver/White
    vec3 color2 = vec3(0.05, 0.05, 0.05); // Deep Dark Metallic
    
    float edge = img.r;
    vec2 grad_uv = uv;
    grad_uv -= .5;
    float dist = length(grad_uv + vec2(0., .2 * diagonal));
    
    // Constant rotation to prevent warping on wide aspect ratios
    grad_uv = rotate(grad_uv, 0.25 * PI); 
    
    float bulge = pow(1.8 * dist, 1.2);
    bulge = 1. - bulge;
    bulge *= pow(uv.y, .3);
    float cycle_width = u_patternScale;
    float thin_strip_1_ratio = .12 / cycle_width * (1. - .4 * bulge);
    float thin_strip_2_ratio = .07 / cycle_width * (1. + .4 * bulge);
    float wide_strip_ratio = (1. - thin_strip_1_ratio - thin_strip_2_ratio);
    float thin_strip_1_width = cycle_width * thin_strip_1_ratio;
    float thin_strip_2_width = cycle_width * thin_strip_2_ratio;
    
    // Ensure full opacity inside the shape
    opacity = 1.0; 
    
    // Reduced noise frequency for LARGER, SMOOTHER ripples (less wrinkles)
    float noise = snoise(uv * 0.8 - t);
    
    edge += (1. - edge) * u_liquid * noise;
    float refr = 0.;
    refr += (1. - bulge);
    refr = clamp(refr, 0., 1.);
    
    // PATTERN DIRECTION
    float dir = grad_uv.x;
    dir += diagonal;
    
    // Increased wobble influence for "heavy liquid" feel
    dir -= 0.5 * noise;
    
    // Add subtle curvature based on Y and diagonal, but keep it smooth
    dir += .18 * (smoothstep(.1, .2, uv.y) * smoothstep(.4, .2, uv.y));
    dir += .03 * (smoothstep(.1, .2, 1. - uv.y) * smoothstep(.4, .2, 1. - uv.y));
    dir *= (.8 + .2 * pow(uv.y, 2.)); // Slight stretch
    
    dir *= cycle_width;
    dir -= t;
    
    // REFRACTION (3D Effect)
    float refr_base = refr * u_refraction;
    refr_base += 0.02 * bulge * noise;
    
    // Very slight offset for "Silver" feel, but not enough to look like a rainbow
    float refr_r = refr_base;
    float refr_g = refr_base * 0.99; 
    float refr_b = refr_base * 0.98;

    vec3 w = vec3(thin_strip_1_width, thin_strip_2_width, wide_strip_ratio);
    // Smooth the stripe width based on height to give 3D volume
    w[1] -= .02 * smoothstep(.0, 1., bulge);

    // Calculate R, G, B channels with almost identical paths
    float stripe_r = mod(dir + refr_r, 1.);
    float stripe_g = mod(dir + refr_g, 1.);
    float stripe_b = mod(dir + refr_b, 1.);
    
    float r = get_color_channel(color1.r, color2.r, stripe_r, w, 0.02 + .03 * bulge, bulge);
    float g = get_color_channel(color1.g, color2.g, stripe_g, w, 0.02 + .03 * bulge, bulge);
    float b = get_color_channel(color1.b, color2.b, stripe_b, w, 0.02 + .03 * bulge, bulge);
    
    color = vec3(r, g, b);
    
    fragColor = vec4(color, opacity);
}`;

// Helper to parse image
export const parseLogoImage = async (file: File) => {
    return new Promise<{ imageData: ImageData }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject('No context');
                ctx.drawImage(img, 0, 0);
                resolve({ imageData: ctx.getImageData(0, 0, img.width, img.height) });
            };
            img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

interface MetallicPaintProps {
    imageData: ImageData;
    params: {
        edge: number;
        patternBlur: number;
        patternScale: number;
        refraction: number;
        speed: number;
        liquid: number;
    };
    className?: string;
}

const MetallicPaint: React.FC<MetallicPaintProps> = ({ imageData, params, className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const paramsRef = useRef(params);

    useEffect(() => {
        paramsRef.current = params;
    }, [params]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const gl = canvas.getContext('webgl2');
        if (!gl) return;

        // Compile shaders
        const createShader = (type: number, source: string) => {
            const shader = gl.createShader(type);
            if (!shader) return null;
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        };

        const vert = createShader(gl.VERTEX_SHADER, vertexShaderSource);
        const frag = createShader(gl.FRAGMENT_SHADER, liquidFragSource);
        if (!vert || !frag) return;

        const program = gl.createProgram();
        if (!program) return;
        gl.attachShader(program, vert);
        gl.attachShader(program, frag);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program));
            return;
        }
        gl.useProgram(program);

        // Attributes
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            -1, 1,
            1, -1,
            1, 1,
        ]), gl.STATIC_DRAW);

        const positionLoc = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

        // Texture
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, imageData.width, imageData.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageData.data);

        // Uniform Locations
        const uImageTextureLoc = gl.getUniformLocation(program, 'u_image_texture');
        const uTimeLoc = gl.getUniformLocation(program, 'u_time');
        const uRatioLoc = gl.getUniformLocation(program, 'u_ratio');
        const uImgRatioLoc = gl.getUniformLocation(program, 'u_img_ratio');
        const uPatternScaleLoc = gl.getUniformLocation(program, 'u_patternScale');
        const uRefractionLoc = gl.getUniformLocation(program, 'u_refraction');
        const uEdgeLoc = gl.getUniformLocation(program, 'u_edge');
        const uPatternBlurLoc = gl.getUniformLocation(program, 'u_patternBlur');
        const uLiquidLoc = gl.getUniformLocation(program, 'u_liquid');

        let animationFrameId: number;
        
        // Animation State
        let lastTime = performance.now();
        let totalTime = 0;
        // Initialize with initial props to prevent jump on start
        const currentParams = { ...paramsRef.current };

        const render = () => {
            const targetParams = paramsRef.current;
            const now = performance.now();
            const dt = now - lastTime;
            lastTime = now;
            
            // LERP Factor: 0.05 provides a very smooth, organic transition
            const lerp = 0.05;

            // Smoothly interpolate all parameters
            currentParams.speed += (targetParams.speed - currentParams.speed) * lerp;
            currentParams.liquid += (targetParams.liquid - currentParams.liquid) * lerp;
            currentParams.patternScale += (targetParams.patternScale - currentParams.patternScale) * lerp;
            currentParams.refraction += (targetParams.refraction - currentParams.refraction) * lerp;
            currentParams.edge += (targetParams.edge - currentParams.edge) * lerp;
            currentParams.patternBlur += (targetParams.patternBlur - currentParams.patternBlur) * lerp;

            // Accumulate time based on the SMOOTHED speed
            // This prevents the "jump" when speed changes, because we add relative time
            // rather than calculating absolute time * speed.
            totalTime += dt * currentParams.speed;

            // Resize canvas if needed
            const displayWidth = canvas.clientWidth;
            const displayHeight = canvas.clientHeight;
            if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
                canvas.width = displayWidth;
                canvas.height = displayHeight;
                gl.viewport(0, 0, canvas.width, canvas.height);
            }

            // Uniforms
            gl.uniform1i(uImageTextureLoc, 0);
            gl.uniform1f(uTimeLoc, totalTime);
            gl.uniform1f(uRatioLoc, canvas.width / canvas.height);
            gl.uniform1f(uImgRatioLoc, imageData.width / imageData.height);
            gl.uniform1f(uPatternScaleLoc, currentParams.patternScale);
            gl.uniform1f(uRefractionLoc, currentParams.refraction);
            gl.uniform1f(uEdgeLoc, currentParams.edge);
            gl.uniform1f(uPatternBlurLoc, currentParams.patternBlur);
            gl.uniform1f(uLiquidLoc, currentParams.liquid);

            gl.drawArrays(gl.TRIANGLES, 0, 6);
            animationFrameId = requestAnimationFrame(render);
        };
        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
            gl.deleteProgram(program);
            gl.deleteShader(vert);
            gl.deleteShader(frag);
            gl.deleteTexture(texture);
            gl.deleteBuffer(positionBuffer);
        };
    }, [imageData]);

    return <canvas ref={canvasRef} className={className} />;
};

export default MetallicPaint;