// ═══════════════════════════════════════════════════════════
// THEME & SHARED CONSTANTS
// ═══════════════════════════════════════════════════════════

export const T = {
  bg: "#F4F8F6", card: "#FFFFFF", primary: "#4A9E7E", primaryLight: "#E8F5EE", primaryDark: "#2D7A5E",
  blue: "#5B9EC4", blueLight: "#E6F0F7", accent: "#E8C86A", accentLight: "#FFF8E7",
  text: "#2C3E36", textMuted: "#7A8F85", textLight: "#A3B5AD", border: "#E2EBE6", borderLight: "#EDF3EF",
  danger: "#D4645C", dangerLight: "#FDF0EF", sidebar: "#1B3A2D",
  shadow: "0 2px 8px rgba(27,58,45,0.06)", shadowMd: "0 4px 16px rgba(27,58,45,0.08)", shadowLg: "0 12px 40px rgba(27,58,45,0.1)",
  radius: 12, radiusSm: 8, radiusLg: 16,
};

export const SERVICED_AREAS = [
  "Twin Waters", "Maroochydore", "Kuluin", "Forest Glen", "Mons",
  "Buderim", "Alexandra Headland", "Mooloolaba", "Mountain Creek", "Minyama"
];

// ─── Default Pricing (used if nothing in localStorage) ───
export const DEFAULT_PRICING = {
  bedroom: { price: 25, unit: "per room", icon: "🛏️", label: "Bedroom", category: "room" },
  bathroom: { price: 35, unit: "per room", icon: "🚿", label: "Bathroom", category: "room" },
  living: { price: 25, unit: "per room", icon: "🛋️", label: "Living Room", category: "room" },
  kitchen: { price: 50, unit: "per room", icon: "🍳", label: "Kitchen", category: "room" },
  oven: { price: 65, unit: "per clean", icon: "♨️", label: "Oven Deep Clean", category: "addon" },
  sheets: { price: 10, unit: "per set", icon: "🛏️", label: "Sheet Changes", category: "addon" },
  windows: { price: 5, unit: "per window", icon: "🪟", label: "Window Cleaning", category: "addon", hasQuantity: true },
  organising: { price: 60, unit: "per session", icon: "📦", label: "Organising", category: "addon" },
};

// ─── Load/Save Pricing from localStorage ───
export function loadPricing() {
  try {
    const stored = localStorage.getItem("db_pricing");
    if (stored) return JSON.parse(stored);
  } catch {}
  return { ...DEFAULT_PRICING };
}

export function savePricing(pricing) {
  try {
    localStorage.setItem("db_pricing", JSON.stringify(pricing));
  } catch {}
}

// ─── Default Message Templates ───
export const DEFAULT_TEMPLATES = [
  {
    id: "welcome",
    name: "Welcome Reply",
    content: "Hey! 👋 Thanks so much for reaching out to Dust Bunnies! We'd love to help get your home sparkling. Could you fill in our quick form so we can put together a personalised quote for you? [FORM LINK] 🌿",
    isDefault: true,
  },
  {
    id: "quote_ready",
    name: "Quote Ready",
    content: "Hey {NAME}! 🌿 Great news — your personalised quote is ready! We've put together pricing for your {FREQUENCY} clean based on the details you shared. Take a look and let us know if you'd like to go ahead! 💚",
    isDefault: true,
  },
  {
    id: "follow_up",
    name: "Follow Up",
    content: "Hey {NAME}! 👋 Just checking in — did you get a chance to look at the quote we sent through? Happy to answer any questions or make adjustments. No pressure at all! 🌿",
    isDefault: true,
  },
  {
    id: "out_of_area",
    name: "Out of Area",
    content: "Hey! Thanks so much for getting in touch 💚 Unfortunately we don't currently service your area, but we're expanding soon! We'll keep your details on file and reach out when we do. Wishing you all the best! 🌿",
    isDefault: true,
  },
  {
    id: "booking_confirmed",
    name: "Booking Confirmed",
    content: "Yay! 🎉 You're all booked in! We're so excited to welcome you to the Dust Bunnies family. Your first clean is scheduled for [DATE]. See you then! 💚🌿",
    isDefault: true,
  },
];

export function loadTemplates() {
  try {
    const stored = localStorage.getItem("db_templates");
    if (stored) return JSON.parse(stored);
  } catch {}
  return [...DEFAULT_TEMPLATES];
}

