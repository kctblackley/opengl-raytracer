#version 330 core

#define AMBIENT_LIGHTING 0.7
#define SPEC_STRENGTH 0.5 // Basic constant for specular shading, universal to all objects
#define MAX_DEPTH 50 // Number of iterations allowed at most
#define PI 3.14159265358979f
#define UNUSED_ID -1 // For default intersections, this is an unused ID value
#define SHADOW_ACNE 1.175494351e-38 // Small constant to prevent self-shadowing
#define TORUS_CONSTANT 2.34 // Used to deal with bizarre noise caused by tori shapes
// Enum for material types
#define LAMBERTIAN 0
#define METAL 1
#define DIELECTRIC 2

// To switch between types of skybox (top takes precedence)
#define IMAGE_SKYBOX false
#define BASIC_SKY true
#define SOLID_SKY vec3(0.3, 0.3, 0.3)

out vec4 FragColor;

// Uniforms to handle viewport
uniform vec3 cameraPos;
uniform vec3 topLeft;
uniform vec3 u;
uniform vec3 v;
uniform int screenWidth;
uniform int screenHeight;

// Source for intersection algorithms: https://iquilezles.org/articles/intersectors/

struct Material {
	int type; // LAMBERTIAN, METAL, DIELECTRIC
	float variable; // reflectance for metals, refractive index for dielectrics
	vec3 colour;
	float spec; // Specular shading constant
};

struct Sphere {
	vec3 o; // origin of Sphere
	float radius;
	Material material;
	int id;
};

Sphere spheres[] = Sphere[](
	//Sphere(vec3(2.0, -3.0, -2.0), 0.1, Material(LAMBERTIAN, 0.7f, vec3(0.1, 0.2, 0.5), 32.0f), 2),
	//Sphere(vec3(0.0, 1000.5, -1.2), 1000, Material(METAL, 0.5f, vec3(0.1, 0.2, 0.5), 32.0f), 3),
	Sphere(vec3(0.0, 0.0, -1.2), 0.4, Material(LAMBERTIAN, 1.0f, vec3(0.1, 0.2, 0.5), 32.0f), 4),
	Sphere(vec3(-1.0, 0.0, -0.3), 0.5, Material(LAMBERTIAN, 1.33f, vec3(0.8, 0.8, 0.8), 32.0f), 5),
	Sphere(vec3(1.0, 0.0, -1.0), 0.5, Material(METAL, 0.2f, vec3(0.8, 0.6, 0.2), 32.0f), 6),
	Sphere(vec3(0.0, 1000.5, 0.0), 1000.0, Material(METAL, 0.2f, vec3(0.6, 0.6, 0.6), 256.0f), 100)
);

struct Torus {
	vec3 o; // origin of Torus
	float radius; // radius of donut itself (from centre of torus to outer edge of torus)
	float ringRadius; // thickness of ring cross-sections making up torus
	Material material;
	int id;
};

Torus tori[] = Torus[](
	Torus(vec3(2.0, -3.0, -2.0), 1.5, 0.9, Material(DIELECTRIC, 0.9f, vec3(0.2, 0.2, 0.2), 8.0f), 9)
);

struct Box {
	// min and max represent opposite corners of the box (box created from min point to max point)
	vec3 min;
	vec3 max;
	Material material;
	int id;
};

Box boxes[] = Box[](
	Box(vec3(-2.0, -2.0, -6.0), vec3(2.0, -6.0, -10.0), Material(DIELECTRIC, 1.1f, vec3(0.2, 0.7, 0.5), 32.0f), 7)
	//Box(vec3(-1000.0, 0.5, -1000.0), vec3(1000.0, 1.5, 1000.0), Material(METAL, 0.5f, vec3(0.8, 0.8, 0.8), 32.0f), 8)
);

struct Triangle {
	vec3 v0;
	vec3 v1;
	vec3 v2;
	Material material;
	int id;
};

Triangle triangles[] = Triangle[](
	Triangle(vec3(-5.0, -15.0, -5.0), vec3(0.0, -14.5, 0.0), vec3(-5.0, -12.0, 5.0), Material(DIELECTRIC, 1.2f, vec3(0.5, 0.5, 0.5), 32.0f), 10)
);

