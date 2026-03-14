export const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown'
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatDateShort = (timestamp) => {
  if (!timestamp) return 'Unknown'
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export const formatTimeControl = (tc) => {
  if (!tc) return 'Unknown'
  const parts = tc.split('+')
  const base = parseInt(parts[0])
  if (base < 180) return 'Bullet'
  if (base < 600) return 'Blitz'
  if (base < 1800) return 'Rapid'
  return 'Classical'
}

export const formatEval = (evalData) => {
  if (!evalData) return '0.0'
  if (evalData.type === 'mate') {
    return evalData.value > 0
      ? `M${Math.abs(evalData.value)}`
      : `-M${Math.abs(evalData.value)}`
  }
  const score = evalData.value / 100
  return `${score >= 0 ? '+' : ''}${score.toFixed(1)}`
}

export const formatLineEval = (line) => {
  if (line?.Mate !== undefined && line?.Mate !== null) {
    return line.Mate > 0 ? `M${line.Mate}` : `-M${Math.abs(line.Mate)}`
  }
  if (line?.Centipawn !== undefined && line?.Centipawn !== null) {
    const score = line.Centipawn / 100
    return `${score >= 0 ? '+' : ''}${score.toFixed(2)}`
  }
  return '0.00'
}

export const getResultText = (game) => {
  if (game?.white?.result === 'win') return '1-0'
  if (game?.black?.result === 'win') return '0-1'
  return '\u00BD-\u00BD'
}

export const getLineEvalValue = (line) => {
  if (line?.Mate !== undefined && line?.Mate !== null) {
    return line.Mate > 0 ? 10 : -10
  }
  if (line?.Centipawn !== undefined && line?.Centipawn !== null) {
    return line.Centipawn / 100
  }
  return 0
}
