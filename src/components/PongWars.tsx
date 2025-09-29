import { useEffect, useRef, useState } from 'react';

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  reverseColor: string;
  ballColor: string;
}

const PongWars = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dayScore, setDayScore] = useState(0);
  const [nightScore, setNightScore] = useState(0);
  const [iteration, setIteration] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Game constants - matching your color requirements
    const DAY_COLOR = '#072723';      // Your first color
    const NIGHT_COLOR = '#151515';    // Your second color  
    const DAY_BALL_COLOR = '#97FCE4'; // Mint ball for sage territory
    const NIGHT_BALL_COLOR = '#F7D4AC'; // Golden ball for charcoal territory
    
    const SQUARE_SIZE = 25;
    const MIN_SPEED = 5;
    const MAX_SPEED = 10;
    const FRAME_RATE = 100;

    const numSquaresX = canvas.width / SQUARE_SIZE;
    const numSquaresY = canvas.height / SQUARE_SIZE;

    let currentDayScore = 0;
    let currentNightScore = 0;
    let currentIteration = 0;

    // Initialize game board - split in half
    const squares: string[][] = [];
    for (let i = 0; i < numSquaresX; i++) {
      squares[i] = [];
      for (let j = 0; j < numSquaresY; j++) {
        squares[i][j] = i < numSquaresX / 2 ? DAY_COLOR : NIGHT_COLOR;
      }
    }

    // Initialize balls
    const balls: Ball[] = [
      {
        x: canvas.width / 4,
        y: canvas.height / 2,
        dx: 8,
        dy: -8,
        reverseColor: DAY_COLOR,
        ballColor: DAY_BALL_COLOR,
      },
      {
        x: (canvas.width / 4) * 3,
        y: canvas.height / 2,
        dx: -8,
        dy: 8,
        reverseColor: NIGHT_COLOR,
        ballColor: NIGHT_BALL_COLOR,
      },
    ];

    const drawBall = (ball: Ball) => {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, SQUARE_SIZE / 2, 0, Math.PI * 2, false);
      ctx.fillStyle = ball.ballColor;
      ctx.fill();
      
      // Add glow effect
      ctx.shadowColor = ball.ballColor;
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;
      
      ctx.closePath();
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
      }
      if (ball.y + ball.dy > canvas.height - SQUARE_SIZE / 2 || ball.y + ball.dy < SQUARE_SIZE / 2) {
        ball.dy = -ball.dy;
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

    const draw = () => {
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
            sage {dayScore} | charcoal {nightScore}
          </div>
          <div 
            className="text-sm font-mono opacity-70"
            style={{ color: 'hsl(var(--score-text))' }}
          >
            iteration {iteration.toLocaleString()}
          </div>
        </div>

        <div className="mt-8 text-center text-xs font-mono opacity-60 leading-relaxed">
          <p style={{ color: 'hsl(var(--score-text))' }}>
            The eternal battle between sage and charcoal territories
          </p>
          <p style={{ color: 'hsl(var(--score-text))' }}>
            Watch as luminous orbs fight to claim dominion over the battlefield
          </p>
        </div>
      </div>
    </div>
  );
};

export default PongWars;