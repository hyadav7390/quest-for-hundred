
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
      },
      {
        "internalType": "uint256",
        "name": "_totalPlayers",
        "type": "uint256"
      },
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
    "name": "getPlayerStats",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "_totalNunuEarned",
        "type": "uint256"
      },
      {
        "internalType": "uint16",
        "name": "highestScore",
        "type": "uint16"
      },
      {
        "internalType": "uint32",
        "name": "_gamesCompleted",
        "type": "uint32"
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
    "name": "getBoard",
    "outputs": [
      {
        "components": [
          {
						"internalType": "uint64",
						"name": "giftValue",
						"type": "uint64"
					},
					{
						"internalType": "int16",
						"name": "doorOffset",
						"type": "int16"
					}
        ],
        "internalType": "struct NUGame.Tile[]",
				"name": "board",
				"type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "ROLL_FEE",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
