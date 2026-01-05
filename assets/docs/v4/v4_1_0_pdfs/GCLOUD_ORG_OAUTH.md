# Updating Google Project 

**Project name:** contract-invoice
**Project number:** 880111924408
**Project ID:** contract-invoice-483304


```javascript 
<script src="https://apis.google.com/js/api.js"></script>
<script>
  /**
   * Sample JavaScript code for drive.files.copy
   * See instructions for running APIs Explorer code samples locally:
   * https://developers.google.com/explorer-help/code-samples#javascript
   */

  function authenticate() {
    return gapi.auth2.getAuthInstance()
        .signIn({scope: "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.photos.readonly"})
        .then(function() { console.log("Sign-in successful"); },
              function(err) { console.error("Error signing in", err); });
  }
  function loadClient() {
    gapi.client.setApiKey("YOUR_API_KEY");
    return gapi.client.load("https://www.googleapis.com/discovery/v1/apis/drive/v3/rest")
        .then(function() { console.log("GAPI client loaded for API"); },
              function(err) { console.error("Error loading GAPI client for API", err); });
  }
  // Make sure the client is loaded and sign-in is complete before calling this method.
  function execute() {
    return gapi.client.drive.files.copy({
      "fileId": "1BYf71d5Bryy8SrfnQdxSeIfzQilsvHQ8bqUKTh5QB1c",
      "supportsAllDrives": true,
      "resource": {
        "name": "kon-xxx-xxx"
      }
    })
        .then(function(response) {
                // Handle the results here (response.result has the parsed body).
                console.log("Response", response);
              },
              function(err) { console.error("Execute error", err); });
  }
  gapi.load("client:auth2", function() {
    gapi.auth2.init({client_id: "YOUR_CLIENT_ID"});
  });
</script>
<button onclick="authenticate().then(loadClient)">authorize and load</button>
<button onclick="execute()">execute</button>
```

**RESPONSE** 

```json 
{
  "kind": "drive#file",
  "id": "1uG-ZE3ad8qbmfz0uUOHFOoJTLAZEOrMYOEH8w9XdSNk",
  "name": "kon-xxx-xxx",
  "mimeType": "application/vnd.google-apps.document"
}
```

How to Move a File
Moving a file in the Drive API is handled by updating its parent folders using the files.update (also known as patch) method. This involves specifying which parent folders to remove and which to add. 
API Method: files.update
Key Parameters:
fileId: The ID of the file to move (specified in the URL path).
addParents: A comma-separated list of folder IDs to add the file to.
removeParents: A comma-separated list of folder IDs to remove the file from.
