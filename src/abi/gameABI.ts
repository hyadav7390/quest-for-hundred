
export const GAME_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "initialOwner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_nunuToken",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_router",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "startGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "expectedPosition",
        "type": "uint8"
      }
    ],
    "name": "rollDice",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimRewards",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "getPlayerStatus",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "position",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "diceValue",
        "type": "uint8"
      },
      {
        "internalType": "uint16",
        "name": "nunuEarned",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "gameScore",
        "type": "uint16"
      },
      {
        "internalType": "bool",
        "name": "hasFinished",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "boardGenerated",
        "type": "bool"
      },
      {
        "internalType": "uint8",
        "name": "diceRolls",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "giftsCollected",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "shortcuts",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "detours",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getGameStats",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "_gamesCompleted",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_totalNunuEarned",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLeaderboard",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "player",
            "type": "address"
          },
          {
            "internalType": "uint16",
            "name": "score",
            "type": "uint16"
          }
        ],
        "internalType": "struct NUGame.LeaderboardEntry[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "getPlayerRank",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "getBoardData",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint8",
            "name": "index",
            "type": "uint8"
          },
          {
            "internalType": "uint16",
            "name": "points",
            "type": "uint16"
          }
        ],
        "internalType": "struct BoardData.GiftTile[]",
        "name": "giftTiles",
        "type": "tuple[]"
      },
      {
        "components": [
          {
            "internalType": "uint8",
            "name": "index",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "moveBack",
            "type": "uint8"
          }
        ],
        "internalType": "struct BoardData.DetourTile[]",
        "name": "detourTrapTiles",
        "type": "tuple[]"
      },
      {
        "components": [
          {
            "internalType": "uint8",
            "name": "index",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "moveForward",
            "type": "uint8"
          }
        ],
        "internalType": "struct BoardData.ShortcutTile[]",
        "name": "shortcutGateTiles",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
