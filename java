const scriptURL = 'https://script.google.com/macros/s/AKfycbwPmJPGAgZAO64Lon0itu2371UWbAExI7lcM4Bb5ZmR5VuRONOhuIJTSjpgOiIvF69PPg/exec';

// Keys must match your exact column headers in row 1
const newData = {
  "Name": "John Doe",
  "Email": "john@example.com",
  "Message": "Hello from GitHub!"
};

fetch(scriptURL, {
  method: 'POST',
  body: JSON.stringify(newData),
  headers: {
    'Content-Type': 'text/plain;charset=utf-8',
  }
