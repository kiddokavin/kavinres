// NER-Asha Static Database: Games, Reminiscence Album, and Caregiver Analytics

export const MATCH_CARDS_SOURCE = [
  {
    id: "rhino",
    name: "One-Horned Rhinoceros",
    state: "Assam (Kaziranga)",
    icon: "fa-solid fa-hippo",
    description: "The Great Indian Rhinoceros. They live in the wetlands of Kaziranga National Park in Assam and love eating fresh green grass.",
    voicePrompt: "This is the One-Horned Rhinoceros of Kaziranga, Assam. Do you remember seeing pictures of this beautiful animal?"
  },
  {
    id: "japi",
    name: "Traditional Bihu Japi",
    state: "Assam",
    icon: "fa-solid fa-hat-cowboy-side",
    description: "A traditional conical hat made from woven bamboo and palm leaves, decorated with red and black patterns. It is worn during Bihu dances.",
    voicePrompt: "This is a Japi hat from Assam. It keeps the sun off your head during festivals."
  },
  {
    id: "hornbill",
    name: "Great Indian Hornbill",
    state: "Nagaland",
    icon: "fa-solid fa-dove",
    description: "A large, colorful forest bird with a big yellow beak. It is the state symbol of Nagaland and represents the famous Hornbill Festival.",
    voicePrompt: "This is the Hornbill bird, celebrated in Nagaland. Do you remember the colorful feathers?"
  },
  {
    id: "monastery",
    name: "Tawang Monastery",
    state: "Arunachal Pradesh",
    icon: "fa-solid fa-gopuram",
    description: "The largest Buddhist monastery in India, located at a height of 10,000 feet in Tawang, surrounded by snow-capped mountains.",
    voicePrompt: "This is the beautiful Tawang Monastery in Arunachal Pradesh. It is a very peaceful place."
  },
  {
    id: "lake",
    name: "Loktak Floating Lake",
    state: "Manipur",
    icon: "fa-solid fa-water-lator",
    description: "Famous for its floating landmasses called Phumdis. People live in small huts on these floating circles of grass and soil.",
    voicePrompt: "This is Loktak Lake in Manipur, famous for its floating islands. Do you remember the fisherman boats?"
  },
  {
    id: "tea",
    name: "Assam Tea Leaves",
    state: "Assam & Sikkim Corridor",
    icon: "fa-solid fa-leaf",
    description: "Fresh green tea leaves picked from the rolling hills. Assam tea is famous worldwide for its strong, malty flavor.",
    voicePrompt: "These are green tea leaves. Do you enjoy a warm cup of Assam tea in the morning?"
  }
];

export const WORD_PAIRS = [
  { left: "Bihu Festival", right: "Assam State", matches: "Assam" },
  { left: "Hornbill Festival", right: "Nagaland State", matches: "Nagaland" },
  { left: "Loktak Lake", right: "Manipur State", matches: "Manipur" },
  { left: "Sela High Pass", right: "Arunachal State", matches: "Arunachal" },
  { left: "Cherrapunji Rain", right: "Meghalaya State", matches: "Meghalaya" },
  { left: "Cheraw Bamboo Dance", right: "Mizoram State", matches: "Mizoram" }
];

export const REMINISCENCE_ALBUM = [
  {
    id: "photo-01",
    relation: "Granddaughter Priyadarshini",
    year: "2024",
    location: "Shillong, Meghalaya",
    title: "Priyadarshini's College Graduation",
    icon: "fa-solid fa-graduation-cap",
    bgColor: "#dbeafe",
    description: "This is your granddaughter Priyadarshini at her graduation in Shillong. You traveled by car to the hills and were wearing a beautiful gold-bordered traditional silk shawl. She hugged you tightly and said you are her inspiration.",
    voiceOver: "This is your granddaughter Priyadarshini. She graduated from college in Shillong in 2024. You wore your favorite silk shawl and felt so happy."
  },
  {
    id: "photo-02",
    relation: "Son Manoj & Daughter-in-law Ritu",
    year: "1998",
    location: "Kaziranga National Park",
    title: "Family Trip to Kaziranga",
    icon: "fa-solid fa-camera-retro",
    bgColor: "#dcfce7",
    description: "Your son Manoj and his wife Ritu standing near the elephant safari point in Kaziranga. It was a cold winter morning, and you all drank hot ginger tea together from a clay cup under the tall trees.",
    voiceOver: "Here is your son Manoj and daughter in law Ritu in Kaziranga. Do you remember the hot ginger tea you drank that foggy winter morning?"
  },
  {
    id: "photo-03",
    relation: "Husband/Wife (Your wedding day)",
    year: "1974",
    location: "Guwahati, Assam",
    title: "Your Wedding Ceremony",
    icon: "fa-solid fa-church",
    bgColor: "#fef3c7",
    description: "Your wedding day in Guwahati. The courtyard was decorated with fresh marigold flowers and mango leaves. Traditional flute music played as family and friends gathered to bless the couple.",
    voiceOver: "This is your wedding day in Guwahati in 1974. The house smelled of fresh marigolds and jasmine flowers."
  }
];

export const RHYTHM_TEMPLATES = [
  {
    id: "rhythm-dhol",
    name: "Bihu Dhol Rhythm",
    notes: ["red", "blue", "red", "green"],
    instrument: "Assamese Dhol",
    frequencies: [220, 330, 220, 440] // Hz frequencies for audio synth
  },
  {
    id: "rhythm-bamboo",
    name: "Mizo Bamboo Tap",
    notes: ["green", "yellow", "blue", "yellow"],
    instrument: "Bamboo Clappers",
    frequencies: [440, 554, 330, 554]
  }
];

// Initial mock caregiver tracking statistics
export const CAREGIVER_ANALYTICS = {
  daily_compliance: [
    { day: "Mon", gamesPlayed: 2, memoryVaultViews: 3, mood: "Happy" },
    { day: "Tue", gamesPlayed: 3, memoryVaultViews: 1, mood: "Calm" },
    { day: "Wed", gamesPlayed: 1, memoryVaultViews: 4, mood: "Restless" },
    { day: "Thu", gamesPlayed: 4, memoryVaultViews: 2, mood: "Happy" },
    { day: "Fri", gamesPlayed: 2, memoryVaultViews: 3, mood: "Calm" },
    { day: "Sat", gamesPlayed: 3, memoryVaultViews: 5, mood: "Happy" },
    { day: "Sun", gamesPlayed: 0, memoryVaultViews: 2, mood: "Confused" }
  ],
  weekly_cognitive_speed: {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    avgReactionSeconds: [24.5, 21.0, 18.2, 16.5] // decreasing response time is improvement
  },
  weekly_accuracy: {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    matchAccuracyPercentage: [62, 70, 78, 85]
  }
};