// All possible normals for a box (required for normal calculation)
vec3 normals[] = vec3[](
	vec3(0.0f, 1.0f, 0.0f),
	vec3(0.0f, -1.0f, 0.0f),
	vec3(1.0f, 0.0f, 0.0f),
	vec3(-1.0f, 0.0f, 0.0f),
	vec3(0.0f, 0.0f, 1.0f),
	vec3(0.0f, 0.0f, -1.0f)
);

struct PointLight {
	vec3 pos;
	vec3 colour;

	float constant;
	float linear;
	float quadratic;

	bool activeLight; // is the light turned on?
};

PointLight pointLights[] = PointLight[](
	PointLight(vec3(2.0, -10.0, -2.0), vec3(0.7f, 0.7f, 0.7f), 0.2f, 0.09, 0.032f, true)
);

struct DirectionalLight {
	vec3 dir;
	vec3 colour;
	bool activeLight; // is the light turned on?
};

DirectionalLight directionalLights[] = DirectionalLight[](
	//DirectionalLight(vec3( 0.0f, -1.0f,  0.0f), vec3(0.6f, 0.6f, 0.6f), true),
	//DirectionalLight(vec3( 0.0f,  1.0f,  0.0f), vec3(0.6f, 0.6f, 0.6f), true),
	//DirectionalLight(vec3(-1.0f,  0.0f,  0.0f), vec3(0.8f, 0.8f, 0.8f), true),
	//DirectionalLight(vec3( 1.0f,  0.0f,  0.0f), vec3(0.8f, 0.8f, 0.8f), true),
	//DirectionalLight(vec3( 0.0f,  0.4f, -1.0f), vec3(0.8f, 0.8f, 0.8f), true),
	DirectionalLight(vec3( 0.0f,  -0.7f,  1.0f), vec3(0.8f, 0.8f, 0.8f), false)
);

struct Ray {
	vec3 dir;
	vec3 o; // ray origin
};

struct Intersection {
	vec3 pos; // position where intersection occurred
	vec3 normal; // normal at intersected surface
	float t; // length of ray that intersected with the surface
	Material material; // material of surface intersected with
	int id; // id of object intersected with
	bool frontFace; // does the ray that intersected with the surface originate from outside the intersected object?
};

#define MAX_INTERSECTION 3.402823466e+38 // max length an interescted ray is allowed to have
#define DEFAULT_INTERSECTION Intersection(vec3(0.0f), vec3(1.0f), MAX_INTERSECTION, Material(LAMBERTIAN, 0.0f, vec3(0.0f), 0.0f), UNUSED_ID, true)
// Value to initialise intersections (to avoid uninitialisation)

Intersection findIntersection(Ray r, int id, bool isBlockCheck); // find surface that a ray intersects with
Intersection calculatePhenomena(Ray r, Intersection intersection); // calculate results of reflection and refraction at point of intersection with a surface

// Sphere intersections
Intersection hitSphere(Ray r, Sphere s); // detect intersection with single sphere
Intersection intersectSpheres(Ray r, Intersection intersection, int id, bool isBlockCheck); // find nearest intersected sphere

// Torus intersection
Intersection hitTorus(Ray nR, Torus tr); // detect intersection with single torus
Intersection intersectTori(Ray r, Intersection intersection, int id, bool isBlockCheck); // find nearest intersected torus

// Box intersection
Intersection hitBox(Ray r, Box b); // detect intersection with single box
Intersection intersectBoxes(Ray r, Intersection intersection, int id, bool isBlockCheck); // find nearest intersected box

// Triangle intersection
Intersection hitTriangle(Ray nR, Triangle tri); // detect intersection with single torus
Intersection intersectTriangles(Ray r, Intersection intersection, int id, bool isBlockCheck); // find nearest intersected torus

float magSquared(vec3 vec); // get length of vector squared
float mag(vec3 vec); // get length of vector

vec3 shade(Intersection intersection, Ray ray); // apply lighting to a point at which an intersection has occurred

