import React, { useMemo } from 'react'
import { movePairsFromHistory } from '../../utils/chessHelpers'
import './MoveList.css'

function MoveList({ moveHistory, currentMoveIndex, onMoveClick }) {
  const pairs = useMemo(() => movePairsFromHistory(moveHistory), [moveHistory])

  return (
    <div className="moves-table-container">
      <table className="moves-table">
        <thead>
          <tr>
            <th className="move-num-col">#</th>
            <th className="white-col">White</th>
            <th className="black-col">Black</th>
          </tr>
        </thead>
        <tbody>
          {pairs.map((pair) => (
            <tr key={pair.moveNumber}>
              <td className="move-num">{pair.moveNumber}.</td>
              <td
                className={`move-cell white-move ${currentMoveIndex === pair.whiteIndex ? 'active' : ''}`}
                onClick={() => onMoveClick(pair.whiteIndex)}
              >
                {pair.white?.san || ''}
              </td>
              <td
                className={`move-cell black-move ${currentMoveIndex === pair.blackIndex ? 'active' : ''} ${!pair.black ? 'empty' : ''}`}
                onClick={() => pair.black && onMoveClick(pair.blackIndex)}
              >
                {pair.black?.san || ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default MoveList
