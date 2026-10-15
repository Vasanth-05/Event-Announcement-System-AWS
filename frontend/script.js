const API_BASE_URL = "https://ycyoil37nb.execute-api.ap-south-1.amazonaws.com/prod";
const EVENTS_ENDPOINT = `${API_BASE_URL}/events`;
// This endpoint must be implemented in Lambda/API Gateway before direct uploads can work.
const UPLOAD_URL_ENDPOINT = `${API_BASE_URL}/uploads/presign`;
const eventList = document.querySelector("#event-list");
const eventCount = document.querySelector("#event-count");
const searchInput = document.querySelector("#event-search");
const emptyState = document.querySelector("#empty-state");
const mediaInput = document.querySelector("#event-media");
const mediaPreview = document.querySelector("#media-preview");

function formatDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return { day: "—", month: "TBA", full: "Date to be announced" };
  return { day: date.toLocaleDateString("en-US", { day: "2-digit" }), month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(), full: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) };
}
function escapeHTML(value) { return String(value ?? "").replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[char]); }
function safeUrl(value) { try { const url = new URL(String(value)); return ["https:", "http:"].includes(url.protocol) ? url.href : ""; } catch { return ""; } }
function renderEvents(events) {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = events.filter(item => [item.title,item.location,item.category,item.description].join(" ").toLowerCase().includes(query)).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  eventCount.textContent = `${String(filtered.length).padStart(2,"0")} EVENT${filtered.length===1?"":"S"}`;
  emptyState.classList.toggle("hidden", filtered.length>0);
  eventList.innerHTML = filtered.map(item => {
    const date = formatDate(item.date); const categoryClass = String(item.category||"other").toLowerCase().replace(/[^a-z]/g,"");
    const link = safeUrl(item.eventLink || item.link || item.registrationUrl || item.videoUrl);
    const linksHtml = link ? `<div class="event-links"><a class="event-link" href="${escapeHTML(link)}" target="_blank" rel="noopener noreferrer">${/youtu\.be|youtube\.com/i.test(link)?"Watch video / details":"Open event link"} ↗</a></div>` : "";
    const attachments = Array.isArray(item.attachments) ? item.attachments : (Array.isArray(item.media) ? item.media : []);
    const mediaHtml = attachments.map(file => {
      const url = safeUrl(file.fileUrl || file.url || file.publicUrl || file.downloadUrl); if (!url) return "";
      const type = String(file.contentType || file.type || "");
      if (type.startsWith("image/")) return `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer"><img loading="lazy" src="${escapeHTML(url)}" alt="${escapeHTML(file.fileName || file.name || item.title || "Event photo")}"></a>`;
      if (type.startsWith("video/")) return `<video controls preload="metadata" src="${escapeHTML(url)}"></video>`;
      return `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(file.fileName || file.name || "Open attachment")} ↗</a>`;
    }).join("");
    return `<article class="event-card"><div class="event-visual visual-${escapeHTML(categoryClass)}"><span class="visual-shape" aria-hidden="true"></span><div class="event-date"><strong>${escapeHTML(date.day)}</strong><span>${escapeHTML(date.month)}</span></div></div><div class="event-content"><span class="event-category">${escapeHTML(item.category||"Event")}</span><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.description)}</p>${linksHtml}${mediaHtml?`<div class="event-media">${mediaHtml}</div>`:""}<div class="event-meta"><span>${escapeHTML(item.location)} · ${escapeHTML(date.full)}</span><span aria-hidden="true">↗</span></div></div></article>`;
  }).join("");
}
let currentEvents=[];
async function loadEvents(){
  eventList.innerHTML='<p class="empty-state">Loading events…</p>';
  try { const response=await fetch(EVENTS_ENDPOINT); if(!response.ok) throw new Error(`GET /events returned HTTP ${response.status}`); const data=await response.json(); if(!Array.isArray(data)) throw new Error("API response is not an event list"); currentEvents=data; renderEvents(currentEvents); }
  catch(error){ console.error("Unable to load events:",error); eventList.innerHTML=""; emptyState.classList.remove("hidden"); emptyState.textContent="Couldn't load events from AWS. Check API Gateway CORS settings, then refresh."; eventCount.textContent="EVENTS UNAVAILABLE"; }
}
searchInput.addEventListener("input",()=>renderEvents(currentEvents));
mediaInput.addEventListener("change",()=>{
  mediaPreview.innerHTML=""; const files=Array.from(mediaInput.files||[]);
  if(files.length>5){mediaInput.value="";mediaPreview.textContent="Choose no more than 5 files per event.";return;}
  for(const file of files){
    if(!["image/jpeg","image/png","image/webp","video/mp4","video/webm"].includes(file.type)){mediaPreview.textContent="Unsupported file type. Use JPG, PNG, WebP, MP4, or WebM.";mediaInput.value="";return;}
    if(file.size>50*1024*1024){mediaPreview.textContent="Each file must be 50 MB or smaller. Consider using a video link for larger files.";mediaInput.value="";return;}
    const item=document.createElement("div"); item.className="preview-item"; const url=URL.createObjectURL(file);
    if(file.type.startsWith("image/")){const img=document.createElement("img");img.src=url;img.alt=file.name;item.append(img);} else {const video=document.createElement("video");video.src=url;video.muted=true;video.controls=true;item.append(video);}
    const label=document.createElement("div");label.textContent=`${file.name} (${(file.size/1024/1024).toFixed(1)} MB)`;item.append(label);mediaPreview.append(item);
  }
});
async function uploadSelectedFiles(files){
  const uploaded=[];
  for(const file of files){
    const signResponse=await fetch(UPLOAD_URL_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fileName:file.name,contentType:file.type,size:file.size})});
    const signData=await signResponse.json().catch(()=>({}));
    if(!signResponse.ok||!signData.uploadUrl||!signData.fileUrl) throw new Error(signData.error||"Secure upload endpoint is not configured yet. Deploy the Lambda/API upload route first.");
    const putResponse=await fetch(signData.uploadUrl,{method:"PUT",headers:{"Content-Type":file.type},body:file});
    if(!putResponse.ok) throw new Error(`Upload failed for ${file.name}. Check S3 CORS and presigned URL settings.`);
    uploaded.push({fileName:file.name,contentType:file.type,size:file.size,fileUrl:signData.fileUrl,key:signData.key});
  }
  return uploaded;
}
document.querySelector("#create-form").addEventListener("submit",async event=>{
  event.preventDefault(); const form=event.currentTarget; const data=new FormData(form); const message=document.querySelector("#create-message"); const button=form.querySelector('button[type="submit"]');
  const newEvent={title:String(data.get("title")||"").trim(),date:String(data.get("date")||""),location:String(data.get("location")||"").trim(),category:String(data.get("category")||"Other"),description:String(data.get("description")||"").trim(),eventLink:String(data.get("eventLink")||"").trim()};
  if(!newEvent.title||!newEvent.date||!newEvent.location||!newEvent.description){message.textContent="Please complete the required fields.";return;}
  if(newEvent.date<new Date().toISOString().slice(0,10)){message.textContent="Choose today or a future date for this event.";return;}
  if(newEvent.eventLink&&!safeUrl(newEvent.eventLink)){message.textContent="Enter a valid http or https link.";return;}
  button.disabled=true;
  try{
    const files=Array.from(mediaInput.files||[]); let attachments=[];
    if(files.length){message.textContent="Uploading media securely…";attachments=await uploadSelectedFiles(files);}
    message.textContent="Publishing event…";
    const response=await fetch(EVENTS_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...newEvent,attachments})});
    const result=await response.json().catch(()=>({})); if(!response.ok) throw new Error(result.error||`POST /events returned HTTP ${response.status}`);
    form.reset();mediaPreview.innerHTML="";message.textContent="Event published and saved to AWS.";await loadEvents();document.querySelector("#events").scrollIntoView({behavior:"smooth"});
  }catch(error){console.error("Unable to create event:",error);message.textContent=error.message||"Couldn't publish the event. Check API Gateway CORS settings and Lambda logs.";}
  finally{button.disabled=false;}
});
document.querySelector("#subscribe-form").addEventListener("submit",event=>{event.preventDefault();document.querySelector("#subscribe-message").textContent="Email subscriptions aren't connected yet. We'll enable them after configuring SNS.";event.currentTarget.reset();});
loadEvents();
