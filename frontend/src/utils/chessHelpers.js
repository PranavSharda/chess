export const getIsWhite = (game, chessComUsername) => {
  return game.white_username?.toLowerCase() === chessComUsername?.toLowerCase()
}

export const getGameResult = (game, chessComUsername) => {
  const isWhite = getIsWhite(game, chessComUsername)
  const result = isWhite ? game.white_result : game.black_result

  if (result === 'win') return { text: 'Won', variant: 'win' }
  if (result === 'checkmated' || result === 'resigned' || result === 'timeout' || result === 'abandoned') {
    return { text: 'Lost', variant: 'loss' }
  }
  return { text: 'Draw', variant: 'draw' }
}

export const getOpponent = (game, chessComUsername) => {
  const isWhite = getIsWhite(game, chessComUsername)
  return {
    username: isWhite ? game.black_username : game.white_username,
    rating: isWhite ? game.black_rating : game.white_rating,
    result: isWhite ? game.black_result : game.white_result,
  }
}

export const getResultText = (game) => {
  if (game.white_result === 'win') return '1-0'
  if (game.black_result === 'win') return '0-1'
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