vec3 getSkybox(vec3 dir); // Get colour from skybox texture given direction of a ray that failed all intersections

// Skybox and object textures
uniform sampler2D skybox;
uniform sampler2D texture1;
uniform sampler2D texture2;
uniform sampler2D texture3;
uniform sampler2D texture4;
uniform sampler2D texture5;
uniform sampler2D texture6;
uniform sampler2D texture7;
uniform sampler2D texture8;
uniform sampler2D texture9;
uniform sampler2D texture10;
uniform sampler2D texture11;
uniform sampler2D texture12;
uniform sampler2D texture13;
uniform sampler2D texture14;
uniform sampler2D texture15;
uniform sampler2D texture16;

void main() {
	// Generate ray for pixel being rendered and find intersection
	Ray ray = Ray(normalize((topLeft + (gl_FragCoord.x * u) + (gl_FragCoord.y * v)) - cameraPos), cameraPos);
	Intersection intersection = findIntersection(ray, UNUSED_ID, false);

	// If intersection occurred within relevant range
	if (intersection.t < MAX_INTERSECTION && intersection.t > 0) {
		// Apply reflection and refraction to intersection (if relevant)
		intersection = calculatePhenomena(ray, intersection);
		FragColor = vec4(shade(intersection, ray), 1.0f);
	} else {
		// Ray failed intersection, so get skybox texture instead
		FragColor = vec4(getSkybox(ray.dir), 1.0f);
	}
}

Intersection findIntersection(Ray r, int id, bool isBlockCheck) {
	// isBlockCheck is used to toggle whether dielectric objects should be ignored (dielectrics do not cast shadows)
	// Find valid intersection (will intersect all types of shape until one is found/not found)
	Ray nr = Ray(normalize(r.dir), r.o);
	Intersection intersection = DEFAULT_INTERSECTION;
	intersection = intersectSpheres(nr, intersection, id, isBlockCheck);
	intersection = intersectBoxes(nr, intersection, id, isBlockCheck);
	intersection = intersectTori(nr, intersection, id, isBlockCheck);
	intersection = intersectTriangles(nr, intersection, id, isBlockCheck);
	return intersection;
}

// Mix struct is used to create array of all colours and materials a ray hits during reflection and refraction
// Makes up a 'stack' (implemented statically), and Mix objects are popped during calculation of final colour of pixel
// Exists to manage lack of recursion in GLSL
struct Mix {
	vec3 colour;
	Material material;
};

// Refraction algorithm sourced from Raytracing in One Weekend (Peter Shirley)
vec3 refract(vec3 dir, vec3 normal, float refractiveIndex, bool frontFace) {
	float ri = refractiveIndex;
	if (frontFace) {
		ri = 1.0 / refractiveIndex;
	}
	float cos = min(dot(-dir, normal), 1.0);
	float sin = sqrt(1.0 - (cos*cos));
	if (ri * sin > 1.0) {
		return reflect(normalize(dir), normal);
	}
	vec3 perp = ri * (dir + (cos * normal));
	vec3 parallel = -sqrt(abs(1.0 - magSquared(perp))) * normal;
	return perp + parallel;
}

