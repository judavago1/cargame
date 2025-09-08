

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";

const { width, height } = Dimensions.get("window");
const CAR_WIDTH = 70;
const CAR_HEIGHT = 120;
const OBSTACLE_SIZE = 60;

export default function App() {
  const [carX, setCarX] = useState(width / 2 - CAR_WIDTH / 2);
  const [obstacles, setObstacles] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  const animationRefs = useRef([]);

  // Iniciar el juego
  const startGame = () => {
    setGameOver(false);
    setScore(0);
    setSpeedMultiplier(1);
    setCarX(width / 2 - CAR_WIDTH / 2);
    setObstacles([]);

    // Crear los primeros obstáculos
    for (let i = 0; i < 3; i++) {
      spawnObstacle(i * 1000);
    }
  };

  // Crear un nuevo obstáculo
  const spawnObstacle = (delay = 0) => {
    const newObstacle = {
      id: Date.now() + Math.random(),
      x: Math.random() * (width - OBSTACLE_SIZE),
      y: new Animated.Value(-OBSTACLE_SIZE),
      type: Math.floor(Math.random() * 3), // distintos diseños
    };

    setObstacles((prev) => [...prev, newObstacle]);

    setTimeout(() => {
      fallObstacle(newObstacle);
    }, delay);
  };

  // Animar caída de un obstáculo
  const fallObstacle = (obstacle) => {
    const baseDuration = 2500 + Math.random() * 2000;
    const anim = Animated.timing(obstacle.y, {
      toValue: height + OBSTACLE_SIZE,
      duration: baseDuration / speedMultiplier, // velocidad ajustada
      useNativeDriver: true,
    });

    animationRefs.current[obstacle.id] = anim;

    anim.start(({ finished }) => {
      if (finished && !gameOver) {
        setScore((prev) => {
          const newScore = prev + 1;

          // aumentar velocidad cada 30 puntos
          if (newScore % 30 === 0) {
            setSpeedMultiplier((mult) => mult + 0.3);
          }

          return newScore;
        });

        setObstacles((prev) => prev.filter((o) => o.id !== obstacle.id));
        spawnObstacle();
      }
    });
  };

  // Detectar colisión
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameOver) return;

      obstacles.forEach((obs) => {
        const y = obs.y.__getValue();
        if (
          y + OBSTACLE_SIZE >= height - CAR_HEIGHT - 20 &&
          carX < obs.x + OBSTACLE_SIZE &&
          carX + CAR_WIDTH > obs.x
        ) {
          // Reinicio inmediato
          Object.values(animationRefs.current).forEach((anim) => anim?.stop());
          startGame();
        }
      });
    }, 50);

    return () => clearInterval(interval);
  }, [carX, obstacles, gameOver]);

  // Control táctil
  const handleTouch = (evt) => {
    if (gameOver) {
      startGame();
      return;
    }

    const touchX = evt.nativeEvent.locationX;
    if (touchX < width / 2) {
      setCarX((prev) => Math.max(prev - 50, 0));
    } else {
      setCarX((prev) => Math.min(prev + 50, width - CAR_WIDTH));
    }
  };

  useEffect(() => {
    startGame();
  }, []);

  return (
    <TouchableWithoutFeedback onPress={handleTouch}>
      <View style={styles.container}>
        {/* Obstáculos */}
        {obstacles.map((obs) => (
          <Animated.View
            key={obs.id}
            style={[
              styles.obstacle,
              styles[`obstacle${obs.type}`],
              {
                transform: [{ translateY: obs.y }],
                left: obs.x,
              },
            ]}
          />
        ))}

        {/* Carro */}
        <View style={[styles.car, { left: carX }]}>
          <View style={styles.roof} />
          <View style={styles.window} />
          <View style={styles.wheelLeft} />
          <View style={styles.wheelRight} />
        </View>

        {/* Score */}
        <Text style={styles.score}>Score: {score}</Text>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
  },
  car: {
    position: "absolute",
    bottom: 20,
    width: CAR_WIDTH,
    height: CAR_HEIGHT,
    backgroundColor: "red",
    borderRadius: 10,
    alignItems: "center",
  },
  roof: {
    width: "60%",
    height: "25%",
    backgroundColor: "#b30000",
    marginTop: 5,
    borderRadius: 5,
  },
  window: {
    width: "50%",
    height: "20%",
    backgroundColor: "lightblue",
    marginTop: 5,
    borderRadius: 3,
  },
  wheelLeft: {
    position: "absolute",
    left: -10,
    bottom: 10,
    width: 20,
    height: 20,
    backgroundColor: "black",
    borderRadius: 10,
  },
  wheelRight: {
    position: "absolute",
    right: -10,
    bottom: 10,
    width: 20,
    height: 20,
    backgroundColor: "black",
    borderRadius: 10,
  },
  obstacle: {
    position: "absolute",
    width: OBSTACLE_SIZE,
    height: OBSTACLE_SIZE,
  },
  obstacle0: {
    backgroundColor: "blue",
    borderRadius: 10,
  },
  obstacle1: {
    backgroundColor: "green",
    borderRadius: OBSTACLE_SIZE / 2, // círculo
  },
  obstacle2: {
    backgroundColor: "purple",
    borderRadius: 5,
    transform: [{ rotate: "45deg" }], // rombo
  },
  score: {
    position: "absolute",
    top: 40,
    left: 20,
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
  },
});
