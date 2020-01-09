import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { Row, Col, Input, Button } from 'antd';
import texts from './data/texts.json';
import firebase from './firebase';
import Swal from 'sweetalert2';

function useInterval(callback, delay){
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if(delay !== null){
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

function App(props) {
  const language = props.match.params.lang === "mgl" ? "mgl" : "eng";
  const inputRef = useRef(null);
  const [correctWordCount, setCorrectWordCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [text, setText] = useState('');
  const [task, setTask] = useState([]);
  const [time, setTime] = useState(0);
  const [isGoing, setIsGoing] = useState(false);

  useInterval(() => {
    setTime(time+1);
  }, isGoing === true ? 1000 : null);


  useEffect(() => {
    if (isGoing) {
      inputRef.current.focus();
    }
  }, [isGoing]);

  useEffect(() => {
    let length = texts[language].mainTexts.length-1;
    const task = texts[language].mainTexts[Math.round(Math.random()*length)].split(" ");
    for(let i = 0; i < task.length; i++){
      task[i] = {status: "neutral", word: task[i]}
    }
    setTask(task);
  }, []);

  const handleTextChange = (val) => {
    if(val[val.length-1] === " "){
      val = val.slice(0, val.length-1);
      console.log(val, task[wordCount].word);
      let updatedTask = [...task];
      if(val === task[wordCount].word){
        updatedTask[wordCount].status = "success";
        setTask(updatedTask);
        setCorrectWordCount(correctWordCount+1);
        setWordCount(wordCount+1);
        setText('');
      }else{
        updatedTask[wordCount].status = "fail";
        setTask(updatedTask);
      }
    }else{
      setText(val);
      console.log(val[val.length-1], wordCount, task.length);
      if(val[val.length-1] === "." && wordCount === task.length-1){
        val = val.slice(0, val.length);
        let updatedTask = [...task];
        if(val === task[wordCount].word){
          updatedTask[wordCount].status = "success";
          setTask(updatedTask);
          setCorrectWordCount(correctWordCount+1);
          setWordCount(wordCount+1);
          setText('');
          // alert("Done");
          setIsGoing(false);
          sendPerformanceData(Math.round((correctWordCount+1)/(wordCount+1)*100), Math.floor((correctWordCount+1)/(time/60)));
          getPerformance(Math.round((correctWordCount+1)/(wordCount+1)*100), Math.floor((correctWordCount+1)/(time/60)));
        }else{
          updatedTask[wordCount].status = "fail";
          setTask(updatedTask);
        }
      }
    }    
  }

  const sendPerformanceData = (accuracy, wpm) => {
    const db = firebase.firestore();
    db.collection("users").add({
      accuracy: accuracy,
      language: language,
      wpm: wpm
    })
    .then(function(docRef){
      console.log("Document written with ID: ", docRef.id);
    })
    .catch(function(error){
      console.log("Error adding document: ", error);
    })
  }

  const getPerformance = (accuracy, wpm) => {
    const db = firebase.firestore();
    const userRef = db.collection("users");
    const queryAll = userRef.where("language", "==", language);
    let totalSampleSize = 0;
    queryAll.get()
      .then(function(querySnapshot){
        totalSampleSize = querySnapshot.size;
      })
      .catch(function(error){
        console.log("Error getting total entries");
      });

    const query = userRef.orderBy("wpm").orderBy("accuracy").where("language", "==", language);
    query.get()
      .then(function(querySnapshot){
        console.log(querySnapshot);
        for(let i = 0; i < querySnapshot.size; i++){
          console.log(querySnapshot["docs"][i].id, " => ", querySnapshot["docs"][i].data());
          if(querySnapshot["docs"][i].data().wpm > wpm || 
            (querySnapshot["docs"][i].data().wpm === wpm && querySnapshot["docs"][i].data().accuracy >= accuracy)){
            console.log(`You perfomed better than ${Math.round((i+1)/querySnapshot.size*100)}% of all entries`);
            Swal.fire({
              "title": "Experimental Feature",
              "text": `We don't have enough data or sample size yet! But. you perfomed better than ${Math.round((i+1)/querySnapshot.size*100)}% of all entries.
                Please help us collect more data by sharing this app to your friends. Sample size: ${totalSampleSize}/1000`,
              "icon": 'success'
            })
            break;
          }
        };
      })
      .catch(function(error){
        console.log("Error getting documents: ", error);
      })
  }

  return (
    <div className="App">
      <img id="main-logo" src="/type-trainer-logo.png" alt="TypeTrainer1.0" /> 
      <div id="flags">
        <img src="/united-kingdom.svg" alt="ENG" onClick={() => window.location.href="/eng"}/>
        <img src="/mongolia.svg" alt="MGL" onClick={() => window.location.href="/mgl"} />
      </div>
      <p id="given-text">{task.map((item, index) => 
        <span 
          key={index} 
          style={ item.status === "success" ? { color: "green"} : (
            item.status === "fail" ? { color: "red" } : (
              wordCount === index ? 
              { color: "black" } : 
              { color: "rgba(0,0,0,0.3)" }
            )
          )}>{item.word} </span> 
      )}</p>
      <Input style={(task[wordCount] && task[wordCount].status === "fail") ?  {border: '3px solid red'} : null} ref={inputRef} id="text-input" value={text} disabled={isGoing === true ? false : true} onChange={e => handleTextChange(e.target.value)}/>

      <div className="stats">
      {
        isGoing === false && wordCount > 0 ?
          <Row>
            <Col span={24}>
              {
                Math.floor(correctWordCount/(time/60)) >= 70 ? 
                <h2 className="result">{texts[language].results.expert}</h2> : (
                  Math.floor(correctWordCount/(time/60)) >= 45 ?
                  <h2 className="result">{texts[language].results.proficient}</h2> : (
                    Math.floor(correctWordCount/(time/60)) >= 30 ? 
                    <h2 className="result">{texts[language].results.average}</h2> : 
                    <h2 className="result">{texts[language].results.poor}</h2>
                  )
                )
              }
            </Col>
          </Row> 
          : null
      }
      
      <Row>
        <Col span={12} className="stat-title">{texts[language].stats.wordsCorrect}</Col>
        <Col span={12}>{correctWordCount} / {wordCount}</Col>
      </Row>
      <Row>
        <Col span={12} className="stat-title">{texts[language].stats.accuracy}</Col>
        <Col span={12}>{wordCount === 0 ? 100 : Math.round(correctWordCount/wordCount*100)}%</Col>
      </Row>
      <Row>
        <Col span={12} className="stat-title">{texts[language].stats.timeElapsed}</Col>
        <Col span={12}>{Math.floor(time/60)} {texts[language].others.min} {time%60} {texts[language].others.sec}</Col>
      </Row>
      <Row>
        <Col span={12} className="stat-title">{texts[language].stats.wpm}</Col>
        <Col span={12}>{time === 0 ? 0 : Math.floor(correctWordCount/(time/60))}</Col>
      </Row>
      </div>

      {
        isGoing === false && wordCount === 0 ?
        <Button type="primary" size="large" onClick={() => {setIsGoing(true); document.getElementById("text-input").focus();}}>{texts[language].buttons.start}</Button>
        : (
          isGoing === false && wordCount > 0 ? 
          <Button type="primary" size="large" onClick={() => window.location.reload()}>{texts[language].buttons.retry}</Button> 
          : null
        )
      } 
      
    </div>
  );
}

export default App;