// Determine effect of reflection and refraction at a given point of intersection
Intersection calculatePhenomena(Ray r, Intersection intersection) {
	// Nothing occurs if it is a Lambertian material, so return the intersection as is
	if (intersection.material.type == LAMBERTIAN) {
		return intersection;
	}
	Intersection calculated = intersection;
	bool finished = false;
	Ray nextRay = r;
	Intersection curr = intersection;
	Material prevMaterial = intersection.material;
	Mix mixes[MAX_DEPTH]; // Create stack for colour mixing
	int ptr = 0;
	int depth = 0;
	while (depth < MAX_DEPTH && !finished) { // Repeat reflections and refractions until a Lambertian material has been intersected with or a ray has failed to make any intersections
		if (curr.material.type == METAL) { // if metal, reflect the ray
			nextRay = Ray(reflect(normalize(nextRay.dir), curr.normal), curr.pos);
		}
		if (curr.material.type == DIELECTRIC) { // if dielectric, refract the ray
			nextRay = Ray(refract(normalize(nextRay.dir), curr.normal, curr.material.variable, curr.frontFace), curr.pos);
		}
		prevMaterial = curr.material; // save material of previous intersection (as material a reflection/refraction originates from is needed for calculations)
		curr = findIntersection(nextRay, curr.id, false); // find intersections with new reflected/refracted ray
		if (curr.t < MAX_INTERSECTION) { // if 
			mixes[ptr] = Mix(shade(curr, nextRay), prevMaterial);
			if (curr.material.type == LAMBERTIAN) {
				finished = true;
			}
			if (!finished) {
				ptr++;
				depth++;
			}
		} else { // if intersection 
			mixes[ptr] = Mix(getSkybox(nextRay.dir), prevMaterial);
			finished = true;
		}
	}
	vec3 colour = mixes[ptr].colour;
	while (ptr >= 0) {
		if (ptr == 0) {
			colour = mix(intersection.material.colour, colour, mixes[ptr].material.variable);
		} else {
			colour = mix(mixes[ptr - 1].colour, colour, mixes[ptr].material.variable);
		}
		ptr--;
	}
	calculated.material.colour = colour;
	return calculated;
}

Intersection hitSphere(Ray r, Sphere s) {
	vec3 oc = s.o - r.o;
	float a = magSquared(r.dir); 
	float h = dot(r.dir, oc);
	float c = magSquared(oc) - s.radius * s.radius;
	float discriminant = h*h - a*c;
	float t = MAX_INTERSECTION;
	if (discriminant >= 0) {
 		float t_min = (h - sqrt(discriminant)) / a;
 		if (t_min <= 0) {
 			t_min = MAX_INTERSECTION;
 		}
 		float t_max = (h + sqrt(discriminant)) / a;
 		if (t_max <= 0) {
 			t_max = MAX_INTERSECTION;
 		}
 		t = min(t_min, t_max);
	}
	vec3 intersection = r.o + (t * r.dir);
	vec3 normal = normalize(intersection - s.o);

	return Intersection(intersection, normal, t, s.material, s.id, dot(r.dir, normal) <= 0.0);
}

Intersection intersectSpheres(Ray r, Intersection _intersection, int currId, bool isBlockCheck) {
	Intersection intersection = _intersection;
	for (int i = 0; i < spheres.length(); i++) {
		Sphere sphere = spheres[i];
		Intersection curr = hitSphere(r, sphere);
		if (sphere.id != currId) {
			if (curr.t > SHADOW_ACNE && curr.t < intersection.t && !(isBlockCheck && sphere.material.type == DIELECTRIC)) {
				intersection = curr;
			}
		}
	}
	return intersection;
}

// Using algorithm by Inigo Quilez on ShaderToy
// Corrected version by weasel: https://www.shadertoy.com/view/3XdyRjDY
// TORUS SECTION (PERSONAL STUDY OF HOW THIS WORKS NEEDED!)
float solveCubic(float a1, float a2, float a3) {
	float Q, RR, Q3, R2, sQ, d, an, theta;
	float A2 = a1 * a1;
	bool flip = false;
	float a23 = a2/a3;
	if (abs(a3) > 0.0 && A2 - 3.0 * a2 > a23 * a23 - 3.0 * a1/a3) {
		flip = true;
		a3 = 1.0 / a3;
		a2 = a1 * a3;
		a1 = a23;
		A2 = a1 * a1;
	}
	Q = (A2 - 3.0 * a2) * (1.0 / 9.0);
	RR = (a1 * (A2 - 4.5 * a2) + 13.5 * a3) * (1.0 / 27.0);
	Q3 = Q * Q * Q;
	R2 = RR * RR;
	d = Q3 - R2;
	an = a1 * (1.0 / 3.0);
	if (d >= 0.0) {
		d = RR * inversesqrt(Q3);
		theta = acos(d) * (1.0 / 3.0);
		sQ = -2.0 * sqrt(Q);
		float s = 2.09439510239320;
		vec3 sol = sQ * cos(theta+vec3(0,s,-2)) - an;
		if (flip) {
			sol = 1.0 / sol;
		}
		return max(sol.x, max(sol.y, sol.z));
	}
	float S = sqrt(-d) + abs(RR);
	sQ = pow(S, 1.0 / 3.0);
	float t = (sQ + Q / sQ) * sign(-RR);
	float res = t - an;
	if (flip) {
		res = 1.0 /res;
	}
	return res;
}

