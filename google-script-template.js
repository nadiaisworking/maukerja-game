// -----------------------------------------------------------------------------
// CAMPAIGN MAUKERJA - BACKEND SCRIPT
// -----------------------------------------------------------------------------
// 1. Create a new Google Sheet.
// 2. Go to Extensions > Apps Script.
// 3. Paste this code completely, deleting any existing code.
// 4. Click "Deploy" > "New Deployment".
// 5. Select type: "Web App".
// 6. Description: "Campaign Backend".
// 7. Execute as: "Me" (your email).
// 8. Who has access: "Anyone" (VERY IMPORTANT).
// 9. Click "Deploy" and Copy the "Web App URL".
// -----------------------------------------------------------------------------

function doPost(e) {
    var lock = LockService.getScriptLock();
    lock.tryLock(10000);

    try {
        var doc = SpreadsheetApp.getActiveSpreadsheet();
        var sheet = doc.getSheetByName('Sheet1');

        // Headers
        // If the sheet is empty, add headers row
        if (sheet.getLastRow() === 0) {
            sheet.appendRow(['Timestamp', 'Full Name', 'Email', 'Whatsapp']);
        }

        var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        var nextRow = sheet.getLastRow() + 1;

        // Parse Data
        // We expect valid JSON or Form Parameters
        var newRow = headers.map(function (header) {
            if (header === 'Timestamp') return new Date();

            // Match header name to parameter name robustly
            // 1. Convert header to lowercase
            // 2. Replace multiple spaces with single space
            // 3. Trim whitespace
            // 4. Replace space with underscore

            var cleanHeader = header.toString().toLowerCase().trim().replace(/\s+/g, '_');

            // Map common variations if user edited sheet headers slightly
            // e.g. "Full Name " -> "full_name"

            return e.parameter[cleanHeader] || '';
        });

        sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);

        return ContentService
            .createTextOutput(JSON.stringify({ 'result': 'success', 'row': nextRow }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (e) {
        return ContentService
            .createTextOutput(JSON.stringify({ 'result': 'error', 'error': e }))
            .setMimeType(ContentService.MimeType.JSON);
    } finally {
        lock.releaseLock();
    }
}
