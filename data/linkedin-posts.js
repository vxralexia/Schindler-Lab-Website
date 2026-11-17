// LinkedIn posts shown as cards at the bottom of the homepage.
// Newest first is not required: cards are sorted by date automatically.
//
// HOW TO ADD A POST (copy a block and fill it in):
//   "link":  the post's link (on LinkedIn: "..." -> "Copy link to post")
//   "date":  year-month it was posted, e.g. "2026-01"
//   "text":  the first sentence or two of the post (the card shows about 5 lines)
//   "image": optional picture for the top of the card, saved in assets/linkedin/
//            (leave "" for a plain navy LinkedIn panel)
// Keep the quotes, and a comma after each } except the last.
window.LINKEDIN = {
  // Link for the "Follow on LinkedIn" button.
  "profile": "https://www.linkedin.com/in/corinna-schindler-1b192b104/",
  "posts": [
    {
      "link": "https://www.linkedin.com/feed/update/urn:li:activity:7422357150125019136/",
      "date": "2026-01",
      "text": "EDIT: paste the first sentence or two of this post here.",
      "image": ""
    },
    {
      "link": "https://www.linkedin.com/posts/corinna-schindler-1b192b104_a-long-time-in-the-making-and-finally-out-share-7404264513476427776-z3LB/",
      "date": "2025-12",
      "text": "A long time in the making — and finally out! We've developed a new strategy to access functionalized oxetanes directly from carbonyls and alkenes.",
      "image": ""
    }
  ]
};
