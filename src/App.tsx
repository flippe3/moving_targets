import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import AppleLogo from './assets/applePixels.png';
import Monitor from './assets/black.jpeg';
import answer0 from './assets/answer0.png';
import answer1 from './assets/answer1.png';
import answer2 from './assets/answer2.png';
import answer3 from './assets/answer3.png';
import answer4 from './assets/answer4.png';
import answer0_correct from './assets/answer0_1.png';
import answer1_correct from './assets/answer1_1.png';
import answer2_correct from './assets/answer2_1.png';
import answer3_correct from './assets/answer3_1.png';
import answer4_correct from './assets/answer4_1.png';
import ball from './assets/ball.png';
import finished from './assets/finished.png';


import useInterval from './hooks/useInterval';
import logo from './assets/logo.svg'
import { create } from 'domain';


const canvasX = 350;
const canvasY = 480;
const initialSnake = [
  [4, 5],
  [4, 6],
];
const initialApple = [14, 10];
const scale = 50;
const timeDelay = 10;
const questions = ["Hur glad har du känt dig de senaste 7 dagarna?", 
"Hur ofta har du känt dig motiverad i skolan de senaste 7 dagarna?", 
"Jag upplever att mina lärare har varit stödjande de senaste 7 dagarna.",
"Jag upplever att mina klasskamrater har varit stödjande de senaste 7 dagarna", 
"Jag är nöjd med min insats i skolan de senaste 7 dagarna.", 
"Jag har upplevt en hög arbetsbelastning och stress de senaste 7 dagarna.", "Hur ofta har du mått dåligt de senaste 7 dagarna?", 
"Hur ofta har du upplevt oro de senaste 7 dagarna?"];

const directions = [1, 1, 1, 1, 1];
let answersOrder = [0,1,2,3,4];
let speeds = [0.6,1,2,1.2,1.7];

const rectWidth = 100
const rectHeight = 40

let selectedAnswer = -1;
let gameIsLive = false;
let moveBall = false;
let ballRotation = 0;
let ballSpeed = 6;
let isWonned = false;

let answerPos = [[canvasX / 2 - rectWidth / 2, 5],
                   [canvasX / 2 - rectWidth / 2, 15 + rectHeight],
                   [canvasX / 2 - rectWidth / 2, 25 + 2 * rectHeight],
                   [canvasX / 2 - rectWidth / 2, 35 + 3 * rectHeight],
                   [canvasX / 2 - rectWidth / 2, 45 + 4 * rectHeight]];

const copyAnswerPos = [[canvasX / 2 - rectWidth / 2, 5],
[canvasX / 2 - rectWidth / 2, 15 + rectHeight],
[canvasX / 2 - rectWidth / 2, 25 + 2 * rectHeight],
[canvasX / 2 - rectWidth / 2, 35 + 3 * rectHeight],
[canvasX / 2 - rectWidth / 2, 45 + 4 * rectHeight]];

