import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

export default function AetherPixPremium() {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState(0);
  const [hoverCard, setHoverCard] = useState(null);

  // Initialize Three.js with advanced 3D scene
  useEffect(() => {
    if (!containerRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene setup with fog for depth
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f1419);
    scene.fog = new THREE.Fog(0x0f1419, 50, 100);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // Create advanced particle system
    const createParticleSystem = (color, count) => {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const velocities = new Float32Array(count * 3);

      for (let i = 0; i < count * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 30;
        positions[i + 1] = (Math.random() - 0.5) * 30;
        positions[i + 2] = (Math.random() - 0.5) * 30;

        velocities[i] = (Math.random() - 0.5) * 0.02;
        velocities[i + 1] = (Math.random() - 0.5) * 0.02;
        velocities[i + 2] = (Math.random() - 0.5) * 0.02;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.userData.velocities = velocities;

      const material = new THREE.PointsMaterial({
        size: 0.06,
        color: color,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.7,
      });

      return new THREE.Points(geometry, material);
    };

    const particles1 = createParticleSystem(0x00d4ff, 80);
    const particles2 = createParticleSystem(0xff00ff, 60);
    const particles3 = createParticleSystem(0x00ff88, 40);

    scene.add(particles1, particles2, particles3);

    // Create main geometric shapes
    const createCube = () => {
      const geometry = new THREE.IcosahedronGeometry(1.2, 4);
      const material = new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        emissive: 0x0066ff,
        shininess: 100,
        wireframe: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      return mesh;
    };

    const cube = createCube();
    cube.position.set(-5, 0, 0);
    scene.add(cube);

    // Create torus knot
    const torusKnotGeometry = new THREE.TorusKnotGeometry(1, 0.4, 100, 16);
    const torusKnotMaterial = new THREE.MeshPhongMaterial({
      color: 0xff00ff,
      emissive: 0xff0088,
      shininess: 100,
    });
    const torusKnot = new THREE.Mesh(torusKnotGeometry, torusKnotMaterial);
    torusKnot.position.set(5, 0, 0);
    torusKnot.castShadow = true;
    scene.add(torusKnot);

    // Create octahedron
    const octahedronGeometry = new THREE.OctahedronGeometry(1);
    const octahedronMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ff88,
      emissive: 0x00ff44,
      shininess: 80,
    });
    const octahedron = new THREE.Mesh(octahedronGeometry, octahedronMaterial);
    octahedron.position.set(0, 4, -5);
    octahedron.castShadow = true;
    scene.add(octahedron);

    // Advanced lighting
    const pointLight1 = new THREE.PointLight(0x00d4ff, 1.5, 100);
    pointLight1.position.set(8, 8, 8);
    pointLight1.castShadow = true;
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff00ff, 1.2, 100);
    pointLight2.position.set(-8, -8, 8);
    pointLight2.castShadow = true;
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0x00ff88, 0.8, 100);
    pointLight3.position.set(0, 0, 10);
    scene.add(pointLight3);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(ambientLight);

    // Event handlers
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / width) * 2 - 1,
        y: -(e.clientY / height) * 2 + 1,
      });
    };

    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // Animation loop
    let frameCount = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      frameCount++;

      // Update particles
      [particles1, particles2, particles3].forEach((particles) => {
        const positions = particles.geometry.attributes.position.array;
        const velocities = particles.geometry.userData.velocities;

        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += velocities[i];
          positions[i + 1] += velocities[i + 1];
          positions[i + 2] += velocities[i + 2];

          // Bounce particles
          if (Math.abs(positions[i]) > 15) velocities[i] *= -1;
          if (Math.abs(positions[i + 1]) > 15) velocities[i + 1] *= -1;
          if (Math.abs(positions[i + 2]) > 15) velocities[i + 2] *= -1;
        }
        particles.geometry.attributes.position.needsUpdate = true;
        particles.rotation.x += 0.0002;
        particles.rotation.y += 0.0003;
      });

      // Rotate main shapes with scroll influence
      const scrollInfluence = scrollY * 0.001;

      cube.rotation.x += 0.004 + scrollInfluence;
      cube.rotation.y += 0.006 + scrollInfluence;
      cube.position.x = -5 + mousePos.x * 1.5;
      cube.position.y = mousePos.y * 1.5;

      torusKnot.rotation.x += 0.003 + scrollInfluence;
      torusKnot.rotation.z += 0.005 + scrollInfluence;
      torusKnot.position.x = 5 - mousePos.x * 1.5;
      torusKnot.position.y = -mousePos.y * 1.5;

      octahedron.rotation.x += 0.002;
      octahedron.rotation.y += 0.004;
      octahedron.scale.set(
        1 + Math.sin(frameCount * 0.01) * 0.1,
        1 + Math.sin(frameCount * 0.01) * 0.1,
        1 + Math.sin(frameCount * 0.01) * 0.1
      );

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 min-h-screen text-white overflow-x-hidden">
      {/* 3D Canvas */}
      <div ref={containerRef} className="fixed top-0 left-0 w-full h-screen z-0" />

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="text-center max-w-5xl mx-auto relative z-10">
            {/* Badge */}
            <div className="mb-8 inline-block">
              <span className="px-4 py-2 bg-cyan-500/20 border border-cyan-400/50 rounded-full text-cyan-300 text-sm font-semibold backdrop-blur-md hover:bg-cyan-500/30 transition-all duration-300">
                ✨ Welcome to the Future of Image Search
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-7xl sm:text-8xl lg:text-9xl font-black mb-6 leading-tight">
              <span className="block text-white mb-2">Discover</span>
              <span className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-pulse">
                Your Vision
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl sm:text-2xl text-gray-300 mb-4 font-light max-w-2xl mx-auto leading-relaxed">
              An AI-powered image search engine that understands what you're looking for
            </p>
            <p className="text-sm sm:text-base text-gray-500 mb-12 max-w-2xl mx-auto">
              Search across billions of images using natural language, colors, styles, and visual similarity
            </p>

            {/* Search Bar with Glassmorphism */}
            <div className="mb-12 group">
              <div className="relative max-w-2xl mx-auto">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-full opacity-0 group-hover:opacity-75 blur transition duration-300" />
                <div className="relative bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-full px-8 py-4 flex items-center gap-4 hover:border-white/20 transition-all duration-300">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by keywords, colors, objects, style..."
                    className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-lg"
                  />
                  <button className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 text-sm sm:text-base">
                    Search
                  </button>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <button className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-bold text-lg hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105 relative overflow-hidden">
                <span className="relative z-10">Explore Gallery</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 transform scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
              </button>
              <button className="px-8 py-4 border-2 border-cyan-400/50 rounded-lg font-bold text-lg text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all duration-300 transform hover:scale-105">
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-8 border-t border-white/10">
              {[
                { number: '10B+', label: 'Images' },
                { number: '180+', label: 'Countries' },
                { number: '99.9%', label: 'Uptime' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section with Cards */}
        <section className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-20">
              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6">
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Powerful Features
                </span>
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Everything you need to find the perfect image
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: '🎨',
                  title: 'AI Vision',
                  description: 'Advanced neural networks that understand visual content, objects, and scenes',
                  color: 'from-cyan-500 to-blue-500',
                },
                {
                  icon: '⚡',
                  title: 'Lightning Fast',
                  description: 'Get results in milliseconds with distributed processing across 50+ servers',
                  color: 'from-blue-500 to-purple-500',
                },
                {
                  icon: '🎯',
                  title: 'Smart Filters',
                  description: 'Filter by color, dimensions, licenses, and AI-trained visual categories',
                  color: 'from-purple-500 to-pink-500',
                },
                {
                  icon: '🔐',
                  title: 'Privacy First',
                  description: 'End-to-end encrypted searches with zero tracking or data retention',
                  color: 'from-pink-500 to-red-500',
                },
                {
                  icon: '🌐',
                  title: 'Global Scale',
                  description: 'Access millions of royalty-free images from creators worldwide',
                  color: 'from-red-500 to-orange-500',
                },
                {
                  icon: '✨',
                  title: 'Collections',
                  description: 'Curated collections from top photographers and design communities',
                  color: 'from-orange-500 to-yellow-500',
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group relative"
                  onMouseEnter={() => setHoverCard(index)}
                  onMouseLeave={() => setHoverCard(null)}
                >
                  {/* Glow background */}
                  <div className={`absolute -inset-0.5 bg-gradient-to-r ${feature.color} rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-300`} />

                  {/* Card */}
                  <div className="relative bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-white/10 group-hover:border-white/30 transition-all duration-300 transform group-hover:scale-105">
                    {/* Icon */}
                    <div className={`text-5xl mb-6 group-hover:scale-125 transition-transform duration-300 ${hoverCard === index ? 'animate-bounce' : ''}`}>
                      {feature.icon}
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-blue-500 transition-all duration-300">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300 leading-relaxed">
                      {feature.description}
                    </p>

                    {/* Arrow */}
                    <div className="mt-6 flex items-center text-cyan-400 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-2 transition-all duration-300">
                      <span className="text-sm font-semibold">Learn more</span>
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-center mb-20">
              <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              {/* Left side - Text */}
              <div>
                <div className="space-y-8">
                  {[
                    {
                      num: '01',
                      title: 'Upload or Describe',
                      desc: 'Share an image or describe what you\'re looking for in natural language',
                    },
                    {
                      num: '02',
                      title: 'AI Analysis',
                      desc: 'Our AI instantly analyzes visual features, colors, objects, and style',
                    },
                    {
                      num: '03',
                      title: 'Smart Matching',
                      desc: 'Find similar images from our database using advanced algorithms',
                    },
                    {
                      num: '04',
                      title: 'Refine & Export',
                      desc: 'Apply filters, save collections, and download with proper licensing',
                    },
                  ].map((step, i) => (
                    <div key={i} className="flex gap-6 group cursor-pointer">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 group-hover:shadow-lg group-hover:shadow-cyan-500/50 transition-all duration-300">
                          <span className="text-xl font-bold text-white">{step.num}</span>
                        </div>
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-blue-500 transition-all duration-300">
                          {step.title}
                        </h3>
                        <p className="text-gray-400 group-hover:text-gray-300 transition-colors mt-2">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right side - Visual */}
              <div className="relative h-full min-h-96">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-3xl" />
                <div className="relative rounded-3xl border border-white/20 bg-slate-800/30 backdrop-blur-xl p-8 flex items-center justify-center min-h-96">
                  <div className="text-center">
                    <div className="text-6xl mb-4 animate-bounce">🔍</div>
                    <p className="text-gray-400">Interactive preview coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery Showcase */}
        <section className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-center mb-20">
              <span className="bg-gradient-to-r from-pink-400 to-orange-500 bg-clip-text text-transparent">
                Explore Collections
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { emoji: '🌅', name: 'Landscapes', count: '2.4M' },
                { emoji: '🌊', name: 'Water', count: '1.8M' },
                { emoji: '🏙️', name: 'Urban', count: '3.2M' },
                { emoji: '🌲', name: 'Nature', count: '4.1M' },
                { emoji: '🌺', name: 'Flowers', count: '1.9M' },
                { emoji: '🦋', name: 'Wildlife', count: '2.7M' },
                { emoji: '🌙', name: 'Night Sky', count: '0.9M' },
                { emoji: '✨', name: 'Abstract', count: '3.6M' },
              ].map((collection, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-2xl aspect-square cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 group-hover:from-cyan-500/40 group-hover:via-purple-500/40 group-hover:to-pink-500/40 transition-all duration-300" />
                  <div className="absolute inset-0 backdrop-blur-sm group-hover:backdrop-blur-0 transition-all duration-300" />
                  <div className="relative h-full flex flex-col items-center justify-center p-6 text-center border border-white/10 group-hover:border-white/30 rounded-2xl transition-all duration-300 group-hover:bg-slate-800/30">
                    <div className="text-6xl mb-4 group-hover:scale-150 transition-transform duration-300">
                      {collection.emoji}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-pink-500">
                      {collection.name}
                    </h3>
                    <p className="text-sm text-gray-400 group-hover:text-gray-300">
                      {collection.count} images
                    </p>
                    <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-cyan-400 font-semibold text-sm">Explore →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-center mb-20">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                Loved by Creators
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: 'Sarah Chen',
                  role: 'Graphic Designer',
                  content: 'AetherPix has revolutionized my design workflow. Finding the perfect stock image now takes seconds instead of hours.',
                  avatar: '👩‍🎨',
                },
                {
                  name: 'Marcus Johnson',
                  role: 'Photographer',
                  content: 'The AI really understands composition and lighting. It\'s like having a visual search expert at your fingertips.',
                  avatar: '👨‍📷',
                },
                {
                  name: 'Elena Rodriguez',
                  role: 'Content Creator',
                  content: 'Privacy matters to me. I love that AetherPix doesn\'t track my searches. It\'s the search engine I\'ve been waiting for.',
                  avatar: '👩‍💻',
                },
              ].map((testimonial, i) => (
                <div
                  key={i}
                  className="group relative"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl opacity-0 group-hover:opacity-50 blur transition duration-300" />
                  <div className="relative bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-white/10 group-hover:border-white/30 transition-all duration-300">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="text-4xl">{testimonial.avatar}</div>
                      <div>
                        <h4 className="font-bold text-white">{testimonial.name}</h4>
                        <p className="text-sm text-cyan-400">{testimonial.role}</p>
                      </div>
                    </div>
                    <p className="text-gray-300 italic">"{testimonial.content}"</p>
                    <div className="mt-4 flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-yellow-400">⭐</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 via-purple-600/10 to-pink-600/10 rounded-full filter blur-3xl" />
          </div>

          <div className="relative z-10 text-center max-w-4xl mx-auto">
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-8">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Ready to Transform Your Search?
              </span>
            </h2>

            <p className="text-xl sm:text-2xl text-gray-300 mb-12 leading-relaxed">
              Join thousands of creators, designers, and professionals discovering images smarter with AetherPix
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
              <button className="group px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-bold text-lg hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105 relative overflow-hidden">
                <span className="relative z-10">Get Started Free</span>
              </button>
              <button className="px-10 py-4 border-2 border-cyan-400/50 rounded-lg font-bold text-lg text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all duration-300 transform hover:scale-105">
                Schedule Demo
              </button>
            </div>

            <p className="text-gray-500 text-sm">
              ✨ No credit card required • ⚡ Instant setup • 🚀 Start searching in 30 seconds
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-950/95 backdrop-blur-xl border-t border-white/10 py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              {[
                {
                  title: 'Product',
                  links: ['Features', 'Collections', 'API', 'Pricing'],
                },
                {
                  title: 'Company',
                  links: ['About', 'Blog', 'Press', 'Careers'],
                },
                {
                  title: 'Resources',
                  links: ['Documentation', 'Community', 'Support', 'Status'],
                },
                {
                  title: 'Legal',
                  links: ['Privacy', 'Terms', 'Cookies', 'Contact'],
                },
              ].map((col, i) => (
                <div key={i}>
                  <h4 className="font-bold text-white mb-4">{col.title}</h4>
                  <ul className="space-y-2">
                    {col.links.map((link, j) => (
                      <li key={j}>
                        <a href="#" className="text-gray-500 hover:text-cyan-400 transition-colors text-sm">
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-gray-500 text-sm">
                  © 2024 AetherPix. All rights reserved.
                </p>
                <div className="flex gap-6">
                  {['Twitter', 'GitHub', 'LinkedIn', 'Discord'].map((social, i) => (
                    <a
                      key={i}
                      href="#"
                      className="text-gray-500 hover:text-cyan-400 transition-colors text-sm"
                    >
                      {social}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Global Styles */}
      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(0, 212, 255, 0.5); }
          50% { box-shadow: 0 0 40px rgba(0, 212, 255, 0.8); }
        }

        html {
          scroll-behavior: smooth;
        }

        ::-webkit-scrollbar {
          width: 12px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(15, 20, 25, 0.5);
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #06b6d4, #3b82f6);
          border-radius: 6px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #00d4ff, #0066ff);
        }

        .animate-bounce {
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}