export function saveTemplates(templates) {
  try {
    localStorage.setItem("db_templates", JSON.stringify(templates));
  } catch {}
}

// ─── Clients/Contacts Storage ───
export function loadClients() {
  try {
    const stored = localStorage.getItem("db_clients");
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

export function saveClients(clients) {
  try {
    localStorage.setItem("db_clients", JSON.stringify(clients));
  } catch {}
}

export const WEEKLY_DISCOUNT = 0.10;

export function calcQuote(details, pricing) {
  let subtotal = 0;
  const items = [];
  
  // Get room services
  const roomServices = Object.entries(pricing).filter(([_, v]) => v.category === "room");
  
  roomServices.forEach(([key, service]) => {
    const qty = details[key] || 0;
    if (qty > 0) {
      const total = qty * service.price;
      items.push({ description: `${service.label} cleaning`, qty, unitPrice: service.price, total });
      subtotal += total;
    }
  });

  // Get addon services
  const addonServices = Object.entries(pricing).filter(([_, v]) => v.category === "addon");
  
  addonServices.forEach(([key, service]) => {
    const active = details[key];
    const qty = service.hasQuantity ? (details[`${key}Count`] || 0) : 1;
    if (active && qty > 0) {
      const total = qty * service.price;
      items.push({ description: service.label, qty, unitPrice: service.price, total });
      subtotal += total;
    }
  });

  const isWeekly = details.frequency === "weekly";
  const discount = isWeekly ? Math.round(subtotal * WEEKLY_DISCOUNT * 100) / 100 : 0;
  const total = subtotal - discount;

  return { items, subtotal, discount, discountLabel: isWeekly ? "Weekly Clean Discount (10%)" : null, total };
}

// ─── Mock Data Generator ───
const MOCK_NAMES = [
  "Sarah Mitchell", "James Cooper", "Priya Sharma", "Lena Nguyen",
  "Tom Brady", "Emily Watson", "Mike Chen", "Jessica Lee",
  "David Kim", "Rachel Green", "Sophie Turner", "Alex Morrison",
  "Hannah Brooks", "Ben Gallagher", "Olivia Hart", "Nathan Price"
];

const MOCK_MESSAGES = [
  "Hi! I'd love a quote for a regular clean of my home please 🏡",
  "Hey, was recommended by a friend. Looking for fortnightly cleaning?",
  "Hello! Just moved to the area and need a cleaner. Can you help?",
  "Hi there, interested in your cleaning services. What do you need from me?",
  "Hey! Do you service my area? Looking for weekly cleaning.",
  "Hi, I need a deep clean + regular ongoing service. What are your rates?",
  "Hello! Saw your page on Facebook. Would love a quote please!",
  "Hey there! Looking for a reliable cleaner, my friend Sarah recommended you 💚",
];

const CHANNELS = ["messenger", "instagram", "email"];

let _idCounter = 100;
export function generateMockEnquiry(forceArea = null) {
  const id = ++_idCounter;
  const name = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
  const channel = CHANNELS[Math.floor(Math.random() * CHANNELS.length)];
  const message = MOCK_MESSAGES[Math.floor(Math.random() * MOCK_MESSAGES.length)];
  const suburb = forceArea || (Math.random() > 0.15
    ? SERVICED_AREAS[Math.floor(Math.random() * SERVICED_AREAS.length)]
    : "Caloundra");

  return {
    id, name, channel, suburb, message,
    status: "new",
    timestamp: new Date().toISOString(),
    avatar: name.split(" ").map(n => n[0]).join(""),
    details: null,
    quoteId: null,
    archived: false,
  };
}

export function generateMockFormSubmission() {
  const name = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
  const suburb = SERVICED_AREAS[Math.floor(Math.random() * SERVICED_AREAS.length)];
  return {
    name, suburb,
    email: name.toLowerCase().replace(" ", ".") + "@email.com",
    phone: "04" + Math.floor(10000000 + Math.random() * 90000000),
    bedrooms: 2 + Math.floor(Math.random() * 3),
    bathrooms: 1 + Math.floor(Math.random() * 2),
    living: 1 + Math.floor(Math.random() * 2),
    kitchen: 1,
    frequency: ["weekly", "fortnightly", "monthly"][Math.floor(Math.random() * 3)],
    oven: Math.random() > 0.6,
    sheets: Math.random() > 0.7,
    windows: Math.random() > 0.5,
    windowsCount: 2 + Math.floor(Math.random() * 8),
    organising: Math.random() > 0.8,
    notes: Math.random() > 0.5 ? "We have a dog, please keep the gate closed!" : "",
  };
}

// ─── Initial sample data ───
export function getInitialEnquiries() {
  const now = new Date();
  return [
    {
      id: 1, name: "Sarah Mitchell", channel: "messenger", suburb: "Buderim",
      message: "Hi! I'd love a quote for a regular clean of my 3-bed home please 🏡",
      status: "quote_ready", timestamp: new Date(now - 3600000 * 2).toISOString(),
      avatar: "SM", archived: false,
      details: { bedrooms: 3, bathrooms: 2, living: 1, kitchen: 1, frequency: "fortnightly", oven: true, sheets: false, windows: false, windowsCount: 0, organising: false, notes: "", email: "sarah.mitchell@email.com", phone: "0412345678" },
      quoteId: "Q001",
    },
    {
      id: 2, name: "James Cooper", channel: "email", suburb: "Maroochydore",
      message: "Hey, was recommended by a friend. Looking for weekly cleaning of our place?",
      status: "info_requested", timestamp: new Date(now - 3600000 * 5).toISOString(),
      avatar: "JC", details: null, quoteId: null, archived: false,
    },
    {
      id: 3, name: "Tom Brady", channel: "instagram", suburb: "Caloundra",
      message: "Hi do you clean in Caloundra? Need a fortnightly cleaner",
      status: "out_of_area", timestamp: new Date(now - 3600000 * 8).toISOString(),
      avatar: "TB", details: null, quoteId: null, archived: false,
    },
    {
      id: 4, name: "Lena Nguyen", channel: "messenger", suburb: "Mooloolaba",
      message: "Hello! Just moved here and need a regular cleaner. Have a 4 bed 2 bath.",
      status: "accepted", timestamp: new Date(now - 86400000).toISOString(),
      avatar: "LN", archived: false,
      details: { bedrooms: 4, bathrooms: 2, living: 2, kitchen: 1, frequency: "weekly", oven: false, sheets: true, windows: true, windowsCount: 8, organising: false, notes: "2 dogs, please close front gate", email: "lena.nguyen@email.com", phone: "0423456789" },
      quoteId: "Q002",
    },
    {
      id: 5, name: "Emily Watson", channel: "email", suburb: "Twin Waters",
      message: "Hi there, interested in your cleaning services for our holiday rental",
      status: "new", timestamp: new Date(now - 1800000).toISOString(),
      avatar: "EW", details: null, quoteId: null, archived: false,
    },
  ];
}

export function getInitialQuotes() {
  return [
    {
      id: "Q001", enquiryId: 1, name: "Sarah Mitchell", channel: "messenger", suburb: "Buderim",
      frequency: "Fortnightly", status: "pending_approval", createdAt: new Date(Date.now() - 3600000).toISOString(),
      details: { bedrooms: 3, bathrooms: 2, living: 1, kitchen: 1, frequency: "fortnightly", oven: true, sheets: false, windows: false, windowsCount: 0, organising: false },
    },
    {
      id: "Q002", enquiryId: 4, name: "Lena Nguyen", channel: "messenger", suburb: "Mooloolaba",
      frequency: "Weekly", status: "accepted", createdAt: new Date(Date.now() - 86400000).toISOString(),
      details: { bedrooms: 4, bathrooms: 2, living: 2, kitchen: 1, frequency: "weekly", oven: false, sheets: true, windows: true, windowsCount: 8, organising: false },
    },
  ];
}

// ─── Icon options for new services ───
export const ICON_OPTIONS = ["🧹", "🧽", "🪣", "🧴", "✨", "🏠", "🚿", "🛁", "🪟", "🚪", "🛋️", "🛏️", "🍳", "♨️", "📦", "🌿", "💨", "🧺", "🪑", "🖼️"];

// ═══════════════════════════════════════════════════════════
// SCHEDULING SYSTEM
// ═══════════════════════════════════════════════════════════

export const DEFAULT_SCHEDULE_SETTINGS = {
  teams: [
    { id: "team_a", name: "Team A", color: "#4A9E7E" },
    { id: "team_b", name: "Team B", color: "#5B9EC4" },
  ],
  workingHours: {
    start: "08:00",
    end: "16:00",
    breakDuration: 30, // minutes
    travelBuffer: 20, // minutes between jobs
  },
  durationEstimates: {
    bedroom: 25,
    bathroom: 30,
    living: 20,
    kitchen: 25,
    baseSetup: 30,
  },
  areaSchedule: {
    monday: ["Buderim", "Kuluin"],
    tuesday: ["Maroochydore", "Alexandra Headland"],
    wednesday: ["Mooloolaba", "Minyama"],
    thursday: ["Twin Waters", "Mountain Creek"],
    friday: ["Forest Glen", "Mons"],
  },
  jobsPerTeamPerDay: 3,
};

export function loadScheduleSettings() {
  try {
    const stored = localStorage.getItem("db_schedule_settings");
    if (stored) return JSON.parse(stored);
  } catch {}
  return { ...DEFAULT_SCHEDULE_SETTINGS };
}

export function saveScheduleSettings(settings) {
  try {
    localStorage.setItem("db_schedule_settings", JSON.stringify(settings));
  } catch {}
}

export function loadScheduledJobs() {
  try {
    const stored = localStorage.getItem("db_scheduled_jobs");
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

export function saveScheduledJobs(jobs) {
  try {
    localStorage.setItem("db_scheduled_jobs", JSON.stringify(jobs));
  } catch {}
}

export function loadScheduleClients() {
  try {
    const stored = localStorage.getItem("db_schedule_clients");
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

export function saveScheduleClients(clients) {
  try {
    localStorage.setItem("db_schedule_clients", JSON.stringify(clients));
  } catch {}
}

// ─── Calculate job duration from room counts ───
export function calculateDuration(client, settings) {
  const est = settings.durationEstimates;
  let duration = est.baseSetup;
  duration += (client.bedrooms || 0) * est.bedroom;
  duration += (client.bathrooms || 0) * est.bathroom;
  duration += (client.living || 0) * est.living;
  duration += (client.kitchen || 0) * est.kitchen;
  return duration;
}

// ─── Get day of week from date ───
export function getDayOfWeek(dateStr) {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[new Date(dateStr).getDay()];
}

// ─── Demo Data Generator ───
const DEMO_NAMES = [
  "Sarah Mitchell", "James Cooper", "Priya Sharma", "Lena Nguyen", "Tom Wilson",
  "Emily Watson", "Mike Chen", "Jessica Lee", "David Kim", "Rachel Green",
  "Sophie Turner", "Alex Morrison", "Hannah Brooks", "Ben Gallagher", "Olivia Hart",
  "Nathan Price", "Emma Collins", "Ryan Murphy", "Chloe Adams", "Jack Thompson",
  "Mia Roberts", "Luke Anderson", "Zoe Campbell", "Ethan Wright", "Lily Scott",
  "Noah Martin", "Grace Taylor", "Mason Brown", "Ava Davis", "Logan White",
  "Isla Moore", "Carter Hall", "Amelia Clark", "Owen Lewis", "Harper Young",
  "Sebastian King", "Ella Baker", "Henry Hill", "Scarlett Reed", "William Cook",
  "Victoria Morgan", "Daniel Evans", "Penelope Shaw", "Matthew Ross", "Aria Hughes"
];

const DEMO_NOTES = [
  "2 dogs, keep gate closed",
  "Key under front mat",
  "Ring doorbell, don't knock",
  "Alarm code: 1234#",
  "Cat is friendly",
  "Park in driveway",
  "Use side entrance",
  "Has a cleaner-friendly vacuum",
  "Prefers eco products only",
  "Leave invoice on kitchen counter",
  "Baby sleeps 1-3pm, be quiet",
  "Water plants on windowsill please",
  "",
  "",
  "",
  "",
  "",
];

export function generateDemoClients(count = 45) {
  const clients = [];
  const frequencies = [
    ...Array(18).fill("weekly"),
    ...Array(20).fill("fortnightly"),
    ...Array(7).fill("monthly"),
  ].sort(() => Math.random() - 0.5);

  const shuffledNames = [...DEMO_NAMES].sort(() => Math.random() - 0.5);
  const allSuburbs = [...SERVICED_AREAS];

  for (let i = 0; i < count; i++) {
    const name = shuffledNames[i] || `Client ${i + 1}`;
    const suburb = allSuburbs[i % allSuburbs.length];
    const frequency = frequencies[i] || "fortnightly";
    
    const bedrooms = 2 + Math.floor(Math.random() * 3); // 2-4
    const bathrooms = 1 + Math.floor(Math.random() * 2); // 1-2
    const living = 1 + Math.floor(Math.random() * 2); // 1-2
    const kitchen = 1;
    
    // Assign preferred day based on suburb (for clustering)
    const dayMap = {
      "Buderim": "monday", "Kuluin": "monday",
      "Maroochydore": "tuesday", "Alexandra Headland": "tuesday",
      "Mooloolaba": "wednesday", "Minyama": "wednesday",
      "Twin Waters": "thursday", "Mountain Creek": "thursday",
      "Forest Glen": "friday", "Mons": "friday",
    };
    const preferredDay = dayMap[suburb] || "monday";
    
    // Alternate teams based on index
    const team = i % 2 === 0 ? "team_a" : "team_b";
    
    clients.push({
      id: `demo_client_${i + 1}`,
      name,
      email: name.toLowerCase().replace(" ", ".") + "@email.com",
      phone: "04" + Math.floor(10000000 + Math.random() * 90000000),
      suburb,
      bedrooms,
      bathrooms,
      living,
      kitchen,
      frequency,
      preferredDay,
      preferredTime: ["morning", "afternoon", "anytime"][Math.floor(Math.random() * 3)],
      assignedTeam: team,
      estimatedDuration: null, // Will be calculated
      customDuration: null, // Manual override
      status: "active",
      notes: DEMO_NOTES[Math.floor(Math.random() * DEMO_NOTES.length)],
      isDemo: true,
      createdAt: new Date().toISOString(),
    });
  }
  
  return clients;
}

// ─── Generate schedule for clients over date range ───
export function generateScheduleForClients(clients, startDate, endDate, settings) {
  const jobs = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Track jobs per team per day to balance load
  const dayLoads = {}; // { "2025-02-17_team_a": 3, ... }
  
  const getDateStr = (d) => d.toISOString().split("T")[0];
  
  // For each client, determine their next clean dates
  clients.forEach(client => {
    if (client.status !== "active") return;
    
    const duration = client.customDuration || calculateDuration(client, settings);
    let currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dayName = getDayOfWeek(getDateStr(currentDate));
      const dateStr = getDateStr(currentDate);
      
      // Check if this day matches client's preferred day
      if (dayName === client.preferredDay) {
        const loadKey = `${dateStr}_${client.assignedTeam}`;
        const currentLoad = dayLoads[loadKey] || 0;
        
        // Only add if team has capacity
        if (currentLoad < settings.jobsPerTeamPerDay) {
          // Calculate start time based on existing jobs
          const baseStart = settings.workingHours.start;
          const [baseHour, baseMin] = baseStart.split(":").map(Number);
          const jobStartMinutes = (baseHour * 60 + baseMin) + 
            (currentLoad * (duration + settings.workingHours.travelBuffer));
          
          const startHour = Math.floor(jobStartMinutes / 60);
          const startMin = jobStartMinutes % 60;
          const endMinutes = jobStartMinutes + duration;
          const endHour = Math.floor(endMinutes / 60);
          const endMin = endMinutes % 60;
          
          jobs.push({
            id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            date: dateStr,
            clientId: client.id,
            clientName: client.name,
            suburb: client.suburb,
            teamId: client.assignedTeam,
            startTime: `${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}`,
            endTime: `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`,
            duration,
            status: "scheduled",
            isDemo: client.isDemo,
          });
          
          dayLoads[loadKey] = currentLoad + 1;
        }
        
        // Move to next occurrence based on frequency
        if (client.frequency === "weekly") {
          currentDate.setDate(currentDate.getDate() + 7);
        } else if (client.frequency === "fortnightly") {
          currentDate.setDate(currentDate.getDate() + 14);
        } else {
          currentDate.setDate(currentDate.getDate() + 28);
        }
      } else {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
  });
  
  return jobs;
}

// ─── Wipe all demo data ───
export function wipeDemoData() {
  const clients = loadScheduleClients().filter(c => !c.isDemo);
  const jobs = loadScheduledJobs().filter(j => !j.isDemo);
  saveScheduleClients(clients);
  saveScheduledJobs(jobs);
  return { clients, jobs };
}
