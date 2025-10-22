export const ONE_V_ONE_GAME_ABI = [
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "matchId",
				"type": "uint256"
			}
		],
		"name": "autoRoll",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "matchId",
				"type": "uint256"
			}
		],
		"name": "cancelUnmatched",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "matchId",
				"type": "uint256"
			}
		],
		"name": "claim",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "betAmount",
				"type": "uint256"
			},
			{
				"internalType": "bytes32",
				"name": "inviteHash",
				"type": "bytes32"
			}
		],
		"name": "createMatch",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "initialOwner",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "initialFeeReceiver",
				"type": "address"
			},
			{
				"internalType": "uint16",
				"name": "initialFeeBps",
				"type": "uint16"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "OwnableInvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "OwnableUnauthorizedAccount",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "matchId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "player",
				"type": "address"
			}
		],
		"name": "AutoRollExecuted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "matchId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint8",
				"name": "chainCount",
				"type": "uint8"
			}
		],
		"name": "ExtraRollAwarded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "newReceiver",
				"type": "address"
			}
		],
		"name": "FeeReceiverUpdated",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "matchId",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "inviteSecret",
				"type": "bytes"
			}
		],
		"name": "joinMatch",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "betAmount",
				"type": "uint256"
			}
		],
		"name": "joinQueue",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "leaveQueue",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "matchId",
				"type": "uint256"
			}
		],
		"name": "MatchCanceled",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "matchId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "creator",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "betAmount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "enum RuggRoll1v1Game.MatchMode",
				"name": "mode",
				"type": "uint8"
			}
		],
		"name": "MatchCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "matchId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "betAmount",
				"type": "uint256"
			}
		],
		"name": "MatchJoined",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "matchId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "player0",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "player1",
				"type": "address"
			}
		],
		"name": "MatchStarted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "matchId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "winner",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "payout",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "fee",
				"type": "uint256"
			}
		],
		"name": "MatchWon",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "pause",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "Paused",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "matchId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "winner",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "Payout",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint16",
				"name": "newFeeBps",
				"type": "uint16"
			}
		],
		"name": "PlatformFeeUpdated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "betAmount",
				"type": "uint256"
			}
		],
		"name": "QueueJoined",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "refundedAmount",
				"type": "uint256"
			}
		],
		"name": "QueueLeft",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "matchId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "Refund",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "matchId",
				"type": "uint256"
			}
		],
		"name": "roll",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "matchId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint8",
				"name": "dice",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "uint8",
				"name": "newPosition",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "autoRoll",
				"type": "bool"
			}
		],
		"name": "Roll",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newReceiver",
				"type": "address"
			}
		],
		"name": "setFeeReceiver",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint16",
				"name": "newFeeBps",
				"type": "uint16"
			}
		],
		"name": "setPlatformFeeBps",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "matchId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "nextPlayer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint32",
				"name": "expiresAt",
				"type": "uint32"
			}
		],
		"name": "TurnAdvanced",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "unpause",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "Unpaused",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			}
		],
		"name": "withdraw",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	},
	{
		"inputs": [],
		"name": "BET_INCREMENT",
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
		"inputs": [],
		"name": "BOARD_SIZE",
		"outputs": [
			{
				"internalType": "uint8",
				"name": "",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "BPS_DENOMINATOR",
		"outputs": [
			{
				"internalType": "uint16",
				"name": "",
				"type": "uint16"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "feeReceiver",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "matchId",
				"type": "uint256"
			}
		],
		"name": "getBoard",
		"outputs": [
			{
				"components": [
					{
						"internalType": "int16",
						"name": "doorOffset",
						"type": "int16"
					}
				],
				"internalType": "struct RuggRoll1v1Game.Tile[]",
				"name": "board",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "matchId",
				"type": "uint256"
			}
		],
		"name": "getMatch",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "id",
						"type": "uint256"
					},
					{
						"internalType": "address[2]",
						"name": "players",
						"type": "address[2]"
					},
					{
						"internalType": "uint256[2]",
						"name": "stakes",
						"type": "uint256[2]"
					},
					{
						"internalType": "uint256",
						"name": "betAmount",
						"type": "uint256"
					},
					{
						"internalType": "uint16",
						"name": "platformFeeBps",
						"type": "uint16"
					},
					{
						"internalType": "enum RuggRoll1v1Game.MatchState",
						"name": "state",
						"type": "uint8"
					},
					{
						"internalType": "enum RuggRoll1v1Game.MatchMode",
						"name": "mode",
						"type": "uint8"
					},
					{
						"internalType": "uint8",
						"name": "turn",
						"type": "uint8"
					},
					{
						"internalType": "uint32",
						"name": "expiresAt",
						"type": "uint32"
					},
					{
						"internalType": "address",
						"name": "winner",
						"type": "address"
					},
					{
						"internalType": "bool",
						"name": "claimed",
						"type": "bool"
					},
					{
						"internalType": "uint8[2]",
						"name": "positions",
						"type": "uint8[2]"
					},
					{
						"internalType": "uint8[2]",
						"name": "lastDice",
						"type": "uint8[2]"
					},
					{
						"internalType": "uint64",
						"name": "createdAt",
						"type": "uint64"
					}
				],
				"internalType": "struct RuggRoll1v1Game.MatchView",
				"name": "viewData",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "betAmount",
				"type": "uint256"
			}
		],
		"name": "getQueueSnapshot",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "exactCount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "lowerCount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "upperCount",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "MAX_FEE_BPS",
		"outputs": [
			{
				"internalType": "uint16",
				"name": "",
				"type": "uint16"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "MIN_BET",
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
		"inputs": [],
		"name": "nextMatchId",
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
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "paused",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "platformFeeBps",
		"outputs": [
			{
				"internalType": "uint16",
				"name": "",
				"type": "uint16"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "playerMatch",
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
		"inputs": [],
		"name": "TURN_TIMEOUT",
		"outputs": [
			{
				"internalType": "uint32",
				"name": "",
				"type": "uint32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]



// export const ONE_V_ONE_GAME_ABI = [
//   {
//     inputs: [
//       { internalType: 'uint256', name: 'betAmount', type: 'uint256' },
//     ],
//     name: 'joinQueue',
//     outputs: [],
//     stateMutability: 'payable',
//     type: 'function',
//   },
//   {
//     inputs: [],
//     name: 'leaveQueue',
//     outputs: [],
//     stateMutability: 'nonpayable',
//     type: 'function',
//   },
//   {
//     inputs: [
//       { internalType: 'uint256', name: 'betAmount', type: 'uint256' },
//       { internalType: 'bytes32', name: 'inviteHash', type: 'bytes32' },
//     ],
//     name: 'createMatch',
//     outputs: [
//       { internalType: 'uint256', name: '', type: 'uint256' },
//     ],
//     stateMutability: 'payable',
//     type: 'function',
//   },
//   {
//     inputs: [
//       { internalType: 'uint256', name: 'matchId', type: 'uint256' },
//     ],
//     name: 'cancelUnmatched',
//     outputs: [],
//     stateMutability: 'nonpayable',
//     type: 'function',
//   },
//   {
//     inputs: [
//       { internalType: 'uint256', name: 'matchId', type: 'uint256' },
//       { internalType: 'bytes', name: 'inviteSecret', type: 'bytes' },
//     ],
//     name: 'joinMatch',
//     outputs: [],
//     stateMutability: 'payable',
//     type: 'function',
//   },
//   {
//     inputs: [
//       { internalType: 'uint256', name: 'matchId', type: 'uint256' },
//     ],
//     name: 'roll',
//     outputs: [],
//     stateMutability: 'nonpayable',
//     type: 'function',
//   },
//   {
//     inputs: [
//       { internalType: 'uint256', name: 'matchId', type: 'uint256' },
//     ],
//     name: 'autoRoll',
//     outputs: [],
//     stateMutability: 'nonpayable',
//     type: 'function',
//   },
//   {
//     inputs: [
//       { internalType: 'uint256', name: 'matchId', type: 'uint256' },
//     ],
//     name: 'claim',
//     outputs: [],
//     stateMutability: 'nonpayable',
//     type: 'function',
//   },
//   {
//     inputs: [
//       { internalType: 'uint256', name: 'matchId', type: 'uint256' },
//     ],
//     name: 'getMatch',
//     outputs: [
//       {
//         components: [
//           { internalType: 'uint256', name: 'id', type: 'uint256' },
//           { internalType: 'address[2]', name: 'players', type: 'address[2]' },
//           { internalType: 'uint256[2]', name: 'stakes', type: 'uint256[2]' },
//           { internalType: 'uint256', name: 'betAmount', type: 'uint256' },
//           { internalType: 'uint16', name: 'platformFeeBps', type: 'uint16' },
//           { internalType: 'uint8', name: 'state', type: 'uint8' },
//           { internalType: 'uint8', name: 'mode', type: 'uint8' },
//           { internalType: 'uint8', name: 'turn', type: 'uint8' },
//           { internalType: 'uint32', name: 'expiresAt', type: 'uint32' },
//           { internalType: 'address', name: 'winner', type: 'address' },
//           { internalType: 'bool', name: 'claimed', type: 'bool' },
//           { internalType: 'uint8[2]', name: 'positions', type: 'uint8[2]' },
//           { internalType: 'uint64', name: 'createdAt', type: 'uint64' },
//         ],
//         internalType: 'struct RuggRoll1v1Game.MatchView',
//         name: '',
//         type: 'tuple',
//       },
//     ],
//     stateMutability: 'view',
//     type: 'function',
//   },
//   {
//     inputs: [
//       { internalType: 'uint256', name: 'matchId', type: 'uint256' },
//     ],
//     name: 'getBoard',
//     outputs: [
//       {
//         components: [
//           { internalType: 'int16', name: 'doorOffset', type: 'int16' },
//         ],
//         internalType: 'struct RuggRoll1v1Game.Tile[]',
//         name: '',
//         type: 'tuple[]',
//       },
//     ],
//     stateMutability: 'view',
//     type: 'function',
//   },
//   {
//     inputs: [
//       { internalType: 'uint256', name: 'betAmount', type: 'uint256' },
//     ],
//     name: 'getQueueSnapshot',
//     outputs: [
//       { internalType: 'uint256', name: 'exactCount', type: 'uint256' },
//       { internalType: 'uint256', name: 'lowerCount', type: 'uint256' },
//       { internalType: 'uint256', name: 'upperCount', type: 'uint256' },
//     ],
//     stateMutability: 'view',
//     type: 'function',
//   },
//   {
//     inputs: [
//       { internalType: 'address', name: '', type: 'address' },
//     ],
//     name: 'playerMatch',
//     outputs: [
//       { internalType: 'uint256', name: '', type: 'uint256' },
//     ],
//     stateMutability: 'view',
//     type: 'function',
//   },
// ];
