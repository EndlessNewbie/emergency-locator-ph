let lastTrafficAlert = false;
let lastWeatherAlert = false;

/* SPEAK */
function speak(text){
  if(!window.speechSynthesis) return;
  const msg = new SpeechSynthesisUtterance(text);
  msg.rate = 1;
  msg.pitch = 1.05;
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

/* SAFE GET */
function getEl(id){
  return document.getElementById(id);
}

/* =========================
   TRAFFIC ENGINE
========================= */
function updateTraffic(){

  const panel = getEl("trafficPanel");
  const label = getEl("trafficLabel");

  if(!panel || !label) return;

  const hour = new Date().getHours();

  let congestion, speed, distance, jams;

  if((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)){
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

  getEl("congestion").innerText = congestion + "%";
  getEl("speed").innerText = speed.toFixed(1);
  getEl("distance").innerText = distance.toFixed(1);
  getEl("jams").innerText = jams;

  panel.classList.remove("border-green-400","border-yellow-400","border-red-500");

  if(congestion < 40){
    panel.classList.add("border-green-400");
    label.innerText = "Smooth traffic";
    lastTrafficAlert = false;
  }

  else if(congestion < 80){
    panel.classList.add("border-yellow-400");
    label.innerText = "Moderate traffic";
    lastTrafficAlert = false;
  }

  else{
    panel.classList.add("border-red-500");
    label.innerText = "Heavy congestion";

    if(!lastTrafficAlert){
      triggerAlert("Heavy congestion detected");
      speak("Heavy congestion detected in your area");
      lastTrafficAlert = true;
    }
  }
}

/* =========================
   VOICE
========================= */
function startListening(){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if(!SpeechRecognition){
    triggerAlert("Voice not supported in this browser");
    return;
  }

  const rec = new SpeechRecognition();
  rec.lang = "en-US";
  rec.start();

  rec.onresult = e=>{
    const cmd = e.results[0][0].transcript.toLowerCase();
    handle(cmd);
  };
}

/* =========================
   COMMANDS
========================= */
function handle(cmd){
  let res="Command not recognized";

  if(cmd.includes("hospital")){
    res="Searching hospitals";
    navigator.geolocation.getCurrentPosition(pos=>{
      const {latitude, longitude} = pos.coords;
      getEl("mapFrame").src =
        `https://www.google.com/maps?q=hospitals+near+${latitude},${longitude}&output=embed`;
    });
  }

  else if(cmd.includes("police")){
    res="Locating police stations";
    navigator.geolocation.getCurrentPosition(pos=>{
      const {latitude, longitude} = pos.coords;
      getEl("mapFrame").src =
        `https://www.google.com/maps?q=police+near+${latitude},${longitude}&output=embed`;
    });
  }

  else if(cmd.includes("fire")){
    res="Locating fire stations";
    navigator.geolocation.getCurrentPosition(pos=>{
      const {latitude, longitude} = pos.coords;
      getEl("mapFrame").src =
        `https://www.google.com/maps?q=fire+station+near+${latitude},${longitude}&output=embed`;
    });
  }

  getEl("output").innerText = res;
}

/* =========================
   WEATHER ENGINE
========================= */
function getWeatherIcon(code){
  if(code === 0) return "☀️ Clear";
  if(code <= 3) return "⛅ Partly cloudy";
  if(code <= 48) return "🌫 Fog";
  if(code <= 67) return "🌧 Rain";
  if(code <= 77) return "🌨 Snow";
  if(code <= 99) return "⛈ Storm";
  return "🌍 Unknown";
}

function updateWeather(){

fetch("https://api.open-meteo.com/v1/forecast?latitude=14.6&longitude=121&current_weather=true")
.then(res=>res.json())
.then(data=>{

  if(!data.current_weather){
    getEl("weather").innerText = "Weather unavailable";
    return;
  }

  const w = data.current_weather;
  const condition = getWeatherIcon(w.weathercode);

  const html = `
    <div>${condition}</div>
    <div>🌡 Temp: <b>${w.temperature}°C</b></div>
    <div>💨 Wind: <b>${w.windspeed} km/h</b></div>
  `;

  getEl("weather").innerHTML = html;

  /* ALERTS */
  if(w.windspeed > 35 && !lastWeatherAlert){
    triggerAlert("Strong winds detected");
    speak("Warning. Strong winds detected");
    lastWeatherAlert = true;
  }

  else if(w.weathercode >= 61 && w.weathercode <= 99 && !lastWeatherAlert){
    triggerAlert("Heavy rain detected");
    speak("Warning. Heavy rain detected. Possible flooding");
    lastWeatherAlert = true;
  }

  else if(w.windspeed < 30 && w.weathercode < 60){
    lastWeatherAlert = false;
  }

})
.catch(err=>{
  console.error("Weather error:", err);
  getEl("weather").innerText = "Failed to load weather";
});

}

/* =========================
   TIPS
========================= */
const tips = [
"Stay alert",
"Prepare go bag",
"Monitor weather",
"Know evacuation routes"
];

let tipIndex=0;
setInterval(()=>{
  const el = getEl("tips");
  if(el){
    el.innerText = tips[tipIndex];
    tipIndex=(tipIndex+1)%tips.length;
  }
},3000);

/* =========================
   INIT
========================= */
setInterval(updateTraffic,10000);
setInterval(updateWeather,60000);

updateTraffic();
updateWeather();
