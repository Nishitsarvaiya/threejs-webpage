import {
	AmbientLight,
	AxesHelper,
	BoxGeometry,
	Clock,
	Color,
	DirectionalLight,
	EquirectangularReflectionMapping,
	Mesh,
	MeshStandardMaterial,
	PerspectiveCamera,
	SRGBColorSpace,
	Scene,
} from "three";
import { GLTFLoader, OrbitControls, RGBELoader } from "three/examples/jsm/Addons";
import { createCamera, createRenderer } from "./core-utils";

export default class App {
	static _renderer = this._renderer;
	// static _camera = this._camera;
	static _scene = this._scene;
	static _controls = this._controls;
	static _canvas = this._canvas;
	static _clock = this._clock;
	static _vw = this._vw;
	static _vh = this._vh;

	constructor() {
		this.initApp();
	}

	initApp() {
		// get the canvas container
		const container = document.getElementById("gl");

		// Create the renderer
		this._renderer = createRenderer({ antialias: true }, (_ren) => {
			_ren.outputColorSpace = SRGBColorSpace;
		});
		this._renderer.setClearColor(0xffffff);
		this._canvas = this._renderer.domElement;
		container.appendChild(this._renderer.domElement);

		// set vw & vh
		this._vw = window.innerWidth;
		this._vh = window.innerHeight;
		this._renderer.setPixelRatio(Math.min(Math.max(1, window.devicePixelRatio), 2));
		this._renderer.setSize(this._vw, this._vh);

		// Create the scene
		this._scene = new Scene();

		// Create the camera
		// this._camera = createCamera(75, 0.01, 1000);

		// Create the clock
		this._clock = new Clock();

		this.createScenes();
		this.addListeners();
		this.resize();
		this._clock.start();
		this.addObjects();
		this.raf = window.requestAnimationFrame(() => this.update());
	}

	addObjects() {}

	createScenes() {
		this._scenes = [];
		const sceneContainer = document.querySelectorAll(".scene-container");

		for (let i = 0; i < 2; i++) {
			const scene = new Scene();

			// create a scene element
			const sceneHtmlContainer = document.createElement("div");
			sceneHtmlContainer.className = "scene";
			// the element that represents the area we want to render the scene
			scene.userData.element = sceneHtmlContainer;
			sceneContainer[i].appendChild(sceneHtmlContainer);

			const camera = new PerspectiveCamera(40, this._vw / this._vh, 0.1, 100);
			camera.position.z = 2;
			scene.userData.camera = camera;

			const controls = new OrbitControls(scene.userData.camera, scene.userData.element);
			controls.minDistance = 1;
			controls.maxDistance = 5;
			controls.enablePan = false;
			controls.enableZoom = false;
			controls.enableDamping = true;
			controls.autoRotate = true;
			controls.autoRotateSpeed = 3;
			scene.userData.controls = controls;

			new GLTFLoader().setPath("models/").load(`scene-${i + 1}.glb`, (data) => {
				const model = data.scene.children[0];
				if (i === 0) {
					model.scale.setScalar(15);
					model.position.set(0.3, 0, 0);
				} else {
					model.scale.setScalar(0.4);
					model.rotation.set(0.5, 0.7, 0);
					// model.position.set(0, 0, 0);
				}
				scene.add(model);
			});

			if (i === 0) {
				const ambientLight = new AmbientLight(0xffffff, 10);
				const light = new DirectionalLight(0xffffff, 1.5);
				light.position.set(0, 1, 1);
				scene.add(ambientLight);
				scene.add(light);
			} else {
				const ambientLight = new AmbientLight(0xffffff, 3);
				const light = new DirectionalLight(0xffffff, 1.5);
				light.position.set(1, 1, 1);
				scene.add(ambientLight);
				scene.add(light);
			}

			// scene.add(new AxesHelper(5));
			this._scenes.push(scene);
		}
		this.createFullWidthScene();
	}

	createFullWidthScene() {
		const scene = new Scene();
		const sceneContainer = document.querySelector(".full-width-scene");
		scene.userData.element = sceneContainer;

		const camera = new PerspectiveCamera(75, this._vw / this._vh, 0.1, 100);
		camera.position.set(0, 2, 4);
		camera.zoom = 2;
		scene.userData.camera = camera;

		const controls = new OrbitControls(scene.userData.camera, scene.userData.element);
		controls.minDistance = 1;
		controls.maxDistance = 5;
		controls.enableDamping = true;
		controls.enablePan = false;
		controls.enableZoom = false;
		controls.autoRotate = true;
		controls.autoRotateSpeed = 3;
		scene.userData.controls = controls;

		new GLTFLoader().setPath("models/").load("full-width-scene/scene.gltf", (data) => {
			const model = data.scene.children[0];
			model.scale.setScalar(0.022);
			model.position.set(0, 0, -1.8);
			scene.add(model);
		});

		const ambientLight = new AmbientLight(0xffffff, 10);
		const light = new DirectionalLight(0xffffff, 5);
		light.position.set(0, 0.5, 1);
		scene.add(ambientLight);
		scene.add(light);

		// const axesHelper = new AxesHelper(5);
		// scene.add(axesHelper);

		this._scenes.push(scene);
	}

	update = () => {
		this.raf = window.requestAnimationFrame(this.update);
		this.render();
	};

	render() {
		const elapsedTime = this._clock.getElapsedTime();
		this._canvas.style.transform = `translateY(${window.scrollY}px)`;
		this._renderer.setClearColor(0xffffff);
		this._renderer.setScissorTest(true);

		this._scenes.forEach((scene) => {
			// get the element that is a place holder for where we want to
			// draw the scene
			const element = scene.userData.element;

			// get its position relative to the page's viewport
			const rect = element.getBoundingClientRect();

			// check if it's offscreen. If so skip it
			if (
				rect.bottom < 0 ||
				rect.top > this._renderer.domElement.clientHeight ||
				rect.right < 0 ||
				rect.left > this._renderer.domElement.clientWidth
			) {
				return; // it's off screen
			}

			// set the viewport
			const width = rect.right - rect.left;
			const height = rect.bottom - rect.top;
			const left = rect.left;
			const bottom = this._renderer.domElement.clientHeight - rect.bottom;

			this._renderer.setViewport(left, bottom, width, height);
			this._renderer.setScissor(left, bottom, width, height);

			const camera = scene.userData.camera;
			// camera.aspect = this._vw / this._vh;
			// camera.updateProjectionMatrix();
			this._renderer.render(scene, camera);
			const controls = scene.userData.controls;
			controls.update();
		});
	}

	resize() {
		this._vw = window.innerWidth;
		this._vh = window.innerHeight;
		this._renderer.setPixelRatio(Math.min(Math.max(1, window.devicePixelRatio), 2));
		this._renderer.setSize(this._vw, this._vh);
		this._scenes.forEach((scene) => {
			const camera = scene.userData.camera;
			camera.aspect = scene.userData.element.clientWidth / scene.userData.element.clientHeight;
			camera.updateProjectionMatrix();
		});
	}

	addListeners() {
		window.addEventListener("resize", () => this.resize());
	}
}
