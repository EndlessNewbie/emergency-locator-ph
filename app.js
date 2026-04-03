let lastTrafficAlert = false;
let lastWeatherAlert = false;
let lastFeedItems = [];
let lastAlertTime = 0;

/* =========================
   UTIL
========================= */
function getEl(id){ return document.getElementById(id); }

/* =========================
   SOUND (Jarvis beep)
========================= */
function playBeep(){
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  osc.frequency.value = 880;
  osc.connect(ctx.destination);
  osc.start();
  setTimeout(()=>osc.stop(),100);
}

/* =========================
   SPEAK
========================= */
function speak(text){
  if(!window.speechSynthesis) return;
  const msg = new SpeechSynthesisUtterance(text);
  msg.rate = 1;
  msg.pitch = 1.05;
  window.speechSynthesis.speak(msg);
}

/* =========================
   JARVIS OUTPUT (typing)
========================= */
function jarvisSay(text){
  const el = getEl("output");
  if(!el) return;

  el.innerText = "";
  let i=0;

  function type(){
    if(i < text.length){
      el.innerText += text[i];
      i++;
      setTimeout(type,20);
    }
  }

  type();
  speak(text);
}

/* =========================
   ALERT SYSTEM
========================= */
function triggerAlert(msg, type="info"){

  const now = Date.now();
  if(now - lastAlertTime < 4000) return;
  lastAlertTime = now;

  playBeep();

  // popup
  const div = document.createElement("div");
  div.className = "alert";
  div.innerText = msg;
  document.body.appendChild(div);
  setTimeout(()=>div.remove(),4000);

  // log
  const log = getEl("alertLog");
  if(log){
    const entry = document.createElement("div");

    if(type === "critical") entry.style.color = "#ef4444";
    else if(type === "warning") entry.style.color = "#facc15";
    else entry.style.color = "#22c55e";

    entry.innerText = "• " + msg;
    log.prepend(entry);
  }

}

/* =========================
   TRAFFIC
========================= */
function updateTraffic(){

  const panel = getEl("trafficPanel");
  const label = getEl("trafficLabel");

  if(!panel || !label) return;

  const hour = new Date().getHours();

  let congestion = (hour >=7 && hour<=9 || hour>=17 && hour<=19)
    ? 80 + Math.random()*20
    : 30 + Math.random()*40;

  const speed = 30 - congestion*0.2;
  const distance = 7 - congestion*0.05;
  const jams = Math.floor(congestion/2);

  getEl("congestion").innerText = Math.floor(congestion)+"%";
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
      triggerAlert("Heavy congestion detected","warning");
      jarvisSay("Heavy congestion detected. Consider alternate routes.");
      lastTrafficAlert = true;
    }
  }
}

/* =========================
   WEATHER
========================= */
function getWeatherIcon(code){
  if(code === 0) return "☀️ Clear";
  if(code <= 3) return "⛅ Cloudy";
  if(code <= 67) return "🌧 Rain";
  if(code <= 99) return "⛈ Storm";
  return "🌍 Unknown";
}

function updateWeather(){

fetch("https://api.open-meteo.com/v1/forecast?latitude=14.6&longitude=121&current_weather=true")
.then(res=>res.json())
.then(data=>{

  if(!data.current_weather) return;

  const w = data.current_weather;

  getEl("weather").innerHTML = `
    <div>${getWeatherIcon(w.weathercode)}</div>
    <div>Temp: ${w.temperature}°C</div>
    <div>Wind: ${w.windspeed} km/h</div>
  `;

  if(w.windspeed > 35 && !lastWeatherAlert){
    triggerAlert("Strong winds detected","warning");
    jarvisSay("Strong winds detected. Exercise caution.");
    lastWeatherAlert = true;
  }

  if(w.weathercode >= 61 && w.weathercode <= 99 && !lastWeatherAlert){
    triggerAlert("Heavy rain detected","critical");
    jarvisSay("Heavy rainfall detected. Possible flooding.");
    lastWeatherAlert = true;
  }

  if(w.windspeed < 30 && w.weathercode < 60){
    lastWeatherAlert = false;
  }

});
}

/* =========================
   FEEDS
========================= */
function monitorFeeds(){

const feeds = [
 "https://www.gmanetwork.com/news/rss/nation/"
];

feeds.forEach(feedUrl=>{

  fetch("https://api.rss2json.com/v1/api.json?rss_url="+encodeURIComponent(feedUrl))
  .then(res=>res.json())
  .then(data=>{

    data.items.slice(0,5).forEach(item=>{

      if(lastFeedItems.includes(item.guid)) return;
      lastFeedItems.push(item.guid);

      const text = (item.title+" "+item.description).toLowerCase();

      if(text.includes("accident")){
        triggerAlert("Accident reported","warning");
        jarvisSay("Accident reported nearby.");
      }

      if(text.includes("flood")){
        triggerAlert("Flood warning","critical");
        jarvisSay("Flood warning detected.");
      }

      if(text.includes("earthquake")){
        triggerAlert("Earthquake reported","critical");
        jarvisSay("Earthquake detected.");
      }

    });

  });

});
}

/* =========================
   VOICE
========================= */
function startListening(){

  const wave = getEl("wave");
  if(wave) wave.classList.remove("hidden");

  const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  rec.start();

  rec.onresult = e=>{
    if(wave) wave.classList.add("hidden");
    const cmd = e.results[0][0].transcript.toLowerCase();
    handle(cmd);
  };
}

/* =========================
   COMMANDS
========================= */
function handle(cmd){

  if(cmd.includes("hospital")){
    jarvisSay("Locating nearest hospitals.");
    navigator.geolocation.getCurrentPosition(pos=>{
      getEl("mapFrame").src =
      `https://www.google.com/maps?q=hospitals+near+${pos.coords.latitude},${pos.coords.longitude}&output=embed`;
    });
  }

}

/* =========================
   INIT
========================= */
setInterval(updateTraffic,10000);
setInterval(updateWeather,60000);
setInterval(monitorFeeds,30000);

updateTraffic();
updateWeather();
monitorFeeds();