Intersection hitTorus(Ray nR, Torus tr) {
	Ray ray = Ray(normalize(nR.dir), nR.o - tr.o);
	float Ra2 = tr.radius * tr.radius;
	float ra2 = tr.ringRadius * tr.ringRadius;
	float x = dot(ray.o, ray.o);
	float d = dot(ray.o, ray.dir);

	float r = tr.radius + tr.ringRadius;
	float h = d*d - x + r*r;
	if (h < 0.0) {
		return DEFAULT_INTERSECTION;
	}
	if (d > 0.0 && r*r < x) {
		return DEFAULT_INTERSECTION;
	}

	float p = d;
	float q = x + Ra2 - ra2;

	float a = Ra2 * (1.0 - ray.dir.z * ray.dir.z);
	float b = Ra2 * (d - ray.dir.z * ray.o.z);
	float c = Ra2 * (x - ray.o.z * ray.o.z);

	float k = a*p - b;
	float c0 = -k * k;
	float c1 = c + a * (a - q) + 2.0 * p * k;
	float c2 = q - 2.0 * a - p * p;

	float n = 0.0;
	if (abs(c0/c1) > 1e-7) {
		n = solveCubic(c2, c1, c0);
		n -= (c0 + n * (c1 + n * (c2 + n))) / (c1 + n * (c2 * 2.0 + n * 3.0));
		if (n < 0) {
			return DEFAULT_INTERSECTION;
		}
		float Q = sqrt(n);
		b = 2.0 * (Q * p - k / Q);
		q += 2.0 * (n - a);
		a = Q;
	} else {
		n = -c0 / c1;
		if (n < 0.0) {
			return DEFAULT_INTERSECTION;
		}
		float C = sqrt(c1);
		float Q = k / C;
		b = 2.0 * (Q * p - C);
		q += 2.0 * (n - a);
		a = Q;
	}

	float t = MAX_INTERSECTION;
	for (int i = 0; i < 2; i++) {
		float p2 = p - a;
		float pp = p2 * p2;
		float q2 = q - b;
		float h = pp - q2;
		a = -a;
		b = -b;
		if (h < 0.0) {
			continue;
		}
		h = sqrt(h);
		for (int j = 0; j < 2; j++) {
			float t1 = -p2 + h;
			if (t1 > 0.0 && t1 < t) {
				t = t1;
			}
			h = -h;
		}
	}
	if (t == MAX_INTERSECTION) {
		return DEFAULT_INTERSECTION;
	}

	vec3 intersection = nR.o + (t * normalize(nR.dir));
	vec3 normal = normalize(intersection * (dot(intersection, intersection) - tr.ringRadius * tr.ringRadius - tr.radius * tr.radius * vec3(1.0, 1.0, -1.0)));

	return Intersection(intersection, normal, t, tr.material, tr.id, true);
}

Intersection intersectTori(Ray r, Intersection _intersection, int currId, bool isBlockCheck) {
	Intersection intersection = _intersection;
	for (int i = 0; i < tori.length(); i++) {
		Torus torus = tori[i];
		Intersection curr = hitTorus(r, torus);
		if (torus.id != currId) {
			if (curr.t > SHADOW_ACNE && curr.t < intersection.t && !(isBlockCheck && torus.material.type == DIELECTRIC)) {
				intersection = curr;
			}
		}
	}
	return intersection;
}


