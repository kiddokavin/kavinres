const scriptURL = 'https://docs.google.com/spreadsheets/d/1ephzDa_oGBhBNgLuf_MxjQFFg_PVChnCig_Bq8iLx3k/edit?usp=sharing';

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
