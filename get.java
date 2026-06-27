const scriptURL = 'https://script.google.com/macros/s/AKfycbwPmJPGAgZAO64Lon0itu2371UWbAExI7lcM4Bb5ZmR5VuRONOhuIJTSjpgOiIvF69PPg/exec';

fetch(scriptURL)
  .then(response => response.json())
  .then(data => console.log('Data from sheet:', data))
  .catch(error => console.error('Error!', error));
