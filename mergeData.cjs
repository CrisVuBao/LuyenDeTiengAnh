const fs = require('fs');

const p1 = JSON.parse(fs.readFileSync('reading_test_1_part1.json', 'utf8'));
const p2 = JSON.parse(fs.readFileSync('reading_test_1_part2.json', 'utf8'));
const p3 = JSON.parse(fs.readFileSync('reading_test_1_part3.json', 'utf8'));
const p4 = JSON.parse(fs.readFileSync('reading_test_1_part4.json', 'utf8'));
const p5 = JSON.parse(fs.readFileSync('reading_test_1_part5.json', 'utf8'));

// Reconstruct the user's data
const userData = {
  testId: p1.testId,
  part5: p1.part5,
  part6: [...p1.part6, ...p2.part6_2],
  part7: [...p2.part7_1, ...p3.part7_2, ...p4.part7_3, ...p5.part7_4]
};

// Add mock data for parts 1 to 4 so the app doesn't crash on other tabs
userData.part1 = [
  {
    "id": 1,
    "imageUrl": "https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    "audioUrl": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    "correctAnswerText": "(C) They are looking at a document."
  }
];
userData.part2 = [
  {
    "id": 7,
    "audioUrl": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    "correctAnswer": "B"
  }
];
userData.part3 = [
  {
    "id": 32,
    "audioUrl": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    "question": "What change is a company making?",
    "correctAnswerText": "Hiring new staff",
    "transcript": "We need to expand the staff this quarter.",
    "paraphrase": {"expand the staff": "Hiring new staff"}
  }
];
userData.part4 = [
  {
    "id": 71,
    "audioUrl": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    "question": "Where is the speaker?",
    "correctAnswerText": "At a supermarket",
    "transcript": "Attention all shoppers, the store will close in 15 minutes.",
    "paraphrase": {"shoppers": "supermarket"}
  }
];

// Write the combined data back to public/data.json
fs.writeFileSync('public/data.json', JSON.stringify(userData, null, 2));

console.log("Successfully combined and injected READING_TEST_1 into public/data.json");
