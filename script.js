
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, 1, 1000);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0xffffff);
        document.body.appendChild(renderer.domElement);

        camera.position.z = 5;

        const gridHelper = new THREE.GridHelper(window.innerWidth, 40, 0xd3d3d3, 0xd3d3d3);
        gridHelper.rotation.x = Math.PI / 2;
        scene.add(gridHelper);

        let vertices = [];
        let polygon = null;
        let isDrawing = true;
        let copiedPolygon = null;
        let resetInProgress = false;

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        window.addEventListener('mousemove', (event) => {
            if (copiedPolygon) {
                const rect = renderer.domElement.getBoundingClientRect();
                mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObject(gridHelper);
                if (intersects.length > 0) {
                    const point = intersects[0].point;
                    copiedPolygon.position.copy(point);
                }
            }
        });

        window.addEventListener('mousedown', (event) => {
            if (event.button === 0 && copiedPolygon) {
                const rect = renderer.domElement.getBoundingClientRect();
                mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObject(gridHelper);
                if (intersects.length > 0) {
                    const point = intersects[0].point;
                    copiedPolygon.position.copy(point);
                    copiedPolygon = null;
                }
            }
        });

        window.addEventListener('click', (event) => {
            if (!resetInProgress && isDrawing) {
                const rect = renderer.domElement.getBoundingClientRect();
                mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

                const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
                vector.unproject(camera);
                vector.z = 0;
                vertices.push(vector);

                drawVertices();
            } else if (copiedPolygon) {
                const rect = renderer.domElement.getBoundingClientRect();
                mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObject(gridHelper);
                if (intersects.length > 0) {
                    const point = intersects[0].point;
                    copiedPolygon.position.copy(point);
                    copiedPolygon = null;
                }
            }
        });

        function drawVertices() {
            if (polygon) scene.remove(polygon);

            const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
            const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
            polygon = new THREE.LineLoop(geometry, material);

            scene.add(polygon);
        }

        document.getElementById('completeBtn').addEventListener('click', () => {
            if (vertices.length > 2) {
                isDrawing = false;

                if (polygon) scene.remove(polygon);

                const shape = new THREE.Shape(vertices.map(v => new THREE.Vector2(v.x, v.y)));
                const geometry = new THREE.ShapeGeometry(shape);
                const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
                polygon = new THREE.Mesh(geometry, material);

                scene.add(polygon);

                const edges = new THREE.EdgesGeometry(geometry);
                const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 3 });
                const edgesMesh = new THREE.LineSegments(edges, edgesMaterial);
                polygon.add(edgesMesh);
            }
        });

        document.getElementById('copyBtn').addEventListener('click', () => {
            if (polygon && !isDrawing && !copiedPolygon) {
                const geometry = polygon.geometry.clone();
                const material = polygon.material.clone();
                material.color.setHex(0xff00ff);
                copiedPolygon = new THREE.Mesh(geometry, material);
                scene.add(copiedPolygon);
            }
        });

        function clearAllMeshes() {
            const objectsToRemove = [];
            scene.traverse((child) => {
                if (child.isMesh) {
                    objectsToRemove.push(child);
                }
            });
            objectsToRemove.forEach((object) => {
                scene.remove(object);
            });
        }

        document.getElementById('resetBtn').addEventListener('click', () => {
            vertices = [];
            isDrawing = false;
            clearAllMeshes();
            polygon = null;
            copiedPolygon = null;
            resetInProgress = true;

            setTimeout(() => {
                isDrawing = true;
                resetInProgress = false;
            }, 100);
        });

        function animate() {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        }
        animate();
    