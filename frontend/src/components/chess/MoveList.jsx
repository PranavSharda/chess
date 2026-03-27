import React, { useMemo, useEffect, useRef } from 'react'
import './MoveList.css'

function getMoveDisplay(node) {
  const fen = node.fen
  const parts = fen.split(' ')
  const turnAfter = parts[1]
  const fullmove = parseInt(parts[5], 10)
  const isWhiteMove = turnAfter === 'b'
  const moveNum = isWhiteMove ? fullmove : fullmove - 1
  return { isWhiteMove, moveNum }
}

function getLineNodes(startNode) {
  const nodes = []
  let node = startNode
  while (node) {
    nodes.push(node)
    node = node.children.length > 0 ? node.children[0] : null
  }
  return nodes
}

function VariationLine({ startNode, currentNode, onNodeClick, depth = 0 }) {
  const nodes = useMemo(() => getLineNodes(startNode), [startNode])

  if (nodes.length === 0) return null

  return (
    <span className={`variation-line depth-${Math.min(depth, 3)}`}>
      {'( '}
      {nodes.map((node, i) => {
        const { isWhiteMove, moveNum } = getMoveDisplay(node)
        const showNum = isWhiteMove || i === 0

        return (
          <React.Fragment key={node.id}>
            {showNum && (
              <span className="var-move-num">
                {isWhiteMove ? `${moveNum}.` : `${moveNum}...`}
              </span>
            )}
            <span
              className={`var-move ${currentNode === node ? 'var-active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                onNodeClick(node)
              }}
            >
              {node.move.san}
            </span>{' '}
            {depth < 2 &&
              node.children.length > 1 &&
              node.children.slice(1).map((subVar) => (
                <VariationLine
                  key={subVar.id}
                  startNode={subVar}
                  currentNode={currentNode}
                  onNodeClick={onNodeClick}
                  depth={depth + 1}
                />
              ))}
          </React.Fragment>
        )
      })}
      {')'}
    </span>
  )
}

function MoveList({ root, currentNode, onNodeClick, treeVersion, moveHistory, currentMoveIndex, onMoveClick }) {
  const containerRef = useRef(null)

  // Support both tree-based and legacy props
  const useTree = !!(root && onNodeClick)

  const mainLine = useMemo(() => {
    if (!useTree) return []
    const r = root.current || root
    const nodes = []
    let node = r
    while (node.children.length > 0) {
      node = node.children[0]
      nodes.push(node)
    }
    return nodes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useTree, root, treeVersion])

  const pairs = useMemo(() => {
    if (useTree) {
      const p = []
      for (let i = 0; i < mainLine.length; i += 2) {
        p.push({
          moveNumber: Math.floor(i / 2) + 1,
          white: mainLine[i],
          whiteIndex: i,
          black: mainLine[i + 1] || null,
          blackIndex: i + 1,
        })
      }
      return p
    }
    // Legacy fallback
    const p = []
    for (let i = 0; i < (moveHistory || []).length; i += 2) {
      p.push({
        moveNumber: Math.floor(i / 2) + 1,
        white: moveHistory[i],
        whiteIndex: i,
        black: moveHistory[i + 1] || null,
        blackIndex: i + 1,
      })
    }
    return p
  }, [useTree, mainLine, moveHistory])

  // Auto-scroll to active move
  useEffect(() => {
    if (!containerRef.current) return
    const active = containerRef.current.querySelector('.active, .var-active')
    if (active) {
      active.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [currentNode, currentMoveIndex])

  if (useTree) {
    return (
      <div className="moves-table-container" ref={containerRef}>
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
              <React.Fragment key={pair.moveNumber}>
                <tr>
                  <td className="move-num">{pair.moveNumber}.</td>
                  <td
                    className={`move-cell white-move ${currentNode === pair.white ? 'active' : ''}`}
                    onClick={() => onNodeClick(pair.white)}
                  >
                    {pair.white?.move?.san || ''}
                    {pair.white?.children?.length > 1 && (
                      <span className="variation-badge" title="Has variations">
                        +{pair.white.children.length - 1}
                      </span>
                    )}
                  </td>
                  <td
                    className={`move-cell black-move ${pair.black ? (currentNode === pair.black ? 'active' : '') : 'empty'}`}
                    onClick={() => pair.black && onNodeClick(pair.black)}
                  >
                    {pair.black?.move?.san || ''}
                    {pair.black?.children?.length > 1 && (
                      <span className="variation-badge" title="Has variations">
                        +{pair.black.children.length - 1}
                      </span>
                    )}
                  </td>
                </tr>

                {/* Variations branching from white's move (alternative responses) */}
                {pair.white?.parent?.children?.length > 1 &&
                  pair.white.parent.children[0] === pair.white && (
                    <tr className="variation-row">
                      <td colSpan="3" className="variation-cell">
                        {pair.white.parent.children.slice(1).map((varNode) => (
                          <VariationLine
                            key={varNode.id}
                            startNode={varNode}
                            currentNode={currentNode}
                            onNodeClick={onNodeClick}
                          />
                        ))}
                      </td>
                    </tr>
                  )}

                {/* Variations branching from black's move (alternative responses) */}
                {pair.black?.parent?.children?.length > 1 &&
                  pair.black.parent.children[0] === pair.black && (
                    <tr className="variation-row">
                      <td colSpan="3" className="variation-cell">
                        {pair.black.parent.children.slice(1).map((varNode) => (
                          <VariationLine
                            key={varNode.id}
                            startNode={varNode}
                            currentNode={currentNode}
                            onNodeClick={onNodeClick}
                          />
                        ))}
                      </td>
                    </tr>
                  )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Legacy render path
  return (
    <div className="moves-table-container" ref={containerRef}>
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
