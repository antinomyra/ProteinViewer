/*  ProteinViewer JavaScript Library, version 0.1
 *  (c) 2015-2015 Renchu Song
 *
 *  ProteinViewer is freely distributable under the terms of an Apache license.
 *
 *	Special thanks to Cornell CS 4620 Framework: https://github.com/CornellCS4620/Framework
 *	And Canvas Dragging example: http://rectangleworld.com/demos/SimpleDragging/SimpleDragging
 *--------------------------------------------------------------------------*/

var ProteinViewer = function(width, height, DOMObj) {
	// Map of Protein Geometry Mesh
	var protein = [];
	this.protein = protein;
	
	// Scene
	var scene = new THREE.Scene();
	this.scene = scene;
	
	// Camera
	// TODO: Decide to use perspective camera or orthographic camera, now using orthographic
	// var camera = new THREE.PerspectiveCamera( 
	// 	width, width / height, 0.1, 1000 
	// );

	var camera = new THREE.OrthographicCamera( 
		width / - 2, width / 2, height / 2, height / - 2, 0.1, 1000 
	);

	this.camera = camera;
	this.cameraForward = new Vec3([0, 0, 1]);
	this.cameraRight = new Vec3([1, 0, 0]);
	this.cameraUp = new Vec3([0, 1, 0]);
	this.cameraDist = 400;
	// Update Camera
	this.updateCamera = function() {
		this.camera.position.x = this.cameraForward.x * this.cameraDist;
		this.camera.position.y = this.cameraForward.y * this.cameraDist;
		this.camera.position.z = this.cameraForward.z * this.cameraDist;
		this.camera.lookAt(new THREE.Vector3(0, 0, 0));
		this.camera.up = new THREE.Vector3(this.cameraUp.x, this.cameraUp.y, this.cameraUp.z);
	}
	this.updateCamera();
	// Camera Rotate
	this.cameraRotateTo = function(rx, ry) {
		var rMat = new Mat4().createRotationMatrix(0, rx).mulBefore(
				new Mat4().createRotationMatrix(1, ry)
			);
		this.cameraForward = rMat.mulBeforeVec4(new Vec4([0, 0, 1])).getVec3();
		this.cameraUp = rMat.mulBeforeVec4(new Vec4([0, 1, 0])).getVec3();
		this.cameraRight = rMat.mulBeforeVec4(new Vec4([1, 0, 0])).getVec3();
		this.updateCamera();
	}
	this.cameraRotate = function(rx, ry) {
		var rMat = new Mat4().createRotationMatrix(0, rx).mulBefore(
				new Mat4().createRotationMatrix(1, ry)
			);

		var frame = new Mat4().frame2canonical(
			this.cameraRight.clone().normalize(), 
			this.cameraUp.clone().normalize(),
			this.cameraForward.clone().normalize()
		);

		rMat.mulAfter(frame);
		
		this.cameraRight = rMat.mulBeforeVec4(new Vec4([1, 0, 0])).getVec3();
		this.cameraUp = rMat.mulBeforeVec4(new Vec4([0, 1, 0])).getVec3();
		this.cameraForward = rMat.mulBeforeVec4(new Vec4([0, 0, 1])).getVec3();

		this.updateCamera();
	}

	// Lights
	this.lights = [];
	this.lightPivotAxis = new Vec3([0, 0, 5000]);
	this.lightHoriAxis = new Vec3([5000, 0, 0]);
	this.lightVertAxis = new Vec3([0, 5000, 0]);
	// Now adding four lights
	this.lights.push(new THREE.PointLight(0xFFFFFF));	// Main light
	this.lights.push(new THREE.PointLight(0x333333));	// Peripheral light 1
	this.lights.push(new THREE.PointLight(0x333333));	// Peripheral light 2
	this.lights.push(new THREE.PointLight(0x222222));	// Peripheral light 3
	// Update light position
	this.updateLights = function() {
		var light0 = this.lightPivotAxis.clone().add(this.lightHoriAxis).add(this.lightVertAxis);
		var light1 = this.lightPivotAxis.clone().add(this.lightHoriAxis).subtract(this.lightVertAxis);
		var light2 = this.lightPivotAxis.clone().subtract(this.lightHoriAxis).add(this.lightVertAxis);
		var light3 = this.lightPivotAxis.clone().subtract(this.lightHoriAxis).subtract(this.lightVertAxis);
		this.lights[0].position.set(light0.x, light0.y, light0.z);
		this.lights[1].position.set(light1.x, light1.y, light1.z);
		this.lights[2].position.set(light2.x, light2.y, light2.z);
		this.lights[3].position.set(light3.x, light3.y, light3.z);
	}
	// Init lights
	this.updateLights();
	for (var i = 0; i < this.lights.length; i++) {
		this.scene.add(this.lights[i]);
	}
	// Lights Rotate
	this.lightsRotateTo = function(rx, ry) {
		var rMat = new Mat4().createRotationMatrix(0, rx).mulBefore(
				new Mat4().createRotationMatrix(1, ry)
			);
		this.lightPivotAxis = rMat.mulBeforeVec3(new Vec3([0, 0, 5000])).getVec3();
		this.lightHoriAxis = rMat.mulBeforeVec3(new Vec3([5000, 0, 0])).getVec3();
		this.lightVertAxis = rMat.mulBeforeVec3(new Vec3([0, 5000, 0])).getVec3();
		this.updateLights();
	}
	this.lightsRotate = function(rx, ry) {
		var rMat = new Mat4().createRotationMatrix(0, rx).mulBefore(
				new Mat4().createRotationMatrix(1, ry)
			);
		var frame = new Mat4().frame2canonical(
			this.lightHoriAxis.clone().normalize(), 
			this.lightVertAxis.clone().normalize(),
			this.lightPivotAxis.clone().normalize()
		);
		rMat.mulAfter(frame);

		this.lightPivotAxis = rMat.mulBeforeVec3(new Vec3([0, 0, 5000])).getVec3();
		this.lightHoriAxis = rMat.mulBeforeVec3(new Vec3([5000, 0, 0])).getVec3();
		this.lightVertAxis = rMat.mulBeforeVec3(new Vec3([0, 5000, 0])).getVec3();
		this.updateLights();
	}

	// Scene Rotate (Rotate Camere & Lights synchronizely)
	this.sceneRotateTo = function(rx, ry) {
		this.cameraRotateTo(rx, ry);
		this.lightsRotateTo(rx, ry);
	}
	this.sceneRotate = function(rx, ry) {
		this.cameraRotate(rx, ry);
		this.lightsRotate(rx, ry);
	}

	// Renderer
	var renderer = new THREE.WebGLRenderer();
	this.renderer = renderer;
	this.renderer.setSize(width, height);

	// Canvas
	DOMObj.appendChild(this.renderer.domElement);
	// Canvas Drag
	this.canvasApp = function(ptViewer) {
		var ptViewer = ptViewer;
		var theCanvas = this.renderer.domElement;
		var dragging;
		var prevX, prevY;
		theCanvas.addEventListener("mousedown", mouseDownListener, false);

		function mouseDownListener(evt) {
			dragging = true;
			
			prevX = evt.clientX;
			prevY = evt.clientY;
			window.addEventListener("mousemove", mouseMoveListener, false);
		
			theCanvas.removeEventListener("mousedown", mouseDownListener, false);
			window.addEventListener("mouseup", mouseUpListener, false);
			
			//code below prevents the mouse down from having an effect on the main browser window:
			if (evt.preventDefault) {
				evt.preventDefault();
			} //standard
			else if (evt.returnValue) {
				evt.returnValue = false;
			} //older IE
			return false;
		}
		
		function mouseUpListener(evt) {
			theCanvas.addEventListener("mousedown", mouseDownListener, false);
			window.removeEventListener("mouseup", mouseUpListener, false);
			if (dragging) {
				dragging = false;
				window.removeEventListener("mousemove", mouseMoveListener, false);
			}
		}

		function mouseMoveListener(evt) {
			var dx = evt.clientX - prevX;
			var dy = evt.clientY - prevY;
			prevX = evt.clientX;
			prevY = evt.clientY;

			ptViewer.sceneRotate(-dy / 100, -dx / 100);
		}
	}
	this.canvasApp(this);

	// Render loop function
	var render = function () {
		requestAnimationFrame( render );
		//protein[0].rotation.x += 0.01;
		renderer.render(scene, camera);
	};
	this.execute = function() {
		render();
	}

	// Append a protein
	/**
		x, y, z: protein center location
		data: json represented protein geometry
		color: init color
		scale: scaling the protein, 1.0 by default
		lineRadius: radius of line part
		planeWidth: width of flake / roll part (thick same as diameter of line part)
		angleThreshold: directional smooth parameter, the less the threshold, the smoother the surface 
	*/
	this.appendProtein = function(x, y, z, data, color, scale, lineRadius, planeWidth, angleThreshold) {
		var geometry = new THREE.Geometry();
		
		// Construct protein geometry
		if (data.length > 0) {
			data.push({ 
				x: data[data.length - 1].x, 
				y: data[data.length - 1].y, 
				z: data[data.length - 1].z, 
				type: -1, 
			});
			var curType = data[0].type;
			var framePointsBuffer = [new Vec3([data[0].x, data[0].y, data[0].z])];
			for (var i = 1; i < data.length; i++) {
				framePointsBuffer.push(new Vec3([data[i].x, data[i].y, data[i].z]));
				if (data[i].type != curType) {
					console.log(framePointsBuffer);
					var geoSegment;
					switch (curType) {
						case 0:
						geoSegment = new LineGeo(framePointsBuffer, scale, lineRadius, angleThreshold);
						break;
						case 1:

						break;
						case 2:

						break;
					}
					geoSegment.execute();
					console.log(geoSegment);
					var geoPoints = geoSegment.geoPoints;
					var geoPointsNorm = geoSegment.geoPointsNorm;
					var m = geoPoints[0].length;
					var n = geoPoints.length;
					// #Points already in geometry 
					var bias = geometry.vertices.length;
					
					for (var j = 0; j < n; j++) {
						for (var k = 0; k < m; k++) {
							geometry.vertices.push(
								new THREE.Vector3( 
									geoPoints[j][k].x, geoPoints[j][k].y, geoPoints[j][k].z
								)
							);
						}
					}
					// Bottom Cap
					var tan = geoPoints[0][1].clone().subtract(geoPoints[0][0]).cross(
						geoPoints[0][2].clone().subtract(geoPoints[0][0])
					);
					for (var j = 1; j < m - 1; j++) {
						var face = new THREE.Face3(bias, bias + j, bias + j + 1);
						face.normal.set(tan.x, tan.y, tan.z);
						geometry.faces.push(face);
					}
					// TODO: Top Cap

					// Soft Tube
					for (var j = 0; j < n - 1; j++) {
						for (var k = 0; k < m - 1; k++) {
							var base = j * m + k + bias;
							// First triangle
							var face = new THREE.Face3(base + 1, base, base + m);
							face.vertexNormals[0] = new THREE.Vector3( 
								geoPointsNorm[j][k + 1].x, geoPoints[j][k + 1].y, geoPoints[j][k + 1].z
							);
							face.vertexNormals[1] = new THREE.Vector3( 
								geoPointsNorm[j][k].x, geoPoints[j][k].y, geoPoints[j][k].z
							);
							face.vertexNormals[2] = new THREE.Vector3( 
								geoPointsNorm[j + 1][k].x, geoPoints[j + 1][k].y, geoPoints[j + 1][k].z
							);
							geometry.faces.push(face);
							// Second triangle
							face = new THREE.Face3(base + 1, base + m, base + m + 1);
							face.vertexNormals[0] = new THREE.Vector3( 
								geoPointsNorm[j][k + 1].x, geoPoints[j][k + 1].y, geoPoints[j][k + 1].z
							);
							face.vertexNormals[1] = new THREE.Vector3( 
								geoPointsNorm[j + 1][k].x, geoPoints[j + 1][k].y, geoPoints[j + 1][k].z
							);
							face.vertexNormals[2] = new THREE.Vector3( 
								geoPointsNorm[j + 1][k + 1].x, geoPoints[j + 1][k + 1].y, geoPoints[j + 1][k + 1].z
							);
							geometry.faces.push(face);
						}
					}

					framePointsBuffer = [new Vec3(data[i].x, data[i].y, data[i].z)];
					curType = data[i].type;
				}
			}
		}

		var material = new THREE.MeshLambertMaterial( { color: color, shading: THREE.SmoothShading } );
		var protein = new THREE.Mesh( geometry, material );
		protein.position.x = x;
		protein.position.y = y;
		protein.position.z = z;
		
		this.scene.add(protein);
		this.protein.push(protein);
	}

	// Hide a protein
	this.hideProtein = function(index) {
		if (0 <=index && index < this.protein.length) {
			this.scene.remove(this.protein[index]);
		}
	}

	// Show a protein
	this.showProtein = function(index) {
		if (0 <=index && index < this.protein.length) {
			this.scene.add(this.protein[index]);
		}
	}

	// Change protein color
	this.changeProteinColor = function(index, newColor) {
		if (0 <=index && index < this.protein.length) {
			this.protein[index].material = new THREE.MeshLambertMaterial( { color: newColor, shading: THREE.SmoothShading } );
		}
	}

	// Move protein
	this.moveProteinTo = function(index, x, y, z) {
		this.protein[index].position.x = x;
		this.protein[index].position.y = y;
		this.protein[index].position.z = z;
	}
	this.moveProtein = function(index, dx, dy, dz) {
		this.protein[index].position.x += dx;
		this.protein[index].position.y += dy;
		this.protein[index].position.z += dz;
	}
	
	// Rotate protein
	this.rotateProteinTo = function(index, x, y, z) {
		this.protein[index].rotation.x = x;
		this.protein[index].rotation.y = y;
		this.protein[index].rotation.z = z;
	}
	this.rotateProtein = function(index, dx, dy, dz) {
		this.protein[index].rotation.x += dx;
		this.protein[index].rotation.y += dy;
		this.protein[index].rotation.z += dz;
	}
	
};

