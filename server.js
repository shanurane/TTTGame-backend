require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

app.get("/api", (req, res) => {
  res.send('Server is running');
});

let waitingPlayer = null;
const games = {};

io.on("connection", (socket) => {
  console.log("user connected");
  io.emit("user-connected", socket.id);
  if (waitingPlayer) {
    const gameId = `${waitingPlayer}-${socket.id}`;
    games[gameId] = {
      players: [waitingPlayer, socket.id],
      board: Array(9).fill(null),
      winner: "hidden",
      getLineStyle: "hidden",
      hiddn: "flex",
      hidd: "hidden",
      currentPlayer: waitingPlayer,
    };

    io.emit(`Game started between ${waitingPlayer} and ${socket.id}`);
    io.to(waitingPlayer).emit("game-start", { gameId, symbol: "X" });
    io.to(socket.id).emit("game-start", { gameId, symbol: "O" });

    waitingPlayer = null;
  } else {
    waitingPlayer = socket.id;
    io.emit("waiting-for-opponent");
  }

  socket.on("make-move", ({ gameId, i }) => {
    const game = games[gameId];
    if (!game) return;

    const { board, currentPlayer } = game;
    const b = [...board];
    if (
      b[i] === null &&
      game.winner === "hidden" &&
      currentPlayer === socket.id
    ) {
      if (game.hidd === "flex") {
        b[i] = "O";
        if (b[0] === "O" && b[1] === "O" && b[2] === "O") {
          game.getLineStyle = "horizontal-line-1";
          game.winner = "O";
        } else if (b[3] === "O" && b[4] === "O" && b[5] === "O") {
          game.getLineStyle = "horizontal-line-2";
          game.winner = "O";
        } else if (b[6] === "O" && b[7] === "O" && b[8] === "O") {
          game.getLineStyle = "horizontal-line-3";
          game.winner = "O";
        } else if (b[0] === "O" && b[3] === "O" && b[6] === "O") {
          game.getLineStyle = "vertical-line-1";
          game.winner = "O";
        } else if (b[1] === "O" && b[4] === "O" && b[7] === "O") {
          game.getLineStyle = "vertical-line-2";
          game.winner = "O";
        } else if (b[2] === "O" && b[5] === "O" && b[8] === "O") {
          game.getLineStyle = "vertical-line-3";
          game.winner = "O";
        } else if (b[0] === "O" && b[4] === "O" && b[8] === "O") {
          game.getLineStyle = "diagonal-line-1";
          game.winner = "O";
        } else if (b[2] === "O" && b[4] === "O" && b[6] === "O") {
          game.getLineStyle = "diagonal-line-2";
          game.winner = "O";
        }
      } else {
        b[i] = "X";
        if (b[0] === "X" && b[1] === "X" && b[2] === "X") {
          game.getLineStyle = "horizontal-line-1";
          game.winner = "X";
        } else if (b[3] === "X" && b[4] === "X" && b[5] === "X") {
          game.getLineStyle = "horizontal-line-2";
          game.winner = "X";
        } else if (b[6] === "X" && b[7] === "X" && b[8] === "X") {
          game.getLineStyle = "horizontal-line-3";
          game.winner = "X";
        } else if (b[0] === "X" && b[3] === "X" && b[6] === "X") {
          game.getLineStyle = "vertical-line-1";
          game.winner = "X";
        } else if (b[1] === "X" && b[4] === "X" && b[7] === "X") {
          game.getLineStyle = "vertical-line-2";
          game.winner = "X";
        } else if (b[2] === "X" && b[5] === "X" && b[8] === "X") {
          game.getLineStyle = "vertical-line-3";
          game.winner = "X";
        } else if (b[0] === "X" && b[4] === "X" && b[8] === "X") {
          game.getLineStyle = "diagonal-line-1";
          game.winner = "X";
        } else if (b[2] === "X" && b[4] === "X" && b[6] === "X") {
          game.getLineStyle = "diagonal-line-2";
          game.winner = "X";
        }
      }
    }

    game.board = b;
    game.hiddn = game.hiddn === "hidden" ? "flex" : "hidden";
    game.hidd = game.hidd === "hidden" ? "flex" : "hidden";
    game.currentPlayer = game.players.find(
      (playerId) => playerId !== socket.id
    );
    io.to(game.players[0]).emit("move-made", {
      board: game.board,
      hiddn: game.hiddn,
      hidd: game.hidd,
      winner: game.winner,
      getLineStyle: game.getLineStyle,
      currentPlayer: game.currentPlayer,
    });
    io.to(game.players[1]).emit("move-made", {
      board: game.board,
      hiddn: game.hiddn,
      hidd: game.hidd,
      winner: game.winner,
      getLineStyle: game.getLineStyle,
      currentPlayer: game.currentPlayer,
    });
  });

  socket.on("new-game", () => {
    const gameId = Object.keys(games).find((id) =>
      games[id].players.includes(socket.id)
    );
    if (gameId) {
      games[gameId].board = Array(9).fill(null);
      games[gameId].winner = "hidden";
      games[gameId].getLineStyle = "hidden";
      games[gameId].hiddn = "flex";
      games[gameId].hidd = "hidden";
      games[gameId].currentPlayer = games[gameId].players[0];

      io.to(games[gameId].players[0]).emit("move-made", {
        board: games[gameId].board,
        hiddn: games[gameId].hiddn,
        hidd: games[gameId].hidd,
        winner: games[gameId].winner,
        getLineStyle: games[gameId].getLineStyle,
        currentPlayer: games[gameId].currentPlayer,
      });
      io.to(games[gameId].players[1]).emit("move-made", {
        board: games[gameId].board,
        hiddn: games[gameId].hiddn,
        hidd: games[gameId].hidd,
        winner: games[gameId].winner,
        getLineStyle: games[gameId].getLineStyle,
        currentPlayer: games[gameId].currentPlayer,
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    io.emit("user-disconnected");
    if (waitingPlayer === socket.id) {
      waitingPlayer = null;
    } else {
      for (const gameId in games) {
        const game = games[gameId];
        if (game.players.includes(socket.id)) {
          game.players.forEach((playerId) => {
            if (playerId !== socket.id) {
              io.to(playerId).emit("opponent-disconnected");
            }
          });
          delete games[gameId];
        }
      }
    }
  });
});

server.listen(process.env.PORT, () => {
  console.log("app listening on port", process.env.PORT);
  io.emit("Game Started");
});