Intersection hitBox(Ray r, Box b) {

	vec3 boxCentre = 0.5 * (b.min + b.max);
	vec3 boxHalfs = vec3(abs(b.max.x - b.min.x) / 2.0f, abs(b.max.y - b.min.y) / 2.0f, abs(b.max.z - b.min.z) / 2.0f);

	float fracX = 1.0f / r.dir.x;
	float fracY = 1.0f / r.dir.y;
	float fracZ = 1.0f / r.dir.z;

	float tx1 = (b.min.x - r.o.x) * fracX;
	float tx2 = (b.max.x - r.o.x) * fracX;

	float ty1 = (b.min.y - r.o.y) * fracY;
	float ty2 = (b.max.y - r.o.y) * fracY; 

	float tz1 = (b.min.z - r.o.z) * fracZ;
	float tz2 = (b.max.z - r.o.z) * fracZ;  

	float t_min = max(max(min(tx1, tx2), min(ty1, ty2)), min(tz1, tz2));
	float t_max = min(min(max(tx1, tx2), max(ty1, ty2)), max(tz1, tz2));

	if (t_max < 0) {
		return DEFAULT_INTERSECTION;
	}
	if (t_min > t_max) {
		return DEFAULT_INTERSECTION;
	}
	float t = t_min;
	vec3 intersection = r.o + (t * r.dir);
	vec3 intersectionBCDS = (intersection - boxCentre) * vec3(1 / boxHalfs.x, 1 / boxHalfs.y, 1 / boxHalfs.z); // intersection relative to box (box co-ordinate space)

	vec3 normal = normals[0];
	float currDot = dot(normal, intersectionBCDS);
	for (int i = 1; i < normals.length(); i++) {
		float nextDot = dot(normals[i], intersectionBCDS);
		if (currDot < 0 || (nextDot > 0 && nextDot > currDot)) {
			currDot = nextDot;
			normal = normals[i];
		}
	}


	return Intersection(intersection, normal, t, b.material, b.id, true);
}

Intersection intersectBoxes(Ray r, Intersection _intersection, int currId, bool isBlockCheck) {
	Intersection intersection = _intersection;
	for (int i = 0; i < boxes.length(); i++) {
		Box box = boxes[i];
		Intersection curr = hitBox(r, box);
		if (box.id != currId) {
			if (curr.t > SHADOW_ACNE && curr.t < intersection.t && !(isBlockCheck && box.material.type == DIELECTRIC)) {
				intersection = curr;
			}
		}
	}
	return intersection;
}

// Used Moller-Trumbore intersection algorithm 
// Unable to simulate light phenomena currently (TO FIX)
Intersection hitTriangle(Ray r, Triangle tri) {
	vec3 v0v1 = tri.v1 - tri.v0;
	vec3 v0v2 = tri.v2 - tri.v0;
	vec3 n = cross(v0v1, v0v2);

	float nrd = dot(n, r.dir);
	if (abs(nrd) < 0.0001) {
		return DEFAULT_INTERSECTION;
	}

	float d = dot(-n, tri.v0);
	float t = -(dot(n, r.o) + d) / nrd;

	if (t < 0) {
		return DEFAULT_INTERSECTION;
	}

	vec3 p = r.o + (t * r.dir);

	vec3 v0p = p - tri.v0;
	vec3 ne = cross(v0v1, v0p);
	if (dot(n, ne) < 0) {
		return DEFAULT_INTERSECTION;
	}

	vec3 v2v1 = tri.v2 - tri.v1;
	vec3 v1p = p - tri.v1;
	ne = cross(v2v1, v1p);
	if (dot(n, ne) < 0) {
		return DEFAULT_INTERSECTION;
	}

	vec3 v2v0 = tri.v0 - tri.v2;
	vec3 v2p = p - tri.v2;
	ne = cross(v2v0, v2p);

	if (dot(n, ne) < 0) {
		return DEFAULT_INTERSECTION;
	}
	n = normalize(n);
	if (dot(n, r.dir) > 0) {
		return Intersection(p, -n, t, tri.material, tri.id, true);
	}
	return Intersection(p, n, t, tri.material, tri.id, true);
}

Intersection intersectTriangles(Ray r, Intersection _intersection, int currId, bool isBlockCheck) {
	Intersection intersection = _intersection;
	for (int i = 0; i < triangles.length(); i++) {
		Triangle triangle = triangles[i];
		Intersection curr = hitTriangle(r, triangle);
		if (triangle.id != currId) {
			if (curr.t > SHADOW_ACNE && curr.t < intersection.t && !(isBlockCheck && triangle.material.type == DIELECTRIC)) {
				intersection = curr;
			}
		}
	}
	return intersection;
}


