const scriptURL = 'https://docs.google.com/spreadsheets/d/1ephzDa_oGBhBNgLuf_MxjQFFg_PVChnCig_Bq8iLx3k/edit?usp=sharing';

fetch(scriptURL)
  .then(response => response.json())
  .then(data => console.log('Data from sheet:', data))
  .catch(error => console.error('Error!', error));
