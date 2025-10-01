const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const connectToDb = require("./config/dbConnection");
const app = require("./app");
const cron = require("node-cron");
const Game = require("./src/model/game/game");
const { nowIST, formatIST } = require("./src/utils/timeConverter");
const GameResult = require("./src/model/gameResult/gameResult");

const PORT = process.env.PORT || 8002;

// connectToDb();

app.use("/testroute", () => {
  console.log("Your test route is running up");
});

connectToDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
// cron.schedule("* * * * *", async () => {
//   // Get current IST time
//   const currentIST = nowIST(); // Use your IST utility
//   const currentTimeString = currentIST.toLocaleTimeString("en-US", {
//     hour12: true,
//     hour: "2-digit",
//     minute: "2-digit",
//     timeZone: "Asia/Kolkata", // Ensure IST
//   }); // e.g., "10:30 AM"

//   console.log("Current IST time:", formatIST(currentIST));
//   console.log("Current time string:", currentTimeString);

//   try {
//     // Get all games and check manually
//     const games = await Game.find({
//       status: { $in: ["upcoming", "open", "declared", "closed"] },
//     });
//     console.log("games", games);
//     for (const game of games) {
//       // Get today's date in YYYY-MM-DD format (IST)
//       const todayString = currentIST.toLocaleDateString("en-CA", {
//         timeZone: "Asia/Kolkata",
//       }); // "2025-09-24"
//       // Parse game times as HH:mm:ss in IST
//       const gameOpenTime = new Date(`${todayString}T${game.openTime}+05:30`);
//       const gameCloseTime = new Date(`${todayString}T${game.closeTime}+05:30`);

//       // Debug logs to check time values and status
//       console.log({
//         name: game.name,
//         status: game.status,
//         currentIST: formatIST(currentIST),
//         gameOpenTime: formatIST(gameOpenTime),
//         gameCloseTime: formatIST(gameCloseTime),
//       });

//       // Open games
//       if (
//         game.status === "upcoming" ||
//         "closed" ||
//         ("declared" &&
//           currentIST >= gameOpenTime &&
//           currentIST <= gameCloseTime)
//       ) {
//         await Game.findByIdAndUpdate(game._id, { status: "open" });
//         console.log(
//           `🟢 Game "${game.name}" opened at ${formatIST(currentIST)}`
//         );
//       }

//       // Close games (handles both 'open' and 'upcoming' that missed window)
//       if (
//         (game.status === "open" && currentIST > gameCloseTime) ||
//         (game.status === "upcoming" && currentIST > gameCloseTime)
//       ) {
//         await Game.findByIdAndUpdate(game._id, { status: "closed" });
//         console.log(
//           `🔴 Game "${game.name}" closed at ${formatIST(currentIST)}`
//         );
//       }
//     }

//     console.log("🔄 Game statuses checked at:", formatIST(currentIST));
//   } catch (err) {
//     console.error("❌ Error updating game statuses:", err);
//   }
// });

const { DateTime } = require("luxon"); // Install: npm i luxon

// Cron runs every minute
// cron.schedule("*/30 * * * * *", async () => {
//   try {
//     // Current IST time
//     const now = DateTime.now().setZone("Asia/Kolkata");

//     const games = await Game.find({}); // get all games

//     for (const game of games) {
//       console.log("hfgjhsf", game.status);
//       if (game.status === "declared") {
//         console.log("bdgjdfsd");
//       }
//       // Today's date in YYYY-MM-DD
//       const today = now.toFormat("yyyy-LL-dd");

//       // Parse game open/close times in IST
//       const gameOpen = DateTime.fromISO(`${today}T${game.openTime}`, {
//         zone: "Asia/Kolkata",
//       });
//       const gameClose = DateTime.fromISO(`${today}T${game.closeTime}`, {
//         zone: "Asia/Kolkata",
//       });

//       let newStatus = game.status;

//       if (now < gameOpen) {
//         newStatus = "upcoming";
//       } else if (now >= gameOpen && now <= gameClose) {
//         newStatus = "open";
//       } else if (now > gameClose) {
//         newStatus = "closed";
//       }

//       // Only update if status changed
//       if (newStatus !== game.status) {
//         await Game.findByIdAndUpdate(game._id, { status: newStatus });
//         console.log(`Game "${game.name}" status updated to "${newStatus}"`);
//       }
//     }

//     console.log("✅ Game statuses checked at:", now.toISO());
//   } catch (err) {
//     console.error("❌ Error updating game statuses:", err);
//   }
// });

// cron.schedule("*/30 * * * * *", async () => {
//   try {
//     // Current IST time
//     const now = DateTime.now().setZone("Asia/Kolkata");