// TODO: Hermite interpolate
function hermiteInterpolate(data, angleThreshold) {
	if (data.length < 3) {
		var result = [];
		for (var d in data) {
			result.push(d);
		}
		result.push(data[data.length - 1].clone().scale(2).subtract(data[data.length - 2]));
		return result;
	}

	// First tangent
	var tangents = [data[1].clone().subtract(data[0]).normalize()];
	// Middle tangent
	for (var i = 1; i < data.length - 1; i++) {
		tangents.push(data[i + 1].clone().subtract(data[i - 1]).normalize());
	}
	// Last tangent
	tangents.push(data[data.length - 1].clone().subtract(data[data.length - 2]).normalize());

	// TODO: change to recursive, now uniform sampling
	var result = [];
	for (var i = 0; i < data.length - 1; i++) {
		for (var lp = 0; lp < 10; lp++) {
			var t = lp / 10.0;
			var t2 = t * t;
			var t3 = t * t * t;
			var s = data[i + 1].clone().subtract(data[i]).len();
			var h00 = 2 * t3 - 3 * t2 + 1;
			var h10 = (t3 - 2 * t2 + t) * s;
			var h01 = -2 * t3 + 3 * t2;
			var h11 = (t3 - t2) * s;
			result.push(
				data[i].clone().scale(h00).add(
					tangents[i].clone().scale(h10)
				).add(
					data[i + 1].clone().scale(h01)
				).add(
					tangents[i + 1].clone().scale(h11)
				)
			);
		}
	}
	result.push(data[data.length - 1]);

	return result;
}

