/* Run once with: npm run seed
   Populates MongoDB with Bangladesh destinations + demo accounts. */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Destination = require('./models/Destination');
const Accommodation = require('./models/Accommodation');
const Booking = require('./models/Booking');
const TripPlan = require('./models/TripPlan');

const destinations = [
  {
    "name": "Sajek Valley",
    "location": "Baghaichhari",
    "district": "Rangamati",
    "division": "Chittagong",
    "type": "hill",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Late Autumn",
      "Spring"
    ],
    "priceFrom": 5100,
    "durationMin": 2,
    "durationMax": 4,
    "rating": 4.9,
    "reviewCount": 960,
    "description": "Cloud-covered hilltop valley with tribal villages and sunrise views.",
    "highlights": [
      "Konglak Hill",
      "Helipad sunset",
      "Ruilui Para"
    ]
  },
  {
    "name": "Sundarbans",
    "location": "Mongla / Bagerhat",
    "district": "Bagerhat",
    "division": "Khulna",
    "type": "wildlife",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Late Autumn"
    ],
    "priceFrom": 4500,
    "durationMin": 2,
    "durationMax": 5,
    "rating": 4.8,
    "reviewCount": 2140,
    "description": "World's largest mangrove forest and home of the Royal Bengal Tiger.",
    "highlights": [
      "Tiger point",
      "Hiron Point",
      "Boat safari"
    ]
  },
  {
    "name": "Cox's Bazar",
    "location": "Cox's Bazar",
    "district": "Cox's Bazar",
    "division": "Chittagong",
    "type": "beach",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Spring",
      "Late Autumn"
    ],
    "priceFrom": 6200,
    "durationMin": 2,
    "durationMax": 7,
    "rating": 4.6,
    "reviewCount": 5830,
    "description": "World's longest natural sea beach with Himchari and Inani.",
    "highlights": [
      "Laboni Beach",
      "Himchari",
      "Inani",
      "Marine Drive"
    ]
  },
  {
    "name": "Srimangal",
    "location": "Srimangal",
    "district": "Moulvibazar",
    "division": "Sylhet",
    "type": "tea-garden",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Spring",
      "Autumn"
    ],
    "priceFrom": 3800,
    "durationMin": 1,
    "durationMax": 3,
    "rating": 4.7,
    "reviewCount": 1390,
    "description": "Tea capital of Bangladesh with Lawachara rainforest and seven-color tea.",
    "highlights": [
      "Lawachara NP",
      "Tea estates",
      "Nilkantha Tea Cabin"
    ]
  },
  {
    "name": "Paharpur",
    "location": "Badalgachhi",
    "district": "Naogaon",
    "division": "Rajshahi",
    "type": "historical",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Late Autumn",
      "Spring"
    ],
    "priceFrom": 2200,
    "durationMin": 1,
    "durationMax": 2,
    "rating": 4.4,
    "reviewCount": 410,
    "description": "UNESCO World Heritage Somapura Mahavihara Buddhist monastery ruins.",
    "highlights": [
      "Somapura Mahavihara",
      "Museum"
    ]
  },
  {
    "name": "Kuakata",
    "location": "Kuakata",
    "district": "Patuakhali",
    "division": "Barisal",
    "type": "beach",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Spring"
    ],
    "priceFrom": 3300,
    "durationMin": 2,
    "durationMax": 4,
    "rating": 4.3,
    "reviewCount": 780,
    "description": "Daughter of the Sea — rare spot to see both sunrise and sunset over the Bay.",
    "highlights": [
      "Sunrise point",
      "Sunset point",
      "Gangamati forest"
    ]
  },
  {
    "name": "Bandarban",
    "location": "Bandarban Sadar",
    "district": "Bandarban",
    "division": "Chittagong",
    "type": "hill",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Late Autumn",
      "Spring"
    ],
    "priceFrom": 4900,
    "durationMin": 2,
    "durationMax": 5,
    "rating": 4.6,
    "reviewCount": 1120,
    "description": "Highest hill district with waterfalls, caves and indigenous culture.",
    "highlights": [
      "Nilgiri",
      "Nafakhum",
      "Buddha Dhatu Jadi"
    ]
  },
  {
    "name": "Saint Martin Island",
    "location": "Saint Martin",
    "district": "Cox's Bazar",
    "division": "Chittagong",
    "type": "beach",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Spring"
    ],
    "priceFrom": 5500,
    "durationMin": 2,
    "durationMax": 3,
    "rating": 4.5,
    "reviewCount": 3200,
    "description": "Only coral island of Bangladesh in the Bay of Bengal.",
    "highlights": [
      "Coral beach",
      "Chera Dwip",
      "Snorkeling"
    ]
  },
  {
    "name": "Jaflong",
    "location": "Jaflong",
    "district": "Sylhet",
    "division": "Sylhet",
    "type": "hill",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Spring",
      "Autumn"
    ],
    "priceFrom": 2800,
    "durationMin": 1,
    "durationMax": 2,
    "rating": 4.4,
    "reviewCount": 980,
    "description": "Piyain River stone collection site with views of the Meghalaya hills.",
    "highlights": [
      "Piyain River",
      "Zero Point",
      "Lalakhal"
    ]
  },
  {
    "name": "Lalakhal",
    "location": "Sharighat",
    "district": "Sylhet",
    "division": "Sylhet",
    "type": "hill",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Spring",
      "Monsoon"
    ],
    "priceFrom": 2500,
    "durationMin": 1,
    "durationMax": 2,
    "rating": 4.5,
    "reviewCount": 640,
    "description": "Turquoise river boat ride through tea gardens toward the Indian border.",
    "highlights": [
      "Blue water boat",
      "Tea garden views"
    ]
  },
  {
    "name": "Ratargul Swamp Forest",
    "location": "Fatehpur",
    "district": "Sylhet",
    "division": "Sylhet",
    "type": "wildlife",
    "season": "Monsoon",
    "seasons": [
      "Monsoon",
      "Autumn",
      "Summer"
    ],
    "priceFrom": 2000,
    "durationMin": 1,
    "durationMax": 2,
    "rating": 4.6,
    "reviewCount": 1100,
    "description": "Freshwater swamp forest best explored by boat in the rainy season.",
    "highlights": [
      "Boat trails",
      "Bird watching"
    ]
  },
  {
    "name": "Bisanakandi",
    "location": "Bisanakandi",
    "district": "Sylhet",
    "division": "Sylhet",
    "type": "hill",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Spring"
    ],
    "priceFrom": 2300,
    "durationMin": 1,
    "durationMax": 2,
    "rating": 4.3,
    "reviewCount": 720,
    "description": "Stone bed of the Dholai river beside the Meghalaya foothills.",
    "highlights": [
      "River stones",
      "Border views"
    ]
  },
  {
    "name": "Rangamati",
    "location": "Rangamati Sadar",
    "district": "Rangamati",
    "division": "Chittagong",
    "type": "hill",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Late Autumn",
      "Spring"
    ],
    "priceFrom": 4200,
    "durationMin": 2,
    "durationMax": 4,
    "rating": 4.5,
    "reviewCount": 890,
    "description": "Kaptai Lake, hanging bridge and tribal culture of the Hill Tracts.",
    "highlights": [
      "Kaptai Lake",
      "Hanging Bridge",
      "Shuvolong"
    ]
  },
  {
    "name": "Khagrachhari",
    "location": "Khagrachhari Sadar",
    "district": "Khagrachhari",
    "division": "Chittagong",
    "type": "hill",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Spring"
    ],
    "priceFrom": 3600,
    "durationMin": 2,
    "durationMax": 4,
    "rating": 4.4,
    "reviewCount": 540,
    "description": "Alutila cave, richang waterfall and gateway to Sajek.",
    "highlights": [
      "Alutila Cave",
      "Richang Falls",
      "Yong Range"
    ]
  },
  {
    "name": "Nilgiri",
    "location": "Thanchi Road",
    "district": "Bandarban",
    "division": "Chittagong",
    "type": "hill",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Late Autumn"
    ],
    "priceFrom": 4800,
    "durationMin": 1,
    "durationMax": 3,
    "rating": 4.7,
    "reviewCount": 1500,
    "description": "Cloud-kissed army resort viewpoint above the Sangu valley.",
    "highlights": [
      "Nilgiri resort view",
      "Cloud sea"
    ]
  },
  {
    "name": "Nafakhum",
    "location": "Remakri",
    "district": "Bandarban",
    "division": "Chittagong",
    "type": "hill",
    "season": "Monsoon",
    "seasons": [
      "Monsoon",
      "Autumn",
      "Winter"
    ],
    "priceFrom": 6000,
    "durationMin": 3,
    "durationMax": 5,
    "rating": 4.8,
    "reviewCount": 430,
    "description": "Broad curtain waterfall on the Sangu river — the Niagara of Bangladesh.",
    "highlights": [
      "Nafakhum falls",
      "Remakri trail"
    ]
  },
  {
    "name": "Keokradong",
    "location": "Ruma",
    "district": "Bandarban",
    "division": "Chittagong",
    "type": "hill",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Late Autumn"
    ],
    "priceFrom": 4500,
    "durationMin": 2,
    "durationMax": 4,
    "rating": 4.6,
    "reviewCount": 680,
    "description": "One of the highest peaks in Bangladesh with overnight camp options.",
    "highlights": [
      "Peak trek",
      "Camping"
    ]
  },
  {
    "name": "Himchari",
    "location": "Himchari",
    "district": "Cox's Bazar",
    "division": "Chittagong",
    "type": "beach",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Spring"
    ],
    "priceFrom": 3000,
    "durationMin": 1,
    "durationMax": 2,
    "rating": 4.2,
    "reviewCount": 910,
    "description": "National park with waterfall and sea cliffs near Cox's Bazar.",
    "highlights": [
      "Himchari waterfall",
      "View point"
    ]
  },
  {
    "name": "Inani Beach",
    "location": "Inani",
    "district": "Cox's Bazar",
    "division": "Chittagong",
    "type": "beach",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Spring",
      "Late Autumn"
    ],
    "priceFrom": 2800,
    "durationMin": 1,
    "durationMax": 3,
    "rating": 4.3,
    "reviewCount": 1200,
    "description": "Coral stones and cleaner stretch of beach south of Cox's Bazar.",
    "highlights": [
      "Coral stones",
      "Quiet beach"
    ]
  },
  {
    "name": "Patenga Beach",
    "location": "Patenga",
    "district": "Chattogram",
    "division": "Chittagong",
    "type": "beach",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Spring",
      "Autumn"
    ],
    "priceFrom": 1500,
    "durationMin": 1,
    "durationMax": 1,
    "rating": 4,
    "reviewCount": 2100,
    "description": "City beach of Chattogram with marine drive and evening crowds.",
    "highlights": [
      "Marine Drive",
      "Sunset"
    ]
  },
  {
    "name": "Parki Beach",
    "location": "Anhwara",
    "district": "Chattogram",
    "division": "Chittagong",
    "type": "beach",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Spring"
    ],
    "priceFrom": 1800,
    "durationMin": 1,
    "durationMax": 2,
    "rating": 4.1,
    "reviewCount": 560,
    "description": "Quieter alternative to Patenga near the Karnaphuli estuary.",
    "highlights": [
      "Quiet beach",
      "Estuary views"
    ]
  },
  {
    "name": "Mahasthangarh",
    "location": "Mahasthan",
    "district": "Bogura",
    "division": "Rajshahi",
    "type": "historical",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Late Autumn",
      "Spring"
    ],
    "priceFrom": 1800,
    "durationMin": 1,
    "durationMax": 2,
    "rating": 4.3,
    "reviewCount": 390,
    "description": "Oldest known city ruins of Bangladesh on the Karatoya river.",
    "highlights": [
      "Citadel",
      "Museum",
      "Gokul Medh"
    ]
  },
  {
    "name": "Kantaji Temple",
    "location": "Kantajir",
    "district": "Dinajpur",
    "division": "Rangpur",
    "type": "historical",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Spring",
      "Late Autumn"
    ],
    "priceFrom": 1600,
    "durationMin": 1,
    "durationMax": 2,
    "rating": 4.5,
    "reviewCount": 520,
    "description": "18th-century terracotta Hindu temple masterpiece in Dinajpur.",
    "highlights": [
      "Terracotta panels",
      "Temple complex"
    ]
  },
  {
    "name": "Mainamati",
    "location": "Kotbari",
    "district": "Cumilla",
    "division": "Chittagong",
    "type": "historical",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Late Autumn",
      "Spring"
    ],
    "priceFrom": 1700,
    "durationMin": 1,
    "durationMax": 2,
    "rating": 4.2,
    "reviewCount": 340,
    "description": "Buddhist archaeological sites of Vihara and Shalban ruins.",
    "highlights": [
      "Shalban Vihara",
      "Mainamati Museum"
    ]
  },
  {
    "name": "Lalbagh Fort",
    "location": "Old Dhaka",
    "district": "Dhaka",
    "division": "Dhaka",
    "type": "historical",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Autumn",
      "Spring",
      "Late Autumn"
    ],
    "priceFrom": 500,
    "durationMin": 1,
    "durationMax": 1,
    "rating": 4.1,
    "reviewCount": 2800,
    "description": "Incomplete Mughal fort of Shaista Khan era in the heart of Old Dhaka.",
    "highlights": [
      "Diwan-i-Aam",
      "Tomb of Pari Bibi",
      "Mosque"
    ]
  },
  {
    "name": "Ahsan Manzil",
    "location": "Islampur",
    "district": "Dhaka",
    "division": "Dhaka",
    "type": "historical",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Autumn",
      "Spring"
    ],
    "priceFrom": 400,
    "durationMin": 1,
    "durationMax": 1,
    "rating": 4.2,
    "reviewCount": 1900,
    "description": "Pink Palace of the Dhaka Nawabs on the Buriganga riverfront.",
    "highlights": [
      "Museum",
      "Riverfront"
    ]
  },
  {
    "name": "Sonargaon",
    "location": "Panam City",
    "district": "Narayanganj",
    "division": "Dhaka",
    "type": "historical",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Late Autumn",
      "Spring"
    ],
    "priceFrom": 1200,
    "durationMin": 1,
    "durationMax": 2,
    "rating": 4.3,
    "reviewCount": 760,
    "description": "Ancient capital with Panam City colonial ruins and folk museum.",
    "highlights": [
      "Panam City",
      "Folk Art Museum",
      "Goaldi Mosque"
    ]
  },
  {
    "name": "Sreemangal Lawachara",
    "location": "Lawachara",
    "district": "Moulvibazar",
    "division": "Sylhet",
    "type": "wildlife",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Spring",
      "Autumn"
    ],
    "priceFrom": 3200,
    "durationMin": 1,
    "durationMax": 3,
    "rating": 4.6,
    "reviewCount": 880,
    "description": "National park habitat of capped langur and rare hoolock gibbon.",
    "highlights": [
      "Forest trails",
      "Wildlife spotting"
    ]
  },
  {
    "name": "Madhabkunda Waterfall",
    "location": "Barlekha",
    "district": "Moulvibazar",
    "division": "Sylhet",
    "type": "hill",
    "season": "Monsoon",
    "seasons": [
      "Monsoon",
      "Autumn",
      "Summer"
    ],
    "priceFrom": 2100,
    "durationMin": 1,
    "durationMax": 2,
    "rating": 4.4,
    "reviewCount": 990,
    "description": "One of the largest waterfalls in Bangladesh, fullest in monsoon.",
    "highlights": [
      "Waterfall",
      "Picnic spots"
    ]
  },
  {
    "name": "Tanguar Haor",
    "location": "Tahirpur",
    "district": "Sunamganj",
    "division": "Sylhet",
    "type": "wildlife",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Late Autumn"
    ],
    "priceFrom": 3500,
    "durationMin": 2,
    "durationMax": 3,
    "rating": 4.7,
    "reviewCount": 610,
    "description": "Ramsar wetland with migratory birds and floating villages.",
    "highlights": [
      "Bird watching",
      "Haor boat",
      "Watch tower"
    ]
  },
  {
    "name": "Hakalu Haor",
    "location": "Baralekha area",
    "district": "Moulvibazar",
    "division": "Sylhet",
    "type": "wildlife",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Late Autumn"
    ],
    "priceFrom": 3000,
    "durationMin": 1,
    "durationMax": 3,
    "rating": 4.3,
    "reviewCount": 280,
    "description": "Seasonal wetland famous for winter bird migration.",
    "highlights": [
      "Migratory birds",
      "Boat ride"
    ]
  },
  {
    "name": "Bichanakandi Zero Point",
    "location": "Companyganj",
    "district": "Sylhet",
    "division": "Sylhet",
    "type": "hill",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Spring"
    ],
    "priceFrom": 2400,
    "durationMin": 1,
    "durationMax": 2,
    "rating": 4.2,
    "reviewCount": 450,
    "description": "Border zero-point experience with crystal river streams.",
    "highlights": [
      "Zero Point",
      "Stream walk"
    ]
  },
  {
    "name": "Chandranath Hill",
    "location": "Sitakunda",
    "district": "Chattogram",
    "division": "Chittagong",
    "type": "cultural",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Spring",
      "Late Autumn"
    ],
    "priceFrom": 1500,
    "durationMin": 1,
    "durationMax": 1,
    "rating": 4.3,
    "reviewCount": 870,
    "description": "Sacred hill temple complex with panoramic Bay of Bengal views.",
    "highlights": [
      "Temple",
      "Cable car",
      "Viewpoint"
    ]
  },
  {
    "name": "Foy's Lake",
    "location": "Khulshi",
    "district": "Chattogram",
    "division": "Chittagong",
    "type": "cultural",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Spring",
      "Autumn",
      "Summer"
    ],
    "priceFrom": 1200,
    "durationMin": 1,
    "durationMax": 1,
    "rating": 4,
    "reviewCount": 2400,
    "description": "Artificial lake and amusement park popular for day trips.",
    "highlights": [
      "Lake boat",
      "Amusement rides"
    ]
  },
  {
    "name": "Kaptai Lake",
    "location": "Kaptai",
    "district": "Rangamati",
    "division": "Chittagong",
    "type": "hill",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Spring",
      "Late Autumn"
    ],
    "priceFrom": 4000,
    "durationMin": 1,
    "durationMax": 3,
    "rating": 4.5,
    "reviewCount": 720,
    "description": "Largest man-made lake in Bangladesh with boat trips to Shuvolong.",
    "highlights": [
      "Lake cruise",
      "Shuvolong falls"
    ]
  },
  {
    "name": "Boga Lake",
    "location": "Ruma",
    "district": "Bandarban",
    "division": "Chittagong",
    "type": "hill",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Late Autumn"
    ],
    "priceFrom": 5200,
    "durationMin": 2,
    "durationMax": 4,
    "rating": 4.7,
    "reviewCount": 510,
    "description": "High-altitude natural lake reached by trek from Ruma.",
    "highlights": [
      "Lake camp",
      "Trek"
    ]
  },
  {
    "name": "Amiakhum",
    "location": "Thanchi",
    "district": "Bandarban",
    "division": "Chittagong",
    "type": "hill",
    "season": "Monsoon",
    "seasons": [
      "Monsoon",
      "Autumn",
      "Winter"
    ],
    "priceFrom": 6500,
    "durationMin": 3,
    "durationMax": 6,
    "rating": 4.8,
    "reviewCount": 290,
    "description": "Remote waterfall near the Myanmar border for serious trekkers.",
    "highlights": [
      "Amiakhum falls",
      "Multi-day trek"
    ]
  },
  {
    "name": "Teknaf",
    "location": "Teknaf",
    "district": "Cox's Bazar",
    "division": "Chittagong",
    "type": "beach",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Spring"
    ],
    "priceFrom": 3500,
    "durationMin": 1,
    "durationMax": 3,
    "rating": 4.2,
    "reviewCount": 640,
    "description": "Southernmost tip of mainland Bangladesh facing Myanmar.",
    "highlights": [
      "Teknaf beach",
      "River Naf",
      "Wildlife sanctuary"
    ]
  },
  {
    "name": "Nijhum Dwip",
    "location": "Hatiya",
    "district": "Noakhali",
    "division": "Chittagong",
    "type": "wildlife",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Late Autumn"
    ],
    "priceFrom": 4800,
    "durationMin": 2,
    "durationMax": 4,
    "rating": 4.5,
    "reviewCount": 380,
    "description": "Island of silence with spotted deer and mangrove forests.",
    "highlights": [
      "Deer herds",
      "Mangrove trails"
    ]
  },
  {
    "name": "Char Kukri Mukri",
    "location": "Charfasson",
    "district": "Bhola",
    "division": "Barisal",
    "type": "wildlife",
    "season": "Winter",
    "seasons": [
      "Winter"
    ],
    "priceFrom": 4200,
    "durationMin": 2,
    "durationMax": 3,
    "rating": 4.3,
    "reviewCount": 210,
    "description": "Coastal wildlife sanctuary with deer, monkeys and migratory birds.",
    "highlights": [
      "Sanctuary",
      "Beach forest"
    ]
  },
  {
    "name": "Kuakata Buddhist Temple",
    "location": "Kuakata",
    "district": "Patuakhali",
    "division": "Barisal",
    "type": "cultural",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Spring"
    ],
    "priceFrom": 2000,
    "durationMin": 1,
    "durationMax": 2,
    "rating": 4.1,
    "reviewCount": 180,
    "description": "Seaside Rakhine Buddhist temples and cultural experience.",
    "highlights": [
      "Temple",
      "Rakhine culture"
    ]
  },
  {
    "name": "Barisal River Tour",
    "location": "Barisal Sadar",
    "district": "Barisal",
    "division": "Barisal",
    "type": "cultural",
    "season": "Monsoon",
    "seasons": [
      "Monsoon",
      "Autumn",
      "Summer"
    ],
    "priceFrom": 2500,
    "durationMin": 1,
    "durationMax": 3,
    "rating": 4.2,
    "reviewCount": 330,
    "description": "Riverine Bangladesh experience on the Kirtankhola and nearby canals.",
    "highlights": [
      "Launch ride",
      "Floating markets"
    ]
  },
  {
    "name": "Puthia Temple Complex",
    "location": "Puthia",
    "district": "Rajshahi",
    "division": "Rajshahi",
    "type": "historical",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Late Autumn",
      "Spring"
    ],
    "priceFrom": 1400,
    "durationMin": 1,
    "durationMax": 1,
    "rating": 4.4,
    "reviewCount": 410,
    "description": "Cluster of ornate Hindu temples including the large Shiva temple.",
    "highlights": [
      "Shiva temple",
      "Govinda temple"
    ]
  },
  {
    "name": "Varendra Museum",
    "location": "Rajshahi City",
    "district": "Rajshahi",
    "division": "Rajshahi",
    "type": "historical",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Autumn",
      "Spring"
    ],
    "priceFrom": 800,
    "durationMin": 1,
    "durationMax": 1,
    "rating": 4.2,
    "reviewCount": 290,
    "description": "Oldest museum in Bangladesh with rich archaeological collections.",
    "highlights": [
      "Museum galleries"
    ]
  },
  {
    "name": "Baghaichhari Lake",
    "location": "Baghaichhari",
    "district": "Rangamati",
    "division": "Chittagong",
    "type": "hill",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Spring"
    ],
    "priceFrom": 3000,
    "durationMin": 1,
    "durationMax": 3,
    "rating": 4.3,
    "reviewCount": 260,
    "description": "Scenic upazila lake area on the way toward Sajek.",
    "highlights": [
      "Lake views",
      "Hill roads"
    ]
  },
  {
    "name": "Sangu River Valley",
    "location": "Thanchi / Ruma",
    "district": "Bandarban",
    "division": "Chittagong",
    "type": "hill",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Late Autumn",
      "Spring"
    ],
    "priceFrom": 5000,
    "durationMin": 2,
    "durationMax": 5,
    "rating": 4.6,
    "reviewCount": 340,
    "description": "Crystal river valley treks connecting remote hill villages.",
    "highlights": [
      "River trek",
      "Village stays"
    ]
  },
  {
    "name": "Old Dhaka Food Trail",
    "location": "Chawk Bazar / Islampur",
    "district": "Dhaka",
    "division": "Dhaka",
    "type": "cultural",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Autumn",
      "Spring",
      "Summer",
      "Monsoon",
      "Late Autumn"
    ],
    "priceFrom": 1000,
    "durationMin": 1,
    "durationMax": 1,
    "rating": 4.5,
    "reviewCount": 1600,
    "description": "Biryani, kebabs, bakarkhani and heritage streets of historic Dhaka.",
    "highlights": [
      "Haji biryani",
      "Star Kabab",
      "Shankhari Bazar"
    ]
  },
  {
    "name": "National Parliament & Area",
    "location": "Sher-e-Bangla Nagar",
    "district": "Dhaka",
    "division": "Dhaka",
    "type": "cultural",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Autumn",
      "Spring",
      "Late Autumn"
    ],
    "priceFrom": 600,
    "durationMin": 1,
    "durationMax": 1,
    "rating": 4.4,
    "reviewCount": 1100,
    "description": "Louis Kahn designed National Assembly complex and surrounding parks.",
    "highlights": [
      "Parliament exterior",
      "Chandrima Udyan"
    ]
  },
  {
    "name": "Jamalpur Lauchapra",
    "location": "Dewanganj",
    "district": "Jamalpur",
    "division": "Mymensingh",
    "type": "cultural",
    "season": "Monsoon",
    "seasons": [
      "Monsoon",
      "Autumn"
    ],
    "priceFrom": 1800,
    "durationMin": 1,
    "durationMax": 2,
    "rating": 4,
    "reviewCount": 120,
    "description": "Seasonal riverside sandbars and rural river life in the Jamuna basin.",
    "highlights": [
      "River islands",
      "Rural stay"
    ]
  },
  {
    "name": "Modhupur National Park",
    "location": "Madhupur",
    "district": "Tangail",
    "division": "Dhaka",
    "type": "wildlife",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Late Autumn",
      "Spring"
    ],
    "priceFrom": 1500,
    "durationMin": 1,
    "durationMax": 2,
    "rating": 4.1,
    "reviewCount": 350,
    "description": "Sal forest reserve north of Dhaka with walking trails.",
    "highlights": [
      "Forest trails",
      "Birding"
    ]
  },
  {
    "name": "Bhawal National Park",
    "location": "Gazipur",
    "district": "Gazipur",
    "division": "Dhaka",
    "type": "wildlife",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Late Autumn",
      "Spring"
    ],
    "priceFrom": 900,
    "durationMin": 1,
    "durationMax": 1,
    "rating": 3.9,
    "reviewCount": 780,
    "description": "Easy day-trip sal forest and picnic area near the capital.",
    "highlights": [
      "Picnic",
      "Forest walk"
    ]
  },
  {
    "name": "Sitakunda Eco Park",
    "location": "Sitakunda",
    "district": "Chattogram",
    "division": "Chittagong",
    "type": "wildlife",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Spring",
      "Late Autumn"
    ],
    "priceFrom": 1200,
    "durationMin": 1,
    "durationMax": 1,
    "rating": 4,
    "reviewCount": 540,
    "description": "Hill eco-park with trails near Chandranath.",
    "highlights": [
      "Eco trails"
    ]
  },
  {
    "name": "Baitul Aman Jame Mosque",
    "location": "Guthia",
    "district": "Barisal",
    "division": "Barisal",
    "type": "cultural",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Spring",
      "Autumn"
    ],
    "priceFrom": 1100,
    "durationMin": 1,
    "durationMax": 1,
    "rating": 4.3,
    "reviewCount": 470,
    "description": "Grand riverside mosque complex known as the Guthia Mosque.",
    "highlights": [
      "Mosque architecture"
    ]
  },
  {
    "name": "Mujibnagar Memorial",
    "location": "Mujibnagar",
    "district": "Meherpur",
    "division": "Khulna",
    "type": "historical",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Late Autumn",
      "Spring"
    ],
    "priceFrom": 1000,
    "durationMin": 1,
    "durationMax": 1,
    "rating": 4.2,
    "reviewCount": 260,
    "description": "Site of the 1971 provisional government proclamation.",
    "highlights": [
      "Memorial complex"
    ]
  },
  {
    "name": "Rabindra Kuthibari",
    "location": "Shilaidaha",
    "district": "Kushtia",
    "division": "Khulna",
    "type": "cultural",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Late Autumn",
      "Spring"
    ],
    "priceFrom": 1300,
    "durationMin": 1,
    "durationMax": 2,
    "rating": 4.4,
    "reviewCount": 580,
    "description": "Tagore's country house on the Padma where many songs and poems were written.",
    "highlights": [
      "Kuthibari museum",
      "River Padma"
    ]
  },
  {
    "name": "Jatiyo Sriti Shoudho",
    "location": "Savar",
    "district": "Dhaka",
    "division": "Dhaka",
    "type": "historical",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Autumn",
      "Spring",
      "Late Autumn"
    ],
    "priceFrom": 500,
    "durationMin": 1,
    "durationMax": 1,
    "rating": 4.6,
    "reviewCount": 3200,
    "description": "National Martyrs' Memorial commemorating the Liberation War.",
    "highlights": [
      "Memorial monument"
    ]
  },
  {
    "name": "Sundarbans Mongla Gateway",
    "location": "Mongla",
    "district": "Bagerhat",
    "division": "Khulna",
    "type": "wildlife",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Late Autumn"
    ],
    "priceFrom": 4000,
    "durationMin": 2,
    "durationMax": 4,
    "rating": 4.5,
    "reviewCount": 700,
    "description": "Primary launch point for multi-day Sundarbans boat expeditions.",
    "highlights": [
      "Jetty",
      "Boat safari start"
    ]
  },
  {
    "name": "Sixty Dome Mosque",
    "location": "Bagerhat",
    "district": "Bagerhat",
    "division": "Khulna",
    "type": "historical",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Late Autumn",
      "Spring"
    ],
    "priceFrom": 900,
    "durationMin": 1,
    "durationMax": 1,
    "rating": 4.7,
    "reviewCount": 1400,
    "description": "UNESCO listed Shait Gumbad Mosque of Khan Jahan Ali.",
    "highlights": [
      "Shait Gumbad",
      "Khan Jahan tomb"
    ]
  },
  {
    "name": "Tangail Saree Villages",
    "location": "Delduar / Kalihati",
    "district": "Tangail",
    "division": "Dhaka",
    "type": "cultural",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Autumn",
      "Spring"
    ],
    "priceFrom": 1400,
    "durationMin": 1,
    "durationMax": 2,
    "rating": 4.1,
    "reviewCount": 190,
    "description": "Handloom villages producing famous Tangail cotton sarees.",
    "highlights": [
      "Handloom demos",
      "Local markets"
    ]
  },
  {
    "name": "Netrokona Durgapur",
    "location": "Durgapur",
    "district": "Netrokona",
    "division": "Mymensingh",
    "type": "hill",
    "season": "Winter",
    "seasons": [
      "Winter",
      "Spring"
    ],
    "priceFrom": 2200,
    "durationMin": 1,
    "durationMax": 3,
    "rating": 4.2,
    "reviewCount": 240,
    "description": "Birishiri hills, porcelain factory area and Someshwari river views near the Indian border.",
    "highlights": [
      "Birishiri",
      "Someshwari River"
    ]
  }
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Seeding...');

  await Destination.deleteMany({});
  const createdDestinations = await Destination.insertMany(destinations);
  const sajek = createdDestinations.find((d) => d.name === 'Sajek Valley');
  console.log(`Inserted ${createdDestinations.length} destinations.`);

  let provider = await User.findOne({ email: 'provider@deshvromon.com' });
  if (!provider) {
    const hashed = await bcrypt.hash('provider123', 10);
    provider = await User.create({
      name: 'Megh Machang Cottage',
      email: 'provider@deshvromon.com',
      password: hashed,
      role: 'provider',
      emailVerified: true
    });
    console.log('Created demo provider: provider@deshvromon.com / provider123');
  } else if (!provider.emailVerified) {
    provider.emailVerified = true;
    provider.otpCode = null;
    provider.otpExpires = null;
    await provider.save();
  }

  if (sajek) {
    await Accommodation.deleteMany({ destination: sajek._id });
    await Accommodation.insertMany([
      {
        destination: sajek._id, provider: provider._id, name: 'Megh Machang Cottage',
        location: 'Konglak Hill Road, Sajek', pricePerNight: 8500, bookingMode: 'whole-property',
        totalRooms: 3, maxGuests: 8,
        rooms: [
          { name: 'Cloud Double', type: 'double', capacity: 2, quantity: 2, pricePerNight: 2400, description: 'Valley view double bed' },
          { name: 'Family Suite', type: 'family', capacity: 4, quantity: 1, pricePerNight: 3800, description: 'Two bedrooms + living' }
        ],
        amenities: ['Cloud view', 'Bonfire', 'Breakfast incl.', 'Entire cottage'],
        rating: 4.9, status: 'Verified',
        propertyNote: 'Whole cottage must be booked. Includes 2 double rooms + 1 family suite (sleeps up to 8).'
      },
      {
        destination: sajek._id, provider: provider._id, name: 'Ruilui Resort',
        location: 'Ruilui Para, Sajek', pricePerNight: 1800, bookingMode: 'per-room',
        totalRooms: 12, maxGuests: 24,
        rooms: [
          { name: 'Single Room', type: 'single', capacity: 1, quantity: 4, pricePerNight: 1200, description: 'One single bed' },
          { name: 'Double Room', type: 'double', capacity: 2, quantity: 6, pricePerNight: 1800, description: 'Queen bed, balcony' }
        ],
        amenities: ['Balcony', 'Parking', 'Restaurant'],
        rating: 4.6, status: 'Verified',
        propertyNote: 'Book single and/or double rooms. Combine both types as needed.'
      },
      {
        destination: sajek._id, provider: provider._id, name: 'Sajek Heights Homestay',
        location: 'Konglak, Sajek', pricePerNight: 1300, bookingMode: 'per-room',
        totalRooms: 5, maxGuests: 12,
        rooms: [
          { name: 'Single', type: 'single', capacity: 1, quantity: 2, pricePerNight: 900, description: 'Cozy single' },
          { name: 'Double', type: 'double', capacity: 2, quantity: 3, pricePerNight: 1300, description: 'Standard double' }
        ],
        amenities: ['Family run', 'Local meals'],
        rating: 4.4, status: 'Verified',
        propertyNote: 'Homestay rooms — pick single or double as needed.'
      }
    ]);
    console.log('Inserted 3 accommodations with room inventories for Sajek Valley.');
  }

  let traveler = await User.findOne({ email: 'traveler@deshvromon.com' });
  if (!traveler) {
    const hashedT = await bcrypt.hash('traveler123', 10);
    traveler = await User.create({
      name: 'Ayesha Rahman',
      email: 'traveler@deshvromon.com',
      password: hashedT,
      role: 'traveler',
      phone: '01700000000',
      emailVerified: true
    });
    console.log('Created demo traveler: traveler@deshvromon.com / traveler123');
  } else if (!traveler.emailVerified) {
    traveler.emailVerified = true;
    traveler.otpCode = null;
    traveler.otpExpires = null;
    await traveler.save();
  }

  const stays = sajek ? await Accommodation.find({ destination: sajek._id }) : [];
  if (stays.length) {
    await Booking.deleteMany({ traveler: traveler._id });
    await Booking.create({
      traveler: traveler._id,
      accommodation: stays[0]._id,
      checkIn: new Date(Date.now() + 7 * 86400000),
      checkOut: new Date(Date.now() + 10 * 86400000),
      guests: 2,
      nights: 3,
      pricePerNight: stays[0].pricePerNight,
      serviceFee: Math.round(stays[0].pricePerNight * 3 * 0.045),
      totalAmount: stays[0].pricePerNight * 3 + Math.round(stays[0].pricePerNight * 3 * 0.045),
      status: 'Pending'
    });
    console.log('Inserted 1 pending booking for demo traveler.');
  }

  await TripPlan.deleteMany({ user: traveler._id });
  await TripPlan.create({
    user: traveler._id,
    destination: 'Sajek Valley',
    travelers: 2,
    style: 'Nature',
    budget: 15000,
    days: [
      { dayNumber: 1, items: [{ time: '09:00', title: 'Arrival', description: 'Check-in and valley viewpoint.' }] },
      { dayNumber: 2, items: [{ time: '08:00', title: 'Konglak trek', description: 'Guided hill walk.' }] }
    ],
    budgetBreakdown: { transportation: 3000, accommodation: 7200, food: 3000, activities: 1800 },
    status: 'Planning'
  });
  console.log('Inserted sample trip plan.');

  console.log('\nSeed complete.');
  console.log('  provider@deshvromon.com / provider123');
  console.log('  traveler@deshvromon.com / traveler123');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