float magSquared(vec3 vec) {
	return (vec.x * vec.x) + (vec.y * vec.y) + (vec.z * vec.z);
}

float mag(vec3 vec) {
	return sqrt(magSquared(vec));
}

vec3 calculatePointLight(PointLight light, Intersection intersection, Ray ray) {
	float distance = abs(length(light.pos - intersection.pos));
	float attenuation = 1.0 / (light.constant + (light.linear * distance) + (light.quadratic * (distance * distance)));
	vec3 lightDir = normalize(light.pos - intersection.pos);
		
	vec3 ambient = attenuation * vec3(AMBIENT_LIGHTING);

	float diffuseStrength = max(dot(intersection.normal, lightDir), 0.0);
	vec3 diffuse = attenuation * diffuseStrength * light.colour;

	vec3 reflectDir = reflect(lightDir, intersection.normal);
	float specularStrength = SPEC_STRENGTH * pow(max(dot(ray.dir, reflectDir), 0.0), intersection.material.spec);
	vec3 specular = attenuation * specularStrength * light.colour;

	return (diffuse + specular) * intersection.material.colour;
}

vec3 calculateDirectionalLight(DirectionalLight light, Intersection intersection, Ray ray) {
	vec3 lightDir = normalize(light.dir);

	vec3 ambient = vec3(AMBIENT_LIGHTING) * intersection.material.colour;

	float diffuseStrength = max(dot(intersection.normal, lightDir), 0.0);
	vec3 diffuse = diffuseStrength * light.colour;

	vec3 reflectDir = reflect(lightDir, intersection.normal);
	float specularStrength = SPEC_STRENGTH * pow(max(dot(ray.dir, reflectDir), 0.0), intersection.material.spec);
	vec3 specular = specularStrength * light.colour;

	return (diffuse + specular) * intersection.material.colour;
}

vec3 shade(Intersection intersection, Ray ray) {
	vec3 shaded = vec3(AMBIENT_LIGHTING) * intersection.material.colour;// find nearest intersected torus

	for (int i = 0; i < pointLights.length(); i++) {
		PointLight pointLight = pointLights[i];
		float distance = length(pointLight.pos - intersection.pos);
		float block = findIntersection(Ray(normalize(intersection.pos - pointLight.pos), pointLight.pos), intersection.id, true).t;
		if (intersection.material.type == DIELECTRIC || (pointLight.activeLight && (block >= distance || block >= MAX_INTERSECTION))) {
			shaded += calculatePointLight(pointLight, intersection, ray);
		}
	}
	
	for (int i = 0; i < directionalLights.length(); i++) {
		DirectionalLight directionalLight = directionalLights[i];
		if (intersection.material.type == DIELECTRIC || (directionalLight.activeLight && findIntersection(Ray(directionalLight.dir, intersection.pos), intersection.id, true).t >= MAX_INTERSECTION)) {
			shaded += calculateDirectionalLight(directionalLight, intersection, ray);
		}
	}


	return shaded;
}

float clamp1f(float var, float min, float max) {
	if (var < min) {
		return min;
	}
	if (var > max) {
		return max;
	}
	return var;
}

vec3 getSkybox(vec3 rayDirection) {
	vec3 nrD = normalize(rayDirection);
	if (IMAGE_SKYBOX) {
		float u = mod(0.5 + (atan(nrD.x, nrD.z) / (2 * PI)), 1.0);
		float v = mod(0.5 - (asin(nrD.y) / PI), 1.0);
		u = clamp1f(u, 0.0, 1.0);
		v = clamp1f(v, 0.0, 1.0);
		return vec3(texture(skybox, vec2(u, 1.0 - v)));
	} else if (BASIC_SKY) {	
		float a = 0.5 * (nrD.y + 1.0);
		return (1.0 - a) * vec3(1.0) + a * vec3(0.5, 0.7, 1.0);
	} else {
		return SOLID_SKY;
	}
}