var LineGeo = function(framePoints, scale, lineRadius, angleThreshold) {
	this.framePoints = framePoints;

	this.scale;
	if ("undefined" === typeof scale) {
		this.scale = 1.0;
	} else {
		this.scale = scale;
	}
	
	this.lineRadius;
	if ("undefined" === typeof lineRadius) {
		this.lineRadius = 5;
	} else {
		this.lineRadius = lineRadius;
	}
	
	this.angleThreshold;
	if ("undefined" === typeof angleThreshold) {
		this.angleThreshold = 0.015;
	} else {
		this.angleThreshold = angleThreshold;
	}

	this.alongPoints = [];
	this.interpolate = function() {
		this.alongPoints = hermiteInterpolate(this.framePoints, this.angleThreshold);
	}

	// Construct Geometry
	this.geoPoints = [];
	this.geoPointsNorm = [];
	this.execute = function() {
		this.interpolate();
		var len = this.alongPoints.length;
		
		// TODO: if short, use arbirary normal direction
		if (len < 3) return;
		var prevNormal, normal, prevTangent, tangent, curv;

		for (var i = 0; i < len - 1; i++) {
			var point = this.alongPoints[i];
			var point2 = this.alongPoints[i + 1];

			var cross = [];
			var crossNorm = [];
			tangent = point2.clone().subtract(point).normalize();
			if (tangent.len() < 1e-10) {
				// TODO: may trigger corner case
				if ("undefined" === typeof prevTangent) {
					tangent = new Vec3(0.1, 0.1, 0.1);
				} else {
					tangent = prevTangent;
				}
			}
			if (i == len - 2) {
				normal = prevNormal;
			} else {
				var tangent2 = this.alongPoints[i + 2].clone().subtract(point2).normalize();
				normal = tangent.clone().cross(tangent2).normalize();
				// Degenerated normal
				if (normal.len() < 1e-10) {
					if ("undefined" === typeof prevNormal) {
						var tmp = tangent.clone();
						// TODO: Now hack with adding strange biases to avoid degenerate.
						tmp.x += Math.PI;
						tmp.y += Math.log(2);
						tmp.z += (1 + Math.sqrt(5)) / 2;
						normal = tangent.cross(tmp);
					} else {
						normal = prevNormal.clone();
					}
				}
				// Avoid sudden change in curvation
				if ("undefined" !== typeof prevNormal && normal.angle(prevNormal) > Math.PI / 2) {
					normal.scale(-1);
				}
			}
			prevNormal = normal;
			prevTangent = tangent;
			curv = normal.cross(tangent);

			// console.log(i);
			// console.log(tangent);
			// console.log(normal);
			// console.log(curv);
			
			// TODO: decide the number of slices for the ring, now setting to 10.
			for (var k = 0; k <= 10; k++) {
				var angle = Math.PI * 2 / 10 * k;
				var norm = normal.clone().scale(Math.cos(angle)).add(curv.clone().scale(Math.sin(angle)));
				crossNorm.push(norm);
				var pt = point.clone().add(norm.clone().scale(this.lineRadius)).scale(this.scale);
				cross.push(pt);
			}

			this.geoPoints.push(cross);
			this.geoPointsNorm.push(crossNorm);
		}
		// console.log(this.geoPoints);
		// console.log(this.geoPointsNorm);
	}
};

