export const MULTI_PLAYER_GAME_ABI = [
  // --- Write Functions ---
  {
    "inputs": [],
    "name": "createGame",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "gameId", "type": "uint256" }
    ],
    "name": "joinGame",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "gameId", "type": "uint256" }
    ],
    "name": "startGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint8", "name": "expectedPosition", "type": "uint8" }
    ],
    "name": "rollDice",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  // {
  //   "inputs": [
  //     { "internalType": "uint256", "name": "gameId", "type": "uint256" }
  //   ],
  //   "name": "claimRewards",
  //   "outputs": [],
  //   "stateMutability": "nonpayable",
  //   "type": "function"
  // },
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
		"name": "claimRewardV1",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},

  // --- Read Functions ---
  {
    "inputs": [
      { "internalType": "address", "name": "player", "type": "address" }
    ],
    "name": "getBoard",
    "outputs": [
      {
        "components": [
          { "internalType": "uint16", "name": "giftValue", "type": "uint16" },
          { "internalType": "int16", "name": "doorOffset", "type": "int16" }
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
    "inputs": [
      { "internalType": "address", "name": "player", "type": "address" }
    ],
    "name": "getPlayerStatus",
    "outputs": [
      { "internalType": "uint8", "name": "position", "type": "uint8" },
      { "internalType": "uint8", "name": "diceValue", "type": "uint8" },
      { "internalType": "uint16", "name": "nunuEarned", "type": "uint16" },
      { "internalType": "uint16", "name": "gameScore", "type": "uint16" },
      { "internalType": "bool", "name": "hasFinished", "type": "bool" },
      { "internalType": "bool", "name": "boardGenerated", "type": "bool" },
      { "internalType": "uint8", "name": "diceRolls", "type": "uint8" },
      { "internalType": "uint8", "name": "giftsCollected", "type": "uint8" },
      { "internalType": "uint8", "name": "shortcuts", "type": "uint8" },
      { "internalType": "uint8", "name": "detours", "type": "uint8" },
      { "internalType": "bool", "name": "isRugged", "type": "bool" },
      { "internalType": "uint256", "name": "sameDicePeers", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "player", "type": "address" }
    ],
    "name": "getPlayerStats",
    "outputs": [
      { "internalType": "uint256", "name": "_totalNunuEarned", "type": "uint256" },
      { "internalType": "uint16", "name": "highestScore", "type": "uint16" },
      { "internalType": "uint32", "name": "_gamesCompleted", "type": "uint32" },
      { "internalType": "uint32", "name": "_ruggedCount", "type": "uint32" },
      { "internalType": "uint256", "name": "_totalRewardWon", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "player", "type": "address" }
    ],
    "name": "getPlayerFeeCollected",
    "outputs": [
      { "internalType": "uint64", "name": "_feeCollected", "type": "uint64" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "player", "type": "address" }
    ],
    "name": "getPeerPositionsWithCounts",
    "outputs": [
      { "internalType": "uint8[]", "name": "positions", "type": "uint8[]" },
      { "internalType": "uint8[]", "name": "counts", "type": "uint8[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "gameId", "type": "uint256" },
      { "internalType": "uint256", "name": "start", "type": "uint256" },
      { "internalType": "uint256", "name": "count", "type": "uint256" }
    ],
    "name": "getGameActivities",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "actor", "type": "address" },
          { "internalType": "uint8", "name": "actionType", "type": "uint8" },
          { "internalType": "uint256", "name": "count", "type": "uint256" },
          { "internalType": "uint256", "name": "amount", "type": "uint256" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "internalType": "struct VSModeGame.GameActivity[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getRollFee",
    "outputs": [
      { "internalType": "uint256", "name": "_rollFee", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getGameStats",
    "outputs": [
      { "internalType": "uint256", "name": "_gamesCompleted", "type": "uint256" },
      { "internalType": "uint256", "name": "_totalNunuEarned", "type": "uint256" },
      { "internalType": "uint256", "name": "_totalPlayers", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Add more functions as needed (e.g., for leaderboard, etc.)
]; 