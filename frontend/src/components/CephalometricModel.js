import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';
const CephalometricBackground = () => {
  const mountRef = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0a0e27, 1);
    mountRef.current.appendChild(renderer.domElement);

    // Particle system for neural network effect
    const particleCount = 1000;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 100;
      positions[i + 1] = (Math.random() - 0.5) * 100;
      positions[i + 2] = (Math.random() - 0.5) * 100;

      // Blue to cyan gradient
      colors[i] = 0.2 + Math.random() * 0.3;
      colors[i + 1] = 0.5 + Math.random() * 0.5;
      colors[i + 2] = 0.8 + Math.random() * 0.2;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);

    // Create floating skull wireframes
    const skullGroup = new THREE.Group();
    
    for (let i = 0; i < 3; i++) {
      const skullWireframe = new THREE.Group();
      
      // Cranium wireframe
      const craniumGeo = new THREE.SphereGeometry(2, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6);
      const wireframeMat = new THREE.LineBasicMaterial({ 
        color: 0x00d4ff, 
        transparent: true, 
        opacity: 0.2 
      });
      const craniumEdges = new THREE.EdgesGeometry(craniumGeo);
      const craniumWire = new THREE.LineSegments(craniumEdges, wireframeMat);
      craniumWire.position.y = 1;
      skullWireframe.add(craniumWire);

      // Mandible wireframe
      const mandibleGeo = new THREE.BoxGeometry(2, 0.8, 1.2);
      const mandibleEdges = new THREE.EdgesGeometry(mandibleGeo);
      const mandibleWire = new THREE.LineSegments(mandibleEdges, wireframeMat);
      mandibleWire.position.y = -1.5;
      skullWireframe.add(mandibleWire);

      // Position skulls
      skullWireframe.position.x = (i - 1) * 25;
      skullWireframe.position.y = Math.sin(i * 2) * 10;
      skullWireframe.position.z = -20 - i * 10;
      skullWireframe.rotation.y = i * Math.PI / 3;
      
      skullGroup.add(skullWireframe);
    }
    scene.add(skullGroup);

    // Create geometric measurement lines (cephalometric angles)
    const linesGroup = new THREE.Group();
    
    for (let i = 0; i < 8; i++) {
      const lineGeo = new THREE.BufferGeometry();
      const angle = (i / 8) * Math.PI * 2;
      const radius = 15 + Math.random() * 10;
      
      const linePositions = new Float32Array([
        0, 0, 0,
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        -5 - Math.random() * 10
      ]);
      
      lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
      
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.15
      });
      
      const line = new THREE.Line(lineGeo, lineMat);
      linesGroup.add(line);
    }
    scene.add(linesGroup);

    // Create landmark spheres floating around
    const landmarks = [];
    const landmarkColors = [0xff0066, 0x00ffff, 0x00ff00, 0xffaa00, 0xff00ff];
    
    for (let i = 0; i < 15; i++) {
      const geo = new THREE.SphereGeometry(0.3, 16, 16);
      const mat = new THREE.MeshBasicMaterial({
        color: landmarkColors[i % landmarkColors.length],
        transparent: true,
        opacity: 0.4
      });
      const landmark = new THREE.Mesh(geo, mat);
      
      landmark.position.x = (Math.random() - 0.5) * 60;
      landmark.position.y = (Math.random() - 0.5) * 60;
      landmark.position.z = (Math.random() - 0.5) * 40 - 20;
      
      landmarks.push({
        mesh: landmark,
        speedX: (Math.random() - 0.5) * 0.02,
        speedY: (Math.random() - 0.5) * 0.02,
        speedZ: (Math.random() - 0.5) * 0.01
      });
      
      scene.add(landmark);
    }

    // Add grid planes
    const gridHelper1 = new THREE.GridHelper(60, 30, 0x1a3a52, 0x0d1f2d);
    gridHelper1.position.z = -30;
    gridHelper1.rotation.x = Math.PI / 2;
    scene.add(gridHelper1);

    const gridHelper2 = new THREE.GridHelper(60, 30, 0x1a3a52, 0x0d1f2d);
    gridHelper2.position.y = -20;
    gridHelper2.material.opacity = 0.2;
    gridHelper2.material.transparent = true;
    scene.add(gridHelper2);

    // Create DNA helix structure
    const helixGroup = new THREE.Group();
    const helixPoints = 50;
    
    for (let i = 0; i < helixPoints; i++) {
      const t = (i / helixPoints) * Math.PI * 4;
      const radius = 3;
      
      const sphere1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 8),
        new THREE.MeshBasicMaterial({ 
          color: 0x00d4ff, 
          transparent: true, 
          opacity: 0.4 
        })
      );
      
      sphere1.position.x = Math.cos(t) * radius;
      sphere1.position.y = (i / helixPoints) * 20 - 10;
      sphere1.position.z = Math.sin(t) * radius;
      
      helixGroup.add(sphere1);
      
      const sphere2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 8),
        new THREE.MeshBasicMaterial({ 
          color: 0xff0088, 
          transparent: true, 
          opacity: 0.4 
        })
      );
      
      sphere2.position.x = Math.cos(t + Math.PI) * radius;
      sphere2.position.y = (i / helixPoints) * 20 - 10;
      sphere2.position.z = Math.sin(t + Math.PI) * radius;
      
      helixGroup.add(sphere2);
    }
    
    helixGroup.position.x = 25;
    helixGroup.position.z = -15;
    scene.add(helixGroup);

    // Animation
    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.01;

      // Rotate particle system
      particleSystem.rotation.y += 0.0005;
      particleSystem.rotation.x += 0.0002;

      // Animate particles
      const positions = particleSystem.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(time + positions[i]) * 0.01;
      }
      particleSystem.geometry.attributes.position.needsUpdate = true;

      // Rotate skull wireframes
      skullGroup.children.forEach((skull, idx) => {
        skull.rotation.y += 0.002 * (idx + 1);
        skull.position.y += Math.sin(time + idx) * 0.02;
      });

      // Rotate measurement lines
      linesGroup.rotation.z += 0.001;

      // Animate landmarks
      landmarks.forEach(landmark => {
        landmark.mesh.position.x += landmark.speedX;
        landmark.mesh.position.y += landmark.speedY;
        landmark.mesh.position.z += landmark.speedZ;

        // Bounce back
        if (Math.abs(landmark.mesh.position.x) > 30) landmark.speedX *= -1;
        if (Math.abs(landmark.mesh.position.y) > 30) landmark.speedY *= -1;
        if (landmark.mesh.position.z < -40 || landmark.mesh.position.z > 0) landmark.speedZ *= -1;

        // Pulse effect
        const scale = 1 + Math.sin(time * 2 + landmark.mesh.position.x) * 0.3;
        landmark.mesh.scale.set(scale, scale, scale);
      });

      // Rotate DNA helix
      helixGroup.rotation.y += 0.003;

      // Camera gentle movement
      camera.position.x = Math.sin(time * 0.2) * 3;
      camera.position.y = Math.cos(time * 0.3) * 2;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div ref={mountRef} className="absolute inset-0" />
      
      {/* Content overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center space-y-6 pointer-events-auto">
          <h1 className="text-6xl font-bold text-white tracking-tight">
            Cephalometric <span className="text-cyan-400">AI</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Advanced 3D Analysis & AI-Powered Orthodontic Diagnostics
          </p>
          <div className="flex gap-4 justify-center mt-8">
            <button onClick={() => navigate("/login")} className="px-8 py-3 bg-transparent border-2 border-white hover:bg-whitehover:text-gray-900 text-white rounded-lg font-semibold transition-colors">
              Get Started
            </button>
            <button onClick={()=>navigate("/lm")} className="px-8 py-3 bg-transparent border-2 border-white hover:bg-white hover:text-gray-900 text-white rounded-lg font-semibold transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Floating info cards */}
      <div className="absolute bottom-8 left-8 bg-gray-900 bg-opacity-80 backdrop-blur-sm p-6 rounded-xl border border-cyan-500 border-opacity-30 max-w-sm pointer-events-auto">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
          <h3 className="text-white font-semibold">AI-Powered Analysis</h3>
        </div>
        <p className="text-gray-300 text-sm">
          Automated landmark detection with neural network precision
        </p>
      </div>

      <div className="absolute bottom-8 right-8 bg-gray-900 bg-opacity-80 backdrop-blur-sm p-6 rounded-xl border border-pink-500 border-opacity-30 max-w-sm pointer-events-auto">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse"></div>
          <h3 className="text-white font-semibold">2D Visualization</h3>
        </div>
        <p className="text-gray-300 text-sm">
          Real-time cephalometric measurements in 2D space
        </p>
      </div>
    </div>
  );
};

export default CephalometricBackground;