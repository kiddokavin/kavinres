# Connecting Your Portfolio Contact Form to Google Sheets & Email

Follow these steps to set up a free Google Sheet database that automatically saves your contact form entries (Excel-compatible) and sends a notification email to `2007kavinl@gmail.com` simultaneously.

---

## 1. Confirm Your Google Sheet Setup
You have already created the Google Sheet here:
👉 **[Open Your Spreadsheet](https://docs.google.com/spreadsheets/d/1AZ9xG2T328qY9WXVnxChjRDeGirlnjWrx21sRQ8TwWI/edit?usp=sharing)**

Make sure you have created the following column headers in the first row (**Row 1**):
*   **Column A**: `Timestamp`
*   **Column B**: `Name`
*   **Column C**: `Email`
*   **Column D**: `Subject`
*   **Column E**: `Message`

---

## 2. Set Up Google Apps Script
1. Inside your Google Sheet, click on **Extensions** in the top menu and select **Apps Script**.
2. Delete any default code in the editor (`Code.gs`) and paste the following script:

```javascript
function doPost(e) {
  try {
    var doc = SpreadsheetApp.openById("1AZ9xG2T328qY9WXVnxChjRDeGirlnjWrx21sRQ8TwWI");
    var sheet = doc.getSheets()[0];
    
    // Parse incoming JSON data
    var jsonString = e.postData.contents;
    var data = JSON.parse(jsonString);
    
    var timestamp = new Date();
    var name = data.name;
    var email = data.email;
    var subject = data.subject || "No Subject";
    var message = data.message;
    
    // Append a row: Date/Time, Name, Email, Subject, Message
    sheet.appendRow([timestamp, name, email, subject, message]);
    
    // Send email notification to you
    var emailBody = "New contact form submission received:\n\n" +
                    "Name: " + name + "\n" +
                    "Email: " + email + "\n" +
                    "Subject: " + subject + "\n\n" +
                    "Message:\n" + message;
                    
    GmailApp.sendEmail("2007kavinl@gmail.com", "Portfolio Contact: " + subject, emailBody);
    
    return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
                         .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": error.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Save the script by clicking the **Save** icon (floppy disk) at the top of the Apps Script interface.

---

## 3. Deploy the Script as a Web App
1. Click the blue **Deploy** button at the top right, then select **New deployment**.
2. Click the gear icon (**Select type**) next to "Configuration" and select **Web app**.
3. Fill in the fields exactly as follows:
   *   **Description**: `Portfolio Contact Webhook`
   *   **Execute as**: `Me (your-email@gmail.com)` (This allows the script to write to your Sheet and send mail on your behalf)
   *   **Who has access**: `Anyone` (Crucial: This lets your website send submissions without requiring visitor authentication)
4. Click **Deploy**.
5. Google will ask you to **Authorize Access**. Click *Authorize Access*, select your Google Account, click *Advanced* (bottom left of authorization window), and click *Go to Untitled project (unsafe)*, then select **Allow**.
6. Once deployed, copy the **Web App URL** shown under the deployment details (it ends in `/exec`).

---

## 4. Add the URL to Your Portfolio
1. Open your workspace file: [`script.js`](file:///c:/antigravity/script.js).
2. Go to line **269**. You will see:
   ```javascript
   const GOOGLE_SHEET_WEBAPP_URL = "";
   ```
3. Paste your copied URL inside the quotation marks:
   ```javascript
   const GOOGLE_SHEET_WEBAPP_URL = "https://script.google.com/macros/s/XXXXX/exec";
   ```
4. Save the file.

Your contact form is now fully connected! Any user submitting a message will instantly populate your Google Sheet (which can be downloaded as an Excel `.xlsx` file anytime) and send a mail directly to you.
