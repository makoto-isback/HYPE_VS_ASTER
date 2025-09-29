import { useEffect, useRef, useState } from 'react';
import greenLogo from '@/assets/green-logo.png';
import yellowLogo from '@/assets/yellow-logo.jpg';

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  reverseColor: string;
  ballColor: string;
  logoSrc: string;
}

interface Spark {
  x: number;
  y: number;
  dx: number;
  dy: number;
  life: number;
  maxLife: number;
}

const PongWars = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dayScore, setDayScore] = useState(0);
  const [nightScore, setNightScore] = useState(0);
  const [iteration, setIteration] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [sparks, setSparks] = useState<Spark[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Game constants - matching your color requirements
    const DAY_COLOR = '#97FCE4';      // Updated first color
    const NIGHT_COLOR = '#151515';    // Your second color  
    const DAY_BALL_COLOR = '#97FCE4'; // Mint ball for sage territory
    const NIGHT_BALL_COLOR = '#F7D4AC'; // Golden ball for charcoal territory
    
    const SQUARE_SIZE = 25;
    const MIN_SPEED = 5;
    const MAX_SPEED = 10;
    const FRAME_RATE = 100;
    const RESET_TIME = 60; // Reset after 60 seconds

    const numSquaresX = canvas.width / SQUARE_SIZE;
    const numSquaresY = canvas.height / SQUARE_SIZE;

    let currentDayScore = 0;
    let currentNightScore = 0;
    let currentIteration = 0;
    let startTime = Date.now();
    let currentSparks: Spark[] = [];

    // Load logos
    const greenImg = new Image();
    greenImg.src = greenLogo;
    const yellowImg = new Image();
    yellowImg.src = yellowLogo;

    // Initialize game board - split in half
    const initializeBoard = () => {
      const squares: string[][] = [];
      for (let i = 0; i < numSquaresX; i++) {
        squares[i] = [];
        for (let j = 0; j < numSquaresY; j++) {
          squares[i][j] = i < numSquaresX / 2 ? DAY_COLOR : NIGHT_COLOR;
        }
      }
      return squares;
    };

    let squares = initializeBoard();

    // Initialize balls
    const initializeBalls = (): Ball[] => [
      {
        x: canvas.width / 4,
        y: canvas.height / 2,
        dx: 8,
        dy: -8,
        reverseColor: DAY_COLOR,
        ballColor: DAY_BALL_COLOR,
        logoSrc: greenLogo,
      },
      {
        x: (canvas.width / 4) * 3,
        y: canvas.height / 2,
        dx: -8,
        dy: 8,
        reverseColor: NIGHT_COLOR,
        ballColor: NIGHT_BALL_COLOR,
        logoSrc: yellowLogo,
      },
    ];

    let balls = initializeBalls();

    const drawBall = (ball: Ball) => {
      const img = ball.logoSrc === greenLogo ? greenImg : yellowImg;
      if (img.complete) {
        const size = SQUARE_SIZE;
        ctx.drawImage(img, ball.x - size/2, ball.y - size/2, size, size);
      } else {
        // Fallback to circle if image not loaded
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, SQUARE_SIZE / 2, 0, Math.PI * 2, false);
        ctx.fillStyle = ball.ballColor;
        ctx.fill();
        ctx.closePath();
      }
    };

    const createSparks = (x: number, y: number) => {
      for (let i = 0; i < 5; i++) {
        currentSparks.push({
          x: x,
          y: y,
          dx: (Math.random() - 0.5) * 10,
          dy: (Math.random() - 0.5) * 10,
          life: 20,
          maxLife: 20
        });
      }
    };

    const drawSparks = () => {
      currentSparks.forEach((spark, index) => {
        const alpha = spark.life / spark.maxLife;
        ctx.beginPath();
        ctx.arc(spark.x, spark.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.fill();
        
        spark.x += spark.dx;
        spark.y += spark.dy;
        spark.life--;
        
        if (spark.life <= 0) {
          currentSparks.splice(index, 1);
        }
      });
      setSparks([...currentSparks]);
    };

    const drawSquares = () => {
      currentDayScore = 0;
      currentNightScore = 0;

      for (let i = 0; i < numSquaresX; i++) {
        for (let j = 0; j < numSquaresY; j++) {
          ctx.fillStyle = squares[i][j];
          ctx.fillRect(i * SQUARE_SIZE, j * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);

          // Update scores
          if (squares[i][j] === DAY_COLOR) currentDayScore++;
          if (squares[i][j] === NIGHT_COLOR) currentNightScore++;
        }
      }

      setDayScore(currentDayScore);
      setNightScore(currentNightScore);
    };

    const checkSquareCollision = (ball: Ball) => {
      // Check multiple points around the ball's circumference
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        const checkX = ball.x + Math.cos(angle) * (SQUARE_SIZE / 2);
        const checkY = ball.y + Math.sin(angle) * (SQUARE_SIZE / 2);

        const i = Math.floor(checkX / SQUARE_SIZE);
        const j = Math.floor(checkY / SQUARE_SIZE);

        if (i >= 0 && i < numSquaresX && j >= 0 && j < numSquaresY) {
          if (squares[i][j] !== ball.reverseColor) {
            // Square hit! Update square color
            squares[i][j] = ball.reverseColor;

            // Determine bounce direction based on the angle
            if (Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))) {
              ball.dx = -ball.dx;
            } else {
              ball.dy = -ball.dy;
            }
          }
        }
      }
    };

    const checkBoundaryCollision = (ball: Ball) => {
      if (ball.x + ball.dx > canvas.width - SQUARE_SIZE / 2 || ball.x + ball.dx < SQUARE_SIZE / 2) {
        ball.dx = -ball.dx;
        createSparks(ball.x, ball.y);
      }
      if (ball.y + ball.dy > canvas.height - SQUARE_SIZE / 2 || ball.y + ball.dy < SQUARE_SIZE / 2) {
        ball.dy = -ball.dy;
        createSparks(ball.x, ball.y);
      }
    };

    const addRandomness = (ball: Ball) => {
      ball.dx += Math.random() * 0.02 - 0.01;
      ball.dy += Math.random() * 0.02 - 0.01;

      // Limit the speed of the ball
      ball.dx = Math.min(Math.max(ball.dx, -MAX_SPEED), MAX_SPEED);
      ball.dy = Math.min(Math.max(ball.dy, -MAX_SPEED), MAX_SPEED);

      // Make sure the ball always maintains a minimum speed
      if (Math.abs(ball.dx) < MIN_SPEED) ball.dx = ball.dx > 0 ? MIN_SPEED : -MIN_SPEED;
      if (Math.abs(ball.dy) < MIN_SPEED) ball.dy = ball.dy > 0 ? MIN_SPEED : -MIN_SPEED;
    };

    const resetGame = () => {
      squares = initializeBoard();
      balls.length = 0;
      balls.push(...initializeBalls());
      currentIteration = 0;
      startTime = Date.now();
      console.log("Game reset for seamless loop");
    };

    const draw = () => {
      // Check if 60 seconds have passed
      const elapsedTime = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, RESET_TIME - elapsedTime);
      setTimeRemaining(Math.ceil(remaining));

      if (elapsedTime >= RESET_TIME) {
        resetGame();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawSquares();

      balls.forEach((ball) => {
        drawBall(ball);
        checkSquareCollision(ball);
        checkBoundaryCollision(ball);
        ball.x += ball.dx;
        ball.y += ball.dy;

        addRandomness(ball);
      });

      drawSparks();

      currentIteration++;
      setIteration(currentIteration);
      
      if (currentIteration % 1_000 === 0) {
        console.log("iteration", currentIteration);
      }
    };

    const gameLoop = setInterval(draw, 1000 / FRAME_RATE);

    return () => {
      clearInterval(gameLoop);
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="flex flex-col items-center w-full max-w-2xl">
        <canvas
          ref={canvasRef}
          width={600}
          height={600}
          className="w-full max-w-[600px] aspect-square"
        />
        
        <div className="mt-8 text-center">
          <div 
            className="text-xl font-mono tracking-wider mb-2"
            style={{ color: 'hsl(var(--score-text))' }}
          >
            $HYPE {dayScore} | $ASTER {nightScore}
          </div>
          <div 
            className="text-sm font-mono opacity-70 mb-1"
            style={{ color: 'hsl(var(--score-text))' }}
          >
            iteration {iteration.toLocaleString()}
          </div>
          <div 
            className="text-sm font-mono opacity-90"
            style={{ color: timeRemaining <= 10 ? '#ff6b35' : 'hsl(var(--score-text))' }}
          >
            reset in: {timeRemaining}s
          </div>
        </div>

        <div className="mt-8 text-center text-xs font-mono opacity-60 leading-relaxed">
          <p style={{ color: 'hsl(var(--score-text))' }}>
            The eternal battle between $HYPE and $ASTER territories
          </p>
          <p style={{ color: 'hsl(var(--score-text))' }}>
            Created by Makoto
          </p>
        </div>
      </div>
    </div>
  );
};

export default PongWars;