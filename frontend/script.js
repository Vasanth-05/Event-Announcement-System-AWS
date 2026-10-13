const API_BASE_URL = "https://ycyoil37nb.execute-api.ap-south-1.amazonaws.com/prod";
const EVENTS_ENDPOINT = `${API_BASE_URL}/events`;

const eventList = document.querySelector("#event-list");
const eventCount = document.querySelector("#event-count");
const searchInput = document.querySelector("#event-search");
const emptyState = document.querySelector("#empty-state");

function formatDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return { day: "—", month: "TBA", full: "Date to be announced" };
  return {
    day: date.toLocaleDateString("en-US", { day: "2-digit" }),
    month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    full: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  };
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function renderEvents(events) {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = events
    .filter(item => [item.title, item.location, item.category, item.description].join(" ").toLowerCase().includes(query))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  eventCount.textContent = `${String(filtered.length).padStart(2, "0")} EVENT${filtered.length === 1 ? "" : "S"}`;
  emptyState.classList.toggle("hidden", filtered.length > 0);

  eventList.innerHTML = filtered.map(item => {
    const date = formatDate(item.date);
    const categoryClass = String(item.category || "other").toLowerCase().replace(/[^a-z]/g, "");
    return `
      <article class="event-card">
        <div class="event-visual visual-${escapeHTML(categoryClass)}">
          <span class="visual-shape" aria-hidden="true"></span>
          <div class="event-date"><strong>${escapeHTML(date.day)}</strong><span>${escapeHTML(date.month)}</span></div>
        </div>
        <div class="event-content">
          <span class="event-category">${escapeHTML(item.category || "Event")}</span>
          <h3>${escapeHTML(item.title)}</h3>
          <p>${escapeHTML(item.description)}</p>
          <div class="event-meta"><span>${escapeHTML(item.location)} · ${escapeHTML(date.full)}</span><span aria-hidden="true">↗</span></div>
        </div>
      </article>`;
  }).join("");
}

let currentEvents = [];

async function loadEvents() {
  eventList.innerHTML = '<p class="empty-state">Loading events…</p>';
  try {
    const response = await fetch(EVENTS_ENDPOINT);
    if (!response.ok) throw new Error(`GET /events returned HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("API response is not an event list");
    currentEvents = data;
    renderEvents(currentEvents);
  } catch (error) {
    console.error("Unable to load events:", error);
    eventList.innerHTML = "";
    emptyState.classList.remove("hidden");
    emptyState.textContent = "Couldn't load events from AWS. Check API Gateway CORS settings, then refresh.";
    eventCount.textContent = "EVENTS UNAVAILABLE";
  }
}

searchInput.addEventListener("input", () => renderEvents(currentEvents));

document.querySelector("#create-form").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const message = document.querySelector("#create-message");
  const button = form.querySelector('button[type="submit"]');

  const newEvent = {
    title: String(data.get("title") || "").trim(),
    date: String(data.get("date") || ""),
    location: String(data.get("location") || "").trim(),
    category: String(data.get("category") || "Workshop"),
    description: String(data.get("description") || "").trim()
  };

  if (!newEvent.title || !newEvent.date || !newEvent.location || !newEvent.description) {
    message.textContent = "Please complete all required fields.";
    return;
  }
  if (newEvent.date < new Date().toISOString().slice(0, 10)) {
    message.textContent = "Choose today or a future date for this event.";
    return;
  }

  button.disabled = true;
  message.textContent = "Publishing event…";
  try {
    const response = await fetch(EVENTS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEvent)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `POST /events returned HTTP ${response.status}`);

    form.reset();
    message.textContent = "Event published and saved to AWS.";
    await loadEvents();
    document.querySelector("#events").scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    console.error("Unable to create event:", error);
    message.textContent = "Couldn't publish the event. Check API Gateway CORS settings and Lambda logs.";
  } finally {
    button.disabled = false;
  }
});

document.querySelector("#subscribe-form").addEventListener("submit", event => {
  event.preventDefault();
  document.querySelector("#subscribe-message").textContent =
    "Email subscriptions aren't connected yet. We'll enable them after configuring SNS.";
  event.currentTarget.reset();
});

loadEvents();
