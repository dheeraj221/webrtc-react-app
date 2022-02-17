import React from 'react'
import { Link } from 'react-router-dom'
import { GameIcon, GamesContainer, GameTitle } from './Home.styles'

export const Home = () => {
  console.log(process.env)
  return (
    <div>
      <GamesContainer className="games-container">
        <Link to="/viewers">
          <GameIcon src="game-icon/sicbo-logo.png" alt="roulette_icon" />
          <GameTitle>Viewers</GameTitle>
        </Link>
        <Link to="/broadcast-stream">
          <GameIcon
            src="game-icon/dragon-tiger-logo.png"
            alt="roulette_icon"
          />
          <GameTitle>Broadcast Stream</GameTitle>
        </Link>
      </GamesContainer>
    </div>
  );
}
