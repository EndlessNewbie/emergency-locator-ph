let lastAlert = false;

/* SPEAK */
function speak(text){
  const msg = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(msg);
}

/* ALERT */
function triggerAlert(msg){
  const div = document.createElement("div");
  div.className = "alert";
  div.innerText = msg;
  document.body.appendChild(div);
  setTimeout(()=>div.remove(),4000);
}

/* TRAFFIC ENGINE */
function updateTraffic(){

  const hour = new Date().getHours();

  let congestion, speed, distance, jams;

  if(hour >= 7 && hour <= 9 || hour >= 17 && hour <= 19){
    congestion = 80 + Math.floor(Math.random()*20);
    speed = 10 + Math.random()*10;
    distance = 3 + Math.random()*2;
    jams = 40 + Math.floor(Math.random()*20);
  } else {
    congestion = 30 + Math.floor(Math.random()*40);
    speed = 20 + Math.random()*15;
    distance = 5 + Math.random()*3;
    jams = 10 + Math.floor(Math.random()*20);
  }

  document.getElementById("congestion").innerText = congestion + "%";
  document.getElementById("speed").innerText = speed.toFixed(1);
  document.getElementById("distance").innerText = distance.toFixed(1);
  document.getElementById("jams").innerText = jams;

  const panel = document.getElementById("trafficPanel");
  const label = document.getElementById("trafficLabel");

  panel.classList.remove("border-green-400","border-yellow-400","border-red-500");

  if(congestion < 40){
    panel.classList.add("border-green-400");
    label.innerText = "Smooth traffic";
    lastAlert = false;
  }

  else if(congestion < 80){
    panel.classList.add("border-yellow-400");
    label.innerText = "Moderate traffic";
    lastAlert = false;
  }

  else{
    panel.classList.add("border-red-500");
    label.innerText = "Heavy congestion";

    if(!lastAlert){
      triggerAlert("Heavy congestion detected");
      speak("Heavy congestion detected in your area");
      lastAlert = true;
    }
  }

}

/* VOICE */
function startListening(){
  const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  rec.start();

  rec.onresult = e=>{
    const cmd = e.results[0][0].transcript.toLowerCase();
    handle(cmd);
  };
}

/* COMMANDS */
function handle(cmd){
  let res="Unknown";

  if(cmd.includes("hospital")){
    res="Searching hospitals";
    navigator.geolocation.getCurrentPosition(pos=>{
      const {latitude, longitude} = pos.coords;
      document.getElementById("mapFrame").src =
        `https://www.google.com/maps?q=hospitals+near+${latitude},${longitude}&output=embed`;
    });
  }

  document.getElementById("output").innerText = res;
}

function updateWeather(){

fetch("https://api.open-meteo.com/v1/forecast?latitude=14.6&longitude=121&current_weather=true")
.then(res=>res.json())
.then(data=>{

  const w = data.current_weather;

  const html = `
    <div>🌡 Temp: <b>${w.temperature}°C</b></div>
    <div>💨 Wind: <b>${w.windspeed} km/h</b></div>
    <div>🧭 Direction: <b>${w.winddirection}°</b></div>
  `;

  document.getElementById("weather").innerHTML = html;

});
}

setInterval(updateWeather, 60000);
updateWeather();


/* TIPS */
const tips = [
"Stay alert",
"Prepare go bag",
"Monitor weather",
"Know exits"
];

let i=0;
setInterval(()=>{
document.getElementById("tips").innerText = tips[i];
i=(i+1)%tips.length;
},3000);

/* INIT */
setInterval(updateTraffic,10000);
updateTraffic();
