# Facebook Page auto-post setup

This feature publishes only administrator-approved PNG/JPEG photo posts to Page `100105564680397`.
It does not publish until a valid Page Access Token is configured. Never commit or paste the token into the repository.

## Render web service

Set these environment variables on the existing web service:

- `FACEBOOK_PAGE_ID=100105564680397`
- `FACEBOOK_PAGE_ACCESS_TOKEN` = the Page Access Token for this Page, with permission to create Page content
- `FACEBOOK_GRAPH_VERSION=v26.0` (optional)

Restart/redeploy after setting them. In the administrator menu, open **Đăng Facebook Page** and click **Kiểm tra kết nối Page**. The check must display the exact Page ID before approving a post.

## Reliable scheduling on Render

An active web service checks approved posts every 30 seconds. A Free Render web service can spin down while idle, so for reliable scheduled publishing create a Render Cron Job from the same `quanlythi` repository and branch:

- Build command: `npm install`
- Command: `node scripts/social-worker.js`
- Schedule: `* * * * *` (every minute, UTC)
- Environment: the same `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL_REJECT_UNAUTHORIZED`, `FACEBOOK_PAGE_ID`, `FACEBOOK_PAGE_ACCESS_TOKEN` as the web service. Use an environment group if available.

Render Cron Jobs have a minimum monthly charge. If you do not create the Cron Job, scheduled posts run only while the web service is awake and will be processed when it wakes again. [Render Cron Jobs](https://render.com/docs/cronjobs), [Free web service behavior](https://render.com/docs/free).

## Operational safety

Only administrators can create and approve posts. Each post needs a valid ID6 from `id6_metadata`, a PNG/JPEG image under 5 MB, a caption, and a future schedule. Images are stored in MySQL, not the ephemeral Render filesystem. A failed Meta response is not marked posted. A lost/unknown response is marked `UNCERTAIN` and is never retried automatically: check the Page first. A process interrupted during publishing is also marked `UNCERTAIN` after five minutes. Each confirmed successful post increments `questions.used_count` once.

Test with a harmless private/internal post first. Verify the photo, caption, Page and time zone in the live Page before scheduling many posts. Remove the test post directly in Facebook if desired.