//     const games = await Game.find({}); // get all games

//     for (const game of games) {
//       // Skip updating if status is already declared
//       if (game.status === "declared") {
//         console.log("dgfjhgfjdsg");
//       }

//       // Today's date in YYYY-MM-DD
//       const today = now.toFormat("yyyy-LL-dd");

//       // Parse game open/close times in IST
//       const gameOpen = DateTime.fromISO(`${today}T${game.openTime}`, {
//         zone: "Asia/Kolkata",
//       });
//       const gameClose = DateTime.fromISO(`${today}T${game.closeTime}`, {
//         zone: "Asia/Kolkata",
//       });

//       let newStatus = game.status;

//       if (now < gameOpen) {
//         newStatus = "upcoming";
//       } else if (now >= gameOpen && now <= gameClose) {
//         newStatus = "open";
//       } else if (now > gameClose) {
//         newStatus = "closed";
//       }

//       // Only update if status changed
//       if (newStatus !== game.status) {
//         await Game.findByIdAndUpdate(game._id, { status: newStatus });
//         console.log(`Game "${game.name}" status updated to "${newStatus}"`);
//       }
//     }

//     console.log("✅ Game statuses checked at:", now.toISO());
//   } catch (err) {
//     console.error("❌ Error updating game statuses:", err);
//   }
// });

// cron.schedule("* * * * *", async () => {
//   try {
//     const now = DateTime.now().setZone("Asia/Kolkata");
//     console.log("Cron running at:", now.toISO());

//     const games = await Game.find({});
//     if (!games.length) {
//       console.log("No games found");
//       return;
//     }

//     for (const game of games) {
//       // Skip updating if status is already declared
//       if (game.status === "declared") {
//         console.log("Game already declared, skipping:", game.name);
//         continue;
//       }

//       const today = now.toFormat("yyyy-LL-dd");
//       const gameOpen = DateTime.fromISO(`${today}T${game.openTime}`, {
//         zone: "Asia/Kolkata",
//       });
//       const gameClose = DateTime.fromISO(`${today}T${game.closeTime}`, {
//         zone: "Asia/Kolkata",
//       });

//       let newStatus = game.status;

//       if (now < gameOpen) {
//         newStatus = "upcoming";
//       } else if (now >= gameOpen && now <= gameClose) {
//         newStatus = "open";
//       } else if (now > gameClose) {
//         newStatus = "closed";
//       }

//       if (newStatus !== game.status) {
//         await Game.findByIdAndUpdate(game._id, { status: newStatus });
//         console.log(`Game "${game.name}" status updated to "${newStatus}"`);
//       }
//     }

//     console.log("✅ Game statuses checked at:", now.toISO());
//   } catch (err) {
//     console.error("❌ Error updating game statuses:", err);
//   }
// });

cron.schedule("* * * * *", async () => {
  try {
    const now = DateTime.now().setZone("Asia/Kolkata");
    console.log("Cron running at:", now.toISO());

    const games = await Game.find({});
    if (!games.length) {
      console.log("No games found");
      return;
    }

    const today = now.toFormat("yyyy-LL-dd");

    for (const game of games) {
      // Check if result is declared today
      const todayResult = await GameResult.findOne({
        gameId: game._id,
        createdAt: {
          $gte: DateTime.fromISO(`${today}T00:00:00`, {
            zone: "Asia/Kolkata",
          }).toJSDate(),
          $lte: DateTime.fromISO(`${today}T23:59:59`, {
            zone: "Asia/Kolkata",
          }).toJSDate(),
        },
      });

      let newStatus;

      if (todayResult) {
        // If result exists for today, status must be declared
        newStatus = "declared";
      } else {
        const gameOpen = DateTime.fromISO(`${today}T${game.openTime}`, {
          zone: "Asia/Kolkata",
        });
        const gameClose = DateTime.fromISO(`${today}T${game.closeTime}`, {
          zone: "Asia/Kolkata",
        });

        if (now < gameOpen) {
          newStatus = "upcoming";
        } else if (now >= gameOpen && now <= gameClose) {
          newStatus = "open";
        } else if (now > gameClose) {
          newStatus = "closed";
        }
      }

      // Only update if status changed
      if (newStatus && newStatus !== game.status) {
        await Game.findByIdAndUpdate(game._id, { status: newStatus });
        console.log(`Game "${game.name}" status updated to "${newStatus}"`);
      }
    }

    console.log("✅ Game statuses checked at:", now.toISO());
  } catch (err) {
    console.error("❌ Error updating game statuses:", err);
  }
});