// Vector 3
var Vec3 = function(data) {
	this.x = data[0];
	this.y = data[1];
	this.z = data[2];

	this.clone = function() {
		return new Vec3([this.x, this.y, this.z]);
	}

	this.len = function() {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
	}

	this.normalize = function() {
		var len = this.len();
		this.x /= len;
		this.y /= len;
		this.z /= len;
		return this;
	}

	this.scale = function(scale) {
		this.x *= scale;
		this.y *= scale;
		this.z *= scale;
		return this;
	}

	this.add = function(other) {
		this.x += other.x;
		this.y += other.y;
		this.z += other.z;
		return this;
	}

	this.subtract = function(other) {
		this.x -= other.x;
		this.y -= other.y;
		this.z -= other.z;
		return this;
	}
	
	this.dot = function(other) {
		return this.x * other.x + this.y * other.y + this.z * other.z;
	}

	this.cross = function(other) {
		return new Vec3([
			this.y * other.z - this.z * other.y,
			this.z * other.x - this.x * other.z,
			this.x * other.y - this.y * other.x,
		]);
	}

	this.angle = function(other) {
		var cos0 = this.dot(other) / this.len() / other.len();
		cos0 = Math.max(-1, Math.min(1, cos0));
		return Math.acos(cos0);
	}
};

