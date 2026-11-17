// LinkedIn posts shown at the bottom of the homepage (first = left).
//
// HOW TO ADD A POST:
//   1. On LinkedIn, open the post, click the "..." (top right of the post),
//      then "Embed this post", then "Copy code".
//      (Or just copy the post's link: "..." -> "Copy link to post".)
//   2. Paste it between the quotes of a new line at the TOP of the list below:
//        { "post": "PASTE-HERE" },
//   Keep the comma at the end of each line.
//   Only PUBLIC posts can be shown.
window.LINKEDIN = {
  // Link for the "Follow on LinkedIn" button (the lab's or Corinna's LinkedIn page).
  "profile": "https://www.linkedin.com/in/corinna-schindler-1b192b104/",
  "posts": [
    { "post": "https://www.linkedin.com/feed/update/urn:li:activity:7422357150125019136/" },
    { "post": "https://www.linkedin.com/posts/corinna-schindler-1b192b104_a-long-time-in-the-making-and-finally-out-share-7404264513476427776-z3LB/" }
  ]
};
