const express   = require("express");
const http      = require("http");
const { Server }= require("socket.io");
const cors      = require("cors");
const dotenv    = require("dotenv");
const connectDB = require("./config/db");
const dns       = require("dns");
const { default: mongoose } = require("mongoose");

dns.setServers([
  '1.1.1.1', '8.8.8.8'
])


dotenv.config();
connectDB();
console.log( mongoose.connection.host );
const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: process.env.FRONTEND_URL || "*" } });

io.on("connection", (socket) => {
  socket.on("join-session",  (id) => socket.join(id));
  socket.on("leave-session", (id) => socket.leave(id));
});
app.set("io", io);

app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

app.use("/api/auth",      require("./routes/auth"));
app.use("/api/interview", require("./routes/interview"));
app.use("/api/payment",   require("./routes/payment"));
app.use("/api/result",    require("./routes/result"));

app.get("/api/health", (_, res) => res.json({ status: "OK" }));
app.use((err, req, res, next) => res.status(500).json({ message: err.message }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 HireAI Backend → http://localhost:${PORT}`));