let ballPos = [canvasX / 2, canvasY - 40];
const ballRadius = 10;
let ballDelta = [0, 0];
let currQuestion = 0;
let currentQuestion = questions[currQuestion];

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [delay, setDelay] = useState<number | null>(null);
  let [currentQuestion, setCurrentQuestion] = useState(questions[currQuestion]);

  useInterval(() => play(), 0)
  useInterval(() => runGame(), delay);

  function setDPI() {
    // Set up CSS size.
    let dpi = 500;
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.style.width = canvas.style.width || canvas.width + 'px';
        canvas.style.height = canvas.style.height || canvas.height + 'px';

        // Get size information.
        var scaleFactor = dpi / 96;
        var width = parseFloat(canvas.style.width);
        var height = parseFloat(canvas.style.height);

        // Backup the canvas contents.
        var oldScale = canvas.width / width;
        var backupScale = scaleFactor / oldScale;
        // var backup = canvas.cloneNode(false);
        // backup.getContext('2d').drawImage(canvas, 0, 0);

        // Resize the canvas.
        var ctXX = canvas.getContext('2d');
        canvas.width = Math.ceil(width * scaleFactor);
        canvas.height = Math.ceil(height * scaleFactor);

        // Redraw the canvas image and scale future draws.
        ctx.setTransform(backupScale, 0, 0, backupScale, 0, 0);
        // ctx.drawImage(backup, 0, 0);
        ctx.setTransform(scaleFactor, 0, 0, scaleFactor, 0, 0);
      }
    }
  }

  function setQuestion(number: number) {
    setCurrentQuestion(questions[number]);
  }

  function createAnswers() {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx && !isWonned) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        for (let i = 0; i < 5; i++) {
          if (selectedAnswer == answersOrder[i]){
            let answer = document.getElementById('answer'+answersOrder[i]+'_correct') as HTMLCanvasElement;
            ctx.drawImage(answer,  answerPos[i][0], answerPos[i][1], rectWidth, rectHeight); 
          } else {
            let answer = document.getElementById('answer'+answersOrder[i]) as HTMLCanvasElement;
            ctx.drawImage(answer,  answerPos[i][0], answerPos[i][1], rectWidth, rectHeight); 
          }
        }
        if (gameIsLive) {
          // Creates the ball
          let ball = document.getElementById('ball') as HTMLCanvasElement;
          ctx.drawImage(ball,  ballPos[0] - ballRadius, ballPos[1], 2*ballRadius, 2*ballRadius); 
        }
      }
    }
  }
  
  function randomizeAnswers() {
    answerPos.forEach(element => {
      element[0] = 5 + Math.floor(Math.random() * (canvasX - rectWidth - 10));
    });
    answersOrder = answersOrder.sort((a, b) => 0.5 - Math.random());
    
    speeds = speeds.sort((a, b) => 0.5 - Math.random());

    directions.forEach(element => {
      let rand = Math.round(Math.random());
      if (rand == 0) {
        element = -1;
      } else {
        element = 1;
      }
    });
  }
  function moveQuestion() {
    for (let i = 0; i < 5; i++) {
      if (answerPos[i][0] + rectWidth >= canvasX) {
        directions[i] *= -1;
      } else if (answerPos[i][0] <= 0) {
        directions[i] *= -1;
      }
      answerPos[i][0] += directions[i] * speeds[i];
    }
  }

  function play() {
    setDPI();
    setDelay(timeDelay);
    createAnswers();
  }

  function drawWin() {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        let finished = document.getElementById('finished') as HTMLCanvasElement;
        ctx.drawImage(finished, 50 , 50, 200, 200);  
      }
    }
  }


  function movesBall() {
    if (ballPos[0] - ballRadius <= 0 || ballPos[0] + ballRadius >= canvasX) {
      ballDelta[0] *= -1;
    }
    if (ballPos[1] <= 0 || ballPos[1] + 2 * ballRadius >= canvasY) {
      ballDelta[1] *= -1;
    }
    for (let i = 0; i < 5; i++) {
      if ((ballPos[0] - ballRadius <= answerPos[i][0] + rectWidth && ballPos[0] + ballRadius >= answerPos[i][0]) && (ballPos[1] <= answerPos[i][1] + rectHeight && ballPos[1] + 2*ballRadius >= answerPos[i][1])) { 
        if (answersOrder[i] == selectedAnswer) {
          currQuestion += 1;
          if (currQuestion > 7){
            alert('You won!');
            isWonned = true;
          } else {
            setQuestion(currQuestion);
            ballDelta = [0, 0];
            ballPos = [canvasX / 2, canvasY - 40];
            answersOrder = [0,1,2,3,4];
            selectedAnswer = -1;
            for (let i = 0; i < 5; i++) {
              answerPos[i][0] = copyAnswerPos[i][0];
            }
            moveBall = false;
            gameIsLive = false;
          }
        } else {
          ballDelta = [0, 0];
          ballPos = [canvasX / 2, canvasY - 40];
          moveBall = false;
        }
      } 
    }
    ballPos[0] += ballDelta[0] * ballSpeed;
    ballPos[1] -= ballDelta[1] * ballSpeed; 
  }

  function runGame() {
    if (!isWonned){
      if (gameIsLive) {
        moveQuestion();
        if (moveBall) {
          movesBall();
        }
      }
      createAnswers();
    } 
  }

  function handleMouseInput(x: any, y: any) {
    if (!gameIsLive) {
      for (let i = 0; i < 5; i++) {
        if (x >= answerPos[i][0] && x <= answerPos[i][0] + rectWidth && y >= answerPos[i][1] && y <= answerPos[i][1] + rectHeight) {
          selectedAnswer = i;
          randomizeAnswers();
          gameIsLive = true;
          return;
        }
      }
    }
    else if (gameIsLive && !moveBall) {
      // if (x >= ballPos[0] && x <= ballPos[1] + ballRadius && y >= ballPos[1] && ballPos[1] + ballRadius) {
      //   console.log("Pressed Ball");
      //   //moveBall = true;   
      // }
      let deltax = x - ballPos[0];
      let deltay = ballPos[1] - y;
      if (deltax >= 0 && deltay >= 0) {
        let angle = Math.atan(deltay/deltax);
        ballDelta = [((Math.PI/2) - angle)/(Math.PI/2), angle/(Math.PI/2)];
        console.log("x speed %: ", ((Math.PI/2) - angle)/(Math.PI/2), "y speed %: ", angle/(Math.PI/2))
      } else if (deltax < 0 && deltay >= 0) {
        let angle = Math.atan(-deltax/deltay);
        ballDelta = [-angle/(Math.PI/2), ((Math.PI/2) - angle)/(Math.PI/2)];
        console.log("x speed %: ", -angle/(Math.PI/2), "y speed %: ", ((Math.PI/2) - angle)/(Math.PI/2))
      } else if (deltax >= 0 && deltay < 0) {
        let angle = Math.atan(-deltay/deltax);
        ballDelta = [((Math.PI/2) - angle)/(Math.PI/2), -angle/(Math.PI/2)];
        console.log("x speed %: ", ((Math.PI/2) - angle)/(Math.PI/2), "y speed %: ", -angle/(Math.PI/2))
      } else {
        let angle = Math.atan(deltax/deltay);
        ballDelta = [-angle/(Math.PI/2), -((Math.PI/2) - angle)/(Math.PI/2)];
        console.log("x speed %: ", -angle/(Math.PI/2), "y speed %: ", -((Math.PI/2) - angle)/(Math.PI/2))
      }
      moveBall = true;
    }
  }
  return (
    <div>
      <div id="question">
        <h4>{currentQuestion}</h4>
      </div>
      <img id="answer0" src={answer0} alt="answer" width="30" />
      <img id="answer1" src={answer1} alt="answer" width="30" />
      <img id="answer2" src={answer2} alt="answer" width="30" />
      <img id="answer3" src={answer3} alt="answer" width="30" />
      <img id="answer4" src={answer4} alt="answer" width="30" />
      <img id="answer0_correct" src={answer0_correct} alt="answer" width="30" />
      <img id="answer1_correct" src={answer1_correct} alt="answer" width="30" />
      <img id="answer2_correct" src={answer2_correct} alt="answer" width="30" />
      <img id="answer3_correct" src={answer3_correct} alt="answer" width="30" />
      <img id="answer4_correct" src={answer4_correct} alt="answer" width="30" />
      <img id="ball" src={ball} alt="ball" width="30" />
      <img id="finished" src={finished} alt="finished" width="30" />
      <canvas
        className="playArea"
        id="canvas"
        onClick={function (e) {
          var elem = document.getElementById('canvas');
          if (elem) {
            var elemLeft = elem.offsetLeft + elem.clientLeft;
            var elemTop = elem.offsetTop + elem.clientTop;  
            handleMouseInput(e.clientX - elemLeft, e.clientY - elemTop);
          }
        }}
        ref={canvasRef}
        width={`${canvasX}px`}
        height={`${canvasY}px`}
      />
    </div>
  );
};

export default App;