// Vector 4
var Vec4 = function(data) {
	this.x = data[0];
	this.y = data[1];
	this.z = data[2];
	this.w = data.length > 3 ? data[3] : 1;

	this.clone = function() {
		return new Vec4([this.x, this.y, this.z, this.w]);
	}

	this.dot = function(other) {
		return this.x * other.x + this.y * other.y + this.z * other.z + this.w * other.w;
	}

	this.getVec3 = function() {
		return new Vec3([this.x, this.y, this.z]);
	}
};

// Matrix 4
/**
	data : [
			m0, m1, m2, m3,
			m4, m5, m6, m7,
			m8, m9, m10, m11,
			m12, m13, m14, m15	
		]
*/
var Mat4 = function(data) {
	this.data = data;

	this.clone = function() {
		return new Mat4(this.data);
	}

	this.col = function(col) {
		return new Vec4([
			this.data[col],
			this.data[col + 4],
			this.data[col + 8],
			this.data[col + 12],
		]);
	}

	this.row = function(row) {
		return new Vec4([
			this.data[row * 4], 
			this.data[row * 4 + 1], 
			this.data[row * 4 + 2], 
			this.data[row * 4 + 3]]
		);
	}

	this.mulBefore = function(other) {
		this.data = [
			this.row(0).dot(other.col(0)), this.row(0).dot(other.col(1)), this.row(0).dot(other.col(2)), this.row(0).dot(other.col(3)),
			this.row(1).dot(other.col(0)), this.row(1).dot(other.col(1)), this.row(1).dot(other.col(2)), this.row(1).dot(other.col(3)),
			this.row(2).dot(other.col(0)), this.row(2).dot(other.col(1)), this.row(2).dot(other.col(2)), this.row(2).dot(other.col(3)),
			this.row(3).dot(other.col(0)), this.row(3).dot(other.col(1)), this.row(3).dot(other.col(2)), this.row(3).dot(other.col(3)),
		];
		return this;
	}

	this.mulAfter = function(other) {
		this.data = [
			other.row(0).dot(this.col(0)), other.row(0).dot(this.col(1)), other.row(0).dot(this.col(2)), other.row(0).dot(this.col(3)),
			other.row(1).dot(this.col(0)), other.row(1).dot(this.col(1)), other.row(1).dot(this.col(2)), other.row(1).dot(this.col(3)),
			other.row(2).dot(this.col(0)), other.row(2).dot(this.col(1)), other.row(2).dot(this.col(2)), other.row(2).dot(this.col(3)),
			other.row(3).dot(this.col(0)), other.row(3).dot(this.col(1)), other.row(3).dot(this.col(2)), other.row(3).dot(this.col(3)),
		];
		return this;
	}

	this.mulBeforeVec4 = function(vec4) {
		return new Vec4([
			this.row(0).dot(vec4),
			this.row(1).dot(vec4),
			this.row(2).dot(vec4),
			this.row(3).dot(vec4),
		]);
	}

	this.mulBeforeVec3 = function(vec3) {
		var vec4 = new Vec4([vec3.x, vec3.y, vec3.z]);
		return new Vec4([
			this.row(0).dot(vec4),
			this.row(1).dot(vec4),
			this.row(2).dot(vec4),
			this.row(3).dot(vec4),
		]);
	}

	this.getVal = function(row, col) {
		return this.data[row * 4 + col];
	}

	// Create a translation matrix
	this.createTranslateMatrix = function(x, y, z) {
		this.data = [
			1, 0, 0, x,
			0, 1, 0, y,
			0, 0, 1, z,
			0, 0, 0, 1,
		];
		return this;
	}

	// Create a rotation matrix
	/**
		axes: 0 -> x, 1 -> y, 2 -> z
		radius: 0 ~ 2PI
	*/
	this.createRotationMatrix = function(axes, radius) {
		switch (axes) {
			case 0:
				this.data = [
					1, 0, 0, 0,
					0, Math.cos(radius), -Math.sin(radius), 0, 
					0, Math.sin(radius), Math.cos(radius), 0,
					0, 0, 0, 1,
				];
				break;
			case 1:
				this.data = [
					Math.cos(radius), 0, Math.sin(radius), 0,
					0, 1, 0, 0,
					-Math.sin(radius), 0, Math.cos(radius), 0,
					0, 0, 0, 1,
				];
				break;
			case 2:
				this.data = [
					Math.cos(radius), -Math.sin(radius), 0, 0,
					Math.sin(radius), Math.cos(radius), 0, 0,
					0, 0, 1, 0,
					0, 0, 0, 1,
				];
				break;
		}
		return this;
	}

	// Create a scale matrix
	this.createScaleMatrix = function(sx, sy, sz) {
		this.data = [
			sx, 0, 0, 0,
			0, sy, 0, 0,
			0, 0, sz, 0,
			0, 0, 0, 1,
		];
		return this;
	}

	// World to Frame Matrix
	this.frame2canonical = function(u, v, p, e) {
		if ("undefined" === typeof e) {
			e = new Vec4([0, 0, 0, 1]);
		}
		this.data = [
			u.x, v.x, p.x, e.x,
			u.y, v.y, p.y, e.y,
			u.z, v.z, p.z, e.z,
			0, 0, 0, 1
		];
		return this;
	}

	// Transpose
	this.transpose = function() {
		this.data = [
			this.data[0], this.data[4], this.data[8], this.data[12],
			this.data[1], this.data[5], this.data[9], this.data[13],
			this.data[2], this.data[6], this.data[10], this.data[14],
			this.data[3], this.data[7], this.data[11], this.data[15],			
		];
		return this;
	}

	// Co-Factor
	this.cofactor = function(r, c) {
		var m = [];
		var cur = 0;
		for (var i = 0; i < 4; i++) {
			if (i == r) continue;
			for (var j = 0; j < 4; j++) {
				if (j == c) continue;
				m[cur++] = this.data[i * 4 + j];
			}
		}

		var ans = m[0] * (m[4] * m[8] - m[5] * m[7]) - m[1] * (m[3] * m[8] - m[5] * m[6]) + m[2] * (m[3] * m[7] - m[4] * m[6]);

		if( (r + c) % 2 == 0) return ans;
		else return -ans;
	}

	// Determinant
	this.determinant = function() {
		return 	this.data[0] * this.cofactor(0, 0) +
				this.data[1] * this.cofactor(0, 1) +
				this.data[2] * this.cofactor(0, 2) +
				this.data[3] * this.cofactor(0, 3);
	}

	// Invert
	this.invert = function() {
		var det = this.determinant();
		if (det == 0) throw "singular matrix";
		this.data = [
			this.cofactor(0, 0), this.cofactor(1, 0), this.cofactor(2, 0), this.cofactor(3, 0), 
			this.cofactor(0, 1), this.cofactor(1, 1), this.cofactor(2, 1), this.cofactor(3, 1), 
			this.cofactor(0, 2), this.cofactor(1, 2), this.cofactor(2, 2), this.cofactor(3, 2), 
			this.cofactor(0, 3), this.cofactor(1, 3), this.cofactor(2, 3), this.cofactor(3, 3), 
		];
		return this.scale(1.0 / det);
	}

	// Scale
	this.scale = function(scale) {
		for (var i = 0; i < 16; i++) {
			this.data[i] *= scale;
		}
		return this;
	}
}
