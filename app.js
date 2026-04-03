let lastFeedItems = [];
let lastAlertTime = 0;

/* UTIL */
function getEl(id){ return document.getElementById(id); }

/* SPEAK */
function speak(text){
  if(!window.speechSynthesis) return;
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

/* JARVIS */
function jarvisSay(text){
  const el = getEl("output");
  if(!el) return;

  el.innerText="";
  let i=0;

  function type(){
    if(i<text.length){
      el.innerText+=text[i++];
      setTimeout(type,15);
    }
  }
  type();
  speak(text);
}

/* ALERT */
function triggerAlert(msg){

  if(Date.now()-lastAlertTime < 3000) return;
  lastAlertTime = Date.now();

  const div = document.createElement("div");
  div.className="alert";
  div.innerText=msg;
  document.body.appendChild(div);
  setTimeout(()=>div.remove(),4000);

  const log = getEl("alertLog");
  if(log){
    const entry = document.createElement("div");
    entry.innerText="• "+msg;
    log.prepend(entry);
  }
}

/* TRAFFIC */
function updateTraffic(){

  let congestion = 30 + Math.random()*50;
  let speed = 30 - congestion*0.2;
  let distance = 7 - congestion*0.05;
  let jams = Math.floor(congestion/2);

  getEl("congestion").innerText=Math.floor(congestion)+"%";
  getEl("speed").innerText=speed.toFixed(1);
  getEl("distance").innerText=distance.toFixed(1);
  getEl("jams").innerText=jams;

  if(congestion>80){
    triggerAlert("Heavy traffic detected");
    jarvisSay("Heavy congestion detected");
  }

}

/* WEATHER */
function updateWeather(){

fetch("https://api.open-meteo.com/v1/forecast?latitude=14.6&longitude=121&current_weather=true")
.then(res=>res.json())
.then(data=>{

  const w = data.current_weather;
  if(!w) return;

  getEl("weather").innerHTML=`
    Temp: ${w.temperature}°C<br>
    Wind: ${w.windspeed} km/h
  `;

  if(w.windspeed>35){
    triggerAlert("Strong winds detected");
    jarvisSay("Strong winds detected");
  }

});
}

/* FEEDS */
function monitorFeeds(){

fetch("https://api.rss2json.com/v1/api.json?rss_url=https://www.gmanetwork.com/news/rss/nation/")
.then(res=>res.json())
.then(data=>{

  const feedLog = getEl("feedLog");
  if(!data.items) return;

  feedLog.innerHTML="";

  data.items.slice(0,5).forEach(item=>{

    const text=(item.title+" "+item.description).toLowerCase();

    const row=document.createElement("div");
    row.innerText="• "+item.title;
    feedLog.appendChild(row);

    if(lastFeedItems.includes(item.guid)) return;
    lastFeedItems.push(item.guid);

    if(text.includes("accident") || text.includes("traffic")){
      triggerAlert("Traffic incident reported");
    }

    if(text.includes("flood") || text.includes("rain")){
      triggerAlert("Flood risk detected");
      jarvisSay("Flood risk detected");
    }

    if(text.includes("earthquake")){
      triggerAlert("Earthquake detected");
      jarvisSay("Earthquake detected");
    }

  });

});
}

/* VOICE */
function startListening(){

const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
rec.start();

rec.onresult=e=>{
const cmd=e.results[0][0].transcript.toLowerCase();

if(cmd.includes("hospital")){
jarvisSay("Finding hospitals");
navigator.geolocation.getCurrentPosition(pos=>{
getEl("mapFrame").src=
`https://www.google.com/maps?q=hospitals+near+${pos.coords.latitude},${pos.coords.longitude}&output=embed`;
});
}

};
}

/* INIT */
setInterval(updateTraffic,10000);
setInterval(updateWeather,60000);
setInterval(monitorFeeds,20000);

updateTraffic();
updateWeather();
monitorFeeds();
