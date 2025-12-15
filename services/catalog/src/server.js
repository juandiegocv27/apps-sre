const http = require("http");

const port = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    return res.end("ok");
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("catalog service");
});

server.listen(port, () => {
  console.log(`listening on ${port}`);
});
