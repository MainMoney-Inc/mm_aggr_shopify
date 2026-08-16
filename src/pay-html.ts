export function payPageHtml(configJson: string): string {
  const serialized = configJson.replace(/</g, "\\u003c");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MainMoney</title>
  <link rel="stylesheet" href="/checkout.css" />
</head>
<body>
  <div id="mm-aggr-checkout"></div>
  <script>window.mmAggrCheckouts = [${serialized}];</script>
  <script src="/checkout.js"></script>
</body>
</html>`;
}
