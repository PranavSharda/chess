export const getGameResult = (game, chessComUsername) => {
  const isWhite = game.white?.username?.toLowerCase() === chessComUsername?.toLowerCase()
  const playerData = isWhite ? game.white : game.black
  const result = playerData?.result

  if (result === 'win') return { text: 'Won', variant: 'win' }
  if (result === 'checkmated' || result === 'resigned' || result === 'timeout' || result === 'abandoned') {
    return { text: 'Lost', variant: 'loss' }
  }
  return { text: 'Draw', variant: 'draw' }
}

export const getOpponent = (game, chessComUsername) => {
  const isWhite = game.white?.username?.toLowerCase() === chessComUsername?.toLowerCase()
  return isWhite ? game.black : game.white
}

export const getIsWhite = (game, chessComUsername) => {
  return game.white?.username?.toLowerCase() === chessComUsername?.toLowerCase()
}

export const getResultText = (game) => {
  if (game?.white?.result === 'win') return '1-0'
  if (game?.black?.result === 'win') return '0-1'
  return '\u00BD-\u00BD'
}

export const movePairsFromHistory = (moveHistory) => {
  const pairs = []
  for (let i = 0; i < moveHistory.length; i += 2) {
    pairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: moveHistory[i],
      whiteIndex: i,
      black: moveHistory[i + 1] || null,
      blackIndex: i + 1,
    })
  }
  return pairs
}
