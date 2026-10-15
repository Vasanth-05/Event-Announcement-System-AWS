Event Announcement System — connected frontend

Files: index.html, style.css, script.js

API base URL:
https://ycyoil37nb.execute-api.ap-south-1.amazonaws.com/prod

This frontend calls GET /events and POST /events.

Deployment:
1. Upload these three files directly to the root of your S3 bucket, not inside a folder.
2. Confirm overwrite if prompted.
3. In CloudFront, create an invalidation for /* so cached files refresh.
4. Open your CloudFront site and test loading and creating events.

If requests fail in the browser but the API URL works directly, configure CORS for REST API resource /events:
- Allowed methods: GET, POST, OPTIONS
- Allowed headers: Content-Type
- Allowed origin: your exact CloudFront website origin (https://your-distribution-domain.cloudfront.net)
Deploy the API to prod after changing CORS. Keep the Lambda proxy response CORS headers compatible with the same allowed origin.

Email subscriptions are not connected yet; SNS comes in a later stage.
