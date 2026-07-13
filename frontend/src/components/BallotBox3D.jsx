import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial, Torus, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

// A single brass token that falls into the ballot box when a vote is cast.
function Token({ startTime }) {
  const ref = useRef();
  const [alive, setAlive] = useState(true);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() - startTime;
    if (t < 0 || !ref.current) return;
    const duration = 1.1;
    if (t > duration) {
      if (alive) setAlive(false);
      return;
    }
    const progress = t / duration;
    // ease-in fall
    const y = 3.2 - progress * progress * 4.6;
    ref.current.position.y = y;
    ref.current.rotation.x = t * 10;
    ref.current.rotation.z = t * 6;
    ref.current.material.opacity = progress > 0.8 ? 1 - (progress - 0.8) * 5 : 1;
  });

  if (!alive) return null;

  return (
    <mesh ref={ref} position={[0, 3.2, 0]}>
      <cylinderGeometry args={[0.22, 0.22, 0.06, 32]} />
      <meshStandardMaterial
        color="#C9A227"
        emissive="#C9A227"
        emissiveIntensity={0.35}
        metalness={0.9}
        roughness={0.25}
        transparent
      />
    </mesh>
  );
}

function BallotBoxMesh({ voteSignal, glow }) {
  const boxRef = useRef();
  const ringRef = useRef();
  const [tokens, setTokens] = useState([]);
  const clockRef = useRef(0);

  useEffect(() => {
    if (voteSignal === 0) return;
    setTokens((prev) => [...prev, clockRef.current]);
  }, [voteSignal]);

  useFrame((state, delta) => {
    clockRef.current = state.clock.getElapsedTime();
    if (boxRef.current) {
      boxRef.current.rotation.y += delta * 0.15;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.25;
      const targetScale = glow ? 1.08 : 1;
      ringRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.08
      );
    }
  });

  return (
    <group>
      {/* Glass ballot box body */}
      <group ref={boxRef}>
        <RoundedBox args={[2.4, 2.8, 2.4]} radius={0.18} smoothness={4}>
          <MeshTransmissionMaterial
            backside
            samples={6}
            thickness={0.4}
            roughness={0.08}
            transmission={1}
            ior={1.3}
            chromaticAberration={0.02}
            color="#7fa0c9"
            attenuationColor="#0B0F1A"
            attenuationDistance={2}
          />
        </RoundedBox>
        {/* Slot */}
        <mesh position={[0, 1.42, 0]}>
          <boxGeometry args={[1.1, 0.08, 0.3]} />
          <meshStandardMaterial color="#0B0F1A" />
        </mesh>
      </group>

      {/* Brass base ring — glows when a wallet is connected / election active */}
      <Torus
        ref={ringRef}
        args={[1.55, 0.07, 16, 64]}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, -1.5, 0]}
      >
        <meshStandardMaterial
          color="#C9A227"
          emissive="#C9A227"
          emissiveIntensity={glow ? 0.9 : 0.25}
          metalness={0.85}
          roughness={0.3}
        />
      </Torus>

      {tokens.map((t, i) => (
        <Token key={`${t}-${i}`} startTime={t} />
      ))}
    </group>
  );
}

export default function BallotBox3D({ voteSignal = 0, glow = false }) {
  const dpr = useMemo(() => (typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1), []);

  return (
    <div className="ballot-box-canvas">
      <Canvas dpr={dpr} camera={{ position: [3.2, 1.6, 4.2], fov: 40 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[4, 5, 4]} intensity={1.1} color="#ffe9b0" />
        <pointLight position={[-4, -2, -3]} intensity={0.4} color="#2DD4BF" />
        <BallotBoxMesh voteSignal={voteSignal} glow={glow} />
      </Canvas>
    </div>
  );
}
